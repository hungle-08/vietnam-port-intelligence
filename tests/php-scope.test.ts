import {readFileSync} from 'node:fs';
import {load} from 'cheerio';
import {describe,it,expect} from 'vitest';
import {parsePhpPlan,summarizePhp} from '../src/lib/php/parse';
import {matchTerminal} from '../src/lib/php/directory';
import {isPhpPortMovement,scopePhpSnapshot} from '../src/lib/php/scope';
const html=readFileSync('data/sources/php-plan-2026-10-13.html','utf8');
describe('PHP-only storage',()=>{
 it('keeps only five PHP arrivals and three PHP departures from the full authority plan',()=>{
  const p=parsePhpPlan(html,'2026-10-13');expect(p.events).toHaveLength(8);expect(p.events.filter(e=>e.movement==='arrival')).toHaveLength(5);expect(p.events.filter(e=>e.movement==='departure')).toHaveLength(3);
  expect(p.events.every(isPhpPortMovement)).toBe(true);expect(p.rawHtml).not.toContain('BIENDONG STAR');expect(summarizePhp(p.events,'system')).toMatchObject({calls:5,dwt:84060});
 });
 it('checks the direction and exact whitelist, excluding transfers and transit',()=>{
  expect(isPhpPortMovement({movement:'arrival',toTerminal:'php-tan-vu',fromTerminal:null})).toBe(true);
  expect(isPhpPortMovement({movement:'departure',fromTerminal:'php-htit',toTerminal:null})).toBe(true);
  for(const e of [{movement:'arrival',fromTerminal:'php-tan-vu',toTerminal:null},{movement:'departure',toTerminal:'php-tan-vu',fromTerminal:null},{movement:'arrival',toTerminal:'nam-dinh-vu',fromTerminal:null},{movement:'transfer',fromTerminal:'php-chua-ve',toTerminal:'php-tan-vu'},{movement:'transit',fromTerminal:null,toTerminal:'php-tan-vu'}] as const)expect(isPhpPortMovement(e)).toBe(false);
 });
 it('ignores irrelevant capacity errors and scrubs source data at the persistence boundary',()=>{
  const $=load(html);$('#TD_ShowShipPlan_Roi table tr').slice(1).filter((_,r)=>!matchTerminal($(r).children('td').eq(9).text())).first().children('td').eq(5).text('NOT A NUMBER');
  expect(parsePhpPlan($.html(),'2026-10-13').events).toHaveLength(8);
  const p=parsePhpPlan(html,'2026-10-13'),fake={...p.events[0],key:'outside',movement:'arrival' as const,toTerminal:null,vesselName:'OUTSIDE VESSEL'};
  const scoped=scopePhpSnapshot({...p,rawHtml:'OUTSIDE RAW PAGE',events:[...p.events,fake]});expect(scoped.events).toHaveLength(8);expect(scoped.rawHtml).not.toContain('OUTSIDE');expect(scoped.contentHash).toBe(p.contentHash);
 });
});
