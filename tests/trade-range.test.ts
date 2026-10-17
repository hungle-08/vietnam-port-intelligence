import {expect,it} from 'vitest';
import {tradeTimeline,yearRange,zoomRange,clampRange,DEFAULT_TRADE_RANGE} from '../src/lib/trade/range';
const data=[{period:'2021-11',exportsUsd:1,importsUsd:2},{period:'2026-01',exportsUsd:100,importsUsd:80},{period:'2026-02',exportsUsd:null,importsUsd:70},{period:'2026-03',exportsUsd:0,importsUsd:0},{period:'2027-01',exportsUsd:999,importsUsd:1}];
it('builds a gap-preserving timeline ending at the current period, with correct quarterly totals',()=>{
 const months=tradeTimeline(data,'month','2026-10-16');expect(months[0].period).toBe('2021-11');expect(months.at(-1)?.period).toBe('2026-10');expect(months).toHaveLength(60);
 expect(months.find(p=>p.period==='2026-02')).toMatchObject({exportsUsd:null,importsUsd:70,balanceUsd:null});
 const quarters=tradeTimeline(data,'quarter','2026-10-16');expect(quarters.at(-1)?.period).toBe('2026-Q4');expect(quarters.find(p=>p.period==='2026-Q1')).toMatchObject({exportsUsd:100,importsUsd:80,balanceUsd:20,coverage:2,expected:3});
});
it('selects recent N years or a specific calendar year, clamped to API history',()=>{
 const periods=tradeTimeline(data,'month','2026-10-16');expect(yearRange(periods,1)).toEqual([48,59]);expect(yearRange(periods,'all')).toEqual([0,59]);expect(yearRange(periods,5)).toEqual([0,59]);
 expect(yearRange(periods,'2026')).toEqual([50,59]);expect(yearRange(periods,'2021')).toEqual([0,1]);
 const quarters=tradeTimeline(data,'quarter','2026-10-16');const range=yearRange(quarters,2);expect(range[1]-range[0]+1).toBe(8);
 const years=tradeTimeline(data,'year','2026-10-16');const annual=yearRange(years,5);expect(annual[1]-annual[0]+1).toBe(5);
});
it('bounds zoom ranges, supports single-point history and zooms around a fixed anchor',()=>{
 expect(clampRange([-10,100],60)).toEqual([0,59]);expect(clampRange([5,5],60)).toEqual([5,5]);expect(clampRange([1,4],1)).toEqual([0,0]);
 const zoomed=zoomRange([20,39],.5,60);expect(zoomed[1]-zoomed[0]).toBeLessThan(19);expect(zoomed[0]).toBeGreaterThan(20);
 expect(zoomRange([0,59],2,60)).toEqual([0,59]);
});

it('defaults to 12 calendar months ending at the latest published month without skipping gaps',()=>{
 const rows=[{period:'2024-01',exportsUsd:1,importsUsd:2},{period:'2026-09',exportsUsd:3,importsUsd:4}];
 const periods=tradeTimeline(rows,'month','2026-10-16'),[start,end]=yearRange(periods,DEFAULT_TRADE_RANGE);
 expect(end-start+1).toBe(12);expect(periods[start].period).toBe('2025-10');expect(periods[end].period).toBe('2026-09');
 expect(yearRange(tradeTimeline(rows.slice(1),'month','2026-10-16'),DEFAULT_TRADE_RANGE)).toEqual([0,0]);
 expect(yearRange([],DEFAULT_TRADE_RANGE)).toEqual([0,0]);
});
