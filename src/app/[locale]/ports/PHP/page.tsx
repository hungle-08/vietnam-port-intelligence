import {Suspense} from 'react';
import {notFound} from 'next/navigation';
import {connection} from 'next/server';
import {isLocale,type Locale} from '@/lib/i18n';
import {vietnamDay} from '@/lib/php/config';
import {resolveReportYear,aggregatePhpMonths,aggregatePhpContributions} from '@/lib/php/monthly';
import {getPhpDailyMetrics,getPhpReportMetadata,getPhpTerminalDailyMetrics} from '@/lib/php/repository';
import {phpMessages} from '@/lib/php/messages';
import {PhpReport} from '@/components/ports/php-report';
import type {Metadata} from 'next';
type Props={params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {locale}=await params;if(!isLocale(locale))return {};return {title:`PHP · ${phpMessages(locale).title} | Vietnam Port Intelligence`,description:phpMessages(locale).intro,alternates:{languages:{vi:'/vi/ports/PHP',en:'/en/ports/PHP'}}};}
async function ReportContent({locale,searchParams}:{locale:Locale;searchParams:Props['searchParams']}){
 await connection();const now=new Date(),asOf=vietnamDay(now),year=resolveReportYear((await searchParams).year,now),currentYear=Number(asOf.slice(0,4));
 let report=aggregatePhpMonths([],year,asOf),contributions=aggregatePhpContributions([],[],year,asOf),metadata:Awaited<ReturnType<typeof getPhpReportMetadata>>={sites:[],lastDay:null,updatedAt:null},loadError=false;
 try{const [days,details,terminalDays]=await Promise.all([getPhpDailyMetrics(`${year}-01-01`,`${year}-12-31`,'system'),getPhpReportMetadata(year,asOf),getPhpTerminalDailyMetrics(`${year}-01-01`,`${year}-12-31`)]);report=aggregatePhpMonths(days,year,asOf);contributions=aggregatePhpContributions(days,terminalDays,year,asOf);metadata=details;}catch{loadError=true;}
 return <PhpReport locale={locale} year={year} currentYear={currentYear} report={report} contributions={contributions} metadata={metadata} loadError={loadError}/>;
}
export default async function Page({params,searchParams}:Props){const {locale}=await params;if(!isLocale(locale))notFound();return <Suspense fallback={<div className="auth-loading" role="status">{phpMessages(locale).loading}</div>}><ReportContent locale={locale} searchParams={searchParams}/></Suspense>;}
