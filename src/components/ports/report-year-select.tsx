'use client';
import {Spinner} from '@/components/ui/spinner';
import {useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {phpMessages} from '@/lib/php/messages';
import type {Locale} from '@/lib/i18n';
export function ReportYearSelect({year,currentYear,locale}:{year:number;currentYear:number;locale:Locale}){
 const t=phpMessages(locale),router=useRouter(),[pending,startTransition]=useTransition();
 const years=Array.from({length:currentYear+2-2000},(_,i)=>currentYear+1-i);if(!years.includes(year))years.push(year);
 const path=`/${locale}/ports/PHP`;
 return <form action={path} method="get" className="report-year-form" onSubmit={e=>{e.preventDefault();const selected=new FormData(e.currentTarget).get('year');startTransition(()=>router.push(`${path}?year=${selected}`));}}>
  <label htmlFor="report-year">{t.year}</label><select id="report-year" name="year" defaultValue={year} disabled={pending} onChange={e=>e.currentTarget.form?.requestSubmit()} aria-label={t.year}>{years.sort((a,b)=>b-a).map(y=><option key={y} value={y}>{y}</option>)}</select>
  <Button type="submit" size="sm" variant="outline" disabled={pending} aria-busy={pending}>{pending?<><Spinner aria-hidden="true" role={undefined} aria-label={undefined}/>{t.loading}</>:t.apply}</Button><span className="sr-only" role="status">{pending?t.loading:''}</span>
 </form>;
}
