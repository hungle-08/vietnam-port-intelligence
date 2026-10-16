import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {parseAlphalinerApi} from '../src/lib/shipping/collect';
import {ALPHALINER_PAGE} from '../src/lib/shipping/source';
const input={sourceUrl:ALPHALINER_PAGE};
describe('direct Alphaliner extraction',()=>{
 const payload=JSON.parse(readFileSync('data/sources/alphaliner-public-api-2026-10-13.json','utf8'));
 it('uses operated total and global share, records collection date without inventing source date',()=>{
  const s=parseAlphalinerApi(payload,new Date('2026-10-13T00:00:00Z'),input.sourceUrl);
  expect(s.entries).toHaveLength(10);expect(s.entries[0]).toMatchObject({carrierId:'msc',capacityTeu:7452694,shipCount:1016,sharePercent:21.5});
  expect(s.asOfBasis).toBe('retrieval-date');
 });
 it('rejects incomplete, unknown, repeated and inconsistent data',()=>{
  for(const mutate of [(x:typeof payload)=>x[0].result.pop(),(x:typeof payload)=>x[0].result[0].operator='unknown',(x:typeof payload)=>x[0].result[1].rank=1,(x:typeof payload)=>x[0].result[0].percent=35.8]){
   const x=structuredClone(payload);mutate(x);expect(()=>parseAlphalinerApi(x,new Date(),input.sourceUrl)).toThrow();
  }
 });
});
