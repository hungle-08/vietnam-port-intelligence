import {afterEach,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
vi.mock('server-only',()=>({}));
import {collectTrade} from '../src/lib/trade/collect';
import {TRADE_SOURCE} from '../src/lib/trade/config';
const page='https://www.nso.gov.vn/du-lieu-va-so-lieu-thong-ke/2026/03/so-lieu-xuat-nhap-khau-cac-thang-nam-2026/';
const exp='https://www.nso.gov.vn/wp-content/uploads/2026/03/V01-2026-6.xls',imp=exp.replace('V01','V02');
afterEach(()=>vi.unstubAllGlobals());
it('normalizes real source files and creates a stable release ID on repeated collection',async()=>{
 const fetcher=vi.fn(async(url:string)=>new Response(url===TRADE_SOURCE?`<a href="${page}">2026</a>`:url===page?`<a href="${exp}">X</a><a href="${imp}">N</a>`:readFileSync(`tests/fixtures/trade/${url===exp?'exports':'imports'}-2026.xls`)));
 vi.stubGlobal('fetch',fetcher);
 const [first]=await collectTrade([2026],TRADE_SOURCE,new Date('2026-10-14')),[second]=await collectTrade([2026],TRADE_SOURCE,new Date('2026-10-14'));
 expect(first.id).toBe(second.id);expect(first.months).toHaveLength(8);expect(first.months[7].period).toBe('2026-08');expect(first.months[7].exportsUsd).toBe(54794764261);
});
it('rejects unsupported sources without making outbound requests',async()=>{
 const f=vi.fn();vi.stubGlobal('fetch',f);await expect(collectTrade([2026],'http://localhost')).rejects.toThrow();expect(f).not.toHaveBeenCalled();
});
it('rejects incomplete file pairs and oversized responses instead of returning partial data',async()=>{
 vi.stubGlobal('fetch',async()=>new Response('bad',{headers:{'content-length':'99999999'}}));await expect(collectTrade([2026])).rejects.toThrow();
 vi.stubGlobal('fetch',async(url:string)=>new Response(url===TRADE_SOURCE?`<a href="${page}">2026</a>`:`<a href="${exp}">X</a>`));await expect(collectTrade([2026])).rejects.toThrow('pair');
});
