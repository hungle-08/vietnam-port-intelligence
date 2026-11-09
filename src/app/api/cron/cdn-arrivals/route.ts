import {authorizedCron} from '@/lib/cron/config';
import {runCdnDaily} from '@/lib/cdn/jobs';
export const maxDuration=60;
export async function GET(request:Request){const headers={'Cache-Control':'no-store'};if(!authorizedCron(request.headers.get('authorization'),process.env.CRON_SECRET))return Response.json({error:'Unauthorized'},{status:401,headers});try{const result=await runCdnDaily();return Response.json(result,{status:result.status==='failed'?502:200,headers});}catch{return Response.json({error:'Không thể đồng bộ dữ liệu CDN.'},{status:502,headers});}}
