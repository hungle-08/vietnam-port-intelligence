'use client';

import {useState,type ReactNode} from 'react';
import {vietnamDay} from '@/lib/php/config';
import {Tabs} from '@base-ui/react/tabs';
import {LayoutDashboard,Newspaper,Building2} from 'lucide-react';
import type {Locale} from '@/lib/i18n';
import {PHP_SITE_APPEARANCE} from '@/lib/php/presentation';
import './php-detail-tabs.css';
import {PhpNews} from './php-news';

export function PhpOverviewTabs({locale,children}:{locale:Locale;children:ReactNode}){
 const vi=locale==='vi';
 const [newsMonth,setNewsMonth]=useState(()=>vietnamDay().slice(0,7));
 return <Tabs.Root defaultValue="overview" className="php-detail-tabs">
  <Tabs.List className="php-detail-tab-list" activateOnFocus aria-label={vi?'Nội dung Cảng Hải Phòng':'Port of Hai Phong sections'}>
   <Tabs.Tab value="overview" className="php-detail-tab"><LayoutDashboard size={17}/>{vi?'Tổng quan':'Overview'}</Tabs.Tab>
   <Tabs.Tab value="news" className="php-detail-tab"><Newspaper size={17}/>{vi?'Tin tức':'News'}</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="overview" keepMounted className="php-detail-panel">{children}</Tabs.Panel>
  <Tabs.Panel value="news" className="php-detail-panel">
   <PhpNews locale={locale} month={newsMonth} onMonthChange={setNewsMonth}/>
  </Tabs.Panel>
 </Tabs.Root>;
}

export function PhpDetailTabs({locale,children,terminalContent}:{locale:Locale;children:ReactNode;terminalContent:Record<string,ReactNode>}){
 const vi=locale==='vi';
 return <Tabs.Root defaultValue="php" className="php-system-tabs">
  <div className="php-system-tab-nav"><Tabs.List className="php-system-tab-list" activateOnFocus aria-label={vi?'Cảng và hệ thống PHP':'PHP system and ports'}>
   <Tabs.Tab value="php" className="php-system-tab"><LayoutDashboard size={16}/>{vi?'Tổng quan PHP':'PHP overview'}</Tabs.Tab>
   {PHP_SITE_APPEARANCE.map(site=><Tabs.Tab key={site.id} value={site.id} className="php-system-tab"><Building2 size={15}/>{vi?site.vi:site.en}</Tabs.Tab>)}
  </Tabs.List></div>
  <p className="php-system-tab-hint">{vi?'Vuốt ngang để xem đủ 6 tab →':'Swipe to see all 6 tabs →'}</p>
  <Tabs.Panel value="php" className="php-system-panel">{children}</Tabs.Panel>
  {PHP_SITE_APPEARANCE.map(site=><Tabs.Panel key={site.id} value={site.id} className="php-system-panel">{terminalContent[site.id]}</Tabs.Panel>)}
 </Tabs.Root>;
}
