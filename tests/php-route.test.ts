import {afterEach,it,expect,vi} from 'vitest';
const mock=vi.hoisted(()=>({run:vi.fn()}));
vi.mock('../src/lib/php/jobs',()=>({runPhpDaily:mock.run}));
import {GET} from '../src/app/api/cron/php-vessel-plans/route';
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
it('checks the secret before touching PHP data',async()=>{vi.stubEnv('CRON_SECRET','test-only');expect((await GET(new Request('https://example.test'))).status).toBe(401);expect(mock.run).not.toHaveBeenCalled();});
it('responds without caching and exposes no database details on failure',async()=>{vi.stubEnv('CRON_SECRET','test-only');const req=()=>new Request('https://example.test',{headers:{authorization:'Bearer test-only'}});mock.run.mockResolvedValue({status:'skipped'});const r=await GET(req());expect(r.status).toBe(200);expect(r.headers.get('cache-control')).toBe('no-store');mock.run.mockRejectedValue(Error('private details'));const bad=await GET(req());expect(bad.status).toBe(500);expect(await bad.text()).not.toContain('private');});
