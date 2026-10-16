import {it,expect,vi,beforeEach} from 'vitest';
const mock=vi.hoisted(()=>({sql:vi.fn()}));
vi.mock('server-only',()=>({}));vi.mock('../src/lib/db',()=>({getDb:()=>mock.sql}));
import {getPhpJob} from '../src/lib/php/jobs';
beforeEach(()=>{vi.clearAllMocks();mock.sql.mockResolvedValueOnce([{enabled:true,interval_days:1,run_hour:7,source_url:'https://cangvuhaiphong.gov.vn/ke-hoach-tau/',revision:2,next_run_at:'2026-10-17T00:00:00Z',updated_at:'2026-10-16T00:00:00Z'}]);});
it('returns the last cron start time without a history collection',async()=>{
 mock.sql.mockResolvedValueOnce([{started_at:'2026-10-16T01:18:00Z'}]);const result=await getPhpJob();
 expect(result.lastRunAt).toBe('2026-10-16T01:18:00.000Z');expect(result).not.toHaveProperty('runs');expect(result.config.runHour).toBe(7);
});
it('represents no cron runs as null rather than a snapshot or config update date',async()=>{
 mock.sql.mockResolvedValueOnce([]);expect((await getPhpJob()).lastRunAt).toBeNull();
});
