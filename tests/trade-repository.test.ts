import {it,expect,vi} from 'vitest';
const mock=vi.hoisted(()=>({sql:vi.fn()}));
vi.mock('server-only',()=>({}));vi.mock('../src/lib/db',()=>({getDb:()=>mock.sql}));
import {getTradeDataset} from '../src/lib/trade/repository';
it('treats database calendar periods as dates, without local-to-UTC month shifts',async()=>{
 mock.sql.mockImplementation((parts:TemplateStringsArray)=>[{period:parts.join('').includes('period::text')?'2026-08-01':new Date('2026-07-31T17:00:00Z'),exports_usd:'54794764261.00',imports_usd:'54907979099.00',updated_at:'2026-10-14T08:00:00Z',source_url:'https://www.nso.gov.vn/'}]);
 const d=await getTradeDataset();expect(d.months[0].period).toBe('2026-08');
});
