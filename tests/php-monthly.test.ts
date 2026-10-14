import {describe,it,expect} from 'vitest';
import {aggregatePhpMonths,resolveReportYear} from '../src/lib/php/monthly';
const day=(date:string,dwt:number|null=100,available=true,missingDwt=0)=>({day:date,available,calls:available?1:null,dwt:available?dwt:null,missingDwt:available?missingDwt:null});
describe('PHP monthly report',()=>{
 it('returns twelve months, current month collecting, future months empty',()=>{
  const report=aggregatePhpMonths([day('2026-10-01'),day('2026-10-02',200),day('2026-11-01',999)],2026,'2026-10-13');
  expect(report.months).toHaveLength(12);expect(report.months[9]).toMatchObject({status:'collecting',dwt:300,calls:2,daysAvailable:2,daysExpected:13});
  expect(report.months[10]).toMatchObject({status:'future',dwt:null,calls:null});expect(report.totalDwt).toBe(300);
 });
 it('distinguishes complete, partial and absent historical months including leap years',()=>{
  const days=Array.from({length:29},(_,i)=>day(`2024-02-${String(i+1).padStart(2,'0')}`));
  const report=aggregatePhpMonths([...days,day('2024-03-01')],2024,'2026-10-13');
  expect(report.months[1]).toMatchObject({status:'complete',dwt:2900,daysExpected:29});expect(report.months[2].status).toBe('incomplete');expect(report.months[0]).toMatchObject({status:'no-data',dwt:null});
 });
 it('keeps missing DWT unknown and distinguishes a known zero',()=>{
  const report=aggregatePhpMonths([{...day('2026-01-01',0),calls:0},day('2026-02-01',null,true,1)],2026,'2026-10-13');
  expect(report.months[0].dwt).toBe(0);expect(report.months[1]).toMatchObject({dwt:null,missingDwt:1});expect(report.hasData).toBe(true);
  const empty=aggregatePhpMonths([day('2025-01-01',null,false)],2025,'2026-10-13');expect(empty.hasData).toBe(false);expect(empty.totalDwt).toBeNull();
 });
 it('uses Vietnam current year and ignores malformed year parameters',()=>{
  const now=new Date('2026-12-31T17:00:00Z');expect(resolveReportYear(undefined,now)).toBe(2027);expect(resolveReportYear('2025',now)).toBe(2025);
  for(const v of ['bad','2026x','99999',['2025','2026']])expect(resolveReportYear(v,now)).toBe(2027);
 });
});
