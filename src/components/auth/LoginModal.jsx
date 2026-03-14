import React, { useState, useEffect, useRef, useCallback } from "react";
import { T, Card, Label, Input } from "../../theme.jsx";
import { Icon, BuildifyLogo } from "../shared/Icon.jsx";

// ─── AUTH CONFIG ─────────────────────────────────────────────────────────────
const ADMIN_USER = "admin";
const ADMIN_PASS = "PHEngSuite2025!";

function LoginModal({ onClose, onSuccess }) {
  const [user, setUser]   = useState("");
  const [pass, setPass]   = useState("");
  const [err,  setErr]    = useState("");
  const [busy, setBusy]   = useState(false);

  const submit = () => {
    if (!user || !pass) { setErr("Please enter username and password."); return; }
    setBusy(true); setErr("");
    setTimeout(() => {
      if (user === ADMIN_USER && pass === ADMIN_PASS) {
        onSuccess({ username: user, role: "admin" });
      } else {
        setErr("Invalid credentials. Please try again.");
        setBusy(false);
      }
    }, 600);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:999, background:"rgba(8,12,24,0.92)", backdropFilter:"blur(16px)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, animation:"fadeIn 0.25s ease" }}>
      <div style={{ background:T.card, border:"1px solid rgba(245,158,11,0.25)", borderRadius:24, padding:"44px 40px", maxWidth:420, width:"100%", boxShadow:"0 32px 80px rgba(0,0,0,0.6)", animation:"fadeUp 0.3s ease" }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:60, height:60, borderRadius:16, margin:"0 auto 14px", background:"linear-gradient(135deg,#0284c7,#0ea5e9)", display:"flex", alignItems:"center", justifyContent:"center", display:"flex",alignItems:"center",justifyContent:"center", boxShadow:"0 8px 28px rgba(6,150,215,0.4)" }}><BuildifyLogo size={28}/></div>
          <div style={{ fontWeight:800, fontSize:22, color:T.text, letterSpacing:"-0.5px" }}>Welcome back</div>
          <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>Buildify</div>
        </div>

        {/* Fields */}
        <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.muted, marginBottom:6, letterSpacing:"0.3px" }}>USERNAME</div>
            <input
              value={user} onChange={e => { setUser(e.target.value); setErr(""); }}
              onKeyDown={e => e.key==="Enter" && submit()}
              placeholder="Enter username"
              style={{ width:"100%", background:"#0f1117", border:`1.5px solid ${T.border}`, borderRadius:12, padding:"12px 16px", color:T.text, fontSize:14, outline:"none", transition:"border-color 0.15s" }}
              onFocus={e=>e.target.style.borderColor="#f59e0b"} onBlur={e=>e.target.style.borderColor=T.border}
            />
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.muted, marginBottom:6, letterSpacing:"0.3px" }}>PASSWORD</div>
            <input
              type="password" value={pass} onChange={e => { setPass(e.target.value); setErr(""); }}
              onKeyDown={e => e.key==="Enter" && submit()}
              placeholder="Enter password"
              style={{ width:"100%", background:"#0f1117", border:`1.5px solid ${T.border}`, borderRadius:12, padding:"12px 16px", color:T.text, fontSize:14, outline:"none", transition:"border-color 0.15s" }}
              onFocus={e=>e.target.style.borderColor="#f59e0b"} onBlur={e=>e.target.style.borderColor=T.border}
            />
          </div>
        </div>

        {err && <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:T.danger }}>⚠️ {err}</div>}

        <button onClick={submit} disabled={busy} style={{ width:"100%", background:busy?"rgba(2,132,199,0.3)":"linear-gradient(135deg,#0284c7,#0ea5e9)", border:"none", color:busy?"#555":"#fff", fontWeight:800, fontSize:15, padding:"14px", borderRadius:12, cursor:busy?"not-allowed":"pointer", transition:"all 0.2s", marginBottom:16 }}>
          {busy ? "Signing in…" : "Sign In →"}
        </button>

        <button onClick={onClose} style={{ width:"100%", background:"transparent", border:`1.5px solid ${T.border}`, color:T.muted, fontWeight:600, fontSize:14, padding:"11px", borderRadius:12, cursor:"pointer" }}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD (logged-in app) ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
// ENGINEERING TOOLS MODULE
// Two tabs: BOM Review · Cost Estimator
// Session:  buildify_session_engtools (own key, no structural dependency)
// ═══════════════════════════════════════════════════════════════════════════════

export default LoginModal;
