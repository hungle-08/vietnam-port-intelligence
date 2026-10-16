'use client';
import {useState} from 'react';
import {Skeleton} from '@/components/ui/skeleton';
import {getMessages,type Locale} from '@/lib/i18n';
import type {Carrier,ShippingRanking} from '@/lib/shipping/types';
function CarrierLogo({carrier}:{carrier:Carrier}){
 const [failed,setFailed]=useState(false),[loaded,setLoaded]=useState(false);
 return <div className="carrier-logo" aria-hidden="true">{failed?<span style={{color:carrier.color}}>{carrier.shortName}</span>:/* External brand asset; use a text fallback on hotlink/network failure. */
 // eslint-disable-next-line @next/next/no-img-element
 <>{!loaded&&<Skeleton className="carrier-logo-placeholder"/>}<img style={{opacity:loaded?1:0}} onLoad={()=>setLoaded(true)} src={carrier.logoUrl} alt="" width={100} height={40} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/></>}</div>;
}
export function ShippingRankingSection({ranking,locale}:{ranking:ShippingRanking;locale:Locale}){
 const t=getMessages(locale);const number=new Intl.NumberFormat(locale==='vi'?'vi-VN':'en-US');const percentage=(n:number)=>new Intl.NumberFormat(locale==='vi'?'vi-VN':'en-US',{minimumFractionDigits:1,maximumFractionDigits:1}).format(n)+'%';
 const date=new Intl.DateTimeFormat(locale==='vi'?'vi-VN':'en-GB',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(ranking.asOf+'T00:00:00Z'));
 const axisMax=Math.max(25,Math.ceil(Math.max(...ranking.entries.map(e=>e.sharePercent))/5)*5);
 return <section id="shipping-lines" className="shipping-section" aria-labelledby="shipping-title"><div className="section-heading"><div><p className="eyebrow">{t.shippingEyebrow}</p><h2 id="shipping-title">{t.shippingTitle}</h2><p>{t.shippingIntro}</p></div><span className="shipping-date">{ranking.asOfBasis==='retrieval-date'?(locale==='vi'?'Ngày thu thập':'Collected on'):t.shippingAsOf}<strong>{date}</strong></span></div>
  <div className="shipping-chart" style={{'--chart-steps':axisMax/5} as import('react').CSSProperties}>
   <div className="shipping-axis"><span>{t.shippingShare}</span><div>{Array.from({length:axisMax/5+1},(_,i)=><span key={i}>{i*5}%</span>)}</div></div>
   <ol className="shipping-list">{ranking.entries.map(entry=>{const carrier=ranking.carriers.find(c=>c.id===entry.carrierId)!;return <li className="shipping-row" key={carrier.id}>
    <div className="carrier-identity"><span className="carrier-rank">{String(entry.rank).padStart(2,'0')}</span><CarrierLogo carrier={carrier}/><a href={carrier.website} title={carrier.name} aria-label={carrier.name} target="_blank" rel="noopener noreferrer"><strong>{carrier.shortName}</strong></a></div>
    <div className="carrier-metrics"><div className="carrier-track" role="meter" aria-label={`${carrier.shortName} · ${t.shippingShare}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={entry.sharePercent} aria-valuetext={percentage(entry.sharePercent)}><span className="carrier-line" style={{width:`${entry.sharePercent/axisMax*100}%`,'--carrier-color':carrier.color} as import('react').CSSProperties}><i/></span></div><strong className="carrier-share">{percentage(entry.sharePercent)}</strong><span className="carrier-fleet">{number.format(entry.capacityTeu)} <small>TEU</small>{entry.shipCount!==null&&<> <i/> {number.format(entry.shipCount)} <small>{t.shippingShips}</small></>}</span></div>
   </li>})}</ol>
  </div>
  <div className="shipping-notes"><p>{t.shippingDefinition}</p><p>{locale==='vi'?'Tải trực tiếp lúc':'Fetched at'} {new Intl.DateTimeFormat(locale==='vi'?'vi-VN':'en-GB',{timeStyle:'medium',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(ranking.retrievedAt))} (UTC+7) · <a href={ranking.sourceUrl} target="_blank" rel="noopener noreferrer">Alphaliner TOP 100 ↗</a> · {t.shippingScope}</p></div>
 </section>;
}
