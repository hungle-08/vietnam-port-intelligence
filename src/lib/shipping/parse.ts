import {carriers} from './carriers';
import type {ShippingSnapshot,ShippingEntry} from './types';
const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const integer=(s:string)=>{if(!/^\d[\d,]*$/.test(s))throw Error('Invalid fleet number');const n=Number(s.replaceAll(',',''));if(!Number.isSafeInteger(n)||n<=0)throw Error('Invalid fleet number');return n;};
export function validateShippingSnapshot(s:ShippingSnapshot):ShippingSnapshot{
 if(s.sourceId!=='alphaliner'||s.metric!=='operated-container-capacity-teu'||s.scope!=='consolidated'||!/^\d{4}-\d{2}-\d{2}$/.test(s.asOf)||!Number.isFinite(Date.parse(s.asOf))||!Number.isFinite(Date.parse(s.retrievedAt))||!['direct-http','web-search-index'].includes(s.retrievalMethod)||new URL(s.sourceUrl).hostname!=='alphaliner.axsmarine.com')throw Error('Invalid snapshot provenance');
 if(s.entries.length!==10)throw Error('Incomplete top ten');
 const ids=new Set<string>();let previous=Infinity;
 s.entries.forEach((e,i)=>{if(e.rank!==i+1||ids.has(e.carrierId)||!carriers.some(c=>c.id===e.carrierId)||!e.sourceName||!Number.isSafeInteger(e.capacityTeu)||e.capacityTeu<=0||e.capacityTeu>previous||!Number.isFinite(e.sharePercent)||e.sharePercent<=0||e.sharePercent>100||e.shipCount!==null&&(!Number.isSafeInteger(e.shipCount)||e.shipCount<=0))throw Error('Invalid ranking');ids.add(e.carrierId);previous=e.capacityTeu;});
 if(s.entries.reduce((sum,e)=>sum+e.sharePercent,0)>100.5)throw Error('Shares exceed world fleet');return s;
}
export function parseAlphalinerText(text:string,options:Pick<ShippingSnapshot,'sourceUrl'|'retrievedAt'|'retrievalMethod'>):ShippingSnapshot{
 const dates=[...text.matchAll(/Alphaliner\s+TOP\s+100\s*\/\s*(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})/g)].map(m=>{const month=months.indexOf(m[2]);if(month<0)throw Error('Unknown source date');return `${m[3]}-${String(month+1).padStart(2,'0')}-${m[1].padStart(2,'0')}`;});
 if(!dates.length||new Set(dates).size!==1)throw Error('Missing or mixed source dates');
 const chart=new Map<number,ShippingEntry>(),fleet=new Map<number,{name:string;teu:number;ships:number}>();
 for(const line of text.split('\n')){const cells=line.split('|').map(v=>v.trim());if(!/^(?:[1-9]|10)$/.test(cells[0])||cells.length<4)continue;const rank=Number(cells[0]);const name=cells[1],capacityTeu=integer(cells[2]);if(cells[3].endsWith('%')){const carrier=carriers.find(c=>c.sourceNames.includes(name));if(!carrier)throw Error(`Unknown carrier: ${name}`);if(chart.has(rank))throw Error('Duplicate chart rank');chart.set(rank,{rank,carrierId:carrier.id,sourceName:name,capacityTeu,sharePercent:Number(cells[3].replace('%','')),shipCount:null});}else{if(fleet.has(rank))throw Error('Duplicate fleet rank');fleet.set(rank,{name,teu:capacityTeu,ships:integer(cells[3])});}}
 const entries=[...chart.values()].sort((a,b)=>a.rank-b.rank).map(e=>{const f=fleet.get(e.rank);if(!f||f.name!==e.sourceName||f.teu!==e.capacityTeu)throw Error('Chart and fleet table disagree');return {...e,shipCount:f.ships};});
 return validateShippingSnapshot({sourceId:'alphaliner',asOf:dates[0],metric:'operated-container-capacity-teu',scope:'consolidated',...options,entries});
}
