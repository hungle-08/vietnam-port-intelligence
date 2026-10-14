import {db} from './db-runtime';
import {getShippingJobConfig,claimShippingJob,failShippingJob,completeShippingJob,saveShippingJobConfig} from '../src/lib/cron/repository';
import {collectShipping} from '../src/lib/shipping/collect';
import {SHIPPING_JOB} from '../src/lib/cron/config';
import {readFileSync} from 'node:fs';
import {parseAlphalinerApi} from '../src/lib/shipping/collect';
let phase='connect';
async function main(){
 if(process.env.DB_ENV_FILE!=='.env.neon-dev')throw Error('Use the dedicated development branch for integration checks');
 const sql=db();const [original]=await sql`SELECT * FROM admin_job_configs WHERE id=${SHIPPING_JOB}`;
 if(!original||original.lease_token)throw Error('Configuration missing or already leased');
 try{
  phase='concurrent claims';
  await sql`UPDATE admin_job_configs SET enabled=true,next_run_at=now()-interval '1 day' WHERE id=${SHIPPING_JOB}`;
  const claims=await Promise.all([claimShippingJob(),claimShippingJob()]);const jobs=claims.filter(j=>j!==null);
  if(jobs.length!==1)throw Error('Concurrent claims must have exactly one winner');
  await failShippingJob(jobs[0],'Kiểm tra tích hợp trên nhánh development.');
  phase='failure retry';
  const [failed]=await sql`SELECT lease_token,next_run_at<now() AS due FROM admin_job_configs WHERE id=${SHIPPING_JOB}`;
  if(failed.lease_token!==null||!failed.due)throw Error('Failed job must release lease and stay due');
  const job=await claimShippingJob();if(!job)throw Error('Retry claim failed');
  phase='direct source fetch';
  const fixture=process.argv.includes('--fixture');
  const snapshot=fixture?parseAlphalinerApi(JSON.parse(readFileSync('data/sources/alphaliner-public-api-2026-10-13.json','utf8')),new Date(),job.sourceUrl):await collectShipping(job.sourceUrl);
  phase='atomic completion';
  const [admin]=await sql`SELECT id FROM auth_users WHERE role='admin' LIMIT 1`;
  const current=(await getShippingJobConfig()).config;
  await saveShippingJobConfig(current,admin.id,current.revision);
  await completeShippingJob(job,snapshot);
  const [unchanged]=await sql`SELECT next_run_at>now() AS future FROM admin_job_configs WHERE id=${SHIPPING_JOB}`;
  if(!unchanged.future)throw Error('Unchanged admin save must not prevent advancing the schedule');
  await sql`UPDATE admin_job_configs SET next_run_at=now()-interval '1 day' WHERE id=${SHIPPING_JOB}`;
  const editedJob=await claimShippingJob();if(!editedJob)throw Error('Could not claim for revision check');
  // Simulate an admin changing schedule while an existing job is collecting.
  await sql`UPDATE admin_job_configs SET revision=revision+1,next_run_at='2050-01-01T00:00:00Z'::timestamptz WHERE id=${SHIPPING_JOB}`;
  await completeShippingJob(editedJob,snapshot);
  const [done]=await sql`SELECT lease_token,next_run_at FROM admin_job_configs WHERE id=${SHIPPING_JOB}`;
  const [run]=await sql`SELECT status,snapshot_id FROM admin_job_runs WHERE id=${editedJob.id}::uuid`;
  const [count]=await sql`SELECT count(*)::integer AS n FROM shipping_fleet_rankings WHERE snapshot_id=${run.snapshot_id}`;
  if(run.status!=='success'||count.n!==10||done.lease_token!==null||new Date(done.next_run_at).getUTCFullYear()!==2050)throw Error('Atomic completion/revision guard failed');
  if(await claimShippingJob())throw Error('Future configuration must skip');
  await sql`UPDATE admin_job_configs SET next_run_at=now()-interval '1 day' WHERE id=${SHIPPING_JOB}`;
  const expiredJob=await claimShippingJob();if(!expiredJob)throw Error('Expired lease test claim failed');
  await sql`UPDATE admin_job_configs SET lease_until=now()-interval '1 minute' WHERE id=${SHIPPING_JOB}`;
  let rejected=false;try{await completeShippingJob(expiredJob,snapshot);}catch{rejected=true;}
  if(!rejected)throw Error('Lost lease must not report success');
  await failShippingJob(expiredJob,'Kiểm tra lease hết hạn trên nhánh development.');
  console.log(`Verified: one concurrent winner, failure retry, ${fixture?'recorded source fixture':'real Alphaliner extraction'}, atomic 10-row snapshot, unchanged-save advancement, schedule edit preserved, future schedule skipped, lost lease rejected.`);
 }finally{
  await sql`UPDATE admin_job_configs SET enabled=${original.enabled},interval_months=${original.interval_months},day_of_month=${original.day_of_month},source_url=${original.source_url},next_run_at=${original.next_run_at}::timestamptz,lease_token=NULL,lease_until=NULL,revision=revision+1 WHERE id=${SHIPPING_JOB}`;
 }
 const state=await getShippingJobConfig();console.log(`Development configuration restored; ${state.runs.length} history rows visible.`);
}
main().catch((e)=>{console.error(`Cron integration verification failed at ${phase}. Error code: ${e?.code??e?.cause?.code??'unavailable'}. Credentials and remote responses omitted.`);process.exitCode=1;});
