'use client';
import {useState} from 'react';
import dynamic from 'next/dynamic';
import {RotateCcw,Info,ArrowUpRight} from 'lucide-react';
import {ChartLoading} from '@/components/loading/route-loading';
import type {Locale} from '@/lib/i18n';
import {terminalWindow,type TerminalMonth} from '@/lib/php/terminal-history';
import {PHP_SOURCE} from '@/lib/php/config';
const Plot=dynamic(()=>import('./terminal-dwt-plot'),{ssr:false,loading:()=> <ChartLoading className="terminal-dwt-loading"/>});
export function TerminalDwtChart({locale,name,color,months,loadError=false}:{locale:Locale;name:string;color:string;months:TerminalMonth[];loadError?:boolean}){
 const vi=locale==='vi',n=new Intl.NumberFormat(vi?'vi-VN':'en-US',{maximumFractionDigits:2});
 const [window,setWindow]=useState(()=>terminalWindow(months.length)),[activeIndex,setActiveIndex]=useState<number|null>(null),[reset,setReset]=useState(0);
 const active=months[activeIndex!==null&&activeIndex>=window.start&&activeIndex<=window.end?activeIndex:window.end],label=(p:string)=>p.slice(5)+'/'+p.slice(0,4);
 const current=months.find(m=>m.status==='current'),known=months.some(m=>m.daysAvailable>0);
 const status=(m:TerminalMonth)=>m.status==='current'?(vi?'Đang tổng hợp':'Provisional'):m.status==='missing'?(vi?'Chưa có dữ liệu':'No data'):m.status==='partial'?(vi?'Dữ liệu chưa đầy đủ':'Incomplete data'):(vi?'Đủ dữ liệu tháng':'Full month');
 return <section className="terminal-dwt" aria-label={vi?`DWT tàu vào ${name}`:`Inbound DWT at ${name}`} style={{'--terminal-color':color} as React.CSSProperties}>
  <div className="terminal-dwt-heading"><div><p className="eyebrow">{vi?'HOẠT ĐỘNG THEO THÁNG':'MONTHLY ACTIVITY'}</p><h2>{vi?'DWT tàu vào theo kế hoạch':'Planned inbound vessel DWT'}</h2><p>{name} · {vi?'12 tháng gần nhất · Cuộn để xem lịch sử':'Latest 12 months · Scroll through history'}</p></div><span>{months.length?`${label(months[window.start].period)} – ${label(months[window.end].period)}`:'—'}</span></div>
  <div className="terminal-dwt-card">
   <div className="terminal-dwt-toolbar"><span><i/>{name}</span><button type="button" onClick={()=>{setReset(v=>v+1);setActiveIndex(null);}} aria-label={vi?'Đặt lại 12 tháng gần nhất':'Reset to latest 12 months'}><RotateCcw size={14}/>{vi?'12 tháng':'12 months'}</button></div>
   {current&&!loadError&&<p className="terminal-dwt-notice"><Info size={14}/>{vi?`Tháng ${label(current.period)} đang tổng hợp · ${current.daysAvailable}/${current.daysExpected} ngày có dữ liệu. Cột vạch chéo là số liệu tạm tính, không ngoại suy cả tháng.`:`${label(current.period)} is provisional · ${current.daysAvailable}/${current.daysExpected} calendar days available. Hatched columns show partial data without extrapolation.`}</p>}
   {loadError?<p className="terminal-dwt-empty" role="alert">{vi?'Chưa tải được dữ liệu DWT. Vui lòng tải lại trang.':'DWT data could not be loaded. Please reload the page.'}</p>:!known?<p className="terminal-dwt-empty">{vi?'Chưa có dữ liệu kế hoạch tàu cho cảng này.':'No vessel-plan data is available for this terminal.'}</p>:<><Plot months={months} color={color} vi={vi} onWindow={setWindow} onActive={setActiveIndex} resetKey={reset}/><p className="terminal-dwt-gesture">{vi?'Cuộn chuột / trackpad hoặc kéo thanh bên dưới để xem tháng cũ.':'Scroll with a mouse / trackpad or drag the navigator to view older months.'}</p></>}
   {active&&!loadError&&<div className="terminal-dwt-summary"><label>{vi?'Tháng xem số liệu':'Selected month'}<select aria-label={vi?`Tháng DWT ${name}`:`DWT month for ${name}`} value={active.period} onChange={e=>setActiveIndex(months.findIndex(m=>m.period===e.target.value))}>{months.slice(window.start,window.end+1).map(m=><option key={m.period} value={m.period}>{label(m.period)}</option>)}</select><small>{status(active)} · {active.daysAvailable}/{active.daysExpected} {vi?'ngày':'days'}</small></label><div><span>{vi?'DWT đã ghi nhận':'Recorded DWT'}</span><strong>{active.dwt===null?'—':n.format(active.dwt)}</strong></div><div><span>{vi?'Lượt tàu vào':'Planned arrivals'}</span><strong>{active.calls===null?'—':n.format(active.calls)}</strong></div></div>}
   {active?.missingDwt? <p className="terminal-dwt-warning" role="note">{vi?`${active.missingDwt} lượt thiếu DWT; tổng chỉ bao gồm DWT đã biết.`:`${active.missingDwt} arrivals lack DWT; the total includes known DWT only.`}</p>:null}
  </div>
  <div className="terminal-dwt-footer"><p>{vi?'Chỉ cộng lượt vào theo kế hoạch của cảng này, không nhân tỷ lệ sở hữu. DWT là sức chở thiết kế của tàu, không phải lượng hàng thực tế. Tháng thiếu dữ liệu để trống; số 0 chỉ xuất hiện khi có dữ liệu ngày và không có lượt vào.':'Only this terminal’s planned arrivals are counted, without ownership weighting. DWT is vessel capacity, not cargo throughput. Missing months stay blank; zero is used only for covered months with no arrivals.'}</p><a href={PHP_SOURCE} target="_blank" rel="noreferrer">{vi?'Nguồn: Cảng vụ Hải Phòng':'Source: Hai Phong Maritime Administration'}<ArrowUpRight size={12}/></a></div>
 </section>;
}
