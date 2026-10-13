import {AuthPage} from '@/components/auth/auth-page';
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){const {locale}=await params;return {title:`${locale==='en'?'Log in':'Đăng nhập'} | Vietnam Port Intelligence`,robots:{index:false,follow:false}};}
export default function LoginPage({params}:{params:Promise<{locale:string}>}){return <AuthPage params={params} mode="login"/>;}
