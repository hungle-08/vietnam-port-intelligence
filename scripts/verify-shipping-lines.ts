import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {db,fail} from './db-runtime';
import {validateShippingSnapshot} from '../src/lib/shipping/parse';
import type {ShippingSnapshot} from '../src/lib/shipping/types';
async function main(){
 const expected=validateShippingSnapshot(JSON.parse(readFileSync('data/shipping-lines.json','utf8')) as ShippingSnapshot);const hash=createHash('sha256').update(JSON.stringify(expected.entries)).digest('hex');const id=`alphaliner:${expected.asOf}:${hash.slice(0,16)}`;const sql=db();
 const rows=await sql`SELECT carrier_id AS "carrierId",rank,source_name AS "sourceName",capacity_teu::float8 AS "capacityTeu",ship_count AS "shipCount",share_percent::float8 AS "sharePercent" FROM shipping_fleet_rankings WHERE snapshot_id=${id} ORDER BY rank`;
 if(rows.length!==10||rows.some((r,i)=>Object.entries(expected.entries[i]).some(([key,value])=>r[key]!==value)))throw Error('Stored shipping figures differ from source');
 const counts=await sql`SELECT (SELECT count(*) FROM shipping_carriers) AS carriers,(SELECT count(*) FROM shipping_carrier_port_links) AS links`;
 console.log(`Verified ${rows.length} source-matched rankings · ${counts[0].carriers} carrier identities · ${counts[0].links} sourced port links`);
}
main().catch(fail);
