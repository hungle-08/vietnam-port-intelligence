import {it,expect,vi,afterEach} from 'vitest';
import {readFileSync} from 'node:fs';
vi.mock('server-only',()=>({}));
import {collectPhpDay} from '../src/lib/php/collect';
import {PHP_SOURCE} from '../src/lib/php/config';
afterEach(()=>vi.unstubAllGlobals());
it('still collects a valid PHP plan after the schedule changes to 07:00',async()=>{
 const fetcher=vi.fn(async()=>new Response(readFileSync('data/sources/php-plan-2026-10-13.html','utf8')));
 vi.stubGlobal('fetch',fetcher);
 const snapshot=await collectPhpDay('2026-10-13',PHP_SOURCE);
 expect(snapshot.events.length).toBeGreaterThan(0);expect(fetcher).toHaveBeenCalled();
});
