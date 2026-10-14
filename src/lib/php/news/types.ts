export const NEWS_SOURCES=[
 {id:'haiphongport',name:'Cảng Hải Phòng',url:'https://haiphongport.com.vn/vi/tin-tuc'},
 {id:'cafef',name:'CafeF',url:'https://cafef.vn/du-lieu/php/thong-tin-chung.chn'},
 {id:'vietnam',name:'Vietnam.vn',url:'https://www.vietnam.vn/category/vimc'},
] as const;
export type NewsSource=typeof NEWS_SOURCES[number]['id'];
export type NewsArticle={url:string;title:string;publishedDay:string;source:NewsSource;topic:'php'|'industry';imageUrl:string|null};
export type NewsSourceState={id:NewsSource;status:'ok'|'partial'|'error';count:number};
export type NewsResponse={month:string;fetchedAt:string;articles:NewsArticle[];sources:NewsSourceState[]};
