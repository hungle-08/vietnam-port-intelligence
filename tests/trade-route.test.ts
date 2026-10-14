import {afterEach,beforeEach,it,expect,vi} from 'vitest';
const mock=vi.hoisted(()=>({run:vi.fn()}));
vi.mock('../src/lib/trade/jobs',()=>({runTradeCron:mock.run}));
import {GET} from '../src/app/api/cron/vietnam-trade/route';
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('CRON_SECRET','test-secret');});afterEach(()=>vi.unstubAllEnvs());
it('blocks unauthenticated calls without running collection',async()=>{
 expect((await GET(new Request('https://example.test'))).status).toBe(401);expect(mock.run).not.toHaveBeenCalled();
});
it('returns uncached success and safe failures',async()=>{
 const request=()=>new Request('https://example.test',{headers:{authorization:'Bearer test-secret'}});
 mock.run.mockResolvedValue({status:'success',latestMonth:'2026-08'});const r=await GET(request());expect(r.status).toBe(200);expect(r.headers.get('cache-control')).toBe('no-store');
 mock.run.mockResolvedValue({status:'failed'});expect((await GET(request())).status).toBe(502);
 mock.run.mockRejectedValue(Error('private database info'));const error=await GET(request());expect(error.status).toBe(500);expect(await error.text()).not.toContain('private');
});
