import {describe,it,expect,vi} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
vi.mock('../src/lib/auth/actions',()=>({submitAuth:async()=>({})}));
import {AuthForm} from '../src/components/auth/auth-form';
import {validateCredentials} from '../src/lib/auth/security';
describe('localized account forms',()=>{
 it('accepts the same Unicode length policy in the form and server',()=>{
  const html=renderToStaticMarkup(createElement(AuthForm,{locale:'vi',mode:'register'}));
  const password=html.match(/<input[^>]*name="password"[^>]*>/)?.[0]??'';
  const name=html.match(/<input[^>]*name="name"[^>]*>/)?.[0]??'';
  expect(password).not.toMatch(/maxLength|minLength/i);expect(name).not.toMatch(/maxLength|minLength/i);
  expect(validateCredentials({name:'𐐀'.repeat(70),email:'test@example.com',password:'𐐀'.repeat(100)},true).errors).toEqual({});
 });
 it('offers email/password login and optional public access in both languages',()=>{
  for(const locale of ['vi','en'] as const){const html=renderToStaticMarkup(createElement(AuthForm,{locale,mode:'login'}));
   expect(html).toContain('autoComplete="current-password"');expect(html).not.toContain('name="name"');expect(html).toContain(`href="/${locale}"`);
   expect(html).toContain(locale==='vi'?'không cần đăng nhập':'without signing in');
  }
 });
});
