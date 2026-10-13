import {describe,it,expect} from 'vitest';
import {authenticate,type AuthStore} from '../src/lib/auth/service';
import {hashPassword,hashSessionToken,rateKey} from '../src/lib/auth/security';
import type {AccountUser} from '../src/lib/auth/types';
function memoryStore(){
 const users=new Map<string,AccountUser&{passwordHash:string}>(),sessions=new Map<string,{user:AccountUser;expires:Date;revoked:boolean}>(),limits=new Map<string,number>();
 const store:AuthStore={
  async attempt(key,window){const k=key+window.toISOString();const count=(limits.get(k)??0)+1;limits.set(k,count);return count;},
  async findAccount(email){return users.get(email)??null;},
  async register(user,hash,expires){if(users.has(user.email))return null;const account={id:'user-1',...user,role:'user' as const};users.set(user.email,account);sessions.set(hash,{user:account,expires,revoked:false});return {id:account.id,name:account.name,email:account.email,role:account.role};},
  async createSession(userId,hash,expires){const user=[...users.values()].find(u=>u.id===userId)!;sessions.set(hash,{user,expires,revoked:false});},
  async currentUser(hash){const s=sessions.get(hash);return s&&!s.revoked&&s.expires>new Date()?{id:s.user.id,name:s.user.name,email:s.user.email,role:s.user.role}:null;},
  async revoke(hash){const s=sessions.get(hash);if(s)s.revoked=true;}
 };return {store,users,sessions,limits};
}
const credentials={name:'Test User',email:'test@example.com',password:'a long passphrase here'};
describe('account and session lifecycle',()=>{
 it('registers without verification, logs in, never exposes the hash, and revokes sessions',async()=>{
  const {store,users,sessions}=memoryStore();
  const registered=await authenticate(store,credentials,true);expect('token' in registered).toBe(true);
  if(!('token' in registered))throw Error('Registration failed');
  const digest=hashSessionToken(registered.token)!;
  expect(sessions.has(registered.token)).toBe(false);expect(sessions.has(digest)).toBe(true);
  expect(registered.user).toEqual({id:'user-1',email:credentials.email,name:credentials.name,role:'user'});
  expect(users.get(credentials.email)?.passwordHash).not.toContain(credentials.password);
  const login=await authenticate(store,credentials,false);expect('token' in login).toBe(true);
  if(!('token' in login))throw Error('Login failed');
  expect(login.token).not.toBe(registered.token);
  expect(await store.currentUser(digest)).toEqual(registered.user);
  await store.revoke(digest);expect(await store.currentUser(digest)).toBeNull();
  sessions.get(hashSessionToken(login.token)!)!.expires=new Date(0);
  expect(await store.currentUser(hashSessionToken(login.token)!)).toBeNull();
 },15000);
 it('preserves the server-stored admin role on login',async()=>{
  const {store,users}=memoryStore();
  users.set(credentials.email,{id:'admin-id',name:'Admin',email:credentials.email,role:'admin',passwordHash:await hashPassword(credentials.password)});
  const result=await authenticate(store,{...credentials,name:'Untrusted display name'},false);
  if('error' in result)throw Error('Login failed');
  expect(result.user).toEqual({id:'admin-id',name:'Admin',email:credentials.email,role:'admin'});
 },10000);
 it('rejects a duplicate registration and shares the same error for missing users and wrong passwords',async()=>{
  const {store,users}=memoryStore();
  users.set(credentials.email,{id:'existing',role:'user',name:credentials.name,email:credentials.email,passwordHash:await hashPassword(credentials.password)});
  expect(await authenticate(store,credentials,true)).toEqual({error:'duplicate'});
  expect(await authenticate(store,{...credentials,password:'incorrect password'},false)).toEqual({error:'invalid'});
  expect(await authenticate(store,{...credentials,email:'missing@example.com'},false)).toEqual({error:'invalid'});
 },15000);
 it('already blocked emails cannot consume the shared work budget',async()=>{
  const {store,limits}=memoryStore();const now=new Date('2026-10-13T00:01:00Z'),window='2026-10-13T00:00:00.000Z';
  limits.set(rateKey('login:'+credentials.email)+window,10);
  for(let i=0;i<501;i++)expect(await authenticate(store,credentials,false,now)).toEqual({error:'limited'});
  expect(limits.get(rateKey('global:login')+window)??0).toBe(0);
  expect(await authenticate(store,{...credentials,email:'unrelated@example.com'},false,now)).toEqual({error:'invalid'});
 },10000);
 it('blocks excessive attempts before password hashing and resets at the next window',async()=>{
  const {store,limits}=memoryStore();const now=new Date('2026-10-13T00:01:00Z'),window='2026-10-13T00:00:00.000Z';
  limits.set(rateKey('login:'+credentials.email)+window,10);
  expect(await authenticate(store,credentials,false,now)).toEqual({error:'limited'});
  expect(await authenticate(store,credentials,false,new Date('2026-10-13T00:16:00Z'))).toEqual({error:'invalid'});
  limits.set(rateKey('global:register')+window,100);
  expect(await authenticate(store,credentials,true,now)).toEqual({error:'limited'});
 },10000);
});
