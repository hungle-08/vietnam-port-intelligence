import {monthRange} from './parse';
import type {NewsArticle} from './types';
export type NewsPage={articles:NewsArticle[];days:string[]};
export async function scanMonth(loadPage:(page:number)=>Promise<NewsArticle[]|NewsPage>,month:string,maxRequests=24){
 const {start,end}=monthRange(month),cache=new Map<number,NewsPage>(),articles:NewsArticle[]=[];let requests=0;
 const read=async(page:number)=>{if(cache.has(page))return cache.get(page)!;if(++requests>maxRequests)throw Error('Request budget');const value=await loadPage(page),rows=Array.isArray(value)?{articles:value,days:value.map(row=>row.publishedDay)}:value;cache.set(page,rows);return rows;};
 const oldest=(rows:NewsPage)=>rows.days.reduce((day,value)=>value<day?value:day,'9999-12-31');
 try{
  const first=await read(1);if(!first.days.length||first.days.every(day=>day<start))return {articles,complete:true};
  let low=1,high=1;
  if(oldest(first)>end){high=2;while(true){const rows=await read(high);if(!rows.days.length||oldest(rows)<=end)break;low=high;high*=2;}
   while(low+1<high){const mid=Math.floor((low+high)/2),rows=await read(mid);if(!rows.days.length||oldest(rows)<=end)high=mid;else low=mid;}
  }
  const fingerprints=new Set<string>();
  for(let page=high;;page++){
   const rows=await read(page);if(!rows.days.length)return{articles,complete:true};
   const fingerprint=rows.articles.map(row=>row.url).join('|');if(fingerprint&&fingerprints.has(fingerprint))return{articles,complete:false};fingerprints.add(fingerprint);
   articles.push(...rows.articles.filter(row=>row.publishedDay>=start&&row.publishedDay<=end));
   if(oldest(rows)<start)return{articles,complete:true};
  }
 }catch{return{articles,complete:false};}
}
