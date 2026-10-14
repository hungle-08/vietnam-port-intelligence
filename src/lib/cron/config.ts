export const SHIPPING_JOB = 'shipping-top-ten';
export const ALPHALINER_PAGE = 'https://alphaliner.axsmarine.com/PublicTop100/';
export const ALPHALINER_API = `${ALPHALINER_PAGE}rooter.php`;
export type CronConfigInput = {enabled:boolean;intervalMonths:number;dayOfMonth:number;sourceUrl:string};
export function validateCronConfig(input:CronConfigInput):CronConfigInput {
 if(typeof input.enabled!=='boolean'||!Number.isInteger(input.intervalMonths)||input.intervalMonths<1||input.intervalMonths>12||!Number.isInteger(input.dayOfMonth)||input.dayOfMonth<1||input.dayOfMonth>28)throw Error('Chu kỳ phải từ 1–12 tháng, ngày chạy từ 1–28.');
 if(![ALPHALINER_PAGE,ALPHALINER_API].includes(input.sourceUrl))throw Error('Nguồn chưa được hỗ trợ. Dùng URL trang Alphaliner TOP 100 hoặc API công khai của trang.');
 return input;
}
/** 07:00 Vietnam = 00:00 UTC. Days capped at 28 avoid skipped short months. */
export function nextMonthlyRun(now:Date,intervalMonths:number,dayOfMonth:number):Date {
 validateCronConfig({enabled:true,intervalMonths,dayOfMonth,sourceUrl:ALPHALINER_PAGE});
 const local=new Date(now.getTime()+7*3600_000);
 let candidate=new Date(Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),dayOfMonth));
 if(candidate<=now)candidate=new Date(Date.UTC(local.getUTCFullYear(),local.getUTCMonth()+intervalMonths,dayOfMonth));
 return candidate;
}
export function authorizedCron(header:string|null,secret:string|undefined):boolean {
 return Boolean(secret&&header===`Bearer ${secret}`);
}
