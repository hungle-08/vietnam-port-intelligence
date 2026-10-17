import {validateDay} from './config';
import {phpTerminals} from './directory';
export type TerminalMonth={period:string;daysAvailable:number;daysExpected:number;status:'missing'|'current'|'partial'|'complete';dwt:number|null;calls:number|null;missingDwt:number};
export type TerminalHistory=Record<string,TerminalMonth[]>;
export type TerminalMonthRow={period:string;terminalId:string;dwt:number|null;calls:number;missingDwt:number};
export function terminalWindow(count:number){return {start:Math.max(0,count-12),end:Math.max(0,count-1)};}
export function buildTerminalHistory(coverage:{period:string;days:number}[],rows:TerminalMonthRow[],asOf:string):TerminalHistory{
 validateDay(asOf);const last=asOf.slice(0,7),first=coverage.filter(c=>c.days>0&&c.period<=last).map(c=>c.period).sort()[0];
 const start=first?new Date(first+'-01T00:00:00Z'):null;
 const count=start?(Number(last.slice(0,4))-start.getUTCFullYear())*12+Number(last.slice(5))-start.getUTCMonth():0;
 const days=new Map(coverage.map(c=>[c.period,c.days])),metrics=new Map(rows.map(r=>[`${r.terminalId}:${r.period}`,r]));
 return Object.fromEntries(phpTerminals.map(site=>[site.id,Array.from({length:count},(_,i)=>{
  const date=new Date(Date.UTC(start!.getUTCFullYear(),start!.getUTCMonth()+i,1)),period=date.toISOString().slice(0,7);
  const daysAvailable=days.get(period)??0,daysExpected=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate(),r=metrics.get(`${site.id}:${period}`),missingDwt=r?.missingDwt??0;
  return {period,daysAvailable,daysExpected,dwt:daysAvailable?(r?r.dwt:0):null,calls:daysAvailable?r?.calls??0:null,missingDwt,status:!daysAvailable?'missing':period===last?'current':daysAvailable<daysExpected||missingDwt>0?'partial':'complete'} satisfies TerminalMonth;
 })]));
}
