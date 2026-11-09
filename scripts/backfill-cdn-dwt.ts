import {loadEnvConfig} from '@next/env';
import {lookupCdnDwt} from '../src/lib/cdn/jobs';
async function main(){loadEnvConfig(process.cwd());const index=process.argv.indexOf('--limit');const limit=index<0?30:Number(process.argv[index+1]);if(!Number.isInteger(limit)||limit<1||limit>300)throw Error('--limit phải từ 1 đến 300');let checked=0;while(checked<limit){const result=await lookupCdnDwt(Math.min(5,limit-checked));checked+=result.checked;console.log(`Đã tra ${checked} tên tàu; kết quả cần duyệt trong admin.`);if(!result.checked)break}}
main().catch(e=>{console.error(e instanceof Error?e.message:'Không thể tra cứu DWT');process.exitCode=1});
