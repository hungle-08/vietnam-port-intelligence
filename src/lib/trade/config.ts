export const TRADE_SOURCE='https://www.nso.gov.vn/xuat-nhap-khau/';
export type TradeConfigInput={enabled:boolean;sourceUrl:string};
export function validateTradeConfig(c:TradeConfigInput) {
 if(typeof c.enabled!=='boolean')throw Error('Cấu hình không hợp lệ.');
 if(c.sourceUrl!==TRADE_SOURCE)throw Error('Nguồn chưa được hỗ trợ. Dùng danh mục xuất nhập khẩu của Cục Thống kê.');
 return c;
}
/** Monthly on the 25th at 08:00 Vietnam (01:00 UTC), after the observed Excel publication window. */
export function nextTradeRun(now=new Date()) {
 let candidate=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),25,1));
 if(candidate<=now)candidate=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,25,1));
 return candidate;
}
