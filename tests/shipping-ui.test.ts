import {describe,it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ShippingRankingSection} from '../src/components/home/shipping-ranking';
import snapshot from './fixtures/shipping/snapshot.json';
import {carriers} from '../src/lib/shipping/carriers';
import type {ShippingRanking} from '../src/lib/shipping/types';
const ranking={...snapshot,carriers} as ShippingRanking;
describe('Shipping capacity ranking UI',()=>{
 it('renders all ten in source order with a common 0–25% scale',()=>{const html=renderToStaticMarkup(createElement(ShippingRankingSection,{ranking:ranking,locale:'vi'}));expect(html.match(/class="shipping-row"/g)).toHaveLength(10);expect(html.match(/role="meter"/g)).toHaveLength(10);expect(html).toContain('width:86%');expect(html).toContain('width:8%');expect(html.indexOf('Mediterranean Shipping Company')).toBeLessThan(html.indexOf('ZIM Integrated Shipping Services'));});
 it('identifies collection time, source and the fleet-capacity metric',()=>{for(const locale of ['vi','en'] as const){const html=renderToStaticMarkup(createElement(ShippingRankingSection,{ranking:ranking,locale}));expect(html).toContain('12/10/2026');expect(html).toContain('Alphaliner TOP 100');expect(html).toContain(locale==='vi'?'Tải trực tiếp lúc':'Fetched at');expect(html).toContain(locale==='vi'?'không phải sản lượng':'not cargo throughput');}});

});
