import {load} from 'cheerio';
import {createHash} from 'node:crypto';
import {matchTerminal,normalizeLocation,phpTerminals} from './directory';
import {isPhpPortMovement,scopePhpSnapshot,regionalPlanSnapshot} from './scope';
import {PHP_SOURCE,validateDay} from './config';
import type {Movement,PlannedEvent,PlanSnapshot} from './types';
export function parseVietnamNumber(s:string):number|null {
 const text=s.trim();if(!text||['-','N/A','(CHƯA XĐ)'].includes(text.toUpperCase()))return null;
 if(!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(text))throw Error('Invalid source number');
 const n=Number(text.replaceAll('.','').replace(',','.'));if(!Number.isFinite(n)||n<0||n>1_000_000_000)throw Error('Invalid source number');return n===0?null:n;
}
function parsePlan(html:string,requestedDay:string,fetchedAt:string,sourceUrl:string,regional:boolean):PlanSnapshot {
 validateDay(requestedDay);const $=load(html);
 const date=$('body').text().match(/KẾ HOẠCH ĐIỀU ĐỘNG TÀU NGÀY\s+(\d{2})\/(\d{2})\/(\d{4})/);
 if(!date||`${date[3]}-${date[2]}-${date[1]}`!==requestedDay)throw Error('Source date mismatch');
 const events:PlannedEvent[]=[];const seen=new Set<string>();let duplicateCount=0;
 const sections:[string,Movement][]=[['Roi','departure'],['DiChuyen','transfer'],['Vao','arrival'],['QuaLuong','transit']];
 for(const [id,movement] of sections){
  const section=$(`#TD_ShowShipPlan_${id}`),table=section.find('table').first();
  if(section.length!==1)throw Error('Missing source section');
  if(movement==='transit'&&!table.length&&!section.text().trim())continue;
  if(table.length!==1)throw Error('Missing source table');
  const header=table.find('tr').first().find('th').map((_,el)=>normalizeLocation($(el).text())).get();
  const expected=movement==='transit'?['STT','THOI GIAN','TEN TAU','MON NUOC','LOA','DWT','TEN LUONG','XUAT PHAT','NOI DEN','HOA TIEU']:['STT','THOI GIAN','TEN TAU','MON NUOC','LOA','DWT','GT','TAU LAI','T.LUONG','TU','DEN','DAI LY','HOA TIEU'];
  if(header.length!==expected.length||header.some((h,i)=>h!==expected[i]))throw Error('Source headers changed');
  if(!regional&&movement!=='arrival'&&movement!=='departure')continue;
  table.find('tr').slice(1).each((_,row)=>{
   const cells=$(row).children('td').map((_,cell)=>$(cell).text().trim().replace(/\s+/g,' ')).get();
   if(!cells.length)return;
   const clean=cells;
   if(clean.length!==expected.length||!/^\d+$/.test(clean[0])||!clean[2])throw Error('Incomplete source row');
   const transit=movement==='transit';
   const fromName=clean[transit?7:9],toName=clean[transit?8:10],fromTerminal=matchTerminal(fromName),toTerminal=matchTerminal(toName);
   if(!regional&&!isPhpPortMovement({movement,fromTerminal,toTerminal}))return;
   const time=clean[1]||null;if(time&&!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error('Invalid planned time');
   const key=createHash('sha256').update(JSON.stringify([requestedDay,movement,time,normalizeLocation(clean[2]),normalizeLocation(fromName),normalizeLocation(toName)])).digest('hex');
   const event:PlannedEvent={key,sourceOrdinal:Number(clean[0]),movement,plannedTime:time,vesselName:clean[2],dwt:parseVietnamNumber(clean[5]),gt:transit?null:parseVietnamNumber(clean[6]),loa:parseVietnamNumber(clean[4]),draft:parseVietnamNumber(clean[3]),fromName,toName,fromTerminal,toTerminal,channel:clean[transit?6:8],tugs:transit?'':clean[7],agent:transit?'':clean[11],pilot:clean[transit?9:12],status:'planned',callMatchStatus:'unlinked',rawCells:clean};
   if(seen.has(key)){
    const prior=events.find(e=>e.key===key)!;
    if(prior.dwt!==event.dwt||prior.gt!==event.gt||prior.loa!==event.loa)throw Error('Ambiguous repeated planned event');
    const supplemental=(e:PlannedEvent)=>({draft:e.draft,channel:e.channel,tugs:e.tugs,agent:e.agent,pilot:e.pilot});
    const variants=prior.supplementalVariants??[supplemental(prior)];
    const next=supplemental(event);
    if(!variants.some(v=>JSON.stringify(v)===JSON.stringify(next))){
     variants.push(next);prior.supplementalVariants=variants.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
     // Do not assert a conflicting supplemental value as authoritative.
     prior.draft=variants.every(v=>v.draft===variants[0].draft)?variants[0].draft:null;
     for(const field of ['channel','tugs','agent','pilot'] as const)prior[field]=variants.every(v=>v[field]===variants[0][field])?variants[0][field]:'';
    }
    duplicateCount++;return;
   }seen.add(key);events.push(event);
  });
 }
 const snapshot={planDate:requestedDay,fetchedAt,sourceUrl,rawHtml:html,events,contentHash:'',duplicateCount};
 return regional?regionalPlanSnapshot(snapshot):scopePhpSnapshot(snapshot);
}
export function parseHaiphongPlan(html:string,day:string,fetchedAt=new Date().toISOString(),sourceUrl=PHP_SOURCE){return parsePlan(html,day,fetchedAt,sourceUrl,true);}
// Scoped parser retained for PHP-only analysis and comparison of historical reports.
export function parsePhpPlan(html:string,day:string,fetchedAt=new Date().toISOString(),sourceUrl=PHP_SOURCE){return parsePlan(html,day,fetchedAt,sourceUrl,false);}
export function summarizePhp(events:PlannedEvent[],scope:'direct'|'system'){
 const ids=new Set(phpTerminals.filter(t=>scope==='system'||t.scope==='direct').map(t=>String(t.id)));
 const inbound=events.filter(e=>e.movement==='arrival'&&e.toTerminal&&ids.has(e.toTerminal));
 return {calls:inbound.length,dwt:inbound.reduce((s,e)=>s+(e.dwt??0),0),missingDwt:inbound.filter(e=>e.dwt===null).length};
}
