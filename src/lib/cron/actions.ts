'use server';
import {revalidatePath} from 'next/cache';
import {requireAdmin} from '../auth/admin';
import {validateCronConfig} from './config';
import {saveShippingJobConfig} from './repository';
export type ConfigState={ok:boolean;message:string};
export async function updateShippingConfig(_state:ConfigState,data:FormData):Promise<ConfigState> {
 const user=await requireAdmin();
 let config;
 try{config=validateCronConfig({enabled:data.get('enabled')==='on',intervalMonths:Number(data.get('intervalMonths')),dayOfMonth:Number(data.get('dayOfMonth')),sourceUrl:String(data.get('sourceUrl')??'').trim()});}
 catch(e){return {ok:false,message:e instanceof Error?e.message:'Cấu hình không hợp lệ.'};}
 const revision=Number(data.get('revision'));
 if(!Number.isInteger(revision)||revision<1)return {ok:false,message:'Tải lại trang để lấy cấu hình mới nhất.'};
 try{await saveShippingJobConfig(config,user.id,revision);}catch{return {ok:false,message:'Không thể lưu. Cấu hình có thể đã thay đổi ở phiên khác; hãy tải lại trang và thử lại.'};}
 revalidatePath('/admin');return {ok:true,message:'Đã lưu cấu hình đồng bộ.'};
}
