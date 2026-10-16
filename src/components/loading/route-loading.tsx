'use client';
import {useParams} from 'next/navigation';
import {PageSkeleton,ChartSkeleton} from './skeletons';
function useLoadingLocale(){const params=useParams<{locale?:string}>();return params?.locale==='en'?'en':'vi';}
export function RouteLoading({variant,register=false}:{variant:'home'|'php'|'auth'|'admin';register?:boolean}){return <PageSkeleton locale={useLoadingLocale()} variant={variant} register={register}/>;}
export function ChartLoading({className}:{className?:string}){return <ChartSkeleton locale={useLoadingLocale()} className={className}/>;}
