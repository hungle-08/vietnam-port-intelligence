import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {load} from 'cheerio';
import {expect,it} from 'vitest';
import {PhpTodayArrivals} from '../src/components/ports/php-today-arrivals';

const arrivals=[
 {eventKey:'arrival-1',vesselName:'TAU A',plannedTime:'07:30',dwt:54321.5,fromName:'Cảng Singapore',toTerminal:'php-tan-vu'},
 {eventKey:'arrival-2',vesselName:'TAU B',plannedTime:null,dwt:null,fromName:null,toTerminal:'dvp-dinh-vu'},
];

it('renders today inbound calls with bilingual terminal names, DWT and source freshness',()=>{
 const $=load(renderToStaticMarkup(createElement(PhpTodayArrivals,{locale:'vi',day:'2026-10-18',data:{available:true,observedAt:'2026-10-18T00:15:00.000Z',arrivals}})));
 expect($('.php-today-arrivals h2').text()).toBe('Tàu dự kiến vào hôm nay');
 expect($('.php-today-arrivals-date').text()).toContain('18/10/2026');
 expect($('.php-today-arrivals table tbody tr')).toHaveLength(2);
 expect($('.php-today-arrivals table').text()).toContain('TAU A');
 expect($('.php-today-arrivals table').text()).toContain('Tân Vũ');
 expect($('.php-today-arrivals table').text()).toContain('Đình Vũ');
 expect($('.php-today-arrivals table').text()).toContain('54.321,5');
 expect($('.php-today-arrivals-updated').text()).toContain('07:15');
 expect($('.php-today-arrivals-source').attr('href')).toBe('https://cangvuhaiphong.gov.vn/ke-hoach-tau/');
});

it('separates a missing plan from a plan that has zero inbound calls',()=>{
 const missing=load(renderToStaticMarkup(createElement(PhpTodayArrivals,{locale:'vi',day:'2026-10-18',data:{available:false,observedAt:null,arrivals:[]}})));
 expect(missing('[role=status]').text()).toContain('Chưa có dữ liệu kế hoạch');
 const empty=load(renderToStaticMarkup(createElement(PhpTodayArrivals,{locale:'en',day:'2026-10-18',data:{available:true,observedAt:'2026-10-18T00:15:00.000Z',arrivals:[]}})));
 expect(empty('[role=status]').text()).toContain('No vessels are scheduled to arrive');
 expect(empty('table')).toHaveLength(0);
});

it('shows a separate bilingual error state when the daily lookup fails',()=>{
 for(const [locale,copy] of [['vi','Không thể tải danh sách tàu'],['en','Could not load today’s vessel list']] as const){
  const $=load(renderToStaticMarkup(createElement(PhpTodayArrivals,{locale,day:'2026-10-18',data:{available:false,observedAt:null,arrivals:[]},loadError:true})));
  expect($('[role=alert]').text()).toContain(copy);
  expect($('table')).toHaveLength(0);
 }
});
