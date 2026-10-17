'use client';
import {useState} from 'react';
import Image from 'next/image';
import {ImageOff} from 'lucide-react';
import {Skeleton} from '@/components/ui/skeleton';
import type {Locale} from '@/lib/i18n';
export function TerminalPhoto({src,name,locale}:{src:string;name:string;locale:Locale}){
 const [loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false);
 return <div className="terminal-photo">{failed?<div className="terminal-photo-error"><ImageOff size={28}/><span>{locale==='vi'?'Chưa tải được ảnh từ nguồn':'Source photo unavailable'}</span></div>:<>{!loaded&&<Skeleton className="terminal-photo-skeleton"/>}<Image src={src} alt={`${locale==='vi'?'Hình ảnh':'Photo of'} ${name}`} width={1200} height={750} unoptimized loading="lazy" onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)} style={{opacity:loaded?1:0}}/></>}</div>;
}
