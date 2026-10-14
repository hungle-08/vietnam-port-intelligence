import {beforeEach,it,expect,vi} from 'vitest';
const mock=vi.hoisted(()=>({requireAdmin:vi.fn(),save:vi.fn(),revalidate:vi.fn()}));
vi.mock('../src/lib/auth/admin',()=>({requireAdmin:mock.requireAdmin}));
vi.mock('../src/lib/cron/repository',()=>({saveShippingJobConfig:mock.save}));
vi.mock('next/cache',()=>({revalidatePath:mock.revalidate}));
import {updateShippingConfig} from '../src/lib/cron/actions';
function form(){const f=new FormData();f.set('enabled','on');f.set('intervalMonths','1');f.set('dayOfMonth','1');f.set('sourceUrl','https://alphaliner.axsmarine.com/PublicTop100/');f.set('revision','1');return f;}
beforeEach(()=>{vi.clearAllMocks();mock.requireAdmin.mockResolvedValue({id:'trusted-admin',role:'admin'});mock.save.mockResolvedValue(undefined);});
it('requires server-side admin authorization before writing configuration',async()=>{
 mock.requireAdmin.mockRejectedValue(Error('Forbidden'));await expect(updateShippingConfig({ok:false,message:''},form())).rejects.toThrow('Forbidden');expect(mock.save).not.toHaveBeenCalled();
});
it('rejects unsupported sources without touching the database',async()=>{
 const f=form();f.set('sourceUrl','http://127.0.0.1/admin');expect((await updateShippingConfig({ok:false,message:''},f)).ok).toBe(false);expect(mock.save).not.toHaveBeenCalled();
});
it('saves validated values with trusted admin identity and refreshes the admin page',async()=>{
 const f=form();f.set('userId','attacker');const result=await updateShippingConfig({ok:false,message:''},f);expect(result.ok).toBe(true);
 expect(mock.save).toHaveBeenCalledWith({enabled:true,intervalMonths:1,dayOfMonth:1,sourceUrl:'https://alphaliner.axsmarine.com/PublicTop100/'},'trusted-admin',1);expect(mock.revalidate).toHaveBeenCalledWith('/admin');
});
it('returns a safe error when saving fails',async()=>{
 mock.save.mockRejectedValue(Error('secret database connection'));const result=await updateShippingConfig({ok:false,message:''},form());expect(result.ok).toBe(false);expect(result.message).not.toContain('secret');expect(mock.revalidate).not.toHaveBeenCalled();
});
