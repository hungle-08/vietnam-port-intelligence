'use client';
import {useEffect,useRef} from 'react';
import * as echarts from 'echarts/core';
import {BarChart} from 'echarts/charts';
import {GridComponent,TooltipComponent,DataZoomComponent,AriaComponent} from 'echarts/components';
import {CanvasRenderer} from 'echarts/renderers';
import type {EChartsOption} from 'echarts';
import {terminalWindow,type TerminalMonth} from '@/lib/php/terminal-history';
echarts.use([BarChart,GridComponent,TooltipComponent,DataZoomComponent,AriaComponent,CanvasRenderer]);
type Window={start:number;end:number};
export default function TerminalDwtPlot({months,color,vi,onWindow,onActive,resetKey}:{months:TerminalMonth[];color:string;vi:boolean;onWindow:(range:Window)=>void;onActive:(index:number)=>void;resetKey:number}){
 const element=useRef<HTMLDivElement>(null),instance=useRef<echarts.EChartsType|null>(null),range=useRef(terminalWindow(months.length)),handlers=useRef({onWindow,onActive});
 useEffect(()=>{handlers.current={onWindow,onActive};},[onWindow,onActive]);
 useEffect(()=>{
  const el=element.current;if(!el)return;const chart=echarts.init(el,undefined,{renderer:'canvas'});instance.current=chart;
  const n=new Intl.NumberFormat(vi?'vi-VN':'en-US',{maximumFractionDigits:2}),short=new Intl.NumberFormat(vi?'vi-VN':'en-US',{notation:'compact',maximumFractionDigits:1}),label=(p:string)=>p.slice(5)+'/'+p.slice(0,4);
  const draw=()=>{
   const css=getComputedStyle(el),c=(p:string)=>css.getPropertyValue(p).trim(),compact=el.clientWidth<600,paint=c('--terminal-color')||color,span=Math.min(11,Math.max(0,months.length-1));
   const option:EChartsOption={animationDuration:250,backgroundColor:'transparent',aria:{enabled:true,label:{description:vi?'DWT tàu vào theo tháng. Cột vạch chéo chưa chốt, tháng thiếu dữ liệu để trống.':'Monthly inbound DWT. Hatched columns are provisional; missing months are blank.'}},grid:{left:compact?52:68,right:20,top:28,bottom:95},
    xAxis:{type:'category',data:months.map(m=>label(m.period)+(m.status==='current'?' *':'')),axisTick:{show:false},axisLine:{lineStyle:{color:c('--border')}},axisLabel:{fontSize:12,color:c('--muted-foreground'),hideOverlap:true}},
    yAxis:{type:'value',min:0,name:'DWT',nameTextStyle:{color:c('--muted-foreground'),fontSize:12},axisLabel:{formatter:(v:number)=>short.format(v),fontSize:12,color:c('--muted-foreground')},splitLine:{lineStyle:{color:c('--border'),type:'dashed',opacity:.65}}},
    tooltip:{trigger:'axis',axisPointer:{type:'shadow'},renderMode:'richText',confine:true,backgroundColor:c('--card'),borderColor:c('--border'),textStyle:{color:c('--foreground'),fontSize:12},formatter:(input:unknown)=>{
     const p=(Array.isArray(input)?input[0]:input) as {dataIndex?:number};if(typeof p?.dataIndex!=='number')return '';const m=months[p.dataIndex];if(!m)return '';
     return [label(m.period),m.status==='current'?(vi?'Đang tổng hợp':'Provisional'):m.status==='complete'?(vi?'Đủ dữ liệu tháng':'Full month'):(vi?'Dữ liệu chưa đầy đủ':'Incomplete data'),`${m.dwt===null?'—':n.format(m.dwt)} DWT`,`${m.calls===null?'—':n.format(m.calls)} ${vi?'lượt vào':'arrivals'}`,`${m.daysAvailable}/${m.daysExpected} ${vi?'ngày có dữ liệu':'days available'}`,...(m.missingDwt?[`${m.missingDwt} ${vi?'lượt thiếu DWT':'arrivals without DWT'}`]:[])].join('\n');
    }},
    // Equal spans keep twelve months visible without disabling wheel navigation.
    dataZoom:[{type:'inside',xAxisIndex:0,startValue:range.current.start,endValue:range.current.end,filterMode:'filter',zoomOnMouseWheel:false,moveOnMouseWheel:true,moveOnMouseMove:true,minValueSpan:span,maxValueSpan:span},{type:'slider',xAxisIndex:0,startValue:range.current.start,endValue:range.current.end,zoomLock:true,height:26,bottom:14,left:compact?52:68,right:20,showDetail:false,brushSelect:false,borderColor:c('--border'),backgroundColor:c('--secondary'),fillerColor:paint+'25',handleStyle:{color:paint,borderColor:paint}}],
    series:[{type:'bar',name:'DWT',barMaxWidth:56,barCategoryGap:'32%',itemStyle:{color:paint},data:months.map(m=>m.dwt===null?null:m.status==='complete'?m.dwt:{value:m.dwt,itemStyle:{opacity:.65,decal:{symbol:'rect',dashArrayX:[1,0],dashArrayY:[2,4],rotation:-Math.PI/4,color:'rgba(8,20,33,.35)'}}})}],
   };chart.setOption(option,{notMerge:true});
  };draw();
  chart.on('datazoom',()=>{const z=(chart.getOption().dataZoom as {startValue:number;endValue:number}[])[0];if(z){range.current={start:Math.round(z.startValue),end:Math.round(z.endValue)};handlers.current.onWindow(range.current);}});
  chart.on('updateAxisPointer',(e:unknown)=>{const i=(e as {axesInfo?:{value?:number}[]}).axesInfo?.[0]?.value;if(typeof i==='number')handlers.current.onActive(i);});
  const resize=new ResizeObserver(()=>{chart.resize();draw();});resize.observe(el);const theme=new MutationObserver(draw);theme.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  return()=>{resize.disconnect();theme.disconnect();chart.dispose();instance.current=null;};
 },[months,color,vi]);
 useEffect(()=>{range.current=terminalWindow(months.length);handlers.current.onWindow(range.current);instance.current?.dispatchAction({type:'dataZoom',startValue:range.current.start,endValue:range.current.end});},[months,resetKey]);
 return <div className="terminal-dwt-plot" ref={element} role="img" aria-label={vi?'Biểu đồ DWT tàu vào theo tháng':'Monthly inbound vessel DWT chart'}/>;
}
