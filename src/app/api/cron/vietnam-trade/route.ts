import {authorizedCron} from '@/lib/cron/config';
import {runTradeCron} from '@/lib/trade/jobs';
export const maxDuration=60;
export async function GET(request:Request) {
 const headers={'Cache-Control':'no-store'};
 if(!authorizedCron(request.headers.get('authorization'),process.env.CRON_SECRET))return Response.json({error:'Unauthorized'},{status:401,headers});
 try{const result=await runTradeCron();return Response.json(result,{status:result.status==='failed'?502:200,headers});}
 catch{return Response.json({error:'Không thể kiểm tra dữ liệu xuất nhập khẩu.'},{status:500,headers});}
}
