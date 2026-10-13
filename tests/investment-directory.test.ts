import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {filterPorts,validatePort,mapPorts,getMapLocations} from '../src/lib/ports/domain';
import type {PortRecord} from '../src/lib/ports/types';
const ports=JSON.parse(readFileSync('data/port-investments.json','utf8')) as PortRecord[];
describe('Investor port scope',()=>{
 it('places every non-holding watchlist entity on the approximate map',()=>{expect(mapPorts(ports)).toHaveLength(14);expect(getMapLocations(ports).some(p=>p.portId==='MVN')).toBe(false)});
 it('shows only the relevant Gemadept location when filtering regions',()=>{const points=getMapLocations(filterPorts(ports,'GMD','north'),'north');expect(points).toHaveLength(1);expect(points[0].region).toBe('north')});
 it('represents Gemadept in separate regions without inventing a head office port',()=>{const points=getMapLocations(ports).filter(p=>p.portId==='GMD');expect(new Set(points.map(p=>p.region))).toEqual(new Set(['north','central','south']));for(const p of getMapLocations(ports)){expect(p.accuracy).toBe('approximate');expect(p.sourceUrl).toMatch(/^https:\/\//);expect(p.latitude).toBeGreaterThan(8);expect(p.latitude).toBeLessThan(24);expect(p.longitude).toBeGreaterThan(102);expect(p.longitude).toBeLessThan(110)}});
 it('keeps MVN in the directory but excludes it from the map even with coordinates',()=>{const mvn=ports.find(p=>p.internalCode==='MVN')!;expect(mvn).toBeDefined();expect(mapPorts([{...mvn,latitude:10.7,longitude:106.7}])).toEqual([])});
 it('uses the 15 supplied tickers without terminal records',()=>{expect(ports.map(p=>p.internalCode)).toEqual(['GMD','PHP','VGR','DVP','PDN','CDN','CQN','DXP','PSP','PAP','SGP','QNP','QSP','NAP','MVN']);expect(new Set(ports.map(p=>p.internalCode)).size).toBe(15)});
 it('includes multi-port systems in each region without fake head-office coordinates',()=>{expect(filterPorts(ports,'GMD','north')).toHaveLength(1);expect(filterPorts(ports,'MVN','south')).toHaveLength(1);for(const p of ports.filter(p=>p.entityType==='group')){expect(p.latitude).toBeNull();expect(p.longitude).toBeNull()}});
 it('keeps supplied information separate from independently verified operation',()=>{for(const p of ports){validatePort(p);expect(p.operationalStatus).toBe('unverified');expect(p.sources.operation).toBeNull()}});
});
