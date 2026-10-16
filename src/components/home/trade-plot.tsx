'use client';
import {useEffect,useRef} from 'react';
import * as echarts from 'echarts/core';
import {LineChart} from 'echarts/charts';
import {GridComponent,TooltipComponent,DataZoomComponent,AriaComponent} from 'echarts/components';
import {CanvasRenderer} from 'echarts/renderers';
import type {EChartsOption} from 'echarts';
import type {TradePeriod} from '@/lib/trade/types';
import {TRADE_SERIES,clampRange,tradePeriodLabel,type TimeRange} from '@/lib/trade/range';
echarts.use([LineChart,GridComponent,TooltipComponent,DataZoomComponent,AriaComponent,CanvasRenderer]);
export default function TradePlot({periods,range,visible,vi,onRange,onActive}:{periods:TradePeriod[];range:TimeRange;visible:boolean[];vi:boolean;onRange:(range:TimeRange)=>void;onActive:(index:number)=>void}){
 const element=useRef<HTMLDivElement>(null),instance=useRef<echarts.EChartsType|null>(null);
 const handlers=useRef({onRange,onActive});
 const selected=useRef(range);
 useEffect(()=>{handlers.current={onRange,onActive};},[onRange,onActive]);
 useEffect(()=>{selected.current=range;},[range]);
 useEffect(()=>{
  const el=element.current;if(!el)return;
  const chart=echarts.init(el,undefined,{renderer:'canvas'});instance.current=chart;
  const number=new Intl.NumberFormat(vi?'vi-VN':'en-US',{maximumFractionDigits:2});
  const draw=()=>{
   const css=getComputedStyle(el),color=(name:string)=>css.getPropertyValue(name).trim(),compact=el.clientWidth<600;
   const option:EChartsOption={
    animationDuration:350,animationDurationUpdate:150,backgroundColor:'transparent',
    aria:{enabled:true,label:{description:vi?'Ba chuỗi xuất khẩu, nhập khẩu và cán cân thương mại Việt Nam, đơn vị tỷ USD. Dùng bộ chọn năm hoặc thanh khoảng thời gian để thay đổi phạm vi.':'Vietnam exports, imports and trade balance in USD billion. Use the year selector or time range controls to change the range.'}},
    grid:{left:compact?45:60,right:compact?18:30,top:28,bottom:100},
    tooltip:{trigger:'axis',confine:true,renderMode:'richText',backgroundColor:color('--card'),borderColor:color('--border'),textStyle:{color:color('--foreground'),fontFamily:'sans-serif',fontSize:12},
     valueFormatter:value=>value===null||value===undefined?'—':number.format(Number(value)),axisPointer:{type:'line',lineStyle:{color:color('--muted-foreground'),type:'dashed'}}},
    xAxis:{type:'category',data:periods.map(p=>tradePeriodLabel(p.period,vi)),boundaryGap:false,axisLine:{lineStyle:{color:color('--border')}},axisTick:{show:false},axisLabel:{color:color('--muted-foreground'),fontSize:compact?10:11,hideOverlap:true,margin:16},axisPointer:{label:{show:true,backgroundColor:color('--secondary'),color:color('--foreground')}}},
    yAxis:{type:'value',scale:false,splitNumber:5,axisLabel:{color:color('--muted-foreground'),fontSize:11,formatter:(value:number)=>number.format(value)},splitLine:{lineStyle:{color:color('--border'),type:'dashed',opacity:.6}}},
    dataZoom:[{id:'gesture',type:'inside',xAxisIndex:0,startValue:selected.current[0],endValue:selected.current[1],filterMode:'filter',zoomOnMouseWheel:true,moveOnMouseWheel:false,moveOnMouseMove:true,preventDefaultMouseMove:true},
     {id:'navigator',type:'slider',xAxisIndex:0,startValue:selected.current[0],endValue:selected.current[1],height:30,bottom:18,left:compact?45:60,right:compact?18:30,brushSelect:false,showDetail:false,borderColor:color('--border'),backgroundColor:color('--secondary'),fillerColor:color('--trade-range-fill'),handleStyle:{color:color('--trade-export'),borderColor:color('--trade-export')},moveHandleSize:6,moveHandleStyle:{color:color('--muted-foreground')},dataBackground:{lineStyle:{color:color('--muted-foreground'),opacity:.4},areaStyle:{color:color('--muted-foreground'),opacity:.05}},selectedDataBackground:{lineStyle:{color:color('--trade-export')},areaStyle:{color:color('--trade-export'),opacity:.12}}}],
    series:TRADE_SERIES.map((s,i)=>({id:s.key,name:vi?s.vi:s.en,type:'line',data:periods.map(p=>!visible[i]||p[s.key]===null?null:p[s.key]!/1e9),connectNulls:false,smooth:.12,showSymbol:periods.length<18,symbolSize:6,lineStyle:{color:color(s.variable),width:s.key==='balanceUsd'?2:2.5,type:s.key==='balanceUsd'?'dashed':'solid'},itemStyle:{color:color(s.variable)},emphasis:{focus:'series'},markLine:s.key==='balanceUsd'?{silent:true,symbol:'none',label:{show:false},lineStyle:{color:color('--muted-foreground'),opacity:.5,type:'solid'},data:[{yAxis:0}]}:undefined})),
   };
   chart.setOption(option,{notMerge:true});
  };
  draw();
  chart.on('datazoom',()=>{
   const options=chart.getOption().dataZoom as {startValue?:number;endValue?:number}[];
   const z=options[0];if(typeof z?.startValue==='number'&&typeof z.endValue==='number')handlers.current.onRange(clampRange([z.startValue,z.endValue],periods.length));
  });
  chart.on('updateAxisPointer',(event:unknown)=>{
   const axes=(event as {axesInfo?:{value?:number}[]}).axesInfo;const index=axes?.[0]?.value;
   if(typeof index==='number')handlers.current.onActive(index);
  });
  const resize=new ResizeObserver(()=>chart.resize());resize.observe(el);
  const theme=new MutationObserver(draw);theme.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  return()=>{resize.disconnect();theme.disconnect();chart.dispose();instance.current=null;};
 },[periods,vi,visible]);
 useEffect(()=>{instance.current?.dispatchAction({type:'dataZoom',startValue:range[0],endValue:range[1]});},[range]);
 return <div className="trade-plot" ref={element} role="img" aria-label={vi?'Biểu đồ tương tác xuất nhập khẩu và cán cân thương mại':'Interactive exports, imports and trade balance chart'}/>;
}
