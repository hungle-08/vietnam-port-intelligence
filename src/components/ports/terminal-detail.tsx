import type {ReactNode} from 'react';
import {ArrowUpRight,Building2,MapPin,Info} from 'lucide-react';
import type {Locale} from '@/lib/i18n';
import type {TerminalProfile} from '@/lib/php/terminal-profiles';
import type {TerminalMonth} from '@/lib/php/terminal-history';
import {terminalFacts} from '@/lib/php/terminal-facts';
import {TerminalFactsPanel} from './terminal-facts';
import {TerminalPhoto} from './terminal-photo';
import {TerminalDwtChart} from './terminal-dwt-chart';
import './terminal-detail.css';
export function TerminalDetail({profile,locale,months,loadError=false,children}:{profile:TerminalProfile;locale:Locale;months:TerminalMonth[];loadError?:boolean;children?:ReactNode}){
 const vi=locale==='vi',name=vi?profile.vi:profile.en;
 const facts=terminalFacts[profile.id];
 const headings={branch:vi?'Đơn vị chủ quản':'Parent organisation',owner:vi?'Chủ sở hữu đơn vị vận hành':'Operator ownership',venture:vi?'Cơ cấu vốn liên doanh':'Joint-venture ownership',shareholders:vi?'Cổ đông chính':'Major shareholders'};
 return <div className="terminal-detail" style={{'--terminal-color':profile.color} as React.CSSProperties}>
  <div className="terminal-profile"><div className="terminal-profile-copy"><p className="eyebrow">{vi?'HỒ SƠ CẢNG':'TERMINAL PROFILE'}</p><h2>{name}{profile.id==='dvp-dinh-vu'&&<span className="terminal-ticker">DVP</span>}</h2>{facts&&<p className="terminal-role">{facts.role[locale]}</p>}<p className="terminal-description">{facts?facts.description[locale]:(vi?profile.description.vi:profile.description.en)}</p><dl><div><dt><MapPin size={15}/>{vi?'Khu vực':'Location'}</dt><dd>{vi?profile.location.vi:profile.location.en}</dd></div><div><dt><Building2 size={15}/>{vi?'Đơn vị vận hành':'Operator'}</dt><dd>{profile.operator}</dd></div></dl><a className="terminal-source" href={profile.source} target="_blank" rel="noreferrer">{vi?'Hồ sơ từ đơn vị khai thác':'Operator profile'}<ArrowUpRight size={13}/></a></div><figure><TerminalPhoto src={profile.photo} name={name} locale={locale}/><figcaption><a href={profile.photoSource} target="_blank" rel="noreferrer">{vi?'Ảnh: đơn vị khai thác':'Photo: terminal operator'}<ArrowUpRight size={11}/></a><span>{vi?'Ảnh tư liệu, không phải ảnh trực tiếp.':'Reference photo, not a live view.'}</span></figcaption></figure></div>
  <TerminalFactsPanel id={profile.id} locale={locale}/>
  <section className="terminal-ownership" aria-label={headings[profile.ownershipKind]}><div className="terminal-ownership-heading"><div><p className="eyebrow">{vi?'SỞ HỮU & VẬN HÀNH':'OWNERSHIP & OPERATIONS'}</p><h3>{headings[profile.ownershipKind]}</h3></div><span>{vi?'Hồ sơ tại':'As of'} {new Intl.DateTimeFormat(vi?'vi-VN':'en-GB',{timeZone:'UTC'}).format(new Date(profile.ownershipAsOf+'T00:00:00Z'))}</span></div><div className="terminal-owner-list">{profile.owners.map((owner,i)=><div className="terminal-owner" key={owner.en}><div><i style={{background:i===0?profile.color:'var(--muted-foreground)'}}/><span>{vi?owner.vi:owner.en}</span><strong>{owner.percent===null?(vi?'Chi nhánh':'Branch'):new Intl.NumberFormat(vi?'vi-VN':'en-US',{maximumFractionDigits:3}).format(owner.percent)+'%'}</strong></div>{owner.percent!==null&&<div className="terminal-owner-track" aria-hidden="true"><span style={{width:`${owner.percent}%`,background:i===0?profile.color:'var(--muted-foreground)'}}/></div>}</div>)}</div><p className="terminal-ownership-note"><Info size={14}/>{vi?profile.note.vi:profile.note.en}</p><a className="terminal-source" href={profile.ownershipSource} target="_blank" rel="noreferrer">{vi?`Nguồn: Báo cáo thường niên ${profile.id==='dvp-dinh-vu'?'DVP':'PHP'} 2025`:`Source: ${profile.id==='dvp-dinh-vu'?'DVP':'PHP'} annual report 2025`}<ArrowUpRight size={12}/></a>{profile.secondaryOwnershipSource&&<a className="terminal-source terminal-source-secondary" href={profile.secondaryOwnershipSource} target="_blank" rel="noreferrer">{vi?'Hồ sơ thành lập liên doanh':'Joint-venture formation report'}<ArrowUpRight size={12}/></a>}</section>
  <TerminalDwtChart locale={locale} name={name} color={profile.color} months={months} loadError={loadError}/>
  {children}
 </div>;
}
