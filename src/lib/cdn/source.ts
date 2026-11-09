import * as cheerio from 'cheerio';
export const CDN_SOURCE='https://danangport.com/tra-cuu-tau-container/';
export type CdnLink={id:string;url:string};
export type CdnDetail={vesselName:string;carrier:string|null;voyage:string|null;berth:string;atb:string;teu:number|null;containers:number|null};
export function parseCdnList(html:string):CdnLink[]{
 const $=cheerio.load(html);if(!html.includes('tau-container-form')&&!html.includes('Tàu đang làm hàng'))throw Error('Unrecognized source page');
 const seen=new Set<string>();const out:CdnLink[]=[];
 $('a[href]').each((_,el)=>{try{const u=new URL($(el).attr('href')!,CDN_SOURCE);if(u.hostname!=='danangport.com'||!/^\/tra-cuu-tau-container\/chi-tiet\/?$/.test(u.pathname))return;const year=u.searchParams.get('nam'),seq=u.searchParams.get('seq'),vsl=u.searchParams.get('vsl');if(!year||!/^\d{4}$/.test(year)||!seq||!/^\d+$/.test(seq)||!vsl||!/^[\w-]{1,40}$/.test(vsl))return;const id=`${year}:${seq}:${vsl}`;if(!seen.has(id)){seen.add(id);out.push({id,url:u.toString()})}}catch{}});return out;
}
export function parseCdnDetail(html:string):CdnDetail{
 const $=cheerio.load(html);const heading=$('table').filter((_,t)=>$(t).text().includes('Cầu bến')&&$(t).text().includes('ATB')).first();if(!heading.length)throw Error('Unrecognized detail');
 const val=(label:string)=>{const th=heading.find('th').filter((_,x)=>$(x).text().includes(label)).first();return th.next('td').text().trim()||null};
 const number=(v:string|null)=>v&&/^\d+$/.test(v)?Number(v):null;
 const vesselName=$('main h2').first().text().trim()||$('h2').first().text().trim();
 const berth=val('Cầu bến'),atb=val('Thời điểm cập cầu');if(!vesselName||!berth||!atb||!/^\d{4}-\d\d-\d\d \d\d:\d\d$/.test(atb)||!Number.isFinite(Date.parse(atb.replace(' ','T')+':00+07:00')))throw Error('Missing or invalid arrival');
 return {vesselName,carrier:val('Hãng tàu'),voyage:val('Chuyến'),berth,atb,teu:number(val('TEUs')),containers:number(val('Containers'))};
}
export function tiensaBerth(value:string){return new Set(['TS1A','TS1B','TS2A','TS2B','TS03','TS04','TS05','TS07']).has(value.trim().toUpperCase());}
export function monthsToFetch(start:string,end:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||start>end)throw Error('Invalid date range');const result:string[]=[];const d=new Date(`${start.slice(0,7)}-01T00:00:00Z`),last=new Date(`${end.slice(0,7)}-01T00:00:00Z`);last.setUTCMonth(last.getUTCMonth()+1);while(d<=last){result.push(d.toISOString().slice(0,7));d.setUTCMonth(d.getUTCMonth()+1)}return result;}
