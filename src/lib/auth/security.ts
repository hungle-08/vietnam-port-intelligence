import {createHash,randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
export {validateCredentials} from './validation';
const N=131072,r=8,p=1;
function derive(password:string,salt:Buffer):Promise<Buffer>{
 return new Promise((resolve,reject)=>scrypt(password,salt,64,{N,r,p,maxmem:256*1024*1024},(error,key)=>error?reject(error):resolve(key)));
}
export async function hashPassword(password:string){
 const salt=randomBytes(16),key=await derive(password,salt);
 return `scrypt:${N}:${r}:${p}:${salt.toString('hex')}:${key.toString('hex')}`;
}
export async function verifyPassword(password:string,encoded:string){
 const parts=encoded.split(':');
 if(parts.length!==6||parts[0]!=='scrypt'||parts[1]!==String(N)||parts[2]!==String(r)||parts[3]!==String(p)||! /^[a-f0-9]{32}$/.test(parts[4])||! /^[a-f0-9]{128}$/.test(parts[5]))return false;
 return timingSafeEqual(await derive(password,Buffer.from(parts[4],'hex')),Buffer.from(parts[5],'hex'));
}
// A valid fixed dummy hash keeps unknown-account login on the same scrypt path.
export const DUMMY_HASH=`scrypt:${N}:${r}:${p}:${'0'.repeat(32)}:${'0'.repeat(128)}`;
export function createSessionToken(){return randomBytes(32).toString('hex');}
export function hashSessionToken(token:string){return /^[a-f0-9]{64}$/.test(token)?createHash('sha256').update(token).digest('hex'):null;}
export function rateKey(value:string){return createHash('sha256').update(value).digest('hex');}
