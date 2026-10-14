import 'server-only';
import {NEWS_SOURCES,type NewsResponse} from './types';
import {mergeNews,monthRange,parsePortNews,parseCafeNews,parseVietnamNews} from './parse';
import {scanMonth} from './paging';
import {vietnamDay} from '../config';

async function fetchText(url:string,signal:AbortSignal,body?:Record<string,string>){
 const response=await fetch(url,{method:body?'POST':'GET',body:body?JSON.stringify(body):undefined,headers:body?{'Content-Type':'application/json; charset=utf-8'}:undefined,signal:AbortSignal.any([signal,AbortSignal.timeout(8000)]),redirect:'error',cache:'no-store'});
 if(!response.ok||!response.body)throw Error('Source unavailable');
 const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;
 try{while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>3_000_000)throw Error('Source response too large');chunks.push(chunk.value);}}finally{await reader.cancel();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return new TextDecoder().decode(bytes);
}
export async function collectPhpNews(month:string,requestSignal?:AbortSignal):Promise<NewsResponse>{
 monthRange(month);const deadline=AbortSignal.timeout(40000),signal=requestSignal?AbortSignal.any([requestSignal,deadline]):deadline;
 const loaders={
  haiphongport:async(page:number)=>{
   const raw=JSON.parse(await fetchText('https://haiphongport.com.vn/WebService/Article.asmx/GetArticles',signal,{cat:'6',lang:'vi',PageIndex:String(page),PageSize:'30'}));
   if(typeof raw.d!=='string')throw Error('Invalid source response');const value=JSON.parse(raw.d);if(!Array.isArray(value)||value.length<2||typeof value[1]!=='string')throw Error('Invalid port feed');
   const articles=parsePortNews(value[1]);if(articles.length!==Number(value[0]))throw Error('Port feed structure changed');return articles;
  },
  cafef:async(page:number)=>{
   const url=new URL('https://cafef.vn/du-lieu/Ajax/NewsBySymbol.aspx');url.search=new URLSearchParams({symbol:'PHP',configID:'0',PageIndex:String(page),PageSize:'30',Type:'1'}).toString();
   const html=await fetchText(url.toString(),signal),articles=parseCafeNews(html);
   if(html.trim()&&!html.includes('divEvents'))throw Error('CafeF feed structure changed');
   if(html.includes('<li')&&!articles.length)throw Error('CafeF article dates missing');return articles;
  },
  vietnam:async(page:number)=>{
   // This public category and endpoint are the maritime feed used by Vietnam.vn's own website.
   const url=new URL('https://api.vietnam.vn/api/page/category/d16f0555b40d47eb933532f2fe97dc4c');url.search=new URLSearchParams({type:'0',page:String(page-1),limit:'30'}).toString();
   const raw=JSON.parse(await fetchText(url.toString(),signal));if(raw.error!==0||!Array.isArray(raw.data?.listNewsPage))throw Error('Vietnam.vn feed structure changed');
   const rows=raw.data.listNewsPage as Record<string,unknown>[];
   const days=rows.map(row=>{if(typeof row.tsPublished!=='number'||!Number.isFinite(row.tsPublished)||row.tsPublished<=0)throw Error('Missing published date');return vietnamDay(new Date(row.tsPublished));});
   if(days.some((day,i)=>i>0&&day>days[i-1]))throw Error('Unordered maritime feed');
   return{articles:parseVietnamNews(rows),days};
  },
 };
 const results=await Promise.all(NEWS_SOURCES.map(async source=>{
  let readable=false;const result=await scanMonth(async page=>{const data=await loaders[source.id](page);readable=true;return data;},month);
  return {id:source.id,articles:result.articles,status:result.complete?'ok' as const:readable?'partial' as const:'error' as const};
 }));
 const articles=mergeNews(results.flatMap(source=>source.articles),month).filter(article=>article.publishedDay<=vietnamDay());
 return{month,fetchedAt:new Date().toISOString(),articles,sources:results.map(source=>({id:source.id,status:source.status,count:articles.filter(article=>article.source===source.id).length}))};
}
