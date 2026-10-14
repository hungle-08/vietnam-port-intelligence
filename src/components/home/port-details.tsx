'use client';
import Link from 'next/link';
import { ExternalLink, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMessages, portName, type Locale } from '@/lib/i18n';
import type { PortRecord } from '@/lib/ports/types';
export function PortDetails({port,locale,onClose}:{port:PortRecord;locale:Locale;onClose:()=>void}) {
 const t=getMessages(locale);
 const links=[[locale==='vi'?'Website doanh nghiệp':'Operator website',port.website],[t.sourceDirectory,port.sources.directory],[t.codesSource,port.sources.codes],[t.coordinatesSource,port.sources.coordinates],[t.operationSource,port.sources.operation]].filter(([,url])=>url);
 return <div className="port-details" role="region" aria-label={t.selected}>
  <div className="flex items-start justify-between gap-3"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.18em] text-accent-foreground">{t.selected}</p><h3 className="text-base font-semibold leading-snug text-foreground">{portName(port,locale)}</h3></div><Button variant="ghost" size="icon-sm" aria-label={t.close} onClick={onClose}><X/></Button></div>
  <p className="my-3 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5 shrink-0"/>{port.address||port.sourceLocation}</p>
  <div className="space-y-1.5 text-xs"><p><span className="text-muted-foreground">{t.code}: </span><span className="font-mono">{port.stockTicker||port.internalCode}</span> · {port.exchange}</p>{port.officialCodes.map(c=><p key={`${c.type}-${c.value}`}><span className="text-muted-foreground">{c.type} ({c.scope==='location'?t.locationScope:t.terminalScope}): </span><span className="font-mono">{c.value}</span></p>)}</div>
  <div className="mt-3 space-y-1 border-t pt-3 text-[11px] text-muted-foreground"><p>{t[port.operationalStatus]}</p><p>{port.coordinateAccuracy==='verified'?t.verifiedPosition:port.coordinateAccuracy==='approximate'?t.approximate:t.unknownPosition}</p></div>
  {port.stockTicker==='PHP'&&<Link href={`/${locale}/ports/PHP`} className="port-report-link">{locale==='vi'?'Xem chi tiết PHP':'View PHP details'}<ExternalLink className="size-3"/></Link>}
  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2">{links.map(([label,url])=><a className="inline-flex items-center gap-1 text-[10px] text-accent-foreground underline underline-offset-2" href={url!} key={label} target="_blank" rel="noreferrer">{label}<ExternalLink className="size-2.5"/></a>)}</div>
 </div>;
}
