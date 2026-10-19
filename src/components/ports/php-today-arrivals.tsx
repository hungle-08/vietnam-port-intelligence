import {Anchor,ArrowUpRight,CalendarDays,Clock3,Ship} from 'lucide-react';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/components/ui/table';
import type {Locale} from '@/lib/i18n';
import {PHP_SOURCE} from '@/lib/php/config';
import {PHP_SITE_APPEARANCE} from '@/lib/php/presentation';
import type {PhpTodayArrivalsResult} from '@/lib/php/repository';

const terminalNames=new Map<string,(typeof PHP_SITE_APPEARANCE)[number]>(PHP_SITE_APPEARANCE.map(site=>[site.id,site]));

export function PhpTodayArrivals({locale,day,data,loadError=false}:{locale:Locale;day:string;data:PhpTodayArrivalsResult;loadError?:boolean}){
 const vi=locale==='vi';
 const formatDate=(value:string)=>new Intl.DateTimeFormat(vi?'vi-VN':'en-GB',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(`${value}T12:00:00+07:00`));
 const formatTime=(value:string)=>new Intl.DateTimeFormat(vi?'vi-VN':'en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(value));
 const formatDwt=(value:number|null)=>value===null?'—':new Intl.NumberFormat(vi?'vi-VN':'en-US',{maximumFractionDigits:3}).format(value);
 return <section className="php-today-arrivals" aria-labelledby="php-today-arrivals-title">
  <div className="php-today-arrivals-heading">
   <div className="php-today-arrivals-title-row"><span className="php-today-arrivals-icon"><Ship size={17}/></span><div><p className="eyebrow">{vi?'THEO DÕI TRONG NGÀY':'DAILY TRACKING'}</p><h2 id="php-today-arrivals-title">{vi?'Tàu dự kiến vào hôm nay':'Vessels scheduled to arrive today'}</h2></div></div>
   <div className="php-today-arrivals-meta"><span className="php-today-arrivals-date"><CalendarDays size={14}/>{formatDate(day)}</span>{data.available&&!loadError&&<span className="php-today-arrivals-count">{data.arrivals.length} {vi?'tàu':'vessels'}</span>}</div>
  </div>
  <p className="php-today-arrivals-intro">{vi?'Kế hoạch tàu đến 1 trong 5 cảng thuộc PHP. Đây là lịch dự kiến, không xác nhận tàu đã cập cảng.':'Vessel plans for the five PHP ports. These are scheduled calls, not confirmation that a vessel has berthed.'}</p>
  {loadError?<div className="php-today-arrivals-state" role="alert">{vi?'Không thể tải danh sách tàu hôm nay. Vui lòng thử tải lại trang.':'Could not load today’s vessel list. Please reload the page.'}</div>:!data.available?<div className="php-today-arrivals-state" role="status">{vi?'Chưa có dữ liệu kế hoạch tàu cho hôm nay.':'Today’s vessel plan has not been saved yet.'}</div>:data.arrivals.length===0?<div className="php-today-arrivals-state" role="status">{vi?'Chưa có tàu dự kiến vào 5 cảng PHP trong ngày hôm nay.':'No vessels are scheduled to arrive at the five PHP ports today.'}</div>:<div className="php-today-arrivals-table"><Table aria-label={vi?'Danh sách tàu dự kiến vào các cảng PHP hôm nay':'Vessels scheduled to arrive at PHP ports today'}>
   <TableHeader><TableRow><TableHead>{vi?'Giờ dự kiến':'Planned time'}</TableHead><TableHead>{vi?'Tên tàu':'Vessel'}</TableHead><TableHead>{vi?'Cảng đi':'From'}</TableHead><TableHead>{vi?'Cảng đến':'Destination'}</TableHead><TableHead className="text-right">DWT</TableHead></TableRow></TableHeader>
   <TableBody>{data.arrivals.map(arrival=>{const site=terminalNames.get(arrival.toTerminal);return <TableRow key={arrival.eventKey}><TableCell className="php-today-arrival-time">{arrival.plannedTime??'—'}</TableCell><TableCell className="php-today-arrival-vessel">{arrival.vesselName}</TableCell><TableCell>{arrival.fromName??'—'}</TableCell><TableCell><span className="php-today-arrival-port"><i style={{background:site?.color}}/>{site?(vi?site.vi:site.en):arrival.toTerminal}</span></TableCell><TableCell className="text-right font-mono tabular-nums">{formatDwt(arrival.dwt)}</TableCell></TableRow>})}</TableBody>
  </Table></div>}
  <div className="php-today-arrivals-footer"><a className="php-today-arrivals-source" href={PHP_SOURCE} target="_blank" rel="noreferrer">{vi?'Nguồn: Cảng vụ Hải Phòng':'Source: Hai Phong Maritime Administration'}<ArrowUpRight size={13}/></a>{data.available&&data.observedAt&&!loadError&&<span className="php-today-arrivals-updated"><Clock3 size={13}/>{vi?'Cập nhật':'Updated'} {formatTime(data.observedAt)}</span>}<span className="php-today-arrivals-scope"><Anchor size={13}/>{vi?'5 cảng PHP':'5 PHP ports'}</span></div>
 </section>;
}
