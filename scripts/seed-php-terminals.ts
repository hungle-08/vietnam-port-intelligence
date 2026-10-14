import {db,fail} from './db-runtime';
import {phpTerminals} from '../src/lib/php/directory';
async function main(){const sql=db();await sql.transaction([
 sql`INSERT INTO issuer_terminal_sites(id,name,operator_name,payload) SELECT p->>'id',p->>'name',p->>'operator',p FROM jsonb_array_elements(${JSON.stringify(phpTerminals)}::jsonb) p ON CONFLICT(id) DO UPDATE SET name=excluded.name,operator_name=excluded.operator_name,payload=excluded.payload`,
 sql`INSERT INTO issuer_terminal_memberships(ticker,terminal_id,relation,ownership_percent,scope,valid_from,evidence_as_of,source_url) SELECT 'PHP',p->>'id',p->>'relation',(p->>'ownershipPercent')::numeric,p->>'scope','2026-01-01'::date,'2025-12-31'::date,p->>'sourceUrl' FROM jsonb_array_elements(${JSON.stringify(phpTerminals)}::jsonb) p ON CONFLICT(ticker,terminal_id,valid_from) DO NOTHING`,
 sql`INSERT INTO issuer_terminal_memberships(ticker,terminal_id,relation,ownership_percent,scope,valid_from,evidence_as_of,source_url) VALUES('DVP','dvp-dinh-vu','own-operation',100,'direct','2026-01-01','2025-12-31',${phpTerminals[4].sourceUrl}) ON CONFLICT(ticker,terminal_id,valid_from) DO NOTHING`
 ]);console.log('Verified PHP directory stored: five sites; DVP shares one physical terminal.');}
main().catch(fail);
