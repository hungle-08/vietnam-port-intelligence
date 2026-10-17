'use client';
import {useState,useEffect,useRef,useId} from 'react';
import {ComposableMap,Geographies,Geography,useMapContext} from 'react-simple-maps';
import {svgNumber} from '@/lib/ports/svg';
import {motion,useReducedMotion,useInView} from 'motion/react';
import {X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {clusterProjectedPorts,getMapLocations} from '@/lib/ports/domain';
import {archipelagos,mapFrame} from '@/lib/ports/archipelagos';
import {getMessages,portName,type Locale} from '@/lib/i18n';
import type {PortRecord} from '@/lib/ports/types';
import {PortDetails} from './port-details';
import {MapTraffic} from './map-traffic';

type MapPoint=ReturnType<typeof getMapLocations>[number];
function Marker({coordinates,children,...props}:{coordinates:[number,number]}&React.SVGProps<SVGGElement>){
 const {projection}=useMapContext(),point=projection(coordinates);
 return point?<g className="rsm-marker" transform={`translate(${svgNumber(point[0])},${svgNumber(point[1])})`} {...props}>{children}</g>:null;
}
// Regular five-point star, placed within the broad northern part of the silhouette.
const flagStar=Array.from({length:10},(_,i)=>{
 const angle=-Math.PI/2+i*Math.PI/5;
 const radius=i%2?54*.381966:54;
 return `${(Math.cos(angle)*radius).toFixed(2)},${(Math.sin(angle)*radius).toFixed(2)}`;
}).join(' ');
function PortMarkers({points,ports,locale,selectedId,onHover,onActivate}:{points:MapPoint[];ports:PortRecord[];locale:Locale;selectedId:string|null;onHover:(ids:string[])=>void;onActivate:(ids:string[])=>void}){
 const {projection}=useMapContext();
 const projected=points.flatMap(p=>{const xy=projection([p.longitude,p.latitude]);return xy?[{id:p.id,x:xy[0],y:xy[1]}]:[]});
 const clusters=clusterProjectedPorts(projected,18);
 return clusters.map((cluster,index)=>{
  const first=points.find(p=>p.id===cluster.ids[0])!;
  const members=points.filter(p=>cluster.ids.includes(p.id));
  const codes=[...new Set(members.map(p=>p.portId))];
  const active=members.some(p=>p.portId===selectedId);
  const name=codes.length>1?`${getMessages(locale).cluster}: ${codes.join(', ')}`:`${codes[0]} · ${first.label}`;
  const areaLabels=[...new Set(members.flatMap(p=>{const port=ports.find(port=>port.internalCode===p.portId)!;return port.entityType==='group'?[]:[port.sourceLocation]}))];
  const areaLabel=areaLabels.length===1?areaLabels[0]:getMessages(locale)[first.region];
  return <Marker key={cluster.ids[0]} coordinates={[first.longitude,first.latitude]} role="button" tabIndex={0} aria-label={name} onMouseEnter={()=>onHover(cluster.ids)} onFocus={()=>onHover(cluster.ids)} onClick={()=>onActivate(cluster.ids)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();onActivate(cluster.ids)}}}>
   <title>{name}</title><circle className="map-port-target" r={24} fill="transparent"/><circle className="map-port-halo" style={{animationDelay:`${-index*.65}s`}} r={(codes.length>1?18:13)} fill="none" stroke="var(--ring)" strokeWidth={1} pointerEvents="none"/><circle className="map-port-core" data-active={active} r={(codes.length>1?12:active?8:6)} fill={active?'var(--primary)':'var(--card)'} stroke="var(--ring)" strokeWidth={2}/>
   {codes.length>1?<text className="map-port-count" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600} fill={active?'var(--primary-foreground)':'var(--foreground)'} pointerEvents="none">{codes.length}</text>:null}
   <text className="map-port-label" x={17} y={3} fontSize={10} fontWeight={600} fill="var(--foreground)" stroke="var(--background)" strokeWidth={3} paintOrder="stroke" pointerEvents="none">{codes.length>1?areaLabel:codes[0]}</text>
  </Marker>;
 });
}

export function PortMap({ports,locale,selectedId,onSelect}:{ports:PortRecord[];locale:Locale;selectedId:string|null;onSelect:(id:string|null)=>void}){
 const t=getMessages(locale),reduce=useReducedMotion();
 const mapRef=useRef<HTMLDivElement>(null);
 const inView=useInView(mapRef,{amount:.15});
 const id=useId().replace(/:/g,'');
 const [hoverIds,setHoverIds]=useState<string[]>([]),[pinnedGroup,setPinnedGroup]=useState(false);
 const groupRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(pinnedGroup)groupRef.current?.querySelector<HTMLButtonElement>('button')?.focus()},[pinnedGroup,hoverIds]);
 const points=getMapLocations(ports);
 const hovered=points.filter(p=>hoverIds.includes(p.id));
 const group=hovered.length>1&&!selectedId?hovered:[];
 const selected=ports.find(p=>p.mapVisible!==false&&p.internalCode===(selectedId??hovered[0]?.portId));
 const close=()=>{onSelect(null);setHoverIds([]);setPinnedGroup(false)};
 const activate=(ids:string[])=>{const members=points.filter(p=>ids.includes(p.id));setHoverIds(ids);if(members.length===1){onSelect(members[0].portId);setPinnedGroup(false)}else{onSelect(null);setPinnedGroup(true)}};
 return <motion.div ref={mapRef} data-animated={!reduce&&inView} initial={reduce?false:{opacity:0,y:16,scale:.98}} animate={{opacity:1,y:0,scale:1}} transition={{duration:.9,ease:[.22,1,.36,1]}} className="port-map" onKeyDown={e=>{if(e.key==='Escape')close()}} onMouseLeave={()=>{if(!pinnedGroup)setHoverIds([])}}>
  <ComposableMap width={mapFrame.width} height={mapFrame.height} projection="geoMercator" projectionConfig={{center:mapFrame.center,scale:mapFrame.scale}} aria-describedby={`${id}-help`} aria-label={locale==='vi'?'Bản đồ Việt Nam, Hoàng Sa và Trường Sa':'Map of Vietnam, Hoàng Sa and Trường Sa'}>
   <defs>
    <linearGradient id={`${id}-scan`} x1="0" y1="0" x2="0" y2="1"><stop offset=".35" stopColor="#fde68a" stopOpacity="0"/><stop offset=".48" stopColor="#fde68a" stopOpacity=".1"/><stop offset=".5" stopColor="#fff7ed" stopOpacity=".5"/><stop offset=".52" stopColor="#fde68a" stopOpacity="0"/>{!reduce&&inView&&<animateTransform attributeName="gradientTransform" type="translate" values="0 -1;0 1" dur="9s" repeatCount="indefinite"/>}</linearGradient>
   </defs>
   <g>
    <Geographies geography="/maps/vietnam.geojson">{({geographies})=>geographies.map(geo=><g key={geo.rsmKey}>
     <defs><clipPath id={`${id}-${geo.rsmKey}-flag`}><path d={geo.svgPath??undefined}/></clipPath></defs>
     <Geography className="map-land-main" geography={geo} fill="#da251d" stroke="#b91c1c" strokeWidth=".8" vectorEffect="non-scaling-stroke" style={{outline:'none'}}/>
     <g clipPath={`url(#${id}-${geo.rsmKey}-flag)`} pointerEvents="none" aria-hidden="true"><Marker coordinates={[105.1,21.3]}><polygon className="map-flag-star" points={flagStar} fill="#ffde00"/></Marker></g>
     <Geography className="map-land-edge" geography={geo} fill="none" stroke="#fcd34d" strokeWidth=".8" vectorEffect="non-scaling-stroke" pointerEvents="none" aria-hidden="true"/>
     <Geography className="map-land-scan" geography={geo} fill={`url(#${id}-scan)`} stroke="none" pointerEvents="none"/>
    </g>)}</Geographies>
    {archipelagos.map(a=><g key={a.id} aria-label={a.name}>
     {a.points.map(p=><Marker key={p.name} coordinates={p.coordinates}><title>{`${p.name} · ${a.name}`}</title><circle className="map-island-point" r={2.6} fill="#da251d" stroke="#ffde00" strokeWidth={.8}/></Marker>)}
     <Marker coordinates={a.label}><text className="map-island-label" textAnchor="middle" fontSize={12} fontWeight={550} fill="var(--foreground)">{a.name}</text><text className="map-island-caption" textAnchor="middle" y={14} fontSize={8} fill="var(--muted-foreground)">{locale==='vi'?'Quần đảo':'Archipelago'}</text></Marker>
    </g>)}
    <MapTraffic points={points} animated={!reduce&&inView}/>
    <PortMarkers points={points} ports={ports} locale={locale} selectedId={selectedId} onHover={ids=>{if(!pinnedGroup)setHoverIds(ids)}} onActivate={activate}/>
   </g>
  </ComposableMap>
  {group.length>0?<div className="map-detail-wrap"><div className="port-details"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-foreground">{t.cluster}</p><Button variant="ghost" size="icon-sm" onClick={close} aria-label={t.close}><X/></Button></div><p className="mt-1 text-[10px] text-muted-foreground">{t.clusterHint}</p><div className="map-group-list" ref={groupRef}>{group.map(point=>{const port=ports.find(p=>p.internalCode===point.portId)!;return <button key={point.id} onClick={()=>{onSelect(port.internalCode);setHoverIds([point.id]);setPinnedGroup(false)}} className="map-group-item"><strong>{port.stockTicker}</strong><span>{portName(port,locale)}<small>{point.label}</small></span></button>})}</div></div></div>:selected?<div className="map-detail-wrap"><PortDetails port={selected} locale={locale} onClose={close}/>{hovered[0]?.portId===selected.internalCode&&<p className="map-point-context">{hovered[0].label}</p>}</div>:null}
  <p id={`${id}-help`} className="sr-only">{locale==='vi'?'Bản đồ cố định hiển thị toàn bộ cảng, độc lập với bộ lọc danh sách. Chọn điểm hoặc nhóm cảng để xem thông tin. Icon tàu và đường sáng là hiệu ứng minh họa, không phải dữ liệu theo dõi tàu thực tế.':'Fixed map showing all ports independently of directory filters. Select a port or port group for details. Vessel icons and glowing connections are decorative, not live vessel tracking data.'}</p>
 </motion.div>;
}
