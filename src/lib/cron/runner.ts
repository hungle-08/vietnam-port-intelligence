import type {ShippingSnapshot} from '../shipping/types';
export type ClaimedJob={id:string;sourceUrl:string};
export type CronDependencies<T extends ClaimedJob>={claim:()=>Promise<T|null>;collect:(url:string)=>Promise<ShippingSnapshot>;succeed:(job:T,snapshot:ShippingSnapshot)=>Promise<void>;fail:(job:T,message:string)=>Promise<void>};
export async function runShippingCron<T extends ClaimedJob>(deps:CronDependencies<T>) {
 const job=await deps.claim();
 if(!job)return {status:'skipped' as const};
 try{const snapshot=await deps.collect(job.sourceUrl);await deps.succeed(job,snapshot);return {status:'success' as const,asOf:snapshot.asOf};}
 catch{await deps.fail(job,'Không thể thu thập hoặc lưu dữ liệu hợp lệ. Hệ thống sẽ thử lại vào lượt kiểm tra tiếp theo.');return {status:'failed' as const};}
}
