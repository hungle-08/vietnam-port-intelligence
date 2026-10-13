import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {carriers} from '../src/lib/shipping/carriers';
import {validateShippingSnapshot} from '../src/lib/shipping/parse';
import type {ShippingSnapshot} from '../src/lib/shipping/types';
import {db,fail} from './db-runtime';
const snapshot=validateShippingSnapshot(JSON.parse(readFileSync('data/shipping-lines.json','utf8')) as ShippingSnapshot);
const hash=createHash('sha256').update(JSON.stringify(snapshot.entries)).digest('hex');
const id=`${snapshot.sourceId}:${snapshot.asOf}:${hash.slice(0,16)}`;
const literal=(s:string)=>"'"+s.replaceAll("'","''")+"'";
const carrierJson=literal(JSON.stringify(carriers));const entriesJson=literal(JSON.stringify(snapshot.entries));const metadata=literal(JSON.stringify({...snapshot,entries:undefined}));
const statements=[
 `INSERT INTO shipping_carriers(id,name,short_name,website,logo_url,payload) SELECT p->>'id',p->>'name',p->>'shortName',p->>'website',p->>'logoUrl',p FROM jsonb_array_elements(${carrierJson}::jsonb) p ON CONFLICT(id) DO UPDATE SET name=excluded.name,short_name=excluded.short_name,website=excluded.website,logo_url=excluded.logo_url,payload=excluded.payload`,
 `INSERT INTO shipping_fleet_snapshots(id,source_id,as_of,retrieved_at,source_url,metric,scope,content_hash,metadata) VALUES(${literal(id)},'alphaliner',${literal(snapshot.asOf)},${literal(snapshot.retrievedAt)},${literal(snapshot.sourceUrl)},'operated-container-capacity-teu','consolidated',${literal(hash)},${metadata}::jsonb) ON CONFLICT(id) DO NOTHING`,
 `INSERT INTO shipping_fleet_rankings(snapshot_id,carrier_id,rank,source_name,capacity_teu,ship_count,share_percent) SELECT ${literal(id)},p->>'carrierId',(p->>'rank')::integer,p->>'sourceName',(p->>'capacityTeu')::bigint,(p->>'shipCount')::integer,(p->>'sharePercent')::numeric FROM jsonb_array_elements(${entriesJson}::jsonb) p ON CONFLICT(snapshot_id,carrier_id) DO NOTHING`
];
async function main(){
 if(process.argv.includes('--export')){const migration=readFileSync('db/migrations/0003_shipping_lines.sql','utf8');const checksum=createHash('sha256').update(migration).digest('hex');writeFileSync('data/shipping-lines-import.sql',`BEGIN;\n${migration}\n${statements.join(';\n')};\nINSERT INTO schema_migrations(id,checksum) VALUES('0003_shipping_lines.sql',${literal(checksum)}) ON CONFLICT(id) DO NOTHING;\nCOMMIT;\n`);console.log('Exported additive transactional shipping import.');return;}
 const sql=db();await sql.transaction(statements.map(s=>sql.query(s)));const rows=await sql`SELECT count(*)::integer AS count FROM shipping_fleet_rankings WHERE snapshot_id=${id}`;
 if(rows[0].count!==10)throw Error('Incomplete database snapshot');console.log(`Stored ${rows[0].count} shipping carriers · ${snapshot.asOf}`);
}
main().catch(fail);
