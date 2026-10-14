'use server';
import {requireAdmin} from '../auth/admin';
import {revalidatePath} from 'next/cache';
import {validatePhpConfig} from './config';
import {savePhpConfig} from './jobs';
export async function updatePhpConfig(_state:{ok:boolean;message:string},data:FormData){
 const user=await requireAdmin();let c;
 try{c=validatePhpConfig({enabled:data.get('enabled')==='on',intervalDays:Number(data.get('intervalDays')),runHour:Number(data.get('runHour')),sourceUrl:String(data.get('sourceUrl')??'').trim()});}catch(e){return {ok:false,message:e instanceof Error?e.message:'Cấu hình không hợp lệ.'};}
 const revision=Number(data.get('revision'));if(!Number.isInteger(revision)||revision<1)return {ok:false,message:'Tải lại trang để lấy cấu hình mới nhất.'};
 try{await savePhpConfig(c,user.id,revision);}catch{return {ok:false,message:'Không thể lưu hoặc cấu hình đã được sửa ở phiên khác. Tải lại trang và thử lại.'};}
 revalidatePath('/admin');return {ok:true,message:'Đã lưu cấu hình kế hoạch tàu PHP.'};
}
