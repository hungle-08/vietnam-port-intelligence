import {describe,it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ShippingRankingSection} from '../src/components/home/shipping-ranking';
import {getSavedShippingRanking} from '../src/lib/shipping/saved';
describe('Shipping capacity ranking UI',()=>{
 it('renders all ten in source order with a common 0–25% scale',()=>{const html=renderToStaticMarkup(createElement(ShippingRankingSection,{ranking:getSavedShippingRanking(),locale:'vi'}));expect(html.match(/class="shipping-row"/g)).toHaveLength(10);expect(html.match(/role="meter"/g)).toHaveLength(10);expect(html).toContain('width:86%');expect(html).toContain('width:8%');expect(html.indexOf('Mediterranean Shipping Company')).toBeLessThan(html.indexOf('ZIM Integrated Shipping Services'));});
 it('identifies dates, saved data, source and the fleet-capacity metric',()=>{for(const locale of ['vi','en'] as const){const html=renderToStaticMarkup(createElement(ShippingRankingSection,{ranking:getSavedShippingRanking(),locale}));expect(html).toContain('12/10/2026');expect(html).toContain('Alphaliner TOP 100');expect(html).toContain(locale==='vi'?'Bản dữ liệu đã lưu':'Saved data snapshot');expect(html).toContain(locale==='vi'?'không phải sản lượng':'not cargo throughput');}});
 it('does not label the verified database view as a saved fallback',()=>{const html=renderToStaticMarkup(createElement(ShippingRankingSection,{ranking:{...getSavedShippingRanking(),savedCopy:false},locale:'vi'}));expect(html).not.toContain('Bản dữ liệu đã lưu');});
});
