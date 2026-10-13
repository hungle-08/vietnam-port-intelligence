import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {db,fail} from './db-runtime';
import {hashPassword,verifyPassword,validateCredentials} from '../src/lib/auth/security';
async function main(){
 // Credentials are supplied through stdin; never stored in the repository or logs.
 const input=JSON.parse(readFileSync(0,'utf8'));
 const credentials=validateCredentials(input,false);
 if(Object.keys(credentials.errors).length||credentials.name.length<2||credentials.name.length>80)throw Error('Invalid account input');
 const passwordHash=await hashPassword(credentials.password),sql=db();
 await sql.transaction([
  sql`INSERT INTO auth_users(id,name,email,password_hash,role) VALUES(${randomUUID()},${credentials.name},${credentials.email},${passwordHash},'admin') ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name,password_hash=EXCLUDED.password_hash,role='admin'`,
  sql`UPDATE auth_sessions SET revoked_at=now() WHERE user_id=(SELECT id FROM auth_users WHERE email=${credentials.email}) AND revoked_at IS NULL`
 ]);
 const rows=await sql`SELECT name,role,password_hash FROM auth_users WHERE email=${credentials.email}`;
 if(rows[0]?.name!==credentials.name||rows[0]?.role!=='admin'||!await verifyPassword(credentials.password,rows[0].password_hash))throw Error('Admin verification failed');
 console.log('Admin account saved and password hash verified. Existing sessions revoked.');
}
main().catch(fail);
