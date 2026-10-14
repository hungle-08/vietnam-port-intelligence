import 'server-only';
import {randomUUID,createHash} from 'node:crypto';
import {getDb} from '../db';
import {SHIPPING_JOB,nextMonthlyRun,validateCronConfig,type CronConfigInput} from './config';
import {carriers} from '../shipping/carriers';
import {validateShippingSnapshot} from '../shipping/parse';
import type {ShippingSnapshot} from '../shipping/types';
export type JobConfig=CronConfigInput&{nextRunAt:string;updatedAt:string;revision:number};
export type JobRun={id:string;status:string;startedAt:string;finishedAt:string|null;sourceUrl:string;message:string|null};
export type ShippingJob={id:string;sourceUrl:string;revision:number;intervalMonths:number;dayOfMonth:number;scheduledFor:string};
const iso=(value:unknown)=>new Date(String(value)).toISOString();
export async function getShippingJobConfig():Promise<{config:JobConfig;runs:JobRun[]}> {
 const sql=getDb();const rows=await sql`SELECT * FROM admin_job_configs WHERE id=${SHIPPING_JOB}`;
 if(!rows.length)throw Error('Missing job configuration');const r=rows[0];
 const history=await sql`SELECT *,CASE WHEN status='running' AND started_at < now()-interval '5 minutes' THEN 'interrupted' ELSE status END AS display_status FROM admin_job_runs WHERE job_id=${SHIPPING_JOB} ORDER BY started_at DESC LIMIT 10`;
 return {config:{enabled:r.enabled,intervalMonths:r.interval_months,dayOfMonth:r.day_of_month,sourceUrl:r.source_url,nextRunAt:iso(r.next_run_at),updatedAt:iso(r.updated_at),revision:r.revision},runs:history.map(h=>({id:h.id,status:h.display_status,startedAt:iso(h.started_at),finishedAt:h.finished_at?iso(h.finished_at):null,sourceUrl:h.source_url,message:h.message}))};
}
export async function saveShippingJobConfig(input:CronConfigInput,userId:string,revision:number) {
 const c=validateCronConfig(input),sql=getDb();
 const next=nextMonthlyRun(new Date(),c.intervalMonths,c.dayOfMonth).toISOString();
 const rows=await sql`UPDATE admin_job_configs SET enabled=${c.enabled},interval_months=${c.intervalMonths},day_of_month=${c.dayOfMonth},source_url=${c.sourceUrl},next_run_at=CASE WHEN interval_months=${c.intervalMonths} AND day_of_month=${c.dayOfMonth} AND enabled=${c.enabled} THEN next_run_at ELSE ${next}::timestamptz END,revision=revision+CASE WHEN enabled=${c.enabled} AND interval_months=${c.intervalMonths} AND day_of_month=${c.dayOfMonth} AND source_url=${c.sourceUrl} THEN 0 ELSE 1 END,updated_at=now(),updated_by=${userId}::uuid WHERE id=${SHIPPING_JOB} AND revision=${revision} RETURNING id`;
 if(!rows.length)throw Error('Cấu hình đã thay đổi ở phiên khác. Tải lại trang để cập nhật.');
}
export async function claimShippingJob():Promise<ShippingJob|null> {
 const sql=getDb(),id=randomUUID();
 const result=await sql`WITH claim AS (
 UPDATE admin_job_configs SET lease_token=${id}::uuid,lease_until=now()+interval '5 minutes'
 WHERE id=${SHIPPING_JOB} AND enabled AND next_run_at<=now() AND (lease_until IS NULL OR lease_until<now()) RETURNING *
 ), run AS (
 INSERT INTO admin_job_runs(id,job_id,config_revision,source_url,scheduled_for,status) SELECT ${id}::uuid,id,revision,source_url,next_run_at,'running' FROM claim RETURNING id
 ) SELECT claim.*,run.id AS run_id FROM claim CROSS JOIN run`;
 if(!result.length)return null;const r=result[0];
 return {id:r.run_id,sourceUrl:r.source_url,revision:r.revision,intervalMonths:r.interval_months,dayOfMonth:r.day_of_month,scheduledFor:iso(r.next_run_at)};
}
export async function completeShippingJob(job:ShippingJob,raw:ShippingSnapshot) {
 const snapshot=validateShippingSnapshot(raw);const sql=getDb();
 const hash=createHash('sha256').update(JSON.stringify(snapshot.entries)).digest('hex');
 const id=`${snapshot.sourceId}:${snapshot.asOf}:${hash.slice(0,16)}`;
 let next=nextMonthlyRun(new Date(job.scheduledFor),job.intervalMonths,job.dayOfMonth);
 while(next<=new Date())next=nextMonthlyRun(next,job.intervalMonths,job.dayOfMonth);
 const result=await sql.transaction([
 sql`INSERT INTO shipping_carriers(id,name,short_name,website,logo_url,payload) SELECT p->>'id',p->>'name',p->>'shortName',p->>'website',p->>'logoUrl',p FROM jsonb_array_elements(${JSON.stringify(carriers)}::jsonb) p ON CONFLICT(id) DO NOTHING`,
 sql`WITH done AS (
 UPDATE admin_job_configs SET next_run_at=CASE WHEN revision=${job.revision} THEN ${next.toISOString()}::timestamptz ELSE next_run_at END,lease_token=NULL,lease_until=NULL WHERE id=${SHIPPING_JOB} AND lease_token=${job.id}::uuid AND lease_until>now() RETURNING id
 ), snapshot AS (
 INSERT INTO shipping_fleet_snapshots(id,source_id,as_of,retrieved_at,source_url,metric,scope,content_hash,metadata)
 SELECT ${id},'alphaliner',${snapshot.asOf}::date,${snapshot.retrievedAt}::timestamptz,${snapshot.sourceUrl},${snapshot.metric},${snapshot.scope},${hash},${JSON.stringify({...snapshot,entries:undefined})}::jsonb FROM done
 ON CONFLICT(id) DO UPDATE SET id=excluded.id RETURNING id
 ), ranks AS (
 INSERT INTO shipping_fleet_rankings(snapshot_id,carrier_id,rank,source_name,capacity_teu,ship_count,share_percent)
 SELECT snapshot.id,p->>'carrierId',(p->>'rank')::integer,p->>'sourceName',(p->>'capacityTeu')::bigint,(p->>'shipCount')::integer,(p->>'sharePercent')::numeric FROM snapshot CROSS JOIN jsonb_array_elements(${JSON.stringify(snapshot.entries)}::jsonb) p ON CONFLICT(snapshot_id,carrier_id) DO NOTHING RETURNING rank
 ) UPDATE admin_job_runs SET status='success',finished_at=now(),message='Đã lưu snapshot 10 hãng tàu.',snapshot_id=snapshot.id FROM snapshot WHERE admin_job_runs.id=${job.id}::uuid RETURNING admin_job_runs.id`
 ]);
 if(result[1].length!==1)throw Error('Job lease expired');
}
export async function failShippingJob(job:ShippingJob,message:string) {
 const sql=getDb();await sql.transaction([
 sql`UPDATE admin_job_runs SET status='failed',finished_at=now(),message=${message} WHERE id=${job.id}::uuid AND status='running'`,
 sql`UPDATE admin_job_configs SET lease_token=NULL,lease_until=NULL WHERE id=${SHIPPING_JOB} AND lease_token=${job.id}::uuid`
 ]);
}
