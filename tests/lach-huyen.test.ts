import {expect,it} from 'vitest';
import {buildLachHuyenMonths,latestRegionalRange} from '../src/lib/php/lach-huyen';
it('keeps all available history, internal gaps and no future months',()=>{
 const rows=buildLachHuyenMonths([{period:'2023-01',days:31},{period:'2026-10',days:16},{period:'2026-11',days:1}],[],'2026-10-16');
 expect(rows).toHaveLength(46);expect(rows[0].period).toBe('2023-01');expect(rows.at(-1)?.period).toBe('2026-10');
 expect(rows[1].status).toBe('missing');expect(rows[1].ports[0].calls).toBeNull();
 expect(latestRegionalRange(rows.length)).toEqual({start:34,end:45});
});
it('clamps the initial 12-month range to available history and handles no data',()=>{
 expect(latestRegionalRange(10)).toEqual({start:0,end:9});
 expect(latestRegionalRange(12)).toEqual({start:0,end:11});
 expect(latestRegionalRange(0)).toEqual({start:0,end:0});
 expect(buildLachHuyenMonths([],[],'2026-10-16')).toEqual([]);
});
it('computes the fixed three-port denominator, does not ownership-weight HTIT and excludes anchorage names',()=>{
 const rows=buildLachHuyenMonths([{period:'2026-09',days:30}],[{period:'2026-09',name:'HICT',calls:2,dwt:100,missingDwt:0},{period:'2026-09',name:'HTIT',calls:1,dwt:100,missingDwt:0},{period:'2026-09',name:'HHIT',calls:1,dwt:200,missingDwt:0},{period:'2026-09',name:'LACH HUYEN 1',calls:100,dwt:999999,missingDwt:0}],'2026-10-16');
 const month=rows.find(m=>m.period==='2026-09')!;expect(month.status).toBe('complete');expect(month.ports.map(p=>p.dwtShare)).toEqual([25,25,50]);expect(month.ports.map(p=>p.callShare)).toEqual([50,25,25]);
});
it('distinguishes actual zero from missing history and marks current or incomplete months',()=>{
 const rows=buildLachHuyenMonths([{period:'2026-09',days:29},{period:'2026-10',days:16}],[],'2026-10-16');
 expect(rows.at(-1)).toMatchObject({status:'current',daysAvailable:16,daysExpected:31});expect(rows.at(-1)?.ports[0]).toMatchObject({calls:0,dwt:0,dwtShare:null});expect(rows.at(-2)?.status).toBe('partial');
});
it('keeps missing DWT explicit and leaves DWT shares blank when the denominator is incomplete',()=>{
 const rows=buildLachHuyenMonths([{period:'2026-10',days:16}],[{period:'2026-10',name:'HICT',calls:1,dwt:null,missingDwt:1},{period:'2026-10',name:'HTIT',calls:1,dwt:50,missingDwt:0}],'2026-10-16');
 expect(rows.at(-1)?.ports.every(p=>p.dwtShare===null)).toBe(true);expect(rows.at(-1)?.ports[0].callShare).toBe(50);
});

it('uses calendar-month coverage even when all days so far have been collected',()=>{
 for(const [asOf,days,expected] of [['2026-10-16',16,31],['2028-02-16',16,29],['2026-02-28',28,28]] as const){
  const month=buildLachHuyenMonths([{period:asOf.slice(0,7),days}],[],asOf)[0];
  expect(month.daysExpected).toBe(expected);expect(month.status).toBe('current');
 }
});
