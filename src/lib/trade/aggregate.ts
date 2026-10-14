import type {TradeMode,TradeMonth,TradePeriod} from './types';
const round=(n:number)=>Math.round(n*100)/100;
function tradeWindows(mode:TradeMode,page:number,now:Date) {
 if(!Number.isInteger(page)||page<0||page>10000)throw Error('Invalid trade history page');
 const local=new Date(now.getTime()+7*3600000);
 return mode==='year'?Array.from({length:5},(_,i)=>({year:local.getUTCFullYear()-page*5-4+i,start:1,ordinal:1,count:12})):
  Array.from({length:mode==='month'?12:8},(_,i)=>{
   const month=mode==='month'?local.getUTCMonth()-page*12-(11-i):Math.floor(local.getUTCMonth()/3)*3-page*24-(7-i)*3;
   const date=new Date(Date.UTC(local.getUTCFullYear(),month,1));
   return {year:date.getUTCFullYear(),start:date.getUTCMonth()+1,ordinal:mode==='month'?date.getUTCMonth()+1:Math.floor(date.getUTCMonth()/3)+1,count:mode==='month'?1:3};
  });
}
export function aggregateTrade(data:TradeMonth[],mode:TradeMode,page=0,now=new Date()):TradePeriod[] {
 const local=new Date(now.getTime()+7*3600000),current=local.toISOString().slice(0,7);
 const byMonth=new Map(data.map(m=>[m.period,m]));
 const windows=tradeWindows(mode,page,now);
 return windows.map(({year:y,start,ordinal,count})=>{
  const expectedMonths=Array.from({length:count},(_,j)=>`${y}-${String(start+j).padStart(2,'0')}`);
  const known=expectedMonths.filter(p=>p<current&&byMonth.has(p));
  const exportsUsd=known.length?round(known.reduce((s,p)=>s+byMonth.get(p)!.exportsUsd,0)):null;
  const importsUsd=known.length?round(known.reduce((s,p)=>s+byMonth.get(p)!.importsUsd,0)):null;
  return {id:mode==='month'?expectedMonths[0]:mode==='quarter'?`${y}-Q${ordinal}`:String(y),year:y,ordinal,months:known,coverage:known.length,expected:count,exportsUsd,importsUsd,balanceUsd:exportsUsd===null||importsUsd===null?null:round(exportsUsd-importsUsd),state:known.length===count?'complete':known.length?'partial':expectedMonths[0]>current?'future':'missing'} as TradePeriod;
 }).filter(p=>mode!=='year'||p.coverage>0);
}
export function getTradeWindow(data:TradeMonth[],mode:TradeMode,page=0,now=new Date()) {
 const windows=tradeWindows(mode,page,now),periods=aggregateTrade(data,mode,page,now);
 const key=(w:typeof windows[number])=>mode==='month'?`${w.year}-${String(w.start).padStart(2,'0')}`:mode==='quarter'?`${w.year}-Q${w.ordinal}`:String(w.year);
 const first=windows[0],startMonth=`${first.year}-${String(first.start).padStart(2,'0')}`;
 const current=new Date(now.getTime()+7*3600000).toISOString().slice(0,7);
 const known=periods.filter(p=>p.exportsUsd!==null);
 const exportsUsd=known.length?round(known.reduce((s,p)=>s+p.exportsUsd!,0)):null;
 const importsUsd=known.length?round(known.reduce((s,p)=>s+p.importsUsd!,0)):null;
 return {periods,start:key(first),end:key(windows.at(-1)!),hasPrevious:data.some(m=>m.period<startMonth&&m.period<current),hasNext:page>0,
  coverage:periods.reduce((s,p)=>s+p.coverage,0),expected:periods.reduce((s,p)=>s+p.expected,0),exportsUsd,importsUsd,
  balanceUsd:exportsUsd===null||importsUsd===null?null:round(exportsUsd-importsUsd)};
}
export function tradeGrowth(data:TradeMonth[],period:TradePeriod,metric:'exportsUsd'|'importsUsd') {
 if(!period.months.length)return null;
 const index=new Map(data.map(m=>[m.period,m]));let before=0,after=0;
 for(const p of period.months){const prev=`${Number(p.slice(0,4))-1}${p.slice(4)}`,a=index.get(p),b=index.get(prev);if(!a||!b)return null;after+=a[metric];before+=b[metric];}
 return before>0?(after/before-1)*100:null;
}
