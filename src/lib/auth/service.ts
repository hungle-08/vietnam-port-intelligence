import {createSessionToken,DUMMY_HASH,hashPassword,hashSessionToken,rateKey,verifyPassword} from './security';
import type {AccountUser} from './types';
export const SESSION_SECONDS=7*24*60*60;
export interface AuthStore {
 attempt(key:string,window:Date):Promise<number>;
 findAccount(email:string):Promise<(AccountUser&{passwordHash:string})|null>;
 register(user:{name:string;email:string;passwordHash:string},tokenHash:string,expires:Date):Promise<AccountUser|null>;
 createSession(userId:string,tokenHash:string,expires:Date):Promise<void>;
 currentUser(tokenHash:string):Promise<AccountUser|null>;
 revoke(tokenHash:string):Promise<void>;
}
export type AuthResult={error:'limited'|'duplicate'|'invalid'}|{user:AccountUser;token:string;expires:Date};
export async function authenticate(store:AuthStore,credentials:{email:string;name:string;password:string},register:boolean,now=new Date()):Promise<AuthResult>{
 const window=new Date(Math.floor(now.getTime()/(15*60*1000))*15*60*1000);
 const attempts=await store.attempt(rateKey(`${register?'register':'login'}:${credentials.email}`),window);
 if(attempts>(register?5:10))return {error:'limited' as const};
 // Requests already rejected for this email never consume the shared scrypt budget.
 const globalAttempts=await store.attempt(rateKey(`global:${register?'register':'login'}`),window);
 if(globalAttempts>(register?100:500))return {error:'limited' as const};
 const token=createSessionToken(),tokenHash=hashSessionToken(token)!;
 const expires=new Date(now.getTime()+SESSION_SECONDS*1000);
 let user:AccountUser|null;
 if(register){
  const passwordHash=await hashPassword(credentials.password);
  user=await store.register({email:credentials.email,name:credentials.name,passwordHash},tokenHash,expires);
  if(!user)return {error:'duplicate' as const};
 }else{
  const account=await store.findAccount(credentials.email);
  const valid=await verifyPassword(credentials.password,account?.passwordHash??DUMMY_HASH);
  if(!account||!valid)return {error:'invalid' as const};
  user={id:account.id,name:account.name,email:account.email,role:account.role};
  await store.createSession(user.id,tokenHash,expires);
 }
 return {user,token,expires};
}
