import {renderToStaticMarkup} from 'react-dom/server';
import {load} from 'cheerio';
import {expect,it} from 'vitest';
import {TerminalDetail} from '../src/components/ports/terminal-detail';
import {TerminalDwtChart} from '../src/components/ports/terminal-dwt-chart';
import {terminalProfiles} from '../src/lib/php/terminal-profiles';
import {buildTerminalHistory} from '../src/lib/php/terminal-history';
it('distinguishes a branch from an operating company’s ownership and cites the dated evidence',()=>{
 const tv=terminalProfiles.find(p=>p.id==='php-tan-vu')!,cv=terminalProfiles.find(p=>p.id==='php-chua-ve')!;
 const a=load(renderToStaticMarkup(<TerminalDetail profile={tv} locale="vi" months={[]}/>));
 expect(a('.terminal-ownership').text()).toContain('không có vốn cổ phần');expect(a('.terminal-owner').text()).not.toContain('100%');expect(a('figure img').attr('alt')).toContain('Tân Vũ');
 const b=load(renderToStaticMarkup(<TerminalDetail profile={cv} locale="vi" months={[]}/>));expect(b('.terminal-ownership').text()).toContain('100%');expect(b('.terminal-ownership').text()).toContain('31/12/2025');expect(b('.terminal-ownership a').attr('href')).toContain('haiphongport.com.vn');
});
it('keeps HTIT economic interest separate from voting rights and shows DVP’s verified major shareholders',()=>{
 const htit=terminalProfiles.find(p=>p.id==='php-htit')!,dvp=terminalProfiles.find(p=>p.id==='dvp-dinh-vu')!;
 const a=load(renderToStaticMarkup(<TerminalDetail profile={htit} locale="en" months={[]}/>));expect(a('.terminal-ownership').text()).toContain('51% economic interest and 50% voting rights');
 const b=load(renderToStaticMarkup(<TerminalDetail profile={dvp} locale="en" months={[]}/>));expect(b('.terminal-owner').text()).toContain('Other shareholders (combined)');expect(b('.terminal-owner').text()).toContain('18.7%');expect(b('.terminal-owner').text()).toContain('America LLC');expect(b('.terminal-owner').text()).toContain('21.767%');
});
it('shows a covered zero honestly and distinguishes it from missing history, with full-calendar coverage for the current month',()=>{
 const months=buildTerminalHistory([{period:'2026-10',days:16}],[],'2026-10-16')['php-tan-vu'];
 const a=load(renderToStaticMarkup(<TerminalDwtChart locale="vi" name="Tân Vũ" color="#268bd2" months={months}/>));expect(a('.terminal-dwt-summary strong').first().text()).toBe('0');expect(a('.terminal-dwt-notice').text()).toContain('16/31');
 const b=load(renderToStaticMarkup(<TerminalDwtChart locale="en" name="Tan Vu" color="#268bd2" months={[]}/>));expect(b('.terminal-dwt-empty').text()).toContain('No vessel-plan data');expect(b('.terminal-dwt-summary')).toHaveLength(0);
});
it('labels shared operator capacity instead of attributing it to both individual sites',()=>{
 for(const id of ['php-hoang-dieu','php-chua-ve']){
  const p=terminalProfiles.find(p=>p.id===id)!;
  const $=load(renderToStaticMarkup(<TerminalDetail profile={p} locale="vi" months={[]}/>));
  expect($('.terminal-facts').text()).toContain('Chung Hoàng Diệu – Chùa Vẽ');
  expect($('.terminal-facts').text()).toContain('12 triệu');
  expect($('.terminal-output')).toHaveLength(0);
 }
});
it('preserves capacity qualifications without rendering results or tracking commentary',()=>{
 const render=(id:string)=>load(renderToStaticMarkup(<TerminalDetail profile={terminalProfiles.find(p=>p.id===id)!} locale="en" months={[]}/>));
 const tv=render('php-tan-vu');expect(tv('.terminal-facts').text()).toContain('partially loaded');
 const ht=render('php-htit');expect(ht('.terminal-output')).toHaveLength(0);
 expect(ht('.terminal-facts').text()).toContain('Sources differ');
 expect(ht('.terminal-facts a').length).toBeGreaterThan(0);
 expect(ht('.terminal-insights')).toHaveLength(0);
});
it('groups repeated sources while retaining a direct evidence link for every specification',()=>{
 const p=terminalProfiles.find(p=>p.id==='php-tan-vu')!;
 const $=load(renderToStaticMarkup(<TerminalDetail profile={p} locale="en" months={[]}/>));
 const links=$('.terminal-evidence li a').map((_,e)=>$(e).attr('href')).get();
 expect(links.length).toBeGreaterThan(0);expect(new Set(links).size).toBe(links.length);
 $('.terminal-fact a').each((_,e)=>expect(links).toContain($(e).attr('href')));
 expect($('.terminal-evidence').text()).toContain('No effective date stated');
 expect($('.terminal-evidence').text()).toContain('2021');
});
