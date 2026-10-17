import {SiteBrand} from '@/components/layout/site-brand';
import Link from 'next/link';
import {Anchor,ArrowLeft,ArrowUpRight,Building2,CalendarDays,Ship,MapPin,Info} from 'lucide-react';
import {ThemeToggle} from '@/components/theme/theme-toggle';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow,TableFooter} from '@/components/ui/table';
import {LachHuyenChart} from './lach-huyen-chart';
import {TerminalDetail} from './terminal-detail';
import {terminalProfiles} from '@/lib/php/terminal-profiles';
import type {TerminalHistory} from '@/lib/php/terminal-history';
import type {RegionalMonth} from '@/lib/php/lach-huyen';
import {PhpContributionChart} from './php-contribution-chart';
import {PhpDetailTabs,PhpOverviewTabs} from './php-detail-tabs';
import {ReportYearSelect} from './report-year-select';
import {phpMessages} from '@/lib/php/messages';
import type {Locale} from '@/lib/i18n';
import type {aggregatePhpMonths,ContributionMonth} from '@/lib/php/monthly';
import type {getPhpReportMetadata} from '@/lib/php/repository';
import {PHP_SOURCE} from '@/lib/php/config';
import '@/components/home/home-overview.css';
import './php-report.css';
type Report=ReturnType<typeof aggregatePhpMonths>;
type ReportMetadata=Awaited<ReturnType<typeof getPhpReportMetadata>>;
export function PhpReport({locale,year,currentYear,report,contributions,metadata,terminalHistory={},terminalLoadError=false,lachHuyenMonths=[],lachHuyenError=false,loadError=false}:{locale:Locale;year:number;currentYear:number;report:Report;contributions:ContributionMonth[];metadata:ReportMetadata;terminalHistory?:TerminalHistory;terminalLoadError?:boolean;lachHuyenMonths?:RegionalMonth[];lachHuyenError?:boolean;loadError?:boolean}){
 const t=phpMessages(locale),number=(value:number|null)=>value===null?'—':new Intl.NumberFormat(locale==='vi'?'vi-VN':'en-US',{maximumFractionDigits:3}).format(value);
 const formatDate=(value:string)=>new Intl.DateTimeFormat(locale==='vi'?'vi-VN':'en-GB',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(value));
 return <div className="port-site php-report-site"><header className="home-header"><SiteBrand locale={locale}/><nav className="php-header-tools" aria-label={t.title}><Link className="php-header-directory" href={`/${locale}#directory`}>{locale==='vi'?'Hệ thống cảng':'Port network'}</Link><ThemeToggle locale={locale}/><div className="home-language" aria-label={locale==='vi'?'Chọn ngôn ngữ':'Language'}>{(['vi','en'] as const).map(l=><Link key={l} href={`/${l}/ports/PHP?year=${year}`} aria-current={l===locale?'page':undefined}>{l.toUpperCase()}</Link>)}</div></nav></header>
 <main className="php-report-main"><Link className="admin-back" href={`/${locale}#directory`}><ArrowLeft size={15}/>{t.back}</Link>
 <div className="php-report-heading"><div className="php-company"><span className="php-company-mark">PHP</span><div><p className="eyebrow">PHP <span className="php-exchange">UPCOM</span></p><h1>{t.title}</h1><p>{t.intro}</p></div></div><span className="php-report-location"><MapPin size={14}/>{locale==='vi'?'Hải Phòng · Miền Bắc':'Hai Phong · Northern Vietnam'}</span></div>
 <PhpDetailTabs locale={locale} terminalContent={Object.fromEntries(terminalProfiles.map(profile=>[profile.id,<TerminalDetail key={profile.id} profile={profile} locale={locale} months={terminalHistory[profile.id]??[]} loadError={terminalLoadError}>{profile.id==='php-htit'&&<LachHuyenChart locale={locale} months={lachHuyenMonths} loadError={lachHuyenError}/>}</TerminalDetail>]))}>
 <section className="php-company-overview" aria-labelledby="php-company-overview-title"><div><h2 id="php-company-overview-title">{locale==='vi'?'Về hệ thống PHP':'About the PHP network'}</h2><p>{locale==='vi'?'Theo dõi Tân Vũ, Hoàng Diệu, Chùa Vẽ, HTIT và Đình Vũ tại Hải Phòng.':'Tracking Tan Vu, Hoang Dieu, Chua Ve, HTIT and Dinh Vu in Hai Phong.'}</p><details className="php-scope-details"><summary>{locale==='vi'?'Phạm vi báo cáo':'Reporting scope'}</summary><p>{locale==='vi'?'Gồm cảng trực thuộc và đơn vị có quan hệ vốn với PHP. Tổng hợp toàn bộ DWT và lượt tàu vào theo kế hoạch của năm cảng, không nhân tỷ lệ sở hữu. HTIT khai thác bến 3–4 Lạch Huyện.':'Includes PHP-operated ports and equity-linked companies. Planned inbound DWT and arrival counts cover all five terminals without ownership weighting. HTIT operates Lach Huyen berths 3–4.'}</p></details></div><div className="php-company-facts"><span><Building2 size={15}/>{locale==='vi'?'5 cảng trong phạm vi theo dõi':'5 terminals in reporting scope'}</span><span><Anchor size={15}/>{locale==='vi'?'HTIT · Bến Lạch Huyện 3–4':'HTIT · Lach Huyen berths 3–4'}</span></div></section>
 <PhpOverviewTabs locale={locale}><>{loadError?<section className="php-report-error" role="alert"><p>{t.error}</p><Link href={`/${locale}/ports/PHP?year=${year}`}>{t.retry}<ArrowUpRight size={15}/></Link></section>:<>
 <div className="php-overview-toolbar"><div><h2>{locale==='vi'?'Báo cáo hoạt động':'Activity report'}</h2><p>{locale==='vi'?'DWT và lượt tàu vào theo kế hoạch · Toàn hệ thống PHP':'Planned inbound vessel DWT and arrivals · PHP network'}</p></div><ReportYearSelect key={year} year={year} currentYear={currentYear} locale={locale}/></div>
 <div className="php-report-summary"><div><Ship size={18}/><span>{t.yearTotal} · {year}</span><strong>{number(report.totalDwt)} <small>DWT</small></strong></div><div><Anchor size={18}/><span>{t.yearCalls}</span><strong>{number(report.totalCalls)}</strong></div><div><CalendarDays size={18}/><span>{t.through}</span><strong className="php-summary-date">{metadata.lastDay?formatDate(metadata.lastDay):t.noUpdate}</strong></div></div>
 <div className="php-metric-definition"><Info size={15}/><p>{t.definition}</p></div>
 <section className="php-monthly" aria-labelledby="php-monthly-title"><div className="php-monthly-heading"><div><p className="eyebrow">{locale==='vi'?'DỮ LIỆU THEO THÁNG':'MONTHLY DATA'}</p><h2 id="php-monthly-title">{t.monthlyTitle}</h2><p>{t.monthlyIntro}</p></div><span className="php-section-year">{year}</span></div>

 {!report.hasData&&<div className="php-no-data" role="status"><CalendarDays size={22}/><div><strong>{t.empty} {year}</strong><p>{locale==='vi'?'Chọn năm khác để xem dữ liệu đã được ghi nhận.':'Choose another year to view recorded data.'}</p></div></div>}
 <PhpContributionChart key={year} locale={locale} year={year} months={contributions}/>
 <div className="php-table-heading"><h3>{locale==='vi'?'Bảng tổng hợp theo tháng':'Monthly totals'}</h3><span>{year} · 12 {locale==='vi'?'tháng':'months'}</span></div>
 <p className="php-table-hint">{locale==='vi'?'Vuốt ngang để xem đầy đủ các cột →':'Swipe to view all columns →'}</p>
 <div className="php-monthly-table"><Table aria-label={`${t.monthlyTitle} ${year}`}><TableHeader><TableRow><TableHead>{t.month}</TableHead><TableHead className="text-right">{t.dwt}</TableHead><TableHead className="text-right">{t.calls}</TableHead><TableHead className="text-right">{t.coverage}</TableHead><TableHead>{t.state}</TableHead></TableRow></TableHeader><TableBody>{report.months.map(month=><TableRow key={month.month} className={month.status==='future'?'php-future-row':month.status==='collecting'?'php-current-row':''}><TableCell className="font-medium">{locale==='vi'?`Tháng ${String(month.month).padStart(2,'0')}`:new Intl.DateTimeFormat('en',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(year,month.month-1,1)))}</TableCell><TableCell className="text-right font-mono tabular-nums">{number(month.dwt)}{month.missingDwt>0&&<span className="php-missing-dwt" title={`${month.missingDwt} ${t.missing}`}>*</span>}</TableCell><TableCell className="text-right tabular-nums">{number(month.calls)}</TableCell><TableCell className="text-right tabular-nums text-muted-foreground">{month.status==='future'?'—':`${month.daysAvailable}/${month.daysExpected}`}</TableCell><TableCell><span className="php-month-status" data-status={month.status}>{month.status==='collecting'&&<span className="php-status-dot"/>}{t.status[month.status]}</span></TableCell></TableRow>)}</TableBody><TableFooter><TableRow><TableCell>{t.total}</TableCell><TableCell className="text-right font-mono tabular-nums">{number(report.totalDwt)}</TableCell><TableCell className="text-right tabular-nums">{number(report.totalCalls)}</TableCell><TableCell colSpan={2}/></TableRow></TableFooter></Table></div>
 {report.missingDwt>0&&<p className="php-report-note">* {report.missingDwt} {t.missing}</p>}
 <div className="php-data-provenance"><a href={PHP_SOURCE} target="_blank" rel="noreferrer">{t.source}<ArrowUpRight size={13}/></a>{metadata.updatedAt&&<span>{t.updated}: {formatDate(metadata.updatedAt)}</span>}</div>
 </section></>}</></PhpOverviewTabs>
 </PhpDetailTabs>
 </main><footer className="site-footer"><span>Vietnam Port Intelligence</span><p>{locale==='vi'?'Theo dõi dữ liệu cảng Việt Nam.':'Track Vietnam’s port data.'}</p><span>© {currentYear}</span></footer></div>;
}
