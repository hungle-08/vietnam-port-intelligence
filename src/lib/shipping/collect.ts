import {carriers} from './carriers';
import {validateShippingSnapshot} from './parse';
import {ALPHALINER_API,validateCronConfig} from '../cron/config';
import type {ShippingSnapshot} from './types';
type FleetRow={rank:number;operator:string;totalTeu:number;totalShips:number;percent:number};
export function parseAlphalinerApi(payload:unknown,now:Date,sourceUrl:string):ShippingSnapshot {
 if(!Array.isArray(payload))throw Error('Invalid source response');
 const tables=payload.filter(p=>p?.method==='getTop100Table'&&p.type==='rpc');
 const totals=payload.filter(p=>p?.method==='getTextCalculations'&&p.type==='rpc');
 if(tables.length!==1||totals.length!==1||!Array.isArray(tables[0].result))throw Error('Missing source tables');
 const world=Number(totals[0].result?.fully?.sum_teu);
 if(!Number.isSafeInteger(world)||world<=0)throw Error('Missing world capacity');
 const rows:FleetRow[]=tables[0].result.filter((r:FleetRow)=>Number.isInteger(r.rank)&&r.rank>=1&&r.rank<=10).sort((a:FleetRow,b:FleetRow)=>a.rank-b.rank);
 const entries=rows.map(row=>{
  const carrier=carriers.find(c=>c.sourceNames.includes(row.operator));
  if(!carrier)throw Error('Unknown carrier');
  // Global totals and the ranking may refresh separately; tolerate 0.2 percentage points.
  if(typeof row.percent!=='number'||Math.abs(row.totalTeu/world*100-row.percent)>.2)throw Error('Inconsistent capacity share');
  return {carrierId:carrier.id,rank:row.rank,sourceName:row.operator,capacityTeu:row.totalTeu,shipCount:row.totalShips,sharePercent:row.percent};
 });
 return validateShippingSnapshot({sourceId:'alphaliner',sourceUrl,retrievedAt:now.toISOString(),asOf:now.toISOString().slice(0,10),asOfBasis:'retrieval-date',retrievalMethod:'direct-http',metric:'operated-container-capacity-teu',scope:'consolidated',entries});
}
export async function collectShipping(sourceUrl:string):Promise<ShippingSnapshot> {
 validateCronConfig({enabled:true,intervalMonths:1,dayOfMonth:1,sourceUrl});
 const response=await fetch(ALPHALINER_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(['getTop100Table','getTextCalculations'].map((method,i)=>({action:'top100',method,data:[],type:'rpc',tid:i+1}))),signal:AbortSignal.timeout(20000),redirect:'error',cache:'no-store'});
 if(!response.ok||!response.body)throw Error('Source unavailable');
 const reader=response.body.getReader();let size=0;const chunks:Uint8Array[]=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2_000_000)throw Error('Source too large');chunks.push(value);}}finally{await reader.cancel();}
 return parseAlphalinerApi(JSON.parse(Buffer.concat(chunks).toString('utf8')),new Date(),sourceUrl);
}
