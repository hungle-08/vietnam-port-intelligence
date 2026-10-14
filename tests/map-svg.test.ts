import {it,expect} from 'vitest';
import {svgNumber} from '../src/lib/ports/svg';
it('serializes projected SVG coordinates identically across server/browser floating point noise',()=>{
 expect(svgNumber(488.1315759471977)).toBe(svgNumber(488.1315759471979));
 expect(svgNumber(240.7736379006842)).toBe(svgNumber(240.77363790068398));
 expect(svgNumber(488.1315759471977)).toBe(488.132);
});
