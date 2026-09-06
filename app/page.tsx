import Link from "next/link";

const products = [
  ["Personal checking", "Early direct deposit, balance visibility and budgeting tools."],
  ["Savings & investments", "High-yield savings and planning experiences."],
  ["Business banking", "Corporate accounts, payroll workflows and credit management."],
  ["Cards & credit", "Smart card controls with instant freeze and unfreeze."],
];

export default function Home() {
  return <main>
    <div className="container nav"><div className="brand">Crestline <span>Capital</span></div><div style={{display:"flex",gap:10}}><Link href="/login" className="btn-secondary">Sign in</Link><Link href="/dashboard" className="btn-primary">Open dashboard</Link></div></div>
    <section className="hero container"><span className="pill">SECURE DIGITAL BANKING</span><h1>Banking built around <span style={{color:"#38bdf8"}}>clarity</span>.</h1><p>Crestline Capital brings checking, savings, cards, transfers and financial insights into one modern digital banking workspace.</p><div style={{display:"flex",gap:12,marginTop:28,flexWrap:"wrap"}}><Link href="/login" className="btn-primary">Get started</Link><Link href="#products" className="btn-secondary">Explore products</Link></div></section>
    <section className="section container"><div className="grid grid-3"><div className="card stat"><div className="muted">Customers</div><div className="value">10k+</div></div><div className="card stat"><div className="muted">Platform volume</div><div className="value">$500M+</div></div><div className="card stat"><div className="muted">Availability target</div><div className="value">99.9%</div></div></div></section>
    <section id="products" className="section container"><h2>One platform, core banking essentials.</h2><p className="muted">Designed from the supplied Bnk platform documentation and adapted for Crestline Capital.</p><div className="grid grid-4" style={{marginTop:22}}>{products.map(([title,desc])=><div className="card" style={{padding:20}} key={title}><div style={{fontWeight:800,fontSize:18}}>{title}</div><p className="muted" style={{lineHeight:1.6}}>{desc}</p></div>)}</div></section>
    <footer className="container" style={{padding:"50px 0",borderTop:"1px solid rgba(148,163,184,.1)",marginTop:40}}><span className="muted">© {new Date().getFullYear()} Crestline Capital. Demo platform.</span></footer>
  </main>;
}