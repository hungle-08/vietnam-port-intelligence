import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {db} from './db-runtime';
import {parsePhpPlan} from '../src/lib/php/parse';
import {scopePhpSnapshot,isPhpPortMovement} from '../src/lib/php/scope';
import type {PlanSnapshot,PlannedEvent} from '../src/lib/php/types';
const SOURCE='haiphong-maritime-authority';
let phase='capture';
async function main(){
 const sql=db(true);
 const captured=await sql.transaction([
  sql.query('LOCK TABLE vessel_plan_snapshots,vessel_plan_events,vessel_plan_days IN SHARE MODE'),
  sql`SELECT id FROM vessel_plan_snapshots WHERE source_id=${SOURCE} ORDER BY id`,
  sql`SELECT 1 WHERE false`,
  sql`SELECT *,plan_date::text AS plan_date,observed_at::text AS observed_at FROM vessel_plan_days WHERE source_id=${SOURCE} ORDER BY vessel_plan_days.plan_date`,
  sql`SELECT md5(string_agg(id||last_seen_at::text,',' ORDER BY id)) AS snapshots FROM vessel_plan_snapshots WHERE source_id=${SOURCE}`,
  sql`SELECT md5(string_agg(plan_date::text||snapshot_id||observed_at::text,',' ORDER BY plan_date)) AS days FROM vessel_plan_days WHERE source_id=${SOURCE}`,
  sql`SELECT ticker,scope,plan_date::text,terminal_id,planned_arrivals,known_dwt::text,missing_dwt FROM issuer_daily_planned_dwt ORDER BY ticker,scope,plan_date,terminal_id`,
  sql`SELECT *,plan_date::text AS plan_date FROM vessel_plan_coverage ORDER BY vessel_plan_coverage.plan_date`
 ]);
 const [,headers,,days,snapshotSignature,daySignature,metrics,coverage]=captured;
 const snapshots:typeof headers=[],events:typeof headers=[];
 // The regional HTML archive exceeds Neon's 64 MB response limit; read bounded batches.
 for(let offset=0;offset<headers.length;offset+=5){
  phase=`capture batch ${offset}`;
  const ids=headers.slice(offset,offset+5).map(r=>r.id);
  const [batchSnapshots,batchEvents]=await sql.transaction([
   sql`SELECT *,fetched_at::text AS fetched_at,last_seen_at::text AS last_seen_at,plan_date::text AS plan_date FROM vessel_plan_snapshots WHERE source_id=${SOURCE} AND id IN (SELECT jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb)) ORDER BY id`,
   sql`SELECT * FROM vessel_plan_events WHERE snapshot_id IN (SELECT jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb)) ORDER BY snapshot_id,event_key`
  ]);
  snapshots.push(...batchSnapshots);events.push(...batchEvents);
 }
 if(snapshots.length!==headers.length)throw Error('History changed during capture');
 const grouped=new Map<string,PlannedEvent[]>();
 for(const r of events){const list=grouped.get(r.snapshot_id)??[];list.push(r.payload as PlannedEvent);grouped.set(r.snapshot_id,list);}
 const replacements=new Map<string,string>(),newSnapshots=new Map<string,PlanSnapshot&{id:string;lastSeenAt:string}>();
 for(const row of snapshots){
  phase=`parse ${row.plan_date}`;
  const original:PlanSnapshot={planDate:row.plan_date,fetchedAt:row.fetched_at,sourceUrl:row.source_url,rawHtml:row.raw_html,contentHash:row.content_hash,duplicateCount:row.duplicate_count,events:grouped.get(row.id)??[]};
  const scoped=row.raw_html.includes('TD_ShowShipPlan_Vao')?parsePhpPlan(row.raw_html,row.plan_date,row.fetched_at,row.source_url):scopePhpSnapshot(original);
  if(!scoped.events.every(isPhpPortMovement))throw Error('Unsafe scoped snapshot');
  const id=`hp:${scoped.planDate}:${scoped.contentHash}`,existing=newSnapshots.get(id);
  if(existing){existing.fetchedAt=Date.parse(existing.fetchedAt)<Date.parse(scoped.fetchedAt)?existing.fetchedAt:scoped.fetchedAt;existing.lastSeenAt=Date.parse(existing.lastSeenAt)>Date.parse(row.last_seen_at)?existing.lastSeenAt:row.last_seen_at;}
  else newSnapshots.set(id,{...scoped,id,lastSeenAt:row.last_seen_at});
  replacements.set(row.id,id);
 }
 const rows=[...newSnapshots.values()],newEvents=rows.flatMap(s=>s.events.map(e=>({snapshotId:s.id,...e})));
 const pointers=days.map(d=>({day:d.plan_date,id:replacements.get(d.snapshot_id)}));if(pointers.some(p=>!p.id))throw Error('Missing pointer replacement');
 const activeIds=new Set(days.map(d=>d.snapshot_id)),activeBefore=events.filter(e=>activeIds.has(e.snapshot_id)).length;
 const activeAfter=days.reduce((sum,d)=>sum+(newSnapshots.get(replacements.get(d.snapshot_id)!)?.events.length??0),0);
 const preview={days:days.length,oldSnapshots:snapshots.length,newSnapshots:rows.length,activeBefore,activeAfter,removedActive:activeBefore-activeAfter};console.log(JSON.stringify(preview));
 if(!process.argv.includes('--apply')){console.log('Dry run only. --apply requires explicit approval to replace historical storage.');return;}
 mkdirSync('.backups',{recursive:true,mode:0o700});
 const backup=JSON.stringify({format:'php-scope-backup-v1',createdAt:new Date().toISOString(),sourceId:SOURCE,snapshots,events,days,coverage,metrics});
 const backupPath=resolve('.backups',`php-scope-${new Date().toISOString().replaceAll(':','-')}-${process.env.DB_ENV_FILE?'development':'production'}.json`);
 writeFileSync(backupPath,backup,{mode:0o600,flag:'wx'});console.log(JSON.stringify({backup:backupPath,sha256:createHash('sha256').update(backup).digest('hex')}));
 const ids=rows.map(s=>s.id);
 phase='apply';
 await sql.transaction([
  sql.query('LOCK TABLE vessel_plan_snapshots,vessel_plan_events,vessel_plan_days IN EXCLUSIVE MODE'),
  sql`SELECT 1 / CASE WHEN (SELECT md5(string_agg(id||last_seen_at::text,',' ORDER BY id)) FROM vessel_plan_snapshots WHERE source_id=${SOURCE}) IS NOT DISTINCT FROM ${snapshotSignature[0].snapshots} AND (SELECT md5(string_agg(plan_date::text||snapshot_id||observed_at::text,',' ORDER BY plan_date)) FROM vessel_plan_days WHERE source_id=${SOURCE}) IS NOT DISTINCT FROM ${daySignature[0].days} THEN 1 ELSE 0 END AS unchanged`,
  sql`INSERT INTO vessel_plan_snapshots(id,source_id,plan_date,fetched_at,last_seen_at,source_url,content_hash,raw_html,event_count,duplicate_count) SELECT p->>'id',${SOURCE},(p->>'planDate')::date,(p->>'fetchedAt')::timestamptz,(p->>'lastSeenAt')::timestamptz,p->>'sourceUrl',p->>'contentHash',p->>'rawHtml',jsonb_array_length(p->'events'),(p->>'duplicateCount')::integer FROM jsonb_array_elements(${JSON.stringify(rows)}::jsonb) p ON CONFLICT(id) DO UPDATE SET last_seen_at=greatest(vessel_plan_snapshots.last_seen_at,excluded.last_seen_at)`,
  sql`INSERT INTO vessel_plan_events(snapshot_id,event_key,movement,vessel_name,planned_time,dwt,from_terminal,to_terminal,payload) SELECT p->>'snapshotId',p->>'key',p->>'movement',p->>'vesselName',(p->>'plannedTime')::time,(p->>'dwt')::numeric,p->>'fromTerminal',p->>'toTerminal',p-'snapshotId' FROM jsonb_array_elements(${JSON.stringify(newEvents)}::jsonb) p ON CONFLICT(snapshot_id,event_key) DO NOTHING`,
  sql`UPDATE vessel_plan_days d SET snapshot_id=p->>'id' FROM jsonb_array_elements(${JSON.stringify(pointers)}::jsonb) p WHERE d.source_id=${SOURCE} AND d.plan_date=(p->>'day')::date`,
  sql`DELETE FROM vessel_plan_events e USING vessel_plan_snapshots s WHERE s.id=e.snapshot_id AND s.source_id=${SOURCE} AND NOT(s.id IN (SELECT jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb)))`,
  sql`DELETE FROM vessel_plan_snapshots WHERE source_id=${SOURCE} AND NOT(id IN (SELECT jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb)))`,
  sql`SELECT 1 / CASE WHEN (SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM (SELECT ticker,scope,plan_date::text,terminal_id,planned_arrivals,known_dwt::text,missing_dwt FROM issuer_daily_planned_dwt ORDER BY ticker,scope,plan_date,terminal_id) t)=${JSON.stringify(metrics)}::jsonb AND (SELECT count(*) FROM vessel_plan_days WHERE source_id=${SOURCE})=${days.length} THEN 1 ELSE 0 END AS verified`
 ]);
 console.log('Applied PHP-only storage; all per-day PHP/DVP inbound metrics and day coverage unchanged.');
}
main().catch((error)=>{console.error(JSON.stringify({phase,code:error?.code??null,message:String(error?.message??'Cleanup failed').replace(/(?:postgres(?:ql)?|https?):\/\/\S+/g,'[redacted]').slice(0,300)}));console.error('PHP scope cleanup failed; transaction rolled back if verification failed. Credentials omitted.');process.exitCode=1;});
