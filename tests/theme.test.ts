import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
it('shared theme variables resolve without cyclic references',()=>{
 const css=readFileSync('src/app/globals.css','utf8');
 const definitions=new Map([...css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)].map(match=>[match[1],[...match[2].matchAll(/var\((--[\w-]+)/g)].map(reference=>reference[1])]));
 function resolve(name:string,path:string[]=[]){
  if(path.includes(name))throw new Error(`Cyclic theme variable: ${[...path,name].join(' → ')}`);
  for(const dependency of definitions.get(name)??[])resolve(dependency,[...path,name]);
 }
 expect(()=>{for(const name of definitions.keys())resolve(name);}).not.toThrow();
});

import {runInNewContext} from 'node:vm';
import {THEME_BOOTSTRAP,readSavedTheme,saveTheme} from '../src/lib/theme';
it('defaults to light even when storage is missing, invalid or blocked',()=>{
 expect(readSavedTheme({getItem:()=>null})).toBe('light');
 expect(readSavedTheme({getItem:()=> 'system'})).toBe('light');
 expect(readSavedTheme({getItem:()=>{throw Error('blocked');}})).toBe('light');
 expect(readSavedTheme({getItem:()=> 'dark'})).toBe('dark');
});
it('persists explicit choices and remains usable with blocked storage',()=>{
 let saved='';saveTheme('dark',{setItem:(_key,value)=>{saved=value;}});expect(saved).toBe('dark');
 expect(()=>saveTheme('light',{setItem:()=>{throw Error('blocked');}})).not.toThrow();
});
it('applies a saved theme before rendering with light as the first-visit default',()=>{
 for(const preference of [null,'light','dark','invalid']){
  let dark=true;
  runInNewContext(THEME_BOOTSTRAP,{localStorage:{getItem:()=>preference},document:{documentElement:{classList:{toggle:(_name:string,enabled:boolean)=>{dark=enabled;}}}}});
  expect(dark).toBe(preference==='dark');
 }
});
