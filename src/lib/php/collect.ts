import {PHP_SOURCE,PHP_UPSTREAM,sourceOffset,validatePhpConfig} from './config';
import {parseHaiphongPlan} from './parse';
export async function collectPhpDay(day:string,sourceUrl=PHP_SOURCE,signal?:AbortSignal){
 validatePhpConfig({enabled:true,intervalDays:1,runHour:7,sourceUrl});
 const url=new URL(PHP_UPSTREAM);url.searchParams.set('d',String(sourceOffset(day)));
 const response=await fetch(url,{cache:'no-store',redirect:'error',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(10000)]):AbortSignal.timeout(10000)});
 if(!response.ok||!response.body)throw Error('Source unavailable');
 const chunks:Uint8Array[]=[];let size=0;const reader=response.body.getReader();
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>3_000_000)throw Error('Source too large');chunks.push(value);}}finally{await reader.cancel();}
 return parseHaiphongPlan(Buffer.concat(chunks).toString('utf8'),day,new Date().toISOString(),sourceUrl);
}
