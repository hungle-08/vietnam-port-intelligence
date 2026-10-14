import {describe,expect,it} from 'vitest';
import {monthRange,newsTopic,parsePortNews,parseCafeNews,parseVietnamNews,mergeNews,safeArticleUrl} from '../src/lib/php/news/parse';
import {scanMonth} from '../src/lib/php/news/paging';
const article=(day:string,title='Cảng Hải Phòng',url=`https://haiphongport.com.vn/vi/tin-tuc/${day}.html`)=>({url,title,publishedDay:day,source:'haiphongport' as const,topic:'php' as const,imageUrl:null});
describe('PHP monthly news',()=>{
 it('validates months and handles leap-year boundaries',()=>{
  expect(monthRange('2024-02')).toEqual({start:'2024-02-01',end:'2024-02-29'});
  for(const month of ['2026-13','2026-00','26-10','2026-10-01'])expect(()=>monthRange(month)).toThrow();
 });
 it('recognizes PHP and port industry without matching PHP software or tourism',()=>{
  expect(newsTopic('PHP: Nghị quyết Hội đồng quản trị')).toBe('php');
  expect(newsTopic('Cảng Tân Vũ đón tuyến tàu mới')).toBe('php');
  expect(newsTopic('Sản lượng cảng biển tăng trưởng')).toBe('industry');
  expect(newsTopic('Du lịch Mù Cang Chải')).toBeNull();
  expect(newsTopic('Lập trình PHP và phát triển website')).toBeNull();
 });
 it('parses official port dates, resolves links and excludes unsafe links',()=>{
  const html='<div class="gd_post__item"><img src="/photo.jpg"><a class="gd_post__title" href="/vi/tin-tuc/a.html">Tin Cảng Hải Phòng</a><span class="gd_date_new">14/10/2026</span></div>';
  expect(parsePortNews(html)[0]).toMatchObject({url:'https://haiphongport.com.vn/vi/tin-tuc/a.html',publishedDay:'2026-10-14',topic:'php'});
  expect(safeArticleUrl('https://haiphongport.com.vn/vi/tuyen-dung-894/a.html','haiphongport')).toBeTruthy();
  expect(safeArticleUrl('javascript:alert(1)','haiphongport')).toBeNull();
  expect(safeArticleUrl('https://evil.test/a','cafef')).toBeNull();
 });
 it('parses CafeF PHP disclosures and related industry reporting with dates',()=>{
  const html='<div id="divEvents"><ul><li><a href="/du-lieu/PHP-1/a.chn?utm_source=x">PHP: Báo cáo tháng</a> (01/10/2026 00:00)</li><li><a href="/cang-bien.chn">Hàng qua cảng tăng trưởng</a> (30/09/2026 16:00)</li></ul></div>';
  expect(parseCafeNews(html).map(p=>p.publishedDay)).toEqual(['2026-10-01','2026-09-30']);
  expect(parseCafeNews(html)[0].url).not.toContain('utm_source');
 });
 it('uses published timestamps in Vietnam timezone, not modified timestamps',()=>{
  const rows=[{title:'Cảng biển Hải Phòng',slug:'cang-bien-hai-phong',tsPublished:Date.parse('2026-09-30T18:00:00Z'),tsUpdated:Date.parse('2026-11-01T00:00:00Z'),thumbUrl:'https://vstatic.vietnam.vn/a.jpg'}];
  expect(parseVietnamNews(rows)[0]).toMatchObject({publishedDay:'2026-10-01',source:'vietnam'});
 });
 it('filters the selected calendar month, deduplicates syndicated titles and sorts newest first',()=>{
  const rows=[article('2026-10-01'),article('2026-10-02','Tàu cập cảng'),{...article('2026-10-01'),source:'vietnam' as const,url:'https://www.vietnam.vn/duplicate'},article('2026-09-30')];
  const merged=mergeNews(rows,'2026-10');expect(merged).toHaveLength(2);expect(merged[0].publishedDay).toBe('2026-10-02');expect(merged[1].source).toBe('haiphongport');
 });
 it('finds old months through paginated archives and includes the entire matching month',async()=>{
  const pages=[[article('2026-12-01')],[article('2026-11-01')],[article('2026-10-31')],[article('2026-10-01')],[article('2026-09-30')]];
  const result=await scanMonth(async n=>pages[n-1]??[],'2026-10',20);
  expect(result.complete).toBe(true);expect(result.articles.map(p=>p.publishedDay)).toEqual(['2026-10-31','2026-10-01']);
 });
 it('continues across pages with no relevant stories using the original source dates',async()=>{
  const result=await scanMonth(async n=>n===1?{articles:[],days:['2026-10-12']}:n===2?{articles:[article('2026-10-05')],days:['2026-10-05','2026-09-30']}:{articles:[],days:[]},'2026-10',5);
  expect(result.complete).toBe(true);expect(result.articles).toHaveLength(1);
 });
 it('keeps collected news and reports incomplete coverage on page failure',async()=>{
  const result=await scanMonth(async n=>{if(n===1)return[article('2026-10-05')];throw Error('offline');},'2026-10',20);
  expect(result.complete).toBe(false);expect(result.articles).toHaveLength(1);
 });
 it('bounds requests instead of looping forever on a repeating upstream page',async()=>{
  let requests=0;const result=await scanMonth(async()=>{requests++;return[article('2026-10-05')];},'2026-10',5);
  expect(requests).toBeLessThanOrEqual(5);expect(result.complete).toBe(false);
 });
});
