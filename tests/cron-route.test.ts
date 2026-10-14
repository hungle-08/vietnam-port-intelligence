import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const mock=vi.hoisted(()=>({run:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('../src/lib/cron/runner',()=>({runShippingCron:mock.run}));
import {GET} from '../src/app/api/cron/shipping-lines/route';
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('CRON_SECRET','test-only-secret');});
afterEach(()=>vi.unstubAllEnvs());
it('rejects missing and wrong credentials before accessing jobs',async()=>{
 for(const headers of [new Headers(),new Headers({authorization:'Bearer wrong'})]){const response=await GET(new Request('https://example.test/api/cron/shipping-lines',{headers}));expect(response.status).toBe(401);}
 expect(mock.run).not.toHaveBeenCalled();
});
it('does not cache authorized skips and returns a successful response',async()=>{
 mock.run.mockResolvedValue({status:'skipped'});const response=await GET(new Request('https://example.test/api/cron/shipping-lines',{headers:{authorization:'Bearer test-only-secret'}}));expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toBe('no-store');expect(await response.json()).toEqual({status:'skipped'});
});
it('reports collection and database failures with safe response bodies',async()=>{
 const request=()=>new Request('https://example.test/api/cron/shipping-lines',{headers:{authorization:'Bearer test-only-secret'}});
 mock.run.mockResolvedValue({status:'failed'});expect((await GET(request())).status).toBe(502);
 mock.run.mockRejectedValue(Error('private database details'));const response=await GET(request());expect(response.status).toBe(500);expect(await response.text()).not.toContain('private');
});
