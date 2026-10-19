import {beforeEach,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({sql:vi.fn()}));
vi.mock('server-only',()=>({}));vi.mock('../src/lib/db',()=>({getDb:()=>mock.sql}));
import {getPhpTodayArrivals} from '../src/lib/php/repository';

beforeEach(()=>{vi.clearAllMocks();});

it('loads only planned arrivals to PHP terminals for the requested Vietnam day',async()=>{
 mock.sql.mockResolvedValueOnce([
  {available:true,observed_at:new Date('2026-10-18T00:15:00.000Z'),event_key:'arrival-1',vessel_name:'TAU A',planned_time:'07:30',dwt:'54321.500',from_name:'Cảng Singapore',to_terminal:'php-tan-vu'},
  {available:true,observed_at:new Date('2026-10-18T00:15:00.000Z'),event_key:'arrival-2',vessel_name:'TAU B',planned_time:null,dwt:null,from_name:'',to_terminal:'dvp-dinh-vu'},
 ]);

 const result=await getPhpTodayArrivals('2026-10-18');

 expect(result).toEqual({
  available:true,
  observedAt:'2026-10-18T00:15:00.000Z',
  arrivals:[
   {eventKey:'arrival-1',vesselName:'TAU A',plannedTime:'07:30',dwt:54321.5,fromName:'Cảng Singapore',toTerminal:'php-tan-vu'},
   {eventKey:'arrival-2',vesselName:'TAU B',plannedTime:null,dwt:null,fromName:null,toTerminal:'dvp-dinh-vu'},
  ],
 });

 const [template,...values]=mock.sql.mock.calls[0];
 const query=Array.from(template as TemplateStringsArray).join(' ');
 expect(query).toContain('d.plan_date=');
 expect(query).toContain("e.movement='arrival'");
 expect(query).toContain('e.to_terminal IN');
 expect(values).toEqual(expect.arrayContaining(['2026-10-18','php-tan-vu','php-hoang-dieu','php-chua-ve','php-htit','dvp-dinh-vu']));
});

it('distinguishes a missing daily plan from an available plan with no arrivals',async()=>{
 mock.sql.mockResolvedValueOnce([{available:false,observed_at:null,event_key:null,vessel_name:null,planned_time:null,dwt:null,from_name:null,to_terminal:null}]);
 await expect(getPhpTodayArrivals('2026-10-18')).resolves.toMatchObject({available:false,observedAt:null,arrivals:[]});

 mock.sql.mockResolvedValueOnce([{available:true,observed_at:new Date('2026-10-18T00:15:00.000Z'),event_key:null,vessel_name:null,planned_time:null,dwt:null,from_name:null,to_terminal:null}]);
 await expect(getPhpTodayArrivals('2026-10-18')).resolves.toMatchObject({available:true,observedAt:'2026-10-18T00:15:00.000Z',arrivals:[]});
});

it('rejects an invalid day before querying the database',async()=>{
 await expect(getPhpTodayArrivals('2026-02-30')).rejects.toThrow();
 expect(mock.sql).not.toHaveBeenCalled();
});
