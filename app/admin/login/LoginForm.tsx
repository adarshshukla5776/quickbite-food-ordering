'use client';
import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import Link from 'next/link';
export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sign in failed');
      window.location.assign('/admin');
    } catch (err) { setError(err instanceof Error ? err.message : 'Sign in failed'); }
    finally { setBusy(false); }
  }
  return <main className="admin-login-page">
    <div className="admin-login-visual">
      <Link href="/" className="admin-wordmark"><span className="admin-brand-symbol">q<span>.</span></span> quickbite<span className="admin-brand-divider">/</span>operator</Link>
      <div className="admin-login-art">
        <span className="login-kicker">A LITTLE MORE ORGANIZED.</span>
        <h1>Good food.<br/><em>Smooth service.</em></h1>
        <p>Every order, every detail, all in one place.</p>
      </div>
      <p className="admin-login-caption">QuickBite Restaurant Operations · Demo project</p>
    </div>
    <div className="admin-login-content">
      <div className="admin-login-box">
        <div className="admin-lock-icon"><LockKeyhole size={21}/></div>
        <span className="login-kicker dark">STAFF ACCESS</span>
        <h2>Welcome back.</h2>
        <p className="login-description">Sign in to see orders and manage deliveries.</p>
        <form onSubmit={submit} className="admin-login-form">
          <label>Email address<input autoComplete="username" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="operator@example.com" /></label>
          <label>Password <span className="admin-password"><input autoComplete="current-password" type={showPassword ? 'text' : 'password'} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password"/><button aria-label={showPassword?'Hide password':'Show password'} type="button" onClick={()=>setShowPassword(s=>!s)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></span></label>
          {error && <p className="admin-inline-error" role="alert">{error}</p>}
          <button type="submit" disabled={busy} className="admin-submit">{busy ? 'Signing in…' : 'Sign in to dashboard'} <ArrowRight size={18}/></button>
        </form>
        <p className="login-small">Private operator area. Use the credentials stored in your environment variables.</p>
        <Link href="/" className="admin-back">← Back to food menu</Link>
      </div>
    </div>
  </main>;
}
