import {readFileSync} from 'node:fs';
import {afterEach,expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {GET} from '../src/app/api/shipping-lines/route';
import {collectShipping} from '../src/lib/shipping/collect';
import {ALPHALINER_API} from '../src/lib/shipping/source';
const payload=JSON.parse(readFileSync('data/sources/alphaliner-public-api-2026-10-13.json','utf8'));
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
it('fetches a fresh, validated top ten on every public request without using the database',async()=>{
 vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-10-16T18:00:00Z'));
 const fetcher=vi.fn().mockImplementation(async()=>Response.json(payload));vi.stubGlobal('fetch',fetcher);
 for(let i=0;i<2;i++){
  const response=await GET(new Request('https://example.test/api/shipping-lines'));
  expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toContain('no-store');
  const data=await response.json();expect(data.entries).toHaveLength(10);expect(data.carriers).toHaveLength(10);expect(data.asOf).toBe('2026-10-17');expect(data.savedCopy).toBeUndefined();
 }
 expect(fetcher).toHaveBeenCalledTimes(2);
 expect(fetcher.mock.calls[0]).toEqual([ALPHALINER_API,expect.objectContaining({method:'POST',cache:'no-store',redirect:'error',signal:expect.any(AbortSignal)})]);
});
it('returns a safe error instead of silently falling back to stored rankings',async()=>{
 for(const response of [new Response('private source details',{status:503}),Response.json([]),Response.json(payload.slice(0,1))]){
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response));
  const result=await GET(new Request('https://example.test/api/shipping-lines'));
  expect(result.status).toBe(502);expect(result.headers.get('cache-control')).toContain('no-store');expect(await result.json()).toEqual({error:'Shipping source unavailable. Please try again.'});
 }
});
it('rejects oversized source responses',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('x'.repeat(2_000_001))));
 expect((await GET(new Request('https://example.test/api/shipping-lines'))).status).toBe(502);
});

it('rejects unsupported sources before making a network request',async()=>{
 const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 await expect(collectShipping('http://localhost/')).rejects.toThrow('Unsupported shipping source');expect(fetcher).not.toHaveBeenCalled();
});
