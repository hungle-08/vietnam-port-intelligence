'use client';
import {useActionState,useState,type FormEvent} from 'react';
import {validateCredentials} from '@/lib/auth/validation';
import Link from 'next/link';
import {ThemeToggle} from '@/components/theme/theme-toggle';
import {Anchor,ArrowLeft,Eye,EyeOff,LoaderCircle} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {submitAuth} from '@/lib/auth/actions';
import {authMessages} from '@/lib/auth/messages';
import type {AuthState} from '@/lib/auth/types';
import type {Locale} from '@/lib/i18n';
export function AuthForm({locale,mode}:{locale:Locale;mode:'login'|'register'}){
 const t=authMessages(locale),register=mode==='register';
 const [state,action,pending]=useActionState(submitAuth.bind(null,locale,mode),{} as AuthState);
 const [visible,setVisible]=useState(false);
 const [clientFields,setClientFields]=useState<AuthState['fields']>({});
 const fields={...state.fields,...clientFields};
 function validateForm(event:FormEvent<HTMLFormElement>){
  const data=new FormData(event.currentTarget);
  const {errors}=validateCredentials({name:data.get('name'),email:data.get('email'),password:data.get('password')},register);
  if(Object.keys(errors).length){
   event.preventDefault();setClientFields({
    ...(errors.name?{name:t.nameError}:{}),...(errors.email?{email:t.emailError}:{}),
    ...(errors.password?{password:register?t.passwordError:t.loginPasswordError}:{})
   });
  }else setClientFields({});
 }

 return <div className="auth-page">
  <header className="auth-header"><Link href={`/${locale}`} className="brand"><span className="brand-mark"><Anchor size={22}/></span><span>VIETNAM PORT<span className="brand-sub">INTELLIGENCE</span></span></Link><div className="auth-header-controls"><ThemeToggle locale={locale}/><div className="locale-switch" aria-label={t.language}>{(['vi','en'] as const).map(l=><Link key={l} href={`/${l}/${mode}`} aria-current={locale===l?'page':undefined}>{l.toUpperCase()}</Link>)}</div></div></header>
  <main className="auth-main"><section className="auth-card" aria-labelledby="auth-title">
   <div className="auth-emblem"><Anchor size={28}/></div><p className="eyebrow">VIETNAM PORT INTELLIGENCE</p><h1 id="auth-title">{register?t.registerTitle:t.loginTitle}</h1><p className="auth-intro">{t.intro}</p>
   <div className="auth-tabs"><Link href={`/${locale}/login`} aria-current={!register?'page':undefined}>{t.login}</Link><Link href={`/${locale}/register`} aria-current={register?'page':undefined}>{t.register}</Link></div>
   <form action={action} onSubmit={validateForm} onChange={()=>setClientFields({})} className="auth-form">
    {state.error&&<p className="auth-error" role="alert">{t[state.error]}</p>}
    {register&&<div className="auth-field"><label htmlFor="name">{t.name}</label><input id="name" name="name" autoComplete="name" required defaultValue={state.values?.name} aria-invalid={!!fields?.name} aria-describedby={fields?.name?'name-error':undefined} placeholder={locale==='vi'?'Tên của bạn':'Your name'}/>{fields?.name&&<p id="name-error" className="auth-field-error">{fields.name}</p>}</div>}
    <div className="auth-field"><label htmlFor="email">{t.email}</label><input id="email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254} defaultValue={state.values?.email} aria-invalid={!!fields?.email} aria-describedby={fields?.email?'email-error':undefined} placeholder="you@example.com"/>{fields?.email&&<p id="email-error" className="auth-field-error">{fields.email}</p>}</div>
    <div className="auth-field"><label htmlFor="password">{t.password}</label><div className="auth-password"><input id="password" name="password" type={visible?'text':'password'} autoComplete={register?'new-password':'current-password'} required aria-invalid={!!fields?.password} aria-describedby={fields?.password?'password-error':register?'password-hint':undefined}/><button type="button" onClick={()=>setVisible(!visible)} aria-label={visible?t.hide:t.show} aria-pressed={visible}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{fields?.password?<p id="password-error" className="auth-field-error">{fields.password}</p>:register&&<p id="password-hint" className="auth-hint">{t.passwordHint}</p>}</div>
    <Button type="submit" className="auth-submit" disabled={pending}>{pending?<><LoaderCircle size={17} className="auth-spinner"/>{t.pending}</>:register?t.register:t.login}</Button>
   </form>
   <p className="auth-switch">{register?t.hasAccount:t.noAccount} <Link href={`/${locale}/${register?'login':'register'}`}>{register?t.login:t.register}</Link></p>
   <p className="auth-optional">{t.optional}</p><Link className="auth-back" href={`/${locale}`}><ArrowLeft size={15}/>{t.back}</Link>
  </section></main>
 </div>;
}
