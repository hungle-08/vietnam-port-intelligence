'use client';
import {useMapContext} from 'react-simple-maps';
import type {getMapLocations} from '@/lib/ports/domain';

// Illustration anchors, not vessel positions or navigable shipping routes.
// Stable seeded offsets scatter the ships without hydration jumps or rerender drift.
const illustrations=[
 {id:'north-east',portId:'PHP',coordinates:[108.45,19.8],color:'#75e4f1',duration:'5.8s',delay:'-1.2s',angle:-18,scale:.86},
 {id:'gulf',portId:'CQN',coordinates:[110.7,20.35],color:'#a1beff',duration:'7.2s',delay:'-3.6s',angle:16,scale:.72},
 {id:'central',portId:'CDN',coordinates:[109.7,18.45],color:'#79c8ff',duration:'6.4s',delay:'-2.4s',angle:-12,scale:.9},
 {id:'offshore',portId:'QNP',coordinates:[113.15,14.35],color:'#7de4bf',duration:'8.1s',delay:'-4.1s',angle:23,scale:.83},
 {id:'south-east',portId:'PDN',coordinates:[110.8,10.5],color:'#b4a4ff',duration:'7.6s',delay:'-2.8s',angle:-20,scale:.76},
 {id:'south',portId:'SGP',coordinates:[108.25,8.55],color:'#75e4f1',duration:'6.9s',delay:'-5.3s',angle:12,scale:.88},
] as const;
function offset(seed:string){
 let hash=2166136261;
 for(const char of seed)hash=Math.imul(hash^char.charCodeAt(0),16777619);
 return ((hash>>>0)%1000)/999-.5;
}
function OutlineShip(){
 return <g className="map-outline-ship" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
  <path d="M-31 5H32L24 18H-22Z"/>
  <path d="M-22 5V-12H-11V5M-25-12H-8M-18-12V-20"/>
  <path d="M-5 5V-4H6V5M10 5V-4H21V5M-5-4V-13H6V-4"/>
  <path d="M-31 26Q-24 21-17 26T-3 26 11 26 25 26 36 26"/>
  <path d="M-19-7H-15"/>
 </g>;
}

export function MapTraffic({points,animated=false}:{points:ReturnType<typeof getMapLocations>;animated?:boolean}){
 const {projection}=useMapContext();
 return <g className="map-traffic" aria-hidden="true" pointerEvents="none">
  {illustrations.map(route=>{
   const port=points.find(point=>point.portId===route.portId);
   if(!port)return null;
   const ship=projection([route.coordinates[0]+offset(route.id)*.55,route.coordinates[1]+offset(route.id+'latitude')*.7]);
   const target=projection([port.longitude,port.latitude]);
   if(!ship||!target)return null;
   const bendX=(ship[0]+target[0])/2+offset(route.id+'curve')*55;
   const bendY=(ship[1]+target[1])/2-35;
   const path=`M ${ship[0]} ${ship[1]} Q ${bendX} ${bendY} ${target[0]} ${target[1]}`;
   const style={'--traffic-color':route.color,'--traffic-duration':route.duration,'--traffic-delay':route.delay} as import('react').CSSProperties;
   return <g key={route.id} style={style} color={route.color}>
    <path className="map-route-glow" d={path} fill="none" stroke={route.color}/>
    <path className="map-route-base" d={path} fill="none" stroke={route.color}/>
    <path className="map-route-signal" d={path} fill="none" stroke={route.color} pathLength={100}/>
    {animated&&[0,1].map(index=><circle key={index} className="map-route-particle" r={index?2:3} fill={route.color}>
     <animateMotion path={path} dur={route.duration} begin={index?'0s':`-${parseFloat(route.duration)/2}s`} repeatCount="indefinite" calcMode="paced"/>
    </circle>)}
    <g transform={`translate(${ship[0]},${ship[1]})`}>
     <g className="map-ship-float"><g transform={`rotate(${route.angle}) scale(${route.scale})`}><OutlineShip/></g></g>
    </g>
   </g>;
  })}
 </g>;
}
