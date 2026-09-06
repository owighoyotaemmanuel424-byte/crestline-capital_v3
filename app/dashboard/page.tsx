"use client";
import Link from "next/link";
import { useState } from "react";

const transactions = [
  ["Payroll deposit","Salary","+$3,200.00","amount-positive"],
  ["Harbor Kitchen","Dining","-$84.20","amount-negative"],
  ["Electric bill","Utilities","-$145.00","amount-negative"],
  ["Transfer to savings","Transfer","-$600.00","amount-negative"],
];

export default function Dashboard(){
  const [frozen,setFrozen]=useState(false);
  return <div className="dashboard">
    <aside className="sidebar"><Link href="/" className="brand">Crestline <span>Capital</span></Link><nav><a className="active" href="#overview">Overview</a><a href="#accounts">Accounts</a><a href="#transactions">Transactions</a><a href="#cards">Cards</a><a href="#transfers">Transfers</a><a href="#security">Security</a></nav><div className="card" style={{padding:14,marginTop:24}}><div className="muted" style={{fontSize:12}}>DEMO PROFILE</div><strong>Demo Customer</strong><div className="muted" style={{fontSize:12,marginTop:4}}>KYC verified · 2FA enabled</div></div></aside>
    <main className="main"><div className="topbar"><div><div className="muted">Sunday, September 6, 2026</div><h1 style={{margin:"4px 0",fontSize:30}}>Good morning.</h1></div><Link href="/" className="btn-secondary">Sign out</Link></div>
      <section id="overview" className="grid grid-3"><div className="card balance" style={{gridColumn:"span 2"}}><div className="muted">Total balance</div><div className="amount">$37,350.75</div><div className="muted">Across 2 accounts · USD</div></div><div className="card stat"><div className="muted">Monthly spending</div><div className="value">$1,284.20</div><div className="muted">12% lower than last month</div></div></section>
      <section id="accounts" className="section"><h2>Accounts</h2><div className="grid grid-2"><div className="card stat"><div className="muted">Personal checking · •••• 4821</div><div className="value">$24,850.75</div><div className="muted">Available balance</div></div><div className="card stat"><div className="muted">High-yield savings · •••• 9017</div><div className="value">$12,500.00</div><div className="muted">Available balance</div></div></div></section>
      <section id="transactions" className="section"><div className="topbar"><div><h2>Recent transactions</h2><div className="muted">Latest ledger activity</div></div><button className="btn-secondary" onClick={()=>alert("Transaction export is available after connecting the production reporting service.")}>Export</button></div><div className="card" style={{overflowX:"auto"}}><table className="table"><thead><tr><th>Description</th><th>Category</th><th>Amount</th></tr></thead><tbody>{transactions.map(([d,c,a,cl])=><tr key={a+d}><td>{d}</td><td className="muted">{c}</td><td className={cl}>{a}</td></tr>)}</tbody></table></div></section>
      <section id="cards" className="section"><h2>Card controls</h2><div className="card" style={{padding:24,display:"flex",justifyContent:"space-between",alignItems:"center",gap:20,flexWrap:"wrap"}}><div><div style={{fontWeight:800}}>Crestline Visa •••• 4821</div><div className="muted">Expires 08/29 · {frozen?"Frozen":"Active"}</div></div><button className={frozen?"btn-primary":"btn-secondary"} onClick={()=>setFrozen(!frozen)}>{frozen?"Unfreeze card":"Freeze card"}</button></div></section>
      <section id="transfers" className="section"><h2>Transfers</h2><div className="card" style={{padding:24}}><p className="muted">The Convex transfer mutation validates ownership, available balance, writes a transaction and ledger entry, and records a notification. Connect this UI to your authenticated user session before enabling live operations.</p><Link href="#overview" className="btn-primary">Start transfer</Link></div></section>
      <section id="security" className="section"><h2>Security & compliance</h2><div className="grid grid-3"><div className="card stat"><strong>256-bit TLS</strong><div className="muted">Transport protection</div></div><div className="card stat"><strong>2FA</strong><div className="muted">Enabled for demo profile</div></div><div className="card stat"><strong>KYC</strong><div className="muted">Verified demo state</div></div></div></section>
    </main>
  </div>
}