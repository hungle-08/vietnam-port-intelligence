import type {TradeData,TradeMonth} from './types';
type Row=Record<string,unknown>;
function record(value:unknown):Row {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid trade response');
 return value as Row;
}
export function parseTradeResponse(input:unknown):TradeData {
 const payload=record(input);
 if(!Array.isArray(payload.data)||payload.data.length!==2)throw Error('Incomplete trade response');
 const rows=payload.data.map(record),months=new Map<string,TradeMonth>();
 const updated:string[]=[];
 for(const [id,metric] of [[22603,'exportsUsd'],[22606,'importsUsd']] as const){
  const matches=rows.filter(row=>row.id===id);
  if(matches.length!==1)throw Error('Missing trade series');
  const row=matches[0];
  if(row.economy!=='VN'||row.frequency!=='monthly'||row.unit!=='Triệu USD'||row.transform!=='none'||row.hasMore!==false||!Array.isArray(row.observations))throw Error('Unsupported trade series');
  const seen=new Set<string>();
  for(const raw of row.observations){
   const point=record(raw),period=point.period,value=point.value;
   if(typeof period!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)||point.date!==period+'-01'||seen.has(period))throw Error('Invalid trade month');
   if(value!==null&&(typeof value!=='number'||!Number.isFinite(value)||value<0))throw Error('Invalid trade value');
   seen.add(period);
   const month=months.get(period)??{period,exportsUsd:null,importsUsd:null};
   month[metric]=value===null?null:Math.round((value as number)*1e6*100)/100;
   months.set(period,month);
  }
  if(typeof row.lastUpdated==='string'&&Number.isFinite(Date.parse(row.lastUpdated)))updated.push(row.lastUpdated);
 }
 return {months:[...months.values()].sort((a,b)=>a.period.localeCompare(b.period)),updatedAt:updated.sort().at(-1)??null};
}
