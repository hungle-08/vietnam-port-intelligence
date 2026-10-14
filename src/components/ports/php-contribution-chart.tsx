'use client';

import {useId,useState} from 'react';
import './php-contribution-chart.css';
import type {Locale} from '@/lib/i18n';
import type {ContributionMonth} from '@/lib/php/monthly';
import {phpMessages} from '@/lib/php/messages';

const sites=[
 {id:'php-tan-vu',vi:'Tân Vũ',en:'Tan Vu',color:'#268bd2'},
 {id:'php-hoang-dieu',vi:'Hoàng Diệu',en:'Hoang Dieu',color:'#20b7a5'},
 {id:'php-chua-ve',vi:'Chùa Vẽ',en:'Chua Ve',color:'#9b87dd'},
 {id:'php-htit',vi:'HTIT',en:'HTIT',color:'#e5ae52'},
 {id:'dvp-dinh-vu',vi:'Đình Vũ',en:'Dinh Vu',color:'#de7985'},
] as const;

export function PhpContributionChart({locale,year,months}:{locale:Locale;year:number;months:ContributionMonth[]}){
 const [metric,setMetric]=useState<'dwt'|'calls'>('dwt');
 const [active,setActive]=useState<number|null>(null);
 const id=useId(),vi=locale==='vi',t=phpMessages(locale);
 const title=vi?'Đóng góp của từng cảng thuộc PHP':'Contributions by PHP port';
 const number=(value:number|null)=>value===null?'—':new Intl.NumberFormat(vi?'vi-VN':'en-US',{maximumFractionDigits:2}).format(value);
 const total=(month:ContributionMonth)=>month.sites.reduce((sum,site)=>sum+(site[metric]??0),0);
 const max=Math.max(1,...months.map(total));
 const step=10**Math.floor(Math.log10(max)),top=metric==='calls'?Math.max(4,Math.ceil(max/(step/10)/4)*4*(step/10)):Math.ceil(max/step)*step;
 const millions=metric==='dwt'&&top>=1000000;
 const axis=new Intl.NumberFormat(vi?'vi-VN':'en-US',{maximumFractionDigits:2});
 const compact=new Intl.NumberFormat(vi?'vi-VN':'en-US',{notation:'compact',maximumFractionDigits:1});
 const left=80,base=302,height=242,column=74,width=44;
 const current=active===null?null:months[active];
 const hasData=months.some(month=>month.daysAvailable>0);
 return <section className="php-contribution" aria-labelledby={`${id}-title`}>
  <div className="php-contribution-heading"><div><h3 id={`${id}-title`}>{title}</h3><p>{vi?'Tỷ trọng trong hệ thống PHP · Lượt vào theo kế hoạch':'Share within the PHP network · Planned arrivals'} · {year}</p></div>
   <div className="php-chart-switch" role="group" aria-label={vi?'Chỉ số biểu đồ':'Chart metric'}>{(['dwt','calls'] as const).map(value=><button key={value} type="button" aria-pressed={metric===value} onClick={()=>{setMetric(value);setActive(null);}}>{value==='dwt'?'DWT':vi?'Lượt tàu':'Arrivals'}</button>)}</div>
  </div>
  <ul className="php-chart-legend" aria-label={vi?'Chú thích cảng':'Port legend'}>{sites.map(site=><li key={site.id}><span className="php-chart-swatch" style={{background:site.color}}/><strong>{vi?site.vi:site.en}</strong></li>)}</ul>
  {hasData?<div className="php-chart-area">
   <p className="php-chart-scroll-hint">{vi?'Vuốt ngang để xem đủ 12 tháng →':'Swipe to see all 12 months →'}</p>
   <div className="php-chart-scroll"><svg viewBox="0 0 980 360" className="php-stacked-chart" role="group" aria-label={`${title} ${year} · ${metric==='dwt'?'DWT':t.calls}`}>
    <text x={left} y={24} className="php-chart-axis">{metric==='dwt'?(millions?(vi?'Triệu DWT':'Million DWT'):'DWT'):vi?'Lượt tàu':'Arrivals'}</text>
    {Array.from({length:5},(_,i)=>{const value=top*i/4,y=base-height*i/4;return <g key={i}><line x1={left} x2={968} y1={y} y2={y} className="php-chart-grid"/><text x={left-12} y={y+4} textAnchor="end" className="php-chart-axis">{metric==='calls'?number(Math.round(value)):axis.format(millions?value/1000000:value)}</text></g>;})}
    {months.map((month,index)=>{
     const x=left+index*column+(column-width)/2;let stacked=0;
     const label=`${vi?'Tháng':'Month'} ${month.month} · ${t.status[month.status]} · ${month.daysAvailable?number(total(month)):'—'} ${metric==='dwt'?'DWT':t.calls}`;
     return <g key={month.month} tabIndex={0} aria-label={label} onMouseEnter={()=>setActive(index)} onMouseLeave={()=>setActive(null)} onFocus={()=>setActive(index)} onBlur={()=>setActive(null)} className="php-chart-month">
      <title>{label}</title>
      <rect x={left+index*column+3} y={40} width={column-6} height={height+22} rx={6} className={month.status==='collecting'?'php-chart-current':'php-chart-hit'}/>
      {month.daysAvailable>0&&total(month)>0&&<text x={x+width/2} y={base-total(month)/top*height-10} textAnchor="middle" className="php-chart-bar-total">{compact.format(total(month))}</text>}
      <defs><clipPath id={`${id}-bar-${index}`}><rect x={x} y={base-total(month)/top*height} width={width} height={total(month)/top*height} rx={5}/></clipPath></defs>
      <g clipPath={`url(#${id}-bar-${index})`}>{sites.map(site=>{const value=month.sites.find(row=>row.id===site.id)?.[metric]??0,h=value/top*height;stacked+=h;return value>0?<rect key={site.id} x={x} y={base-stacked} width={width} height={h} fill={site.color}><title>{vi?site.vi:site.en}: {number(value)} {metric==='dwt'?'DWT':t.calls}</title></rect>:null;})}</g>
      {(!month.daysAvailable||total(month)===0)&&<text x={x+width/2} y={base-10} textAnchor="middle" className="php-chart-axis">{month.daysAvailable?'0':'—'}</text>}
      <text x={x+width/2} y={334} textAnchor="middle" className={`php-chart-month-label${month.status==='collecting'?' is-current':''}${month.status==='future'?' is-future':''}`}>{vi?'Tháng ':'M'}{String(month.month).padStart(2,'0')}{month.status==='collecting'?'*':''}</text>
     </g>;
    })}
   </svg></div>
   {current&&<div className="php-chart-tooltip" role="status"><strong>{vi?'Tháng':'Month'} {current.month} / {year}<small>{t.status[current.status]} · {current.daysAvailable}/{current.daysExpected} {vi?'ngày có dữ liệu':'days covered'}</small></strong>{sites.map(site=>{const row=current.sites.find(item=>item.id===site.id),value=row?.[metric]??null;return <div key={site.id}><span><i style={{background:site.color}}/>{vi?site.vi:site.en}</span><b>{number(value)}{metric==='dwt'&&row&&row.missingDwt>0?'*':''}</b></div>;})}<div className="php-chart-tooltip-total"><span>{t.total}</span><b>{current.daysAvailable?number(total(current)):'—'} {metric==='dwt'?'DWT':''}</b></div></div>}
  </div>:<div className="php-chart-empty" role="status">{t.empty} {year}</div>}
  <p className="php-report-note">{vi?'Không điều chỉnh theo tỷ lệ sở hữu. Tháng hiện tại (*) đang tổng hợp; tháng thiếu dữ liệu chỉ hiển thị số liệu đã ghi nhận.':'No ownership weighting. The current month (*) is in progress; incomplete months show recorded data only.'}{metric==='dwt'&&months.some(month=>month.missingDwt>0)&&<> {vi?'Một số lượt thiếu DWT; cột chỉ cộng giá trị đã biết.':'Some arrivals have missing DWT; bars include known values only.'}</>}</p>
 </section>;
}
