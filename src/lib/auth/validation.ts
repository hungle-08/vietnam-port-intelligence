export type CredentialErrors=Partial<Record<'email'|'name'|'password','email'|'name'|'password'>>;
export function validateCredentials(input:{email:unknown;name?:unknown;password:unknown},register:boolean){
 const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
 const name=typeof input.name==='string'?input.name.trim():'';
 const password=typeof input.password==='string'?input.password:'';
 const errors:CredentialErrors={};
 if(email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))errors.email='email';
 if(register&&(Array.from(name).length<2||Array.from(name).length>80))errors.name='name';
 const length=Array.from(password).length;
 if(length<(register?15:1)||length>128||Buffer.byteLength(password,'utf8')>1024)errors.password='password';
 return {email,name,password,errors};
}
