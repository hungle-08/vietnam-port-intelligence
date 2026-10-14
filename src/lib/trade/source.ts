import {load} from 'cheerio';
function officialUrl(href:string|undefined) {
 try{const u=new URL(href??'','https://www.nso.gov.vn/');return u.protocol==='https:'&&u.hostname==='www.nso.gov.vn'&&!u.port&&!u.username&&!u.password&&!u.search&&!u.hash?u:null;}catch{return null;}
}
export function discoverTradePage(html:string,year:number) {
 const $=load(html),links=$('a[href]').map((_,e)=>officialUrl($(e).attr('href'))).get();
 const url=links.find(u=>new RegExp(`^/du-lieu-va-so-lieu-thong-ke/${year}/\\d{2}/so-lieu-xuat-nhap-khau-cac-thang-nam-${year}/$`).test(u.pathname));
 if(!url)throw Error(`Official annual source unavailable for ${year}`);
 return url.href;
}
export function discoverTradeFiles(html:string,year:number) {
 const $=load(html),links=$('a[href]').map((_,e)=>officialUrl($(e).attr('href'))).get();
 const find=(code:string)=>links.find(u=>new RegExp(`^/wp-content/uploads/\\d{4}/\\d{2}/${code}-${year}(?:-\\d+)?\\.xls$`,'i').test(u.pathname))?.href;
 const exportsUrl=find('V01'),importsUrl=find('V02');
 if(!exportsUrl||!importsUrl)throw Error('Official export/import file pair unavailable');
 return {exportsUrl,importsUrl};
}
