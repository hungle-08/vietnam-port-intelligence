import {collectShipping} from '@/lib/shipping/collect';
import {carriers} from '@/lib/shipping/carriers';
import {ALPHALINER_PAGE} from '@/lib/shipping/source';
export const maxDuration=30;
export async function GET(request:Request){
 const headers={'Cache-Control':'no-store, max-age=0','CDN-Cache-Control':'no-store'};
 try{
  const snapshot=await collectShipping(ALPHALINER_PAGE,request.signal);
  return Response.json({...snapshot,carriers},{headers});
 }catch{return Response.json({error:'Shipping source unavailable. Please try again.'},{status:502,headers});}
}
