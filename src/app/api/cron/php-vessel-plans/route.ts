import {authorizedCron} from '@/lib/cron/config';
import {runPhpDaily} from '@/lib/php/jobs';
export const maxDuration=60;
export async function GET(request:Request){
 const headers={'Cache-Control':'no-store'};
 if(!authorizedCron(request.headers.get('authorization'),process.env.CRON_SECRET))return Response.json({error:'Unauthorized'},{status:401,headers});
 try{const result=await runPhpDaily();return Response.json(result,{status:result.status==='failed'?502:200,headers});}
 catch{return Response.json({error:'Không thể đồng bộ kế hoạch tàu.'},{status:500,headers});}
}
