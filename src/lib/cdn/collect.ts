import {CDN_SOURCE,parseCdnList,parseCdnDetail,tiensaBerth,type CdnLink} from './source';
const fetchHtml=async(url:string,init?:RequestInit)=>{const response=await fetch(url,{...init,cache:'no-store',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error(`Source HTTP ${response.status}`);return response.text()};
export async function fetchCdnList(month?:string){
 const init:RequestInit=month?{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({thang:month.slice(5,7),nam:month.slice(0,4)})}:{};
 return parseCdnList(await fetchHtml(CDN_SOURCE,init));
}
export async function fetchCdnDetail(link:CdnLink){const detail=parseCdnDetail(await fetchHtml(link.url));return {...link,...detail,terminal:tiensaBerth(detail.berth)?'tien-sa':null};}
