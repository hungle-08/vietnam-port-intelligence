'use client';
import {ThemeToggle} from '@/components/theme/theme-toggle';
import {useState} from 'react';
import {logout} from '@/lib/auth/actions';
import {authMessages} from '@/lib/auth/messages';
import type {AccountUser} from '@/lib/auth/types';
import Link from 'next/link';
import {Anchor,ArrowUpRight,Search,Waves} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {getMessages,type Locale} from '@/lib/i18n';
import {filterPorts} from '@/lib/ports/domain';
import type {PortRecord} from '@/lib/ports/types';
import {PortMap} from './port-map';
import {PortDirectory} from './port-directory';
import {PortDetails} from './port-details';
import {ShippingRankingSection} from './shipping-ranking';
import type {ShippingRanking} from '@/lib/shipping/types';
export function PortHome({locale,ports,loadError,shippingRanking,user=null,initialQuery='',initialRegion='all',initialSelected=null}:{locale:Locale;ports:PortRecord[];loadError:boolean;shippingRanking:ShippingRanking;user?:AccountUser|null;initialQuery?:string;initialRegion?:string;initialSelected?:string|null}){
 const t=getMessages(locale),a=authMessages(locale);const [query,setQuery]=useState(initialQuery),[region,setRegion]=useState(initialRegion),[selected,setSelected]=useState<string|null>(initialSelected);
 const filtered=filterPorts(ports,query,region);
 const holdingSelected=ports.find(p=>p.internalCode===selected&&p.mapVisible===false);
 const context=new URLSearchParams();if(query)context.set('q',query);if(region!=='all')context.set('region',region);if(selected)context.set('port',selected);
 return <div className="port-site">
  <header className="site-header"><Link href={`/${locale}`} className="brand"><span className="brand-mark"><Anchor size={22}/></span><span>VIETNAM PORT<span className="brand-sub">INTELLIGENCE</span></span></Link><nav aria-label={t.home}><a href="#directory">{t.directory}</a><ThemeToggle locale={locale}/><div className="locale-switch" aria-label={t.language}>{(['vi','en'] as const).map(l=><Link href={`/${l}${context.size?'?'+context:''}`} key={l} aria-current={locale===l?'page':undefined}>{l.toUpperCase()}</Link>)}</div><div className="header-account">{user?<>{user.role==='admin'&&<Link className="header-admin" href="/admin">{locale==='vi'?'Quản trị':'Admin'}</Link>}<span className="account-name" title={user.name}>{user.name}</span><form action={logout.bind(null,locale)}><Button type="submit" variant="ghost">{a.logout}</Button></form></>:<><Link href={`/${locale}/login`}>{a.login}</Link><Link className="header-register" href={`/${locale}/register`}>{a.register}</Link></>}</div></nav></header>
  <main><section className="home-hero"><div className="hero-copy"><h1>{t.heading}</h1><p className="hero-intro">{t.intro}</p><p className="hero-description">{t.introDetail}</p></div><PortMap ports={ports} locale={locale} selectedId={selected} onSelect={setSelected}/></section>
   <ShippingRankingSection ranking={shippingRanking} locale={locale}/>
   <section id="directory" className="directory-section"><div className="section-heading"><div><p className="eyebrow">{locale==='vi'?'DANH MỤC CẢNG':'PORT DIRECTORY'}</p><h2>{t.directoryTitle}</h2><p>{t.directoryIntro}</p></div><span className="source-tag">{t.sourceNote}</span></div>
    <div className="directory-filters"><label className="search-box"><Search size={18}/><input aria-label={t.searchLabel} placeholder={t.search} value={query} onChange={e=>{setQuery(e.target.value)}}/></label><div className="region-tabs">{(['all','north','central','south'] as const).map(r=><button key={r} aria-pressed={region===r} onClick={()=>{setRegion(r)}}>{t[r]}</button>)}</div></div>
    {loadError?<div role="alert" className="empty-message">{t.loadError}<Button onClick={()=>window.location.reload()}>{t.retry}</Button></div>:<PortDirectory ports={filtered} locale={locale} selectedId={selected}/>}
    {holdingSelected&&<div className="mt-4 max-w-sm"><PortDetails port={holdingSelected} locale={locale} onClose={()=>setSelected(null)}/></div>}
    <p className="directory-note">{t.evidenceNote} {t.mapMissing}</p>
   </section><section className="roadmap-section"><Waves className="roadmap-icon"/><div><p className="eyebrow">{t.upcoming}</p><h2>{t.roadmap}</h2><p>{t.roadmapText}</p></div><div className="roadmap-items">{[t.throughput,t.marketShare,t.history].map(item=><span key={item}>{item}<ArrowUpRight size={14}/></span>)}</div></section>
  </main><footer className="site-footer"><span>Vietnam Port Intelligence</span><p>{t.footer}</p><span>© 2026</span></footer>
 </div>;
}
