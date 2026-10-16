import 'server-only';
import {parseTradeResponse} from './data';
export async function fetchTradeData(){
 const key=process.env.DLKT_API_KEY;
 if(!key)throw Error('trade-api-not-configured');
 // One shared request across both languages and all chart windows. Never put the key in the URL.
 try {
  const response=await fetch('https://api.dulieukinhte.com/v1/series/observations?ids=22603,22606&limit=500',{
   headers:{Authorization:`Bearer ${key}`,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(12000),
   cache:'force-cache',next:{revalidate:86400},
  });
  if(!response.ok)throw Error('trade-api-unavailable');
  return parseTradeResponse(await response.json());
 }catch{throw Error('trade-api-unavailable');}
}
