'use client';
import {useEffect,useRef} from 'react';
import * as echarts from 'echarts/core';
import {LineChart,BarChart} from 'echarts/charts';
import {GridComponent,TooltipComponent,DataZoomComponent,AriaComponent} from 'echarts/components';
import {CanvasRenderer} from 'echarts/renderers';
import type {EChartsOption} from 'echarts';
import {LACH_HUYEN_PORTS,latestRegionalRange,type RegionalMonth} from '@/lib/php/lach-huyen';
echarts.use([LineChart,BarChart,GridComponent,TooltipComponent,DataZoomComponent,AriaComponent,CanvasRenderer]);
export default function LachHuyenPlot({chartType,months,metric,visible,vi,onActive,onRange,resetKey}:{chartType:'stacked'|'line';months:RegionalMonth[];metric:'dwt'|'calls';visible:boolean[];vi:boolean;onActive:(i:number)=>void;onRange:(range:{start:number;end:number})=>void;resetKey:number}){
 const element=useRef<HTMLDivElement>(null),instance=useRef<echarts.EChartsType|null>(null),handler=useRef(onActive),range=useRef(latestRegionalRange(months.length)),rangeHandler=useRef(onRange);
 useEffect(()=>{handler.current=onActive;rangeHandler.current=onRange;},[onActive,onRange]);
 useEffect(()=>{
  const el=element.current;if(!el)return;const chart=echarts.init(el,undefined,{renderer:'canvas'});instance.current=chart;
  const n=new Intl.NumberFormat(vi?'vi-VN':'en-US',{maximumFractionDigits:2});
  const label=(period:string)=>period.slice(5)+'/'+period.slice(0,4);
  const draw=()=>{
   const css=getComputedStyle(el),c=(name:string)=>css.getPropertyValue(name).trim(),compact=el.clientWidth<600;
   const option:EChartsOption={backgroundColor:'transparent',animationDuration:250,
    aria:{enabled:true,label:{description:vi?'Tỷ trọng ba cảng container Lạch Huyện theo tháng. Tháng không có dữ liệu được để trống.':'Shares of three Lach Huyen container terminals by month. Missing months are left blank.'}},
    grid:{left:compact?43:58,right:20,top:22,bottom:95},
    xAxis:{type:'category',boundaryGap:chartType==='stacked',data:months.map(m=>label(m.period)+(m.status==='current'?' *':'')),axisTick:{show:false},axisLine:{lineStyle:{color:c('--border')}},axisLabel:{color:c('--muted-foreground'),fontSize:10,hideOverlap:true,interval:'auto'}},
    yAxis:{type:'value',min:0,max:100,interval:25,axisLabel:{formatter:'{value}%',color:c('--muted-foreground'),fontSize:11},splitLine:{lineStyle:{color:c('--border'),type:'dashed',opacity:.7}}},
    tooltip:{trigger:'axis',axisPointer:{type:chartType==='stacked'?'shadow':'line'},confine:true,renderMode:'richText',backgroundColor:c('--card'),borderColor:c('--border'),textStyle:{color:c('--foreground'),fontSize:12},formatter:(input:unknown)=>{
     const p=(Array.isArray(input)?input[0]:input) as {dataIndex?:number};const m=months[p?.dataIndex??0];if(!m)return '';
     return [label(m.period),...(m.status==='current'?[vi?'Đang tổng hợp · tỷ trọng tạm tính':'Provisional · month to date']:m.status==='partial'?[vi?'Chưa đủ dữ liệu tháng':'Incomplete month']:[]),`${m.daysAvailable}/${m.daysExpected} ${vi?'ngày có dữ liệu':'days available'}`,...LACH_HUYEN_PORTS.map((p,i)=>{
      const d=m.ports[i],share=metric==='dwt'?d.dwtShare:d.callShare;
      return `${p.name} (${vi?'bến':'berths'} ${p.berths}): ${share===null?'—':n.format(share)+'%'}\n${d.dwt===null?'—':n.format(d.dwt)} DWT · ${d.calls===null?'—':n.format(d.calls)} ${vi?'lượt vào':'arrivals'}`;
     })].join('\n');
    }},
    // Equal spans preserve 12 months while keeping wheel events enabled (inside zoomLock disables them).
    dataZoom:[{type:'inside',xAxisIndex:0,startValue:range.current.start,endValue:range.current.end,zoomOnMouseWheel:false,moveOnMouseWheel:true,moveOnMouseMove:true,filterMode:'filter',minValueSpan:Math.min(11,Math.max(0,months.length-1)),maxValueSpan:Math.min(11,Math.max(0,months.length-1))},
     {type:'slider',xAxisIndex:0,zoomLock:true,startValue:range.current.start,endValue:range.current.end,height:26,bottom:15,left:compact?43:58,right:20,showDetail:false,brushSelect:false,borderColor:c('--border'),backgroundColor:c('--secondary'),fillerColor:c('--lh-range-fill'),handleStyle:{color:c('--lh-hict'),borderColor:c('--lh-hict')}}],
    series:LACH_HUYEN_PORTS.map((p,i)=>{
     const common={id:p.id,name:p.name,itemStyle:{color:c('--lh-'+p.id)},data:months.map(m=>{
      const value=!visible[i]?null:metric==='dwt'?m.ports[i].dwtShare:m.ports[i].callShare;
      if(value===null||m.status==='complete')return value;
      return chartType==='stacked'
       ? {value,itemStyle:{opacity:.65,decal:{symbol:'rect',dashArrayX:[1,0],dashArrayY:[2,4],rotation:-Math.PI/4,color:'rgba(8,20,33,0.35)'}}}
       : {value,symbol:'diamond',symbolSize:10,itemStyle:{color:c('--card'),borderColor:c('--lh-'+p.id),borderWidth:2}};
     }),emphasis:{focus:'series' as const}};
     return chartType==='stacked'
      ? {...common,type:'bar' as const,stack:'share',barMaxWidth:58,barCategoryGap:'32%',label:{show:!compact,position:'inside' as const,color:document.documentElement.classList.contains('dark')?'#081421':'#fff',fontSize:11,fontWeight:600,formatter:(params:{value:unknown})=>typeof params.value==='number'&&params.value>=8?n.format(params.value)+'%':''}}
      : {...common,type:'line' as const,connectNulls:false,smooth:false,showSymbol:true,symbolSize:5,lineStyle:{width:p.id==='htit'?3:2.5,color:c('--lh-'+p.id)}};
    }),
   };chart.setOption(option,{notMerge:true});
  };draw();
  chart.on('updateAxisPointer',(event:unknown)=>{const i=(event as {axesInfo?:{value?:number}[]}).axesInfo?.[0]?.value;if(typeof i==='number')handler.current(i);});
  chart.on('datazoom',()=>{const z=(chart.getOption().dataZoom as {startValue:number;endValue:number}[])[0];if(z){range.current={start:Math.round(z.startValue),end:Math.round(z.endValue)};rangeHandler.current(range.current);}});
  const observer=new ResizeObserver(()=>{chart.resize();draw();});observer.observe(el);const theme=new MutationObserver(draw);theme.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  return()=>{observer.disconnect();theme.disconnect();chart.dispose();instance.current=null;};
 },[chartType,months,metric,visible,vi]);
 useEffect(()=>{range.current=latestRegionalRange(months.length);rangeHandler.current(range.current);instance.current?.dispatchAction({type:'dataZoom',startValue:range.current.start,endValue:range.current.end});},[resetKey,months]);
 return <div className="lh-plot" ref={element} role="img" aria-label={vi?'Biểu đồ tỷ trọng HICT, HTIT và HHIT theo tháng':'Monthly HICT, HTIT and HHIT share chart'}/>;
}
