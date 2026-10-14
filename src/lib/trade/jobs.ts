import 'server-only';
import {randomUUID} from 'node:crypto';
import {getDb} from '../db';
import {collectTrade} from './collect';
import {saveTradeReleases} from './repository';
import {validateTradeConfig,nextTradeRun,type TradeConfigInput} from './config';
export type TradeJobConfig=TradeConfigInput&{intervalMonths:number;dayOfMonth:number;revision:number;nextRunAt:string;updatedAt:string;lastCheckedAt:string|null;lastResult:string|null;lastMessage:string|null};
export async function getTradeJob():Promise<TradeJobConfig> {
 const [r]=await getDb()`SELECT * FROM vietnam_trade_sync_config WHERE id='vietnam-merchandise-trade'`;if(!r)throw Error('Missing trade config');
 return {enabled:r.enabled,intervalMonths:r.interval_months,dayOfMonth:r.day_of_month,sourceUrl:r.source_url,revision:r.revision,nextRunAt:new Date(r.next_run_at).toISOString(),updatedAt:new Date(r.updated_at).toISOString(),lastCheckedAt:r.last_checked_at?new Date(r.last_checked_at).toISOString():null,lastResult:r.last_result,lastMessage:r.last_message};
}
export async function saveTradeConfig(c:TradeConfigInput,userId:string,revision:number) {
 validateTradeConfig(c);const sql=getDb();
 const rows=await sql`UPDATE vietnam_trade_sync_config SET enabled=${c.enabled},source_url=${c.sourceUrl},next_run_at=CASE WHEN enabled=${c.enabled} THEN next_run_at ELSE ${nextTradeRun().toISOString()}::timestamptz END,revision=revision+1,updated_at=now(),updated_by=${userId}::uuid WHERE id='vietnam-merchandise-trade' AND revision=${revision} RETURNING id`;
 if(!rows.length)throw Error('Configuration changed in another session');
}
export async function runTradeCron() {
 const sql=getDb(),id=randomUUID();
 const [c]=await sql`UPDATE vietnam_trade_sync_config SET lease_token=${id}::uuid,lease_until=now()+interval '5 minutes' WHERE id='vietnam-merchandise-trade' AND enabled AND next_run_at<=now() AND (lease_until IS NULL OR lease_until<now()) RETURNING *`;
 if(!c)return {status:'skipped' as const};
 try{
  const year=new Date(Date.now()+7*3600000).getUTCFullYear();
  // January: current-year source is normally unpublished. Refresh the previous year until its first month closes.
  const years=new Date(Date.now()+7*3600000).getUTCMonth()===0?[year-1]:[year-1,year];
  const releases=await collectTrade(years,c.source_url);
  await saveTradeReleases(releases,{id,revision:c.revision});
  return {status:'success' as const,latestMonth:releases.flatMap(r=>r.months).at(-1)!.period};
 }catch{
  await sql`UPDATE vietnam_trade_sync_config SET next_run_at=CASE WHEN revision=${c.revision} THEN ${nextTradeRun().toISOString()}::timestamptz ELSE next_run_at END,lease_token=NULL,lease_until=NULL,last_checked_at=now(),last_result='failed',last_message='Chưa lấy được cặp Excel hợp lệ. Giữ nguyên dữ liệu tốt và kiểm tra lại vào lịch tháng tiếp theo.' WHERE id='vietnam-merchandise-trade' AND lease_token=${id}::uuid`;
  return {status:'failed' as const};
 }
}
