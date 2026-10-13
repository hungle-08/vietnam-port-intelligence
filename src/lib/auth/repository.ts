import 'server-only';
import {randomUUID} from 'node:crypto';
import {getDb} from '@/lib/db';
import type {AuthStore} from './service';
import type {AccountUser} from './types';
export const authStore:AuthStore={
 async attempt(key,window){
  const rows=await getDb()`INSERT INTO auth_rate_limits(key_hash,window_start) VALUES(${key},${window.toISOString()}) ON CONFLICT(key_hash,window_start) DO UPDATE SET attempts=auth_rate_limits.attempts+1 RETURNING attempts`;
  return Number(rows[0].attempts);
 },
 async findAccount(email){
  const rows=await getDb()`SELECT id,name,email,role,password_hash AS "passwordHash" FROM auth_users WHERE email=${email}`;
  return (rows[0] as AccountUser&{passwordHash:string})??null;
 },
 async register(user,tokenHash,expires){
  const rows=await getDb()`WITH account AS (
   INSERT INTO auth_users(id,name,email,password_hash) VALUES(${randomUUID()},${user.name},${user.email},${user.passwordHash}) ON CONFLICT(email) DO NOTHING RETURNING id,name,email,role
  ), session AS (
   INSERT INTO auth_sessions(token_hash,user_id,expires_at) SELECT ${tokenHash},id,${expires.toISOString()} FROM account RETURNING user_id
  ) SELECT account.id,account.name,account.email,account.role FROM account JOIN session ON session.user_id=account.id`;
  return (rows[0] as AccountUser)??null;
 },
 async createSession(userId,tokenHash,expires){await getDb()`INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES(${tokenHash},${userId},${expires.toISOString()})`;},
 async currentUser(tokenHash){
  const rows=await getDb()`SELECT u.id,u.name,u.email,u.role FROM auth_sessions s JOIN auth_users u ON u.id=s.user_id WHERE s.token_hash=${tokenHash} AND s.expires_at>now() AND s.revoked_at IS NULL`;
  return (rows[0] as AccountUser)??null;
 },
 async revoke(tokenHash){await getDb()`UPDATE auth_sessions SET revoked_at=now() WHERE token_hash=${tokenHash} AND revoked_at IS NULL`;},
};
