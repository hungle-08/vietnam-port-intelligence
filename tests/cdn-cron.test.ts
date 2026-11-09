import {describe,it,expect,vi,beforeEach} from 'vitest';
vi.mock('@/lib/cdn/jobs',()=>({runCdnDaily:vi.fn().mockResolvedValue({status:'success',saved:1,failed:0})}));
import {GET} from '../src/app/api/cron/cdn-arrivals/route';
import {runCdnDaily} from '../src/lib/cdn/jobs';
describe('CDN cron protection',()=>{beforeEach(()=>{process.env.CRON_SECRET='test-secret';vi.clearAllMocks()});
 it('rejects calls without the shared secret before collecting data',async()=>{const response=await GET(new Request('http://localhost/api/cron/cdn-arrivals'));expect(response.status).toBe(401);expect(runCdnDaily).not.toHaveBeenCalled()});
 it('runs authorized requests and prevents cached responses',async()=>{const response=await GET(new Request('http://localhost/api/cron/cdn-arrivals',{headers:{authorization:'Bearer test-secret'}}));expect(response.status).toBe(200);expect(response.headers.get('Cache-Control')).toBe('no-store');expect(runCdnDaily).toHaveBeenCalledOnce()});
});
