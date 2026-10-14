import {readFileSync} from 'node:fs';
import {load} from 'cheerio';
import {describe,it,expect} from 'vitest';
import {parsePhpPlan,parseVietnamNumber,summarizePhp} from '../src/lib/php/parse';
import {vietnamDay,sourceOffset,nextDailyRun,validatePhpConfig} from '../src/lib/php/config';
const oct=readFileSync('data/sources/php-plan-2026-10-13.html','utf8');
const jan=readFileSync('data/sources/php-plan-2026-01-01.html','utf8');
describe('PHP source parsing',()=>{
 it('validates all source sections but extracts only PHP arrivals and departures',()=>{
  const p=parsePhpPlan(oct,'2026-10-13');expect(p.events.filter(e=>e.movement==='arrival')).toHaveLength(5);expect(p.events.filter(e=>e.movement==='departure')).toHaveLength(3);expect(p.events.filter(e=>e.movement==='transfer')).toHaveLength(0);expect(p.events.filter(e=>e.movement==='transit')).toHaveLength(0);
  expect(p.events.find(e=>e.vesselName==='PROCYON LEADER')).toMatchObject({dwt:17361,gt:53645,toTerminal:'php-tan-vu',movement:'arrival',plannedTime:'03:30'});
 });
 it('supports historical January data without assuming today',()=>{const p=parsePhpPlan(jan,'2026-01-01');expect(p.events.filter(e=>e.movement==='arrival')).toHaveLength(8);expect(p.events.some(e=>e.fromTerminal==='php-chua-ve')).toBe(true);});
 it('deduplicates the same source event even if its row ordinal changes',()=>{
  const $=load(oct),row=$('#TD_ShowShipPlan_Roi table tr').eq(1),copy=row.clone();copy.find('td').eq(0).text('99');row.after(copy);
  const parsed=parsePhpPlan($.html(),'2026-10-13');expect(parsed.events).toHaveLength(8);expect(parsed.duplicateCount).toBe(1);expect(parsed.contentHash).toBe(parsePhpPlan(oct,'2026-10-13').contentHash);
 });
 it('rejects wrong dates, missing sections and changed headers',()=>{
  expect(()=>parsePhpPlan(oct,'2026-01-01')).toThrow();expect(()=>parsePhpPlan(oct.replace('TD_ShowShipPlan_Vao','changed'),'2026-10-13')).toThrow();expect(()=>parsePhpPlan(oct.replaceAll('<b>DWT</b>','<b>Unknown</b>'),'2026-10-13')).toThrow();
 });
 it('parses Vietnamese decimals and keeps missing numbers null',()=>{expect(parseVietnamNumber('213.970,8')).toBe(213970.8);expect(parseVietnamNumber('11.500')).toBe(11500);expect(parseVietnamNumber('')).toBeNull();expect(()=>parseVietnamNumber('abc')).toThrow();});
 it('counts only inbound events, keeps DVP/HTIT separate and does not multiply ownership',()=>{
  const p=parsePhpPlan(oct,'2026-10-13');expect(summarizePhp(p.events,'direct')).toMatchObject({calls:3,dwt:44315,missingDwt:0});expect(summarizePhp(p.events,'system')).toMatchObject({calls:5,dwt:84060,missingDwt:0});
  const e=p.events.find(e=>e.vesselName==='PROCYON LEADER')!;expect(summarizePhp([{...e,dwt:null}],'direct')).toMatchObject({calls:1,dwt:0,missingDwt:1});
 });
 it('does not match HAPAGENT or ambiguous substring terminal names as PHP',()=>{
  const p=parsePhpPlan(oct,'2026-10-13');expect(p.events.find(e=>e.fromName==='EURO DINH VU')?.fromTerminal).toBeUndefined();expect(p.events.find(e=>e.toName==='NAM DINH VU')?.toTerminal).toBeUndefined();
 });
});
describe('Vietnam daily collection schedule',()=>{
 it('uses Vietnam date around midnight and validates relative source offsets',()=>{const now=new Date('2026-10-13T17:00:00Z');expect(vietnamDay(now)).toBe('2026-10-14');expect(sourceOffset('2026-01-01',new Date('2026-10-13T00:00:00Z'))).toBe(-285);expect(nextDailyRun(now,1)).toBe('2026-10-14T17:00:00.000Z');});
 it('rejects arbitrary URLs and non-Hobby timing inputs',()=>{expect(()=>validatePhpConfig({enabled:true,intervalDays:1,sourceUrl:'http://localhost',runHour:0})).toThrow();expect(()=>validatePhpConfig({enabled:true,intervalDays:1,sourceUrl:'https://cangvuhaiphong.gov.vn/ke-hoach-tau/',runHour:12})).toThrow();});
});

it('retains conflicting supplemental fields without counting duplicate DWT',()=>{
 const $=load(oct),row=$('#TD_ShowShipPlan_Roi table tr').eq(1),copy=row.clone();
 copy.find('td').eq(3).text('1,1');copy.find('td').eq(11).text('OTHER AGENT');row.after(copy);
 const p=parsePhpPlan($.html(),'2026-10-13');expect(p.events).toHaveLength(8);expect(p.duplicateCount).toBe(1);expect(p.events.find(e=>e.movement==='departure')?.supplementalVariants).toHaveLength(2);
 copy.find('td').eq(5).text('999.999');expect(()=>parsePhpPlan($.html(),'2026-10-13')).toThrow();
});
it('accepts an explicitly empty transit container but rejects missing containers',()=>{
 const $=load(oct);$('#TD_ShowShipPlan_QuaLuong').empty();expect(parsePhpPlan($.html(),'2026-10-13').events).toHaveLength(8);
 $('#TD_ShowShipPlan_QuaLuong').remove();expect(()=>parsePhpPlan($.html(),'2026-10-13')).toThrow();
});
it('rejects intervals that exceed the four-day refresh window',()=>{expect(()=>validatePhpConfig({enabled:true,intervalDays:5,sourceUrl:'https://cangvuhaiphong.gov.vn/ke-hoach-tau/',runHour:0})).toThrow();});
