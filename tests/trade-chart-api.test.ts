import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {load} from 'cheerio';
import {expect,it} from 'vitest';
import {TradeChart} from '../src/components/home/trade-chart';
const props={locale:'vi' as const,currentDay:'2026-10-16',dataset:{months:[{period:'2026-08',exportsUsd:5e9,importsUsd:8e9},{period:'2026-09',exportsUsd:10e9,importsUsd:9e9}],updatedAt:'2026-10-03T06:45:00Z'}};
it('offers year presets, calendar selection, zoom and three series without iframes or image downloads',()=>{
 const $=load(renderToStaticMarkup(createElement(TradeChart,props)));
 expect($('iframe')).toHaveLength(0);expect($('select[aria-label="Khoảng thời gian"] option[selected]').text()).toBe('12 tháng gần nhất');expect($('.trade-line-meta').text()).toContain('08/2026 – 09/2026');
 expect($('select[aria-label="Khoảng thời gian"] option').map((i,p)=>$(p).text()).get()).toEqual(['12 tháng gần nhất','2 năm','3 năm','5 năm','10 năm','Tất cả']);
 expect($('select[aria-label="Chọn năm"] option').last().text()).toBe('2026');
 expect($('button[aria-label="Phóng to khoảng thời gian"]').length).toBe(1);
 expect($('button[aria-label="Phóng lớn biểu đồ"]').length).toBe(1);
 expect($('button[aria-label*="Tải"]')).toHaveLength(0);
 expect($('.trade-line-legend').text()).toContain('Cán cân thương mại');
 expect($('.trade-point-summary').text()).toContain('+1');
 expect($('.trade-api-source a')).toHaveLength(2);
 expect($('.trade-a11y-range select').last().val()).toBe('1');
});
it('displays an honest error state without fake values or a chart when the API fails',()=>{
 const $=load(renderToStaticMarkup(createElement(TradeChart,{...props,dataset:undefined,loadError:true})));
 expect($('[role="alert"]').text()).toContain('Chưa tải được');expect($('svg.trade-lines')).toHaveLength(0);expect($('.trade-point-summary')).toHaveLength(0);
});
