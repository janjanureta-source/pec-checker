import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon, BuildifyLogo } from "../shared/Icon.jsx";
import { loadHistory, deleteHistoryEntry, clearHistory, DB, downloadHistoryReport } from "../../utils/history.js";
import { Card } from "../../theme.jsx";

function DashboardHome({ onNavigate }) {
  const [history,          setHistory]          = useState(loadHistory());
  const [activeModule,     setActiveModule]     = useState("all");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const handler = () => setHistory(loadHistory());
    window.addEventListener("buildify_history_update", handler);
    return () => window.removeEventListener("buildify_history_update", handler);
  }, []);

  const GOLD = "#f59e0b";
  const fmtR    = n => (+n||0).toLocaleString("en-PH", { maximumFractionDigits:0 });
  const fmtDate = iso => {
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.floor((now - d) / 60000);
    if (diffMin < 1)   return "just now";
    if (diffMin < 60)  return `${diffMin}m ago`;
    if (diffMin < 1440)return `${Math.floor(diffMin/60)}h ago`;
    return d.toLocaleDateString("en-PH",{month:"short",day:"numeric"}) + " · " +
           d.toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"});
  };

  const MODULE_FILTERS = [
    { v:"all",        l:"All",               color:"#94a3b8" },
    { v:"structural", l:"Structural",        color:"#0696d7" },
    { v:"electrical", l:"Electrical",        color:"#ff6b2b" },
    { v:"sanitary",   l:"Sanitary",          color:"#06b6d4" },
    { v:"engtools",   l:"Eng. Tools",        color:"#a78bfa" },
  ];

  const TOOL_META = {
    bom:        { icon:"bom",      label:"BOM Review",        module:"engtools",   color:"#0696d7" },
    estimate:   { icon:"estimate", label:"Cost Estimator",    module:"engtools",   color:"#f59e0b" },
    structural: { icon:"checker",  label:"Structural Check",  module:"structural", color:"#0696d7" },
    seismic:    { icon:"seismic",  label:"Seismic Load",      module:"structural", color:"#0696d7" },
    beam:       { icon:"beam",     label:"Beam Design",       module:"structural", color:"#0696d7" },
    column:     { icon:"column",   label:"Column Design",     module:"structural", color:"#0696d7" },
    footing:    { icon:"footing",  label:"Footing Design",    module:"structural", color:"#0696d7" },
    slab:       { icon:"slab",     label:"Slab Design",       module:"structural", color:"#0696d7" },
    loads:      { icon:"loads",    label:"Load Combos",       module:"structural", color:"#0696d7" },
    electrical: { icon:"checker",  label:"Electrical Check",  module:"electrical", color:"#ff6b2b" },
    vdrop:      { icon:"vdrop",    label:"Voltage Drop",      module:"electrical", color:"#ff6b2b" },
    fault:      { icon:"fault",    label:"Short Circuit",     module:"electrical", color:"#ff6b2b" },
    load:       { icon:"loads",    label:"Load Calc",         module:"electrical", color:"#ff6b2b" },
    panel:      { icon:"panel",    label:"Panel Schedule",    module:"electrical", color:"#ff6b2b" },
    conduit:    { icon:"conduit",  label:"Conduit Fill",      module:"electrical", color:"#ff6b2b" },
    ampacity:   { icon:"ampacity", label:"Ampacity Derate",   module:"electrical", color:"#ff6b2b" },
    plumbing:   { icon:"checker",  label:"Plumbing Check",    module:"sanitary",   color:"#06b6d4" },
    fixture:    { icon:"fixture",  label:"Fixture Units",     module:"sanitary",   color:"#06b6d4" },
    pipe:       { icon:"pipe",     label:"Pipe Sizing",       module:"sanitary",   color:"#06b6d4" },
    septic:     { icon:"septic",   label:"Septic Tank",       module:"sanitary",   color:"#06b6d4" },
    water:      { icon:"water",    label:"Water Demand",      module:"sanitary",   color:"#06b6d4" },
    pressure:   { icon:"pressure", label:"Pressure Loss",     module:"sanitary",   color:"#06b6d4" },
    storm:      { icon:"storm",    label:"Storm Drainage",    module:"sanitary",   color:"#06b6d4" },
  };

  const filtered   = activeModule === "all" ? history : history.filter(e => e.module === activeModule);
  const recent3    = [...history].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)).slice(0,3);

  // Stats
  const totalRuns     = history.length;
  const bomReviews    = history.filter(e => e.tool === "bom").length;
  const estimates     = history.filter(e => e.tool === "estimate").length;
  const planChecks    = history.filter(e => ["electrical","structural","plumbing"].includes(e.tool)).length;
  const totalSavings  = history.filter(e=>e.tool==="bom"&&e.meta?.totalHigh).reduce((s,e)=>s+(e.meta.totalHigh||0),0);
  const totalEstimated= history.filter(e=>e.tool==="estimate"&&e.meta?.totalHigh).reduce((s,e)=>s+(e.meta.totalHigh||0),0);

  // Week-over-week trend
  const now   = Date.now();
  const week  = 7*24*60*60*1000;
  const thisW = history.filter(e=>now-new Date(e.timestamp)<week).length;
  const lastW = history.filter(e=>{ const a=now-new Date(e.timestamp); return a>=week&&a<2*week; }).length;
  const trend = thisW - lastW;

  const QUICK_LAUNCH = [
    { icon:"bom",      label:"BOM Review",       sub:"Upload plan + BOM",      module:"structural", tool:"bom",      color:"#0696d7", grad:"135deg,#0696d7,#0569a8", badge:"⭐ Flagship", hero:true },
    { icon:"estimate", label:"Cost Estimator",   sub:"Upload plan → estimate", module:"structural", tool:"estimate", color:"#f59e0b", grad:"135deg,#f59e0b,#f97316", badge:"AI" },
    { icon:"checker",  label:"Electrical Check", sub:"PEC 2017 compliance",    module:"electrical", tool:"checker",  color:"#ff6b2b", grad:"135deg,#ff6b2b,#e85520" },
    { icon:"checker",  label:"Structural Check", sub:"NSCP 2015 compliance",   module:"structural", tool:"checker",  color:"#0696d7", grad:"135deg,#0696d7,#0569a8" },
    { icon:"fixture",  label:"Plumbing Check",   sub:"NPC 2000 compliance",    module:"sanitary",   tool:"checker",  color:"#06b6d4", grad:"135deg,#06b6d4,#0891b2" },
    { icon:"vdrop",    label:"Voltage Drop",      sub:"PEC wire sizing",        module:"electrical", tool:"vdrop",    color:"#ff6b2b", grad:"135deg,#ff6b2b,#e85520" },
    { icon:"seismic",  label:"Seismic Load",      sub:"NSCP zone & base shear", module:"structural", tool:"seismic",  color:"#0696d7", grad:"135deg,#0696d7,#0569a8" },
    { icon:"water",    label:"Water Demand",      sub:"NPC fixture demand",     module:"sanitary",   tool:"water",    color:"#06b6d4", grad:"135deg,#06b6d4,#0891b2" },
  ];

  const STATUS_COLOR = { "COMPLIANT":"#10b981","COMPLIANT WITH WARNINGS":"#f59e0b","NON-COMPLIANT":"#ef4444" };

  const hero = QUICK_LAUNCH.find(q=>q.hero);
  const rest = QUICK_LAUNCH.filter(q=>!q.hero);

  return (
    <div style={{ animation:"fadeIn 0.3s ease" }}>

      {/* ── Greeting header ── */}
      {(() => {
        const hr = new Date().getHours();
        const greet = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
        return (
          <div style={{ marginBottom:24, display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontWeight:900, fontSize:24, color:T.text, letterSpacing:"-0.5px", marginBottom:3 }}>
                {greet} 👋
              </div>
              <div style={{ fontSize:13, color:T.muted }}>
                Your engineering workspace — {history.length > 0 ? `${history.length} run${history.length!==1?"s":""} logged` : "ready to go"}
              </div>
            </div>
            {history.length > 0 && (
              <div style={{ display:"flex", gap:8 }}>
                {[
                  { mod:"structural", color:"#0696d7", label:"Structural" },
                  { mod:"electrical", color:"#ff6b2b", label:"Electrical" },
                  { mod:"sanitary",   color:"#06b6d4", label:"Sanitary" },
                ].map(m => {
                  const cnt = history.filter(e=>e.module===m.mod).length;
                  if (!cnt) return null;
                  return (
                    <div key={m.mod} style={{ display:"flex", alignItems:"center", gap:5,
                      padding:"4px 10px", borderRadius:20,
                      background:`${m.color}12`, border:`1px solid ${m.color}30` }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:m.color, display:"inline-block" }}/>
                      <span style={{ fontSize:11, fontWeight:700, color:m.color }}>{cnt}</span>
                      <span style={{ fontSize:10, color:T.muted }}>{m.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Stats Row ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:10, marginBottom:24 }}>
        {[
          { icon:"loads",    label:"Total Runs",        value:totalRuns,               color:"#94a3b8", sub: trend>0?`↑${trend} this week`:trend<0?`↓${Math.abs(trend)} this week`:"—" },
          { icon:"bom",      label:"BOM Reviews",       value:bomReviews,              color:"#0696d7", sub:"structural" },
          { icon:"estimate", label:"Estimates Made",    value:estimates,               color:"#f59e0b", sub:"cost estimator" },
          { icon:"checker",  label:"Plan Checks",       value:planChecks,              color:"#8b5cf6", sub:"all modules" },
          { icon:"water",    label:"BOM Value Caught",  value:`₱${fmtR(totalSavings)}`,  color:"#22c55e", sub:"vs market rate" },
          { icon:"beam",     label:"Est. Project Value",value:`₱${fmtR(totalEstimated)}`, color:"#f97316", sub:"from estimator" },
        ].map(s => (
          <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px" }}>
            <div style={{ fontSize:9, color:T.muted, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:6, display:"flex", alignItems:"center", gap:5 }}>
              <Icon name={s.icon} size={11} color={s.color}/> {s.label}
            </div>
            <div style={{ fontSize:20, fontWeight:900, color:s.color, fontFamily:"monospace", letterSpacing:"-0.5px" }}>{s.value||0}</div>
            {s.sub && <div style={{ fontSize:10, color:trend>0&&s.label==="Total Runs"?"#22c55e":T.muted, marginTop:3, fontWeight:s.label==="Total Runs"&&trend!==0?700:400 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Recently Used ── */}
      {recent3.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:800, color:T.muted, textTransform:"uppercase", letterSpacing:"1px", marginBottom:12 }}>
            ⚡ Recently Used
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:10 }}>
            {recent3.map((entry, idx) => {
              const meta = TOOL_META[entry.tool] || { icon:"report", label:entry.tool, color:"#94a3b8" };
              return (
                <button key={entry.id} onClick={() => onNavigate(entry.module, entry.tool)}
                  style={{ background:T.card, border:`1.5px solid ${T.border}`, borderRadius:12,
                    padding:"14px 16px", cursor:"pointer", textAlign:"left", transition:"all 0.2s",
                    display:"flex", flexDirection:"column", gap:8, position:"relative", overflow:"hidden" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=meta.color;e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=`0 4px 20px ${meta.color}20`;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                  {/* Subtle color accent bar */}
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${meta.color},transparent)`, borderRadius:"12px 12px 0 0" }}/>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:30, height:30, borderRadius:8, background:`${meta.color}18`, border:`1.5px solid ${meta.color}35`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Icon name={meta.icon} size={15} color={meta.color}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:800, fontSize:12, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {entry.projectName || "Untitled Project"}
                      </div>
                      <div style={{ fontSize:10, color:T.muted }}>{meta.label}</div>
                    </div>
                    <span style={{ fontSize:10, color:T.muted, flexShrink:0 }}>{fmtDate(entry.timestamp)}</span>
                  </div>
                  {(entry.meta?.totalHigh || entry.meta?.findings || entry.meta?.status) && (
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {entry.meta?.status && <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:4, background:`${STATUS_COLOR[entry.meta.status]||"#94a3b8"}18`, color:STATUS_COLOR[entry.meta.status]||"#94a3b8" }}>{entry.meta.status}</span>}
                      {entry.meta?.totalHigh && <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:4, background:"rgba(16,185,129,0.1)", color:"#10b981", fontFamily:"monospace" }}>₱{fmtR(entry.meta.totalHigh)}</span>}
                      {entry.meta?.findings && <span style={{ fontSize:9, color:T.muted, padding:"2px 7px", borderRadius:4, background:`${T.border}` }}>{entry.meta.findings} findings</span>}
                    </div>
                  )}
                  <div style={{ fontSize:10, color:meta.color, fontWeight:700 }}>Resume →</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quick Launch ── */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:12, fontWeight:800, color:T.muted, textTransform:"uppercase", letterSpacing:"1px", marginBottom:12 }}>Quick Launch</div>

        {/* Hero card — BOM Review */}
        <button onClick={() => onNavigate(hero.module, hero.tool)}
          style={{ width:"100%", marginBottom:10, background:`linear-gradient(135deg,rgba(6,150,215,0.12),rgba(6,150,215,0.05))`,
            border:`1.5px solid rgba(6,150,215,0.35)`, borderRadius:14, padding:"20px 22px",
            cursor:"pointer", textAlign:"left", transition:"all 0.2s", display:"flex", alignItems:"center", gap:18 }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#0696d7";e.currentTarget.style.background="rgba(6,150,215,0.15)";e.currentTarget.style.transform="translateY(-1px)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(6,150,215,0.35)";e.currentTarget.style.background="linear-gradient(135deg,rgba(6,150,215,0.12),rgba(6,150,215,0.05))";e.currentTarget.style.transform="translateY(0)";}}>
          <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#0696d7,#0569a8)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 6px 20px rgba(6,150,215,0.35)" }}>
            <Icon name={hero.icon} size={26} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <div style={{ fontWeight:900, fontSize:17, color:T.text }}>{hero.label}</div>
              <span style={{ fontSize:9, background:"rgba(245,158,11,0.2)", color:GOLD, padding:"2px 7px", borderRadius:5, fontWeight:800 }}>{hero.badge}</span>
            </div>
            <div style={{ fontSize:12, color:T.muted }}>Cross-reference your bill of materials against AI market pricing. Catch under-estimations before they become losses.</div>
          </div>
          <div style={{ fontSize:13, color:"#0696d7", fontWeight:800, flexShrink:0 }}>Open →</div>
        </button>

        {/* Rest of tools — 4-column grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))", gap:10 }}>
          {rest.map(q => (
            <button key={q.label} onClick={() => onNavigate(q.module, q.tool)}
              style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px",
                cursor:"pointer", textAlign:"left", transition:"all 0.2s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=q.color;e.currentTarget.style.background=`${q.color}0d`;e.currentTarget.style.transform="translateY(-1px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.card;e.currentTarget.style.transform="translateY(0)";}}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(${q.grad})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 3px 10px ${q.color}30` }}>
                  <Icon name={q.icon} size={16} color="#fff"/>
                </div>
                <div style={{ fontWeight:800, fontSize:12, color:T.text }}>{q.label}</div>
                {q.badge && <span style={{ fontSize:8, background:"rgba(245,158,11,0.15)", color:GOLD, padding:"2px 5px", borderRadius:4, fontWeight:800, marginLeft:"auto" }}>{q.badge}</span>}
              </div>
              <div style={{ fontSize:10, color:T.muted, marginBottom:8 }}>{q.sub}</div>
              <div style={{ fontSize:10, color:q.color, fontWeight:700 }}>Open →</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── History ── */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:12, fontWeight:800, color:T.muted, textTransform:"uppercase", letterSpacing:"1px" }}>📂 History</div>
          <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
            {MODULE_FILTERS.map(f => (
              <button key={f.v} onClick={() => setActiveModule(f.v)}
                style={{ padding:"4px 10px", borderRadius:7, border:`1.5px solid ${activeModule===f.v?f.color:T.border}`,
                  background:activeModule===f.v?`${f.color}18`:"transparent",
                  color:activeModule===f.v?f.color:T.muted, cursor:"pointer", fontSize:10, fontWeight:700, transition:"all 0.15s" }}>
                {f.l}
              </button>
            ))}
            {history.length > 0 && (
              showClearConfirm
                ? <div style={{ display:"flex", gap:4 }}>
                    <button onClick={()=>{clearHistory();setShowClearConfirm(false);}} style={{ padding:"4px 10px", borderRadius:7, border:"1px solid #ef4444", background:"rgba(239,68,68,0.1)", color:"#ef4444", cursor:"pointer", fontSize:10, fontWeight:700 }}>Confirm Clear</button>
                    <button onClick={()=>setShowClearConfirm(false)} style={{ padding:"4px 10px", borderRadius:7, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, cursor:"pointer", fontSize:10 }}>Cancel</button>
                  </div>
                : <button onClick={()=>setShowClearConfirm(true)} style={{ padding:"4px 10px", borderRadius:7, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, cursor:"pointer", fontSize:10 }}>Clear All</button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"48px 24px", textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
            <div style={{ fontWeight:700, color:T.text, marginBottom:6, fontSize:15 }}>No history yet</div>
            <div style={{ fontSize:12, color:T.muted, marginBottom:20 }}>Run any tool and your results are saved automatically</div>
            <button onClick={()=>onNavigate("structural","bom")}
              style={{ padding:"9px 20px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#0696d7,#0569a8)", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700 }}>
              Start with BOM Review →
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {filtered.map(entry => {
              const meta = TOOL_META[entry.tool] || { icon:"report", label:entry.tool, color:"#94a3b8" };
              return (
                <div key={entry.id}
                  style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"12px 16px",
                    display:"flex", alignItems:"center", gap:12, transition:"all 0.15s" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=meta.color;e.currentTarget.style.background=`${meta.color}06`;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.card;}}>
                  <div style={{ width:34, height:34, borderRadius:9, background:`${meta.color}18`, border:`1.5px solid ${meta.color}40`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon name={meta.icon||"report"} size={16} color={meta.color}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                      <span style={{ fontWeight:800, fontSize:13, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{entry.projectName||"Untitled Project"}</span>
                      <span style={{ fontSize:9, background:`${meta.color}18`, color:meta.color, padding:"2px 6px", borderRadius:4, fontWeight:700, flexShrink:0 }}>{meta.label}</span>
                      {entry.meta?.status && <span style={{ fontSize:9, background:`${STATUS_COLOR[entry.meta.status]||"#94a3b8"}18`, color:STATUS_COLOR[entry.meta.status]||"#94a3b8", padding:"2px 6px", borderRadius:4, fontWeight:700, flexShrink:0 }}>{entry.meta.status}</span>}
                    </div>
                    <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
                      <span style={{ fontSize:10, color:T.muted }}>{fmtDate(entry.timestamp)}</span>
                      {entry.meta?.totalHigh && <span style={{ fontSize:10, color:"#10b981", fontWeight:700, fontFamily:"monospace" }}>₱{fmtR(entry.meta.totalHigh)}</span>}
                      {entry.meta?.findings  && <span style={{ fontSize:10, color:T.muted }}>{entry.meta.findings} findings</span>}
                      {entry.meta?.summary   && <span style={{ fontSize:10, color:T.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:280 }}>{entry.meta.summary}</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button onClick={()=>downloadHistoryReport(entry,meta)} title="Download Report"
                      style={{ padding:"5px 9px", borderRadius:7, border:`1px solid ${T.border}`, background:"rgba(6,150,215,0.08)", color:"#0696d7", cursor:"pointer", fontSize:10, display:"flex", alignItems:"center", gap:4, fontWeight:700 }}>
                      <Icon name="download" size={12} color="#0696d7"/> Report
                    </button>
                    <button onClick={()=>onNavigate(entry.module, entry.tool)} title="Open Tool"
                      style={{ padding:"5px 9px", borderRadius:7, border:`1px solid ${meta.color}40`, background:`${meta.color}10`, color:meta.color, cursor:"pointer", fontSize:10, fontWeight:700, display:"flex", alignItems:"center", gap:4 }}>
                      <Icon name="open" size={12} color={meta.color}/> Open
                    </button>
                    <button onClick={()=>deleteHistoryEntry(entry.id)} title="Delete"
                      style={{ padding:"5px 8px", borderRadius:7, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, cursor:"pointer", display:"flex", alignItems:"center" }}>
                      <Icon name="trash" size={12} color="#64748b"/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}




// ─── ROOT APP ────────────────────────────────────────────────────────────────
const TABS = [
  { key:"structural", icon:"structural", label:"Structural", color:"#0696d7" },
  { key:"electrical", icon:"electrical", label:"Electrical", color:"#ff6b2b" },
  { key:"sanitary",   icon:"sanitary",   label:"Sanitary",    color:"#06b6d4" },
];

// ─── AUTH CONFIG ─────────────────────────────────────────────────────────────
const ADMIN_USER = "admin";
const ADMIN_PASS = "PHEngSuite2025!";

// ─── LANDING PAGE ────────────────────────────────────────────────────────────

export default DashboardHome;
