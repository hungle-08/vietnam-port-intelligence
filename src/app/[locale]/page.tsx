import {getCurrentUser} from '@/lib/auth/session';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getMessages, isLocale, type Locale } from '@/lib/i18n';
import { getPortDirectory } from '@/lib/ports/repository';
import {getShippingRanking} from '@/lib/shipping/repository';
import {getSavedShippingRanking} from '@/lib/shipping/saved';
import {getTradeDataset} from '@/lib/trade/repository';
import {vietnamDay} from '@/lib/php/config';
import { PortHome } from '@/components/home/port-home';
import type { Metadata } from 'next';
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata> {
 const {locale}=await params;if(!isLocale(locale)) return {};
 return {title:'Vietnam Port Intelligence',description:getMessages(locale).intro,alternates:{languages:{vi:'/vi',en:'/en'}}};
}
async function DirectoryHome({locale,searchParams}:{locale:Locale;searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 let ports: Awaited<ReturnType<typeof getPortDirectory>>=[];let loadError=false;
 const [portResult,shippingResult,userResult,tradeResult]=await Promise.allSettled([getPortDirectory(),getShippingRanking(),getCurrentUser(),getTradeDataset()]);
 if(portResult.status==='fulfilled')ports=portResult.value;else loadError=true;
 const shippingRanking=shippingResult.status==='fulfilled'?shippingResult.value:getSavedShippingRanking();
 const query=await searchParams;
 const region=typeof query.region==='string'&&['all','north','central','south'].includes(query.region)?query.region:'all';
 return <PortHome user={userResult.status==='fulfilled'?userResult.value:null} locale={locale} ports={ports} loadError={loadError} shippingRanking={shippingRanking} tradeDataset={tradeResult.status==='fulfilled'?tradeResult.value:undefined} tradeLoadError={tradeResult.status==='rejected'} currentDay={vietnamDay()} initialQuery={typeof query.q==='string'?query.q:''} initialRegion={region} initialSelected={typeof query.port==='string'?query.port:null}/>;
}
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 const {locale}=await params;if(!isLocale(locale)) notFound();
 return <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">{getMessages(locale).loading}</div>}><DirectoryHome locale={locale} searchParams={searchParams}/></Suspense>;
}
