import {readFileSync} from 'node:fs';
import {expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({sql:vi.fn().mockResolvedValue([{id:'stored'}])}));
vi.mock('server-only',()=>({}));vi.mock('../src/lib/db',()=>({getDb:()=>mock.sql}));
import {savePhpDay} from '../src/lib/php/repository';
import {parseHaiphongPlan} from '../src/lib/php/parse';
it('does not strip regional events or source HTML at the persistence boundary',async()=>{
 const full=parseHaiphongPlan(readFileSync('data/sources/php-plan-2026-10-13.html','utf8'),'2026-10-13');
 await savePhpDay(full);const values=mock.sql.mock.calls[0].slice(1);
 expect(values).toContain(full.rawHtml);
 const serialized=values.find(v=>typeof v==='string'&&v.startsWith('[{'));
 expect(typeof serialized).toBe('string');const rows=JSON.parse(serialized as string);
 expect(rows.length).toBe(full.events.length);expect(rows.some((e:{movement:string})=>e.movement==='transit')).toBe(true);
});
