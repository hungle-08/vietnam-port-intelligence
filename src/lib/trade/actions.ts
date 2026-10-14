'use server';
import {revalidatePath} from 'next/cache';
import {requireAdmin} from '../auth/admin';
import {validateTradeConfig} from './config';
import {saveTradeConfig} from './jobs';
export async function updateTradeConfig(_state:{ok:boolean;message:string},data:FormData) {
 const user=await requireAdmin();let config;
 try{config=validateTradeConfig({enabled:data.get('enabled')==='on',sourceUrl:String(data.get('sourceUrl')??'').trim()});}catch(e){return {ok:false,message:e instanceof Error?e.message:'Cấu hình không hợp lệ.'};}
 const revision=Number(data.get('revision'));if(!Number.isInteger(revision)||revision<1)return {ok:false,message:'Tải lại trang để lấy cấu hình mới nhất.'};
 try{await saveTradeConfig(config,user.id,revision);}catch{return {ok:false,message:'Không thể lưu hoặc cấu hình đã thay đổi ở phiên khác. Tải lại trang và thử lại.'};}
 revalidatePath('/admin');return {ok:true,message:'Đã lưu cấu hình xuất nhập khẩu Việt Nam.'};
}
