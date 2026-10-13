import { db, readDataset, fail } from './db-runtime';
async function main() {
 const sql=db(); const records=readDataset();const payload=JSON.stringify(records);
 await sql`INSERT INTO port_entities(internal_code,source_id,name_vi,entity_type,stock_ticker,latitude,longitude,payload)
 SELECT p->>'internalCode',p->>'sourceId',p->>'nameVi',p->>'entityType',p->>'stockTicker',(p->>'latitude')::double precision,(p->>'longitude')::double precision,p FROM jsonb_array_elements(${payload}::jsonb) p
 ON CONFLICT(internal_code) DO UPDATE SET source_id=excluded.source_id,name_vi=excluded.name_vi,entity_type=excluded.entity_type,stock_ticker=excluded.stock_ticker,latitude=excluded.latitude,longitude=excluded.longitude,payload=excluded.payload`;
 console.log(`Seeded ${records.length} port entities (upsert).`);
}
main().catch(fail);
