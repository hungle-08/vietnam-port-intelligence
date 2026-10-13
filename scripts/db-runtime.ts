import { loadEnvConfig } from '@next/env';
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import type { PortRecord } from '../src/lib/ports/types';
import { validatePort } from '../src/lib/ports/domain';
export function db(direct=false) {
  // Optional dedicated env file for testing a Neon branch without changing local app credentials.
  if (process.env.DB_ENV_FILE) {
    const content=readFileSync(process.env.DB_ENV_FILE,'utf8');
    for (const line of content.split('\n')) {
      const match=line.match(/^([A-Z_]+)=(.*)$/);
      if (match) process.env[match[1]]=match[2].replace(/^['"]|['"]$/g,'');
    }
  } else loadEnvConfig(process.cwd());
  const url=process.env[direct?'DATABASE_URL_UNPOOLED':'DATABASE_URL'];
  if (!url) throw new Error('Database environment missing');
  return neon(url);
}
export function readDataset(): PortRecord[] {
  const raw=JSON.parse(readFileSync('data/port-investments.json','utf8')) as PortRecord[];
  const enrichment: Record<string,Partial<PortRecord>> = {};
  const ids=new Set<string>();
  return raw.map(p=>{
    const item={...p,...enrichment[p.internalCode],sources:{...p.sources,...enrichment[p.internalCode]?.sources}};
    if (ids.has(item.internalCode)) throw new Error('Duplicate internal code');
    ids.add(item.internalCode); validatePort(item);
    const mapIds=new Set<string>();
    for(const location of item.mapLocations??[]) {
      validatePort(location);
      if(mapIds.has(location.id)||!location.id||!location.sourceUrl||!['north','central','south'].includes(location.region)) throw new Error('Invalid map location');
      mapIds.add(location.id);
    }
    if (!item.nameVi || !item.seaportName) throw new Error('Missing terminal identity');
    return item;
  });
}
export function fail() { console.error('Database operation failed. Check environment and migration state. Credentials are omitted.'); process.exitCode=1; }
