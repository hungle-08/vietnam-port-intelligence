import {Geist} from 'next/font/google';
import {THEME_BOOTSTRAP} from '@/lib/theme';
import '../globals.css';
const sans=Geist({variable:'--font-geist-sans',subsets:['latin','vietnamese']});
export default function EntryLayout({children}:{children:React.ReactNode}) {return <html lang="vi" className={`${sans.variable} antialiased dark`} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:THEME_BOOTSTRAP}}/></head><body>{children}</body></html>;}
