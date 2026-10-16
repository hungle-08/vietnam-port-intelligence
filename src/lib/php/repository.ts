import 'server-only';
import {getDb} from '../db';
import type {PlanSnapshot} from './types';
import {regionalPlanSnapshot} from './scope';
import {validateDay} from './config';
export async function getPhpTerminalDailyMetrics(from:string,to:string){
 validateDay(from);validateDay(to);if(from>to)throw Error('Invalid metrics range');
 const rows=await getDb()`SELECT plan_date::text AS day,terminal_id,sum(planned_arrivals)::integer AS calls,sum(known_dwt) AS dwt,sum(missing_dwt)::integer AS missing_dwt FROM issuer_daily_planned_dwt WHERE ticker='PHP' AND plan_date BETWEEN ${from}::date AND ${to}::date GROUP BY plan_date,terminal_id ORDER BY plan_date,terminal_id`;
 return rows.map(r=>({day:String(r.day),terminalId:String(r.terminal_id),calls:Number(r.calls),dwt:r.dwt===null?null:Number(r.dwt),missingDwt:Number(r.missing_dwt)}));
}
export async function savePhpDay(s:PlanSnapshot,ownerToken?:string){
 s=regionalPlanSnapshot(s);
 const sql=getDb();const id=`hp:${s.planDate}:${s.contentHash}`;
 const result=await sql`WITH owned AS (SELECT 1 WHERE ${ownerToken??null}::uuid IS NULL OR EXISTS(SELECT 1 FROM vessel_daily_jobs WHERE id='php-vessel-dwt' AND lease_token=${ownerToken??null}::uuid AND lease_until>now())), saved AS (
 INSERT INTO vessel_plan_snapshots(id,plan_date,fetched_at,last_seen_at,source_url,content_hash,raw_html,event_count,duplicate_count)
 SELECT ${id},${s.planDate}::date,${s.fetchedAt}::timestamptz,${s.fetchedAt}::timestamptz,${s.sourceUrl},${s.contentHash},${s.rawHtml},${s.events.length},${s.duplicateCount} FROM owned
 ON CONFLICT(id) DO UPDATE SET last_seen_at=greatest(vessel_plan_snapshots.last_seen_at,excluded.last_seen_at) RETURNING id
 ), events AS (
 INSERT INTO vessel_plan_events(snapshot_id,event_key,movement,vessel_name,planned_time,dwt,from_terminal,to_terminal,payload)
 SELECT saved.id,p->>'key',p->>'movement',p->>'vesselName',(p->>'plannedTime')::time,(p->>'dwt')::numeric,p->>'fromTerminal',p->>'toTerminal',p FROM saved CROSS JOIN jsonb_array_elements(${JSON.stringify(s.events)}::jsonb) p ON CONFLICT(snapshot_id,event_key) DO NOTHING RETURNING event_key
 ), pointer AS (
 INSERT INTO vessel_plan_days(source_id,plan_date,snapshot_id,observed_at) SELECT 'haiphong-maritime-authority',${s.planDate}::date,saved.id,${s.fetchedAt}::timestamptz FROM saved
 ON CONFLICT(source_id,plan_date) DO UPDATE SET snapshot_id=excluded.snapshot_id,observed_at=excluded.observed_at WHERE excluded.observed_at>=vessel_plan_days.observed_at RETURNING plan_date
 ), coverage AS (
 INSERT INTO vessel_plan_coverage(plan_date,last_attempt_at,status) SELECT ${s.planDate}::date,now(),${s.events.length?'complete':'empty'} FROM pointer ON CONFLICT(plan_date) DO UPDATE SET last_attempt_at=now(),status=excluded.status,message=NULL,attempts=vessel_plan_coverage.attempts+1 RETURNING plan_date
 ) SELECT id FROM saved`;
 if(!result.length)throw Error('Lost job ownership');
 return id;
}
export async function recordPhpFailure(day:string){const sql=getDb();await sql`INSERT INTO vessel_plan_coverage(plan_date,status,message) VALUES(${day}::date,'failed','Nguồn không trả về kế hoạch hợp lệ cho ngày yêu cầu.') ON CONFLICT(plan_date) DO UPDATE SET status='failed',last_attempt_at=now(),message=excluded.message,attempts=vessel_plan_coverage.attempts+1`;}
export async function getPhpDataSummary(){
 const sql=getDb();const [coverage]=await sql`SELECT (SELECT count(*)::integer FROM vessel_plan_days) AS complete,(SELECT count(*)::integer FROM vessel_plan_coverage WHERE status='failed') AS failed,min(plan_date)::text AS first_day,max(plan_date)::text AS last_day FROM vessel_plan_days`;
 const [totals]=await sql`SELECT coalesce(sum(planned_arrivals),0)::integer AS arrivals,sum(known_dwt) AS dwt,coalesce(sum(missing_dwt),0)::integer AS missing_dwt FROM issuer_daily_planned_dwt WHERE ticker='PHP'`;
 const sites=await sql`SELECT t.id,t.name,m.scope,m.ownership_percent,t.operator_name FROM issuer_terminal_sites t JOIN issuer_terminal_memberships m ON t.id=m.terminal_id WHERE m.ticker='PHP' ORDER BY m.scope,t.name`;
 return {coverage:{complete:coverage.complete as number,failed:coverage.failed as number,firstDay:coverage.first_day?String(coverage.first_day).slice(0,10):null,lastDay:coverage.last_day?String(coverage.last_day).slice(0,10):null},totals:{arrivals:totals.arrivals as number,dwt:totals.dwt===null?null:Number(totals.dwt),missingDwt:totals.missing_dwt as number},sites:sites.map(s=>({id:s.id as string,name:s.name as string,scope:s.scope as string,ownershipPercent:Number(s.ownership_percent),operator:s.operator_name as string}))};
}
export async function getPhpDailyMetrics(from:string,to:string,scope:'direct'|'system'='direct'){
 validateDay(from);validateDay(to);if(from>to||!['direct','system'].includes(scope))throw Error('Invalid metrics range');
 const sql=getDb();const rows=await sql`WITH dates AS (SELECT generate_series(${from}::date,${to}::date,interval '1 day')::date AS day), totals AS (
 SELECT plan_date,sum(planned_arrivals)::integer AS calls,sum(known_dwt) AS dwt,sum(missing_dwt)::integer AS missing FROM issuer_daily_planned_dwt WHERE ticker='PHP' AND (${scope}='system' OR scope='direct') GROUP BY plan_date)
 SELECT dates.day::text AS day,d.snapshot_id IS NOT NULL AS available,CASE WHEN d.snapshot_id IS NOT NULL THEN coalesce(t.calls,0) END AS calls,
 CASE WHEN d.snapshot_id IS NOT NULL THEN CASE WHEN t.calls IS NULL THEN 0 ELSE t.dwt END END AS dwt,
 CASE WHEN d.snapshot_id IS NOT NULL THEN coalesce(t.missing,0) END AS missing_dwt
 FROM dates LEFT JOIN vessel_plan_days d ON d.plan_date=dates.day AND d.source_id='haiphong-maritime-authority' LEFT JOIN totals t ON t.plan_date=dates.day ORDER BY dates.day`;
 return rows.map(r=>({day:r.day as string,available:r.available as boolean,calls:r.calls===null?null:Number(r.calls),dwt:r.dwt===null?null:Number(r.dwt),missingDwt:r.missing_dwt===null?null:Number(r.missing_dwt)}));
}
export async function getPhpReportMetadata(year:number,asOf:string){
 validateDay(asOf);if(!Number.isInteger(year)||year<1900||year>2100)throw Error('Invalid report year');
 const sql=getDb();
 const [sites,dates]=await Promise.all([
  sql`SELECT t.id,t.name,t.operator_name,m.scope,m.ownership_percent,m.source_url,m.evidence_as_of::text FROM issuer_terminal_sites t JOIN issuer_terminal_memberships m ON t.id=m.terminal_id WHERE m.ticker='PHP' AND m.valid_from<=${asOf}::date AND (m.valid_to IS NULL OR m.valid_to>=${asOf}::date) ORDER BY m.scope,t.name`,
  sql`SELECT max(plan_date)::text AS last_day,max(observed_at) AS updated_at FROM vessel_plan_days WHERE source_id='haiphong-maritime-authority' AND plan_date>=${year+'-01-01'}::date AND plan_date<=${year+'-12-31'}::date AND plan_date<=${asOf}::date`
 ]);
 return {sites:sites.map(s=>({id:String(s.id),name:String(s.name),operator:String(s.operator_name),scope:String(s.scope),ownershipPercent:Number(s.ownership_percent),sourceUrl:String(s.source_url),evidenceAsOf:String(s.evidence_as_of)})),lastDay:dates[0].last_day?String(dates[0].last_day):null,updatedAt:dates[0].updated_at?new Date(dates[0].updated_at).toISOString():null};
}
