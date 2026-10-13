import {randomUUID,randomBytes} from 'node:crypto';
import {db,fail} from './db-runtime';
async function main(){
 const sql=db();
 const rows=await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('auth_users','auth_sessions','auth_rate_limits') ORDER BY table_name`;
 if(rows.length!==3)throw Error('Account tables missing');
 console.log('Verified 3 account tables.');
 if(process.argv.includes('--rollback-test')){
  if(!process.env.DB_ENV_FILE)throw Error('Use a dedicated development env file for rollback verification');
  const id=randomUUID(),email=`rollback-${id}@example.invalid`,hash=randomBytes(32).toString('hex');
  // The deliberately raised Z0001 exception rolls back all fixture writes in
  // the inner PL/pgSQL subtransaction before the outer read assertion.
  await sql.query(`DO $verify$
   DECLARE uid uuid := '${id}'; mail text := '${email}'; digest text := '${hash}'; duplicate_rejected boolean := false; registered uuid;
   BEGIN
    BEGIN
     WITH account AS (
      INSERT INTO auth_users(id,name,email,password_hash) VALUES(uid,'Rollback check',mail,'dummy') ON CONFLICT(email) DO NOTHING RETURNING id,name,email
     ), session AS (
      INSERT INTO auth_sessions(token_hash,user_id,expires_at) SELECT digest,id,now()+interval '1 day' FROM account RETURNING user_id
     ) SELECT account.id INTO registered FROM account JOIN session ON session.user_id=account.id;
     IF registered IS DISTINCT FROM uid THEN RAISE EXCEPTION 'Atomic registration/session check failed'; END IF;
     UPDATE auth_sessions SET created_at=now()-interval '2 days' WHERE token_hash=digest;
     IF NOT EXISTS(SELECT 1 FROM auth_sessions s JOIN auth_users u ON u.id=s.user_id WHERE s.token_hash=digest AND s.expires_at>now() AND s.revoked_at IS NULL AND u.email=mail) THEN RAISE EXCEPTION 'Active session check failed'; END IF;
     BEGIN INSERT INTO auth_users(id,email,name,password_hash) VALUES(gen_random_uuid(),mail,'Duplicate check','dummy'); EXCEPTION WHEN unique_violation THEN duplicate_rejected:=true; END;
     IF NOT duplicate_rejected THEN RAISE EXCEPTION 'Duplicate email accepted'; END IF;
     UPDATE auth_sessions SET expires_at=now()-interval '1 day' WHERE token_hash=digest;
     IF EXISTS(SELECT 1 FROM auth_sessions WHERE token_hash=digest AND expires_at>now() AND revoked_at IS NULL) THEN RAISE EXCEPTION 'Expired session accepted'; END IF;
     UPDATE auth_sessions SET expires_at=now()+interval '1 day',revoked_at=now() WHERE token_hash=digest;
     IF EXISTS(SELECT 1 FROM auth_sessions WHERE token_hash=digest AND expires_at>now() AND revoked_at IS NULL) THEN RAISE EXCEPTION 'Revoked session accepted'; END IF;
     INSERT INTO auth_rate_limits(key_hash,window_start) VALUES(digest,date_trunc('hour',now()));
     INSERT INTO auth_rate_limits(key_hash,window_start) VALUES(digest,date_trunc('hour',now())) ON CONFLICT(key_hash,window_start) DO UPDATE SET attempts=auth_rate_limits.attempts+1;
     IF (SELECT attempts FROM auth_rate_limits WHERE key_hash=digest AND window_start=date_trunc('hour',now()))<>2 THEN RAISE EXCEPTION 'Rate counter check failed'; END IF;
     RAISE EXCEPTION USING ERRCODE='Z0001',MESSAGE='Roll back verification fixtures';
    EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL;
    END;
    IF EXISTS(SELECT 1 FROM auth_users WHERE email=mail) OR EXISTS(SELECT 1 FROM auth_sessions WHERE token_hash=digest) OR EXISTS(SELECT 1 FROM auth_rate_limits WHERE key_hash=digest) THEN RAISE EXCEPTION 'Fixtures were not rolled back'; END IF;
   END $verify$`);
  console.log('Verified active/expired/revoked sessions, unique email and atomic rate counter. All fixture writes rolled back.');
 }
}
main().catch(fail);
