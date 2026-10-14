import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {db} from './db-runtime';
import {scopePhpSnapshot} from '../src/lib/php/scope';
import {parsePhpPlan} from '../src/lib/php/parse';
import {savePhpDay,getPhpDailyMetrics,getPhpDataSummary} from '../src/lib/php/repository';
async function main(){
 if(process.env.DB_ENV_FILE!=='.env.neon-dev')throw Error('Use development branch');const sql=db();
 const html=readFileSync('data/sources/php-plan-2026-10-13.html','utf8');
 const [current]=await sql`SELECT observed_at FROM vessel_plan_days WHERE plan_date='2026-10-13'`;
 const now=Math.max(Date.now(),current?new Date(current.observed_at).getTime()+1:0);
 const original=parsePhpPlan(html,'2026-10-13',new Date(now).toISOString());
 const edited=parsePhpPlan(html.replace('17.361','18.000'),'2026-10-13',new Date(now+1).toISOString());
 try{
  await savePhpDay(original);await savePhpDay(edited);await savePhpDay(edited);
  const [latest]=await getPhpDailyMetrics('2026-10-13','2026-10-13','direct');
  if(latest.calls!==3||latest.dwt!==44954)throw Error('Revisions double-counted');
  await savePhpDay(original);const [afterOld]=await getPhpDailyMetrics('2026-10-13','2026-10-13','direct');if(afterOld.dwt!==44954)throw Error('Old response replaced newer data');
  const extra={...original.events[0],key:'outside-test',movement:'arrival' as const,fromTerminal:null,toTerminal:null,vesselName:'OUTSIDE VESSEL'};
  const safeId=await savePhpDay({...original,rawHtml:'OUTSIDE RAW PAGE',events:[...original.events,extra]});
  const [stored]=await sql`SELECT event_count,raw_html FROM vessel_plan_snapshots WHERE id=${safeId}`;
  if(stored.event_count!==8||stored.raw_html.includes('OUTSIDE'))throw Error('Persistence boundary failed');
  let rejected=false;
  try{await sql`INSERT INTO vessel_plan_events(snapshot_id,event_key,movement,vessel_name,payload) VALUES(${safeId},'outside-test','arrival','OUTSIDE VESSEL',${JSON.stringify(extra)}::jsonb)`;}catch(error){const detail=error as {code?:string;constraint?:string};rejected=detail.code==='23514'&&detail.constraint==='php_event_storage_scope';}
  if(!rejected)throw Error('Database scope constraint missing');
  rejected=false;try{await savePhpDay(original,randomUUID());}catch{rejected=true;}if(!rejected)throw Error('Expired ownership accepted');
  const broken={...original,contentHash:randomUUID(),events:original.events.map((e,i)=>i?e:{...e,toTerminal:'unknown-terminal'})};
  rejected=false;try{await savePhpDay(broken);}catch{rejected=true;}if(!rejected)throw Error('Invalid FK accepted');
  const [orphan]=await sql`SELECT count(*)::integer AS n FROM vessel_plan_snapshots WHERE content_hash=${scopePhpSnapshot(broken).contentHash}`;if(orphan.n!==0)throw Error('Atomic insert failed');
  const [missing]=await getPhpDailyMetrics('2026-01-02','2026-01-02');if(missing.available||missing.calls!==null||missing.dwt!==null)throw Error('Missing day fabricated as zero');
  console.log('Verified development DB: immutable revisions, latest-only DWT, idempotence, stale response guard, ownership guard, atomic failure, missing day remains null.');
 }finally{await savePhpDay(parsePhpPlan(html,'2026-10-13',new Date(Math.max(Date.now(),now+2)).toISOString()));}
 const summary=await getPhpDataSummary();console.log(`Verified directory: ${summary.sites.length} PHP terminal sites.`);
}
main().catch(()=>{console.error('PHP data integration check failed; credentials omitted.');process.exitCode=1;});
