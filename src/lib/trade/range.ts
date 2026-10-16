import type {TradeMode,TradeMonth,TradePeriod} from './types';
export type TimeRange=[number,number];
export type RangeChoice=1|2|3|5|10|'all'|`${number}`;
const round=(value:number)=>Math.round(value*100)/100;
export function tradeTimeline(months:TradeMonth[],mode:TradeMode,currentDay:string):TradePeriod[]{
 const current=currentDay.slice(0,7),available=months.filter(m=>m.period<=current).sort((a,b)=>a.period.localeCompare(b.period));
 if(!available.length)return [];
 const serial=(period:string)=>Number(period.slice(0,4))*12+Number(period.slice(5,7))-1;
 const step=mode==='month'?1:mode==='quarter'?3:12;
 const first=Math.floor(serial(available[0].period)/step)*step,last=Math.floor(serial(current)/step)*step;
 const index=new Map(available.map(m=>[m.period,m]));
 return Array.from({length:(last-first)/step+1},(_,i)=>{
  const start=first+i*step,y=Math.floor(start/12),month=start%12;
  const keys=Array.from({length:step},(_,j)=>`${y}-${String(month+j+1).padStart(2,'0')}`);
  const pairs=keys.map(k=>index.get(k)).filter((p):p is TradeMonth=>!!p&&p.exportsUsd!==null&&p.importsUsd!==null);
  const single=index.get(keys[0]);
  const exportsUsd=mode==='month'?single?.exportsUsd??null:pairs.length?round(pairs.reduce((s,p)=>s+p.exportsUsd!,0)):null;
  const importsUsd=mode==='month'?single?.importsUsd??null:pairs.length?round(pairs.reduce((s,p)=>s+p.importsUsd!,0)):null;
  return {period:mode==='month'?keys[0]:mode==='quarter'?`${y}-Q${Math.floor(month/3)+1}`:String(y),exportsUsd,importsUsd,
   balanceUsd:exportsUsd===null||importsUsd===null?null:round(exportsUsd-importsUsd),coverage:pairs.length,expected:step};
 });
}
export function clampRange(range:TimeRange,count:number):TimeRange{
 const size=Math.min(count,Math.max(1,Math.round(range[1]-range[0])+1));
 const start=Math.max(0,Math.min(Math.max(0,count-size),Math.round(range[0])));
 return [start,Math.max(start,start+size-1)];
}
export function yearRange(periods:TradePeriod[],choice:RangeChoice):TimeRange{
 if(!periods.length)return [0,0];
 if(choice==='all')return [0,periods.length-1];
 if(typeof choice==='string'){
  const indices=periods.flatMap((p,i)=>p.period.slice(0,4)===choice?[i]:[]);
  return indices.length?[indices[0],indices.at(-1)!]:[0,0];
 }
 const step=periods[0].expected===12?1:periods[0].expected===3?4:12;
 return [Math.max(0,periods.length-choice*step),periods.length-1];
}
export function zoomRange(range:TimeRange,factor:number,count:number):TimeRange{
 const middle=(range[0]+range[1])/2,span=Math.max(1,(range[1]-range[0]+1)*factor);
 return clampRange([middle-(span-1)/2,middle+(span-1)/2],count);
}
export function tradePeriodLabel(period:string,vi:boolean){return period.includes('-Q')?`${vi?'Quý ':'Q'}${period.slice(-1)}/${period.slice(0,4)}`:period.length===7?`${period.slice(5)}/${period.slice(0,4)}`:period;}
export const TRADE_SERIES=[
 {key:'exportsUsd',variable:'--trade-export',vi:'Xuất khẩu',en:'Exports'},
 {key:'importsUsd',variable:'--trade-import',vi:'Nhập khẩu',en:'Imports'},
 {key:'balanceUsd',variable:'--trade-balance',vi:'Cán cân thương mại',en:'Trade balance'},
] as const;
