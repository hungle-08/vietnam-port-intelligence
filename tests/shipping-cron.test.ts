import {describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {nextMonthlyRun,validateCronConfig,authorizedCron} from '../src/lib/cron/config';
import {parseAlphalinerApi} from '../src/lib/shipping/collect';
import {runShippingCron} from '../src/lib/cron/runner';
const input={enabled:true,intervalMonths:1,dayOfMonth:1,sourceUrl:'https://alphaliner.axsmarine.com/PublicTop100/'};
describe('shipping schedule',()=>{
 it('uses Vietnam calendar, advances across years and skips current occurrence',()=>{
  expect(nextMonthlyRun(new Date('2026-10-13T00:00:00Z'),1,1).toISOString()).toBe('2026-11-01T00:00:00.000Z');
  expect(nextMonthlyRun(new Date('2026-12-28T00:00:00Z'),3,28).toISOString()).toBe('2027-03-28T00:00:00.000Z');
  expect(nextMonthlyRun(new Date('2026-10-31T18:00:00Z'),1,1).toISOString()).toBe('2026-11-01T00:00:00.000Z');
 });
 it('rejects invalid schedules and unsupported source URLs',()=>{
  expect(validateCronConfig(input)).toEqual(input);
  for(const changes of [{intervalMonths:0},{dayOfMonth:31},{sourceUrl:'http://localhost/'},{sourceUrl:input.sourceUrl+'?url=x'},{sourceUrl:'https://alphaliner.axsmarine.com.evil.test/PublicTop100/'}])expect(()=>validateCronConfig({...input,...changes})).toThrow();
 });
 it('rejects missing secrets and accepts only exact bearer credentials',()=>{
  expect(authorizedCron(null,undefined)).toBe(false);
  expect(authorizedCron('Bearer wrong','secret')).toBe(false);
  expect(authorizedCron('Bearer secret','secret')).toBe(true);
 });
});
describe('direct Alphaliner extraction',()=>{
 const payload=JSON.parse(readFileSync('data/sources/alphaliner-public-api-2026-10-13.json','utf8'));
 it('uses operated total and global share, records collection date without inventing source date',()=>{
  const s=parseAlphalinerApi(payload,new Date('2026-10-13T00:00:00Z'),input.sourceUrl);
  expect(s.entries).toHaveLength(10);expect(s.entries[0]).toMatchObject({carrierId:'msc',capacityTeu:7452694,shipCount:1016,sharePercent:21.5});
  expect(s.asOfBasis).toBe('retrieval-date');
 });
 it('rejects incomplete, unknown, repeated and inconsistent data',()=>{
  for(const mutate of [(x:typeof payload)=>x[0].result.pop(),(x:typeof payload)=>x[0].result[0].operator='unknown',(x:typeof payload)=>x[0].result[1].rank=1,(x:typeof payload)=>x[0].result[0].percent=35.8]){
   const x=structuredClone(payload);mutate(x);expect(()=>parseAlphalinerApi(x,new Date(),input.sourceUrl)).toThrow();
  }
 });
});
describe('scheduled execution',()=>{
 it('reports success only after persisting the complete snapshot',async()=>{
  const snapshot=parseAlphalinerApi(JSON.parse(readFileSync('data/sources/alphaliner-public-api-2026-10-13.json','utf8')),new Date(),input.sourceUrl);
  const job={id:'run',sourceUrl:input.sourceUrl},succeed=vi.fn(),fail=vi.fn();
  expect((await runShippingCron({claim:async()=>job,collect:async()=>snapshot,succeed,fail})).status).toBe('success');expect(succeed).toHaveBeenCalledWith(job,snapshot);expect(fail).not.toHaveBeenCalled();
 });
 it('does no network work when disabled/not due/already leased',async()=>{
  const collect=vi.fn();expect(await runShippingCron({claim:async()=>null,collect,succeed:vi.fn(),fail:vi.fn()})).toEqual({status:'skipped'});expect(collect).not.toHaveBeenCalled();
 });
 it('records failure without marking success or exposing remote messages',async()=>{
  const fail=vi.fn(),succeed=vi.fn();const job={id:'run',sourceUrl:input.sourceUrl};
  expect(await runShippingCron({claim:async()=>job,collect:async()=>{throw Error('private detail');},succeed,fail})).toEqual({status:'failed'});
  expect(succeed).not.toHaveBeenCalled();expect(fail).toHaveBeenCalledWith(job,'Không thể thu thập hoặc lưu dữ liệu hợp lệ. Hệ thống sẽ thử lại vào lượt kiểm tra tiếp theo.');
 });
});
