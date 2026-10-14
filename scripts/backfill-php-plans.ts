import {db} from './db-runtime';
import {collectPhpDay} from '../src/lib/php/collect';
import {savePhpDay,recordPhpFailure} from '../src/lib/php/repository';
import {addDays,vietnamDay,validateDay,PHP_SOURCE} from '../src/lib/php/config';
const option=(name:string,fallback:string)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1]??'';};
async function main(){
 const sql=db();const start=validateDay(option('--from','2026-01-01')),end=validateDay(option('--to',vietnamDay()));
 if(start<'2026-01-01'||end>vietnamDay()||start>end)throw Error('Invalid backfill range');
 const id=`php:${start}:${end}`;const retry=process.argv.includes('--retry-failed'),refresh=process.argv.includes('--refresh');
 await sql`INSERT INTO vessel_backfill_checkpoints(id,start_date,end_date) VALUES(${id},${start}::date,${end}::date) ON CONFLICT(id) DO NOTHING`;
 const rows=await sql`SELECT plan_date::text,status FROM vessel_plan_coverage WHERE plan_date BETWEEN ${start}::date AND ${end}::date`;
 const status=new Map(rows.map(r=>[r.plan_date as string,r.status as string]));let saved=0,failed=0,skipped=0;
 for(let day=start;day<=end;day=addDays(day,1)){
  if(!refresh&&(retry?status.get(day)!=='failed':['complete','empty'].includes(status.get(day)??''))){skipped++;continue;}
  let ok=false;
  for(let attempt=0;attempt<2&&!ok;attempt++){try{const snapshot=await collectPhpDay(day,PHP_SOURCE);await savePhpDay(snapshot);saved++;ok=true;console.log(`${day}: stored ${snapshot.events.length} planned events`);}catch{if(attempt===0)await new Promise(r=>setTimeout(r,1000));}}
  if(!ok){await recordPhpFailure(day);failed++;console.log(`${day}: unavailable; recorded for retry`);}
  await sql`UPDATE vessel_backfill_checkpoints SET last_processed_date=${day}::date,updated_at=now() WHERE id=${id}`;
  await new Promise(r=>setTimeout(r,300));
 }
 console.log(JSON.stringify({from:start,to:end,saved,failed,skipped}));if(failed)process.exitCode=1;
}
main().catch(()=>{console.error('PHP backfill failed. Credentials omitted; resume by running the same command.');process.exitCode=1;});
