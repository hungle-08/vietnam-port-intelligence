import {validateDay,vietnamDay} from './config';
import {phpTerminals} from './directory';
export type DailyMetric={day:string;available:boolean;calls:number|null;dwt:number|null;missingDwt:number|null};
export type TerminalDailyMetric={day:string;terminalId:string;calls:number;dwt:number|null;missingDwt:number};
export type ContributionMonth=MonthlyMetric&{sites:{id:string;dwt:number|null;calls:number|null;missingDwt:number}[]};
export type MonthStatus='future'|'no-data'|'collecting'|'complete'|'incomplete';
export type MonthlyMetric={month:number;status:MonthStatus;dwt:number|null;calls:number|null;missingDwt:number;daysAvailable:number;daysExpected:number};
export function resolveReportYear(value:string|string[]|undefined,now:Date){
 const current=Number(vietnamDay(now).slice(0,4));
 return typeof value==='string'&&/^\d{4}$/.test(value)&&Number(value)>=1900&&Number(value)<=2100?Number(value):current;
}
export function aggregatePhpContributions(days:DailyMetric[],rows:TerminalDailyMetric[],year:number,asOf:string):ContributionMonth[]{
 const byDaySite=new Map(rows.map(row=>[`${row.day}:${row.terminalId}`,row]));
 const sites=phpTerminals.map(site=>({id:site.id,months:aggregatePhpMonths(days.map(day=>{
  const row=byDaySite.get(`${day.day}:${site.id}`);
  return {day:day.day,available:day.available,calls:day.available?row?.calls??0:null,dwt:day.available?(row?row.dwt:0):null,missingDwt:day.available?row?.missingDwt??0:null};
 }),year,asOf).months}));
 return aggregatePhpMonths(days,year,asOf).months.map((month,index)=>({...month,sites:sites.map(site=>({id:site.id,dwt:site.months[index].dwt,calls:site.months[index].calls,missingDwt:site.months[index].missingDwt}))}));
}
export function aggregatePhpMonths(days:DailyMetric[],year:number,asOf:string){
 validateDay(asOf);if(!Number.isInteger(year)||year<1900||year>2100)throw Error('Invalid report year');
 const months:MonthlyMetric[]=Array.from({length:12},(_,i)=>{
  const month=i+1,prefix=`${year}-${String(month).padStart(2,'0')}`,start=prefix+'-01';
  const future=start>asOf,current=asOf.startsWith(prefix),calendarDays=new Date(Date.UTC(year,month,0)).getUTCDate();
  const daysExpected=future?0:current?Number(asOf.slice(8,10)):calendarDays;
  const present=future?[]:days.filter(d=>d.day.startsWith(prefix+'-')&&d.day<=asOf&&d.available);
  const known=present.filter(d=>d.dwt!==null);const missingDwt=present.reduce((sum,d)=>sum+(d.missingDwt??0),0);
  const status:MonthStatus=future?'future':current?'collecting':!present.length?'no-data':present.length<daysExpected||missingDwt>0?'incomplete':'complete';
  return {month,status,dwt:known.length?known.reduce((sum,d)=>sum+d.dwt!,0):null,calls:present.length?present.reduce((sum,d)=>sum+(d.calls??0),0):null,missingDwt,daysAvailable:present.length,daysExpected};
 });
 const known=months.filter(m=>m.dwt!==null);
 return {months,hasData:months.some(m=>m.daysAvailable>0),totalDwt:known.length?known.reduce((sum,m)=>sum+m.dwt!,0):null,totalCalls:months.some(m=>m.calls!==null)?months.reduce((sum,m)=>sum+(m.calls??0),0):null,missingDwt:months.reduce((sum,m)=>sum+m.missingDwt,0)};
}
