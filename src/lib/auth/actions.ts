'use server';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {isLocale,type Locale} from '@/lib/i18n';
import {authMessages} from './messages';
import {authStore} from './repository';
import {authenticate} from './service';
import {SESSION_COOKIE} from './session';
import {hashSessionToken,validateCredentials} from './security';
import type {AuthState} from './types';
export async function submitAuth(locale:Locale,mode:'login'|'register',_previous:AuthState,form:FormData):Promise<AuthState>{
 if(!isLocale(locale)||(mode!=='login'&&mode!=='register'))return {error:'unavailable'};
 const registering=mode==='register',t=authMessages(locale);
 const credentials=validateCredentials({email:form.get('email'),name:form.get('name'),password:form.get('password')},registering);
 const values={email:credentials.email,name:credentials.name};
 if(Object.keys(credentials.errors).length)return {values,fields:{
  ...(credentials.errors.email?{email:t.emailError}:{}),
  ...(credentials.errors.name?{name:t.nameError}:{}),
  ...(credentials.errors.password?{password:registering?t.passwordError:t.loginPasswordError}:{})
 }};
 try{
  const result=await authenticate(authStore,credentials,registering);
  if('error' in result)return {error:result.error,values};
  const jar=await cookies();
  const old=jar.get(SESSION_COOKIE)?.value;
  const oldHash=old?hashSessionToken(old):null;
  if(oldHash)await authStore.revoke(oldHash);
  jar.set(SESSION_COOKIE,result.token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',expires:result.expires});
 }catch{return {error:'unavailable',values};}
 redirect(`/${locale}`);
}
export async function logout(locale:Locale){
 const safeLocale=isLocale(locale)?locale:'vi';
 const jar=await cookies(),token=jar.get(SESSION_COOKIE)?.value;
 const hash=token?hashSessionToken(token):null;
 // Keep the cookie if revocation fails, so the user can retry server-side logout.
 if(hash)await authStore.revoke(hash);
 jar.delete(SESSION_COOKIE);
 redirect(`/${safeLocale}`);
}
