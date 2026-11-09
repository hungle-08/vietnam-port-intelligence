import {describe,it,expect} from 'vitest';
import {parseVesselCandidates} from '../src/lib/cdn/dwt';
describe('CDN vessel matching',()=>{
 it('returns exact and former name candidates for review without trusting unrelated ships',()=>{
 const rows=[{name:'HAIAN BETA',imo:1234567,dwt:12000},{name:'NEW NAME',fka:['HAIAN BETA'],imo:7654321,dwt:15000},{name:'HAIAN BETAX',imo:1234568,dwt:99},{name:'HAIAN BETA',imo:null,dwt:0}];
 expect(parseVesselCandidates('Haian Beta',rows)).toEqual([{name:'HAIAN BETA',imo:'1234567',dwt:12000,match:'current'},{name:'NEW NAME',imo:'7654321',dwt:15000,match:'former'}]);
 });
});
