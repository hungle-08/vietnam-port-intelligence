import Link from 'next/link';
import {Suspense} from 'react';
import {notFound} from 'next/navigation';
import {connection} from 'next/server';
import {SiteBrand} from '@/components/layout/site-brand';
import {isLocale,type Locale} from '@/lib/i18n';
import {getDb} from '@/lib/db';

async function LiveList({locale}:{locale:Locale}){
 await connection();const vi=locale==='vi';
 const result=await (async()=>{try{const sql=getDb();return await sql`SELECT video_id,title,published_at,detected_at FROM youtube_live_videos ORDER BY published_at DESC LIMIT 500`;}catch{return null;}})();
 if(!result)return <p role="alert" className="py-12 text-center text-slate-500">{vi?'Không thể tải danh sách lúc này. Vui lòng thử lại sau.':'Unable to load the list. Please try again later.'}</p>;
 const rows=result;
  if(!rows.length)return <p className="py-12 text-center text-slate-500">{vi?'Chưa lưu được livestream nào.':'No livestreams have been saved yet.'}</p>;
  const date=(x:unknown)=>new Intl.DateTimeFormat(vi?'vi-VN':'en-GB',{timeZone:'Asia/Ho_Chi_Minh',dateStyle:'full',timeStyle:'short'}).format(new Date(String(x)));
  return <div className="divide-y divide-slate-200 dark:divide-slate-700">{rows.map(row=><a className="flex flex-col gap-2 py-5 transition-colors hover:text-blue-500 sm:flex-row sm:items-center sm:justify-between" key={String(row.video_id)} href={`https://www.youtube.com/watch?v=${String(row.video_id)}`} target="_blank" rel="noopener noreferrer"><span><span className="block text-sm text-slate-500">{date(row.published_at)}</span><strong className="mt-1 block text-base">{String(row.title)}</strong></span><span className="text-sm font-medium text-blue-500">{vi?'Xem trên YouTube ↗':'Watch on YouTube ↗'}</span></a>)}</div>;
}
export default async function LivestreamsPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isLocale(locale))notFound();const vi=locale==='vi';
 return <main className="min-h-screen bg-white text-slate-900 dark:bg-[#081421] dark:text-slate-100"><div className="mx-auto max-w-5xl px-6 py-8"><header className="flex items-center justify-between"><SiteBrand locale={locale}/><Link href={`/${locale}`} className="text-sm text-slate-500 hover:text-blue-500">{vi?'← Về trang chủ':'← Back to home'}</Link></header><section className="mx-auto max-w-3xl py-16"><p className="text-xs font-semibold tracking-[0.2em] text-blue-500">YOUTUBE · NGUYEN HUY</p><h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{vi?'Livestream theo ngày':'Livestream archive'}</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">{vi?'Danh sách liên kết livestream đã được ghi nhận từ kênh Nguyễn Huy. Khả năng xem lại phụ thuộc vào quyền truy cập video trên YouTube.':'Saved livestream links from Nguyễn Huy. Playback depends on the video’s availability on YouTube.'}</p><div className="mt-8 border-t border-slate-200 dark:border-slate-700"><Suspense fallback={<p className="py-12 text-slate-500">{vi?'Đang tải...':'Loading...'}</p>}><LiveList locale={locale}/></Suspense></div></section></div></main>;
}
