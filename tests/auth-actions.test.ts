import {beforeEach,describe,it,expect,vi} from 'vitest';
const mock=vi.hoisted(()=>({cookie:{get:vi.fn(),set:vi.fn(),delete:vi.fn()},authenticate:vi.fn(),revoke:vi.fn(),redirect:vi.fn()}));
vi.mock('next/headers',()=>({cookies:async()=>mock.cookie}));
vi.mock('next/navigation',()=>({redirect:mock.redirect}));
vi.mock('../src/lib/auth/session',()=>({SESSION_COOKIE:'vpi_session'}));
vi.mock('../src/lib/auth/repository',()=>({authStore:{revoke:mock.revoke}}));
vi.mock('../src/lib/auth/service',()=>({authenticate:mock.authenticate}));
import {submitAuth,logout} from '../src/lib/auth/actions';
function form(email='PERSON@example.com',password='long private password',name='Person'){
 const data=new FormData();data.set('email',email);data.set('password',password);data.set('name',name);return data;
}
beforeEach(()=>{vi.clearAllMocks();mock.cookie.get.mockReturnValue(undefined);mock.redirect.mockImplementation(()=>{throw Error('NEXT_REDIRECT');});});
describe('authentication server actions',()=>{
 it('validates on the server and never returns passwords to form state',async()=>{
  const result=await submitAuth('vi','register',{},form('bad','short','x'));
  expect(result.fields).toHaveProperty('email');expect(result.fields).toHaveProperty('name');expect(result.fields).toHaveProperty('password');
  expect(JSON.stringify(result)).not.toContain('short');expect(mock.authenticate).not.toHaveBeenCalled();
 });
 it('ignores any role submitted through the public registration form',async()=>{
  const data=form();data.set('role','admin');mock.authenticate.mockResolvedValueOnce({error:'duplicate'});
  await submitAuth('vi','register',{},data);
  expect(mock.authenticate.mock.calls[0][1]).not.toHaveProperty('role');
 });
 it('sets a bounded HttpOnly SameSite session and revokes the previous session before redirecting',async()=>{
  const expires=new Date('2026-10-20T00:00:00Z');mock.cookie.get.mockReturnValue({value:'a'.repeat(64)});
  mock.authenticate.mockResolvedValue({user:{id:'1',name:'Person',email:'person@example.com'},token:'b'.repeat(64),expires});
  await expect(submitAuth('en','login',{},form())).rejects.toThrow('NEXT_REDIRECT');
  expect(mock.revoke).toHaveBeenCalledOnce();
  expect(mock.cookie.set).toHaveBeenCalledWith('vpi_session','b'.repeat(64),expect.objectContaining({httpOnly:true,sameSite:'lax',path:'/',expires}));
  expect(mock.redirect).toHaveBeenCalledWith('/en');
 });
 it('returns a safe error on a database failure without setting a session',async()=>{
  mock.authenticate.mockRejectedValue(Error('secret connection string'));
  const result=await submitAuth('vi','login',{},form());
  expect(result.error).toBe('unavailable');expect(JSON.stringify(result)).not.toContain('secret');expect(mock.cookie.set).not.toHaveBeenCalled();
 });
 it('logout revokes the database session before deleting its cookie',async()=>{
  mock.cookie.get.mockReturnValue({value:'a'.repeat(64)});
  await expect(logout('vi')).rejects.toThrow('NEXT_REDIRECT');
  expect(mock.revoke).toHaveBeenCalledOnce();expect(mock.cookie.delete).toHaveBeenCalledWith('vpi_session');expect(mock.redirect).toHaveBeenCalledWith('/vi');
 });
 it('keeps the cookie when database revocation fails, allowing logout to be retried',async()=>{
  mock.cookie.get.mockReturnValue({value:'a'.repeat(64)});mock.revoke.mockRejectedValueOnce(Error('offline'));
  await expect(logout('vi')).rejects.toThrow('offline');expect(mock.cookie.delete).not.toHaveBeenCalled();
 });
});
