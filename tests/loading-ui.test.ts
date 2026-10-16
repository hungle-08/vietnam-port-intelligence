import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {load} from 'cheerio';
import {expect,it} from 'vitest';
import {PageSkeleton,ChartSkeleton,ShippingRankingSkeleton,NewsSkeleton} from '../src/components/loading/skeletons';
it('announces localized page loading once and hides decorative placeholders from assistive technology',()=>{
 for(const locale of ['vi','en'] as const)for(const variant of ['home','php','auth','admin'] as const){
  const $=load(renderToStaticMarkup(createElement(PageSkeleton,{locale,variant})));
  expect($('[role=status]')).toHaveLength(1);expect($('[role=status]').text()).toContain(locale==='vi'?'Đang tải':'Loading');
  expect($('[data-slot=skeleton]').length).toBeGreaterThan(0);
  expect($('[data-slot=skeleton]').toArray().every(el=>$(el).closest('[aria-hidden=true]').length>0)).toBe(true);
  expect($('button,input,select,a')).toHaveLength(0);
 }
});
it('provides meaningful accessible labels while chart, news and rankings are loading',()=>{
 for(const element of [createElement(ChartSkeleton,{locale:'en'}),createElement(ShippingRankingSkeleton,{locale:'en'}),createElement(NewsSkeleton,{locale:'en'})]){
  const $=load(renderToStaticMarkup(element));
  expect($('[role=status]')).toHaveLength(1);expect($('[role=status]').text()).toContain('Loading');
  expect($('[aria-busy=true]').length).toBeGreaterThan(0);expect($('canvas,meter,[role=meter]')).toHaveLength(0);
 }
});
