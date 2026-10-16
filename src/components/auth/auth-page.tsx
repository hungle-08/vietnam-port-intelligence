import {Suspense} from 'react';
import {PageSkeleton} from '@/components/loading/skeletons';
import {notFound,redirect} from 'next/navigation';
import {isLocale,type Locale} from '@/lib/i18n';
import {getCurrentUser} from '@/lib/auth/session';
import {AuthForm} from './auth-form';
async function Content({locale,mode}:{locale:Locale;mode:'login'|'register'}){
 if(await getCurrentUser())redirect(`/${locale}`);
 return <AuthForm locale={locale} mode={mode}/>;
}
export async function AuthPage({params,mode}:{params:Promise<{locale:string}>;mode:'login'|'register'}){
 const {locale}=await params;if(!isLocale(locale))notFound();
 return <Suspense fallback={<PageSkeleton locale={locale} variant="auth" register={mode==='register'}/>}><Content locale={locale} mode={mode}/></Suspense>;
}
