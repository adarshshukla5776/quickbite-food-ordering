'use client';
import {FormEvent,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,Eye,EyeOff,LockKeyhole,Mail,UserRound} from 'lucide-react';

type Mode = 'login'|'register';
export default function CustomerAuthForm({mode}:{mode:Mode}){
 const registering=mode==='register';
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError('');
  try {
   const response=await fetch(`/api/auth/${mode}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,password})});
   const data=await response.json();if(!response.ok)throw Error(data.error ?? 'Please try again.');
   window.location.assign('/account');
  }catch(err){setError(err instanceof Error?err.message:'Something went wrong.')}finally{setBusy(false)}
 }
 return <main className="customer-auth-shell">
  <div className="auth-scene"><Link href="/" className="auth-wordmark">quickbite<span>.</span></Link><div className="auth-scene-copy"><span>GOOD FOOD. GOOD COMPANY.</span><h1>Your favourites,<br/><em>on repeat.</em></h1><p>Browse the menu, keep your orders together, and come back for more.</p></div><small>A portfolio demo · No real payments or deliveries</small></div>
  <section className="auth-right"><div className="auth-card"><Link href="/" className="auth-return">← Back to menu</Link><span className="auth-mark"><LockKeyhole size={22}/></span><span className="auth-eyebrow">{registering?'YOUR QUICKBITE ACCOUNT':'WELCOME BACK'}</span><h2>{registering?'Good to have you here.':'Come on in.'}</h2><p>{registering?'Create your account and keep track of your demo orders.':'Sign in to see your QuickBite order history.'}</p>
  <form onSubmit={submit} className="customer-auth-form">
   {registering&&<label><span>Full name</span><span className="auth-input"><UserRound size={18}/><input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></span></label>}
   <label><span>Email address</span><span className="auth-input"><Mail size={18}/><input required type="email" autoComplete="email" maxLength={200} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></span></label>
   <label><span>Password</span><span className="auth-input"><LockKeyhole size={18}/><input required autoComplete={registering?'new-password':'current-password'} minLength={registering?12:undefined} maxLength={128} type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={registering?'At least 12 characters':'Enter your password'}/><button type="button" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(x=>!x)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></span></label>
   {registering&&<div className="auth-hint">Use a unique 12+ character password. This demo does not verify email ownership or provide password resets.</div>}
   {error&&<div className="auth-error" role="alert">{error}</div>}
   <button className="auth-submit" disabled={busy} type="submit">{busy?'Please wait…':registering?'Create account':'Sign in'} <ArrowRight size={18}/></button>
  </form>
  <p className="auth-switch">{registering?'Already have an account?':'New to QuickBite?'} <Link href={registering?'/login':'/register'}>{registering?'Sign in':'Create account'}</Link></p>
  <p className="auth-small">Just want to try the food? <Link href="/">Continue as a guest</Link></p>
  {!registering && (
  <p className="auth-small">
    Restaurant staff?{" "}
    <Link href="/admin/login">Admin Login →</Link>
  </p>
)}</div></section>
 </main>;
}
