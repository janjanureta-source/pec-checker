import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon, BuildifyLogo } from "../shared/Icon.jsx";
import LoginModal from "./LoginModal.jsx";

function LandingPage({ onLogin }) {
  const [showLogin, setShowLogin] = useState(false);
  const [scrollY,   setScrollY]   = useState(0);
  const [visible,   setVisible]   = useState({});

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive:true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) setVisible(v => ({ ...v, [e.target.dataset.reveal]: true }));
      });
    }, { threshold:0.1 });
    document.querySelectorAll("[data-reveal]").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const reveal = (key, delay=0) => ({
    "data-reveal": key,
    style: {
      opacity: visible[key] ? 1 : 0,
      transform: visible[key] ? "translateY(0)" : "translateY(40px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
    }
  });

  const BLUE   = "#0696d7";
  const ORANGE = "#ff6b2b";
  const CYAN   = "#06b6d4";
  const GREEN  = "#22c55e";
  const NAVY   = "#080d18";
  const navSolid = scrollY > 60;

  const STATS = [
    { num:"5 min",   label:"Full BOM Review",          sub:"vs. 6–16 hrs manually" },
    { num:"₱500K+",  label:"Avg. Annual Value Caught",  sub:"per firm, 20 projects/yr" },
    { num:"25×",     label:"ROI on Subscription",       sub:"₱42K/yr subscription" },
    { num:"100%",    label:"Philippine Codes",           sub:"NSCP · PEC · NPC · DPWH" },
  ];

  const PAIN_POINTS = [
    { icon:"😓", pain:"Estimating takes 2 days per project", fix:"AI reads your plans in 5 minutes and drafts your quantities" },
    { icon:"😬", pain:"You underbid and lose money mid-project", fix:"Market-rate validation against 2025 NCR/DPWH rates before you sign" },
    { icon:"📋", pain:"Missing items discovered during construction", fix:"AI cross-checks BOM vs. plan drawings — nothing slips through" },
    { icon:"📉", pain:"Low-margin bids that barely cover your costs", fix:"Markup analysis ensures OCM, contingency, and profit are protected" },
  ];

  const HOW_STEPS = [
    { n:"01", icon:"upload",   title:"Upload Your Plans",       desc:"Drop engineering plans in PDF, JPG, or PNG. Floor plans, elevations, site plan — any format." },
    { n:"02", icon:"bom",      title:"Add Your Draft BOM",      desc:"Upload your Bill of Materials PDF. Or run plans-only for a full scope and quantity estimate." },
    { n:"03", icon:"checker",  title:"AI Validates Everything", desc:"Quantities vs. plan. Unit costs vs. 2025 market rates. Missing items. Markup completeness." },
    { n:"04", icon:"report",   title:"Export Clean Report",     desc:"Download a professional estimate report. Ready to review, refine, and submit with confidence." },
  ];

  const MODULES = [
    {
      icon:"structural", color:BLUE, grad:`135deg,${BLUE},#0569a8`, name:"Structural", code:"NSCP 2015 · DPWH Blue Book",
      badge:"⭐ Flagship", live:true,
      tools:["📋 BOM Review — quantities, costs, missing items","💰 Cost Estimator — parametric from plan upload","🤖 AI Plan Checker (NSCP 2015)","🌍 Seismic Load · 📐 Beam · 🏛️ Column · 🪨 Footing · 🔩 Slab","📊 Load Combinations"]
    },
    {
      icon:"electrical", color:ORANGE, grad:`135deg,${ORANGE},#e85520`, name:"Electrical", code:"PEC 2017 · RA 9514 · Green Building",
      live:true,
      tools:["🔍 AI Plan Checker (PEC 2017 / FSIC)","📉 Voltage Drop Calculator","⚡ Short Circuit Analysis","📊 Load Schedule Calculator"]
    },
    {
      icon:"sanitary", color:CYAN, grad:`135deg,${CYAN},#0891b2`, name:"Sanitary", code:"NPC 2000 · PD 856 Sanitation Code",
      live:true,
      tools:["🔍 AI Plan Checker (NPC 2000)","🚿 Fixture Unit Calculator","📏 Pipe Sizing · 🪣 Septic Tank","💧 Water Demand · 🔢 Pressure Loss · 🌧️ Storm Drainage"]
    },
    {
      icon:"column", color:"#a78bfa", grad:"135deg,#a78bfa,#7c3aed", name:"ArchiCode", code:"NBC Philippines · BP 344 · Green Building",
      live:false,
      tools:["AI Plan Checker (NBC Philippines)","BP 344 Accessibility Compliance","Green Building Code Checker","Fire Code (RA 9514) Review","Parking & Setback Calculator"]
    },
    {
      icon:"settings", color:"#94a3b8", grad:"135deg,#94a3b8,#64748b", name:"MechaniCode", code:"PSME Code · ASHRAE · Mechanical PE",
      live:false,
      tools:["HVAC Load Calculator","Duct Sizing & Static Pressure","Chiller & AHU Selection","Mechanical Plan Checker","Ventilation Rate Calculator"]
    },
  ];

  const SAVINGS = [
    {
      icon:"pressure", color:BLUE,
      title:"Estimating Time Saved",
      amount:"₱36,000–₱150,000/yr",
      calc:"15 estimates/yr × 8–20 hrs × ₱300–500/hr → AI does first-pass in 5 min",
    },
    {
      icon:"checker", color:ORANGE,
      title:"Bid Accuracy Protection",
      amount:"₱250,000–₱500,000/yr",
      calc:"Catch one 5% underbid on a ₱5M project = ₱250K saved. One project/year pays the subscription 6×",
    },
    {
      icon:"beam", color:CYAN,
      title:"Procurement Rework Avoided",
      amount:"₱80,000–₱200,000/yr",
      calc:"Wrong quantities caught before purchase orders = 10–15% material cost savings per project",
    },
    {
      icon:"check", color:GREEN,
      title:"More Bids Won",
      amount:"₱300,000–₱1,000,000/yr",
      calc:"Faster estimates = more bids submitted. Even 1 additional project/year at 10% margin = significant upside",
    },
  ];

  const TESTIMONIALS = [
    { quote:"Nakita agad ng BOM Review yung kulang na waterproofing at mali sa rebar pricing. Nakatipid kami ng halos ₱300K sa isang project.", name:"R. Santos", role:"Project Manager, Antipolo" },
    { quote:"Before, 2 days ang estimate namin per project. Ngayon, 30 minutes — at mas accurate pa. Game changer.", name:"M. dela Cruz", role:"Senior Estimator, Metro Manila" },
    { quote:"As a sole contractor, this is like having a full estimating team on call 24/7. The cost per project has dropped significantly.", name:"A. Reyes", role:"General Contractor, Davao" },
  ];

  const PRICING = [
    { name:"Solo Contractor",   price:"₱499",    period:"/month", color:"#64748b",
      desc:"For freelance estimators and sole contractors",
      features:["Full suite — all 4 live modules","BOM Review + Cost Estimator","All calculators","PDF report export","1 user"] },
    { name:"Small Firm",        price:"₱3,500",  period:"/month", color:BLUE, best:true,
      desc:"For contracting firms and design-build teams",
      features:["Everything in Solo","Up to 10 users","Dashboard + project history","Priority support","Unlimited runs"] },
    { name:"Mid-Size Firm",     price:"₱12,000", period:"/month", color:ORANGE,
      desc:"For larger contractors and developers",
      features:["Everything in Small Firm","Unlimited users","Dedicated onboarding","Custom code references","Early access to new modules"] },
  ];

  return (
    <div style={{ background:NAVY, color:"#e8edf5", fontFamily:"'Sora','DM Sans','Segoe UI',sans-serif", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:rgba(6,150,215,0.25);border-radius:4px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes floatR{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes grid-scroll{0%{transform:translateY(0)}100%{transform:translateY(60px)}}
        @keyframes spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .stat-card:hover{border-color:var(--c)!important;background:rgba(6,150,215,0.06)!important}
        .stat-card{transition:all 0.2s}
        .mod-card:hover{transform:translateY(-6px)}
        .mod-card{transition:transform 0.25s ease,border-color 0.2s ease}
        .mod-card:hover .mod-top-bar{opacity:1!important}
        .mod-top-bar{transition:opacity 0.2s}
        .pain-card:hover{border-color:rgba(6,150,215,0.3)!important}
        .pain-card{transition:border-color 0.2s}
        .cta-btn{transition:all 0.2s ease}
        .cta-btn:hover{transform:translateY(-2px);filter:brightness(1.1)}
        .nav-link:hover{color:#e8edf5!important}
        .nav-link{transition:color 0.15s}
        .pricing-card:hover{transform:translateY(-4px)}
        .pricing-card{transition:transform 0.2s ease}
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position:"fixed",top:0,left:0,right:0,zIndex:1000,height:64,padding:"0 40px",display:"flex",alignItems:"center",justifyContent:"space-between",
        background:navSolid?"rgba(8,13,24,0.96)":"transparent",
        backdropFilter:navSolid?"blur(24px)":"none",
        borderBottom:navSolid?"1px solid rgba(6,150,215,0.12)":"none",
        transition:"all 0.3s ease" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${BLUE},#0569a8)`,display:"flex",alignItems:"center",justifyContent:"center" }}><BuildifyLogo size={30}/></div>
          <div>
            <div style={{ fontWeight:900,fontSize:16,color:"#e8edf5",letterSpacing:"-0.5px" }}>Buildify</div>
            <div style={{ fontSize:9,color:"#475569",letterSpacing:"0.8px",textTransform:"uppercase" }}>Engineering Suite · PH</div>
          </div>
        </div>
        <div style={{ display:"flex",gap:28,alignItems:"center" }}>
          {[["Why Buildify","#why"],["Modules","#modules"],["Pricing","#pricing"]].map(([l,h]) => (
            <a key={l} href={h} className="nav-link" style={{ fontSize:13,color:"#64748b",textDecoration:"none",fontWeight:600 }}>{l}</a>
          ))}
        </div>
        <button onClick={()=>setShowLogin(true)} className="cta-btn"
          style={{ background:`linear-gradient(135deg,${BLUE},#0569a8)`,border:"none",color:"#fff",fontWeight:700,fontSize:13,padding:"9px 22px",borderRadius:10,cursor:"pointer",boxShadow:`0 4px 20px rgba(6,150,215,0.35)` }}>
          Sign In →
        </button>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"120px 40px 80px",position:"relative",overflow:"hidden",textAlign:"center" }}>
        {/* Background */}
        <div style={{ position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none" }}>
          <svg width="100%" height="130%" style={{ position:"absolute",top:0,left:0,opacity:0.035,animation:"grid-scroll 25s linear infinite" }}>
            <defs><pattern id="eng-grid" width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M 64 0 L 0 0 0 64" fill="none" stroke={BLUE} strokeWidth="1"/>
              <circle cx="0" cy="0" r="1.5" fill={BLUE}/>
            </pattern></defs>
            <rect width="100%" height="200%" fill="url(#eng-grid)"/>
          </svg>
          <div style={{ position:"absolute",top:"15%",left:"8%",width:320,height:320,borderRadius:"50%",background:`radial-gradient(circle,rgba(6,150,215,0.1),transparent 65%)`,animation:"float 7s ease-in-out infinite" }}/>
          <div style={{ position:"absolute",bottom:"15%",right:"6%",width:260,height:260,borderRadius:"50%",background:`radial-gradient(circle,rgba(255,107,43,0.08),transparent 65%)`,animation:"floatR 9s ease-in-out infinite 1s" }}/>
          <div style={{ position:"absolute",top:"55%",right:"18%",width:200,height:200,borderRadius:"50%",background:`radial-gradient(circle,rgba(6,182,212,0.07),transparent 65%)`,animation:"float 8s ease-in-out infinite 3s" }}/>
          {/* Parallax lines */}
          <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.05,transform:`translateY(${scrollY*0.12}px)` }} preserveAspectRatio="none">
            <line x1="0" y1="35%" x2="100%" y2="35%" stroke={BLUE} strokeWidth="1" strokeDasharray="10 16"/>
            <line x1="0" y1="65%" x2="100%" y2="65%" stroke={ORANGE} strokeWidth="1" strokeDasharray="10 16"/>
            <line x1="22%" y1="0" x2="22%" y2="100%" stroke={CYAN} strokeWidth="1" strokeDasharray="10 16"/>
            <line x1="72%" y1="0" x2="72%" y2="100%" stroke={BLUE} strokeWidth="1" strokeDasharray="10 16"/>
          </svg>
        </div>

        <div style={{ position:"relative",maxWidth:900,width:"100%" }}>
          {/* Badge */}
          <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(6,150,215,0.08)",border:"1px solid rgba(6,150,215,0.25)",borderRadius:99,padding:"6px 16px",marginBottom:28,animation:"fadeUp 0.6s ease both" }}>
            <span style={{ width:7,height:7,borderRadius:"50%",background:BLUE,boxShadow:`0 0 10px ${BLUE}`,display:"inline-block",animation:"float 2s ease-in-out infinite" }}/>
            <span style={{ fontSize:11,color:BLUE,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase" }}>AI-Powered · Built for Filipino Contractors · 2025</span>
          </div>

          <h1 style={{ fontSize:"clamp(34px,5.5vw,68px)",fontWeight:900,letterSpacing:"-2px",lineHeight:1.05,marginBottom:20,animation:"fadeUp 0.7s ease 0.1s both" }}>
            Estimate Smarter.<br/>
            <span style={{ background:`linear-gradient(135deg,${BLUE},${CYAN})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>Win More. Build Profitably.</span>
          </h1>

          <p style={{ fontSize:"clamp(15px,1.8vw,19px)",color:"#94a3b8",maxWidth:640,margin:"0 auto 36px",lineHeight:1.75,animation:"fadeUp 0.7s ease 0.2s both" }}>
            Buildify helps Philippine contractors and estimators produce accurate BOMs, catch missing items, validate 2025 market rates, and generate professional estimates — in minutes, not days.
          </p>

          <div style={{ display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center",animation:"fadeUp 0.7s ease 0.3s both",marginBottom:64 }}>
            <button onClick={()=>setShowLogin(true)} className="cta-btn"
              style={{ background:`linear-gradient(135deg,${BLUE},#0569a8)`,border:"none",color:"#fff",fontWeight:800,fontSize:15,padding:"15px 38px",borderRadius:12,cursor:"pointer",boxShadow:`0 8px 32px rgba(6,150,215,0.45)`,letterSpacing:"-0.3px" }}>
              Start Free → Try BOM Review
            </button>
            <a href="#why" style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.1)",color:"#94a3b8",fontWeight:600,fontSize:14,padding:"14px 28px",borderRadius:12,textDecoration:"none",transition:"all 0.2s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=BLUE;e.currentTarget.style.color="#e8edf5"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";e.currentTarget.style.color="#94a3b8"}}>
              ▶ See How It Works
            </a>
          </div>

          {/* Stats */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:"rgba(255,255,255,0.04)",borderRadius:16,overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)" }}>
            {STATS.map((s,i) => (
              <div key={i} className="stat-card" style={{ "--c":BLUE,padding:"20px 16px",textAlign:"center",background:NAVY,borderRight:i<3?"1px solid rgba(255,255,255,0.05)":"none",animation:`fadeUp 0.8s ease ${0.2+i*0.12}s both` }}>
                <div style={{ fontSize:"clamp(18px,2.5vw,26px)",fontWeight:900,color:BLUE,fontFamily:"monospace",letterSpacing:"-0.5px" }}>{s.num}</div>
                <div style={{ fontSize:11,color:"#e8edf5",fontWeight:700,marginTop:4 }}>{s.label}</div>
                <div style={{ fontSize:9,color:"#475569",marginTop:2 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY BUILDIFY ── */}
      <section id="why" style={{ padding:"100px 40px",borderTop:"1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div {...reveal("why-h")} style={{ textAlign:"center",marginBottom:60 }}>
            <div style={{ fontSize:11,color:ORANGE,fontWeight:700,textTransform:"uppercase",letterSpacing:"2px",marginBottom:10 }}>WHY BUILDIFY</div>
            <h2 style={{ fontSize:"clamp(26px,4vw,44px)",fontWeight:900,letterSpacing:"-1px",lineHeight:1.1 }}>
              Every Estimator Knows<br/><span style={{color:ORANGE}}>These Exact Problems</span>
            </h2>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16 }}>
            {PAIN_POINTS.map((p,i) => (
              <div key={i} className="pain-card" {...reveal(`pain-${i}`, i*0.1)}
                style={{ background:"#0f1624",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"24px",position:"relative",overflow:"hidden" }}>
                <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${BLUE},transparent)` }}/>
                <div style={{ fontSize:28,marginBottom:14 }}>{p.icon}</div>
                <div style={{ fontSize:13,color:"#ef4444",fontWeight:700,marginBottom:10,lineHeight:1.4 }}>"{p.pain}"</div>
                <div style={{ height:1,background:"rgba(255,255,255,0.05)",marginBottom:10 }}/>
                <div style={{ fontSize:12,color:"#94a3b8",lineHeight:1.6 }}>
                  <span style={{ color:GREEN,fontWeight:700 }}>✓ </span>{p.fix}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding:"100px 40px",background:"rgba(6,150,215,0.02)",borderTop:"1px solid rgba(6,150,215,0.07)",borderBottom:"1px solid rgba(6,150,215,0.07)" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div {...reveal("how-h")} style={{ textAlign:"center",marginBottom:60 }}>
            <div style={{ fontSize:11,color:BLUE,fontWeight:700,textTransform:"uppercase",letterSpacing:"2px",marginBottom:10 }}>HOW IT WORKS</div>
            <h2 style={{ fontSize:"clamp(26px,4vw,44px)",fontWeight:900,letterSpacing:"-1px" }}>
              Plan to Estimate<br/><span style={{color:BLUE}}>in 4 Steps</span>
            </h2>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16 }}>
            {HOW_STEPS.map((s,i) => (
              <div key={i} {...reveal(`how-${i}`, i*0.1)}
                style={{ background:"#0f1624",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"28px 24px",position:"relative" }}>
                <div style={{ position:"absolute",top:14,right:16,fontSize:28,fontWeight:900,color:"rgba(6,150,215,0.08)",fontFamily:"monospace" }}>{s.n}</div>
                <div style={{ width:48,height:48,borderRadius:12,background:"rgba(6,150,215,0.1)",border:"1px solid rgba(6,150,215,0.2)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16 }}><Icon name={s.icon} size={22} color="#0696d7" strokeWidth={1.5}/></div>
                <div style={{ fontWeight:800,fontSize:15,color:"#e8edf5",marginBottom:8 }}>{s.title}</div>
                <div style={{ fontSize:12,color:"#64748b",lineHeight:1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULES ── */}
      <section id="modules" style={{ padding:"100px 40px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto" }}>
          <div {...reveal("mod-h")} style={{ textAlign:"center",marginBottom:60 }}>
            <div style={{ fontSize:11,color:CYAN,fontWeight:700,textTransform:"uppercase",letterSpacing:"2px",marginBottom:10 }}>THE SUITE</div>
            <h2 style={{ fontSize:"clamp(26px,4vw,44px)",fontWeight:900,letterSpacing:"-1px" }}>
              Every Engineering Discipline.<br/><span style={{color:CYAN}}>One Platform.</span>
            </h2>
            <p style={{ fontSize:13,color:"#64748b",marginTop:12 }}>4 modules live now · 2 coming soon · All built for Philippine codes</p>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:20 }}>
            {MODULES.map((m,i) => (
              <div key={i} className="mod-card" {...reveal(`mod-${i}`, i*0.1)}
                style={{ background:m.live?"#0f1624":"#0a1020",border:`1px solid ${m.live?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.04)"}`,borderRadius:20,padding:"28px",position:"relative",overflow:"hidden",opacity:m.live?1:0.75 }}>
                <div className="mod-top-bar" style={{ position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${m.color},transparent)`,opacity:0.5 }}/>
                {!m.live && (
                  <div style={{ position:"absolute",top:14,right:14,fontSize:9,background:"rgba(148,163,184,0.1)",color:"#94a3b8",padding:"3px 8px",borderRadius:5,fontWeight:800,letterSpacing:"0.5px",border:"1px solid rgba(148,163,184,0.15)" }}>COMING SOON</div>
                )}
                <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
                  <div style={{ width:44,height:44,borderRadius:11,background:`linear-gradient(${m.grad})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 6px 20px ${m.color}30`,flexShrink:0 }}><Icon name={m.icon} size={22} color="white" strokeWidth={1.5}/></div>
                  <div>
                    <div style={{ fontWeight:900,fontSize:16,color:m.live?"#e8edf5":"#64748b" }}>{m.name}</div>
                    <div style={{ fontSize:10,color:"#475569",marginTop:2 }}>{m.code}</div>
                  </div>
                  {m.badge && <span style={{ marginLeft:"auto",fontSize:9,background:`${m.color}18`,color:m.color,padding:"3px 8px",borderRadius:5,fontWeight:800,whiteSpace:"nowrap",border:`1px solid ${m.color}30` }}>{m.badge}</span>}
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:7,marginBottom:20 }}>
                  {m.tools.map((t,j) => (
                    <div key={j} style={{ fontSize:11,color:m.live?"#94a3b8":"#475569",display:"flex",alignItems:"flex-start",gap:6,lineHeight:1.4 }}>
                      <div style={{ width:4,height:4,borderRadius:"50%",background:m.color,flexShrink:0,marginTop:5 }}/>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
                {m.live && (
                  <button onClick={()=>setShowLogin(true)}
                    style={{ width:"100%",background:`${m.color}12`,border:`1.5px solid ${m.color}35`,color:m.color,fontWeight:700,fontSize:12,padding:"10px",borderRadius:10,cursor:"pointer",transition:"all 0.15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.background=`${m.color}22`}}
                    onMouseLeave={e=>{e.currentTarget.style.background=`${m.color}12`}}>
                    Open {m.name} →
                  </button>
                )}
                {!m.live && (
                  <div style={{ width:"100%",background:"rgba(148,163,184,0.05)",border:"1px solid rgba(148,163,184,0.1)",color:"#475569",fontWeight:700,fontSize:11,padding:"10px",borderRadius:10,textAlign:"center" }}>
                    🔔 Notify Me When Live
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAVINGS / ROI ── */}
      <section style={{ padding:"100px 40px",background:`linear-gradient(180deg,rgba(6,150,215,0.02),rgba(6,150,215,0.05))`,borderTop:"1px solid rgba(6,150,215,0.07)",borderBottom:"1px solid rgba(6,150,215,0.07)" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div {...reveal("roi-h")} style={{ textAlign:"center",marginBottom:60 }}>
            <div style={{ fontSize:11,color:GREEN,fontWeight:700,textTransform:"uppercase",letterSpacing:"2px",marginBottom:10 }}>ROI FOR CONTRACTORS</div>
            <h2 style={{ fontSize:"clamp(26px,4vw,44px)",fontWeight:900,letterSpacing:"-1px" }}>
              The Math Is Simple.<br/><span style={{color:GREEN}}>Buildify Pays for Itself.</span>
            </h2>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16,marginBottom:36 }}>
            {SAVINGS.map((s,i) => (
              <div key={i} {...reveal(`roi-${i}`, i*0.1)}
                style={{ background:"#0f1624",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"24px",position:"relative",overflow:"hidden" }}>
                <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${s.color},transparent)` }}/>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12 }}><Icon name={s.icon} size={26} color={s.color} strokeWidth={1.5}/></div>
                <div style={{ fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6 }}>{s.title}</div>
                <div style={{ fontSize:20,fontWeight:900,color:s.color,fontFamily:"monospace",letterSpacing:"-0.5px",marginBottom:10 }}>{s.amount}</div>
                <div style={{ fontSize:11,color:"#64748b",lineHeight:1.65,background:"rgba(255,255,255,0.02)",borderRadius:8,padding:"8px 10px",border:"1px solid rgba(255,255,255,0.04)" }}>{s.calc}</div>
              </div>
            ))}
          </div>
          <div {...reveal("roi-total")} style={{ background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:16,padding:"28px 32px",textAlign:"center" }}>
            <div style={{ fontSize:12,color:"#64748b",marginBottom:6 }}>Small firm · 15 estimates/yr · 2 projects improved/yr</div>
            <div style={{ fontSize:"clamp(28px,4vw,52px)",fontWeight:900,color:GREEN,fontFamily:"monospace",letterSpacing:"-1px" }}>₱666,000–₱1,850,000/yr</div>
            <div style={{ fontSize:13,color:"#64748b",marginTop:8 }}>estimated total value captured · subscription cost: <strong style={{color:"#e8edf5"}}>₱42,000/yr</strong> · ROI: <strong style={{color:GREEN}}>16–44×</strong></div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding:"100px 40px" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div {...reveal("test-h")} style={{ textAlign:"center",marginBottom:60 }}>
            <div style={{ fontSize:11,color:"#8b5cf6",fontWeight:700,textTransform:"uppercase",letterSpacing:"2px",marginBottom:10 }}>FROM THE FIELD</div>
            <h2 style={{ fontSize:"clamp(26px,4vw,40px)",fontWeight:900,letterSpacing:"-1px" }}>Contractors Already Using Buildify</h2>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20 }}>
            {TESTIMONIALS.map((t,i) => (
              <div key={i} {...reveal(`test-${i}`, i*0.15)}
                style={{ background:"#0f1624",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"28px" }}>
                <div style={{ fontSize:36,color:BLUE,lineHeight:1,marginBottom:12 }}>"</div>
                <div style={{ fontSize:13,color:"#94a3b8",lineHeight:1.8,marginBottom:20,fontStyle:"italic" }}>{t.quote}</div>
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:14,display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${BLUE},${CYAN})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff" }}>{t.name[0]}</div>
                  <div>
                    <div style={{ fontWeight:700,fontSize:13,color:"#e8edf5" }}>{t.name}</div>
                    <div style={{ fontSize:10,color:"#64748b",marginTop:1 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding:"100px 40px",background:"rgba(255,255,255,0.01)",borderTop:"1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth:1000,margin:"0 auto" }}>
          <div {...reveal("price-h")} style={{ textAlign:"center",marginBottom:60 }}>
            <div style={{ fontSize:11,color:ORANGE,fontWeight:700,textTransform:"uppercase",letterSpacing:"2px",marginBottom:10 }}>PRICING</div>
            <h2 style={{ fontSize:"clamp(26px,4vw,44px)",fontWeight:900,letterSpacing:"-1px" }}>
              Straightforward Pricing.<br/><span style={{color:ORANGE}}>Full Suite on Every Plan.</span>
            </h2>
            <p style={{ fontSize:13,color:"#64748b",marginTop:12 }}>Structural · Electrical · Sanitary included. ArchiCode & MechaniCode free when launched.</p>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:20,alignItems:"start" }}>
            {PRICING.map((p,i) => (
              <div key={i} className="pricing-card" {...reveal(`price-${i}`, i*0.12)}
                style={{ background:p.best?"rgba(6,150,215,0.05)":"#0f1624",border:`1.5px solid ${p.best?BLUE:"rgba(255,255,255,0.07)"}`,borderRadius:20,padding:"32px 28px",position:"relative",overflow:"hidden" }}>
                {p.best && <div style={{ position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${BLUE},${CYAN})` }}/>}
                {p.best && <div style={{ position:"absolute",top:16,right:14,fontSize:9,background:`rgba(6,150,215,0.15)`,color:BLUE,padding:"3px 8px",borderRadius:5,fontWeight:800,letterSpacing:"0.5px",border:`1px solid rgba(6,150,215,0.3)` }}>⭐ BEST VALUE</div>}
                <div style={{ fontWeight:800,fontSize:14,color:"#94a3b8",marginBottom:4 }}>{p.name}</div>
                <div style={{ fontSize:11,color:"#475569",marginBottom:14 }}>{p.desc}</div>
                <div style={{ display:"flex",alignItems:"baseline",gap:4,marginBottom:20 }}>
                  <span style={{ fontSize:38,fontWeight:900,color:p.color,fontFamily:"monospace",letterSpacing:"-1px" }}>{p.price}</span>
                  <span style={{ fontSize:13,color:"#475569" }}>{p.period}</span>
                </div>
                <div style={{ height:1,background:"rgba(255,255,255,0.06)",marginBottom:18 }}/>
                <div style={{ display:"flex",flexDirection:"column",gap:9,marginBottom:24 }}>
                  {p.features.map((f,j) => (
                    <div key={j} style={{ display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#94a3b8" }}>
                      <span style={{ color:GREEN,fontWeight:800,fontSize:13 }}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <button onClick={()=>setShowLogin(true)}
                  style={{ width:"100%",background:p.best?`linear-gradient(135deg,${BLUE},#0569a8)`:"transparent",border:`1.5px solid ${p.color}44`,color:p.best?"#fff":p.color,fontWeight:700,fontSize:13,padding:"12px",borderRadius:11,cursor:"pointer",transition:"all 0.15s" }}
                  onMouseEnter={e=>{if(!p.best)e.currentTarget.style.background=`${p.color}12`}}
                  onMouseLeave={e=>{if(!p.best)e.currentTarget.style.background="transparent"}}>
                  {p.best?"Get Started →":"Start Free Trial →"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding:"100px 40px",textAlign:"center",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,background:`radial-gradient(ellipse at 50% 50%,rgba(6,150,215,0.07),transparent 70%)`,pointerEvents:"none" }}/>
        <div {...reveal("cta-final")} style={{ position:"relative",maxWidth:660,margin:"0 auto" }}>
          <h2 style={{ fontSize:"clamp(26px,4vw,48px)",fontWeight:900,letterSpacing:"-1.5px",lineHeight:1.1,marginBottom:16 }}>
            Stop leaving money<br/><span style={{color:BLUE}}>on the table.</span>
          </h2>
          <p style={{ fontSize:15,color:"#64748b",marginBottom:36,lineHeight:1.75 }}>Join Filipino contractors and engineers using Buildify to estimate accurately, win more bids, and protect their margins — backed by 2025 PH market rates.</p>
          <button onClick={()=>setShowLogin(true)} className="cta-btn"
            style={{ background:`linear-gradient(135deg,${BLUE},#0569a8)`,border:"none",color:"#fff",fontWeight:800,fontSize:16,padding:"17px 48px",borderRadius:14,cursor:"pointer",boxShadow:`0 12px 48px rgba(6,150,215,0.45)`,letterSpacing:"-0.3px" }}>
            Start Free → Try BOM Review
          </button>
          <div style={{ marginTop:18,fontSize:11,color:"#475569" }}>No credit card required · Cancel anytime · NSCP · PEC · NPC · DPWH</div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:"1px solid rgba(255,255,255,0.05)",padding:"28px 40px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:26,height:26,borderRadius:7,background:`linear-gradient(135deg,${BLUE},#0569a8)`,display:"flex",alignItems:"center",justifyContent:"center" }}><BuildifyLogo size={22}/></div>
          <span style={{ fontWeight:800,fontSize:13,color:"#e8edf5" }}>Buildify</span>
          <span style={{ color:"#1e293b",fontSize:12 }}>·</span>
          <span style={{ fontSize:11,color:"#1e293b" }}>by Jon Ureta · Philippines · Powered by Claude AI</span>
        </div>
        <div style={{ fontSize:11,color:"#1e293b" }}>NSCP 2015 · PEC 2017 · NPC 2000 · DPWH Blue Book · NBC Philippines</div>
      </footer>

      {showLogin && <LoginModal onClose={()=>setShowLogin(false)} onSuccess={u=>{setShowLogin(false);onLogin(u);}}/>}
    </div>
  );
}

// ─── LOGIN MODAL ─────────────────────────────────────────────────────────────

export default LandingPage;
