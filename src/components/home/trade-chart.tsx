'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import {ChartLoading} from '@/components/loading/route-loading';
import {ArrowUpRight,Maximize2,Minimize2,Minus,Plus,RotateCcw} from 'lucide-react';
import type {Locale} from '@/lib/i18n';
import type {TradeData,TradeMode} from '@/lib/trade/types';
import {TRADE_SERIES,tradeTimeline,tradePeriodLabel,yearRange,zoomRange,type RangeChoice,type TimeRange} from '@/lib/trade/range';
import './trade-chart.css';
const TradePlot=dynamic(()=>import('./trade-plot'),{ssr:false,loading:()=> <ChartLoading className="trade-plot-loading"/>});
const EMPTY:TradeData={months:[],updatedAt:null};

export function TradeChart({locale,currentDay,dataset=EMPTY,loadError=false}:{locale:Locale;currentDay:string;dataset?:TradeData;loadError?:boolean}){
 const vi=locale==='vi',card=useRef<HTMLDivElement>(null),dialog=useRef<HTMLDialogElement>(null),expandButton=useRef<HTMLButtonElement>(null),wasExpanded=useRef(false);
 const [mode,setMode]=useState<TradeMode>('month'),[choice,setChoice]=useState<RangeChoice|'custom'>(1),[customRange,setCustomRange]=useState<TimeRange|null>(null);
 const [visible,setVisible]=useState([true,true,true]),[activeIndex,setActiveIndex]=useState<number|null>(null),[expanded,setExpanded]=useState(false);
 const periods=useMemo(()=>tradeTimeline(dataset.months,mode,currentDay),[dataset.months,mode,currentDay]);
 const preset=useMemo(()=>yearRange(periods,choice==='custom'?1:choice),[periods,choice]);
 const range=customRange??preset;
 const years=[...new Set(dataset.months.filter(p=>p.period<=currentDay.slice(0,7)&&(p.exportsUsd!==null||p.importsUsd!==null)).map(p=>p.period.slice(0,4)))].sort().reverse();
 const populated=periods.some(p=>p.exportsUsd!==null||p.importsUsd!==null);
 const window=periods.slice(range[0],range[1]+1);
 const active=activeIndex!==null&&activeIndex>=range[0]&&activeIndex<=range[1]?periods[activeIndex]:window.findLast(p=>p.exportsUsd!==null||p.importsUsd!==null);
 const label=(period:string)=>tradePeriodLabel(period,vi),number=new Intl.NumberFormat(vi?'vi-VN':'en-US',{maximumFractionDigits:2});
 const amount=(value:number|null)=>value===null?'—':number.format(value/1e9);
 const coverage=active?(active.coverage===active.expected?(vi?'Đủ dữ liệu kỳ':'Full period'):active.coverage?(vi?`${active.coverage}/${active.expected} tháng có dữ liệu`:`${active.coverage}/${active.expected} months available`):(vi?'Chưa có đủ dữ liệu':'No complete data')):'';
 const onRange=useCallback((next:TimeRange)=>{
  setCustomRange(previous=>previous?.[0]===next[0]&&previous[1]===next[1]?previous:next);
 },[]);
 const pickRange=(value:RangeChoice)=>{setChoice(value);setCustomRange(null);setActiveIndex(null);};
 const zoom=(factor:number)=>{setChoice('custom');onRange(zoomRange(range,factor,periods.length));setActiveIndex(null);};
 const reset=()=>{setMode('month');pickRange(1);};
 useEffect(()=>{
  if(expanded){dialog.current?.showModal();wasExpanded.current=true;}
  else if(wasExpanded.current){expandButton.current?.focus();wasExpanded.current=false;}
 },[expanded]);
 const rangeCaption=window.length?window.length===1?label(window[0].period):`${label(window[0].period)} – ${label(window.at(-1)!.period)}`:'—';
 const custom=customRange!==null&&(customRange[0]!==preset[0]||customRange[1]!==preset[1]);
 const chartCard=  <div className="trade-line-card" ref={card}>
   <div className="trade-line-toolbar">
    <div className="trade-line-modes" aria-label={vi?'Kỳ dữ liệu':'Data period'}>{(['month','quarter','year'] as const).map(m=><button type="button" key={m} aria-pressed={mode===m} onClick={()=>{setMode(m);setCustomRange(null);setActiveIndex(null);setChoice(m==='year'?5:m==='quarter'?2:1);}}>{m==='month'?(vi?'Tháng':'Monthly'):m==='quarter'?(vi?'Quý':'Quarterly'):(vi?'Năm':'Yearly')}</button>)}</div>
    <div className="trade-range-selectors"><label><span>{vi?'Khoảng xem':'Range'}</span><select aria-label={vi?'Khoảng thời gian':'Time range'} disabled={!populated} value={choice==='custom'||custom?'custom':typeof choice==='number'||choice==='all'?String(choice):'calendar'} onChange={e=>pickRange(e.target.value==='all'?'all':Number(e.target.value) as 1|2|3|5|10)}>{(choice==='custom'||custom)&&<option value="custom">{vi?'Tùy chỉnh':'Custom'}</option>}{typeof choice==='string'&&choice!=='all'&&choice!=='custom'&&!custom&&<option value="calendar">{vi?'Theo năm':'Calendar year'}</option>}{([1,2,3,5,10] as const).map(n=><option key={n} value={n}>{n} {vi?'năm':n===1?'year':'years'}</option>)}<option value="all">{vi?'Tất cả':'All history'}</option></select></label>
     <label><span>{vi?'Chọn năm':'Year'}</span><select aria-label={vi?'Chọn năm':'Select year'} disabled={!years.length} value={typeof choice==='string'&&!['all','custom'].includes(choice)&&!custom?choice:''} onChange={e=>{pickRange(e.target.value?e.target.value as `${number}`:'all');}}><option value="">{vi?'Tất cả năm':'All years'}</option>{years.map(y=><option key={y} value={y}>{y}</option>)}</select></label></div>
    <div className="trade-chart-tools"><button type="button" disabled={!populated||range[0]===range[1]} aria-label={vi?'Phóng to khoảng thời gian':'Zoom in time range'} title={vi?'Phóng to khoảng thời gian':'Zoom in time range'} onClick={()=>zoom(.7)}><Plus size={16}/></button><button type="button" disabled={!populated||(range[0]===0&&range[1]===periods.length-1)} aria-label={vi?'Thu nhỏ khoảng thời gian':'Zoom out time range'} title={vi?'Thu nhỏ khoảng thời gian':'Zoom out time range'} onClick={()=>zoom(1.4)}><Minus size={16}/></button><button type="button" onClick={reset} title={vi?'Đặt lại biểu đồ':'Reset chart'} aria-label={vi?'Đặt lại biểu đồ':'Reset chart'}><RotateCcw size={15}/></button><button type="button" ref={expandButton} onClick={()=>setExpanded(value=>!value)} aria-pressed={expanded} title={vi?'Phóng lớn biểu đồ · Esc để thoát':'Expand chart · Esc to exit'} aria-label={expanded?(vi?'Thu gọn biểu đồ':'Collapse chart'):(vi?'Phóng lớn biểu đồ':'Expand chart')}>{expanded?<Minimize2 size={15}/>:<Maximize2 size={15}/>}</button></div>
   </div>
   <div className="trade-line-meta"><span aria-live="polite">{rangeCaption}</span><span>{vi?'Tỷ USD':'USD billion'}</span></div>
   <ul className="trade-line-legend" aria-label={vi?'Chú thích biểu đồ':'Chart legend'}>{TRADE_SERIES.map((s,i)=><li key={s.key}><button type="button" aria-pressed={visible[i]} onClick={()=>setVisible(previous=>previous[i]&&previous.filter(Boolean).length===1?previous:previous.map((v,k)=>k===i?!v:v))}><i style={{background:`var(${s.variable})`}}/>{vi?s.vi:s.en}{s.key==='balanceUsd'&&<span className="trade-dash-sample"/>}</button></li>)}</ul>
   {loadError?<p className="trade-api-empty" role="alert">{vi?'Chưa tải được dữ liệu từ Dữ Liệu Kinh Tế. Vui lòng thử lại sau hoặc xem tại nguồn.':'Could not load data from Dữ Liệu Kinh Tế. Please try later or open the source.'}</p>:!populated?<p className="trade-api-empty">{vi?'Chưa có dữ liệu được công bố.':'No published data.'}</p>:<>
    <TradePlot periods={periods} range={range} visible={visible} vi={vi} onRange={onRange} onActive={setActiveIndex}/>
    <p className="trade-gesture-hint">{vi?'Cuộn / chụm hai ngón để zoom · Kéo để dịch thời gian · Kéo hai đầu thanh bên dưới để chọn khoảng':'Scroll / pinch to zoom · Drag to pan · Drag the handles below to select a range'}</p>
    <div className="trade-a11y-range"><label>{vi?'Từ kỳ':'From period'}<select value={range[0]} onChange={e=>{setChoice('custom');onRange([Number(e.target.value),range[1]]);}}>{periods.map((p,i)=><option key={p.period} value={i} disabled={i>range[1]}>{label(p.period)}</option>)}</select></label><label>{vi?'Đến kỳ':'To period'}<select value={range[1]} onChange={e=>{setChoice('custom');onRange([range[0],Number(e.target.value)]);}}>{periods.map((p,i)=><option key={p.period} value={i} disabled={i<range[0]}>{label(p.period)}</option>)}</select></label></div>
    {active&&<div className="trade-point-summary" aria-live="polite"><div><strong>{label(active.period)}</strong><span>{coverage}</span></div>{TRADE_SERIES.map(s=><div key={s.key}><span>{vi?s.vi:s.en}</span><strong style={{color:`var(${s.variable})`}}>{s.key==='balanceUsd'&&active.balanceUsd!==null&&active.balanceUsd>0?'+':''}{amount(active[s.key])}</strong>{s.key==='balanceUsd'&&active.balanceUsd!==null&&<small>{active.balanceUsd>0?(vi?'Xuất siêu':'Surplus'):active.balanceUsd<0?(vi?'Nhập siêu':'Deficit'):(vi?'Cân bằng':'Balanced')}</small>}</div>)}</div>}
   </>}
   <p className="trade-line-note">{vi?'Cán cân = Xuất khẩu − Nhập khẩu. Quý và năm chỉ cộng tháng có đủ cả hai chiều; kỳ chưa đủ tháng ghi rõ độ phủ. Khoảng thiếu dữ liệu được để trống.':'Balance = Exports − Imports. Quarter and year totals include only months with both series; incomplete periods show their coverage. Missing data is left blank.'}</p>
  </div>
 ;
 return <section className="trade-section" id="vietnam-trade" aria-labelledby="trade-title">
  <div className="trade-heading"><p className="eyebrow">{vi?'THƯƠNG MẠI VIỆT NAM':'VIETNAM TRADE'}</p><h2 id="trade-title">{vi?'Xuất nhập khẩu hàng hóa':'Merchandise imports & exports'}</h2><p>{vi?'Khám phá kim ngạch xuất khẩu, nhập khẩu và cán cân thương mại Việt Nam qua từng giai đoạn.':'Explore Vietnam’s merchandise exports, imports and trade balance over time.'}</p></div>
  {expanded?<dialog ref={dialog} className="trade-expanded-dialog" aria-label={vi?'Biểu đồ xuất nhập khẩu mở rộng':'Expanded trade chart'} onCancel={()=>setExpanded(false)} onClose={()=>setExpanded(false)}>{chartCard}</dialog>:chartCard}
  <div className="trade-api-source"><span>{vi?'Nguồn: ':'Source: '}<a href="https://dulieukinhte.com/du-lieu/tong-xuat-khau-292" target="_blank" rel="noopener noreferrer">Dữ Liệu Kinh Tế <ArrowUpRight size={12}/></a> · <a href="https://dulieukinhte.com/du-lieu/tong-nhap-khau-293" target="_blank" rel="noopener noreferrer">{vi?'Số liệu nhập khẩu':'Import data'} <ArrowUpRight size={12}/></a>{vi?' · Tổng cục Hải quan':' · Vietnam Customs'}</span>{dataset.updatedAt&&<span>{vi?'Nguồn cập nhật: ':'Source updated: '}{new Intl.DateTimeFormat(vi?'vi-VN':'en-GB',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(dataset.updatedAt))}</span>}</div>
 </section>;
}
