import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon, BuildifyLogo } from "../shared/Icon.jsx";
import { loadHistory, DB } from "../../utils/history.js";
import DashboardHome from "./DashboardHome.jsx";
import StructiCode from "../structural/StructiCode.jsx";
import ElecCode from "../electrical/ElecCode.jsx";
import SaniCode from "../sanitary/SaniCode.jsx";
import EngineeringTools from "../engtools/EngineeringTools.jsx";
import { Card, Label } from "../../theme.jsx";

function Dashboard({ user, onLogout }) {
  const [module,         setModule]         = useState("home");
  const [structTool,     setStructTool]     = useState("bom");
  const [history,        setHistory]        = useState(loadHistory());
  const [sidebarOpen,    setSidebarOpen]    = useState(() => {
    try { return localStorage.getItem("buildify_sidebar") !== "collapsed"; } catch { return true; }
  });
  // sessionTick: incremented each time user navigates to a module (triggers session reload in child)
  const [sessionTick, setSessionTick] = useState({ structural:0, electrical:0, sanitary:0, engtools:0 });
  // Track which modules have been visited — they mount on first visit and stay mounted
  const [visited, setVisited] = useState(new Set());



  // Keep history live for sidebar pills
  useEffect(() => {
    const handler = () => setHistory(loadHistory());
    window.addEventListener("buildify_history_update", handler);
    return () => window.removeEventListener("buildify_history_update", handler);
  }, []);

  // Restore previously-visited modules so state survives page refresh
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("buildify_visited_modules") || "[]");
      if (saved.length) setVisited(new Set(saved));
    } catch {}
  }, []);

  // Persist visited modules whenever they change
  useEffect(() => {
    try { localStorage.setItem("buildify_visited_modules", JSON.stringify([...visited])); } catch {}
  }, [visited]);

  const toggleSidebar = () => setSidebarOpen(p => {
    const next = !p;
    try { localStorage.setItem("buildify_sidebar", next ? "open" : "collapsed"); } catch {}
    return next;
  });

  const navigateTo = (mod, tool) => {
    setModule(mod);
    if (mod !== "home") setVisited(p => new Set([...p, mod]));
    if (mod === "structural" && tool) setStructTool(tool === "checker" ? "checker" : tool);
    // Increment tick to trigger session reload in the module
    if (mod !== "home") setSessionTick(p => ({ ...p, [mod]: (p[mod]||0) + 1 }));
  };

  const [apiKey, setApiKey] = useState(() => {
    const saved = localStorage.getItem("phen_key") || "";
    if (saved) { window.__PHEN_KEY__ = saved; }
    return saved;
  });

  // Per-module activity stats for sidebar pills
  const modStats = (mod) => {
    const entries = history.filter(e => e.module === mod);
    if (!entries.length) return null;
    const latest = entries.sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp))[0];
    const diffMin = Math.floor((Date.now() - new Date(latest.timestamp)) / 60000);
    const age = diffMin < 60 ? `${diffMin}m ago` : diffMin < 1440 ? `${Math.floor(diffMin/60)}h ago`
              : `${Math.floor(diffMin/1440)}d ago`;
    const hasSession = DB.hasSession(mod);
    return { count: entries.length, age, hasSession };
  };

  const SB = sidebarOpen ? 230 : 58;
  const NAV_ITEMS = [
    { key:"home",       icon:"home",       label:"Home",          color:"#0696d7", sub:null       },
    { key:"structural", icon:"structural", label:"Structural",    color:"#0696d7", sub:"NSCP 2015" },
    { key:"electrical", icon:"electrical", label:"Electrical",    color:"#ff6b2b", sub:"PEC 2017"  },
    { key:"sanitary",   icon:"sanitary",   label:"Sanitary",      color:"#06b6d4", sub:"NPC 2000"  },
    { key:"engtools",   icon:"wrench",     label:"Eng. Tools",    color:"#a78bfa", sub:"BOM · Estimates" },
  ];

  // Module page titles & subtitles
  const PAGE_META = {
    home:       { title:"Dashboard",        sub:null },
    structural: { title:"Structural",       sub:"NSCP 2015 7th Edition · DPWH Blue Book" },
    electrical: { title:"Electrical",       sub:"PEC 2017 · RA 9514 (FSIC) · Green Building Code" },
    sanitary:   { title:"Sanitary",         sub:"National Plumbing Code 2000 · PD 856 Sanitation Code" },
    engtools:   { title:"Engineering Tools",sub:"BOM Review · Cost Estimator" },
  };



  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'Sora','DM Sans','Segoe UI',sans-serif", display:"flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{box-shadow:0 0 40px rgba(245,158,11,0.15)}50%{box-shadow:0 0 80px rgba(245,158,11,0.3)}}
        input::-webkit-inner-spin-button{-webkit-appearance:none}
        .sidebar-transition{transition:width 0.22s cubic-bezier(0.4,0,0.2,1)}
        .nav-item-label{transition:opacity 0.15s,width 0.22s;white-space:nowrap;overflow:hidden}
      `}</style>

      {/* ── SIDEBAR ── */}
      <div className="sidebar-transition" style={{ width:SB, flexShrink:0, background:"rgba(15,17,23,0.98)", borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, height:"100vh", zIndex:200, overflow:"hidden" }}>

        {/* Logo + toggle */}
        <div style={{ padding:"14px 12px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10, minHeight:58 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#0696d7,#0569a8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0, boxShadow:"0 4px 14px rgba(6,150,215,0.35)", cursor:"pointer" }} onClick={toggleSidebar}><BuildifyLogo size={26}/></div>
          {sidebarOpen && (
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:13, color:T.text, letterSpacing:"-0.3px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>Buildify</div>
              <div style={{ fontSize:9, color:T.muted, letterSpacing:"0.5px" }}>by Jon Ureta · PH</div>
            </div>
          )}
          {sidebarOpen && (
            <button onClick={toggleSidebar} style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.muted, borderRadius:6, width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:12, flexShrink:0 }}>◀</button>
          )}
        </div>

        {/* Nav items */}
        <div style={{ flex:1, padding:"10px 8px", display:"flex", flexDirection:"column", gap:3, overflowY:"auto" }}>
          {NAV_ITEMS.map(item => {
            const active = module === item.key;
            const stats  = item.key !== "home" ? modStats(item.key) : null;
            return (
              <button key={item.key} onClick={() => { setModule(item.key); if (item.key !== "home") setVisited(p => new Set([...p, item.key])); }}
                title={!sidebarOpen ? item.label : undefined}
                style={{ display:"flex", alignItems:"center", gap:10,
                  padding: sidebarOpen ? "9px 12px" : "10px 0",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  borderRadius:10,
                  border:`1.5px solid ${active ? item.color+"55" : "transparent"}`,
                  background: active ? `${item.color}14` : "transparent",
                  color: active ? item.color : T.muted,
                  cursor:"pointer", fontSize:13, fontWeight:active?800:600,
                  transition:"all 0.15s", width:"100%", textAlign:"left",
                  position:"relative" }}
                onMouseEnter={e=>{ if(!active){ e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.color=T.text; }}}
                onMouseLeave={e=>{ if(!active){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color=T.muted; }}}>

                {/* Icon — with dot indicator when collapsed */}
                <span style={{ flexShrink:0, display:"flex", alignItems:"center", position:"relative" }}>
                  <Icon name={item.icon} size={18} color={active ? item.color : "#64748b"}/>
                  {/* Activity dot — only when sidebar collapsed & has runs or saved session */}
                  {!sidebarOpen && stats && (stats.count > 0 || stats.hasSession) && (
                    <span style={{ position:"absolute", top:-2, right:-2, width:7, height:7,
                      borderRadius:"50%", background: stats.hasSession ? item.color : "#64748b",
                      border:"1.5px solid #0f1118", display:"block" }}/>
                  )}
                </span>

                {/* Label + pills — only when sidebar open */}
                {sidebarOpen && (
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:6 }}>
                      <span style={{ fontSize:13, fontWeight:active?800:600, whiteSpace:"nowrap",
                        overflow:"hidden", textOverflow:"ellipsis" }}>
                        {item.label}
                      </span>
                      {/* Run count pill */}
                      {stats && (
                        <span style={{ fontSize:9, fontWeight:800, padding:"1px 6px", borderRadius:20,
                          background: active ? `${item.color}30` : "rgba(100,116,139,0.15)",
                          color: active ? item.color : T.muted,
                          flexShrink:0, whiteSpace:"nowrap" }}>
                          {stats.count} run{stats.count !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {/* Last used time + saved session indicator — only show when not active */}
                    {stats && !active && (
                      <div style={{ fontSize:9, color:"rgba(100,116,139,0.6)", marginTop:1, display:"flex", alignItems:"center", gap:5 }}>
                        <span>Last: {stats.age}</span>
                        {stats.hasSession && (
                          <span style={{ fontSize:8, fontWeight:800, padding:"1px 5px", borderRadius:3,
                            background:`${item.color}18`, color:item.color }}>
                            SAVED
                          </span>
                        )}
                      </div>
                    )}
                    {/* Sub-label when active */}
                    {active && item.sub && (
                      <div style={{ fontSize:9, color:`${item.color}80`, marginTop:1 }}>
                        {item.sub}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}

          {/* ── Coming Soon modules ── */}
          {sidebarOpen && (
            <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${T.border}` }}>
              <div style={{ fontSize:9, color:T.muted, fontWeight:700, textTransform:"uppercase",
                letterSpacing:"0.8px", padding:"0 12px", marginBottom:6 }}>Coming Soon</div>
              {[
                { label:"ArchiCode",   color:"#a78bfa", sub:"Architecture" },
                { label:"MechaniCode", color:"#94a3b8", sub:"Mechanical" },
              ].map(cs => (
                <div key={cs.label}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                    borderRadius:10, opacity:0.45, cursor:"default" }}>
                  <span style={{ width:18, height:18, borderRadius:5, background:`${cs.color}20`,
                    border:`1px dashed ${cs.color}50`, flexShrink:0, display:"flex",
                    alignItems:"center", justifyContent:"center", fontSize:9 }}>?</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.muted, whiteSpace:"nowrap" }}>{cs.label}</div>
                    <div style={{ fontSize:9, color:"rgba(100,116,139,0.5)" }}>{cs.sub}</div>
                  </div>
                  <span style={{ fontSize:8, fontWeight:800, padding:"1px 5px", borderRadius:3,
                    background:"rgba(100,116,139,0.1)", color:T.muted }}>SOON</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expand button when collapsed */}
        {!sidebarOpen && (
          <div style={{ padding:"6px 8px", borderTop:`1px solid ${T.border}` }}>
            <button onClick={toggleSidebar} title="Expand sidebar"
              style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.muted,
                borderRadius:8, width:"100%", height:28, display:"flex", alignItems:"center",
                justifyContent:"center", cursor:"pointer", fontSize:11 }}>▶</button>
          </div>
        )}

        {/* User badge at bottom */}
        <div style={{ padding:"10px 8px", borderTop:`1px solid ${T.border}` }}>
          {sidebarOpen ? (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.15)", borderRadius:10 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#f59e0b,#f97316)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#000", flexShrink:0 }}>{user.username[0].toUpperCase()}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.username}</div>
                <div style={{ fontSize:9, color:T.accent, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>{user.role}</div>
              </div>
              <button onClick={onLogout} title="Sign out" style={{ background:"transparent", border:"none", color:T.muted, cursor:"pointer", fontSize:14, padding:2 }}><Icon name="signout" size={16} color="#ef4444"/></button>
            </div>
          ) : (
            <button onClick={onLogout} title="Sign out" style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.muted, borderRadius:8, width:"100%", height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:14 }}><Icon name="signout" size={16} color="#ef4444"/></button>
          )}
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div style={{ marginLeft:SB, flex:1, display:"flex", flexDirection:"column", minWidth:0, transition:"margin-left 0.22s cubic-bezier(0.4,0,0.2,1)" }}>

        {/* Top bar */}
        <div style={{ background:"rgba(22,27,39,0.95)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${T.border}`, position:"sticky", top:0, zIndex:100 }}>
          <div style={{ padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:58 }}>
            {/* Page title */}
            <div style={{ display:"flex", flexDirection:"column", justifyContent:"center" }}>
              <div style={{ fontWeight:800, fontSize:15, color:T.text, lineHeight:1.2 }}>
                {PAGE_META[module]?.title || "Dashboard"}
              </div>
              {PAGE_META[module]?.sub && (
                <div style={{ fontSize:10, color:T.muted, marginTop:1 }}>
                  {PAGE_META[module].sub}
                </div>
              )}
            </div>
            {/* API key + user */}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(0,0,0,0.3)",border:`1.5px solid ${apiKey.startsWith("sk-")?"#22c55e":"rgba(6,150,215,0.5)"}`,borderRadius:9,padding:"4px 4px 4px 10px",minWidth:200}}>
                <span style={{fontSize:11,whiteSpace:"nowrap",color:apiKey.startsWith("sk-")?"#10b981":"#f59e0b",fontWeight:700}}>🔑</span>
                <input type="password" value={apiKey}
                  onChange={e => { const v=e.target.value; setApiKey(v); window.__PHEN_KEY__=v; if(v.startsWith("sk-")) localStorage.setItem("phen_key",v); }}
                  onKeyDown={e => { if(e.key==="Enter" && apiKey.startsWith("sk-")){ window.__PHEN_KEY__=apiKey; localStorage.setItem("phen_key",apiKey); }}}
                  placeholder={apiKey.startsWith("sk-") ? "API key saved ✓" : "Paste sk-ant-... key"}
                  style={{background:"transparent",border:"none",outline:"none",color:apiKey.startsWith("sk-")?"#10b981":T.text,fontSize:11,fontFamily:"monospace",width:140,padding:"2px 0"}}/>
                {apiKey.startsWith("sk-")
                  ? <span style={{fontSize:10,background:"rgba(16,185,129,0.15)",color:"#10b981",padding:"3px 7px",borderRadius:6,fontWeight:700}}>✓</span>
                  : <button onClick={()=>{if(apiKey.startsWith("sk-")){window.__PHEN_KEY__=apiKey;localStorage.setItem("phen_key",apiKey);}}} style={{background:"linear-gradient(135deg,#f59e0b,#f97316)",border:"none",color:"#000",fontWeight:700,padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:11}}>Save</button>}
              </div>
            </div>
          </div>
          {!apiKey.startsWith("sk-") && (
            <div style={{ borderTop:`1px solid rgba(245,158,11,0.3)`, background:"rgba(245,158,11,0.07)", padding:"8px 24px" }}>
              <div style={{ fontSize:12, color:"#f59e0b" }}>⚠️ <strong>API key required.</strong> Paste your Anthropic key above (starts with <code style={{background:"rgba(0,0,0,0.3)",padding:"1px 5px",borderRadius:3}}>sk-ant-</code>). Get yours at <strong>console.anthropic.com → API Keys</strong>.</div>
            </div>
          )}

        </div>

        {/* Page content — lazy first-mount: each module mounts on first visit, then stays mounted */}
        <div style={{ flex:1, padding:"28px 24px", maxWidth:1060, width:"100%" }}>
          {module==="home" && <DashboardHome onNavigate={navigateTo}/>}

          {/* Electrical — mounts on first visit, stays mounted after */}
          {visited.has("electrical") && (
            <div style={{ display: module==="electrical" ? "block" : "none" }}>
              <ElecCode apiKey={apiKey} sessionTick={sessionTick.electrical}/>
            </div>
          )}

          {/* Structural — mounts on first visit, stays mounted after */}
          {visited.has("structural") && (
            <div style={{ display: module==="structural" ? "block" : "none" }}>
              <div style={{ marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#0696d7,#0569a8)", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="structural" size={16} color="#0696d7"/></div>
                <div>
                  <div style={{ fontWeight:800, fontSize:18, color:T.text }}>Structural</div>
                  <div style={{ fontSize:11, color:T.muted }}>NSCP 2015 7th Edition · DPWH Blue Book</div>
                </div>
              </div>
              <Card>
                <StructiCode apiKey={apiKey} initialTool={structTool} sessionTick={sessionTick.structural}/>
              </Card>
            </div>
          )}

          {/* Sanitary — mounts on first visit, stays mounted after */}
          {visited.has("sanitary") && (
            <div style={{ display: module==="sanitary" ? "block" : "none" }}>
              <div style={{ marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#06b6d4,#0891b2)", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="sanitary" size={16} color="#06b6d4"/></div>
                <div>
                  <div style={{ fontWeight:800, fontSize:18, color:T.text }}>Sanitary</div>
                  <div style={{ fontSize:11, color:T.muted }}>National Plumbing Code 2000 · PD 856 Sanitation Code</div>
                </div>
              </div>
              <Card>
                <SaniCode apiKey={apiKey} sessionTick={sessionTick.sanitary}/>
              </Card>
            </div>
          )}

          {/* Engineering Tools — mounts on first visit, stays mounted after */}
          {visited.has("engtools") && (
            <div style={{ display: module==="engtools" ? "block" : "none" }}>
              <div style={{ marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#a78bfa,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="wrench" size={15} color="#fff"/></div>
                <div>
                  <div style={{ fontWeight:800, fontSize:18, color:T.text }}>Engineering Tools</div>
                  <div style={{ fontSize:11, color:T.muted }}>BOM Review · Cost Estimator</div>
                </div>
              </div>
              <EngineeringTools apiKey={apiKey} sessionTick={sessionTick.engtools}/>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop:`1px solid ${T.border}`, padding:"16px 24px", textAlign:"center" }}>
          <div style={{ fontSize:12, color:"rgba(100,116,139,0.4)" }}>
            Buildify · Developed by <strong style={{ color:T.muted }}>Jon Ureta</strong> · Philippines · Powered by Claude AI
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
