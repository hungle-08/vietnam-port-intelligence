'use client';
import {useEffect,useState} from 'react';
import {ShippingRankingSkeleton} from '@/components/loading/skeletons';
import {getMessages,type Locale} from '@/lib/i18n';
import type {ShippingRanking} from '@/lib/shipping/types';
import {ShippingRankingSection} from './shipping-ranking';
import {ALPHALINER_PAGE} from '@/lib/shipping/source';
export function LiveShippingRanking({locale}:{locale:Locale}){
 const [result,setResult]=useState<{ranking?:ShippingRanking;error?:boolean}|null>(null),[attempt,setAttempt]=useState(0);
 const vi=locale==='vi',t=getMessages(locale);
 useEffect(()=>{
  const controller=new AbortController();
  async function load(){
   try{
    const response=await fetch('/api/shipping-lines',{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw Error('unavailable');
    const ranking=await response.json() as ShippingRanking;
    if(!Array.isArray(ranking.entries)||ranking.entries.length!==10)throw Error('incomplete');
    if(!controller.signal.aborted)setResult({ranking});
   }catch{if(!controller.signal.aborted)setResult({error:true});}
  }
  void load();return()=>controller.abort();
 },[attempt]);
 if(result?.ranking)return <ShippingRankingSection ranking={result.ranking} locale={locale}/>;
 return <section id="shipping-lines" className="shipping-section" aria-labelledby="shipping-title" aria-busy={!result}>
  <div className="section-heading"><div><p className="eyebrow">{t.shippingEyebrow}</p><h2 id="shipping-title">{t.shippingTitle}</h2><p>{t.shippingIntro}</p></div></div>
  {result?.error?<div className="shipping-live-status" role="alert"><p>{vi?'Chưa thể lấy dữ liệu từ Alphaliner. Vui lòng thử lại.':'Unable to fetch Alphaliner data. Please try again.'}</p><button type="button" onClick={()=>{setResult(null);setAttempt(v=>v+1);}}>{vi?'Thử lại':'Try again'}</button></div>:<ShippingRankingSkeleton locale={locale}/>}
  <div className="shipping-notes"><p>{t.shippingDefinition}</p><p><a href={ALPHALINER_PAGE} target="_blank" rel="noopener noreferrer">Alphaliner TOP 100 ↗</a></p></div>
 </section>;
}
