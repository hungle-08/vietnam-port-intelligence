import {describe,it,expect} from 'vitest';
import {validateCredentials,hashPassword,verifyPassword,createSessionToken,hashSessionToken} from '../src/lib/auth/security';
describe('account credentials',()=>{
 it('normalizes email and name while preserving password exactly',()=>{
  const result=validateCredentials({email:'  Person@EXAMPLE.COM ',name:' Người dùng ',password:' a long pass phrase '},true);
  expect(result).toEqual({email:'person@example.com',name:'Người dùng',password:' a long pass phrase ',errors:{}});
 });
 it('rejects short registration passwords and accepts Unicode phrases without composition rules',()=>{
  expect(validateCredentials({email:'a@b.com',name:'An',password:'short'},true).errors.password).toBe('password');
  expect(validateCredentials({email:'a@b.com',name:'An',password:'đây là cụm từ bí mật'},true).errors).toEqual({});
  expect(validateCredentials({email:'bad',name:' ',password:'x'.repeat(129)},true).errors).toEqual({email:'email',name:'name',password:'password'});
 });
 it('validates login independently of registration policy',()=>{
  expect(validateCredentials({email:'a@b.com',password:'short'},false).errors).toEqual({});
  expect(validateCredentials({email:'a@b.com',password:''},false).errors.password).toBe('password');
 });
});
describe('password storage',()=>{
 it('uses unique salted hashes, verifies exact input and rejects malformed hashes',async()=>{
  const password='đây là mật khẩu dài ';const first=await hashPassword(password),second=await hashPassword(password);
  expect(first).not.toBe(second);expect(first).not.toContain(password);
  expect(await verifyPassword(password,first)).toBe(true);
  expect(await verifyPassword(password.trim(),first)).toBe(false);
  expect(await verifyPassword(password,'scrypt:999999999:8:1:bad:bad')).toBe(false);
 },15000);
});
describe('session tokens',()=>{
 it('creates unpredictable tokens and stores only their digest',()=>{
  const a=createSessionToken(),b=createSessionToken();expect(a).toMatch(/^[a-f0-9]{64}$/);expect(a).not.toBe(b);
  expect(hashSessionToken(a)).toMatch(/^[a-f0-9]{64}$/);expect(hashSessionToken(a)).not.toBe(a);
  expect(hashSessionToken('forged')).toBeNull();
 });
});
