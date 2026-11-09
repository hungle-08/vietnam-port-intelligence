import {loadEnvConfig} from '@next/env';
import {fetchCdnList} from '../src/lib/cdn/collect';
import {enqueueCdn,pendingCdn} from '../src/lib/cdn/repository';
import {getDb} from '../src/lib/db';
import {processCdnQueue} from '../src/lib/cdn/jobs';
import {monthsToFetch} from '../src/lib/cdn/source';
import {vietnamDay} from '../src/lib/php/config';
async function main(){loadEnvConfig(process.cwd());const today=vietnamDay();const months=monthsToFetch('2026-01-01',today).filter(x=>x<=today.slice(0,7));if(!process.argv.includes('--resume'))for(const m of months){const links=await fetchCdnList(m);await enqueueCdn(links);console.log(`${m}: ${links.length} liên kết`)}await enqueueCdn(await fetchCdnList(),true);let total=0;while(true){const pending=await pendingCdn(100);if(!pending.length)break;const result=await processCdnQueue(100,Date.now()+600000);total+=result.saved;console.log(`Lượt đã lưu: ${total}; lỗi trong lô: ${result.failed}`);if(result.failed){const sql=getDb();const [counts]=await sql`SELECT count(*)::int AS pending FROM cdn_source_queue WHERE status='pending'`;if(Number(counts.pending)===0){console.log('Có lượt chưa đọc được; chạy lại script để thử lại.');process.exitCode=1;break}}}}
main().catch(()=>{console.error('Backfill CDN lỗi. Kiểm tra kết nối và chạy lại; dữ liệu đã lưu được giữ nguyên.');process.exitCode=1});
