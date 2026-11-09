'use server';
import {requireAdmin} from '../auth/admin';
import {getDb} from '../db';
import {revalidatePath} from 'next/cache';
export async function setCdnEnabled(data:FormData){await requireAdmin();const sql=getDb();await sql`UPDATE cdn_sync_config SET enabled=${data.get('enabled')==='true'},updated_at=now() WHERE id='cdn-arrivals'`;revalidatePath('/admin');}
export async function approveCdnMatch(data:FormData){
 await requireAdmin();
 const sourceId=String(data.get('sourceId')??''), index=Number(data.get('candidateIndex')), evidence=String(data.get('evidence')??'').trim();
 if(!/^\d{4}:\d+:[\w-]+$/.test(sourceId)||!Number.isInteger(index)||index<0||index>9||evidence.length<12||evidence.length>2000)throw Error('Cần nhập bằng chứng đối chiếu hợp lệ.');
 const sql=getDb();
 const [row]=await sql`SELECT a.vessel_name,(l.candidates || COALESCE((SELECT jsonb_agg(jsonb_build_object('name',v.vessel_name,'imo',v.imo,'dwt',v.dwt,'match','verified','sourceUrl',prior.verification_source)) FROM cdn_vessels v JOIN LATERAL (SELECT verification_source FROM cdn_arrivals WHERE vessel_id=v.id AND verification_source IS NOT NULL ORDER BY verified_at DESC LIMIT 1) prior ON true WHERE v.match_status='verified' AND upper(trim(v.vessel_name))=upper(trim(a.vessel_name)) AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(l.candidates) c WHERE c->>'imo'=v.imo)), '[]'::jsonb))->${index} AS candidate FROM cdn_arrivals a JOIN cdn_dwt_lookups l ON l.vessel_name=a.vessel_name WHERE a.source_id=${sourceId} AND a.vessel_id IS NULL`;
 if(!row?.candidate)throw Error('Ứng viên không còn khả dụng.');
 const item=row.candidate as {name:string;imo:string|null;dwt:number|null;sourceUrl?:string};
 if(!item.imo||!/^\d{7}$/.test(item.imo)||(item.dwt!==null&&(!Number.isFinite(item.dwt)||item.dwt<=0))||!item.sourceUrl)throw Error('Cần ứng viên có IMO và nguồn.');
 const updated=await sql`WITH v AS (INSERT INTO cdn_vessels(imo,vessel_name,dwt,dwt_source,dwt_observed_at,match_status) VALUES(${item.imo},${item.name},${item.dwt},${item.dwt===null?null:item.sourceUrl},${item.dwt===null?null:new Date().toISOString()}::timestamptz,'verified') ON CONFLICT(imo) DO UPDATE SET updated_at=now() WHERE cdn_vessels.match_status='verified' AND (cdn_vessels.dwt IS NOT DISTINCT FROM excluded.dwt OR excluded.dwt IS NULL) RETURNING id) UPDATE cdn_arrivals SET vessel_id=v.id,verification_evidence=${evidence},verification_source=${item.sourceUrl},verified_at=now() FROM v WHERE source_id=${sourceId} AND vessel_id IS NULL RETURNING source_id`;
 if(!updated.length)throw Error('Hồ sơ IMO đã tồn tại với DWT khác hoặc lượt tàu đã được xử lý.');
 revalidatePath('/admin');
}
