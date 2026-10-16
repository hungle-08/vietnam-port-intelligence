import {Suspense} from 'react';
import {PageSkeleton} from '@/components/loading/skeletons';
import Link from 'next/link';
import {Anchor,ArrowLeft,Settings,Ship,ShieldCheck} from 'lucide-react';
import {requireAdmin} from '@/lib/auth/admin';
import {logout} from '@/lib/auth/actions';
import {ThemeToggle} from '@/components/theme/theme-toggle';
import {Button} from '@/components/ui/button';
import {getPhpJob} from '@/lib/php/jobs';
import {getPhpDataSummary} from '@/lib/php/repository';
import {PhpDataConfig} from '@/components/admin/php-data-config';
export const metadata={title:'Quản trị | Vietnam Port Intelligence',robots:{index:false,follow:false}};
async function AdminContent(){
 const user=await requireAdmin();
 const [phpJob,summary]=await Promise.all([getPhpJob(),getPhpDataSummary()]);
 const sections=[{icon:Ship,title:'Danh mục cảng',description:'Quản lý thông tin cảng, khu vực và đơn vị khai thác.'},{icon:Settings,title:'Cấu hình website',description:'Quản lý các thiết lập chung của Vietnam Port Intelligence.'}];
 return <div className="port-site admin-site"><header className="site-header"><Link href="/vi" className="brand"><span className="brand-mark"><Anchor size={22}/></span><span>VIETNAM PORT<span className="brand-sub">INTELLIGENCE</span></span></Link><nav aria-label="Tài khoản quản trị"><ThemeToggle locale="vi"/><span className="account-name">{user.name}</span><form action={logout.bind(null,'vi')}><Button type="submit" variant="ghost">Đăng xuất</Button></form></nav></header>
 <main className="admin-main"><Link href="/vi" className="admin-back"><ArrowLeft size={15}/>Về trang chủ</Link><div className="admin-heading"><div><p className="eyebrow">ADMIN WORKSPACE</p><h1>Quản trị hệ thống</h1><p>Không gian quản lý dữ liệu và cấu hình website.</p></div><span className="admin-badge"><ShieldCheck size={16}/>Admin</span></div>
 <PhpDataConfig key={`php-${phpJob.config.revision}`} config={phpJob.config} lastRunAt={phpJob.lastRunAt} summary={summary}/>
 <section className="admin-grid" aria-label="Các mục cấu hình">{sections.map(({icon:Icon,title,description})=><article className="admin-config-card" key={title}><Icon size={24}/><h2>{title}</h2><p>{description}</p><span>Sắp có</span></article>)}</section><p className="admin-account">Đang đăng nhập: {user.email}</p></main></div>;
}
export default function AdminPage(){return <Suspense fallback={<PageSkeleton locale="vi" variant="admin"/>}><AdminContent/></Suspense>;}
