import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { db, fail } from './db-runtime';
async function main() {
 const sql=db(true);
 await sql`CREATE TABLE IF NOT EXISTS schema_migrations (id text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`;
 for (const file of readdirSync('db/migrations').filter(f=>f.endsWith('.sql')).sort()) {
  const source=readFileSync(`db/migrations/${file}`,'utf8');
  const hash=createHash('sha256').update(source).digest('hex');
  const applied=await sql`SELECT checksum FROM schema_migrations WHERE id=${file}`;
  if (applied.length) {if(applied[0].checksum!==hash) throw new Error('Migration checksum changed');continue;}
  const statements=source.split(';').map(s=>s.trim()).filter(Boolean);
  await sql.transaction([...statements.map(s=>sql.query(s)),sql`INSERT INTO schema_migrations(id,checksum) VALUES(${file},${hash})`]);
  console.log(`Applied ${file}`);
 }
 console.log('Migrations up to date.');
}
main().catch(fail);
