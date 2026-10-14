import {describe,expect,it} from 'vitest';
import {aggregatePhpContributions,type DailyMetric} from '../src/lib/php/monthly';
const days:DailyMetric[]=[{day:'2026-01-01',available:true,calls:3,dwt:300,missingDwt:0},{day:'2026-01-02',available:true,calls:0,dwt:0,missingDwt:0}];
describe('PHP terminal contributions',()=>{
 it('reconciles five terminal stacks with PHP totals and keeps confirmed zero distinct from no data',()=>{
  const rows=[{day:'2026-01-01',terminalId:'php-tan-vu',calls:2,dwt:200,missingDwt:0},{day:'2026-01-01',terminalId:'dvp-dinh-vu',calls:1,dwt:100,missingDwt:0}];
  const result=aggregatePhpContributions(days,rows,2026,'2026-10-14');
  expect(result).toHaveLength(12);expect(result[0].sites).toHaveLength(5);
  expect(result[0].sites.reduce((s,t)=>s+(t.dwt??0),0)).toBe(300);
  expect(result[0].sites.reduce((s,t)=>s+(t.calls??0),0)).toBe(3);
  expect(result[0].sites.find(t=>t.id==='php-chua-ve')).toMatchObject({dwt:0,calls:0});
  expect(result[1].sites.every(t=>t.dwt===null&&t.calls===null)).toBe(true);
  expect(result[10]).toMatchObject({status:'future'});
  expect(result[10].sites.every(t=>t.dwt===null)).toBe(true);
 });
 it('ignores records outside coverage, selected year and as-of date without weighting ownership',()=>{
  const rows=[{day:'2026-01-01',terminalId:'php-htit',calls:1,dwt:100,missingDwt:0},{day:'2026-01-03',terminalId:'php-htit',calls:1,dwt:999,missingDwt:0},{day:'2025-01-01',terminalId:'php-htit',calls:1,dwt:999,missingDwt:0}];
  const result=aggregatePhpContributions(days,rows,2026,'2026-01-01');
  expect(result[0].sites.find(t=>t.id==='php-htit')?.dwt).toBe(100);
  expect(result[0].daysAvailable).toBe(1);
 });
 it('does not turn an unknown DWT into a known zero',()=>{
  const result=aggregatePhpContributions([{...days[0],dwt:null,missingDwt:1}], [{day:'2026-01-01',terminalId:'php-tan-vu',calls:1,dwt:null,missingDwt:1}],2026,'2026-10-14');
  expect(result[0].sites.find(t=>t.id==='php-tan-vu')).toMatchObject({dwt:null,calls:1,missingDwt:1});
 });
});
