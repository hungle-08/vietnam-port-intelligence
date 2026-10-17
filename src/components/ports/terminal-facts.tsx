import {ArrowUpRight,ChevronDown,Info} from 'lucide-react';
import type {Locale} from '@/lib/i18n';
import {terminalFacts} from '@/lib/php/terminal-facts';

export function TerminalFactsPanel({id,locale}:{id:string;locale:Locale}){
 const data=terminalFacts[id];
 if(!data)return null;
 const vi=locale==='vi';
 const sources=[...new Map([...data.facts,...data.additional].map(f=>[f.source.url,f.source])).values()];
 const renderFact=(f:(typeof data.facts)[number],i:number)=><div className="terminal-fact" key={i}>
  <dt>{f.label[locale]}</dt><dd>{f.value[locale]}</dd>
  {f.note&&<p>{f.note[locale]}</p>}
  <a href={f.source.url} target="_blank" rel="noreferrer" title={`${f.source.label[locale]} · ${f.source.period[locale]}`}>{vi?'Nguồn':'Source'} [{sources.findIndex(s=>s.url===f.source.url)+1}]<ArrowUpRight size={11}/></a>
 </div>;
 return <>
  <section className="terminal-facts" aria-label={vi?'Hạ tầng & năng lực':'Infrastructure & capacity'}>
   <div className="terminal-facts-heading"><div><p className="eyebrow">{vi?'QUY MÔ KHAI THÁC':'OPERATING FOOTPRINT'}</p><h3>{vi?'Hạ tầng & năng lực':'Infrastructure & capacity'}</h3></div><span>{vi?'Theo hồ sơ công bố':'Based on published disclosures'}</span></div>
   <dl className="terminal-fact-grid">{data.facts.map(renderFact)}</dl>
   {data.capacityNote&&<p className="terminal-capacity-note"><Info size={15}/><span>{data.capacityNote[locale]}</span></p>}
   {data.additional.length>0&&<details className="terminal-fact-more"><summary>{vi?'Thông số bổ sung':'Additional specifications'}<ChevronDown size={15}/></summary><dl className="terminal-fact-grid">{data.additional.map(renderFact)}</dl></details>}
   <details className="terminal-evidence"><summary>{vi?'Nguồn & thời điểm công bố':'Sources & reporting dates'} <span>({sources.length})</span></summary><ol>{sources.map((s,i)=><li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">[{i+1}] {s.label[locale]}<ArrowUpRight size={12}/></a><p>{s.period[locale]}</p></li>)}</ol></details>
  </section>

 </>;
}
