'use client';

import {useEffect,useState} from 'react';
import Image from 'next/image';
import {Spinner} from '@/components/ui/spinner';
import {Skeleton} from '@/components/ui/skeleton';
import {NewsSkeleton} from '@/components/loading/skeletons';
import {ArrowUpRight,CalendarDays,Newspaper,RefreshCw,TriangleAlert} from 'lucide-react';
import type {Locale} from '@/lib/i18n';
import {vietnamDay} from '@/lib/php/config';
import {NEWS_SOURCES,type NewsResponse} from '@/lib/php/news/types';
import './php-news.css';

function NewsImage({url,label}:{url?:string|null;label?:string}){
 const [loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false);
 return url&&!failed?<>{!loaded&&<Skeleton className="news-image-placeholder"/>}<Image src={url} alt="" width={600} height={338} unoptimized loading="lazy" style={{opacity:loaded?1:0}} onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)}/></>:<div className="php-news-image-empty"><Newspaper size={32}/><span>{label}</span></div>;
}

type Result={month:string;data:NewsResponse|null;error:boolean};
export function PhpNews({locale,month,onMonthChange:setMonth}:{locale:Locale;month:string;onMonthChange:(value:string)=>void}){
 const vi=locale==='vi',today=vietnamDay(),[topic,setTopic]=useState('all'),[source,setSource]=useState('all'),[refresh,setRefresh]=useState(0),[result,setResult]=useState<Result|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  fetch(`/api/ports/PHP/news?month=${encodeURIComponent(month)}`,{cache:'no-store',signal:controller.signal})
   .then(async response=>{if(!response.ok)throw Error('News unavailable');return await response.json() as NewsResponse;})
   .then(data=>{if(!controller.signal.aborted)setResult({month,data,error:false});})
   .catch(()=>{if(!controller.signal.aborted)setResult({month,data:null,error:true});});
  return()=>controller.abort();
 },[month,refresh]);
 const currentYear=Number(today.slice(0,4));
 const monthOptions=Array.from({length:12},(_,i)=>({value:String(i+1).padStart(2,'0'),label:new Intl.DateTimeFormat(vi?'vi-VN':'en-GB',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2026,i,1)))}));
 const loading=!result||result.month!==month,data=result?.month===month?result.data:null;
 const articles=data?.articles.filter(article=>(topic==='all'||article.topic===topic)&&(source==='all'||article.source===source))??[];
 const failures=data?.sources.filter(item=>item.status!=='ok')??[];
 const formatDay=(day:string)=>new Intl.DateTimeFormat(vi?'vi-VN':'en-GB',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(day+'T00:00:00Z'));
 const formatMonth=new Intl.DateTimeFormat(vi?'vi-VN':'en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'-01T00:00:00Z'));
 const reload=()=>{setResult(null);setRefresh(value=>value+1);};
 return <section className="php-news" aria-labelledby="php-news-title">
  <div className="php-news-heading"><div><p className="eyebrow">{vi?'TIN TỨC & CẬP NHẬT':'NEWS & UPDATES'}</p><h2 id="php-news-title">{vi?'Cảng Hải Phòng và ngành cảng biển':'Port of Hai Phong & the port industry'}</h2><p>{vi?'Tổng hợp từ các nguồn công khai, đọc bài đầy đủ tại website gốc.':'Collected from public sources. Read full articles on the original website.'}</p></div><button type="button" className="php-news-refresh" onClick={reload} disabled={loading} aria-busy={loading}>{loading?<Spinner aria-hidden="true" role={undefined} aria-label={undefined}/>:<RefreshCw size={15}/>} {loading?(vi?'Đang tải…':'Loading…'):(vi?'Tải lại':'Refresh')}</button></div>
  <div className="php-news-toolbar">
   <div className="php-news-month"><span><CalendarDays size={14}/>{vi?'Tháng xem tin':'News month'}</span><div className="php-news-month-controls"><select aria-label={vi?'Chọn tháng tin tức':'Select news month'} value={month.slice(5,7)} onChange={event=>setMonth(month.slice(0,5)+event.target.value)}>{monthOptions.map(option=><option key={option.value} value={option.value} disabled={month.slice(0,4)===today.slice(0,4)&&option.value>today.slice(5,7)}>{option.label}</option>)}</select><select aria-label={vi?'Chọn năm tin tức':'Select news year'} value={month.slice(0,4)} onChange={event=>setMonth(event.target.value+'-'+(event.target.value===today.slice(0,4)&&month.slice(5,7)>today.slice(5,7)?today.slice(5,7):month.slice(5,7)))}>{Array.from({length:currentYear-1999},(_,i)=>currentYear-i).map(year=><option key={year} value={year}>{year}</option>)}</select></div></div>
   <div className="php-news-topics" role="group" aria-label={vi?'Chủ đề tin tức':'News topic'}>{(['all','php','industry'] as const).map(value=><button key={value} type="button" aria-pressed={topic===value} onClick={()=>setTopic(value)}>{value==='all'?(vi?'Tất cả':'All'):value==='php'?(vi?'Liên quan PHP':'Related to PHP'):(vi?'Ngành cảng biển':'Port industry')}</button>)}</div>
   <label className="php-news-source"><span>{vi?'Nguồn tin':'Source'}</span><select aria-label={vi?'Lọc nguồn tin':'Filter news source'} value={source} onChange={event=>setSource(event.target.value)}><option value="all">{vi?'Tất cả nguồn':'All sources'}</option>{NEWS_SOURCES.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
  </div>
  {data&&<div className="php-news-meta"><span><strong>{articles.length}</strong> {vi?'tin trong':'articles in'} {formatMonth}</span><span>{vi?'Lần tải mới nhất':'Last fetched'}: {new Intl.DateTimeFormat(vi?'vi-VN':'en-GB',{dateStyle:'short',timeStyle:'medium',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(data.fetchedAt))}</span></div>}
  {failures.length>0&&<div className="php-news-warning" role="status"><TriangleAlert size={16}/><p>{vi?'Một số nguồn chưa đọc đầy đủ: ':'Some sources could not be fully read: '}{failures.map(item=>NEWS_SOURCES.find(s=>s.id===item.id)?.name).join(', ')}. {vi?'Danh sách đang hiển thị các tin lấy được. Bạn có thể tải lại.':'Available articles are shown. You can retry with Refresh.'}</p></div>}
  {loading?<NewsSkeleton locale={locale}/>:result?.error?<div className="php-news-empty" role="alert"><TriangleAlert size={30}/><h3>{vi?'Chưa thể tải tin tức':'Unable to load news'}</h3><p>{vi?'Các nguồn tin hiện chưa phản hồi. Vui lòng thử lại sau.':'The sources are currently unavailable. Please try again later.'}</p><button className="php-news-refresh" onClick={reload}>{vi?'Thử lại':'Try again'}</button></div>:articles.length?<div className="php-news-grid">{articles.map(article=><a className="php-news-card" href={article.url} target="_blank" rel="noopener noreferrer" key={article.url}>
   <div className="php-news-image"><NewsImage url={article.imageUrl} label={NEWS_SOURCES.find(s=>s.id===article.source)?.name}/><span className="php-news-topic-label">{article.topic==='php'?'PHP':vi?'Cảng biển':'Port industry'}</span></div>
   <div className="php-news-card-body"><div className="php-news-card-meta"><span>{NEWS_SOURCES.find(item=>item.id===article.source)?.name}</span><time dateTime={article.publishedDay}>{formatDay(article.publishedDay)}</time></div><h3>{article.title}</h3><span className="php-news-read">{vi?'Đọc tại nguồn':'Read at source'}<ArrowUpRight size={15}/></span></div>
  </a>)}</div>:<div className="php-news-empty" role="status"><Newspaper size={30}/><h3>{vi?'Chưa tìm thấy tin phù hợp':'No matching articles found'}</h3><p>{vi?'Thử chọn tháng, chủ đề hoặc nguồn tin khác.':'Try another month, topic or source.'}</p></div>}
  <div className="php-news-provenance"><p>{vi?'Nguồn:':'Sources:'} {NEWS_SOURCES.map(item=><a href={item.url} target="_blank" rel="noopener noreferrer" key={item.id}>{item.name}<ArrowUpRight size={11}/></a>)}</p><p>{vi?'Tin được lấy mới khi mở tab hoặc đổi tháng, không lưu vào cơ sở dữ liệu. Phạm vi: tin PHP trên CafeF, tin doanh nghiệp Cảng Hải Phòng và tin cảng biển trong chuyên mục hàng hải Vietnam.vn.':'News is fetched when opening this tab or changing the month, without database storage. Coverage: PHP news on CafeF, Port of Hai Phong company news and relevant port articles in Vietnam.vn’s maritime category.'}</p></div>
 </section>;
}
