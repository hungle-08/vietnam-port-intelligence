'use client';

import type {ReactNode} from 'react';
import {Tabs} from '@base-ui/react/tabs';
import {LayoutDashboard,Newspaper} from 'lucide-react';
import type {Locale} from '@/lib/i18n';
import './php-detail-tabs.css';

export function PhpDetailTabs({locale,children}:{locale:Locale;children:ReactNode}){
 const vi=locale==='vi';
 return <Tabs.Root defaultValue="overview" className="php-detail-tabs">
  <Tabs.List className="php-detail-tab-list" activateOnFocus aria-label={vi?'Nội dung Cảng Hải Phòng':'Port of Hai Phong sections'}>
   <Tabs.Tab value="overview" className="php-detail-tab"><LayoutDashboard size={17}/>{vi?'Tổng quan':'Overview'}</Tabs.Tab>
   <Tabs.Tab value="news" className="php-detail-tab"><Newspaper size={17}/>{vi?'Tin tức':'News'}</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="overview" keepMounted className="php-detail-panel">{children}</Tabs.Panel>
  <Tabs.Panel value="news" className="php-detail-panel">
   <div className="php-news-placeholder">
    <span className="php-news-icon"><Newspaper size={28}/></span>
    <h2>{vi?'Tin tức Cảng Hải Phòng':'Port of Hai Phong news'}</h2>
    <p>{vi?'Tin tức và cập nhật liên quan đến PHP sẽ được bổ sung tại đây.':'News and updates related to PHP will be available here.'}</p>
    <span className="php-news-coming-soon">{vi?'Sắp ra mắt':'Coming soon'}</span>
   </div>
  </Tabs.Panel>
 </Tabs.Root>;
}
