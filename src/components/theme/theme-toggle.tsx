'use client';
import {useSyncExternalStore} from 'react';
import {Moon,Sun} from 'lucide-react';
import {readSavedTheme,saveTheme,THEME_STORAGE_KEY,type Theme} from '@/lib/theme';
import type {Locale} from '@/lib/i18n';
const eventName='vpi-theme-change';
function subscribe(onChange:()=>void){
 const onStorage=(event:StorageEvent)=>{
  if(event.key!==THEME_STORAGE_KEY&&event.key!==null)return;
  let theme:Theme='dark';try{theme=readSavedTheme(window.localStorage);}catch{}
  document.documentElement.classList.toggle('dark',theme==='dark');onChange();
 };
 window.addEventListener(eventName,onChange);window.addEventListener('storage',onStorage);
 return ()=>{window.removeEventListener(eventName,onChange);window.removeEventListener('storage',onStorage);};
}
function snapshot():Theme{return document.documentElement.classList.contains('dark')?'dark':'light';}
function serverSnapshot():Theme{return 'dark';}
export function ThemeToggle({locale}:{locale:Locale}){
 const theme=useSyncExternalStore(subscribe,snapshot,serverSnapshot),dark=theme==='dark';
 const label=locale==='vi'?(dark?'Chuyển sang chế độ sáng':'Chuyển sang chế độ tối'):(dark?'Switch to light mode':'Switch to dark mode');
 function toggle(){
  const next:Theme=dark?'light':'dark';
  document.documentElement.classList.toggle('dark',next==='dark');
  try{saveTheme(next,window.localStorage);}catch{}
  window.dispatchEvent(new Event(eventName));
 }
 return <button type="button" className="theme-toggle" onClick={toggle} aria-label={label} title={label} aria-pressed={dark}>{dark?<Sun size={16}/>:<Moon size={16}/>}<span>{locale==='vi'?(dark?'Tối':'Sáng'):(dark?'Dark':'Light')}</span></button>;
}
