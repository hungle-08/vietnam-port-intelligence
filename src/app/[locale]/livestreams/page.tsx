import Link from 'next/link';
import Image from 'next/image';
import {ArrowUpRight, CalendarDays, Play} from 'lucide-react';
import {Suspense} from 'react';
import {notFound} from 'next/navigation';
import {connection} from 'next/server';
import {SiteBrand} from '@/components/layout/site-brand';
import {ThemeToggle} from '@/components/theme/theme-toggle';
import '@/components/home/home-overview.css';
import {isLocale,type Locale} from '@/lib/i18n';
import {getDb} from '@/lib/db';

async function LiveList({locale}:{locale:Locale}){
 await connection();const vi=locale==='vi';
 const result=await (async()=>{try{const sql=getDb();return await sql`SELECT video_id,title,published_at,detected_at FROM youtube_live_videos ORDER BY published_at DESC LIMIT 500`;}catch{return null;}})();
 if(!result)return <p role="alert" className="py-12 text-center text-slate-500">{vi?'Không thể tải danh sách lúc này. Vui lòng thử lại sau.':'Unable to load the list. Please try again later.'}</p>;
 const rows=result;
  if(!rows.length)return <p className="py-12 text-center text-slate-500">{vi?'Chưa lưu được livestream nào.':'No livestreams have been saved yet.'}</p>;
  const date=(x:unknown)=>new Intl.DateTimeFormat(vi?'vi-VN':'en-GB',{timeZone:'Asia/Ho_Chi_Minh',dateStyle:'full',timeStyle:'short'}).format(new Date(String(x)));
  return <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{rows.map(row=>{
   const videoId=String(row.video_id);
   return <a key={videoId} href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer" className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 dark:border-slate-700/70 dark:bg-slate-900/60 dark:hover:border-blue-500/60 sm:flex-row sm:items-center sm:gap-5">
    <span className="relative block aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-slate-800 sm:w-48">
     <Image src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" fill unoptimized sizes="(min-width: 640px) 192px, 100vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
     <span aria-hidden="true" className="absolute inset-0 grid place-items-center bg-black/10 transition-colors group-hover:bg-black/25"><span className="grid h-10 w-10 place-items-center rounded-full bg-black/65 text-white"><Play size={17} fill="currentColor" className="ml-0.5" /></span></span>
    </span>
    <span className="flex min-w-0 flex-1 flex-col gap-2 px-1 pb-1 sm:py-2">
     <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400"><CalendarDays size={14}/>{date(row.published_at)}</span>
     <strong className="text-base font-semibold leading-snug text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">{String(row.title)}</strong>
     <span className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">{vi?'Xem trên YouTube':'Watch on YouTube'}<ArrowUpRight size={15}/><span className="sr-only">{vi?'(mở trong tab mới)':'(opens in a new tab)'}</span></span>
    </span>
   </a>;
  })}</div>;
}
export default async function LivestreamsPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isLocale(locale))notFound();const vi=locale==='vi';
 return <main className="min-h-screen bg-white text-slate-900 dark:bg-[#081421] dark:text-slate-100"><div className="port-site"><header className="home-header"><SiteBrand locale={locale}/><nav className="flex items-center gap-2 sm:gap-4" aria-label={vi?'Điều hướng trang':'Page navigation'}><Link href={`/${locale}`} className="hidden text-xs text-slate-500 sm:block">{vi?'Về trang chủ':'Back to home'}</Link><ThemeToggle locale={locale}/><div className="home-language" aria-label={vi?'Chọn ngôn ngữ':'Language'}>{(['vi','en'] as const).map(l=><Link key={l} href={`/${l}/livestreams`} aria-current={l===locale?'page':undefined}>{l.toUpperCase()}</Link>)}</div></nav></header><section className="py-12 sm:py-16"><p className="text-xs font-semibold tracking-[0.2em] text-blue-500">YOUTUBE · NGUYEN HUY</p><h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{vi?'Livestream theo ngày':'Livestream archive'}</h1><p className="mt-4 w-full text-sm leading-7 text-slate-500">{vi?'Danh sách liên kết livestream đã được ghi nhận từ kênh Nguyễn Huy. Khả năng xem lại phụ thuộc vào quyền truy cập video trên YouTube.':'Saved livestream links from Nguyễn Huy. Playback depends on the video’s availability on YouTube.'}</p><div className="mt-8"><Suspense fallback={<p className="py-12 text-slate-500">{vi?'Đang tải...':'Loading...'}</p>}><LiveList locale={locale}/></Suspense></div></section></div></main>;
}
