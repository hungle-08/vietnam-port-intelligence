import type { PortCode,PortRecord,PortMapLocation } from './types';
export function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().trim();
}
type Searchable = { nameVi: string; nameEn: string | null; internalCode: string; seaportName: string; region: string; regions?: string[]; officialCodes: PortCode[] };
export function filterPorts<T extends Searchable>(ports: T[], query: string, region: string): T[] {
  const q=normalize(query);
  return ports.filter(p => (region==='all'||(p.regions??[p.region]).includes(region)) && normalize([p.nameVi,p.nameEn,p.internalCode,p.seaportName,...p.officialCodes.map(c=>c.value)].join(' ')).includes(q));
}
export function validatePort(p: {latitude: number | null; longitude: number | null}) {
  if ((p.latitude===null)!==(p.longitude===null)) throw new Error('Coordinates must be a pair');
  if (p.latitude!==null && (!Number.isFinite(p.latitude) || p.latitude < -90 || p.latitude>90)) throw new Error('Invalid latitude');
  if (p.longitude!==null && (!Number.isFinite(p.longitude) || p.longitude < -180 || p.longitude>180)) throw new Error('Invalid longitude');
}
export type ProjectedPoint = {id:string; x:number; y:number};
export type MapCluster = {ids:string[]; x:number; y:number};
export function clusterProjectedPorts(points: ProjectedPoint[], radius: number): MapCluster[] {
  const clusters: MapCluster[]=[];
  for (const p of points) {
    const near=clusters.find(c=>Math.hypot(c.x-p.x,c.y-p.y)<=radius);
    if (near) near.ids.push(p.id);
    else clusters.push({ids:[p.id],x:p.x,y:p.y});
  }
  return clusters;
}

export function mapPorts<T extends {mapVisible?:boolean;latitude:number|null;longitude:number|null;mapLocations?:PortMapLocation[]}>(ports:T[]):T[] {
 return ports.filter(p=>p.mapVisible!==false&&((p.mapLocations?.length??0)>0||(p.latitude!==null&&p.longitude!==null)));
}
export function getMapLocations(ports:PortRecord[],region='all'):(PortMapLocation&{portId:string})[] {
 return mapPorts(ports).flatMap(p=>{
  const points=p.mapLocations??[{id:p.internalCode,label:p.sourceLocation,latitude:p.latitude!,longitude:p.longitude!,region:p.region,accuracy:p.coordinateAccuracy==='verified'?'verified' as const:'approximate' as const,sourceUrl:p.sources.coordinates??''}];
  return points.filter(l=>region==='all'||l.region===region).map(l=>({...l,id:`${p.internalCode}:${l.id}`,portId:p.internalCode}));
 });
}
