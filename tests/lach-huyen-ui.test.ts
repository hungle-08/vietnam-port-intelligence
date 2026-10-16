import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {load} from 'cheerio';
import {expect,it} from 'vitest';
import {LachHuyenChart} from '../src/components/ports/lach-huyen-chart';
import {buildLachHuyenMonths} from '../src/lib/php/lach-huyen';
it('shows berth explanations, available months, no invented history and a fixed denominator',()=>{
 const months=buildLachHuyenMonths([{period:'2026-10',days:16}],[{period:'2026-10',name:'HTIT',calls:1,dwt:100,missingDwt:0}],'2026-10-16');
 const $=load(renderToStaticMarkup(createElement(LachHuyenChart,{locale:'vi',months})));
 expect($('.lh-port-key').text()).toContain('Lạch Huyện 3–4');expect($('.lh-port-key').text()).toContain('Bến số 1–2');expect($('.lh-port-key').text()).toContain('Bến số 5–6');
 expect($('.lh-month-heading select option')).toHaveLength(1);expect($('.lh-window').text()).toContain('10/2026 – 10/2026');
 expect($('.lh-footer').text()).not.toContain('tháng chưa có dữ liệu');expect($('.lh-reset').text()).toContain('12 tháng');expect($('.lh-footer').text()).toContain('Ẩn đường không làm thay đổi mẫu số');
 expect($('.lh-stat-grid').text()).toContain('100%');expect($('.lh-month-heading').text()).toContain('16/31');expect($('.lh-provisional').text()).toContain('10/2026');expect($('.lh-provisional').text()).toContain('100%');expect($('.lh-month-heading').text()).toContain('Đang cập nhật');
});
it('translates berth labels and renders the error without fabricated values',()=>{
 const $=load(renderToStaticMarkup(createElement(LachHuyenChart,{locale:'en',months:buildLachHuyenMonths([],[],'2026-10-16'),loadError:true})));
 expect($('.lh-port-key').text()).toContain('Berths 3–4');expect($('[role=alert]').text()).toContain('could not be loaded');expect($('.lh-stat-grid')).toHaveLength(0);
});

it('defaults to stacked columns and offers a line view in both languages',()=>{
 for(const [locale,stacked,line] of [['vi','Cột chồng','Đường'],['en','Stacked columns','Lines']] as const){
  const $=load(renderToStaticMarkup(createElement(LachHuyenChart,{locale,months:[]})));
  const buttons=$('.lh-chart-type button');
  expect(buttons).toHaveLength(2);
  expect(buttons.eq(0).text()).toBe(stacked);expect(buttons.eq(0).attr('aria-pressed')).toBe('true');
  expect(buttons.eq(1).text()).toBe(line);expect(buttons.eq(1).attr('aria-pressed')).toBe('false');
 }
});
