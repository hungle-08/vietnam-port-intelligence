'use client';
import {SiteBrand} from '@/components/layout/site-brand';
import Link from 'next/link';
import {Menu,ArrowUpRight} from 'lucide-react';
import {ThemeToggle} from '@/components/theme/theme-toggle';
import {logout} from '@/lib/auth/actions';
import type {AccountUser} from '@/lib/auth/types';
import type {Locale} from '@/lib/i18n';
export function HomeHeader({locale,user,context}:{locale:Locale;user:AccountUser|null;context:string}) {
 const vi=locale==='vi';
 const links=[{href:'#directory',label:vi?'Hệ thống cảng':'Port network'},{href:'#vietnam-trade',label:vi?'Xuất nhập khẩu':'Vietnam trade'},{href:'#shipping-lines',label:vi?'Hãng tàu':'Shipping lines'}];
 const account=<>{user?<>{user.role==='admin'&&<Link href="/admin" className="home-admin">{vi?'Quản trị':'Admin'}</Link>}<span className="home-user-name" title={user.name}>{user.name}</span><form action={logout.bind(null,locale)}><button type="submit">{vi?'Đăng xuất':'Sign out'}</button></form></>:<><Link href={`/${locale}/login`}>{vi?'Đăng nhập':'Sign in'}</Link><Link className="home-register" href={`/${locale}/register`}>{vi?'Tạo tài khoản':'Create account'}<ArrowUpRight size={13}/></Link></>}</>;
 return <header className="home-header"><SiteBrand locale={locale}/><nav className="home-desktop-nav" aria-label={vi?'Điều hướng chính':'Main navigation'}>{links.map(l=><a key={l.href} href={l.href}>{l.label}</a>)}</nav><div className="home-header-tools"><ThemeToggle locale={locale}/><div className="home-language" aria-label={vi?'Ngôn ngữ':'Language'}>{(['vi','en'] as const).map(l=><Link key={l} href={`/${l}${context?'?'+context:''}`} aria-current={l===locale?'page':undefined}>{l.toUpperCase()}</Link>)}</div><div className="home-account">{account}</div><details className="home-mobile-menu"><summary aria-label={vi?'Mở điều hướng':'Open navigation'}><Menu size={19}/></summary><nav aria-label={vi?'Điều hướng mobile':'Mobile navigation'}>{links.map(l=><a key={l.href} href={l.href} onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');}}>{l.label}<ArrowUpRight size={14}/></a>)}<div className="home-mobile-account">{account}</div></nav></details></div></header>;
}
