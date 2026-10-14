import {db} from './db-runtime';
import {runPhpDaily,savePhpConfig,getPhpJob} from '../src/lib/php/jobs';
async function main(){
 if(process.env.DB_ENV_FILE!=='.env.neon-dev')throw Error('Use development branch');
 const sql=db(),[original]=await sql`SELECT * FROM vessel_daily_jobs WHERE id='php-vessel-dwt'`;
 if(original.lease_token&&new Date(original.lease_until).getTime()>Date.now())throw Error('Active development job');
 try{
  await sql`UPDATE vessel_daily_jobs SET enabled=true,interval_days=1,next_run_at=now()-interval '1 minute',lease_token=NULL,lease_until=NULL WHERE id='php-vessel-dwt'`;
  const results=await Promise.all([runPhpDaily(),runPhpDaily()]);
  if(results.filter(r=>r.status==='success').length!==1||results.filter(r=>r.status==='skipped').length!==1)throw Error('Concurrent claim failed');
  if(results.find(r=>r.status==='success')?.daysSaved!==4)throw Error('Incomplete daily collection');
  if((await runPhpDaily()).status!=='skipped')throw Error('Future schedule not skipped');
  const [admin]=await sql`SELECT id FROM auth_users WHERE role='admin' LIMIT 1`;
  if(admin){const before=await getPhpJob();await savePhpConfig(before.config,admin.id,before.config.revision);const after=await getPhpJob();if(after.config.revision!==before.config.revision||after.config.nextRunAt!==before.config.nextRunAt)throw Error('Unchanged save changed schedule');}
  console.log('Verified real daily collection: four dates saved, one concurrent owner, duplicate invocation skipped, next schedule respected.');
 }finally{
  await sql`UPDATE vessel_daily_jobs SET enabled=${original.enabled},interval_days=${original.interval_days},run_hour=${original.run_hour},source_url=${original.source_url},next_run_at=${original.next_run_at},revision=${original.revision},updated_at=${original.updated_at},updated_by=${original.updated_by},lease_token=NULL,lease_until=NULL WHERE id='php-vessel-dwt'`;
 }
}
main().catch(()=>{console.error('PHP cron verification failed; credentials omitted.');process.exitCode=1;});
