import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({sql:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('../src/lib/db',()=>({getDb:()=>mock.sql}));
import {runPhpDaily} from '../src/lib/php/jobs';
import {PHP_SOURCE,addDays} from '../src/lib/php/config';
const html=readFileSync('data/sources/php-plan-2026-10-13.html','utf8');
beforeEach(()=>{
 vi.clearAllMocks();vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-10-16T00:05:00Z'));
 mock.sql.mockImplementation(async(strings:TemplateStringsArray)=>{
  const query=strings.join('?');
  if(query.includes('WITH claim AS'))return [{revision:1,interval_days:1,source_url:PHP_SOURCE}];
  return [{id:'test-snapshot-or-run'}];
 });
});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it('runs the real cron collector/parser/persistence path for all four days without stripping non-PHP or transfer/transit rows',async()=>{
 const fetcher=vi.fn(async(input:URL|string)=>{
  const offset=Number(new URL(String(input)).searchParams.get('d'));
  const day=addDays('2026-10-16',offset),label=day.slice(8)+'/'+day.slice(5,7)+'/'+day.slice(0,4);
  return new Response(html.replaceAll('13/10/2026',label));
 });vi.stubGlobal('fetch',fetcher);
 expect(await runPhpDaily()).toEqual({status:'success',daysSaved:4});expect(fetcher).toHaveBeenCalledTimes(4);
 const saved=mock.sql.mock.calls.filter(([strings])=>(strings as TemplateStringsArray).join('?').includes('WITH owned AS'));
 expect(saved).toHaveLength(4);
 for(const args of saved){
  const values=args.slice(1);expect(values.some(value=>typeof value==='string'&&value.includes('TD_ShowShipPlan_Vao'))).toBe(true);
  const rows=JSON.parse(values.find(value=>typeof value==='string'&&value.startsWith('[{')) as string) as {movement:string;toTerminal:string|null}[];
  expect(new Set(rows.map(e=>e.movement))).toEqual(new Set(['arrival','departure','transfer','transit']));
  expect(rows.some(e=>e.movement==='arrival'&&e.toTerminal===null)).toBe(true);
 }
});
