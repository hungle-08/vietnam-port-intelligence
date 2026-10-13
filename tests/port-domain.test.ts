import { describe, expect, it } from 'vitest';
import { filterPorts, validatePort, clusterProjectedPorts } from '../src/lib/ports/domain';
import { isLocale, portName } from '../src/lib/i18n';
const port = { internalCode:'VN-SEA-I-001', nameVi:'Bến cảng Đình Vũ', nameEn:null, seaportName:'Hải Phòng', region:'north', latitude:20.8, longitude:106.7, officialCodes:[{type:'UN/LOCODE',scope:'location',value:'VNDVU',sourceUrl:'https://unlocode.unece.org'}] };
describe('port directory behavior', () => {
 it('finds accented names without accents and location codes',()=>{
  expect(filterPorts([port], 'dinh vu','all')).toHaveLength(1);
  expect(filterPorts([port], 'vndvu','all')).toHaveLength(1);
  expect(filterPorts([port], 'dinh vu','south')).toHaveLength(0);
 });
 it('keeps two terminals sharing a location code',()=>{
  expect(filterPorts([port,{...port, internalCode:'VN-SEA-I-002'}],'vndvu','all')).toHaveLength(2);
 });
 it('rejects missing coordinate pairs and out of range coordinates',()=>{
  expect(()=>validatePort({...port,latitude:null})).toThrow();
  expect(()=>validatePort({...port,latitude:100})).toThrow();
  expect(()=>validatePort({...port,latitude:null,longitude:null})).not.toThrow();
 });
 it('preserves all IDs in overlapping clusters and separates with zoom',()=>{
  const points=[{id:'a',x:10,y:10},{id:'b',x:11,y:11},{id:'c',x:200,y:200}];
  expect(clusterProjectedPorts(points,12).map(c=>c.ids)).toEqual([['a','b'],['c']]);
  expect(clusterProjectedPorts(points,0.5).map(c=>c.ids)).toEqual([['a'],['b'],['c']]);
 });
 it('validates locale and keeps official name when English is absent',()=>{
  expect(isLocale('en')).toBe(true); expect(isLocale('fr')).toBe(false);
  expect(portName(port,'en')).toBe('Bến cảng Đình Vũ');
 });
});
