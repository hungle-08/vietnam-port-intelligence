import {describe,it,expect} from 'vitest';
import {getTradeWindow} from '../src/lib/trade/aggregate';
const now=new Date('2026-10-14');
const data=Array.from({length:32},(_,i)=>{const d=new Date(Date.UTC(2024,i,1));return {period:d.toISOString().slice(0,7),exportsUsd:i+1,importsUsd:2*(i+1)};});
describe('fixed trade history windows',()=>{
 it('moves back exactly 12 months without overlapping and caps history navigation',()=>{
  const latest=getTradeWindow(data,'month',0,now),previous=getTradeWindow(data,'month',1,now),last=getTradeWindow(data,'month',2,now);
  expect([latest.start,latest.end]).toEqual(['2025-11','2026-10']);expect(latest.hasNext).toBe(false);expect(latest.hasPrevious).toBe(true);
  expect([previous.start,previous.end]).toEqual(['2024-11','2025-10']);expect(previous.hasNext).toBe(true);
  expect([last.start,last.end]).toEqual(['2023-11','2024-10']);expect(last.hasPrevious).toBe(false);expect(last.periods).toHaveLength(12);
 });
 it('moves back exactly 8 quarters and preserves missing labels in the last window',()=>{
  const latest=getTradeWindow(data,'quarter',0,now),last=getTradeWindow(data,'quarter',1,now);
  expect([latest.start,latest.end]).toEqual(['2025-Q1','2026-Q4']);expect(latest.periods).toHaveLength(8);
  expect([last.start,last.end]).toEqual(['2023-Q1','2024-Q4']);expect(last.hasPrevious).toBe(false);
  expect(last.periods[0].exportsUsd).toBeNull();
 });
 it('uses 5 calendar years and only renders available years within the window',()=>{
  const latest=getTradeWindow(data,'year',0,now);
  expect([latest.start,latest.end]).toEqual(['2022','2026']);expect(latest.periods.map(p=>p.id)).toEqual(['2024','2025','2026']);expect(latest.hasPrevious).toBe(false);
  const sparse=[{period:'2017-01',exportsUsd:3,importsUsd:4},...data];
  const historical=getTradeWindow(sparse,'year',1,now);
  expect([historical.start,historical.end]).toEqual(['2017','2021']);expect(historical.periods.map(p=>p.id)).toEqual(['2017']);expect(historical.hasPrevious).toBe(false);
 });
 it('sums all visible years, excludes future/current unpublished data and reports partial coverage',()=>{
  const window=getTradeWindow([...data,{period:'2027-01',exportsUsd:9999,importsUsd:9999},{period:'2026-10',exportsUsd:9999,importsUsd:9999}],'year',0,now);
  expect(window.exportsUsd).toBe(528);expect(window.importsUsd).toBe(1056);expect(window.balanceUsd).toBe(-528);expect(window.coverage).toBe(32);expect(window.expected).toBe(36);
  expect(window.periods.at(-1)!.state).toBe('partial');
 });
 it('does not allow history when there is no data and handles a gap between windows',()=>{
  const empty=getTradeWindow([],'year',0,now);expect(empty.periods).toEqual([]);expect(empty.hasPrevious).toBe(false);expect(empty.exportsUsd).toBeNull();
  const gap=getTradeWindow([{period:'2010-01',exportsUsd:1,importsUsd:2}],'year',1,now);
  expect(gap.periods).toEqual([]);expect(gap.hasPrevious).toBe(true);expect(gap.hasNext).toBe(true);
 });
 it('rejects negative/noninteger page numbers to prevent future navigation',()=>{
  expect(()=>getTradeWindow(data,'month',-1,now)).toThrow();expect(()=>getTradeWindow(data,'year',.5,now)).toThrow();
 });
});
