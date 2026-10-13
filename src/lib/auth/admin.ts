import 'server-only';
import {redirect} from 'next/navigation';
import {getCurrentUser} from './session';
export async function requireAdmin(){
 const user=await getCurrentUser();
 if(!user)redirect('/vi/login');
 if(user.role!=='admin')redirect('/vi');
 return user;
}
