'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Bell, ChevronLeft, ChevronRight, CircleCheck, Clock3, LayoutDashboard, LogOut, Package, RefreshCcw, Search, ShoppingBag, TrendingUp, Truck, X } from 'lucide-react';
import Link from 'next/link';

type Status = 'Placed'|'Preparing'|'On the way'|'Delivered'|'Cancelled';
type Order = {id:number;customer_name:string;customer_email:string;customer_phone:string;delivery_address:string;subtotal:number;delivery_fee:number;total:number;status:Status;created_at:string;items:{name:string;quantity:number;unit_price:number}[]};
type Stats = {total_orders:number;pending:number;preparing:number;on_the_way:number;delivered:number;cancelled:number;total_sales:number;today_orders:number};
type Day = {day:string;orders:number;sales:number};
const filters=['All','Placed','Preparing','On the way','Delivered','Cancelled'] as const;
const nextStatus:Partial<Record<Status,Status>>={'Placed':'Preparing','Preparing':'On the way','On the way':'Delivered'};
const formatMoney=(n:number)=>'₹'+Number(n).toLocaleString('en-IN');
const formatDate=(date:string)=>new Date(date).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'});
export default function AdminDashboard() {
  const [stats,setStats]=useState<Stats|null>(null);
  const [daily,setDaily]=useState<Day[]>([]);
  const [orders,setOrders]=useState<Order[]>([]);
  const [filter,setFilter]=useState<(typeof filters)[number]>('All');
  const [search,setSearch]=useState('');
  const [query,setQuery]=useState('');
  const [page,setPage]=useState(1);
  const [total,setTotal]=useState(0);
  const [pages,setPages]=useState(1);
  const [selected,setSelected]=useState<Order|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [lastRefresh,setLastRefresh]=useState<Date|null>(null);
  const load=useCallback(async () => {
    try {
      setError('');
      const [sRes,oRes]=await Promise.all([
        fetch('/api/admin/summary',{cache:'no-store'}),
        fetch('/api/admin/orders?'+new URLSearchParams({status:filter,search:query,page:String(page)}),{cache:'no-store'})
      ]);
      if(sRes.status===401||oRes.status===401){window.location.assign('/admin/login');return;}
      const s=await sRes.json(),o=await oRes.json();
      if(!sRes.ok||!oRes.ok)throw Error(s.error||o.error||'Could not load dashboard');
      setStats(s.stats);setDaily(s.daily);setOrders(o.orders);setTotal(o.total);setPages(Math.max(1,o.totalPages));setLastRefresh(new Date());
      setSelected(prev=>prev?o.orders.find((item:Order)=>item.id===prev.id)??null:null);
    } catch(err){setError(err instanceof Error?err.message:'Something went wrong');}
    finally{setLoading(false);}
  },[filter,query,page]);
  useEffect(()=>{void load();},[load]);
  const topSales=useMemo(()=>Math.max(...daily.map(d=>Number(d.sales)),1),[daily]);
  const statusCounts:Record<string,number>={All:stats?.total_orders??0,Placed:stats?.pending??0,Preparing:stats?.preparing??0,'On the way':stats?.on_the_way??0,Delivered:stats?.delivered??0,Cancelled:stats?.cancelled??0};
  async function updateStatus(id:number,status:Status){
    if(status==='Cancelled' && !window.confirm(`Cancel order #${id}?`))return;
    setBusy(true);setError('');
    try {
      const result=await fetch(`/api/admin/orders/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
      const data=await result.json();
      if(result.status===401){window.location.assign('/admin/login');return;}
      if(!result.ok)throw Error(data.error||'Could not update status');
      setSelected(prev=>prev?.id===id?{...prev,status}:prev);
      await load();
    }catch(err){setError(err instanceof Error?err.message:'Update failed');}
    finally{setBusy(false);}
  }
  async function logout(){await fetch('/api/admin/logout',{method:'POST'});window.location.assign('/admin/login');}
  return <div className="admin-shell">
    <aside className="admin-side">
      <Link href="/" className="admin-wordmark"><span className="admin-brand-symbol">q<span>.</span></span> quickbite<span className="admin-brand-divider">/</span>operator</Link>
      <p className="admin-sidebar-label">WORKSPACE</p>
      <div className="admin-side-active"><LayoutDashboard size={18}/> Overview</div>
      <a href="#orders" className="admin-side-inactive"><ShoppingBag size={18}/> Orders <span>{stats?.total_orders??'—'}</span></a>
      <div className="admin-side-foot"><p>QUICK ACCESS</p><Link href="/" target="_blank"><ArrowUpRight size={17}/> Open customer site</Link><button type="button" onClick={logout}><LogOut size={17}/> Sign out</button></div>
    </aside>
    <div className="admin-main">
      <header className="admin-topbar"><div className="admin-mobile-brand">quickbite <span>/ operator</span></div><div className="admin-topbar-right"><span className="admin-connected"><span/> DATABASE CONNECTED</span><span className="admin-avatar">OP</span><button className="admin-mobile-logout" onClick={logout}><LogOut size={17}/></button></div></header>
      <main className="admin-content">
        <div className="admin-pagehead"><div><div className="admin-eyebrow">RESTAURANT OPERATIONS</div><h1>Overview<span className="admin-title-dot">.</span></h1><p>Keep an eye on what&apos;s coming in and what&apos;s going out.</p></div><button className="admin-refresh" type="button" onClick={()=>void load()} disabled={loading||busy}><RefreshCcw size={16}/> Refresh</button></div>
        {error&&<p className="admin-error" role="alert">{error} <button onClick={()=>void load()}>Retry</button></p>}
        <div className="admin-stat-grid">
          <article className="admin-stat-card"><span><ShoppingBag size={17}/> Total orders</span><strong>{loading&&!stats?'—':stats?.total_orders??0}</strong><small>All orders placed</small></article>
          <article className="admin-stat-card"><span><TrendingUp size={17}/> Sales value</span><strong>{stats?formatMoney(stats.total_sales):'—'}</strong><small>Excludes cancelled orders · demo</small></article>
          <article className="admin-stat-card focus"><span><Clock3 size={17}/> Waiting to prepare</span><strong>{stats?.pending??'—'}</strong><small>Orders marked “Placed”</small></article>
          <article className="admin-stat-card"><span><CircleCheck size={17}/> Delivered</span><strong>{stats?.delivered??'—'}</strong><small>Completed orders</small></article>
        </div>
        <div className="admin-insights">
          <section className="admin-panel admin-chart-panel"><div className="admin-panel-header"><div><span className="admin-panel-label">PERFORMANCE</span><h2>Sales this week</h2></div><span className="admin-panel-helper">Last 7 days · IST</span></div><div className="admin-bar-chart">{daily.map(d=><div className="admin-bar-col" key={d.day} title={`${formatMoney(d.sales)} · ${d.orders} orders`}><span>{d.sales?formatMoney(d.sales):''}</span><div className="admin-bar-track"><div style={{height:`${Math.max(Number(d.sales)?8:0,Number(d.sales)/topSales*100)}%`}}/></div><small>{new Date(d.day+'T12:00:00').toLocaleDateString('en-IN',{weekday:'short'})}</small></div>)}</div></section>
          <section className="admin-panel admin-progress-panel"><div className="admin-panel-header"><div><span className="admin-panel-label">AT A GLANCE</span><h2>Order progress</h2></div><Package size={19}/></div><div className="admin-progress-rows"><div><span><span className="progress-dot placed"/> Placed</span><strong>{stats?.pending??0}</strong></div><div><span><span className="progress-dot preparing"/> Preparing</span><strong>{stats?.preparing??0}</strong></div><div><span><span className="progress-dot way"/> On the way</span><strong>{stats?.on_the_way??0}</strong></div><div><span><span className="progress-dot delivered"/> Delivered</span><strong>{stats?.delivered??0}</strong></div><div><span><span className="progress-dot cancelled"/> Cancelled</span><strong>{stats?.cancelled??0}</strong></div></div><p className="admin-progress-note"><Bell size={15}/> {stats?.today_orders??0} order(s) received today</p></section>
        </div>
        <section id="orders" className="admin-panel admin-orders-panel"><div className="admin-panel-header admin-orders-heading"><div><span className="admin-panel-label">ORDER MANAGEMENT</span><h2>Recent orders</h2><p>View customer details and move orders through their stages.</p></div><span className="admin-count">{total} matching</span></div>
        <div className="admin-order-controls"><div className="admin-filter-tabs" role="group" aria-label="Filter orders">{filters.map(f=><button key={f} className={f===filter?'selected':''} onClick={()=>{setFilter(f);setPage(1)}}>{f}<span>{statusCounts[f]}</span></button>)}</div><form className="admin-search" onSubmit={e=>{e.preventDefault();setQuery(search);setPage(1)}}><Search size={17}/><input aria-label="Search orders" placeholder="ID, name or email" value={search} onChange={e=>setSearch(e.target.value)} /><button type="submit">Search</button></form></div>
        <div className="admin-table-scroll"><table className="admin-orders-table"><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>ITEMS</th><th>TOTAL</th><th>STATUS</th><th></th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td><strong>#{o.id}</strong><small>{formatDate(o.created_at)}</small></td><td><strong>{o.customer_name}</strong><small>{o.customer_email}</small></td><td>{o.items.reduce((a,i)=>a+Number(i.quantity),0)} item(s)</td><td><strong>{formatMoney(o.total)}</strong></td><td><span className={`admin-status status-${o.status.toLowerCase().replaceAll(' ','-')}`}>{o.status}</span></td><td><button className="admin-view" type="button" onClick={()=>setSelected(o)}>Details <ArrowRight size={15}/></button></td></tr>)}</tbody></table>{!loading&&!orders.length&&<div className="admin-empty">No orders match this filter.</div>}</div>
        <div className="admin-table-footer"><small>{lastRefresh?`Last refreshed ${lastRefresh.toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'})}`:''}</small><div><button disabled={page===1||loading} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={17}/></button> Page {page} of {pages} <button disabled={page>=pages||loading} onClick={()=>setPage(p=>p+1)}><ChevronRight size={17}/></button></div></div>
        </section>
        <p className="admin-footnote">QuickBite is a portfolio demo. Sales are demo order totals, not real payments.</p>
      </main>
    </div>
    {selected&&<div className="admin-detail-overlay" onMouseDown={()=>setSelected(null)}><aside className="admin-detail-drawer" onMouseDown={e=>e.stopPropagation()}><div className="admin-detail-top"><div><span className="admin-panel-label">ORDER DETAILS</span><h2>Order #{selected.id}</h2></div><button aria-label="Close details" onClick={()=>setSelected(null)}><X size={22}/></button></div><span className={`admin-status status-${selected.status.toLowerCase().replaceAll(' ','-')}`}>{selected.status}</span><p className="admin-detail-date">Placed on {formatDate(selected.created_at)}</p><div className="admin-detail-section"><h3>Customer</h3><strong>{selected.customer_name}</strong><p>{selected.customer_email}</p><p>{selected.customer_phone}</p></div><div className="admin-detail-section"><h3>Delivery address</h3><p>{selected.delivery_address}</p></div><div className="admin-detail-section"><h3>Items ordered</h3>{selected.items.map((i,index)=><div key={index} className="admin-detail-item"><span>{i.quantity} × {i.name}</span><strong>{formatMoney(Number(i.quantity)*Number(i.unit_price))}</strong></div>)}<div className="admin-detail-item"><span>Delivery charge</span><strong>{formatMoney(selected.delivery_fee)}</strong></div><div className="admin-detail-total"><span>Total</span><strong>{formatMoney(selected.total)}</strong></div></div><div className="admin-detail-actions">{nextStatus[selected.status]&&<button className="admin-action-primary" disabled={busy} onClick={()=>void updateStatus(selected.id,nextStatus[selected.status]!)}>{busy?'Updating…':`Mark as ${nextStatus[selected.status]}`} <Truck size={17}/></button>}{selected.status!=='Cancelled'&&selected.status!=='Delivered'&&<button className="admin-action-danger" disabled={busy} onClick={()=>void updateStatus(selected.id,'Cancelled')}>Cancel order</button>}{(selected.status==='Cancelled'||selected.status==='Delivered')&&<p className="admin-finished-note">This order is complete. No further changes allowed.</p>}</div></aside></div>}
  </div>;
}
