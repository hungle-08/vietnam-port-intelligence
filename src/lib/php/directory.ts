const annual='https://haiphongport.com.vn/FileUpload/Documents/bao_cao_thuong_nien_nam_2025pdf.pdf';
export const phpTerminals=[
 {id:'php-tan-vu',name:'Cảng Tân Vũ',operator:'Chi nhánh Cảng Tân Vũ — CTCP Cảng Hải Phòng',aliases:['TAN VU'],relation:'branch',ownershipPercent:100,scope:'direct',relatedTicker:null,sourceUrl:'https://haiphongport.com.vn/vi/don-vi-thanh-vien'},
 {id:'php-hoang-dieu',name:'Cảng Hoàng Diệu',operator:'Công ty TNHH MTV Cảng Hoàng Diệu Chùa Vẽ',aliases:['HOANG DIEU'],relation:'subsidiary',ownershipPercent:100,scope:'direct',relatedTicker:null,sourceUrl:annual},
 {id:'php-chua-ve',name:'Cảng Chùa Vẽ',operator:'Công ty TNHH MTV Cảng Hoàng Diệu Chùa Vẽ',aliases:['CHUA VE'],relation:'subsidiary',ownershipPercent:100,scope:'direct',relatedTicker:null,sourceUrl:annual},
 {id:'php-htit',name:'HTIT — Bến 3, 4 Lạch Huyện',operator:'Công ty TNHH Cảng quốc tế TIL Cảng Hải Phòng',aliases:['HTIT'],relation:'joint-venture',ownershipPercent:51,scope:'system',relatedTicker:null,sourceUrl:'https://haiphongport.com.vn/FileUpload/Documents/3_report_on_lach_huyen_projectpdf.pdf'},
 {id:'dvp-dinh-vu',name:'Cảng Đình Vũ',operator:'CTCP Đầu tư và Phát triển Cảng Đình Vũ',aliases:['DINH VU'],relation:'subsidiary',ownershipPercent:51,scope:'system',relatedTicker:'DVP',sourceUrl:annual}
] as const;
export function normalizeLocation(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('đ','d').replaceAll('Đ','D').trim().replace(/\s+/g,' ').toUpperCase();}
export function matchTerminal(s:string){const normalized=normalizeLocation(s);return phpTerminals.find(t=>(t.aliases as readonly string[]).includes(normalized))?.id??null;}
