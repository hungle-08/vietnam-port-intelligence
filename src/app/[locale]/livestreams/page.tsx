import Link from 'next/link';
import Image from 'next/image';
import {ArrowUpRight, Play} from 'lucide-react';
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
 const result=await (async()=>{try{const sql=getDb();return await sql`SELECT video_id,title,published_at,detected_at,channel_verified,start_time_known FROM youtube_live_videos ORDER BY published_at DESC LIMIT 500`;}catch{return null;}})();
 if(!result)return <p role="alert" className="py-12 text-center text-slate-500">{vi?'Không thể tải danh sách lúc này. Vui lòng thử lại sau.':'Unable to load the list. Please try again later.'}</p>;
 const rows=result;
  if(!rows.length)return <p className="py-12 text-center text-slate-500">{vi?'Chưa lưu được livestream nào.':'No livestreams have been saved yet.'}</p>;
 const date=(x:unknown,timeKnown:boolean)=>new Intl.DateTimeFormat(vi?'vi-VN':'en-GB',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric',...(timeKnown?{hour:'2-digit',minute:'2-digit'}:{})}).format(new Date(String(x)));
 return <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">{rows.map(row=>{
  const videoId=String(row.video_id);
  return <a key={videoId} href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer" className="group block min-w-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500">
   <span className="relative block aspect-video overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800">
    <Image src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`} alt="" fill unoptimized sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
    <span aria-hidden="true" className="absolute inset-0 grid place-items-center bg-black/0 transition-colors group-hover:bg-black/20"><span className="grid h-10 w-10 place-items-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><Play size={17} fill="currentColor" className="ml-0.5" /></span></span>
   </span>
   <span className="block pt-3">
    <strong className="line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">{String(row.title)}</strong>
    <span className="mt-1.5 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">{date(row.published_at,row.start_time_known===true)}<ArrowUpRight aria-hidden="true" size={14} className="ml-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" /></span>
    {row.channel_verified===false&&<span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{vi?'Kênh chưa được xác minh':'Channel not verified'}</span>}
    <span className="sr-only">{vi?'Mở video trên YouTube trong tab mới':'Open video on YouTube in a new tab'}</span>
   </span>
  </a>;
 })}</div>;
}
export default async function LivestreamsPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isLocale(locale))notFound();const vi=locale==='vi';
 return <main className="min-h-screen bg-white text-slate-900 dark:bg-[#081421] dark:text-slate-100"><div className="port-site"><header className="home-header"><SiteBrand locale={locale}/><nav className="flex items-center gap-2 sm:gap-4" aria-label={vi?'Điều hướng trang':'Page navigation'}><Link href={`/${locale}`} className="hidden text-xs text-slate-500 sm:block">{vi?'Về trang chủ':'Back to home'}</Link><ThemeToggle locale={locale}/><div className="home-language" aria-label={vi?'Chọn ngôn ngữ':'Language'}>{(['vi','en'] as const).map(l=><Link key={l} href={`/${l}/livestreams`} aria-current={l===locale?'page':undefined}>{l.toUpperCase()}</Link>)}</div></nav></header><section className="py-10 sm:py-14"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7"><div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 sm:h-36 sm:w-36"><Image src="https://yt3.googleusercontent.com/nTM9mMMid5EEdc6wrrXaSkF4_AXxKfErzLE-Hey1NUGKbfWIM0VgVTMhbIqXEtzu2DxJfMFM_w=s900-c-k-c0x00ffffff-no-rj" alt={vi?'Ảnh đại diện kênh Đầu tư chứng khoán dài hạn':'Đầu tư chứng khoán dài hạn channel avatar'} fill unoptimized sizes="144px" className="object-cover" /></div><div className="min-w-0"><h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">Đầu tư chứng khoán dài hạn</h1><p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">@NguyenHuy2594</p><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{vi?'Theo dõi lại các buổi livestream đã được ghi nhận từ kênh YouTube.':'Browse saved livestreams from the YouTube channel.'}</p><a href="https://www.youtube.com/@NguyenHuy2594" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">{vi?'Xem kênh YouTube':'View YouTube channel'}<ArrowUpRight size={15}/><span className="sr-only">{vi?'(mở trong tab mới)':'(opens in a new tab)'}</span></a></div></div><div className="mt-10 border-b border-slate-200 dark:border-slate-700"><h2 className="inline-block border-b-2 border-slate-900 pb-3 text-sm font-semibold text-slate-900 dark:border-slate-100 dark:text-slate-100">{vi?'Livestream đã lưu':'Saved livestreams'}</h2></div><div className="mt-8"><Suspense fallback={<p className="py-12 text-slate-500">{vi?'Đang tải...':'Loading...'}</p>}><LiveList locale={locale}/></Suspense></div></section></div></main>;
}
