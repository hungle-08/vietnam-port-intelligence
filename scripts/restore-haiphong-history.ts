import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {db} from './db-runtime';
type Row=Record<string,unknown>;
type Backup={format:string;sourceId:string;snapshots:Row[];events:Row[];days:Row[];metrics:Row[];coverage:Row[]};
const SOURCE='haiphong-maritime-authority';
const originalPath='.backups/php-scope-2026-10-13T17-13-38.709Z-production.json';
const originalHash='ebe669ca27a5eeaa619d5f35721c050bf735150f8ef581886dff4a548eaa4080';
const normalizeMetrics=(rows:Row[])=>JSON.stringify(rows.filter(r=>r.ticker==='PHP').map(r=>[r.scope,r.plan_date,r.terminal_id,Number(r.planned_arrivals),r.known_dwt===null?null:Number(r.known_dwt),Number(r.missing_dwt)]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));
let phase='backup';
async function main(){
 const bytes=readFileSync(originalPath);if(createHash('sha256').update(bytes).digest('hex')!==originalHash)throw Error('Original backup checksum mismatch');
 const original=JSON.parse(bytes.toString()) as Backup;
 if(original.format!=='php-scope-backup-v1'||original.sourceId!==SOURCE||original.days.length!==286||original.events.length!==24294)throw Error('Unexpected backup identity');
 const sql=db(true);
 const [headers,days,metrics,coverage,leases]=await sql.transaction([
  sql`SELECT id FROM vessel_plan_snapshots WHERE source_id=${SOURCE} ORDER BY id`,
  sql`SELECT *,plan_date::text AS plan_date,observed_at::text AS observed_at FROM vessel_plan_days WHERE source_id=${SOURCE} ORDER BY vessel_plan_days.plan_date`,
  sql`SELECT ticker,scope,plan_date::text,terminal_id,planned_arrivals,known_dwt::text,missing_dwt FROM issuer_daily_planned_dwt WHERE ticker='PHP' ORDER BY plan_date,terminal_id`,
  sql`SELECT *,plan_date::text AS plan_date FROM vessel_plan_coverage ORDER BY vessel_plan_coverage.plan_date`,
  sql`SELECT id FROM vessel_daily_jobs WHERE lease_until>now()`
 ]);
 if(leases.length)throw Error('Collector currently owns a lease, retry after it finishes');
 const snapshots:Row[]=[],events:Row[]=[];
 for(let i=0;i<headers.length;i+=5){
  const ids=headers.slice(i,i+5).map(r=>r.id);
  const [s,e]=await sql.transaction([
   sql`SELECT *,plan_date::text AS plan_date,fetched_at::text AS fetched_at,last_seen_at::text AS last_seen_at FROM vessel_plan_snapshots WHERE id IN (SELECT jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb)) ORDER BY id`,
   sql`SELECT * FROM vessel_plan_events WHERE snapshot_id IN (SELECT jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb)) ORDER BY snapshot_id,event_key`
  ]);snapshots.push(...s);events.push(...e);
 }
 mkdirSync('.backups',{recursive:true,mode:0o700});
 const backupPath=resolve('.backups',`haiphong-before-restore-${new Date().toISOString().replaceAll(':','-')}.json`);
 const content=JSON.stringify({format:'haiphong-before-restore-v1',createdAt:new Date().toISOString(),sourceId:SOURCE,snapshots,events,days,metrics,coverage});
 writeFileSync(backupPath,content,{mode:0o600,flag:'wx'});
 if(readFileSync(backupPath,'utf8')!==content)throw Error('Backup read-back failed');
 console.log(JSON.stringify({backup:backupPath,sha256:createHash('sha256').update(content).digest('hex'),days:days.length,events:events.length}));
 const oldDates=new Set(original.days.map(d=>String(d.plan_date)));
 if(normalizeMetrics(metrics.filter(r=>oldDates.has(String(r.plan_date))))!==normalizeMetrics(original.metrics))throw Error('PHP metrics changed since original backup; stop for reconciliation');
 if(!process.argv.includes('--apply')){console.log('Backup verified. Dry run: 286 regional days ready to restore; PHP metrics match original backup.');return;}
 phase='restore';
 const scoped=await sql`SELECT 1 FROM pg_constraint WHERE conname='php_event_storage_scope'`;
 if(scoped.length)throw Error('Run migration 0015 before restoring');
 const currentDays=new Map(days.map(d=>[String(d.plan_date),d]));
 const eventMap=new Map<string,Row[]>();for(const e of original.events){const id=String(e.snapshot_id),list=eventMap.get(id)??[];list.push(e);eventMap.set(id,list);}
 const snapshotMap=new Map(original.snapshots.map(s=>[String(s.id),s]));let restored=0;
 for(const day of original.days){
  const date=String(day.plan_date),s=snapshotMap.get(String(day.snapshot_id)),current=currentDays.get(date);
  if(!s||!current||s.plan_date!==date||s.source_id!==SOURCE||!String(s.raw_html).includes('TD_ShowShipPlan_Vao'))throw Error('Invalid restore snapshot');
  const entries=eventMap.get(String(s.id))??[];
  if(entries.length!==s.event_count)throw Error('Backup event count mismatch');
  await sql.transaction([
   sql`SELECT 1 / CASE WHEN EXISTS(SELECT 1 FROM vessel_plan_days WHERE source_id=${SOURCE} AND plan_date=${date}::date AND snapshot_id=${current.snapshot_id} AND observed_at=${current.observed_at}::timestamptz) THEN 1 ELSE 0 END AS unchanged`,
   sql`INSERT INTO vessel_plan_snapshots(id,source_id,plan_date,fetched_at,last_seen_at,source_url,content_hash,raw_html,event_count,duplicate_count) VALUES(${s.id},${SOURCE},${date}::date,${s.fetched_at}::timestamptz,${s.last_seen_at}::timestamptz,${s.source_url},${s.content_hash},${s.raw_html},${s.event_count},${s.duplicate_count}) ON CONFLICT(id) DO NOTHING`,
   sql`INSERT INTO vessel_plan_events(snapshot_id,event_key,movement,vessel_name,planned_time,dwt,from_terminal,to_terminal,status,call_match_status,payload) SELECT p->>'snapshot_id',p->>'event_key',p->>'movement',p->>'vessel_name',(p->>'planned_time')::time,(p->>'dwt')::numeric,p->>'from_terminal',p->>'to_terminal',p->>'status',p->>'call_match_status',p->'payload' FROM jsonb_array_elements(${JSON.stringify(entries)}::jsonb) p ON CONFLICT(snapshot_id,event_key) DO NOTHING`,
   sql`UPDATE vessel_plan_days SET snapshot_id=${s.id},observed_at=${day.observed_at}::timestamptz WHERE source_id=${SOURCE} AND plan_date=${date}::date`,
   sql`SELECT 1 / CASE WHEN (SELECT count(*) FROM vessel_plan_events WHERE snapshot_id=${s.id})=${entries.length} AND EXISTS(SELECT 1 FROM vessel_plan_snapshots WHERE id=${s.id} AND raw_html=${s.raw_html} AND content_hash=${s.content_hash}) THEN 1 ELSE 0 END AS verified`
  ]);
  restored++;if(restored%50===0)console.log(`Restored ${restored}/286 days`);
 }
 phase='verify';
 const after=await sql`SELECT ticker,scope,plan_date::text,terminal_id,planned_arrivals,known_dwt::text,missing_dwt FROM issuer_daily_planned_dwt WHERE ticker='PHP' ORDER BY plan_date,terminal_id`;
 if(normalizeMetrics(after)!==normalizeMetrics(metrics))throw Error('PHP metrics mismatch after restoration');
 console.log('Restored 286 regional days. All existing PHP per-day/per-port DWT and arrival counts are unchanged. Existing PHP-only revisions retained for audit.');
}
main().catch(error=>{console.error(JSON.stringify({phase,message:String(error?.message??'Restore failed').replace(/(?:postgres(?:ql)?|https?):\/\/\S+/g,'[redacted]').slice(0,220)}));process.exitCode=1;});
