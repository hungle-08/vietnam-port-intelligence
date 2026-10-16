import {createHash} from 'node:crypto';
import {phpTerminals} from './directory';
import type {Movement,PlanSnapshot} from './types';
const ids=new Set<string>(phpTerminals.map(t=>t.id));
export function isPhpPortMovement(e:{movement:Movement;fromTerminal:string|null;toTerminal:string|null}){
 return e.movement==='arrival'?e.toTerminal!==null&&ids.has(e.toTerminal):e.movement==='departure'?e.fromTerminal!==null&&ids.has(e.fromTerminal):false;
}
export function scopePhpSnapshot(s:PlanSnapshot):PlanSnapshot{
 const events=s.events.filter(isPhpPortMovement);
 const canonical=events.map(e=>({...e,sourceOrdinal:0,rawCells:undefined})).sort((a,b)=>a.key.localeCompare(b.key));
 const contentHash=createHash('sha256').update(JSON.stringify(['php-arrival-departure-v1',canonical])).digest('hex');
 // Store a source-row extract, never the authority's entire regional plan.
 const audit=JSON.stringify({planDate:s.planDate,scope:'PHP arrivals and departures',events},null,2).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const rawHtml=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>PHP ${s.planDate}</title></head><body><pre>${audit}</pre></body></html>`;
 return {...s,events,contentHash,rawHtml};
}

export function regionalPlanSnapshot(s:PlanSnapshot):PlanSnapshot{
 const canonical=s.events.map(e=>({...e,sourceOrdinal:0,rawCells:undefined})).sort((a,b)=>a.key.localeCompare(b.key));
 const contentHash=createHash('sha256').update(JSON.stringify(['haiphong-regional-plan-v1',canonical])).digest('hex');
 return {...s,contentHash};
}
