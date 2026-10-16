import {readFileSync} from 'node:fs';
import {expect,it,vi,afterEach} from 'vitest';
import {parseHaiphongPlan,summarizePhp} from '../src/lib/php/parse';
import {isPhpPortMovement} from '../src/lib/php/scope';
vi.mock('server-only',()=>({}));
import {collectPhpDay} from '../src/lib/php/collect';
const html=readFileSync('data/sources/php-plan-2026-10-13.html','utf8');
afterEach(()=>vi.unstubAllGlobals());
it('retains every movement section and source HTML while PHP totals still count only five member ports',()=>{
 const full=parseHaiphongPlan(html,'2026-10-13');
 expect(full.events.length).toBeGreaterThan(8);expect(full.events.some(e=>!isPhpPortMovement(e))).toBe(true);
 expect(new Set(full.events.map(e=>e.movement))).toEqual(new Set(['arrival','departure','transfer','transit']));
 expect(full.rawHtml).toBe(html);expect(summarizePhp(full.events,'system')).toMatchObject({calls:5,dwt:84060,missingDwt:0});
 const transit=full.events.find(e=>e.movement==='transit')!;expect(transit.gt).toBeNull();expect(transit.rawCells).toHaveLength(10);
});
it('collects the full regional plan through the scheduled collection path',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(html)));
 const snapshot=await collectPhpDay('2026-10-13');expect(snapshot.rawHtml).toContain('TD_ShowShipPlan_Vao');expect(snapshot.events.some(e=>e.movement==='transfer')).toBe(true);
});
