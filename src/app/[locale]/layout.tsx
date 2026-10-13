import {THEME_BOOTSTRAP} from '@/lib/theme';
import { Geist, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import '../globals.css';
const sans=Geist({variable:'--font-geist-sans',subsets:['latin','vietnamese']});
const mono=Geist_Mono({variable:'--font-geist-mono',subsets:['latin','vietnamese']});
export function generateStaticParams() {return [{locale:'vi'},{locale:'en'}];}
export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}) {
 const {locale}=await params;if(!isLocale(locale)) notFound();
 return <html lang={locale} className={`${sans.variable} ${mono.variable} antialiased`} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:THEME_BOOTSTRAP}}/></head><body>{children}</body></html>;
}
