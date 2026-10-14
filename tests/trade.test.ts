import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {parseTradeWorkbook,parseTradeTable,combineTradeMonths} from '../src/lib/trade/parse';
import {aggregateTrade,tradeGrowth} from '../src/lib/trade/aggregate';
import {discoverTradePage,discoverTradeFiles} from '../src/lib/trade/source';
import {validateTradeConfig,nextTradeRun} from '../src/lib/trade/config';

const table=(values:unknown[]= [1000,2000])=>[
 ['Trị giá và mặt hàng xuất khẩu sơ bộ các tháng năm 2026'],
 ['Tên hàng','Tháng 01','','Tháng 02','','2 tháng',''],
 ['','Lượng\n(Tấn)','Trị giá (1000 USD)','Lượng (Tấn)','Trị giá (1000 USD)','','Trị giá (1000 USD)'],
 ['Tổng số','',values[0],'',values[1],'',3000],
];
describe('official trade normalization',()=>{
 it('reads monthly total values in USD without counting cumulative or quantities',()=>{
  expect(parseTradeTable(table(),2026,'exports',new Date('2026-10-14'))).toEqual([{period:'2026-01',valueUsd:1000000},{period:'2026-02',valueUsd:2000000}]);
 });
 it('rejects missing numbers, wrong units, invalid totals and future months',()=>{
  expect(()=>parseTradeTable(table(['',2000]),2026,'exports')).toThrow();
  const wrong=table();wrong[2][2]='Trị giá (VND)';expect(()=>parseTradeTable(wrong,2026,'exports')).toThrow();
  expect(()=>parseTradeTable(table([1500,2000]),2026,'exports')).toThrow();
  expect(()=>parseTradeTable(table(),2026,'exports',new Date('2026-02-14'))).toThrow();
  expect(()=>parseTradeTable(table(),2025,'exports')).toThrow();
 });
 it('requires export and import files to contain identical contiguous months',()=>{
  const exp=[{period:'2026-01',valueUsd:1},{period:'2026-02',valueUsd:2}];
  expect(combineTradeMonths(exp,exp)).toEqual([{period:'2026-01',exportsUsd:1,importsUsd:1},{period:'2026-02',exportsUsd:2,importsUsd:2}]);
  expect(()=>combineTradeMonths(exp,exp.slice(1))).toThrow();
 });
 it('reads actual official XLS binary fixtures through August 2026',()=>{
  const exp=parseTradeWorkbook(readFileSync('tests/fixtures/trade/exports-2026.xls'),2026,'exports',new Date('2026-10-14'));
  const imp=parseTradeWorkbook(readFileSync('tests/fixtures/trade/imports-2026.xls'),2026,'imports',new Date('2026-10-14'));
  expect(exp).toHaveLength(8);expect(imp).toHaveLength(8);
  expect(exp[0]).toEqual({period:'2026-01',valueUsd:43302753778});
  expect(imp[7]).toEqual({period:'2026-08',valueUsd:54907979099});
 });
});
describe('trade source boundaries',()=>{
 it('discovers actual official links and rejects external/file lookalikes',()=>{
  const page='https://www.nso.gov.vn/du-lieu-va-so-lieu-thong-ke/2026/03/so-lieu-xuat-nhap-khau-cac-thang-nam-2026/';
  expect(discoverTradePage(`<a href="${page}">2026</a>`,2026)).toBe(page);
  expect(()=>discoverTradePage(`<a href="https://evil.test/${page}">2026</a>`,2026)).toThrow();
  const exp='https://www.nso.gov.vn/wp-content/uploads/2026/03/V01-2026-6.xls',imp=exp.replace('V01','V02');
  expect(discoverTradeFiles(`<a href="${exp}">X</a><a href="${imp}">N</a>`,2026)).toEqual({exportsUrl:exp,importsUrl:imp});
  expect(()=>discoverTradeFiles(`<a href="https://evil.test/V01-2026-6.xls">X</a>`,2026)).toThrow();
 });
 it('only accepts the supported source',()=>{
  expect(validateTradeConfig({enabled:true,sourceUrl:'https://www.nso.gov.vn/xuat-nhap-khau/'}).enabled).toBe(true);
  expect(()=>validateTradeConfig({enabled:true,sourceUrl:'http://localhost'})).toThrow();
 });
 it('runs monthly on day 25 after publication, including year rollover',()=>{
  expect(nextTradeRun(new Date('2026-10-14T00:00:00Z')).toISOString()).toBe('2026-10-25T01:00:00.000Z');
  expect(nextTradeRun(new Date('2026-10-25T01:30:00Z')).toISOString()).toBe('2026-11-25T01:00:00.000Z');
  expect(nextTradeRun(new Date('2026-12-25T01:00:00Z')).toISOString()).toBe('2027-01-25T01:00:00.000Z');
 });
});
const months=[{period:'2026-01',exportsUsd:10,importsUsd:12},{period:'2026-02',exportsUsd:20,importsUsd:18},{period:'2026-03',exportsUsd:30,importsUsd:20},{period:'2026-04',exportsUsd:40,importsUsd:50}];
describe('month/quarter/year chart semantics',()=>{
 it('renders the current month and 11 previous months, leaving unpublished periods null',()=>{
  const result=aggregateTrade(months,'month',0,new Date('2026-05-14'));
  expect(result).toHaveLength(12);expect(result[0].id).toBe('2025-06');expect(result.at(-1)!.id).toBe('2026-05');
  expect(result.find(p=>p.id==='2026-01')!.balanceUsd).toBe(-2);expect(result.at(-1)!.exportsUsd).toBeNull();
 });
 it('renders the current quarter and 7 previous quarters, with partial quarters labeled',()=>{
  const result=aggregateTrade(months,'quarter',0,new Date('2026-05-14'));
  expect(result).toHaveLength(8);expect(result[0].id).toBe('2024-Q3');expect(result.at(-1)!.id).toBe('2026-Q2');
  expect(result.find(p=>p.id==='2026-Q1')).toMatchObject({exportsUsd:60,importsUsd:50,coverage:3,state:'complete'});
  expect(result.at(-1)).toMatchObject({exportsUsd:40,coverage:1,state:'partial'});
  expect(result[0].exportsUsd).toBeNull();
 });
 it('does not hide gaps in an aggregated period',()=>{
  const r=aggregateTrade([months[0],months[2]],'quarter',0,new Date('2026-05-14'));
  const quarter=r.find(p=>p.id==='2026-Q1')!;expect(quarter.state).toBe('partial');expect(quarter.coverage).toBe(2);
 });
 it('compares exactly matching published months and rejects zero baseline',()=>{
  const previous=months.map(m=>({...m,period:m.period.replace('2026','2025'),exportsUsd:m.exportsUsd/2}));
  const p=aggregateTrade(months,'quarter',0,new Date('2026-05-14')).at(-1)!;
  expect(tradeGrowth([...months,...previous],p,'exportsUsd')).toBe(100);
  expect(tradeGrowth([...months,...previous.filter(m=>!m.period.endsWith('04'))],p,'exportsUsd')).toBeNull();
  expect(tradeGrowth([{period:'2025-04',exportsUsd:0,importsUsd:0},...months],p,'exportsUsd')).toBeNull();
 });
 it('anchors latest periods to today in Vietnam',()=>{
  const now=new Date('2026-10-14');
  const m=aggregateTrade(months,'month',0,now),q=aggregateTrade(months,'quarter',0,now);
  expect(m.map(p=>p.id)).toEqual(['2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10']);
  expect(q.map(p=>p.id)).toEqual(['2025-Q1','2025-Q2','2025-Q3','2025-Q4','2026-Q1','2026-Q2','2026-Q3','2026-Q4']);
  const jan=aggregateTrade([],'month',0,new Date('2025-12-31T18:00:00Z'));
  expect(jan[0].id).toBe('2025-02');expect(jan.at(-1)!.id).toBe('2026-01');
 });
});
