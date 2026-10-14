import {authorizedCron} from '@/lib/cron/config';
import {runShippingCron} from '@/lib/cron/runner';
import {claimShippingJob,completeShippingJob,failShippingJob} from '@/lib/cron/repository';
import {collectShipping} from '@/lib/shipping/collect';
export const maxDuration=60;
export async function GET(request:Request) {
 const headers={'Cache-Control':'no-store'};
 if(!authorizedCron(request.headers.get('authorization'),process.env.CRON_SECRET))return Response.json({error:'Unauthorized'},{status:401,headers});
 try{
  const result=await runShippingCron({claim:claimShippingJob,collect:collectShipping,succeed:completeShippingJob,fail:failShippingJob});
  return Response.json(result,{status:result.status==='failed'?502:200,headers});
 }catch{return Response.json({error:'Không thể thực hiện đồng bộ.'},{status:500,headers});}
}
