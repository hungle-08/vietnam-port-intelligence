import 'server-only';
import { getDb } from '../db';
import type { PortRecord } from './types';
export async function getPortDirectory(): Promise<PortRecord[]> {
 const sql=getDb();
 const rows=await sql`SELECT payload AS port FROM port_entities WHERE source_id='user-reference-2026-10-13' ORDER BY name_vi`;
 return rows.map(r=>r.port as PortRecord);
}
