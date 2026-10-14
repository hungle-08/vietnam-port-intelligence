import {read,utils} from 'xlsx';
import type {TradeMonth} from './types';
type MonthlyValue={period:string;valueUsd:number};
const text=(v:unknown)=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
function usd(v:unknown) {
 if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1e12)throw Error('Invalid monthly USD value');
 return Math.round(v*1000*100)/100;
}
export function parseTradeTable(rows:unknown[][],year:number,kind:'exports'|'imports',now=new Date()):MonthlyValue[] {
 const title=rows.slice(0,3).flat().map(text).join(' ');
 if(!title.includes(String(year))||!title.includes(kind==='exports'?'xuat khau':'nhap khau'))throw Error('Wrong workbook identity');
 const header=rows.findIndex(r=>r.some(c=>/^thang\s*0?1$/.test(text(c))));
 const total=rows.find(r=>text(r[0])==='tong so');
 if(header<0||!total)throw Error('Monthly total missing');
 const result:MonthlyValue[]=[];let cumulative:number|null=null;
 const current=new Date(now.getTime()+7*3600000).toISOString().slice(0,7);
 const h=rows[header],units=rows[header+1]??[];
 for(let col=0;col<h.length;col++) {
  const m=text(h[col]).match(/^thang\s*(\d{1,2})$/),cum=text(h[col]).match(/^(\d{1,2})\s*thang$/);
  if(!m&&!cum)continue;
  // Monthly headers span quantity and value columns. Read only the explicitly labeled value cell.
  const valueCol=[col,col+1].find(i=>text(units[i]).includes('tri gia')&&/1000\s*usd/.test(text(units[i])));
  if(valueCol===undefined)throw Error('Unsupported trade unit');
  if(cum){if(Number(cum[1])!==result.length||cumulative!==null)throw Error('Wrong cumulative reporting period');cumulative=usd(total[valueCol]);continue;}
  const month=Number(m![1]);
  if(month!==result.length+1||month>12)throw Error('Non-contiguous source months');
  const period=`${year}-${String(month).padStart(2,'0')}`;
  if(period>=current)throw Error('Unfinished/future month in official workbook');
  result.push({period,valueUsd:usd(total[valueCol])});
 }
 if(!result.length||cumulative===null)throw Error('Incomplete trade workbook');
 const sum=result.reduce((n,m)=>n+m.valueUsd,0);
 // Binary floating point noise is rounded to cents. Reject a different reporting vintage/structure.
 if(Math.abs(sum-cumulative)>1)throw Error('Monthly/cumulative totals do not reconcile');
 return result;
}
export function parseTradeWorkbook(bytes:Uint8Array,year:number,kind:'exports'|'imports',now=new Date()) {
 if(bytes.length>8*1024*1024)throw Error('Workbook too large');
 const wb=read(bytes,{type:'array',cellFormula:false,cellHTML:false,cellText:false});
 if(wb.SheetNames.length!==1)throw Error('Unsupported workbook structure');
 const rows=utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]],{header:1,defval:null,raw:true});
 return parseTradeTable(rows,year,kind,now);
}
export function combineTradeMonths(exports:MonthlyValue[],imports:MonthlyValue[]):TradeMonth[] {
 if(!exports.length||exports.length!==imports.length||exports.some((e,i)=>e.period!==imports[i].period))throw Error('Mismatched trade release months');
 return exports.map((e,i)=>({period:e.period,exportsUsd:e.valueUsd,importsUsd:imports[i].valueUsd}));
}
