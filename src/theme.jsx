import React from "react";

const T = {
  bg:        "#070c14",
  card:      "#0d1421",
  border:    "rgba(148,163,184,0.1)",
  accent:    "#0284c7",
  accentDim: "rgba(2,132,199,0.12)",
  text:      "#e2e8f0",
  muted:     "#64748b",
  dim:       "#111827",
  success:   "#16a34a",
  danger:    "#dc2626",
  warn:      "#d97706",
  info:      "#0284c7",
};


// ─── SHARED UI COMPONENTS ────────────────────────────────────────────────────
const Card = ({children, style={}}) => (
  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, ...style }}>
    {children}
  </div>
);

const Label = ({children}) => (
  <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.8px", textTransform:"uppercase", color:T.muted, marginBottom:6 }}>
    {children}
  </div>
);

const Input = ({style={}, ...props}) => (
  <input style={{
    width:"100%", background:"#0f1117", border:`1.5px solid ${T.border}`,
    borderRadius:10, padding:"10px 14px", color:T.text, fontSize:14,
    outline:"none", transition:"border 0.15s",
    ...style
  }} {...props}
  onFocus={e=>e.target.style.borderColor=T.accent}
  onBlur={e=>e.target.style.borderColor=T.border}
  />
);

const Select = ({children, style={}, ...props}) => (
  <select style={{
    width:"100%", background:"#0f1117", border:`1.5px solid ${T.border}`,
    borderRadius:10, padding:"10px 14px", color:T.text, fontSize:14,
    outline:"none", cursor:"pointer", ...style
  }} {...props}>
    {children}
  </select>
);

const Stat = ({label, value, sub, color=T.text, accent=false}) => (
  <div style={{
    background: accent ? T.accentDim : T.dim,
    border: `1.5px solid ${accent ? "rgba(245,158,11,0.3)" : T.border}`,
    borderRadius:12, padding:"16px 18px",
  }}>
    <Label>{label}</Label>
    <div style={{ fontSize:24, fontWeight:800, color: accent ? T.accent : color, lineHeight:1.1, marginBottom:4 }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:T.muted }}>{sub}</div>}
  </div>
);

// Compliance gauge arc
const ComplianceGauge = ({ pct, limit, label }) => {
  const ok = pct <= limit;
  const danger = pct > limit * 1.5;
  const color = ok ? T.success : danger ? T.danger : T.warn;
  const angle = Math.min(pct / (limit * 2), 1) * 180;
  const r = 54, cx = 70, cy = 70;
  const toXY = (deg) => {
    const rad = (deg - 180) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const start = toXY(0), end = toXY(angle);
  const large = angle > 90 ? 1 : 0;
  return (
    <div style={{ textAlign:"center" }}>
      <svg width={140} height={80} style={{ overflow:"visible" }}>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke={T.border} strokeWidth={10} strokeLinecap="round"/>
        {pct > 0 && <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" style={{transition:"all 0.5s ease"}}/>}
        <line x1={cx} y1={cy} x2={end.x} y2={end.y} stroke={color} strokeWidth={3} strokeLinecap="round" style={{transition:"all 0.5s ease"}}/>
        <circle cx={cx} cy={cy} r={5} fill={color}/>
        <text x={cx} y={cy+20} textAnchor="middle" fill={color} fontSize={18} fontWeight={800}>{pct.toFixed(2)}%</text>
        <text x={cx-r+4} y={cy+18} fill={T.muted} fontSize={10}>0%</text>
        <text x={cx+r-14} y={cy+18} fill={T.muted} fontSize={10}>{(limit*2).toFixed(0)}%</text>
      </svg>
      <div style={{ fontSize:12, color:T.muted, marginTop:-4 }}>{label}</div>
      <div style={{ marginTop:6, display:"inline-block", padding:"3px 12px", borderRadius:20, fontSize:12, fontWeight:700, background: ok?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)", color: ok?T.success:T.danger }}>
        {ok ? `✓ WITHIN ${limit}% LIMIT` : `✗ EXCEEDS ${limit}% LIMIT`}
      </div>
    </div>
  );
};

// ─── VOLTAGE DROP CALCULATOR ──────────────────────────────────────────────────

export { T, Card, Label, Input, Select, Stat, ComplianceGauge };
