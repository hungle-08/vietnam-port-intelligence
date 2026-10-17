import {expect,it} from 'vitest';
import {PHP_SITE_APPEARANCE} from '../src/lib/php/presentation';
import {LACH_HUYEN_PORTS} from '../src/lib/php/lach-huyen';
import {readFileSync} from 'node:fs';
it('uses one HTIT identity across PHP and regional charts, with separate colours for peers',()=>{
 const php=PHP_SITE_APPEARANCE.find(p=>p.id==='php-htit')!,regional=LACH_HUYEN_PORTS.find(p=>p.id==='htit')!;
 expect(php.color).toBe(regional.color);expect(new Set(LACH_HUYEN_PORTS.map(p=>p.color)).size).toBe(3);
});
it('keeps normal-sized port text readable on both white and dark cards',()=>{
 const css=readFileSync('src/app/globals.css','utf8');
 const light=css.slice(css.indexOf(':root {'),css.indexOf('.dark {')),dark=css.slice(css.indexOf('.dark {'));
 const luminance=(hex:string)=>hex.match(/\w\w/g)!.map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
 for(const [section,bg] of [[light,'ffffff'],[dark,'0d1e2d']])for(const port of PHP_SITE_APPEARANCE){
  const variable=port.color.match(/^var\((--[\w-]+)\)$/)?.[1];expect(variable).toBeTruthy();
  const hex=section.match(new RegExp(variable+':\\s*#([a-f0-9]{6})','i'))?.[1];expect(hex).toBeTruthy();
  const a=luminance(hex!),b=luminance(bg);expect((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toBeGreaterThanOrEqual(4.5);
 }
});
it('keeps ocean-blue brand actions and links readable in both themes',()=>{
 const css=readFileSync('src/app/globals.css','utf8');
 const sections=[css.slice(css.indexOf(':root {'),css.indexOf('.dark {')),css.slice(css.indexOf('.dark {'))];
 const luminance=(hex:string)=>hex.match(/\w\w/g)!.map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
 for(const section of sections){
  const value=(name:string)=>section.match(new RegExp('--'+name+':\\s*#([a-f0-9]{6})\\s*;','i'))?.[1]??'';
  const primary=value('primary');expect(primary).toHaveLength(6);
  // The blue channel dominates red and green, avoiding orange and teal accents.
  expect(parseInt(primary.slice(4),16)).toBeGreaterThan(parseInt(primary.slice(0,2),16)*2);
  expect(parseInt(primary.slice(4),16)-parseInt(primary.slice(2,4),16)).toBeGreaterThan(50);
  for(const [a,b] of [['primary','primary-foreground'],['primary-hover','primary-foreground'],['ocean-link','card']]){
   expect(value(a)).toHaveLength(6);expect(value(b)).toHaveLength(6);
   const x=luminance(value(a)),y=luminance(value(b));expect((Math.max(x,y)+.05)/(Math.min(x,y)+.05)).toBeGreaterThanOrEqual(4.5);
  }
 }
});
