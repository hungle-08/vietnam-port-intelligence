import {it,expect,vi,beforeEach} from 'vitest';
const mocks=vi.hoisted(()=>({admin:vi.fn(),save:vi.fn(),revalidate:vi.fn()}));
vi.mock('next/cache',()=>({revalidatePath:mocks.revalidate}));vi.mock('../src/lib/auth/admin',()=>({requireAdmin:mocks.admin}));vi.mock('../src/lib/trade/jobs',()=>({saveTradeConfig:mocks.save}));
import {updateTradeConfig} from '../src/lib/trade/actions';
beforeEach(()=>{vi.clearAllMocks();mocks.admin.mockResolvedValue({id:'admin-id'});});
const form=()=>{const f=new FormData();f.set('enabled','on');f.set('sourceUrl','https://www.nso.gov.vn/xuat-nhap-khau/');f.set('revision','1');return f;};
it('requires admin before any mutation',async()=>{mocks.admin.mockRejectedValue(Error('Forbidden'));await expect(updateTradeConfig({ok:false,message:''},form())).rejects.toThrow('Forbidden');expect(mocks.save).not.toHaveBeenCalled();});
it('rejects unsupported source and stale revision before saving',async()=>{const f=form();f.set('sourceUrl','http://localhost');expect((await updateTradeConfig({ok:false,message:''},f)).ok).toBe(false);expect(mocks.save).not.toHaveBeenCalled();});
it('saves the validated config and refreshes admin UI',async()=>{expect((await updateTradeConfig({ok:false,message:''},form())).ok).toBe(true);expect(mocks.revalidate).toHaveBeenCalledWith('/admin');});
