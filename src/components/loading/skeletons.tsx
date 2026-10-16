import type {Locale} from '@/lib/i18n';
import {cn} from '@/lib/utils';
import {Skeleton} from '@/components/ui/skeleton';
import {LoadingStatus} from './loading-status';
import './loading.css';
const copy=(locale:Locale,vi:string,en:string)=>locale==='vi'?vi:en;
function Lines(){return <div className="skeleton-lines"><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-4/5"/><Skeleton className="h-3 w-3/5"/></div>;}
function ChartShape(){return <div className="skeleton-chart-shape" aria-hidden="true"><div className="skeleton-chart-bars">{[35,48,42,68,58,74,65,83,72,62,78,70].map((height,i)=><Skeleton key={i} style={{height:`${height}%`}}/>)}</div><div className="skeleton-chart-ticks">{Array.from({length:6},(_,i)=><Skeleton key={i} className="h-2 w-10"/>)}</div><Skeleton className="h-5 w-full"/></div>;}
export function ChartSkeleton({locale='vi',className}:{locale?:Locale;className?:string}){
 return <div className={cn('chart-skeleton',className)} role="status" aria-busy="true"><span className="sr-only">{copy(locale,'Đang tải biểu đồ…','Loading chart…')}</span><ChartShape/></div>;
}
export function ShippingRankingSkeleton({locale}:{locale:Locale}){
 return <div className="shipping-chart shipping-skeleton" role="status" aria-busy="true"><span className="sr-only">{copy(locale,'Đang tải bảng xếp hạng hãng tàu từ Alphaliner…','Loading carrier rankings from Alphaliner…')}</span><div aria-hidden="true"><div className="shipping-axis"><Skeleton className="h-3 w-24"/><Skeleton className="h-3 w-full"/></div>{Array.from({length:10},(_,i)=><div className="shipping-row" key={i}><div className="skeleton-carrier-identity"><Skeleton className="h-3 w-4"/><Skeleton className="skeleton-carrier-logo"/><Skeleton className="h-3 flex-1"/></div><div className="skeleton-carrier-metric"><Skeleton className="h-2" style={{width:`${88-i*6}%`}}/><Skeleton className="h-2 w-28"/></div></div>)}</div></div>;
}
export function NewsSkeleton({locale}:{locale:Locale}){
 return <div className="php-news-loading" role="status" aria-busy="true"><p>{copy(locale,'Đang tải tin tức trong tháng…','Loading monthly news…')}</p><div className="php-news-grid" aria-hidden="true">{Array.from({length:6},(_,i)=><div className="news-card-skeleton" key={i}><Skeleton className="aspect-video w-full rounded-none"/><div className="news-card-skeleton-body"><Skeleton className="h-2 w-2/5"/><Lines/><Skeleton className="h-3 w-1/3"/></div></div>)}</div></div>;
}
export function PageSkeleton({locale,variant='home',register=false}:{locale:Locale;variant?:'home'|'php'|'auth'|'admin';register?:boolean}){
 const labels={home:copy(locale,'Đang tải tổng quan cảng Việt Nam…','Loading Vietnam port overview…'),php:copy(locale,'Đang tải dữ liệu Cảng Hải Phòng…','Loading Hai Phong port data…'),auth:copy(locale,'Đang tải trang tài khoản…','Loading account page…'),admin:copy(locale,'Đang tải trang quản trị…','Loading administration…')};
 return <div className={`page-skeleton page-skeleton-${variant}`} aria-busy="true"><header className="page-skeleton-header" aria-hidden="true"><div><Skeleton className="size-10 rounded-xl"/><Skeleton className="h-5 w-36"/></div><Skeleton className="h-8 w-24"/></header><main className="page-skeleton-main"><LoadingStatus label={labels[variant]}/><div aria-hidden="true">
  {variant==='auth'?<div className="skeleton-auth-card"><Skeleton className="mx-auto size-14 rounded-2xl"/><Skeleton className="mx-auto h-7 w-3/5"/><Lines/>{Array.from({length:register?3:2},(_,i)=><div className="skeleton-auth-field" key={i}><Skeleton className="h-3 w-20"/><Skeleton className="h-11 w-full"/></div>)}<Skeleton className="h-11 w-full"/><Skeleton className="mx-auto h-3 w-3/5"/></div>:<>
   {variant==='home'?<div className="skeleton-home-hero"><div><Skeleton className="h-3 w-32"/><Skeleton className="h-12 w-full"/><Skeleton className="h-12 w-4/5"/><Lines/></div><Skeleton className="skeleton-map"/></div>:<div className="skeleton-page-title"><Skeleton className="h-3 w-24"/><Skeleton className="h-9 w-3/5"/><Skeleton className="h-3 w-4/5"/></div>}
   <div className="skeleton-cards" data-layout={variant}>{Array.from({length:variant==='home'?4:3},(_,i)=><div className="skeleton-card" key={i}><Skeleton className="size-9 rounded-lg"/><Lines/></div>)}</div>
   {variant==='php'||variant==='home'?<div className="skeleton-page-chart"><ChartShape/></div>:<div className="skeleton-admin-form">{Array.from({length:4},(_,i)=><div key={i}><Skeleton className="h-3 w-32"/><Skeleton className="h-10 w-full"/></div>)}<Skeleton className="h-9 w-32"/></div>}
  </>}
 </div></main></div>;
}
