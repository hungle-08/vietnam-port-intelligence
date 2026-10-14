'use client';

import {useState,type ReactNode} from 'react';
import {vietnamDay} from '@/lib/php/config';
import {Tabs} from '@base-ui/react/tabs';
import {LayoutDashboard,Newspaper} from 'lucide-react';
import type {Locale} from '@/lib/i18n';
import './php-detail-tabs.css';
import {PhpNews} from './php-news';

export function PhpDetailTabs({locale,children}:{locale:Locale;children:ReactNode}){
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
