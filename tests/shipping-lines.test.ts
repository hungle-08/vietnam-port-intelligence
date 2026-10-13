import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {parseAlphalinerText,validateShippingSnapshot} from '../src/lib/shipping/parse';
const source=readFileSync('data/sources/alphaliner-2026-10-12.txt','utf8');
const options={sourceUrl:'https://alphaliner.axsmarine.com/PublicTop100/',retrievedAt:'2026-10-13T03:00:00Z',retrievalMethod:'web-search-index' as const};
describe('Shipping fleet snapshots',()=>{
 it('extracts the dated top ten, keeps capacity share separate from charter share',()=>{const s=parseAlphalinerText(source,options);expect(s.asOf).toBe('2026-10-12');expect(s.entries).toHaveLength(10);expect(s.entries[0]).toMatchObject({carrierId:'msc',rank:1,capacityTeu:7452694,shipCount:1016,sharePercent:21.5});expect(s.entries[9]).toMatchObject({carrierId:'zim',rank:10,capacityTeu:691560,shipCount:113,sharePercent:2});});
 it('rejects partial data rather than saving an incomplete top ten',()=>{expect(()=>parseAlphalinerText(source.replace(/^10\s*\|.*$/gm,''),options)).toThrow()});
 it('rejects mixed chart/detail fleet values',()=>{expect(()=>parseAlphalinerText(source.replace('7,452,694','7,400,000'),options)).toThrow()});
 it('rejects unknown dates, repeated ranks and invalid percentages',()=>{expect(()=>parseAlphalinerText(source.replace('12 Oct 2026','unknown'),options)).toThrow();const s=parseAlphalinerText(source,options);expect(()=>validateShippingSnapshot({...s,entries:s.entries.map((e,i)=>({...e,rank:i===1?1:e.rank}))})).toThrow();expect(()=>validateShippingSnapshot({...s,entries:s.entries.map((e,i)=>({...e,sharePercent:i===0?101:e.sharePercent}))})).toThrow()});
});
