import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect,vi} from 'vitest';
vi.mock('../src/lib/auth/actions',()=>({logout:async()=>{}}));
import {HomeHeader} from '../src/components/home/home-header';
it('links the main navigation to the three available home sections and preserves language context',()=>{
 const html=renderToStaticMarkup(createElement(HomeHeader,{locale:'vi',user:null,context:'q=PHP'}));
 for(const href of ['#directory','#vietnam-trade','#shipping-lines','/vi/login','/vi/register','/en?q=PHP'])expect(html).toContain(`href="${href}"`);
 expect(html).toContain('Hệ thống cảng');expect(html).toContain('Tạo tài khoản');expect(html).not.toContain('href="/admin"');
});
it('shows admin access only to an admin and translates the header',()=>{
 const user={id:'id',name:'Admin',email:'admin@example.test',role:'admin' as const};
 const html=renderToStaticMarkup(createElement(HomeHeader,{locale:'en',user,context:''}));
 expect(html).toContain('href="/admin"');expect(html).toContain('Port network');expect(html).toContain('Sign out');expect(html).not.toContain('/en/register');
 const member=renderToStaticMarkup(createElement(HomeHeader,{locale:'en',user:{...user,role:'user'},context:''}));expect(member).not.toContain('href="/admin"');
});
