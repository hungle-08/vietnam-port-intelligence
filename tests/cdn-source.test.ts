import {describe,it,expect} from 'vitest';
import {parseCdnList,parseCdnDetail,tiensaBerth,monthsToFetch} from '../src/lib/cdn/source';

describe('Cảng Đà Nẵng vessel data',()=>{
 it('extracts distinct valid detail links and rejects unrelated URLs',()=>{
  const html='<h2>Tàu đang làm hàng</h2><a href="https://danangport.com/tra-cuu-tau-container/chi-tiet?vsl=A&amp;nam=2026&amp;seq=12">Chi tiết</a><a href="https://danangport.com/tra-cuu-tau-container/chi-tiet?seq=12&amp;vsl=A&amp;nam=2026">Chi tiết</a><a href="https://evil.example/tra-cuu-tau-container/chi-tiet?vsl=A&amp;nam=2026&amp;seq=1">Chi tiết</a>';
  expect(parseCdnList(html)).toEqual([{id:'2026:12:A',url:'https://danangport.com/tra-cuu-tau-container/chi-tiet?vsl=A&nam=2026&seq=12'}]);
 });
 it('parses actual berth time and handled TEU without confusing DWT',()=>{
  const html='<h2>VIETSUN HARMONY</h2><table><tr><th>Hãng tàu</th><td>VSL</td><th>Chuyến</th><td>V1634N</td></tr><tr><th>Containers</th><td>259</td><th>Cầu bến</th><td>TS1B</td></tr><tr><th>TEUs</th><td>400</td><th>Thời điểm cập cầu (ATB)<small>yyyy-mm-dd</small></th><td>2026-10-26 13:20</td></tr></table>';
  expect(parseCdnDetail(html)).toMatchObject({vesselName:'VIETSUN HARMONY',carrier:'VSL',voyage:'V1634N',berth:'TS1B',atb:'2026-10-26 13:20',teu:400,containers:259});
 });
 it('fails closed on unrecognized berth codes',()=>{expect(tiensaBerth('TS1B')).toBe(true);expect(tiensaBerth('TS03')).toBe(true);expect(tiensaBerth('TS04')).toBe(true);expect(tiensaBerth('TS05')).toBe(true);expect(tiensaBerth('TS07')).toBe(true);expect(tiensaBerth('LIEN CHIEU')).toBe(false);expect(tiensaBerth('TS99')).toBe(false)});
 it('covers overlapping departure months including next year',()=>{expect(monthsToFetch('2026-12-25','2027-01-05')).toEqual(['2026-12','2027-01','2027-02']);});
});
