import { db, readDataset, fail } from './db-runtime';
import { isDeepStrictEqual } from 'node:util';
import {mapPorts,getMapLocations} from '../src/lib/ports/domain';
async function main() {
 const sql=db();const expected=readDataset().sort((a,b)=>a.internalCode.localeCompare(b.internalCode));
 const rows=await sql`SELECT payload FROM port_entities WHERE source_id='user-reference-2026-10-13' ORDER BY internal_code`;
 if(rows.length!==expected.length || rows.some((r,i)=>!isDeepStrictEqual(r.payload,expected[i]))) throw new Error('Dataset mismatch');
 console.log(`Verified: ${rows.length} port entities; ${mapPorts(expected).length} mapped entities; ${getMapLocations(expected).length} approximate map points. MVN excluded. Exact coordinates and operations remain unverified.`);
}
main().catch(fail);
