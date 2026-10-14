import {describe,it,expect,vi,beforeEach} from 'vitest';
const collect=vi.hoisted(()=>vi.fn());
vi.mock('../src/lib/php/news/collect',()=>({collectPhpNews:collect}));
import {GET} from '../src/app/api/ports/PHP/news/route';
beforeEach(()=>collect.mockReset());
describe('PHP on-demand news route',()=>{
 it('rejects invalid calendar months without contacting sources',async()=>{
  const response=await GET(new Request('https://local.test/api/ports/PHP/news?month=2026-13'));
  expect(response.status).toBe(400);expect(collect).not.toHaveBeenCalled();
 });
 it('returns partial success uncached, passing the selected month and cancellation signal',async()=>{
  collect.mockResolvedValue({month:'2026-09',articles:[],sources:[{id:'cafef',status:'error'},{id:'haiphongport',status:'ok'}]});
  const request=new Request('https://local.test/api/ports/PHP/news?month=2026-09'),response=await GET(request);
  expect(response.status).toBe(200);expect(response.headers.get('Cache-Control')).toContain('no-store');
  expect(collect).toHaveBeenCalledWith('2026-09',request.signal);
 });
 it('reports all-source failures as unavailable rather than an empty successful month',async()=>{
  collect.mockResolvedValue({month:'2026-09',articles:[],sources:[{id:'cafef',status:'error'}]});
  expect((await GET(new Request('https://local.test/api/ports/PHP/news?month=2026-09'))).status).toBe(503);
 });
});
