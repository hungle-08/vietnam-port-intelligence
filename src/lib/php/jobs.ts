import 'server-only';
import {randomUUID} from 'node:crypto';
import {getDb} from '../db';
import {validatePhpConfig,nextDailyRun,vietnamDay,addDays,type PhpConfigInput} from './config';
import {collectPhpDay} from './collect';
import {savePhpDay,recordPhpFailure} from './repository';
const JOB='php-vessel-dwt';
export type PhpJobConfig=PhpConfigInput&{revision:number;nextRunAt:string;updatedAt:string};
export async function getPhpJob(){const sql=getDb();const [c]=await sql`SELECT * FROM vessel_daily_jobs WHERE id=${JOB}`;if(!c)throw Error('Missing PHP job');const [latest]=await sql`SELECT started_at FROM vessel_daily_job_runs WHERE job_id=${JOB} ORDER BY started_at DESC LIMIT 1`;
 return {config:{enabled:c.enabled as boolean,intervalDays:c.interval_days as number,runHour:c.run_hour as number,sourceUrl:c.source_url as string,revision:c.revision as number,nextRunAt:new Date(c.next_run_at).toISOString(),updatedAt:new Date(c.updated_at).toISOString()},lastRunAt:latest?new Date(latest.started_at).toISOString():null};}
export async function savePhpConfig(input:PhpConfigInput,userId:string,revision:number){
 const c=validatePhpConfig(input),sql=getDb();
 const rows=await sql`UPDATE vessel_daily_jobs SET enabled=${c.enabled},interval_days=${c.intervalDays},source_url=${c.sourceUrl},next_run_at=CASE WHEN interval_days=${c.intervalDays} AND enabled=${c.enabled} THEN next_run_at ELSE ${nextDailyRun(new Date(),c.intervalDays)}::timestamptz END,revision=revision+CASE WHEN enabled=${c.enabled} AND interval_days=${c.intervalDays} AND source_url=${c.sourceUrl} THEN 0 ELSE 1 END,updated_at=now(),updated_by=${userId}::uuid WHERE id=${JOB} AND revision=${revision} RETURNING id`;
 if(!rows.length)throw Error('Config changed');
}
export async function runPhpDaily(){
 const sql=getDb(),id=randomUUID();
 const [job]=await sql`WITH claim AS (UPDATE vessel_daily_jobs SET lease_token=${id}::uuid,lease_until=now()+interval '5 minutes' WHERE id=${JOB} AND enabled AND next_run_at<=now() AND (lease_until IS NULL OR lease_until<now()) RETURNING *), run AS (INSERT INTO vessel_daily_job_runs(id,job_id,status) SELECT ${id}::uuid,id,'running' FROM claim RETURNING id) SELECT claim.* FROM claim CROSS JOIN run`;
 if(!job)return {status:'skipped' as const};
 let daysSaved=0;const today=vietnamDay();let failed=false;
 const deadline=AbortSignal.timeout(45000);
 try{
  // Today's plan plus three previous days; failed older dates remain visible for backfill retry.
  for(let offset=0;offset<=3;offset++){
   const day=addDays(today,-offset);if(day<'2026-01-01')continue;
   try{const s=await collectPhpDay(day,job.source_url,deadline);await savePhpDay(s,id);daysSaved++;}
   catch{await recordPhpFailure(day);failed=true;}
  }
  const [done]=await sql`WITH done AS (UPDATE vessel_daily_jobs SET next_run_at=CASE WHEN revision=${job.revision} AND ${!failed} THEN ${nextDailyRun(new Date(),job.interval_days)}::timestamptz ELSE next_run_at END,lease_token=NULL,lease_until=NULL WHERE id=${JOB} AND lease_token=${id}::uuid AND lease_until>now() RETURNING id) UPDATE vessel_daily_job_runs SET status=${failed?'failed':'success'},finished_at=now(),days_saved=${daysSaved},message=${failed?'Có ngày chưa lấy được; dữ liệu tốt trước đó được giữ nguyên. Sẽ thử lại ở lượt kiểm tra tiếp theo.':'Đã cập nhật kế hoạch ngày hiện tại và ba ngày gần nhất.'} FROM done WHERE vessel_daily_job_runs.id=${id}::uuid RETURNING vessel_daily_job_runs.id`;
  if(!done)throw Error('Lost lease');
  return {status:failed?'failed' as const:'success' as const,daysSaved};
 }catch{
  await sql.transaction([sql`UPDATE vessel_daily_job_runs SET status='failed',finished_at=now(),days_saved=${daysSaved},message='Đồng bộ bị gián đoạn. Dữ liệu tốt trước đó được giữ nguyên.' WHERE id=${id}::uuid AND status='running'`,sql`UPDATE vessel_daily_jobs SET lease_token=NULL,lease_until=NULL WHERE id=${JOB} AND lease_token=${id}::uuid`]);
  return {status:'failed' as const,daysSaved};
 }
}
