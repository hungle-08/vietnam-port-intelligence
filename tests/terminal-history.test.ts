import {expect,it} from 'vitest';
import {buildTerminalHistory,terminalWindow} from '../src/lib/php/terminal-history';
it('keeps each terminal separate, includes only known PHP sites and preserves calendar gaps',()=>{
 const history=buildTerminalHistory([{period:'2025-01',days:31},{period:'2026-10',days:16}],[{period:'2026-10',terminalId:'php-tan-vu',calls:2,dwt:100,missingDwt:0},{period:'2026-10',terminalId:'php-htit',calls:1,dwt:200,missingDwt:0},{period:'2026-10',terminalId:'other',calls:9,dwt:9999,missingDwt:0}],'2026-10-16');
 expect(Object.keys(history)).toHaveLength(5);expect(history['php-tan-vu']).toHaveLength(22);expect(history['php-tan-vu'][1]).toMatchObject({status:'missing',dwt:null,calls:null});
 expect(history['php-tan-vu'].at(-1)).toMatchObject({dwt:100,calls:2,daysAvailable:16,daysExpected:31,status:'current'});expect(history['php-htit'].at(-1)?.dwt).toBe(200);expect(history['php-chua-ve'].at(-1)?.dwt).toBe(0);
 expect(terminalWindow(22)).toEqual({start:10,end:21});expect(terminalWindow(10)).toEqual({start:0,end:9});
});
it('does not turn missing DWT into zero or future coverage into history',()=>{
 const h=buildTerminalHistory([{period:'2026-09',days:29},{period:'2026-10',days:16},{period:'2026-11',days:1}],[{period:'2026-09',terminalId:'php-htit',calls:2,dwt:null,missingDwt:2}],'2026-10-16');
 expect(h['php-htit']).toHaveLength(2);expect(h['php-htit'][0]).toMatchObject({status:'partial',dwt:null,missingDwt:2});expect(buildTerminalHistory([],[],'2026-10-16')['php-htit']).toEqual([]);
});
