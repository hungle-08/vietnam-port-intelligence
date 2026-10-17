import {renderToStaticMarkup} from 'react-dom/server';
import {load} from 'cheerio';
import {expect,it} from 'vitest';
import {PhpDetailTabs} from '../src/components/ports/php-detail-tabs';
it('starts with the PHP overview and provides exactly six system tabs in a stable order',()=>{
 for(const locale of ['vi','en'] as const){
  const $=load(renderToStaticMarkup(<PhpDetailTabs locale={locale} terminalContent={{'php-htit':<div id="htit-content">Regional comparison</div>}}><div id="php-content">PHP report</div></PhpDetailTabs>));
  const tabs=$('.php-system-tab-list [role=tab]');
  expect(tabs).toHaveLength(6);expect(tabs.first().attr('aria-selected')).toBe('true');
  expect(tabs.map((_,el)=>$(el).text()).get()).toEqual(locale==='vi'?['Tổng quan PHP','Tân Vũ','Hoàng Diệu','Chùa Vẽ','HTIT','Đình Vũ']:['PHP overview','Tan Vu','Hoang Dieu','Chua Ve','HTIT','Dinh Vu']);
  expect($('#php-content')).toHaveLength(1);expect($('#htit-content')).toHaveLength(0);
 }
});
