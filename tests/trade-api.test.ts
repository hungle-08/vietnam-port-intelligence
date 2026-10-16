import {afterEach,expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {parseTradeResponse} from '../src/lib/trade/data';
import {fetchTradeData} from '../src/lib/trade/api';
const series=(id:number,observations:unknown[],extra={})=>({id,economy:'VN',frequency:'monthly',unit:'Triệu USD',transform:'none',hasMore:false,lastUpdated:'2026-10-03T06:45:00.000Z',observations,...extra});
const observation=(period:string,value:number|null)=>({date:period+'-01',period,value});
const payload=()=>({data:[series(22606,[observation('2026-02',1200),observation('2026-01',0)]),series(22603,[observation('2026-01',1000),observation('2026-02',null)])]});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('joins by calendar month rather than array order, converts million USD to USD and preserves zero/missing values',()=>{
 expect(parseTradeResponse(payload()).months).toEqual([{period:'2026-01',exportsUsd:1e9,importsUsd:0},{period:'2026-02',exportsUsd:null,importsUsd:1.2e9}]);
});
it('rejects wrong units, incomplete batches, truncated history and duplicate months',()=>{
 for(const extra of [{unit:'Tỷ USD'},{frequency:'annual'},{economy:'US'},{hasMore:true},{transform:'yoy'}])expect(()=>parseTradeResponse({data:[series(22603,[],extra),series(22606,[])]})).toThrow();
 expect(()=>parseTradeResponse({data:[series(22603,[])]})).toThrow();
 expect(()=>parseTradeResponse({data:[series(22603,[observation('2026-01',1),observation('2026-01',2)]),series(22606,[])]})).toThrow();
 for(const value of [-1,Infinity,'100'])expect(()=>parseTradeResponse({data:[series(22603,[{date:'2026-01-01',period:'2026-01',value}]),series(22606,[])]})).toThrow();
});
it('authenticates only in server headers and requests both series in one cached call',async()=>{
 vi.stubEnv('DLKT_API_KEY','test-private-key');const fetcher=vi.fn().mockResolvedValue(Response.json(payload()));vi.stubGlobal('fetch',fetcher);
 await fetchTradeData();expect(fetcher).toHaveBeenCalledTimes(1);
 const [url,options]=fetcher.mock.calls[0];expect(url).toContain('ids=22603,22606');expect(url).not.toContain('test-private-key');
 expect(options).toMatchObject({headers:{Authorization:'Bearer test-private-key'},redirect:'error',cache:'force-cache',next:{revalidate:86400}});
});
it('fails safely without leaking provider error bodies or credentials',async()=>{
 vi.stubEnv('DLKT_API_KEY','test-private-key');vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('sensitive provider error test-private-key',{status:429})));
 await expect(fetchTradeData()).rejects.toThrow('trade-api-unavailable');
 vi.stubEnv('DLKT_API_KEY','');await expect(fetchTradeData()).rejects.toThrow('trade-api-not-configured');
});
