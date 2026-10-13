// Selected reference points, not exhaustive coastlines or maritime boundaries.
// DMS converted to decimal degrees; sources document these named geographic points.
export const archipelagos = [
 {id:'hoang-sa',name:'Hoàng Sa',label:[112.4,17.65] as [number,number],source:'https://duynghia.danang.gov.vn/vi/web/dng-old/w/ubnd-huy%E1%BB%87n-ho%C3%A0ng-sa',points:[
  {name:'Đá Bắc',coordinates:[111+30/60+8/3600,17.1] as [number,number]},
  {name:'Hoàng Sa',coordinates:[111+36/60+7/3600,16+32/60] as [number,number]},
  {name:'Tri Tôn',coordinates:[111+11/60+8/3600,15+47/60+2/3600] as [number,number]},
  {name:'Phú Lâm',coordinates:[112+20/60,16+50/60+2/3600] as [number,number]},
  {name:'Linh Côn',coordinates:[112+43/60+6/3600,16+40/60+3/3600] as [number,number]},
  {name:'Bạch Quy',coordinates:[111+46/60+9/3600,16+3/60+5/3600] as [number,number]},
 ]},
 {id:'truong-sa',name:'Trường Sa',label:[114.25,12.1] as [number,number],source:'https://svhttdl.khanhhoa.gov.vn/vi/di-tichdi-san-cap-quoc-gia/bia-chu-quyen-quan-dao-truong-sa-tai-dao-song-tu-tay-va-dao-nam-yet',points:[
  {name:'Trường Sa',coordinates:[111+55/60,8+38/60] as [number,number]},
  {name:'Song Tử Tây',coordinates:[114.3,11+25/60+55/3600] as [number,number]},
  {name:'Nam Yết',coordinates:[114+22/60,10+10/60+45/3600] as [number,number]},
 ]},
];
// Center the mainland silhouette; reserve space on the east for archipelagos.
export const mapFrame={width:920,height:1020,center:[105.8,16.1] as [number,number],scale:2775};
