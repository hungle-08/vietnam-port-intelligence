import 'server-only';
import {getDb} from '../db';
import type {TradeDataset,TradeRelease} from './types';
import {nextTradeRun} from './config';
export async function getTradeDataset():Promise<TradeDataset> {
 // Postgres DATE represents a calendar period, not an instant. Explicit text avoids driver local-time Date conversion.
 const sql=getDb();const rows=await sql`SELECT m.period::text AS period,m.exports_usd,m.imports_usd,m.updated_at,r.source_url FROM vietnam_trade_months m JOIN vietnam_trade_releases r ON r.id=m.release_id ORDER BY m.period`;
 return {months:rows.map(r=>({period:String(r.period).slice(0,7),exportsUsd:Number(r.exports_usd),importsUsd:Number(r.imports_usd)})),updatedAt:rows.length?new Date(Math.max(...rows.map(r=>new Date(r.updated_at).getTime()))).toISOString():null,sourceUrl:rows.length?rows.at(-1)!.source_url:null};
}
export type TradeLease={id:string;revision:number};
export async function saveTradeReleases(releases:TradeRelease[],lease?:TradeLease) {
 const sql=getDb();
 if(!releases.length)throw Error('Empty release collection');
 const queries=[];
 if(lease)queries.push(sql`SELECT 1/(CASE WHEN lease_token=${lease.id}::uuid AND lease_until>now() THEN 1 ELSE 0 END) AS owned FROM vietnam_trade_sync_config WHERE id='vietnam-merchandise-trade' FOR UPDATE`);
 for(const r of releases){
  if(!r.months.length||r.months.some((m,i)=>m.period!==`${r.year}-${String(i+1).padStart(2,'0')}`||!Number.isFinite(m.exportsUsd)||!Number.isFinite(m.importsUsd)||m.exportsUsd<0||m.importsUsd<0))throw Error('Invalid normalized trade release');
  // Do not silently accept a truncated annual source or replace a newer release with an older observation.
  queries.push(sql`SELECT 1/(CASE WHEN COALESCE(max(extract(month FROM period)),0)<=${r.months.length} THEN 1 ELSE 0 END) FROM vietnam_trade_months WHERE extract(year FROM period)=${r.year}`);
  queries.push(sql`INSERT INTO vietnam_trade_releases(id,source_year,source_url,exports_url,imports_url,retrieved_at) VALUES(${r.id},${r.year},${r.sourceUrl},${r.exportsUrl},${r.importsUrl},${r.retrievedAt}::timestamptz) ON CONFLICT(id) DO NOTHING`);
  queries.push(sql`INSERT INTO vietnam_trade_months(period,exports_usd,imports_usd,release_id) SELECT (p->>'period'||'-01')::date,(p->>'exportsUsd')::numeric,(p->>'importsUsd')::numeric,${r.id} FROM jsonb_array_elements(${JSON.stringify(r.months)}::jsonb) p ON CONFLICT(period) DO UPDATE SET exports_usd=excluded.exports_usd,imports_usd=excluded.imports_usd,release_id=excluded.release_id,updated_at=now() WHERE vietnam_trade_months.release_id<>excluded.release_id AND (SELECT retrieved_at FROM vietnam_trade_releases WHERE id=excluded.release_id)>=(SELECT retrieved_at FROM vietnam_trade_releases WHERE id=vietnam_trade_months.release_id)`);
 }
 if(lease)queries.push(sql`UPDATE vietnam_trade_sync_config SET next_run_at=CASE WHEN revision=${lease.revision} THEN ${nextTradeRun().toISOString()}::timestamptz ELSE next_run_at END,lease_token=NULL,lease_until=NULL,last_checked_at=now(),last_result='success',last_message='Đã kiểm tra Excel chính thức và cập nhật số liệu theo tháng.' WHERE id='vietnam-merchandise-trade' AND lease_token=${lease.id}::uuid`);
 await sql.transaction(queries);
}
