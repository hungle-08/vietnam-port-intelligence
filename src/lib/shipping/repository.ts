import 'server-only';
import {getDb} from '../db';
import {validateShippingSnapshot} from './parse';
import type {Carrier,ShippingRanking,ShippingSnapshot} from './types';
export async function getShippingRanking():Promise<ShippingRanking>{
 const sql=getDb();const snapshots=await sql`SELECT id,metadata FROM shipping_fleet_snapshots WHERE source_id='alphaliner' AND metric='operated-container-capacity-teu' ORDER BY as_of DESC,retrieved_at DESC,id DESC LIMIT 1`;
 if(!snapshots.length)throw Error('No shipping snapshot');
 const rows=await sql`SELECT r.carrier_id,r.rank,r.source_name,r.capacity_teu,r.ship_count,r.share_percent,c.payload FROM shipping_fleet_rankings r JOIN shipping_carriers c ON c.id=r.carrier_id WHERE r.snapshot_id=${snapshots[0].id} ORDER BY r.rank`;
 const entries=rows.map(r=>({carrierId:r.carrier_id as string,rank:Number(r.rank),sourceName:r.source_name as string,capacityTeu:Number(r.capacity_teu),shipCount:r.ship_count===null?null:Number(r.ship_count),sharePercent:Number(r.share_percent)}));
 return {...validateShippingSnapshot({...snapshots[0].metadata,entries} as ShippingSnapshot),carriers:rows.map(r=>r.payload as Carrier),savedCopy:false};
}
