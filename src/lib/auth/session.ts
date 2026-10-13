import 'server-only';
import {cookies} from 'next/headers';
import {authStore} from './repository';
import {hashSessionToken} from './security';
export const SESSION_COOKIE='vpi_session';
export async function getCurrentUser(){
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 const hash=token?hashSessionToken(token):null;
 if(!hash)return null;
 return authStore.currentUser(hash);
}
