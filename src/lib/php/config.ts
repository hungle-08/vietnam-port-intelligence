export const PHP_SOURCE='https://cangvuhaiphong.gov.vn/ke-hoach-tau/';
export const PHP_UPSTREAM='https://csdltau.cangvuhaiphong.gov.vn/pages/ship_plan.aspx';
export type PhpConfigInput={enabled:boolean;intervalDays:number;sourceUrl:string;runHour:number};
export function validatePhpConfig(c:PhpConfigInput){
 if(typeof c.enabled!=='boolean'||!Number.isInteger(c.intervalDays)||c.intervalDays<1||c.intervalDays>4||c.runHour!==0)throw Error('Chu kỳ từ 1–4 ngày; gói Hobby dùng lịch 00:00 giờ Việt Nam.');
 if(![PHP_SOURCE,PHP_UPSTREAM].includes(c.sourceUrl))throw Error('Nguồn chưa có bộ đọc tương thích. Dùng trang kế hoạch tàu Cảng vụ Hải Phòng hoặc URL nhúng được hỗ trợ.');
 return c;
}
export function validateDay(day:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day))||new Date(day+'T00:00:00Z').toISOString().slice(0,10)!==day)throw Error('Invalid calendar date');return day;}
export function vietnamDay(now=new Date()){return new Date(now.getTime()+7*3600_000).toISOString().slice(0,10);}
export function addDays(day:string,n:number){validateDay(day);return new Date(Date.parse(day+'T00:00:00Z')+n*86400_000).toISOString().slice(0,10);}
export function sourceOffset(day:string,now=new Date()){validateDay(day);return (Date.parse(day)-Date.parse(vietnamDay(now)))/86400_000;}
export function nextDailyRun(now:Date,intervalDays:number){return new Date(Date.parse(addDays(vietnamDay(now),intervalDays)+'T00:00:00Z')-7*3600_000).toISOString();}
