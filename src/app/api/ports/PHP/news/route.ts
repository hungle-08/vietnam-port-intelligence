import {collectPhpNews} from '@/lib/php/news/collect';
import {monthRange} from '@/lib/php/news/parse';
import {vietnamDay} from '@/lib/php/config';
export const maxDuration=60;
export async function GET(request:Request){
 const headers={'Cache-Control':'no-store, max-age=0'};
 const month=new URL(request.url).searchParams.get('month')??vietnamDay().slice(0,7);
 try{monthRange(month);}catch{return Response.json({error:'Invalid month. Use YYYY-MM.'},{status:400,headers});}
 try{const result=await collectPhpNews(month,request.signal);return Response.json(result,{status:result.sources.every(source=>source.status==='error')?503:200,headers});}
 catch{return Response.json({error:'Unable to fetch news. Please try again.'},{status:502,headers});}
}
