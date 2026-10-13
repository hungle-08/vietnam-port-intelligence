import {beforeEach,it,expect,vi} from 'vitest';
const mock=vi.hoisted(()=>({getCurrentUser:vi.fn(),redirect:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('../src/lib/auth/session',()=>({getCurrentUser:mock.getCurrentUser}));
vi.mock('next/navigation',()=>({redirect:mock.redirect}));
import {requireAdmin} from '../src/lib/auth/admin';
beforeEach(()=>{vi.clearAllMocks();mock.redirect.mockImplementation((path:string)=>{throw Error('redirect:'+path);});});
it('requires login for anonymous access to /admin',async()=>{
 mock.getCurrentUser.mockResolvedValue(null);await expect(requireAdmin()).rejects.toThrow('redirect:/vi/login');
});
it('rejects authenticated regular users',async()=>{
 mock.getCurrentUser.mockResolvedValue({id:'1',name:'User',email:'user@example.com',role:'user'});
 await expect(requireAdmin()).rejects.toThrow('redirect:/vi');
});
it('authorizes only the role returned by the server-side session lookup',async()=>{
 const user={id:'1',name:'Admin',email:'admin@example.com',role:'admin'};
 mock.getCurrentUser.mockResolvedValue(user);expect(await requireAdmin()).toEqual(user);expect(mock.redirect).not.toHaveBeenCalled();
});
