'use client';
import {useEffect,useState} from 'react';
import {ArrowRight,LogOut,PackageOpen,ShoppingBag} from 'lucide-react';
import Link from 'next/link';
type Order={id:number;total:number;status:string;created_at:string;items:{name:string;quantity:number}[]};
export default function AccountOrders({name,email}:{name:string;email:string}){
 const [orders,setOrders]=useState<Order[]>([]),[busy,setBusy]=useState(true),[error,setError]=useState('');
 useEffect(()=>{fetch('/api/account/orders',{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);setOrders(d.orders)}).catch(e=>setError(e.message)).finally(()=>setBusy(false));},[]);
 async function logout(){const r=await fetch('/api/auth/logout',{method:'POST'});if(r.ok)window.location.assign('/');}
 return <main className="account-shell"><div className="account-head"><Link href="/" className="auth-wordmark">quickbite<span>.</span></Link><div className="account-head-links"><Link href="/">Explore menu <ArrowRight size={15}/></Link><button onClick={logout}><LogOut size={16}/> Sign out</button></div></div>
 <div className="account-main"><div className="account-intro"><span className="auth-eyebrow">MY QUICKBITE ACCOUNT</span><h1>Welcome back, {name.split(' ')[0]}.</h1><p>{email} · Your order history, all in one place.</p></div>
 <div className="account-order-section"><h2><ShoppingBag size={22}/> My orders</h2>{busy?<p className="account-message">Loading orders…</p>:error?<p className="auth-error">{error}</p>:orders.length===0?<div className="account-empty"><PackageOpen size={43}/><h3>No orders yet</h3><p>Your future demo orders will appear here. Older guest orders stay available via order number + email on the menu page.</p><Link href="/">Browse food <ArrowRight size={17}/></Link></div>:<div className="account-orders">{orders.map(o=><article key={o.id} className="account-order"><div className="account-order-top"><strong>Order #{o.id}</strong><span className="account-status">{o.status}</span></div><small>{new Date(o.created_at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</small><p>{o.items.map(i=>`${i.quantity}× ${i.name}`).join(' · ')}</p><strong>₹{o.total.toLocaleString('en-IN')}</strong></article>)}</div>}</div>
 <p className="account-footnote">QuickBite is a demo portfolio project. No real orders are delivered.</p></div></main>
}
