import {PORT_COLORS} from '@/lib/ports/colors';
import {validateDay} from './config';
export const LACH_HUYEN_PORTS=[
 {id:'hict',sourceName:'HICT',name:'TC-HICT',berths:'1–2',vi:'Tân Cảng Hải Phòng',en:'Tan Cang Hai Phong',color:PORT_COLORS.hict},
 {id:'htit',sourceName:'HTIT',name:'HTIT',berths:'3–4',vi:'TIL Cảng Hải Phòng · PHP',en:'Haiphong Port TIL · PHP',color:PORT_COLORS.htit},
 {id:'hhit',sourceName:'HHIT',name:'HHIT',berths:'5–6',vi:'Hateco Hải Phòng',en:'Hateco Hai Phong',color:PORT_COLORS.hhit},
] as const;
export type RegionalPortRow={period:string;name:string;calls:number;dwt:number|null;missingDwt:number};
export type RegionalMonth={period:string;daysAvailable:number;daysExpected:number;status:'missing'|'current'|'partial'|'complete';ports:{id:string;calls:number|null;dwt:number|null;missingDwt:number;dwtShare:number|null;callShare:number|null}[]};
/** The viewport shows up to 12 points, bounded by the available timeline. */
export function latestRegionalRange(length:number){return {start:Math.max(0,length-12),end:Math.max(0,length-1)};}
export function buildLachHuyenMonths(coverage:{period:string;days:number}[],rows:RegionalPortRow[],asOf:string):RegionalMonth[]{
 validateDay(asOf);
 const currentPeriod=asOf.slice(0,7),first=coverage.filter(c=>c.days>0&&c.period<=currentPeriod).map(c=>c.period).sort()[0];
 if(!first)return [];
 const start=new Date(first+'-01T00:00:00Z');
 const length=(Number(asOf.slice(0,4))-start.getUTCFullYear())*12+Number(asOf.slice(5,7))-1-start.getUTCMonth()+1;
 return Array.from({length},(_,i)=>{
  const date=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+i,1)),period=date.toISOString().slice(0,7),current=period===asOf.slice(0,7);
  const daysAvailable=coverage.find(c=>c.period===period)?.days??0,daysExpected=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();
  const ports=LACH_HUYEN_PORTS.map(p=>{const r=rows.find(r=>r.period===period&&r.name===p.sourceName);return {id:p.id,calls:daysAvailable?r?.calls??0:null,dwt:daysAvailable?(r?r.dwt:0):null,missingDwt:r?.missingDwt??0,dwtShare:null as number|null,callShare:null as number|null};});
  const totalDwt=ports.reduce((s,p)=>s+(p.dwt??0),0),totalCalls=ports.reduce((s,p)=>s+(p.calls??0),0),missingDwt=ports.some(p=>p.missingDwt>0);
  for(const p of ports){p.dwtShare=daysAvailable&&totalDwt>0&&!missingDwt?(p.dwt??0)/totalDwt*100:null;p.callShare=daysAvailable&&totalCalls>0?p.calls!/totalCalls*100:null;}
  return {period,daysAvailable,daysExpected,status:!daysAvailable?'missing':current?'current':daysAvailable<daysExpected?'partial':'complete',ports};
 });
}
