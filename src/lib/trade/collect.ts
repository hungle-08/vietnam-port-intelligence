import 'server-only';
import {createHash} from 'node:crypto';
import {validateTradeConfig,TRADE_SOURCE} from './config';
import {discoverTradeFiles,discoverTradePage} from './source';
import {combineTradeMonths,parseTradeWorkbook} from './parse';
import type {TradeRelease} from './types';
async function download(url:string,deadline:number,limit=8*1024*1024) {
 const ms=Math.min(12000,deadline-Date.now());if(ms<=0)throw Error('Collection deadline exceeded');
 const r=await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(ms)});
 if(!r.ok||Number(r.headers.get('content-length'))>limit||!r.body)throw Error('Official source unavailable');
 const reader=r.body.getReader(),chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw Error('Response too large');chunks.push(value);}}finally{await reader.cancel();}
 return Buffer.concat(chunks,size);
}
export async function collectTrade(years:number[],sourceUrl=TRADE_SOURCE,now=new Date()):Promise<TradeRelease[]> {
 validateTradeConfig({enabled:true,sourceUrl});
 if(!years.length||years.length>3||years.some(y=>!Number.isInteger(y)||y<2000||y>now.getUTCFullYear()))throw Error('Invalid trade years');
 const deadline=Date.now()+42000,index=(await download(sourceUrl,deadline,2*1024*1024)).toString('utf8');
 return Promise.all([...new Set(years)].map(async year=>{
  const page=discoverTradePage(index,year),html=(await download(page,deadline,2*1024*1024)).toString('utf8');
  const {exportsUrl,importsUrl}=discoverTradeFiles(html,year);
  const [exp,imp]=await Promise.all([download(exportsUrl,deadline),download(importsUrl,deadline)]);
  const months=combineTradeMonths(parseTradeWorkbook(exp,year,'exports',now),parseTradeWorkbook(imp,year,'imports',now));
  const id=createHash('sha256').update(String(year)).update(exp).update(imp).digest('hex');
  return {id,year,sourceUrl:page,exportsUrl,importsUrl,retrievedAt:new Date().toISOString(),months};
 }));
}
