import 'server-only';
import {randomUUID} from 'node:crypto';
import {getDb} from '../db';
import {vietnamDay} from '../php/config';
import {fetchCdnList,fetchCdnDetail} from './collect';
import type {VesselCandidate} from './dwt';
import {searchWikidata} from './wikidata';
import {enqueueCdn,pendingCdn,saveCdnDetail,failCdnDetail,skipCdnDetail} from './repository';
export async function processCdnQueue(limit:number,deadline=Date.now()+45000){let saved=0,failed=0;const links=await pendingCdn(limit);for(let i=0;i<links.length && Date.now()<deadline;i+=8){await Promise.all(links.slice(i,i+8).map(async link=>{try{const detail=await fetchCdnDetail(link);if(detail.atb.slice(0,10)<'2026-01-01'){await skipCdnDetail(link.id);return}await saveCdnDetail(detail);saved++}catch{await failCdnDetail(link.id);failed++}}))}return {saved,failed};}
export async function runCdnDaily(){const sql=getDb(),token=randomUUID();const [job]=await sql`UPDATE cdn_sync_config SET lease_token=${token}::uuid,lease_until=now()+interval '5 minutes',last_run_at=now(),last_status='running' WHERE id='cdn-arrivals' AND enabled AND (lease_until IS NULL OR lease_until<now()) RETURNING id`;if(!job)return {status:'skipped'};
 let result={saved:0,failed:0};const deadline=Date.now()+45000;try{const today=vietnamDay(),d=new Date(`${today.slice(0,7)}-01T00:00:00Z`),months=[today.slice(0,7)];d.setUTCMonth(d.getUTCMonth()-1);months.push(d.toISOString().slice(0,7));const batches=await Promise.all([fetchCdnList(),...months.map(m=>fetchCdnList(m))]);for(let i=0;i<batches.length;i++)await enqueueCdn(batches[i],true);result=await processCdnQueue(25,deadline-13000);let dwtFailed=false;if(Date.now()<deadline-12000){try{await lookupCdnDwt(1)}catch{dwtFailed=true}}const status=result.failed||dwtFailed?'partial':'success';await sql`UPDATE cdn_sync_config SET last_status=${status},last_message=${`Đã lưu ${result.saved} lượt; ${result.failed} lượt cần thử lại.${dwtFailed?' Tra cứu DWT tạm lỗi, sẽ thử lại.':''}`},lease_token=NULL,lease_until=NULL WHERE id='cdn-arrivals' AND lease_token=${token}::uuid`;return {status,...result};}catch{await sql`UPDATE cdn_sync_config SET last_status='failed',last_message='Không thể đồng bộ nguồn; dữ liệu đã lưu được giữ nguyên.',lease_token=NULL,lease_until=NULL WHERE id='cdn-arrivals' AND lease_token=${token}::uuid`;return {status:'failed',...result};}}

export async function lookupCdnDwt(limit:number){
 const sql=getDb();
 const rows=await sql`SELECT DISTINCT a.vessel_name FROM cdn_arrivals a LEFT JOIN cdn_dwt_lookups l ON l.vessel_name=a.vessel_name WHERE a.terminal='tien-sa' AND a.vessel_id IS NULL AND (l.wikidata_checked_at IS NULL OR l.wikidata_checked_at < now()-interval '90 days') ORDER BY a.vessel_name LIMIT ${limit}`;
 let checked=0;
 for(const row of rows){
  const name=String(row.vessel_name);
  const [match]=await sql`SELECT count(DISTINCT dwt)::int AS variants,min(dwt) AS dwt FROM vessel_plan_events WHERE dwt IS NOT NULL AND upper(regexp_replace(trim(vessel_name),'\\s+',' ','g'))=upper(regexp_replace(trim(${name}),'\\s+',' ','g'))`;
  const reference:VesselCandidate[]=Number(match?.variants)===1?[{name,imo:null,dwt:Number(match.dwt),match:'haiphong',sourceUrl:'https://cangvuhaiphong.gov.vn/ke-hoach-tau/'}]:[];
  const wiki=await searchWikidata(name);
  await sql`INSERT INTO cdn_dwt_lookups(vessel_name,candidates,source_url,wikidata_checked_at) VALUES(${name},${JSON.stringify([...wiki,...reference])}::jsonb,'https://www.wikidata.org/',now()) ON CONFLICT(vessel_name) DO UPDATE SET candidates=excluded.candidates,source_url=excluded.source_url,checked_at=now(),wikidata_checked_at=now()`;
  checked++; await new Promise(resolve=>setTimeout(resolve,250));
 }
 return {checked};
}
