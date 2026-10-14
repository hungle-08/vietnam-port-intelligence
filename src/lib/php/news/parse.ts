import * as cheerio from 'cheerio';
import {validateDay,vietnamDay} from '../config';
import type {NewsArticle,NewsSource} from './types';
const origins={haiphongport:'https://haiphongport.com.vn',cafef:'https://cafef.vn',vietnam:'https://www.vietnam.vn'};
const clean=(s:string)=>{const $=cheerio.load(s);$('script,style').remove();return $.text().replace(/\s+/g,' ').trim();};
const normalized=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('đ','d').replaceAll('Đ','D').toLowerCase();
export function monthRange(month:string){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||Number(month.slice(0,4))<1900||Number(month.slice(0,4))>2100)throw Error('Invalid month');
 return {start:month+'-01',end:month+'-'+new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).getUTCDate()};
}
export function newsTopic(title:string):NewsArticle['topic']|null{
 const s=normalized(title);
 if(/^php\s*:/.test(s)||/\b(cang hai phong|cang tan vu|cang hoang dieu|cang chua ve|htit)\b/.test(s))return 'php';
 return /\b(cang bien|ben cang|cau cang|hang qua cang|san luong cang|cang container|cang nuoc sau|cang lach huyen|nganh cang|khai thac cang)\b/.test(s)?'industry':null;
}
export function safeArticleUrl(value:string,source:NewsSource){
 try{const u=new URL(value,origins[source]);if(u.protocol!=='https:'||u.hostname!==new URL(origins[source]).hostname||u.username||u.password||u.port)return null;
 if(source==='haiphongport'&&!/^\/vi\/[a-z0-9-]+\/[^/]+\.html$/i.test(u.pathname))return null;
 if(source==='cafef'&&!u.pathname.endsWith('.chn'))return null;
 if(source==='vietnam'&&(!/^\/[a-z0-9-]+\/?$/.test(u.pathname)||['/search','/category','/authors'].includes(u.pathname)))return null;
 u.search='';u.hash='';return u.toString();}catch{return null;}
}
function imageUrl(value:string|undefined,source:NewsSource){
 if(!value)return null;try{const u=new URL(value,origins[source]);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&([new URL(origins[source]).hostname,'vstatic.vietnam.vn','vphoto.vietnam.vn','cafefcdn.com'].includes(u.hostname)||u.hostname.endsWith('.mediacdn.vn'))?u.toString():null;}catch{return null;}
}
function dayFromText(value:string){const m=value.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);if(!m)return null;try{return validateDay(`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`);}catch{return null;}}
export function parsePortNews(html:string):NewsArticle[]{
 const $=cheerio.load(html),rows:NewsArticle[]=[];
 $('.gd_post__item').each((_,el)=>{const item=$(el),link=item.find('.gd_post__title, .gd_post__content a').first(),title=clean(link.text()).slice(0,300),url=safeArticleUrl(link.attr('href')??'','haiphongport'),publishedDay=dayFromText(item.find('.gd_date_new').text());
 if(url&&title&&publishedDay)rows.push({url,title,publishedDay,source:'haiphongport',topic:'php',imageUrl:imageUrl(item.find('img').attr('src'),'haiphongport')});});return rows;
}
export function parseCafeNews(html:string):NewsArticle[]{
 const $=cheerio.load(html),rows:NewsArticle[]=[];
 $('#divEvents li, .News_Title_Link li').each((_,el)=>{const item=$(el),link=item.find('a[href]').first(),title=clean(link.text()).slice(0,300),url=safeArticleUrl(link.attr('href')??'','cafef'),publishedDay=dayFromText(item.text());
 if(url&&title&&publishedDay)rows.push({url,title,publishedDay,source:'cafef',topic:newsTopic(title)??'php',imageUrl:null});});return [...new Map(rows.map(row=>[row.url,row])).values()];
}
export function parseVietnamNews(rows:unknown[]):NewsArticle[]{
 return rows.flatMap(value=>{if(!value||typeof value!=='object')return[];const row=value as Record<string,unknown>;
 if(typeof row.title!=='string'||typeof row.slug!=='string'||typeof row.tsPublished!=='number'||!Number.isFinite(row.tsPublished)||row.tsPublished<=0)return[];
 const title=clean(row.title).slice(0,300),url=safeArticleUrl('/'+row.slug,'vietnam'),topic=newsTopic(title+' '+(typeof row.description==='string'?clean(row.description):''));if(!url||!title||!topic)return[];
 try{return[{url,title,publishedDay:vietnamDay(new Date(row.tsPublished)),source:'vietnam' as const,topic,imageUrl:imageUrl(typeof row.thumbUrl==='string'?row.thumbUrl:undefined,'vietnam')}];}catch{return[];}
 });
}
export function mergeNews(rows:NewsArticle[],month:string){
 const {start,end}=monthRange(month),seenUrls=new Set<string>(),seenTitles=new Set<string>();
 return rows.filter(row=>{if(row.publishedDay<start||row.publishedDay>end)return false;const key=row.publishedDay+':'+normalized(row.title).replace(/[^a-z0-9]+/g,' ').trim();if(seenUrls.has(row.url)||seenTitles.has(key))return false;seenUrls.add(row.url);seenTitles.add(key);return true;}).sort((a,b)=>b.publishedDay.localeCompare(a.publishedDay));
}
