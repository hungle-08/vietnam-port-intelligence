'use client';

import Link from 'next/link';
import {Anchor,ArrowUpRight,Clock3,MapPin} from 'lucide-react';
import {getMessages,portName,type Locale} from '@/lib/i18n';
import type {PortRecord} from '@/lib/ports/types';
import './port-directory.css';

export function PortDirectory({ports,locale,selectedId}:{ports:PortRecord[];locale:Locale;selectedId:string|null}){
 const t=getMessages(locale),vi=locale==='vi';
 const sorted=[...ports].sort((a,b)=>Number(b.stockTicker==='PHP')-Number(a.stockTicker==='PHP'));
 const ready=ports.filter(port=>port.stockTicker==='PHP').length;
 return <div className="port-catalog">
  <div className="port-catalog-summary"><span><strong>{ports.length}</strong> {vi?'cảng / doanh nghiệp':'ports / operators'}</span><span className="port-catalog-availability"><i/>{ready} {vi?'có trang chi tiết':'detail page available'}</span></div>
  {ports.length?<div className="port-catalog-grid">{sorted.map(port=>{
   const available=port.stockTicker==='PHP';
   const content=<>
    <div className="port-catalog-card-top"><span className="port-catalog-symbol"><Anchor size={20}/></span><span className={`port-catalog-badge${available?' is-ready':''}`}>{available?(vi?'Đã có dữ liệu':'Data available'):(vi?'Đang triển khai':'In development')}</span></div>
    <div className="port-catalog-code"><strong>{port.stockTicker||port.internalCode}</strong>{port.exchange&&<span>{port.exchange}</span>}</div>
    <h3>{portName(port,locale)}</h3>
    <p className="port-catalog-location"><MapPin size={14}/>{port.sourceLocation}<span>· {port.entityType==='group'?(vi?'Hệ thống cảng':'Port network'):t[port.region]}</span></p>
    <div className="port-catalog-card-footer">{available?<><span>{vi?'Khám phá dữ liệu cảng':'Explore port data'}</span><span className="port-catalog-cta">{vi?'Xem chi tiết':'View details'}<ArrowUpRight size={16}/></span></>:<><span>{vi?'Trang chi tiết đang được xây dựng':'Detail page is being prepared'}</span><Clock3 size={16}/></>}</div>
   </>;
   return available?<Link key={port.internalCode} href={`/${locale}/ports/PHP`} className="port-catalog-card is-available" aria-label={`${portName(port,locale)} · ${vi?'Xem chi tiết':'View details'}`}>{content}</Link>:<article key={port.internalCode} className={`port-catalog-card is-pending${selectedId===port.internalCode?' is-selected':''}`}>{content}</article>;
  })}</div>:<div className="port-catalog-empty" role="status"><Anchor size={28}/><p>{t.noResults}</p></div>}
 </div>;
}
