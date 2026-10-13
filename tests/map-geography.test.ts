import {describe,it,expect} from 'vitest';
import {archipelagos,mapFrame} from '../src/lib/ports/archipelagos';
import {getMapLocations} from '../src/lib/ports/domain';
import {readFileSync} from 'node:fs';
import type {PortRecord} from '../src/lib/ports/types';
describe('Reference map extent',()=>{
 it('contains named source-backed points for both archipelagos',()=>{expect(archipelagos.map(a=>a.name)).toEqual(['Hoàng Sa','Trường Sa']);for(const a of archipelagos){expect(a.points.length).toBeGreaterThan(2);expect(a.source).toContain('.gov.vn/')}});
 it('fits all port points, island references and labels at the initial Mercator scale',()=>{
  const ports=JSON.parse(readFileSync('data/port-investments.json','utf8')) as PortRecord[];
  const points=[...getMapLocations(ports).map(p=>[p.longitude,p.latitude]),...archipelagos.flatMap(a=>[a.label,...a.points.map(p=>p.coordinates)])];
  const radians=Math.PI/180;const merc=(lat:number)=>Math.log(Math.tan(Math.PI/4+lat*radians/2));
  for(const [lon,lat] of points){const x=mapFrame.width/2+mapFrame.scale*(lon-mapFrame.center[0])*radians;const y=mapFrame.height/2-mapFrame.scale*(merc(lat)-merc(mapFrame.center[1]));expect(x).toBeGreaterThan(35);expect(x).toBeLessThan(mapFrame.width-35);expect(y).toBeGreaterThan(65);expect(y).toBeLessThan(mapFrame.height-70)}
 });
});
