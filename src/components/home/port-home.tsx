'use client';
import {HomeHeader} from './home-header';
import './home-hero.css';
import './home-overview.css';
import {useState} from 'react';
import type {AccountUser} from '@/lib/auth/types';
import Link from 'next/link';
import {ArrowUpRight,Search,Database,Activity} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {getMessages,type Locale} from '@/lib/i18n';
import {filterPorts} from '@/lib/ports/domain';
import type {PortRecord} from '@/lib/ports/types';
import {PortMap} from './port-map';
import {PortDirectory} from './port-directory';
import {PortDetails} from './port-details';
import {ShippingRankingSection} from './shipping-ranking';
import type {ShippingRanking} from '@/lib/shipping/types';
import {TradeChart} from './trade-chart';
import type {TradeDataset} from '@/lib/trade/types';
export function PortHome({locale,ports,loadError,shippingRanking,tradeDataset={months:[],updatedAt:null,sourceUrl:null},tradeLoadError=false,currentDay,user=null,initialQuery='',initialRegion='all',initialSelected=null}:{locale:Locale;ports:PortRecord[];loadError:boolean;shippingRanking:ShippingRanking;tradeDataset?:TradeDataset;tradeLoadError?:boolean;currentDay:string;user?:AccountUser|null;initialQuery?:string;initialRegion?:string;initialSelected?:string|null}){
 const t=getMessages(locale);const [query,setQuery]=useState(initialQuery),[region,setRegion]=useState(initialRegion),[selected,setSelected]=useState<string|null>(initialSelected);
 const filtered=filterPorts(ports,query,region);
 const holdingSelected=ports.find(p=>p.internalCode===selected&&p.mapVisible===false);
 const context=new URLSearchParams();if(query)context.set('q',query);if(region!=='all')context.set('region',region);if(selected)context.set('port',selected);
 return <div className="port-site home-shell">
  <HomeHeader locale={locale} user={user} context={context.toString()}/>
  <main><section className="home-hero"><div className="hero-copy"><p className="eyebrow"><span/>{t.eyebrow}</p><h1>{t.heading}</h1><p className="hero-intro">{t.intro}</p><p className="hero-description">{t.introDetail}</p><div className="home-hero-actions"><a className="home-primary-action" href="#directory">{t.explore}<ArrowUpRight size={17}/></a><a className="home-secondary-action" href="#vietnam-trade">{locale==='vi'?'Xem dữ liệu thương mại':'Explore trade data'}<ArrowUpRight size={15}/></a></div><div className="home-hero-facts"><div><strong>{ports.length}</strong><span>{locale==='vi'?'Mã cảng & doanh nghiệp':'Port & operator tickers'}</span></div><div><strong>PHP</strong><span>{locale==='vi'?'Kế hoạch tàu Hải Phòng':'Hai Phong vessel plans'}</span></div></div></div><PortMap ports={ports} locale={locale} selectedId={selected} onSelect={setSelected}/></section>
   <section id="directory" className="directory-section"><div className="section-heading"><div><p className="eyebrow">{locale==='vi'?'DANH MỤC CẢNG':'PORT DIRECTORY'}</p><h2>{t.directoryTitle}</h2><p>{t.directoryIntro}</p></div><span className="source-tag">{t.sourceNote}</span></div>
    <div className="directory-filters"><label className="search-box"><Search size={18}/><input aria-label={t.searchLabel} placeholder={t.search} value={query} onChange={e=>{setQuery(e.target.value)}}/></label><div className="region-tabs">{(['all','north','central','south'] as const).map(r=><button key={r} aria-pressed={region===r} onClick={()=>{setRegion(r)}}>{t[r]}</button>)}</div></div>
    {loadError?<div role="alert" className="empty-message">{t.loadError}<Button onClick={()=>window.location.reload()}>{t.retry}</Button></div>:<PortDirectory ports={filtered} locale={locale} selectedId={selected}/>}
    {holdingSelected&&<div className="mt-4 max-w-sm"><PortDetails port={holdingSelected} locale={locale} onClose={()=>setSelected(null)}/></div>}
    <p className="directory-note">{t.evidenceNote} {t.mapMissing}</p>
   </section>
   <TradeChart dataset={tradeDataset} locale={locale} currentDay={currentDay} loadError={tradeLoadError}/>
   <ShippingRankingSection ranking={shippingRanking} locale={locale}/>
   <section className="home-method" aria-label={locale==='vi'?'Thông tin dữ liệu':'About the data'}><div><Database size={21}/><div><h3>{locale==='vi'?'Dữ liệu có nguồn đối chiếu':'Traceable data sources'}</h3><p>{locale==='vi'?'Các báo cáo đi kèm nguồn, thời điểm cập nhật và phạm vi thống kê.':'Reports include their source, update date and statistical scope.'}</p></div></div><div><Activity size={21}/><div><h3>{locale==='vi'?'Đọc số liệu đúng phạm vi':'Understand each metric'}</h3><p>{locale==='vi'?'DWT là sức chở tàu theo kế hoạch. Kim ngạch thương mại là giá trị hàng hóa bằng USD.':'DWT measures planned vessel capacity. Trade value measures merchandise in USD.'}</p></div></div></section>
  </main><footer className="site-footer"><Link href={`/${locale}`}>Vietnam Port Intelligence</Link><p>{t.footer}</p><span>© {currentDay.slice(0,4)}</span></footer>
 </div>;
}
