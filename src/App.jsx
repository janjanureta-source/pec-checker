import { useState, useRef, useCallback } from "react";

// ─── PEC SYSTEM PROMPT ───────────────────────────────────────────────────────
const PEC_SYSTEM_PROMPT = `You are a licensed Professional Electrical Engineer (PEE) expert in Philippine Electrical Code (PEC) 2017, FSIC (RA 9514 Fire Code), and Philippine Green Building Code. You review electrical plans for residential and commercial projects.

Be CONCISE. Max 15 findings. Each description ≤60 words, recommendation ≤40 words, codeBasis ≤30 words.

Check:
1. Wire/Conductor Sizing (PEC Art. 2.30)
2. Overcurrent Protection (PEC Art. 2.40)
3. Grounding & Bonding (PEC Art. 2.50)
4. Load Calculations (PEC Art. 2.20)
5. Branch Circuits (PEC Art. 2.10)
6. Panelboards (PEC Art. 3.84)
7. Service Entrance (PEC Art. 2.30)
8. Lighting (PEC Art. 3.30)
9. FSIC (RA 9514) - emergency lighting, exit signs, fire alarm wiring
10. Green Building Code - lighting power density, energy metering
11. Short circuit capacity - interrupting ratings

Respond ONLY as valid JSON (no markdown, no preamble):
{"summary":{"projectName":"string","occupancyType":"Residential|Commercial|Industrial|Unknown","fileType":"string","overallStatus":"NON-COMPLIANT|COMPLIANT WITH WARNINGS|COMPLIANT","criticalCount":0,"warningCount":0,"infoCount":0,"analysisNotes":"under 60 words"},"findings":[{"id":1,"severity":"CRITICAL|WARNING|INFO","category":"Wire Sizing|Overcurrent|Grounding|Load Calc|Branch Circuits|Panelboard|Service Entrance|Lighting|FSIC|Green Building|Short Circuit|Other","pecReference":"PEC 2017 Art. X.XX","title":"under 8 words","description":"under 60 words","recommendation":"under 40 words","codeBasis":"under 30 words"}],"checklist":{"wireSizing":true,"overcurrentProtection":true,"grounding":true,"loadCalculation":true,"branchCircuits":true,"panelboard":true,"serviceEntrance":true,"lighting":true,"fsic":true,"greenBuilding":true,"shortCircuit":true}}`;

// ─── DATA TABLES ─────────────────────────────────────────────────────────────
const WIRE_DATA = {
  14:    { ampacity: 15,  resistance: 8.286  },
  12:    { ampacity: 20,  resistance: 5.211  },
  10:    { ampacity: 30,  resistance: 3.277  },
  8:     { ampacity: 50,  resistance: 2.061  },
  6:     { ampacity: 65,  resistance: 1.296  },
  4:     { ampacity: 85,  resistance: 0.8152 },
  3:     { ampacity: 100, resistance: 0.6463 },
  2:     { ampacity: 115, resistance: 0.5127 },
  1:     { ampacity: 130, resistance: 0.4066 },
  "1/0": { ampacity: 150, resistance: 0.3225 },
  "2/0": { ampacity: 175, resistance: 0.2558 },
  "3/0": { ampacity: 200, resistance: 0.2028 },
  "4/0": { ampacity: 230, resistance: 0.1609 },
  250:   { ampacity: 255, resistance: 0.1363 },
  300:   { ampacity: 285, resistance: 0.1138 },
  350:   { ampacity: 310, resistance: 0.09766},
  400:   { ampacity: 335, resistance: 0.08548},
  500:   { ampacity: 380, resistance: 0.06837},
};
const AWG_SIZES = [14,12,10,8,6,4,3,2,1,"1/0","2/0","3/0","4/0",250,300,350,400,500];

const DEMAND_FACTORS = {
  residential: [{upTo:3000,f:1.0},{upTo:120000,f:0.35},{upTo:Infinity,f:0.25}],
  commercial:  [{upTo:10000,f:1.0},{upTo:Infinity,f:0.5}],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const toBase64 = f => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(f); });
const fmtSize  = n => n<1024?n+" B":n<1048576?(n/1024).toFixed(1)+" KB":(n/1048576).toFixed(1)+" MB";

const repairJSON = str => {
  try { return JSON.parse(str); } catch {}
  let s = str;
  const last = s.lastIndexOf("},");
  if (last>0){
    s=s.substring(0,last+1)+']},"checklist":{"wireSizing":null,"overcurrentProtection":null,"grounding":null,"loadCalculation":null,"branchCircuits":null,"panelboard":null,"serviceEntrance":null,"lighting":null,"fsic":null,"greenBuilding":null,"shortCircuit":null}}';
    try { return JSON.parse(s); } catch {}
  }
  return null;
};

const calcDemand = (va, type) => {
  const tiers = DEMAND_FACTORS[type]||DEMAND_FACTORS.residential;
  let d=0, rem=va, prev=0;
  for(const t of tiers){ const band=Math.min(rem,t.upTo-prev); if(band<=0)break; d+=band*t.f; rem-=band; prev=t.upTo; if(rem<=0)break; }
  return d;
};

const exportPDF = (result, findings) => {
  const w = window.open("","_blank");
  const sc = { "NON-COMPLIANT":"#dc2626","COMPLIANT WITH WARNINGS":"#d97706","COMPLIANT":"#16a34a" }[result.summary.overallStatus]||"#555";
  const rows = findings.map(f=>{
    const col = {CRITICAL:"#dc2626",WARNING:"#d97706",INFO:"#2563eb"}[f.severity]||"#555";
    return `<tr><td style="padding:8px;border:1px solid #e5e7eb;color:${col};font-weight:700;white-space:nowrap">${f.severity}</td><td style="padding:8px;border:1px solid #e5e7eb;font-size:12px">${f.category}</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">${f.title}</td><td style="padding:8px;border:1px solid #e5e7eb;font-size:12px">${f.description}</td><td style="padding:8px;border:1px solid #e5e7eb;font-size:12px;color:#15803d">${f.recommendation}</td><td style="padding:8px;border:1px solid #e5e7eb;font-size:11px;color:#6b7280">${f.pecReference}</td></tr>`;
  }).join("");
  w.document.write(`<!DOCTYPE html><html><head><title>PEC Report</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#111;font-size:13px}h1{color:#111}h2{color:#374151;border-bottom:2px solid #f3f4f6;padding-bottom:6px;margin-top:28px}table{border-collapse:collapse;width:100%}th{background:#1f2937;color:#fff;padding:10px 8px;text-align:left;font-size:12px}.badge{display:inline-block;padding:4px 14px;border-radius:20px;font-weight:700;font-size:14px;background:${sc}22;color:${sc};border:2px solid ${sc}}.footer{margin-top:36px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px}@media print{button{display:none}}</style></head><body>
  <h1>⚡ PEC Compliance Report</h1>
  <p style="color:#6b7280">Philippine Electrical Code 2017 &nbsp;·&nbsp; ${new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"})}</p>
  <table style="width:auto;margin-bottom:16px"><tr><td style="padding:4px 20px 4px 0"><b>Project:</b> ${result.summary.projectName}</td><td style="padding:4px 20px"><b>Type:</b> ${result.summary.occupancyType}</td></tr></table>
  <span class="badge">${result.summary.overallStatus}</span>
  <p>${result.summary.analysisNotes}</p>
  <div style="display:flex;gap:32px;margin:16px 0">
    <div><div style="font-size:28px;font-weight:800;color:#dc2626">${result.summary.criticalCount}</div><div style="font-size:11px;color:#9ca3af">CRITICAL</div></div>
    <div><div style="font-size:28px;font-weight:800;color:#d97706">${result.summary.warningCount}</div><div style="font-size:11px;color:#9ca3af">WARNINGS</div></div>
    <div><div style="font-size:28px;font-weight:800;color:#2563eb">${result.summary.infoCount}</div><div style="font-size:11px;color:#9ca3af">INFO</div></div>
  </div>
  <h2>Findings (${findings.length})</h2>
  <table><tr><th>Severity</th><th>Category</th><th>Issue</th><th>Description</th><th>Recommendation</th><th>PEC Ref.</th></tr>${rows}</table>
  <div class="footer">⚠️ AI-generated report for reference only. Must be reviewed and stamped by a licensed PEE before MERALCO/LGU/DPWH submission.</div>
  </body></html>`);
  w.document.close(); setTimeout(()=>w.print(),400);
};

const exportRevisionPDF = (result, corrections, revNum) => {
  const w = window.open("","_blank");
  const date = new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});
  const revRows = corrections.map((c,i) => `
    <tr style="page-break-inside:avoid">
      <td style="padding:10px 8px;border:1px solid #e5e7eb;font-weight:700;color:#6b7280;text-align:center;white-space:nowrap">REV-${String(i+1).padStart(2,"0")}</td>
      <td style="padding:10px 8px;border:1px solid #e5e7eb;font-size:11px;color:${{CRITICAL:"#dc2626",WARNING:"#d97706",INFO:"#2563eb"}[c.severity]};font-weight:700">${c.severity}</td>
      <td style="padding:10px 8px;border:1px solid #e5e7eb;font-size:12px;font-weight:600">${c.title}</td>
      <td style="padding:10px 8px;border:1px solid #e5e7eb;font-size:12px;color:#374151">${c.description}</td>
      <td style="padding:10px 8px;border:1px solid #e5e7eb;font-size:12px;background:#fefce8">${c.correctedValues||c.recommendation}</td>
      <td style="padding:10px 8px;border:1px solid #e5e7eb;font-size:12px;background:#f0fdf4;color:#15803d">${c.draftingInstruction||""}</td>
      <td style="padding:10px 8px;border:1px solid #e5e7eb;font-size:11px;color:#6b7280">${c.pecReference}</td>
    </tr>`).join("");

  const histRows = Array.from({length: revNum}, (_,i) => `
    <tr>
      <td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:700">Rev ${i+1}</td>
      <td style="padding:6px 10px;border:1px solid #e5e7eb">${i+1 === revNum ? date : "—"}</td>
      <td style="padding:6px 10px;border:1px solid #e5e7eb">${i+1 === revNum ? `PEC compliance corrections — ${corrections.length} item(s) addressed` : "Previous revision"}</td>
      <td style="padding:6px 10px;border:1px solid #e5e7eb">Prepared by AI · For review by PEE</td>
    </tr>`).join("");

  w.document.write(`<!DOCTYPE html><html><head><title>Revision Report Rev ${revNum}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:0;color:#111;font-size:13px}
    .page{margin:40px;padding-bottom:40px}
    h1{color:#1f2937;font-size:20px;margin-bottom:4px}
    h2{color:#374151;font-size:14px;border-bottom:2px solid #f3f4f6;padding-bottom:6px;margin-top:28px}
    table{border-collapse:collapse;width:100%}
    th{background:#1f2937;color:#fff;padding:9px 8px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
    .rev-badge{display:inline-block;background:#1f2937;color:#f59e0b;font-weight:800;font-size:18px;padding:6px 18px;border-radius:6px;letter-spacing:1px}
    .title-block{border:2px solid #1f2937;border-radius:8px;padding:16px 20px;margin-bottom:24px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px}
    .info-item{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:10px 14px}
    .info-label{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;margin-bottom:2px}
    .info-value{font-size:14px;font-weight:700;color:#111}
    .legend{display:flex;gap:16px;margin:12px 0;font-size:11px}
    .legend-item{display:flex;align-items:center;gap:6px}
    .dot{width:12px;height:12px;border-radius:2px}
    .footer{margin-top:40px;padding-top:12px;border-top:2px solid #e5e7eb;font-size:11px;color:#9ca3af;display:flex;justify-content:space-between}
    @media print{@page{margin:20mm} button{display:none}}
  </style></head><body>
  <div class="page">
    <!-- Title Block -->
    <div class="title-block">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:11px;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Philippine Electrical Code 2017 Compliance</div>
          <h1 style="margin:0 0 6px">⚡ Drawing Revision Report</h1>
          <div style="font-size:13px;color:#6b7280">For Draftsman / CAD Operator Use</div>
        </div>
        <div style="text-align:right">
          <div class="rev-badge">REV ${revNum}</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:6px">${date}</div>
        </div>
      </div>
    </div>

    <!-- Project Info -->
    <div class="info-grid">
      <div class="info-item"><div class="info-label">Project Name</div><div class="info-value">${result.summary.projectName}</div></div>
      <div class="info-item"><div class="info-label">Occupancy Type</div><div class="info-value">${result.summary.occupancyType}</div></div>
      <div class="info-item"><div class="info-label">Total Corrections</div><div class="info-value">${corrections.length} items</div></div>
    </div>

    <!-- Legend -->
    <div class="legend">
      <strong style="font-size:11px">Legend:</strong>
      <div class="legend-item"><div class="dot" style="background:#fefce8;border:1px solid #ca8a04"></div> Corrected Value</div>
      <div class="legend-item"><div class="dot" style="background:#f0fdf4;border:1px solid #16a34a"></div> Drafting Instruction</div>
    </div>

    <!-- Corrections Table -->
    <h2>Corrections for This Revision (${corrections.length} items)</h2>
    <table>
      <tr>
        <th>Rev No.</th>
        <th>Severity</th>
        <th>Issue</th>
        <th>Original Finding</th>
        <th style="background:#92400e">Corrected Value</th>
        <th style="background:#166534">Drafting Instruction</th>
        <th>PEC Ref.</th>
      </tr>
      ${revRows}
    </table>

    <!-- Revision History -->
    <h2>Revision History</h2>
    <table>
      <tr><th>Revision</th><th>Date</th><th>Description</th><th>Prepared By</th></tr>
      ${histRows}
    </table>

    <!-- Notes -->
    <div style="margin-top:24px;background:#fffbeb;border:1px solid #fbbf24;border-radius:8px;padding:14px 18px">
      <div style="font-weight:700;font-size:13px;color:#92400e;margin-bottom:6px">📋 Instructions for Draftsman</div>
      <ol style="margin:0;padding-left:18px;color:#78350f;font-size:12px;line-height:2">
        <li>Apply all corrections listed in the table above to the drawing file</li>
        <li>Update the revision block on the title sheet with Rev ${revNum} and date ${date}</li>
        <li>Add revision clouds around all modified areas</li>
        <li>Tag each revision cloud with the corresponding Rev No. (e.g. REV-01, REV-02)</li>
        <li>Submit revised drawings to the Engineer-of-Record for review and signature</li>
      </ol>
    </div>

    <div class="footer">
      <span>⚠️ AI-generated revision report. All corrections must be verified by a licensed PEE before implementation.</span>
      <span>Page 1 of 1 &nbsp;·&nbsp; PEC Compliance Suite</span>
    </div>
  </div>
  </body></html>`);
  w.document.close();
  setTimeout(()=>w.print(), 500);
};

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const T = {
  bg:     "#0f1117",
  card:   "#161b27",
  border: "rgba(255,255,255,0.07)",
  accent: "#f59e0b",
  accentDim: "rgba(245,158,11,0.12)",
  text:   "#e2e8f0",
  muted:  "#64748b",
  dim:    "#1e2535",
  success:"#10b981",
  danger: "#ef4444",
  warn:   "#f59e0b",
  info:   "#3b82f6",
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
function VoltageDropCalc() {
  const [phase, setPhase]       = useState("single");
  const [voltage, setVoltage]   = useState(230);
  const [current, setCurrent]   = useState(20);
  const [length, setLength]     = useState(30);
  const [wireSize, setWireSize] = useState(12);
  const [pf, setPf]             = useState(0.9);
  const [material, setMaterial] = useState("copper");

  // Resistance in mΩ/m (copper vs aluminum)
  const getR = () => {
    const base = WIRE_DATA[wireSize]?.resistance || WIRE_DATA[12].resistance;
    return material === "aluminum" ? base * 1.64 : base;
  };

  // Reactance approx (mΩ/m) for conduit
  const X = 0.0492;

  const R = getR();
  const angle = Math.acos(pf);
  const sinPF = Math.sin(angle);
  const multiplier = phase === "three" ? Math.sqrt(3) : 2;
  const vdrop = multiplier * current * length * (R * pf + X * sinPF) / 1000;
  const vdropPct = (vdrop / voltage) * 100;
  const vReceiving = voltage - vdrop;

  // PEC limits: 3% branch, 5% feeder+branch
  const branchLimit = 3;
  const feederLimit = 5;

  // Recommend minimum wire size
  const recommendWire = () => {
    for (const size of AWG_SIZES) {
      const r2 = material==="aluminum" ? WIRE_DATA[size]?.resistance*1.64 : WIRE_DATA[size]?.resistance;
      if (!r2) continue;
      const vd = multiplier * current * length * (r2 * pf + X * sinPF) / 1000;
      if ((vd / voltage) * 100 <= branchLimit) return size;
    }
    return "500+";
  };

  const recSize = recommendWire();

  return (
    <div>
      <p style={{ color:T.muted, fontSize:13, margin:"0 0 20px" }}>
        Calculate conductor voltage drop per <strong style={{color:T.text}}>PEC 2017 Art. 2.30</strong> — max 3% for branch circuits, 5% total (feeder + branch).
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14, marginBottom:24 }}>
        <div><Label>Circuit Type</Label>
          <Select value={phase} onChange={e=>setPhase(e.target.value)}>
            <option value="single">Single Phase (1φ)</option>
            <option value="three">Three Phase (3φ)</option>
          </Select>
        </div>
        <div><Label>Source Voltage (V)</Label>
          <Select value={voltage} onChange={e=>setVoltage(+e.target.value)}>
            <option value={120}>120 V</option>
            <option value={230}>230 V</option>
            <option value={240}>240 V</option>
            <option value={400}>400 V (3φ)</option>
          </Select>
        </div>
        <div><Label>Load Current (A)</Label>
          <Input type="number" value={current} min={1} onChange={e=>setCurrent(+e.target.value)} placeholder="Amperes"/>
        </div>
        <div><Label>One-Way Cable Length (m)</Label>
          <Input type="number" value={length} min={1} onChange={e=>setLength(+e.target.value)} placeholder="Meters"/>
        </div>
        <div><Label>Conductor Size (AWG)</Label>
          <Select value={wireSize} onChange={e=>setWireSize(e.target.value)}>
            {AWG_SIZES.map(s=><option key={s} value={s}>{s} AWG{s>=250?" kcmil":""} — {WIRE_DATA[s]?.ampacity}A</option>)}
          </Select>
        </div>
        <div><Label>Conductor Material</Label>
          <Select value={material} onChange={e=>setMaterial(e.target.value)}>
            <option value="copper">Copper (Cu)</option>
            <option value="aluminum">Aluminum (Al)</option>
          </Select>
        </div>
        <div><Label>Power Factor</Label>
          <Select value={pf} onChange={e=>setPf(+e.target.value)}>
            <option value={1.0}>1.00 (Resistive)</option>
            <option value={0.95}>0.95</option>
            <option value={0.90}>0.90 (Typical)</option>
            <option value={0.85}>0.85</option>
            <option value={0.80}>0.80</option>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, alignItems:"start" }}>
        {/* Gauge */}
        <Card style={{ padding:24, textAlign:"center" }}>
          <Label>Voltage Drop — Branch Circuit</Label>
          <ComplianceGauge pct={vdropPct} limit={branchLimit} label="PEC limit: 3% (branch), 5% (total)" />
          <div style={{ marginTop:16, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div style={{ background:T.dim, borderRadius:10, padding:"10px 12px" }}>
              <div style={{ fontSize:11, color:T.muted, marginBottom:2 }}>Voltage Drop</div>
              <div style={{ fontSize:20, fontWeight:800, color: vdropPct>branchLimit?T.danger:T.success }}>{vdrop.toFixed(2)} V</div>
            </div>
            <div style={{ background:T.dim, borderRadius:10, padding:"10px 12px" }}>
              <div style={{ fontSize:11, color:T.muted, marginBottom:2 }}>Receiving End</div>
              <div style={{ fontSize:20, fontWeight:800, color:T.text }}>{vReceiving.toFixed(1)} V</div>
            </div>
          </div>
        </Card>

        {/* Results grid */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Stat label="Voltage Drop %" value={vdropPct.toFixed(3)+"%"} sub={`PEC branch limit: ${branchLimit}%`} color={vdropPct>branchLimit?T.danger:T.success}/>
          <Stat label="Conductor Resistance" value={(getR()*1000).toFixed(3)+" mΩ/m"} sub={`${material} — ${wireSize} AWG`}/>
          <Stat
            label="Recommended Min. Wire Size"
            value={recSize+" AWG"}
            sub={`to meet ${branchLimit}% drop limit`}
            accent={vdropPct>branchLimit}
          />
          <div style={{ background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.info, marginBottom:4 }}>📐 Formula Used</div>
            <div style={{ fontSize:12, color:T.muted, lineHeight:1.7, fontFamily:"monospace" }}>
              VD = {multiplier === 2 ? "2" : "√3"} × I × L × (R·cosθ + X·sinθ) / 1000<br/>
              VD = {multiplier} × {current} × {length} × ({(getR()).toFixed(4)}×{pf} + {X}×{sinPF.toFixed(3)})<br/>
              VD = <strong style={{color:T.text}}>{vdrop.toFixed(3)} V</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison table for nearby sizes */}
      <div style={{ marginTop:24 }}>
        <Label>Wire Size Comparison Table</Label>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:T.dim }}>
                {["Wire Size","Ampacity","Resistance (mΩ/m)","Voltage Drop (V)","VD %","Status"].map(h=>(
                  <th key={h} style={{ padding:"10px 14px", color:T.muted, fontWeight:700, fontSize:11, textTransform:"uppercase", textAlign:"left", borderBottom:`1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AWG_SIZES.filter((_,i)=>i%2===0||AWG_SIZES.indexOf(wireSize)===AWG_SIZES.indexOf(_)).map(size=>{
                const r2 = material==="aluminum" ? (WIRE_DATA[size]?.resistance||0)*1.64 : WIRE_DATA[size]?.resistance||0;
                const vd2 = multiplier * current * length * (r2 * pf + X * sinPF) / 1000;
                const pct2 = (vd2 / voltage) * 100;
                const isCurrent = String(size)===String(wireSize);
                const ok = pct2 <= branchLimit;
                return (
                  <tr key={size} style={{ background: isCurrent?"rgba(245,158,11,0.07)":"transparent", borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:"9px 14px", fontWeight: isCurrent?700:400, color: isCurrent?T.accent:T.text }}>
                      {isCurrent?"▶ ":""}{size} AWG{size>=250?" kcmil":""}
                    </td>
                    <td style={{ padding:"9px 14px", color:T.muted }}>{WIRE_DATA[size]?.ampacity} A</td>
                    <td style={{ padding:"9px 14px", color:T.muted, fontFamily:"monospace" }}>{(r2*1000).toFixed(3)}</td>
                    <td style={{ padding:"9px 14px", color:T.text, fontFamily:"monospace" }}>{vd2.toFixed(3)}</td>
                    <td style={{ padding:"9px 14px", fontWeight:600, color:ok?T.success:T.danger }}>{pct2.toFixed(2)}%</td>
                    <td style={{ padding:"9px 14px" }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:20, background:ok?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)", color:ok?T.success:T.danger }}>{ok?"✓ PASS":"✗ FAIL"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── SHORT CIRCUIT CALCULATOR ────────────────────────────────────────────────
function ShortCircuitCalc() {
  const [voltage, setVoltage]     = useState(230);
  const [phases, setPhases]       = useState(1);
  const [xfmrKVA, setXfmrKVA]     = useState(25);
  const [xfmrZ, setXfmrZ]         = useState(4);
  const [cableLen, setCableLen]   = useState(15);
  const [cableSize, setCableSize] = useState(8);
  const [material, setMaterial]   = useState("copper");
  const [existingFLA, setExistingFLA] = useState(20);

  const R_cable = material==="aluminum"
    ? (WIRE_DATA[cableSize]?.resistance||0.002061)*1.64
    : WIRE_DATA[cableSize]?.resistance || 0.002061;

  // Transformer impedance referred to LV
  const Zxfmr  = (xfmrZ / 100) * ((voltage * voltage) / (xfmrKVA * 1000));
  const Rcable  = R_cable * cableLen * 2;
  const Xcable  = 0.0492e-3 * cableLen * 2; // approx reactance
  const Xtxfmr  = Zxfmr * 0.95; // typical X/R ~20 → X≈95%Z
  const Rtxfmr  = Zxfmr * 0.05;
  const Rtotal  = Rtxfmr + Rcable;
  const Xtotal  = Xtxfmr + Xcable;
  const Ztotal  = Math.sqrt(Rtotal*Rtotal + Xtotal*Xtotal);

  const sqrtFactor = phases===3 ? Math.sqrt(3) : 1;
  const Isc_sym  = voltage / (sqrtFactor * Ztotal);
  const Isc_asym = Isc_sym * 1.414 * Math.exp(-Math.PI * Rtotal / Xtotal);
  const Isc_peak = Isc_sym * Math.sqrt(2) * (1 + Math.exp(-Math.PI * Rtotal / Xtotal));

  // Standard breaker ratings (ANSI)
  const STD_AIC = [5000,10000,14000,18000,22000,25000,35000,42000,65000,100000,200000];
  const minAIC  = STD_AIC.find(r => r >= Isc_sym) || 200000;

  // Arc flash rough estimate (simplified IEEE 1584 approach)
  const Iarc = Isc_sym * 0.85;
  const arcLevel = Iarc > 50000 ? "Extreme (>4 cal/cm²)" : Iarc > 20000 ? "High (>4 cal/cm²)" : Iarc > 5000 ? "Moderate (1-4 cal/cm²)" : "Low (<1 cal/cm²)";
  const arcColor = Iarc > 20000 ? T.danger : Iarc > 5000 ? T.warn : T.success;

  const rows = [
    { label:"Transformer Impedance (Ztx)", val:Zxfmr.toFixed(5)+" Ω", note:"Referred to LV side" },
    { label:"Cable Impedance (Zcbl)", val:(Math.sqrt(Rcable*Rcable+Xcable*Xcable)).toFixed(5)+" Ω", note:`${cableLen}m × 2 (L+N)` },
    { label:"Total Impedance (Ztotal)", val:Ztotal.toFixed(5)+" Ω", note:"Series combination" },
    { label:"X/R Ratio", val:(Xtotal/Rtotal).toFixed(2), note:"System X/R" },
  ];

  return (
    <div>
      <p style={{ color:T.muted, fontSize:13, margin:"0 0 20px" }}>
        Estimate available fault current for breaker interrupting capacity per <strong style={{color:T.text}}>PEC 2017 Art. 2.40</strong>.
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14, marginBottom:24 }}>
        <div><Label>System Voltage</Label>
          <Select value={voltage} onChange={e=>setVoltage(+e.target.value)}>
            <option value={120}>120 V</option>
            <option value={230}>230 V</option>
            <option value={400}>400 V</option>
            <option value={13800}>13,800 V</option>
          </Select>
        </div>
        <div><Label>Phases</Label>
          <Select value={phases} onChange={e=>setPhases(+e.target.value)}>
            <option value={1}>Single Phase (1φ)</option>
            <option value={3}>Three Phase (3φ)</option>
          </Select>
        </div>
        <div><Label>Transformer Rating (kVA)</Label>
          <Input type="number" value={xfmrKVA} min={1} onChange={e=>setXfmrKVA(+e.target.value)} placeholder="kVA"/>
        </div>
        <div><Label>Transformer %Z (Impedance)</Label>
          <Input type="number" value={xfmrZ} min={0.5} step={0.25} onChange={e=>setXfmrZ(+e.target.value)} placeholder="%"/>
        </div>
        <div><Label>Cable Length (meters)</Label>
          <Input type="number" value={cableLen} min={1} onChange={e=>setCableLen(+e.target.value)} placeholder="Meters"/>
        </div>
        <div><Label>Cable Size (AWG)</Label>
          <Select value={cableSize} onChange={e=>setCableSize(e.target.value)}>
            {AWG_SIZES.map(s=><option key={s} value={s}>{s} AWG{s>=250?" kcmil":""}</option>)}
          </Select>
        </div>
        <div><Label>Cable Material</Label>
          <Select value={material} onChange={e=>setMaterial(e.target.value)}>
            <option value="copper">Copper (Cu)</option>
            <option value="aluminum">Aluminum (Al)</option>
          </Select>
        </div>
        <div><Label>Existing Breaker FLA (A)</Label>
          <Input type="number" value={existingFLA} min={1} onChange={e=>setExistingFLA(+e.target.value)} placeholder="Amperes"/>
        </div>
      </div>

      {/* Main results */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:12, marginBottom:20 }}>
        <Stat label="Symmetrical Fault Current" value={Math.round(Isc_sym).toLocaleString()+" A"} sub="RMS (worst case)" color={T.danger}/>
        <Stat label="Asymmetrical Fault Current" value={Math.round(Isc_asym).toLocaleString()+" A"} sub="First half-cycle" color={T.warn}/>
        <Stat label="Peak Fault Current" value={Math.round(Isc_peak).toLocaleString()+" A"} sub="Instantaneous peak" color={T.muted}/>
        <Stat label="Required Min. AIC Rating" value={minAIC.toLocaleString()+" A"} sub="Next standard ANSI rating" accent/>
        <Stat label="Estimated Arc Fault Current" value={Math.round(Iarc).toLocaleString()+" A"} sub="IEEE 1584 estimate (85%)" color={arcColor}/>
        <div style={{ background:T.dim, border:`1.5px solid ${T.border}`, borderRadius:12, padding:"16px 18px" }}>
          <Label>Arc Flash Category</Label>
          <div style={{ fontSize:14, fontWeight:700, color:arcColor, lineHeight:1.3 }}>{arcLevel}</div>
          <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>Wear appropriate PPE</div>
        </div>
      </div>

      {/* Breaker check */}
      <Card style={{ marginBottom:20 }}>
        <Label>Breaker Interrupting Capacity Check</Label>
        <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap", marginTop:8 }}>
          <div>
            <div style={{ fontSize:12, color:T.muted }}>Available Fault Current</div>
            <div style={{ fontSize:22, fontWeight:800, color:T.danger }}>{Math.round(Isc_sym).toLocaleString()} A</div>
          </div>
          <div style={{ fontSize:24, color:T.muted }}>vs</div>
          <div>
            <div style={{ fontSize:12, color:T.muted }}>Your Breaker AIC ({existingFLA}A breaker)</div>
            <div style={{ fontSize:22, fontWeight:800, color:T.accent }}>10,000 A <span style={{fontSize:13, color:T.muted}}>(assumed standard)</span></div>
          </div>
          <div style={{ flex:1, minWidth:160 }}>
            {Isc_sym <= 10000
              ? <div style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:10, padding:"10px 16px", color:T.success, fontWeight:700 }}>✓ Standard 10kA breaker is adequate</div>
              : <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"10px 16px", color:T.danger, fontWeight:700 }}>✗ Upgrade to {minAIC.toLocaleString()}A AIC rated breaker!</div>
            }
          </div>
        </div>
      </Card>

      {/* Impedance breakdown */}
      <Label>Impedance Breakdown</Label>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ background:T.dim }}>
              {["Component","Impedance","Note"].map(h=>(
                <th key={h} style={{ padding:"10px 14px", color:T.muted, fontWeight:700, fontSize:11, textTransform:"uppercase", textAlign:"left", borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.label} style={{ borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:"9px 14px", color:T.text }}>{r.label}</td>
                <td style={{ padding:"9px 14px", fontFamily:"monospace", color:T.accent, fontWeight:600 }}>{r.val}</td>
                <td style={{ padding:"9px 14px", color:T.muted, fontSize:12 }}>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop:14, padding:"10px 14px", background:"rgba(59,130,246,0.07)", border:"1px solid rgba(59,130,246,0.18)", borderRadius:10, fontSize:12, color:T.muted }}>
        ⚠️ Estimated values for preliminary design. A formal short-circuit study by a licensed PEE is required per PEC Art. 2.40 before final equipment specification.
      </div>
    </div>
  );
}

// ─── APPLIANCE DATABASE ───────────────────────────────────────────────────────
const APPLIANCE_CATEGORIES = [
  {
    category: "💡 Lighting",
    items: [
      { name: "LED Bulb (9W)",            watts: 9,    pct: 100 },
      { name: "LED Bulb (15W)",           watts: 15,   pct: 100 },
      { name: "Fluorescent Lamp (40W)",   watts: 40,   pct: 100 },
      { name: "Downlight / Recessed LED", watts: 12,   pct: 100 },
      { name: "Tube Light (LED T8)",      watts: 18,   pct: 100 },
      { name: "Outdoor Floodlight",       watts: 50,   pct: 100 },
      { name: "Emergency Light",          watts: 10,   pct: 100 },
    ]
  },
  {
    category: "❄️ Air Conditioning",
    items: [
      { name: "Window AC 0.5HP",          watts: 450,  pct: 80 },
      { name: "Window AC 1HP",            watts: 746,  pct: 80 },
      { name: "Window AC 1.5HP",          watts: 1119, pct: 80 },
      { name: "Split-Type AC 1HP",        watts: 900,  pct: 80 },
      { name: "Split-Type AC 1.5HP",      watts: 1300, pct: 80 },
      { name: "Split-Type AC 2HP",        watts: 1800, pct: 80 },
      { name: "Inverter AC 1HP",          watts: 700,  pct: 80 },
      { name: "Inverter AC 1.5HP",        watts: 1000, pct: 80 },
      { name: "Cassette-Type AC 2HP",     watts: 1800, pct: 80 },
    ]
  },
  {
    category: "🍳 Kitchen Appliances",
    items: [
      { name: "Electric Range / Stove",   watts: 2000, pct: 65 },
      { name: "Microwave Oven",           watts: 1000, pct: 50 },
      { name: "Rice Cooker",              watts: 700,  pct: 50 },
      { name: "Electric Kettle",          watts: 1500, pct: 20 },
      { name: "Refrigerator (Small)",     watts: 100,  pct: 100 },
      { name: "Refrigerator (Medium)",    watts: 150,  pct: 100 },
      { name: "Refrigerator (Large)",     watts: 250,  pct: 100 },
      { name: "Electric Oven / Toaster",  watts: 1200, pct: 25 },
      { name: "Dishwasher",               watts: 1500, pct: 25 },
      { name: "Blender / Mixer",          watts: 350,  pct: 15 },
      { name: "Coffee Maker",             watts: 800,  pct: 15 },
      { name: "Food Processor",           watts: 500,  pct: 15 },
      { name: "Electric Grill / Griddle", watts: 1500, pct: 20 },
    ]
  },
  {
    category: "🛁 Bathroom / Utility",
    items: [
      { name: "Electric Water Heater (Instant)", watts: 3500, pct: 25 },
      { name: "Electric Water Heater (Storage)", watts: 1500, pct: 30 },
      { name: "Washing Machine (Auto)",   watts: 500,  pct: 35 },
      { name: "Washing Machine (Semi-Auto)", watts: 350, pct: 35 },
      { name: "Clothes Dryer",            watts: 2000, pct: 25 },
      { name: "Vacuum Cleaner",           watts: 1000, pct: 10 },
      { name: "Electric Fan (Stand)",     watts: 60,   pct: 80 },
      { name: "Electric Fan (Desk)",      watts: 35,   pct: 80 },
      { name: "Exhaust Fan",              watts: 30,   pct: 60 },
      { name: "Hair Dryer",               watts: 1200, pct: 10 },
      { name: "Electric Iron",            watts: 1000, pct: 15 },
    ]
  },
  {
    category: "📺 Entertainment & Office",
    items: [
      { name: "LED TV 32\"",              watts: 50,   pct: 60 },
      { name: "LED TV 43\"",              watts: 80,   pct: 60 },
      { name: "LED TV 55\"",              watts: 120,  pct: 60 },
      { name: "Desktop Computer",         watts: 250,  pct: 50 },
      { name: "Laptop / Notebook",        watts: 65,   pct: 60 },
      { name: "Wi-Fi Router / Modem",     watts: 15,   pct: 100 },
      { name: "Printer / Scanner",        watts: 200,  pct: 10 },
      { name: "Gaming Console",           watts: 150,  pct: 30 },
      { name: "Sound System / Speaker",   watts: 100,  pct: 40 },
      { name: "Set-Top Box / Receiver",   watts: 20,   pct: 70 },
    ]
  },
  {
    category: "🔌 General / Other",
    items: [
      { name: "General Receptacle Outlet",watts: 180,  pct: 100 },
      { name: "Water Pump (0.5HP)",       watts: 370,  pct: 30 },
      { name: "Water Pump (1HP)",         watts: 746,  pct: 30 },
      { name: "Sump Pump",                watts: 500,  pct: 20 },
      { name: "Gate Motor / Garage Door", watts: 400,  pct: 5  },
      { name: "Security Camera (per unit)",watts: 15,  pct: 100 },
      { name: "Electric Vehicle Charger", watts: 7200, pct: 30 },
      { name: "UPS / Battery Backup",     watts: 500,  pct: 50 },
      { name: "Custom / Other",           watts: 100,  pct: 100 },
    ]
  }
];

// Flat lookup map: name → { watts, pct }
const APPLIANCE_MAP = {};
APPLIANCE_CATEGORIES.forEach(cat => cat.items.forEach(item => { APPLIANCE_MAP[item.name] = { watts: item.watts, pct: item.pct }; }));
const CUSTOM_OPTION = "Custom / Other";

// ─── LOAD CALCULATOR ─────────────────────────────────────────────────────────
function LoadCalc() {
  const [occupancy, setOccupancy] = useState("residential");
  const [voltage, setVoltage]     = useState(230);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [loads, setLoads] = useState([
    { id:1, name:"LED Bulb (15W)",          watts:15,   pct:100 },
    { id:2, name:"General Receptacle Outlet", watts:180, pct:100 },
    { id:3, name:"Split-Type AC 1HP",        watts:900,  pct:80  },
    { id:4, name:"Refrigerator (Medium)",    watts:150,  pct:100 },
    { id:5, name:"LED TV 43\"",              watts:80,   pct:60  },
  ]);

  const remLoad  = id => setLoads(p => p.filter(l => l.id !== id));
  const upd      = (id, f, v) => setLoads(p => p.map(l => l.id === id ? { ...l, [f]: v } : l));

  // When dropdown changes, auto-fill watts & pct if it's a known appliance
  const handleNameChange = (id, newName) => {
    const preset = APPLIANCE_MAP[newName];
    if (preset && newName !== CUSTOM_OPTION) {
      setLoads(p => p.map(l => l.id === id ? { ...l, name: newName, watts: preset.watts, pct: preset.pct } : l));
    } else {
      setLoads(p => p.map(l => l.id === id ? { ...l, name: newName } : l));
    }
  };

  const addFromPicker = (item) => {
    setLoads(p => [...p, { id: Date.now(), name: item.name, watts: item.watts, pct: item.pct, qty: 1 }]);
    setShowPicker(false);
    setPickerSearch("");
  };

  const addBlankLoad = () => {
    setLoads(p => [...p, { id: Date.now(), name: CUSTOM_OPTION, watts: 100, pct: 100, qty: 1 }]);
  };

  const totalVA  = loads.reduce((s, l) => s + (l.qty||1) * l.watts * (l.pct / 100), 0);
  const demandVA = calcDemand(totalVA, occupancy);
  const currentA = demandVA / voltage;
  const serviceA = Math.ceil(currentA * 1.25 / 5) * 5;
  const recWire  = () => { for (const s of AWG_SIZES) { if ((WIRE_DATA[s]?.ampacity||0) >= serviceA) return s; } return "500+"; };

  // Filtered appliances for picker
  const filteredCats = pickerSearch.trim()
    ? [{ category: "Search Results", items: Object.entries(APPLIANCE_MAP).filter(([n]) => n.toLowerCase().includes(pickerSearch.toLowerCase())).map(([name, v]) => ({ name, ...v })) }]
    : APPLIANCE_CATEGORIES;

  const thStyle = { padding:"10px 12px", color:T.muted, fontWeight:700, fontSize:11, textTransform:"uppercase", textAlign:"left", borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap" };
  const tdStyle = { padding:"6px 8px", borderBottom:`1px solid ${T.border}`, verticalAlign:"middle" };

  return (
    <div>
      <p style={{ color:T.muted, fontSize:13, margin:"0 0 6px" }}>
        PEC 2017 Art. 2.20 demand factor method · Watts/unit and demand % are pre-filled from typical averages but fully editable.
      </p>

      {/* Top controls */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
        <div><Label>Occupancy Type</Label>
          <Select value={occupancy} onChange={e => setOccupancy(e.target.value)}>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
          </Select>
        </div>
        <div><Label>Supply Voltage</Label>
          <Select value={voltage} onChange={e => setVoltage(+e.target.value)}>
            <option value={230}>230 V (1φ)</option>
            <option value={400}>400 V (3φ)</option>
          </Select>
        </div>
      </div>

      {/* Load table */}
      <div style={{ overflowX:"auto", marginBottom:14, borderRadius:12, border:`1px solid ${T.border}`, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ background:T.dim }}>
              <th style={{ ...thStyle, minWidth:220 }}>Appliance / Load</th>
              <th style={{ ...thStyle, width:70 }}>Qty</th>
              <th style={{ ...thStyle, width:110 }}>Watts/Unit</th>
              <th style={{ ...thStyle, width:100 }}>Demand %</th>
              <th style={{ ...thStyle, width:100 }}>Total VA</th>
              <th style={{ ...thStyle, width:44 }}></th>
            </tr>
          </thead>
          <tbody>
            {loads.map((l, idx) => {
              const rowVA = (l.qty||1) * l.watts * (l.pct / 100);
              const isEven = idx % 2 === 0;
              return (
                <tr key={l.id} style={{ background: isEven ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  {/* Appliance dropdown */}
                  <td style={tdStyle}>
                    <select
                      value={l.name}
                      onChange={e => handleNameChange(l.id, e.target.value)}
                      style={{
                        width:"100%", background:"#0f1117", border:`1.5px solid ${T.border}`,
                        borderRadius:8, padding:"7px 10px", color:T.text, fontSize:13,
                        outline:"none", cursor:"pointer"
                      }}
                    >
                      {/* Show current name if custom typed */}
                      {!APPLIANCE_MAP[l.name] && <option value={l.name}>{l.name||"— Select appliance —"}</option>}
                      {APPLIANCE_CATEGORIES.map(cat => (
                        <optgroup key={cat.category} label={cat.category}>
                          {cat.items.map(item => (
                            <option key={item.name} value={item.name}>{item.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </td>
                  {/* Qty */}
                  <td style={tdStyle}>
                    <input
                      type="number" value={l.qty||1} min={1}
                      onChange={e => upd(l.id, "qty", +e.target.value)}
                      style={{ width:"100%", background:"#0f1117", border:`1.5px solid ${T.border}`, borderRadius:8, padding:"7px 8px", color:T.text, fontSize:13, outline:"none", textAlign:"center" }}
                    />
                  </td>
                  {/* Watts - editable */}
                  <td style={tdStyle}>
                    <div style={{ position:"relative" }}>
                      <input
                        type="number" value={l.watts} min={0}
                        onChange={e => upd(l.id, "watts", +e.target.value)}
                        style={{ width:"100%", background:"#0f1117", border:`1.5px solid ${T.border}`, borderRadius:8, padding:"7px 8px 7px 8px", color:T.text, fontSize:13, outline:"none" }}
                      />
                      <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:10, color:T.muted, pointerEvents:"none" }}>W</span>
                    </div>
                  </td>
                  {/* Demand % - editable */}
                  <td style={tdStyle}>
                    <div style={{ position:"relative" }}>
                      <input
                        type="number" value={l.pct} min={0} max={100}
                        onChange={e => upd(l.id, "pct", +e.target.value)}
                        style={{ width:"100%", background:"#0f1117", border:`1.5px solid ${T.border}`, borderRadius:8, padding:"7px 8px", color:T.text, fontSize:13, outline:"none" }}
                      />
                      <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:10, color:T.muted, pointerEvents:"none" }}>%</span>
                    </div>
                  </td>
                  {/* Total VA */}
                  <td style={{ ...tdStyle, fontWeight:700, color: rowVA > 2000 ? T.warn : T.accent, fontFamily:"monospace", whiteSpace:"nowrap" }}>
                    {rowVA.toFixed(0)} VA
                  </td>
                  {/* Remove */}
                  <td style={{ ...tdStyle, textAlign:"center" }}>
                    <button onClick={() => remLoad(l.id)} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:T.danger, width:28, height:28, borderRadius:7, cursor:"pointer", fontSize:15, lineHeight:1 }}>×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Footer totals row */}
          <tfoot>
            <tr style={{ background:T.dim, borderTop:`2px solid ${T.border}` }}>
              <td colSpan={4} style={{ padding:"10px 12px", fontWeight:700, color:T.muted, fontSize:12 }}>TOTAL CONNECTED LOAD</td>
              <td colSpan={2} style={{ padding:"10px 12px", fontWeight:800, color:T.accent, fontSize:14, fontFamily:"monospace" }}>{totalVA.toFixed(0)} VA</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add buttons */}
      <div style={{ display:"flex", gap:10, marginBottom:24, flexWrap:"wrap" }}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          style={{ display:"flex", alignItems:"center", gap:8, background:showPicker?T.accentDim:"transparent", border:`1.5px solid ${showPicker?T.accent:T.border}`, color:showPicker?T.accent:T.muted, padding:"8px 18px", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:600, transition:"all 0.15s" }}
        >
          🔍 Browse Appliances
        </button>
        <button
          onClick={addBlankLoad}
          style={{ display:"flex", alignItems:"center", gap:8, background:"transparent", border:`1.5px dashed ${T.border}`, color:T.muted, padding:"8px 18px", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:600 }}
        >
          + Add Custom Load
        </button>
      </div>

      {/* Appliance Picker Panel */}
      {showPicker && (
        <div style={{ background:T.dim, border:`1.5px solid ${T.border}`, borderRadius:14, padding:20, marginBottom:24, animation:"fadeIn 0.2s ease" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ fontWeight:700, fontSize:14, color:T.text }}>🔌 Appliance Library</div>
            <button onClick={() => { setShowPicker(false); setPickerSearch(""); }} style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, color:T.muted, padding:"4px 12px", borderRadius:6, cursor:"pointer", fontSize:12 }}>✕ Close</button>
          </div>
          {/* Search */}
          <input
            value={pickerSearch}
            onChange={e => setPickerSearch(e.target.value)}
            placeholder="🔍  Search appliances (e.g. aircon, ref, TV…)"
            style={{ width:"100%", background:"#0f1117", border:`1.5px solid ${T.border}`, borderRadius:10, padding:"9px 14px", color:T.text, fontSize:13, outline:"none", marginBottom:16 }}
            onFocus={e => e.target.style.borderColor = T.accent}
            onBlur={e => e.target.style.borderColor = T.border}
            autoFocus
          />
          {/* Category grid */}
          <div style={{ maxHeight:340, overflowY:"auto", paddingRight:4 }}>
            {filteredCats.filter(c => c.items.length > 0).map(cat => (
              <div key={cat.category} style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.muted, letterSpacing:"0.6px", textTransform:"uppercase", marginBottom:8, padding:"0 2px" }}>{cat.category}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {cat.items.map(item => (
                    <button
                      key={item.name}
                      onClick={() => addFromPicker(item)}
                      style={{
                        background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`,
                        borderRadius:8, padding:"7px 12px", cursor:"pointer", textAlign:"left",
                        transition:"all 0.12s", color:T.text
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.accentDim; e.currentTarget.style.borderColor = T.accent; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = T.border; }}
                    >
                      <div style={{ fontSize:12, fontWeight:600, color:T.text, whiteSpace:"nowrap" }}>{item.name}</div>
                      <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{item.watts}W · {item.pct}% demand</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filteredCats.every(c => c.items.length === 0) && (
              <div style={{ textAlign:"center", padding:"20px 0", color:T.muted, fontSize:13 }}>No appliances found. Use "+ Add Custom Load" instead.</div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(170px, 1fr))", gap:12 }}>
        <Stat label="Total Connected Load" value={(totalVA/1000).toFixed(2)+" kVA"} sub={totalVA.toFixed(0)+" VA total"}/>
        <Stat label="Demand Load (PEC)" value={(demandVA/1000).toFixed(2)+" kVA"} sub={occupancy+" demand factor"}/>
        <Stat label="Design Current" value={currentA.toFixed(1)+" A"} sub={`at ${voltage}V`}/>
        <Stat label="Min. Service Breaker" value={serviceA+" A"} sub="125% × design current"/>
        <Stat label="Min. Wire Size" value={recWire()+" AWG"} sub="Cu, 75°C, conduit" accent/>
      </div>

      {/* Demand breakdown note */}
      <div style={{ marginTop:16, padding:"12px 16px", background:"rgba(59,130,246,0.07)", border:"1px solid rgba(59,130,246,0.18)", borderRadius:10, fontSize:12, color:T.muted, lineHeight:1.7 }}>
        <strong style={{ color:T.info }}>ℹ️ Demand Factor Applied (PEC Art. 2.20):</strong>
        {occupancy==="residential"
          ? " First 3,000 VA @ 100% · Next 117,000 VA @ 35% · Remainder @ 25%"
          : " First 10,000 VA @ 100% · Remainder @ 50%"}
        <br/>
        <span style={{ fontSize:11 }}>Watts/unit and Demand% values are typical averages. Adjust them to match your actual equipment nameplate ratings.</span>
      </div>
    </div>
  );
}

// ─── PLAN CHECKER ────────────────────────────────────────────────────────────
const SEV_CFG = {
  CRITICAL: { bg:"rgba(239,68,68,0.08)",  border:"rgba(239,68,68,0.25)",  text:"#ef4444", badge:"#ef4444" },
  WARNING:  { bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.25)", text:"#f59e0b", badge:"#f59e0b" },
  INFO:     { bg:"rgba(59,130,246,0.08)", border:"rgba(59,130,246,0.25)", text:"#3b82f6", badge:"#3b82f6" },
};
const STATUS_COL = { "NON-COMPLIANT":"#ef4444","COMPLIANT WITH WARNINGS":"#f59e0b","COMPLIANT":"#10b981" };
const CL_LABELS = {
  wireSizing:{l:"Wire Sizing",a:"Art. 2.30"},overcurrentProtection:{l:"Overcurrent",a:"Art. 2.40"},
  grounding:{l:"Grounding",a:"Art. 2.50"},loadCalculation:{l:"Load Calc",a:"Art. 2.20"},
  branchCircuits:{l:"Branch Circuits",a:"Art. 2.10"},panelboard:{l:"Panelboards",a:"Art. 3.84"},
  serviceEntrance:{l:"Service Entrance",a:"Art. 2.30"},lighting:{l:"Lighting",a:"Art. 3.30"},
  fsic:{l:"Fire Code",a:"RA 9514"},greenBuilding:{l:"Green Building",a:"PGBC"},shortCircuit:{l:"Short Circuit",a:"Art. 2.40"},
};

function PlanChecker({ apiKey }) {
  const [files, setFiles]   = useState([]);
  const [busy, setBusy]     = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError]         = useState(null);
  const [drag, setDrag]           = useState(false);
  const [tab, setTab]             = useState("all");
  const [open, setOpen]           = useState({});
  const [checked, setChecked]     = useState({});
  const [corrections, setCorrections] = useState(null);
  const [correcting, setCorrecting]   = useState(false);
  const [revNum, setRevNum]           = useState(1);
  const ref = useRef(null);

  const addFiles = useCallback(fs=>{
    setFiles(p=>[...p,...Array.from(fs).map(f=>({file:f,id:Math.random().toString(36).slice(2),name:f.name,size:f.size,type:f.type||"application/octet-stream"}))]);
    setResult(null); setError(null);
  },[]);

  const buildContent = async fobjs => {
    const blocks=[];
    for(const fo of fobjs){
      const b64=await toBase64(fo.file);
      if(fo.type.startsWith("image/")) { blocks.push({type:"image",source:{type:"base64",media_type:fo.type,data:b64}}); blocks.push({type:"text",text:`[Image: ${fo.name}]`}); }
      else if(fo.type==="application/pdf") { blocks.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}}); blocks.push({type:"text",text:`[PDF: ${fo.name}]`}); }
      else blocks.push({type:"text",text:`[File: ${fo.name} — analyze context for electrical compliance]`});
    }
    blocks.push({type:"text",text:"Analyze uploaded electrical plans for PEC 2017, FSIC, and Green Building Code compliance. Return only JSON."});
    return blocks;
  };

  const run = async () => {
    if(!files.length) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const content = await buildContent(files);
      const hdrs = {"Content-Type":"application/json"};
      if(apiKey) hdrs["x-api-key"]=apiKey;
      const res = await fetch("/api/anthropic",{method:"POST",headers:hdrs,body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:8000,system:PEC_SYSTEM_PROMPT,messages:[{role:"user",content}]})});
      const data = await res.json();
      if(data.error) throw new Error(data.error.message||"API Error");
      const raw = data.content?.map(b=>b.text||"").join("");
      const parsed = repairJSON(raw.replace(/```json|```/g,"").trim());
      if(!parsed) throw new Error("Could not parse AI response. Try uploading fewer pages or a smaller file.");
      setResult(parsed); setOpen({}); setTab("all"); setChecked({}); setCorrections(null);
    } catch(e) { setError(e.message||"Analysis failed."); }
    finally { setBusy(false); }
  };

  const findings = result?.findings||[];
  const filtered = tab==="all" ? findings : findings.filter(f=>f.severity===tab);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const allChecked = findings.length > 0 && findings.every(f => checked[f.id]);

  const toggleAll = () => {
    if (allChecked) setChecked({});
    else { const all={}; findings.forEach(f=>all[f.id]=true); setChecked(all); }
  };

  const generateCorrections = async () => {
    const selected = findings.filter(f => checked[f.id]);
    if (!selected.length) return;
    setCorrecting(true); setCorrections(null);
    try {
      const hdrs = {"Content-Type":"application/json"};
      if(apiKey) hdrs["x-api-key"]=apiKey;
      const prompt = `You are a licensed PEE. For each finding below, generate specific drafting correction instructions for a CAD draftsman.

Findings to correct:
${selected.map((f,i)=>`${i+1}. [${f.severity}] ${f.title} — ${f.description} (${f.pecReference})`).join("\n")}

Respond ONLY as valid JSON array (no markdown):
[{"id":${selected[0]?.id},"title":"...","severity":"...","description":"...","pecReference":"...","recommendation":"...","correctedValues":"Specific corrected value e.g. Change wire from #12 AWG to #10 AWG, upgrade breaker from 20A to 30A","draftingInstruction":"Exact instruction for draftsman e.g. On Sheet E-2, Panel Schedule, revise circuit 3 wire size notation from #12 AWG THWN to #10 AWG THWN. Add revision cloud around affected area."}]

Be very specific with corrected values and drafting instructions. Reference typical drawing sheet names (E-1, E-2, etc.).`;

      const res = await fetch("/api/anthropic",{method:"POST",headers:hdrs,body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:4000,messages:[{role:"user",content:prompt}]})});
      const data = await res.json();
      if(data.error) throw new Error(data.error.message||"API Error");
      const raw = data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(raw);
      setCorrections(parsed);
    } catch(e) { alert("Could not generate corrections: "+e.message); }
    finally { setCorrecting(false); }
  };

  return (
    <div>
      {/* Drop zone */}
      <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files)}}
        onClick={()=>ref.current?.click()}
        style={{ border:`2px dashed ${drag?T.accent:T.border}`, borderRadius:16, padding:"40px 24px", textAlign:"center", cursor:"pointer", background:drag?T.accentDim:"rgba(255,255,255,0.01)", transition:"all 0.2s", marginBottom:20 }}>
        <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.dwg,.dxf" onChange={e=>addFiles(e.target.files)} style={{display:"none"}}/>
        <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
        <div style={{ fontWeight:700, fontSize:16, color:T.text, marginBottom:6 }}>Drop your electrical plans here</div>
        <div style={{ color:T.muted, fontSize:13, marginBottom:16 }}>PDF drawings · JPG / PNG images · Excel load schedules</div>
        <div style={{ display:"inline-block", background:`linear-gradient(135deg,${T.accent},#f97316)`, color:"#000", fontWeight:700, padding:"9px 22px", borderRadius:10, fontSize:14 }}>Choose Files</div>
      </div>

      {/* File chips */}
      {files.length>0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
          {files.map(fo=>(
            <div key={fo.id} style={{ background:T.dim, border:`1px solid ${T.border}`, borderRadius:8, padding:"7px 10px", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:18 }}>{fo.type.startsWith("image")?"🖼️":fo.type==="application/pdf"?"📄":"📎"}</span>
              <div>
                <div style={{ fontSize:12, color:T.text, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{fo.name}</div>
                <div style={{ fontSize:10, color:T.muted }}>{fmtSize(fo.size)}</div>
              </div>
              <button onClick={()=>setFiles(p=>p.filter(f=>f.id!==fo.id))} style={{ background:"rgba(239,68,68,0.12)", border:"none", color:T.danger, width:22, height:22, borderRadius:5, cursor:"pointer", fontSize:12 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {files.length>0 && (
        <button onClick={run} disabled={busy} style={{ width:"100%", background:busy?"rgba(245,158,11,0.2)":`linear-gradient(135deg,${T.accent},#f97316)`, border:"none", color:busy?"#666":"#000", fontWeight:700, fontSize:15, padding:"14px", borderRadius:12, cursor:busy?"not-allowed":"pointer", marginBottom:20, boxShadow:busy?"none":"0 6px 24px rgba(245,158,11,0.25)", transition:"all 0.2s" }}>
          {busy ? "⚙️  Analyzing against PEC 2017 + FSIC + Green Building Code…" : `⚡ Run Full Compliance Check  (${files.length} file${files.length>1?"s":""})`}
        </button>
      )}

      {error && <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"12px 16px", marginBottom:20, color:T.danger, fontSize:14 }}>⚠️ {error}</div>}

      {result && (
        <div style={{ animation:"fadeIn 0.35s ease" }}>
          {/* Summary card */}
          <Card style={{ marginBottom:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:20, alignItems:"start" }}>
              <div>
                <div style={{ fontSize:11, color:T.muted, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:6 }}>Compliance Assessment</div>
                <div style={{ fontSize:22, fontWeight:800, color:T.text, marginBottom:6 }}>{result.summary.projectName}</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                  {[result.summary.occupancyType, result.summary.fileType].filter(Boolean).map(t=>(
                    <span key={t} style={{ background:T.dim, padding:"2px 10px", borderRadius:20, fontSize:11, color:T.muted }}>{t}</span>
                  ))}
                </div>
                <div style={{ color:T.muted, fontSize:13, marginBottom:18, lineHeight:1.6 }}>{result.summary.analysisNotes}</div>
                <div style={{ display:"flex", gap:24 }}>
                  {[{l:"Critical",c:result.summary.criticalCount,col:"#ef4444"},{l:"Warnings",c:result.summary.warningCount,col:"#f59e0b"},{l:"Info",c:result.summary.infoCount,col:"#3b82f6"}].map(x=>(
                    <div key={x.l} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:28, fontWeight:800, color:x.col, lineHeight:1 }}>{x.c}</div>
                      <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{x.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"flex-end" }}>
                <div style={{ background:`${STATUS_COL[result.summary.overallStatus]}14`, border:`2px solid ${STATUS_COL[result.summary.overallStatus]}44`, borderRadius:12, padding:"10px 18px", textAlign:"center", minWidth:160 }}>
                  <div style={{ fontSize:10, color:T.muted, marginBottom:4, letterSpacing:"0.5px" }}>OVERALL STATUS</div>
                  <div style={{ fontSize:13, fontWeight:800, color:STATUS_COL[result.summary.overallStatus] }}>{result.summary.overallStatus}</div>
                </div>
                <button onClick={()=>exportPDF(result,findings)} style={{ background:`linear-gradient(135deg,${T.accent},#f97316)`, border:"none", color:"#000", fontWeight:700, padding:"8px 16px", borderRadius:10, cursor:"pointer", fontSize:13 }}>📄 Export PDF</button>
              </div>
            </div>
          </Card>

          {/* Checklist */}
          <Card style={{ marginBottom:16 }}>
            <Label>PEC Compliance Checklist</Label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(170px, 1fr))", gap:8, marginTop:10 }}>
              {Object.entries(CL_LABELS).map(([k,info])=>{
                const v=result.checklist?.[k];
                const col=v===null?T.muted:v?T.success:T.danger;
                const icon=v===null?"—":v?"✓":"✗";
                return (
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:10, background:T.dim, borderRadius:8, padding:"8px 12px" }}>
                    <span style={{ color:col, fontWeight:800, fontSize:16, width:18 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize:12, color:v===null?T.muted:T.text }}>{info.l}</div>
                      <div style={{ fontSize:10, color:T.muted }}>{info.a}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Findings */}
          {findings.length>0 && (
            <div>
              {/* Filter tabs + Select All */}
              <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {["all","CRITICAL","WARNING","INFO"].map(t=>{
                    const cnt=t==="all"?findings.length:findings.filter(f=>f.severity===t).length;
                    const active=tab===t;
                    return <button key={t} onClick={()=>setTab(t)} style={{ padding:"7px 16px", borderRadius:8, border:`1.5px solid ${active?T.accent:T.border}`, background:active?T.accentDim:"transparent", color:active?T.accent:T.muted, cursor:"pointer", fontSize:12, fontWeight:700, transition:"all 0.15s" }}>{t==="all"?"All":t} ({cnt})</button>;
                  })}
                </div>
                <button onClick={toggleAll} style={{ padding:"7px 14px", borderRadius:8, border:`1.5px solid ${T.border}`, background:"transparent", color:T.muted, cursor:"pointer", fontSize:12, fontWeight:600 }}>
                  {allChecked ? "☑ Deselect All" : "☐ Select All"}
                </button>
              </div>

              {/* Finding cards with checkboxes */}
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
                {filtered.map(f=>{
                  const cfg=SEV_CFG[f.severity]||SEV_CFG.INFO;
                  const isOpen=open[f.id];
                  const isChecked=!!checked[f.id];
                  return (
                    <div key={f.id} style={{ background:isChecked?`${cfg.bg}`:"rgba(255,255,255,0.01)", border:`1.5px solid ${isChecked?cfg.border:T.border}`, borderRadius:12, overflow:"hidden", transition:"all 0.15s" }}>
                      <div style={{ padding:"13px 18px", display:"flex", alignItems:"flex-start", gap:12 }}>
                        {/* Checkbox */}
                        <div
                          onClick={()=>setChecked(p=>({...p,[f.id]:!p[f.id]}))}
                          style={{ width:20, height:20, borderRadius:5, border:`2px solid ${isChecked?cfg.badge:T.muted}`, background:isChecked?cfg.badge:"transparent", cursor:"pointer", flexShrink:0, marginTop:2, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}
                        >
                          {isChecked && <span style={{ color:"#fff", fontSize:12, fontWeight:800, lineHeight:1 }}>✓</span>}
                        </div>
                        {/* Content — click to expand */}
                        <div style={{ flex:1, minWidth:0, cursor:"pointer" }} onClick={()=>setOpen(p=>({...p,[f.id]:!p[f.id]}))}>
                          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:4, alignItems:"center" }}>
                            <span style={{ background:cfg.badge, color:"#fff", fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:4 }}>{f.severity}</span>
                            <span style={{ fontSize:11, color:T.muted, fontFamily:"monospace" }}>{f.pecReference}</span>
                            <span style={{ fontSize:11, color:T.muted, background:"rgba(255,255,255,0.04)", padding:"1px 8px", borderRadius:4 }}>{f.category}</span>
                          </div>
                          <div style={{ fontWeight:700, fontSize:14, color:T.text }}>{f.title}</div>
                        </div>
                        <span style={{ color:T.muted, fontSize:12, marginTop:2, flexShrink:0, cursor:"pointer" }} onClick={()=>setOpen(p=>({...p,[f.id]:!p[f.id]}))}>{isOpen?"▲":"▼"}</span>
                      </div>
                      {isOpen && (
                        <div style={{ padding:"0 18px 16px 50px", borderTop:`1px solid ${cfg.border}` }}>
                          <div style={{ paddingTop:12, display:"flex", flexDirection:"column", gap:10 }}>
                            <div><Label>Finding</Label><div style={{ fontSize:13, color:T.muted, lineHeight:1.6 }}>{f.description}</div></div>
                            <div><Label>Recommendation</Label><div style={{ fontSize:13, color:T.success, lineHeight:1.6 }}>✓ {f.recommendation}</div></div>
                            {f.codeBasis && <div style={{ background:"rgba(0,0,0,0.2)", borderLeft:`3px solid ${cfg.border}`, padding:"10px 14px", borderRadius:"0 8px 8px 0", fontSize:12, color:T.muted, fontStyle:"italic", lineHeight:1.5 }}>{f.codeBasis}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Correction action bar */}
              {checkedCount > 0 && (
                <div style={{ background:T.accentDim, border:`1.5px solid rgba(245,158,11,0.3)`, borderRadius:12, padding:"16px 20px", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, animation:"fadeIn 0.2s ease" }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:T.accent }}>{checkedCount} error{checkedCount>1?"s":""} selected for correction</div>
                    <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>AI will generate specific drafting instructions for each selected item</div>
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <Label>Revision No.</Label>
                      <input type="number" value={revNum} min={1} max={99} onChange={e=>setRevNum(+e.target.value)} style={{ width:60, background:"#0f1117", border:`1.5px solid ${T.border}`, borderRadius:8, padding:"6px 10px", color:T.text, fontSize:14, fontWeight:700, outline:"none", textAlign:"center" }}/>
                    </div>
                    <button onClick={generateCorrections} disabled={correcting} style={{ background:correcting?"rgba(245,158,11,0.3)":`linear-gradient(135deg,${T.accent},#f97316)`, border:"none", color:correcting?"#666":"#000", fontWeight:700, padding:"10px 20px", borderRadius:10, cursor:correcting?"not-allowed":"pointer", fontSize:13, transition:"all 0.2s" }}>
                      {correcting ? "⚙️ Generating…" : "🤖 Generate Corrections"}
                    </button>
                  </div>
                </div>
              )}

              {/* Corrections result panel */}
              {corrections && (
                <div style={{ background:"rgba(16,185,129,0.05)", border:"1.5px solid rgba(16,185,129,0.25)", borderRadius:12, padding:20, marginBottom:16, animation:"fadeIn 0.3s ease" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:15, color:T.success }}>✅ Corrections Generated — Rev {revNum}</div>
                      <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{corrections.length} drafting instruction{corrections.length>1?"s":""} ready for your draftsman</div>
                    </div>
                    <button onClick={()=>exportRevisionPDF(result, corrections, revNum)} style={{ background:`linear-gradient(135deg,${T.success},#059669)`, border:"none", color:"#fff", fontWeight:700, padding:"10px 20px", borderRadius:10, cursor:"pointer", fontSize:13, boxShadow:"0 4px 14px rgba(16,185,129,0.3)" }}>
                      📄 Download Revision PDF
                    </button>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {corrections.map((c,i)=>(
                      <div key={c.id||i} style={{ background:T.dim, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
                          <span style={{ background:"#1f2937", color:T.accent, fontSize:11, fontWeight:800, padding:"2px 10px", borderRadius:4, letterSpacing:"0.5px" }}>REV-{String(i+1).padStart(2,"0")}</span>
                          <span style={{ fontSize:12, fontWeight:700, color:T.text }}>{c.title}</span>
                          <span style={{ fontSize:11, color:T.muted, fontFamily:"monospace" }}>{c.pecReference}</span>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                          <div style={{ background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:8, padding:"10px 12px" }}>
                            <div style={{ fontSize:10, fontWeight:700, color:T.accent, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>📐 Corrected Value</div>
                            <div style={{ fontSize:13, color:T.text, lineHeight:1.6 }}>{c.correctedValues||c.recommendation}</div>
                          </div>
                          <div style={{ background:"rgba(16,185,129,0.07)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:8, padding:"10px 12px" }}>
                            <div style={{ fontSize:10, fontWeight:700, color:T.success, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>✏️ Drafting Instruction</div>
                            <div style={{ fontSize:13, color:T.text, lineHeight:1.6 }}>{c.draftingInstruction||"Apply correction as indicated"}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div style={{ marginTop:20, padding:"10px 16px", background:T.dim, borderRadius:10, fontSize:12, color:T.muted, lineHeight:1.5 }}>
            ⚠️ AI-generated report for reference only. All plans must be reviewed and stamped by a licensed PEE before submission to MERALCO, LGU, or DPWH.
          </div>
        </div>
      )}

      {!files.length && !result && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10, marginTop:4 }}>
          {[{i:"🏠",t:"Residential",d:"House wiring, circuits, panels"},{i:"🏢",t:"Commercial",d:"Office, mall, GFCI/AFCI"},{i:"🔥",t:"FSIC / Fire Code",d:"Emergency lights, exit signs"},{i:"🌱",t:"Green Building",d:"LPD, sub-metering"}].map(x=>(
            <Card key={x.t} style={{ textAlign:"center", padding:18 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{x.i}</div>
              <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:4 }}>{x.t}</div>
              <div style={{ fontSize:11, color:T.muted, lineHeight:1.5 }}>{x.d}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STRUCTURAL CODE DATA ────────────────────────────────────────────────────
const NSCP_SYSTEM_PROMPT = `You are a licensed Professional Civil/Structural Engineer (PSCE) expert in the National Structural Code of the Philippines (NSCP) 2015 7th Edition, and DPWH Blue Book. You review structural plans and documents for compliance.

Be CONCISE. Max 15 findings. Each description ≤60 words, recommendation ≤40 words, codeBasis ≤30 words.

Check:
1. Load Combinations (NSCP Section 203)
2. Seismic Design (NSCP Section 208)
3. Wind Load (NSCP Section 207)
4. Concrete Design (NSCP Section 405–411)
5. Steel Design (NSCP Section 502–510)
6. Foundation Design (NSCP Section 303)
7. Beam/Column Detailing (NSCP Section 407–408)
8. Slab Design (NSCP Section 406)
9. Connection Design (NSCP Section 504)
10. Material Specifications (NSCP Section 403)

Respond ONLY as valid JSON (no markdown, no preamble):
{"summary":{"projectName":"string","structureType":"Residential|Commercial|Industrial|Bridge|Retaining Wall|Unknown","fileType":"string","overallStatus":"NON-COMPLIANT|COMPLIANT WITH WARNINGS|COMPLIANT","criticalCount":0,"warningCount":0,"infoCount":0,"analysisNotes":"under 60 words"},"findings":[{"id":1,"severity":"CRITICAL|WARNING|INFO","category":"Load Combination|Seismic|Wind|Concrete|Steel|Foundation|Beam/Column|Slab|Connection|Materials|Other","nscpReference":"NSCP 2015 Sec. X.X","title":"under 8 words","description":"under 60 words","recommendation":"under 40 words","codeBasis":"under 30 words"}],"checklist":{"loadCombinations":true,"seismicDesign":true,"windLoad":true,"concreteDesign":true,"steelDesign":null,"foundationDesign":true,"beamColumnDetailing":true,"slabDesign":true,"connectionDesign":null,"materialSpecs":true}}`;

// Seismic zone data for Philippines (NSCP 2015 Section 208)
const PH_SEISMIC_ZONES = {
  "Zone 2": { Z: 0.20, desc: "Low seismicity — Palawan, parts of Mindanao" },
  "Zone 4": { Z: 0.40, desc: "High seismicity — most of Luzon, Visayas, Mindanao" },
};

const SOIL_TYPES = {
  "SA - Hard Rock":        { Fa: 0.8,  Fv: 0.8  },
  "SB - Rock":             { Fa: 1.0,  Fv: 1.0  },
  "SC - Very Dense Soil":  { Fa: 1.2,  Fv: 1.7  },
  "SD - Stiff Soil":       { Fa: 1.6,  Fv: 2.4  },
  "SE - Soft Clay":        { Fa: 2.5,  Fv: 3.5  },
};

const OCCUPANCY_I = {
  "I - Standard":  1.0,
  "II - Essential": 1.25,
  "III - Hazardous": 1.5,
};

// Concrete mix design (MPa)
const CONCRETE_GRADES = { "f'c 17.2 (2500 psi)":17.2, "f'c 20.7 (3000 psi)":20.7, "f'c 24.1 (3500 psi)":24.1, "f'c 27.6 (4000 psi)":27.6, "f'c 34.5 (5000 psi)":34.5 };
const REBAR_GRADES    = { "Grade 40 (276 MPa)":276, "Grade 60 (414 MPa)":414, "Grade 75 (517 MPa)":517 };

// ─── STRUCTICODE: AI PLAN CHECKER ────────────────────────────────────────────
function StructuralChecker({ apiKey }) {
  const [files,setFiles]   = useState([]);
  const [result,setResult] = useState(null);
  const [busy,setBusy]     = useState(false);
  const [error,setError]   = useState(null);
  const [drag,setDrag]     = useState(false);
  const [tab,setTab]       = useState("all");
  const [open,setOpen]     = useState({});
  const [checked,setChecked]   = useState({});
  const [corrections,setCorrections] = useState(null);
  const [correcting,setCorrecting]   = useState(false);
  const [revNum,setRevNum] = useState(1);
  const ref = useRef(null);

  const addFiles = useCallback(fs=>{
    setFiles(p=>[...p,...Array.from(fs).map(f=>({file:f,id:Math.random().toString(36).slice(2),name:f.name,size:f.size,type:f.type||"application/octet-stream"}))]);
    setResult(null); setError(null);
  },[]);

  const run = async () => {
    if(!files.length) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const blocks=[];
      for(const fo of files){
        const b64=await toBase64(fo.file);
        if(fo.type.startsWith("image/")) { blocks.push({type:"image",source:{type:"base64",media_type:fo.type,data:b64}}); blocks.push({type:"text",text:`[Image: ${fo.name}]`}); }
        else if(fo.type==="application/pdf") { blocks.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}}); blocks.push({type:"text",text:`[PDF: ${fo.name}]`}); }
        else blocks.push({type:"text",text:`[File: ${fo.name}]`});
      }
      blocks.push({type:"text",text:"Analyze uploaded structural plans for NSCP 2015 compliance. Return only JSON."});
      const hdrs={"Content-Type":"application/json"}; if(apiKey) hdrs["x-api-key"]=apiKey;
      const res = await fetch("/api/anthropic",{method:"POST",headers:hdrs,body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:8000,system:NSCP_SYSTEM_PROMPT,messages:[{role:"user",content:blocks}]})});
      const data = await res.json();
      if(data.error) throw new Error(data.error.message||"API Error");
      const raw = data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      let parsed; try { parsed=JSON.parse(raw); } catch { throw new Error("Could not parse AI response."); }
      setResult(parsed); setOpen({}); setTab("all"); setChecked({}); setCorrections(null);
    } catch(e){ setError(e.message||"Analysis failed."); }
    finally { setBusy(false); }
  };

  const findings = result?.findings||[];
  const filtered = tab==="all"?findings:findings.filter(f=>f.severity===tab);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const allChecked = findings.length>0 && findings.every(f=>checked[f.id]);
  const toggleAll = ()=>{ if(allChecked) setChecked({}); else { const a={}; findings.forEach(f=>a[f.id]=true); setChecked(a); } };

  const generateCorrections = async () => {
    const selected = findings.filter(f=>checked[f.id]);
    if(!selected.length) return;
    setCorrecting(true); setCorrections(null);
    try {
      const hdrs={"Content-Type":"application/json"}; if(apiKey) hdrs["x-api-key"]=apiKey;
      const prompt=`You are a licensed PSCE. For each structural finding below, generate specific drafting correction instructions.

Findings:
${selected.map((f,i)=>`${i+1}. [${f.severity}] ${f.title} — ${f.description} (${f.nscpReference})`).join("\n")}

Respond ONLY as valid JSON array:
[{"id":1,"title":"...","severity":"...","description":"...","nscpReference":"...","recommendation":"...","correctedValues":"Specific corrected value e.g. Increase column size from 300x300 to 400x400mm, add 8-25mm dia. bars","draftingInstruction":"Exact instruction e.g. On Sheet S-3, Detail A, revise column reinforcement schedule. Add revision cloud."}]`;
      const res = await fetch("/api/anthropic",{method:"POST",headers:hdrs,body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:4000,messages:[{role:"user",content:prompt}]})});
      const data = await res.json();
      if(data.error) throw new Error(data.error.message||"API Error");
      const raw = data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      setCorrections(JSON.parse(raw));
    } catch(e){ alert("Could not generate corrections: "+e.message); }
    finally { setCorrecting(false); }
  };

  const S_STATUS = {"NON-COMPLIANT":"#dc2626","COMPLIANT WITH WARNINGS":"#d97706","COMPLIANT":"#16a34a"};

  return (
    <div>
      <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files)}}
        onClick={()=>ref.current?.click()}
        style={{border:`2px dashed ${drag?"#3b82f6":T.border}`,borderRadius:16,padding:"40px 24px",textAlign:"center",cursor:"pointer",background:drag?"rgba(59,130,246,0.05)":"rgba(255,255,255,0.01)",transition:"all 0.2s",marginBottom:20}}>
        <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e=>addFiles(e.target.files)} style={{display:"none"}}/>
        <div style={{fontSize:40,marginBottom:12}}>📐</div>
        <div style={{fontWeight:700,fontSize:16,color:T.text,marginBottom:6}}>Drop structural plans here</div>
        <div style={{color:T.muted,fontSize:13,marginBottom:16}}>PDF drawings · JPG / PNG images</div>
        <div style={{display:"inline-block",background:"linear-gradient(135deg,#3b82f6,#6366f1)",color:"#fff",fontWeight:700,padding:"9px 22px",borderRadius:10,fontSize:14}}>Choose Files</div>
      </div>
      {files.length>0&&(<div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>{files.map(fo=>(<div key={fo.id} style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 10px",display:"flex",alignItems:"center",gap:8}}><span>{fo.type.startsWith("image")?"🖼️":"📄"}</span><div style={{fontSize:12,color:T.text,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fo.name}</div><button onClick={()=>setFiles(p=>p.filter(f=>f.id!==fo.id))} style={{background:"rgba(239,68,68,0.12)",border:"none",color:T.danger,width:22,height:22,borderRadius:5,cursor:"pointer",fontSize:12}}>✕</button></div>))}</div>)}
      {files.length>0&&(<button onClick={run} disabled={busy} style={{width:"100%",background:busy?"rgba(59,130,246,0.2)":"linear-gradient(135deg,#3b82f6,#6366f1)",border:"none",color:busy?"#666":"#fff",fontWeight:700,fontSize:15,padding:"14px",borderRadius:12,cursor:busy?"not-allowed":"pointer",marginBottom:20,transition:"all 0.2s"}}>{busy?"⚙️ Analyzing against NSCP 2015…":`🏗️ Run Structural Compliance Check (${files.length} file${files.length>1?"s":""})`}</button>)}
      {error&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"12px 16px",marginBottom:20,color:T.danger,fontSize:14}}>⚠️ {error}</div>}

      {result&&(
        <div style={{animation:"fadeIn 0.35s ease"}}>
          <Card style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:11,color:T.muted,marginBottom:4}}>PROJECT</div>
                <div style={{fontWeight:800,fontSize:18,color:T.text}}>{result.summary.projectName}</div>
                <div style={{fontSize:13,color:T.muted,marginTop:2}}>{result.summary.structureType} · {result.summary.fileType}</div>
                <div style={{marginTop:12,display:"flex",gap:24}}>
                  <div><div style={{fontSize:26,fontWeight:800,color:"#dc2626"}}>{result.summary.criticalCount}</div><div style={{fontSize:11,color:T.muted}}>CRITICAL</div></div>
                  <div><div style={{fontSize:26,fontWeight:800,color:"#d97706"}}>{result.summary.warningCount}</div><div style={{fontSize:11,color:T.muted}}>WARNINGS</div></div>
                  <div><div style={{fontSize:26,fontWeight:800,color:"#3b82f6"}}>{result.summary.infoCount}</div><div style={{fontSize:11,color:T.muted}}>INFO</div></div>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{background:`${S_STATUS[result.summary.overallStatus]}14`,border:`2px solid ${S_STATUS[result.summary.overallStatus]}44`,borderRadius:12,padding:"10px 18px",marginBottom:8}}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:4}}>OVERALL STATUS</div>
                  <div style={{fontSize:13,fontWeight:800,color:S_STATUS[result.summary.overallStatus]}}>{result.summary.overallStatus}</div>
                </div>
              </div>
            </div>
            <div style={{marginTop:12,fontSize:13,color:T.muted,lineHeight:1.6,background:T.dim,borderRadius:8,padding:"10px 14px"}}>{result.summary.analysisNotes}</div>
          </Card>

          {findings.length>0&&(
            <div>
              <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["all","CRITICAL","WARNING","INFO"].map(t=>{
                    const cnt=t==="all"?findings.length:findings.filter(f=>f.severity===t).length;
                    const active=tab===t;
                    return <button key={t} onClick={()=>setTab(t)} style={{padding:"7px 16px",borderRadius:8,border:`1.5px solid ${active?"#3b82f6":T.border}`,background:active?"rgba(59,130,246,0.12)":"transparent",color:active?"#3b82f6":T.muted,cursor:"pointer",fontSize:12,fontWeight:700}}>{t==="all"?"All":t} ({cnt})</button>;
                  })}
                </div>
                <button onClick={toggleAll} style={{padding:"7px 14px",borderRadius:8,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>{allChecked?"☑ Deselect All":"☐ Select All"}</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                {filtered.map(f=>{
                  const col={CRITICAL:"#dc2626",WARNING:"#d97706",INFO:"#3b82f6"}[f.severity]||"#3b82f6";
                  const bg={CRITICAL:"rgba(220,38,38,0.06)",WARNING:"rgba(217,119,6,0.06)",INFO:"rgba(59,130,246,0.06)"}[f.severity]||"rgba(59,130,246,0.06)";
                  const isOpen=open[f.id]; const isChecked=!!checked[f.id];
                  return (
                    <div key={f.id} style={{background:isChecked?bg:"rgba(255,255,255,0.01)",border:`1.5px solid ${isChecked?col:T.border}`,borderRadius:12,overflow:"hidden",transition:"all 0.15s"}}>
                      <div style={{padding:"13px 18px",display:"flex",alignItems:"flex-start",gap:12}}>
                        <div onClick={()=>setChecked(p=>({...p,[f.id]:!p[f.id]}))} style={{width:20,height:20,borderRadius:5,border:`2px solid ${isChecked?col:T.muted}`,background:isChecked?col:"transparent",cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                          {isChecked&&<span style={{color:"#fff",fontSize:12,fontWeight:800,lineHeight:1}}>✓</span>}
                        </div>
                        <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setOpen(p=>({...p,[f.id]:!p[f.id]}))}>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:4,alignItems:"center"}}>
                            <span style={{background:col,color:"#fff",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:4}}>{f.severity}</span>
                            <span style={{fontSize:11,color:T.muted,fontFamily:"monospace"}}>{f.nscpReference}</span>
                            <span style={{fontSize:11,color:T.muted,background:"rgba(255,255,255,0.04)",padding:"1px 8px",borderRadius:4}}>{f.category}</span>
                          </div>
                          <div style={{fontWeight:700,fontSize:14,color:T.text}}>{f.title}</div>
                        </div>
                        <span style={{color:T.muted,fontSize:12,marginTop:2,cursor:"pointer"}} onClick={()=>setOpen(p=>({...p,[f.id]:!p[f.id]}))}>{isOpen?"▲":"▼"}</span>
                      </div>
                      {isOpen&&(<div style={{padding:"0 18px 16px 50px",borderTop:`1px solid ${col}33`}}>
                        <div style={{paddingTop:12,display:"flex",flexDirection:"column",gap:10}}>
                          <div><Label>Finding</Label><div style={{fontSize:13,color:T.muted,lineHeight:1.6}}>{f.description}</div></div>
                          <div><Label>Recommendation</Label><div style={{fontSize:13,color:T.success,lineHeight:1.6}}>✓ {f.recommendation}</div></div>
                          {f.codeBasis&&<div style={{background:"rgba(0,0,0,0.2)",borderLeft:`3px solid ${col}`,padding:"10px 14px",borderRadius:"0 8px 8px 0",fontSize:12,color:T.muted,fontStyle:"italic",lineHeight:1.5}}>{f.codeBasis}</div>}
                        </div>
                      </div>)}
                    </div>
                  );
                })}
              </div>

              {checkedCount>0&&(
                <div style={{background:"rgba(59,130,246,0.08)",border:"1.5px solid rgba(59,130,246,0.25)",borderRadius:12,padding:"16px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:"#3b82f6"}}>{checkedCount} item{checkedCount>1?"s":""} selected for correction</div>
                    <div style={{fontSize:12,color:T.muted,marginTop:2}}>AI will generate specific drafting instructions per NSCP 2015</div>
                  </div>
                  <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><Label>Rev No.</Label><input type="number" value={revNum} min={1} max={99} onChange={e=>setRevNum(+e.target.value)} style={{width:60,background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:8,padding:"6px 10px",color:T.text,fontSize:14,fontWeight:700,outline:"none",textAlign:"center"}}/></div>
                    <button onClick={generateCorrections} disabled={correcting} style={{background:correcting?"rgba(59,130,246,0.3)":"linear-gradient(135deg,#3b82f6,#6366f1)",border:"none",color:correcting?"#666":"#fff",fontWeight:700,padding:"10px 20px",borderRadius:10,cursor:correcting?"not-allowed":"pointer",fontSize:13}}>
                      {correcting?"⚙️ Generating…":"🤖 Generate Corrections"}
                    </button>
                  </div>
                </div>
              )}

              {corrections&&(
                <div style={{background:"rgba(16,185,129,0.05)",border:"1.5px solid rgba(16,185,129,0.25)",borderRadius:12,padding:20,marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
                    <div><div style={{fontWeight:800,fontSize:15,color:T.success}}>✅ Corrections Generated — Rev {revNum}</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>{corrections.length} drafting instruction{corrections.length>1?"s":""} ready</div></div>
                    <button onClick={()=>{
                      const w=window.open("","_blank");
                      const date=new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});
                      const rows=corrections.map((c,i)=>`<tr><td style="padding:10px 8px;border:1px solid #e5e7eb;font-weight:700;color:#6b7280;text-align:center">REV-${String(i+1).padStart(2,"0")}</td><td style="padding:10px 8px;border:1px solid #e5e7eb;color:${{CRITICAL:"#dc2626",WARNING:"#d97706",INFO:"#2563eb"}[c.severity]};font-weight:700">${c.severity}</td><td style="padding:10px 8px;border:1px solid #e5e7eb;font-weight:600">${c.title}</td><td style="padding:10px 8px;border:1px solid #e5e7eb;font-size:12px">${c.description}</td><td style="padding:10px 8px;border:1px solid #e5e7eb;background:#fefce8">${c.correctedValues||c.recommendation}</td><td style="padding:10px 8px;border:1px solid #e5e7eb;background:#f0fdf4;color:#15803d">${c.draftingInstruction||""}</td><td style="padding:10px 8px;border:1px solid #e5e7eb;font-size:11px;color:#6b7280">${c.nscpReference}</td></tr>`).join("");
                      w.document.write(`<!DOCTYPE html><html><head><title>Structural Revision Report Rev ${revNum}</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#111;font-size:13px}table{border-collapse:collapse;width:100%}th{background:#1f2937;color:#fff;padding:9px 8px;text-align:left;font-size:11px}h1{color:#1f2937}h2{border-bottom:2px solid #f3f4f6;padding-bottom:6px;margin-top:24px}@media print{button{display:none}}</style></head><body><h1>🏗️ Structural Revision Report — Rev ${revNum}</h1><p style="color:#6b7280">NSCP 2015 · ${date} · Developed by Jon Ureta</p><h2>Corrections (${corrections.length} items)</h2><table><tr><th>Rev No.</th><th>Severity</th><th>Issue</th><th>Finding</th><th style="background:#92400e">Corrected Value</th><th style="background:#166534">Drafting Instruction</th><th>NSCP Ref.</th></tr>${rows}</table><div style="margin-top:24px;background:#eff6ff;border:1px solid #3b82f6;border-radius:8px;padding:14px 18px"><strong>Instructions for Draftsman:</strong><ol style="margin:8px 0 0;padding-left:18px;line-height:2"><li>Apply all corrections to the drawing file</li><li>Update revision block: Rev ${revNum}, ${date}</li><li>Add revision clouds around modified areas</li><li>Tag each cloud with Rev No. (REV-01, REV-02, etc.)</li><li>Submit to Engineer-of-Record for review and signature</li></ol></div><p style="margin-top:24px;font-size:11px;color:#9ca3af">⚠️ AI-generated report. All corrections must be verified by a licensed PSCE before implementation.</p></body></html>`);
                      w.document.close(); setTimeout(()=>w.print(),400);
                    }} style={{background:"linear-gradient(135deg,#10b981,#059669)",border:"none",color:"#fff",fontWeight:700,padding:"10px 20px",borderRadius:10,cursor:"pointer",fontSize:13}}>📄 Download Revision PDF</button>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {corrections.map((c,i)=>(
                      <div key={c.id||i} style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
                        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                          <span style={{background:"#1f2937",color:"#3b82f6",fontSize:11,fontWeight:800,padding:"2px 10px",borderRadius:4}}>REV-{String(i+1).padStart(2,"0")}</span>
                          <span style={{fontSize:12,fontWeight:700,color:T.text}}>{c.title}</span>
                          <span style={{fontSize:11,color:T.muted,fontFamily:"monospace"}}>{c.nscpReference}</span>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                          <div style={{background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,color:T.accent,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>📐 Corrected Value</div><div style={{fontSize:13,color:T.text,lineHeight:1.6}}>{c.correctedValues||c.recommendation}</div></div>
                          <div style={{background:"rgba(16,185,129,0.07)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,color:T.success,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>✏️ Drafting Instruction</div><div style={{fontSize:13,color:T.text,lineHeight:1.6}}>{c.draftingInstruction||"Apply correction as indicated"}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div style={{marginTop:20,padding:"10px 16px",background:T.dim,borderRadius:10,fontSize:12,color:T.muted,lineHeight:1.5}}>⚠️ AI-generated report for reference only. All plans must be reviewed and stamped by a licensed PSCE before submission to DPWH or LGU.</div>
        </div>
      )}
      {!files.length&&!result&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginTop:4}}>
          {[{i:"🏠",t:"Residential",d:"Beams, columns, slabs, footings"},{i:"🏢",t:"Commercial",d:"Multi-storey RC/Steel structures"},{i:"🌉",t:"Bridge/Infrastructure",d:"DPWH Blue Book compliance"},{i:"🌍",t:"Seismic Check",d:"NSCP 2015 Section 208"}].map(x=>(
            <Card key={x.t} style={{textAlign:"center",padding:18}}><div style={{fontSize:28,marginBottom:8}}>{x.i}</div><div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:4}}>{x.t}</div><div style={{fontSize:11,color:T.muted,lineHeight:1.5}}>{x.d}</div></Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STRUCTICODE: SEISMIC LOAD CALC ──────────────────────────────────────────
function SeismicCalc() {
  const [zone,setZone]     = useState("Zone 4");
  const [soil,setSoil]     = useState("SD - Stiff Soil");
  const [occ,setOcc]       = useState("I - Standard");
  const [W,setW]           = useState(5000);    // kN
  const [T,setTp]          = useState(0.3);     // period sec
  const [R,setR]           = useState(8.5);     // response mod factor
  const [result,setResult] = useState(null);

  const calc = () => {
    const Zv  = PH_SEISMIC_ZONES[zone].Z;
    const {Fa,Fv} = SOIL_TYPES[soil];
    const I   = OCCUPANCY_I[occ];
    const Ca  = 0.4*Fa*Zv;
    const Cv  = 0.4*Fv*Zv*1.5;
    const Ts  = Cv/(2.5*Ca);
    const T0  = 0.2*Ts;
    let Sa;
    if(T<=T0)      Sa = Ca*(0.6*(T/T0)+0.4);
    else if(T<=Ts) Sa = 2.5*Ca;
    else           Sa = Cv/T;
    const Vmin = 0.11*Ca*I*W;
    const Vmax = 2.5*Ca*I*W/R;
    const V    = Math.max(Vmin, Math.min(Sa*I*W/R, Vmax));
    const Cs   = V/W;
    setResult({Ca,Cv,Ts,T0,Sa,V,Cs,Vmin,Vmax,Zv,I,Fa,Fv});
  };

  const TK = T; // local theme alias
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Seismic Zone (NSCP 2015 Sec. 208.4)</Label>
        <Select value={zone} onChange={e=>setZone(e.target.value)} style={{marginBottom:4}}>
          {Object.entries(PH_SEISMIC_ZONES).map(([k,v])=><option key={k} value={k}>{k} — Z={v.Z}</option>)}
        </Select>
        <div style={{fontSize:11,color:T.muted,marginBottom:16}}>{PH_SEISMIC_ZONES[zone].desc}</div>

        <Label>Soil Profile Type (NSCP Table 208-2)</Label>
        <Select value={soil} onChange={e=>setSoil(e.target.value)} style={{marginBottom:16}}>
          {Object.keys(SOIL_TYPES).map(k=><option key={k} value={k}>{k}</option>)}
        </Select>

        <Label>Occupancy Category</Label>
        <Select value={occ} onChange={e=>setOcc(e.target.value)} style={{marginBottom:16}}>
          {Object.keys(OCCUPANCY_I).map(k=><option key={k} value={k}>{k} (I={OCCUPANCY_I[k]})</option>)}
        </Select>

        <Label>Seismic Weight W (kN)</Label>
        <Input type="number" value={W} onChange={e=>setW(+e.target.value)} style={{marginBottom:16}}/>

        <Label>Fundamental Period T (seconds)</Label>
        <Input type="number" value={TK} onChange={e=>setTp(+e.target.value)} step="0.05" style={{marginBottom:16}}/>

        <Label>Response Modification Factor R</Label>
        <Input type="number" value={R} onChange={e=>setR(+e.target.value)} step="0.5" style={{marginBottom:20}}/>
        <div style={{fontSize:11,color:T.muted,marginBottom:16}}>Typical: SMRF=8.5, OMRF=3.5, Shear Wall=5.5</div>

        <button onClick={calc} style={{width:"100%",background:"linear-gradient(135deg,#3b82f6,#6366f1)",border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>🌍 Calculate Seismic Base Shear</button>
      </Card>

      {result ? (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:"rgba(59,130,246,0.06)",border:"1.5px solid rgba(59,130,246,0.3)"}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>DESIGN BASE SHEAR</div>
            <div style={{fontSize:42,fontWeight:900,color:"#3b82f6",letterSpacing:"-2px"}}>{result.V.toFixed(1)} <span style={{fontSize:18,fontWeight:400}}>kN</span></div>
            <div style={{fontSize:13,color:T.muted,marginTop:4}}>Cs = {(result.Cs*100).toFixed(2)}% of seismic weight</div>
          </Card>
          {[
            {l:"Seismic Zone Factor Z",v:`${result.Zv}`},
            {l:"Site Coefficient Fa",v:`${result.Fa}`},
            {l:"Site Coefficient Fv",v:`${result.Fv}`},
            {l:"Seismic Coeff. Ca",v:`${result.Ca.toFixed(4)}`},
            {l:"Seismic Coeff. Cv",v:`${result.Cv.toFixed(4)}`},
            {l:"Spectral Accel. Sa",v:`${result.Sa.toFixed(4)} g`},
            {l:"Characteristic Period Ts",v:`${result.Ts.toFixed(3)} s`},
            {l:"Min Base Shear Vmin",v:`${result.Vmin.toFixed(1)} kN`},
            {l:"Max Base Shear Vmax",v:`${result.Vmax.toFixed(1)} kN`},
            {l:"Design Base Shear V",v:`${result.V.toFixed(1)} kN`,highlight:true},
          ].map(r=>(
            <div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 14px",background:r.highlight?"rgba(59,130,246,0.1)":T.dim,borderRadius:8,border:r.highlight?"1px solid rgba(59,130,246,0.3)":"none"}}>
              <span style={{fontSize:13,color:T.muted}}>{r.l}</span>
              <span style={{fontSize:14,fontWeight:700,color:r.highlight?"#3b82f6":T.text,fontFamily:"monospace"}}>{r.v}</span>
            </div>
          ))}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>
            Formula: V = Sa·I·W/R, bounded by Vmin = 0.11·Ca·I·W and Vmax = 2.5·Ca·I·W/R
          </div>
        </div>
      ) : (
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}>
          <div style={{fontSize:48}}>🌍</div>
          <div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter parameters and click<br/>Calculate to see results</div>
        </Card>
      )}
    </div>
  );
}

// ─── STRUCTICODE: BEAM DESIGN ─────────────────────────────────────────────────
function BeamDesign() {
  const [fc,setFc]   = useState(27.6);
  const [fy,setFy]   = useState(414);
  const [b,setB]     = useState(300);    // mm
  const [d,setD]     = useState(500);    // mm
  const [Mu,setMu]   = useState(150);    // kN·m
  const [Vu,setVu]   = useState(120);    // kN
  const [result,setResult] = useState(null);

  const calc = () => {
    const bm=b/1000, dm=d/1000; // convert to meters
    const phi_b=0.90, phi_v=0.85;
    const Rn = (Mu*1000)/(phi_b*bm*dm*dm*1e6); // MPa
    const rho_req = (0.85*fc/fy)*(1-Math.sqrt(1-(2*Rn)/(0.85*fc)));
    const rho_min = Math.max(1.4/fy, 0.25*Math.sqrt(fc)/fy);
    const rho_max = 0.75*0.85*0.85*(fc/fy)*(600/(600+fy));
    const rho_use = Math.max(rho_min, Math.min(rho_req, rho_max));
    const As_req  = rho_use*b*d; // mm²
    // Shear
    const Vc = (1/6)*Math.sqrt(fc)*b*d/1000; // kN
    const Vs_req = Vu/phi_v - Vc;
    const needsStirrup = Vs_req > 0;
    const s_max = Math.min(d/2, 600); // mm max stirrup spacing
    const Av_req = needsStirrup ? (Vs_req*1000*s_max)/(fy*d) : 0; // mm²
    const status_flex = rho_req <= rho_max ? "PASS" : "FAIL";
    const status_shear = Vc >= Vu/phi_v ? "PASS" : "NEEDS STIRRUPS";
    setResult({Rn,rho_req,rho_min,rho_max,rho_use,As_req,Vc,Vs_req,needsStirrup,s_max,Av_req,status_flex,status_shear});
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Concrete Strength f'c</Label>
        <Select value={fc} onChange={e=>setFc(+e.target.value)} style={{marginBottom:16}}>
          {Object.entries(CONCRETE_GRADES).map(([k,v])=><option key={k} value={v}>{k}</option>)}
        </Select>
        <Label>Steel Yield Strength fy</Label>
        <Select value={fy} onChange={e=>setFy(+e.target.value)} style={{marginBottom:16}}>
          {Object.entries(REBAR_GRADES).map(([k,v])=><option key={k} value={v}>{k}</option>)}
        </Select>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div><Label>Width b (mm)</Label><Input type="number" value={b} onChange={e=>setB(+e.target.value)}/></div>
          <div><Label>Eff. Depth d (mm)</Label><Input type="number" value={d} onChange={e=>setD(+e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          <div><Label>Factored Moment Mu (kN·m)</Label><Input type="number" value={Mu} onChange={e=>setMu(+e.target.value)}/></div>
          <div><Label>Factored Shear Vu (kN)</Label><Input type="number" value={Vu} onChange={e=>setVu(+e.target.value)}/></div>
        </div>
        <button onClick={calc} style={{width:"100%",background:"linear-gradient(135deg,#3b82f6,#6366f1)",border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>📐 Design Beam Section</button>
      </Card>

      {result ? (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Card style={{background:result.status_flex==="PASS"?"rgba(16,185,129,0.06)":"rgba(239,68,68,0.06)",border:`1.5px solid ${result.status_flex==="PASS"?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`}}>
              <div style={{fontSize:11,color:T.muted,marginBottom:4}}>FLEXURE</div>
              <div style={{fontSize:28,fontWeight:900,color:result.status_flex==="PASS"?T.success:T.danger}}>{result.status_flex}</div>
            </Card>
            <Card style={{background:result.status_shear==="PASS"?"rgba(16,185,129,0.06)":"rgba(245,158,11,0.06)",border:`1.5px solid ${result.status_shear==="PASS"?"rgba(16,185,129,0.3)":"rgba(245,158,11,0.3)"}`}}>
              <div style={{fontSize:11,color:T.muted,marginBottom:4}}>SHEAR</div>
              <div style={{fontSize:18,fontWeight:900,color:result.status_shear==="PASS"?T.success:T.warn}}>{result.status_shear}</div>
            </Card>
          </div>
          {[
            {l:"Required As (flexure)",v:`${result.As_req.toFixed(0)} mm²`,highlight:true},
            {l:"Req. steel ratio ρ",v:result.rho_req.toFixed(5)},
            {l:"Min steel ratio ρmin",v:result.rho_min.toFixed(5)},
            {l:"Max steel ratio ρmax",v:result.rho_max.toFixed(5)},
            {l:"Design ratio ρuse",v:result.rho_use.toFixed(5)},
            {l:"Nominal moment Rn",v:`${result.Rn.toFixed(2)} MPa`},
            {l:"Concrete shear cap. Vc",v:`${result.Vc.toFixed(1)} kN`},
            result.needsStirrup&&{l:"Required Av/s",v:`${result.Av_req.toFixed(1)} mm²/mm`,highlight:true},
            result.needsStirrup&&{l:"Max stirrup spacing",v:`${result.s_max} mm`},
          ].filter(Boolean).map(r=>(
            <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.highlight?"rgba(59,130,246,0.08)":T.dim,borderRadius:8,border:r.highlight?"1px solid rgba(59,130,246,0.2)":"none"}}>
              <span style={{fontSize:13,color:T.muted}}>{r.l}</span>
              <span style={{fontSize:14,fontWeight:700,color:r.highlight?"#3b82f6":T.text,fontFamily:"monospace"}}>{r.v}</span>
            </div>
          ))}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>NSCP 2015 Sec. 405 · USD/Strength Method · φb=0.90, φv=0.85</div>
        </div>
      ) : (
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}>
          <div style={{fontSize:48}}>📐</div>
          <div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter beam parameters<br/>and click Design</div>
        </Card>
      )}
    </div>
  );
}

// ─── STRUCTICODE: COLUMN DESIGN ───────────────────────────────────────────────
function ColumnDesign() {
  const [fc,setFc]   = useState(27.6);
  const [fy,setFy]   = useState(414);
  const [b,setB]     = useState(400);
  const [h,setH]     = useState(400);
  const [Pu,setPu]   = useState(1500); // kN
  const [Mu,setMu]   = useState(80);   // kN·m
  const [type,setType] = useState("tied");
  const [result,setResult] = useState(null);

  const calc = () => {
    const Ag = b*h; // mm²
    const phi = type==="tied"?0.65:0.75;
    const phi_b=0.65;
    const rho_min=0.01, rho_max=0.08;
    // Axial capacity at min/max rho
    const Po_min = 0.85*fc*(Ag-rho_min*Ag)+fy*rho_min*Ag;
    const Po_max = 0.85*fc*(Ag-rho_max*Ag)+fy*rho_max*Ag;
    const phiPn_max = phi*(0.8*(0.85*fc*(Ag)+fy*rho_min*Ag));  // simplified
    // Required Ast
    const Pn_req = Pu*1000/phi;
    const Ast_req = Math.max((Pn_req/0.80 - 0.85*fc*Ag)/(fy - 0.85*fc), rho_min*Ag);
    const rho_req = Ast_req/Ag;
    const phiPn = phi*0.80*(0.85*fc*(Ag-Ast_req)+fy*Ast_req)/1000; // kN
    const ecc = Mu/Pu*1000; // mm
    const status = (rho_req<=rho_max && rho_req>=rho_min && phiPn>=Pu) ? "PASS" : "FAIL";
    setResult({Ag,Ast_req,rho_req,rho_min,rho_max,phiPn,ecc,status,phi});
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Concrete Strength f'c</Label>
        <Select value={fc} onChange={e=>setFc(+e.target.value)} style={{marginBottom:16}}>
          {Object.entries(CONCRETE_GRADES).map(([k,v])=><option key={k} value={v}>{k}</option>)}
        </Select>
        <Label>Steel Yield Strength fy</Label>
        <Select value={fy} onChange={e=>setFy(+e.target.value)} style={{marginBottom:16}}>
          {Object.entries(REBAR_GRADES).map(([k,v])=><option key={k} value={v}>{k}</option>)}
        </Select>
        <Label>Column Type</Label>
        <Select value={type} onChange={e=>setType(e.target.value)} style={{marginBottom:16}}>
          <option value="tied">Tied Column (φ=0.65)</option>
          <option value="spiral">Spiral Column (φ=0.75)</option>
        </Select>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div><Label>Width b (mm)</Label><Input type="number" value={b} onChange={e=>setB(+e.target.value)}/></div>
          <div><Label>Depth h (mm)</Label><Input type="number" value={h} onChange={e=>setH(+e.target.value)}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          <div><Label>Factored Axial Pu (kN)</Label><Input type="number" value={Pu} onChange={e=>setPu(+e.target.value)}/></div>
          <div><Label>Factored Moment Mu (kN·m)</Label><Input type="number" value={Mu} onChange={e=>setMu(+e.target.value)}/></div>
        </div>
        <button onClick={calc} style={{width:"100%",background:"linear-gradient(135deg,#3b82f6,#6366f1)",border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>🏛️ Design Column Section</button>
      </Card>

      {result ? (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:result.status==="PASS"?"rgba(16,185,129,0.06)":"rgba(239,68,68,0.06)",border:`1.5px solid ${result.status==="PASS"?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>COLUMN STATUS</div>
            <div style={{fontSize:42,fontWeight:900,color:result.status==="PASS"?T.success:T.danger}}>{result.status}</div>
            <div style={{fontSize:13,color:T.muted,marginTop:4}}>φPn = {result.phiPn.toFixed(1)} kN vs Pu = {Pu} kN</div>
          </Card>
          {[
            {l:"Gross Area Ag",v:`${result.Ag.toFixed(0)} mm²`},
            {l:"Required Ast",v:`${result.Ast_req.toFixed(0)} mm²`,highlight:true},
            {l:"Required ρ",v:`${(result.rho_req*100).toFixed(2)}%`},
            {l:"Min ρ (1%)",v:"1.00%",ok:result.rho_req>=result.rho_min},
            {l:"Max ρ (8%)",v:"8.00%",ok:result.rho_req<=result.rho_max},
            {l:"φPn (capacity)",v:`${result.phiPn.toFixed(1)} kN`,highlight:true},
            {l:"Eccentricity e",v:`${result.ecc.toFixed(1)} mm`},
            {l:"Reduction factor φ",v:`${result.phi}`},
          ].map(r=>(
            <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.highlight?"rgba(59,130,246,0.08)":T.dim,borderRadius:8,border:r.highlight?"1px solid rgba(59,130,246,0.2)":"none"}}>
              <span style={{fontSize:13,color:T.muted}}>{r.l}</span>
              <span style={{fontSize:14,fontWeight:700,color:r.highlight?"#3b82f6":T.text,fontFamily:"monospace"}}>{r.v}</span>
            </div>
          ))}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>NSCP 2015 Sec. 410 · Short column assumption · Compression-controlled</div>
        </div>
      ) : (
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}>
          <div style={{fontSize:48}}>🏛️</div>
          <div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter column parameters<br/>and click Design</div>
        </Card>
      )}
    </div>
  );
}

// ─── STRUCTICODE: FOOTING DESIGN ─────────────────────────────────────────────
function FootingDesign() {
  const [fc,setFc]     = useState(20.7);
  const [fy,setFy]     = useState(276);
  const [P,setP]       = useState(800);    // kN service load
  const [qa,setQa]     = useState(150);    // kPa allowable bearing
  const [Df,setDf]     = useState(1.5);    // m depth
  const [conc_wt]      = useState(23.5);   // kN/m³
  const [result,setResult] = useState(null);

  const calc = () => {
    const qnet = qa - conc_wt*Df;
    const Areq = P/qnet;
    const B    = Math.ceil(Math.sqrt(Areq)*10)/10; // round up to 0.1m
    const A    = B*B;
    const qu   = (1.2*P + 0.0)/A; // factored (simplified)
    const Pu   = 1.2*P;
    const qu_f = Pu/A;
    // Depth from punching shear (assume d = B/5 min)
    const d_min = B*1000/5; // mm
    const d = Math.max(d_min, 250);
    // One-way shear check
    const Vc1 = (1/6)*Math.sqrt(fc)*(B*1000)*d/1000; // kN per meter width
    // Flexure — cantilever moment
    const c = (B - 0.4)/2; // assuming 400mm column
    const Mu = qu_f*B*c*c/2; // kN·m
    const phi=0.90;
    const Rn = (Mu*1e6)/(phi*(B*1000)*d*d);
    const rho = (0.85*fc/fy)*(1-Math.sqrt(1-(2*Rn)/(0.85*fc)));
    const rho_min = Math.max(0.0018, 1.4/fy);
    const rho_use = Math.max(rho, rho_min);
    const As = rho_use*(B*1000)*d; // mm²
    setResult({qnet,B,A,qu_f,d,Mu,As,rho_use,rho_min});
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Concrete Strength f'c</Label>
        <Select value={fc} onChange={e=>setFc(+e.target.value)} style={{marginBottom:16}}>
          {Object.entries(CONCRETE_GRADES).map(([k,v])=><option key={k} value={v}>{k}</option>)}
        </Select>
        <Label>Steel Yield Strength fy</Label>
        <Select value={fy} onChange={e=>setFy(+e.target.value)} style={{marginBottom:16}}>
          {Object.entries(REBAR_GRADES).map(([k,v])=><option key={k} value={v}>{k}</option>)}
        </Select>
        <Label>Column Service Load P (kN)</Label>
        <Input type="number" value={P} onChange={e=>setP(+e.target.value)} style={{marginBottom:16}}/>
        <Label>Allowable Bearing Capacity qa (kPa)</Label>
        <Input type="number" value={qa} onChange={e=>setQa(+e.target.value)} style={{marginBottom:16}}/>
        <Label>Foundation Depth Df (m)</Label>
        <Input type="number" value={Df} onChange={e=>setDf(+e.target.value)} step="0.1" style={{marginBottom:20}}/>
        <button onClick={calc} style={{width:"100%",background:"linear-gradient(135deg,#3b82f6,#6366f1)",border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>🪨 Design Footing</button>
      </Card>

      {result ? (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:"rgba(59,130,246,0.06)",border:"1.5px solid rgba(59,130,246,0.3)"}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>FOOTING SIZE</div>
            <div style={{fontSize:42,fontWeight:900,color:"#3b82f6",letterSpacing:"-2px"}}>{result.B.toFixed(1)} <span style={{fontSize:18,fontWeight:400}}>m × {result.B.toFixed(1)} m</span></div>
            <div style={{fontSize:13,color:T.muted,marginTop:4}}>Area = {result.A.toFixed(2)} m²</div>
          </Card>
          {[
            {l:"Net bearing capacity qnet",v:`${result.qnet.toFixed(1)} kPa`},
            {l:"Factored soil pressure qu",v:`${result.qu_f.toFixed(2)} kPa`},
            {l:"Effective depth d",v:`${result.d.toFixed(0)} mm`},
            {l:"Factored moment Mu",v:`${result.Mu.toFixed(1)} kN·m`,highlight:true},
            {l:"Required As (each dir.)",v:`${result.As.toFixed(0)} mm²`,highlight:true},
            {l:"Design steel ratio ρ",v:`${(result.rho_use*100).toFixed(3)}%`},
            {l:"Min steel ratio ρmin",v:`${(result.rho_min*100).toFixed(3)}%`},
          ].map(r=>(
            <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.highlight?"rgba(59,130,246,0.08)":T.dim,borderRadius:8,border:r.highlight?"1px solid rgba(59,130,246,0.2)":"none"}}>
              <span style={{fontSize:13,color:T.muted}}>{r.l}</span>
              <span style={{fontSize:14,fontWeight:700,color:r.highlight?"#3b82f6":T.text,fontFamily:"monospace"}}>{r.v}</span>
            </div>
          ))}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>NSCP 2015 Sec. 305–306 · Square isolated footing · USD method</div>
        </div>
      ) : (
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}>
          <div style={{fontSize:48}}>🪨</div>
          <div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter footing parameters<br/>and click Design</div>
        </Card>
      )}
    </div>
  );
}

// ─── STRUCTICODE: SLAB DESIGN ─────────────────────────────────────────────────
function SlabDesign() {
  const [fc,setFc]     = useState(20.7);
  const [fy,setFy]     = useState(276);
  const [slabType,setSlabType] = useState("one-way");
  const [L,setL]       = useState(4.0);   // m span
  const [S,setS]       = useState(3.0);   // m short span (two-way)
  const [wDL,setWDL]   = useState(3.0);   // kPa dead load
  const [wLL,setWLL]   = useState(2.4);   // kPa live load
  const [result,setResult] = useState(null);

  const calc = () => {
    const wu = 1.2*wDL + 1.6*wLL;
    if(slabType==="one-way"){
      const h_min = L*1000/20; // mm (simply supported)
      const h     = Math.max(Math.ceil(h_min/10)*10, 100);
      const d     = h - 25; // mm cover
      const Mu   = wu*L*L/8; // kN·m/m
      const phi=0.90;
      const Rn   = (Mu*1e6)/(phi*1000*d*d);
      const rho  = (0.85*fc/fy)*(1-Math.sqrt(1-(2*Rn)/(0.85*fc)));
      const rho_min = Math.max(0.0018, 1.4/fy);
      const rho_use = Math.max(rho, rho_min);
      const As   = rho_use*1000*d; // mm²/m
      const As_temp = 0.0018*1000*h; // temp/shrinkage
      setResult({slabType,h,d,wu,Mu,As,As_temp,rho_use,rho_min,L,S:null,Ma:null,Mb:null});
    } else {
      // Two-way slab — coefficient method (NSCP Table 413-1, simply supported)
      const ratio = S/L; // short/long
      const Ca = ratio<=0.5?0.085:ratio<=0.6?0.071:ratio<=0.7?0.060:ratio<=0.8?0.051:ratio<=0.9?0.044:0.039;
      const Cb = ratio<=0.5?0.015:ratio<=0.6?0.021:ratio<=0.7?0.028:ratio<=0.8?0.037:ratio<=0.9?0.049:0.062;
      const h_min = S*1000/28;
      const h     = Math.max(Math.ceil(h_min/10)*10, 100);
      const d     = h - 25;
      const Ma   = Ca*wu*S*S; // kN·m/m short dir
      const Mb   = Cb*wu*S*S; // kN·m/m long dir
      const phi=0.90;
      const Rna  = (Ma*1e6)/(phi*1000*d*d);
      const Rnb  = (Mb*1e6)/(phi*1000*d*d);
      const rho_min=0.0018;
      const rhoA = Math.max((0.85*fc/fy)*(1-Math.sqrt(1-(2*Rna)/(0.85*fc))), rho_min);
      const rhoB = Math.max((0.85*fc/fy)*(1-Math.sqrt(1-(2*Rnb)/(0.85*fc))), rho_min);
      const AsA  = rhoA*1000*d;
      const AsB  = rhoB*1000*d;
      const As_temp = 0.0018*1000*h;
      setResult({slabType,h,d,wu,Mu:null,As:null,As_temp,rho_use:rhoA,rho_min,L,S,Ma,Mb,AsA,AsB,ratio});
    }
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Slab Type</Label>
        <Select value={slabType} onChange={e=>setSlabType(e.target.value)} style={{marginBottom:16}}>
          <option value="one-way">One-Way Slab (L/S &gt; 2)</option>
          <option value="two-way">Two-Way Slab (L/S ≤ 2)</option>
        </Select>
        <Label>Concrete f'c</Label>
        <Select value={fc} onChange={e=>setFc(+e.target.value)} style={{marginBottom:16}}>
          {Object.entries(CONCRETE_GRADES).map(([k,v])=><option key={k} value={v}>{k}</option>)}
        </Select>
        <Label>Steel fy</Label>
        <Select value={fy} onChange={e=>setFy(+e.target.value)} style={{marginBottom:16}}>
          {Object.entries(REBAR_GRADES).map(([k,v])=><option key={k} value={v}>{k}</option>)}
        </Select>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div><Label>{slabType==="two-way"?"Short Span S (m)":"Span L (m)"}</Label><Input type="number" value={slabType==="two-way"?S:L} onChange={e=>slabType==="two-way"?setS(+e.target.value):setL(+e.target.value)} step="0.1"/></div>
          {slabType==="two-way"&&<div><Label>Long Span L (m)</Label><Input type="number" value={L} onChange={e=>setL(+e.target.value)} step="0.1"/></div>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          <div><Label>Dead Load wDL (kPa)</Label><Input type="number" value={wDL} onChange={e=>setWDL(+e.target.value)} step="0.1"/></div>
          <div><Label>Live Load wLL (kPa)</Label><Input type="number" value={wLL} onChange={e=>setWLL(+e.target.value)} step="0.1"/></div>
        </div>
        <button onClick={calc} style={{width:"100%",background:"linear-gradient(135deg,#3b82f6,#6366f1)",border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>🔩 Design Slab</button>
      </Card>

      {result ? (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:"rgba(59,130,246,0.06)",border:"1.5px solid rgba(59,130,246,0.3)"}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>SLAB THICKNESS</div>
            <div style={{fontSize:42,fontWeight:900,color:"#3b82f6",letterSpacing:"-2px"}}>{result.h} <span style={{fontSize:18,fontWeight:400}}>mm</span></div>
            <div style={{fontSize:13,color:T.muted,marginTop:4}}>Effective depth d = {result.d} mm</div>
          </Card>
          {result.slabType==="one-way" ? (
            <>
              {[
                {l:"Factored load wu",v:`${result.wu.toFixed(2)} kPa`},
                {l:"Factored moment Mu",v:`${result.Mu.toFixed(2)} kN·m/m`},
                {l:"Required As (main)",v:`${result.As.toFixed(0)} mm²/m`,highlight:true},
                {l:"Temp/shrinkage As",v:`${result.As_temp.toFixed(0)} mm²/m`},
                {l:"Design ratio ρ",v:`${(result.rho_use*100).toFixed(3)}%`},
              ].map(r=>(
                <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.highlight?"rgba(59,130,246,0.08)":T.dim,borderRadius:8,border:r.highlight?"1px solid rgba(59,130,246,0.2)":"none"}}>
                  <span style={{fontSize:13,color:T.muted}}>{r.l}</span>
                  <span style={{fontSize:14,fontWeight:700,color:r.highlight?"#3b82f6":T.text,fontFamily:"monospace"}}>{r.v}</span>
                </div>
              ))}
            </>
          ) : (
            <>
              {[
                {l:"Span ratio S/L",v:`${result.ratio.toFixed(2)}`},
                {l:"Factored load wu",v:`${result.wu.toFixed(2)} kPa`},
                {l:"Moment Ma (short dir)",v:`${result.Ma.toFixed(2)} kN·m/m`},
                {l:"Moment Mb (long dir)",v:`${result.Mb.toFixed(2)} kN·m/m`},
                {l:"As short direction",v:`${result.AsA.toFixed(0)} mm²/m`,highlight:true},
                {l:"As long direction",v:`${result.AsB.toFixed(0)} mm²/m`,highlight:true},
                {l:"Temp/shrinkage As",v:`${result.As_temp.toFixed(0)} mm²/m`},
              ].map(r=>(
                <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.highlight?"rgba(59,130,246,0.08)":T.dim,borderRadius:8,border:r.highlight?"1px solid rgba(59,130,246,0.2)":"none"}}>
                  <span style={{fontSize:13,color:T.muted}}>{r.l}</span>
                  <span style={{fontSize:14,fontWeight:700,color:r.highlight?"#3b82f6":T.text,fontFamily:"monospace"}}>{r.v}</span>
                </div>
              ))}
            </>
          )}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>NSCP 2015 Sec. 406 · USD Method · φ=0.90 · 25mm clear cover</div>
        </div>
      ) : (
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}>
          <div style={{fontSize:48}}>🔩</div>
          <div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter slab parameters<br/>and click Design</div>
        </Card>
      )}
    </div>
  );
}

// ─── STRUCTICODE: LOAD COMBINATIONS ──────────────────────────────────────────
function LoadCombinations() {
  const [D,setD]   = useState(100);  // kN Dead
  const [L,setL]   = useState(80);   // kN Live
  const [W,setW]   = useState(40);   // kN Wind
  const [E,setE]   = useState(60);   // kN Seismic
  const [S,setS]   = useState(0);    // kN Snow
  const [result,setResult] = useState(null);

  const calc = () => {
    const combos = [
      {name:"1.4D",            val:1.4*D},
      {name:"1.2D + 1.6L",     val:1.2*D+1.6*L},
      {name:"1.2D + 1.6L + 0.5W", val:1.2*D+1.6*L+0.5*W},
      {name:"1.2D + 1.0W + 1.0L", val:1.2*D+1.0*W+1.0*L},
      {name:"1.2D + 1.0E + 1.0L", val:1.2*D+1.0*E+1.0*L},
      {name:"0.9D + 1.0W",     val:0.9*D+1.0*W},
      {name:"0.9D + 1.0E",     val:0.9*D+1.0*E},
      {name:"1.2D + 1.6S + 1.0L", val:1.2*D+1.6*S+1.0*L},
    ];
    const max = Math.max(...combos.map(c=>c.val));
    setResult(combos.map(c=>({...c,isMax:c.val===max})));
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>NSCP 2015 Section 203 — Load Combinations (USD)</Label>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:12,marginBottom:20}}>
          {[{l:"Dead Load D (kN)",v:D,s:setD},{l:"Live Load L (kN)",v:L,s:setL},{l:"Wind Load W (kN)",v:W,s:setW},{l:"Seismic Load E (kN)",v:E,s:setE},{l:"Snow Load S (kN)",v:S,s:setS}].map(f=>(
            <div key={f.l}><Label>{f.l}</Label><Input type="number" value={f.v} onChange={e=>f.s(+e.target.value)}/></div>
          ))}
        </div>
        <button onClick={calc} style={{width:"100%",background:"linear-gradient(135deg,#3b82f6,#6366f1)",border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>📊 Calculate Load Combinations</button>
      </Card>

      {result ? (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{fontSize:13,color:T.muted,marginBottom:4}}>All factored load combinations — NSCP 2015 Sec. 203.3</div>
          {result.map(r=>(
            <div key={r.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:r.isMax?"rgba(239,68,68,0.08)":T.dim,borderRadius:10,border:r.isMax?"1.5px solid rgba(239,68,68,0.3)":"1px solid transparent",transition:"all 0.15s"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                {r.isMax&&<span style={{background:"#dc2626",color:"#fff",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:4}}>MAX</span>}
                <span style={{fontSize:13,color:T.muted,fontFamily:"monospace"}}>{r.name}</span>
              </div>
              <span style={{fontSize:16,fontWeight:800,color:r.isMax?T.danger:T.text,fontFamily:"monospace"}}>{r.val.toFixed(1)} kN</span>
            </div>
          ))}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6,marginTop:4}}>Governing combination: <strong style={{color:T.danger}}>{result.find(r=>r.isMax)?.name}</strong> = {result.find(r=>r.isMax)?.val.toFixed(1)} kN</div>
        </div>
      ) : (
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}>
          <div style={{fontSize:48}}>📊</div>
          <div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter loads and click<br/>Calculate</div>
        </Card>
      )}
    </div>
  );
}

// ─── STRUCTICODE: MAIN WRAPPER ────────────────────────────────────────────────
function StructiCode({ apiKey }) {
  const [tool,setTool] = useState("checker");
  const TOOLS = [
    {key:"checker", icon:"🤖", label:"AI Plan Checker"},
    {key:"seismic", icon:"🌍", label:"Seismic Load"},
    {key:"beam",    icon:"📐", label:"Beam Design"},
    {key:"column",  icon:"🏛️", label:"Column Design"},
    {key:"footing", icon:"🪨", label:"Footing Design"},
    {key:"slab",    icon:"🔩", label:"Slab Design"},
    {key:"loads",   icon:"📊", label:"Load Combinations"},
  ];
  return (
    <div>
      {/* Sub-nav */}
      <div style={{display:"flex",gap:6,marginBottom:24,flexWrap:"wrap",paddingBottom:16,borderBottom:`1px solid ${T.border}`}}>
        {TOOLS.map(t=>(
          <button key={t.key} onClick={()=>setTool(t.key)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,border:`1.5px solid ${tool===t.key?"#3b82f6":T.border}`,background:tool===t.key?"rgba(59,130,246,0.12)":"transparent",color:tool===t.key?"#3b82f6":T.muted,cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.15s"}}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>
      {tool==="checker" && <StructuralChecker apiKey={apiKey}/>}
      {tool==="seismic" && <SeismicCalc/>}
      {tool==="beam"    && <BeamDesign/>}
      {tool==="column"  && <ColumnDesign/>}
      {tool==="footing" && <FootingDesign/>}
      {tool==="slab"    && <SlabDesign/>}
      {tool==="loads"   && <LoadCombinations/>}
    </div>
  );
}


// ─── SANICODE DATA ────────────────────────────────────────────────────────────
const SC = "#10b981";

const NPC_SYSTEM_PROMPT = `You are a licensed Sanitary Engineer expert in the National Plumbing Code of the Philippines (NPC 2000), Sanitation Code of the Philippines (PD 856), and Philippine Green Building Code. You review plumbing and sanitary plans for compliance.

Be CONCISE. Max 15 findings. Each description ≤60 words, recommendation ≤40 words, codeBasis ≤30 words.

Check:
1. Fixture Unit Loading (NPC Table 4-1)
2. Pipe Sizing Supply and Drainage (NPC Sec. 4)
3. Water Supply System (NPC Sec. 6)
4. Drainage System (NPC Sec. 7)
5. Venting System (NPC Sec. 9)
6. Septic Tank Design (PD 856)
7. Grease Trap Requirements (NPC Sec. 10)
8. Backflow Prevention (NPC Sec. 6.9)
9. Hot Water System (NPC Sec. 8)
10. Storm Drainage (NPC Sec. 11)

Respond ONLY as valid JSON (no markdown, no preamble):
{"summary":{"projectName":"string","buildingType":"Residential|Commercial|Industrial|Institutional|Unknown","fileType":"string","overallStatus":"NON-COMPLIANT|COMPLIANT WITH WARNINGS|COMPLIANT","criticalCount":0,"warningCount":0,"infoCount":0,"analysisNotes":"under 60 words"},"findings":[{"id":1,"severity":"CRITICAL|WARNING|INFO","category":"Fixture Units|Pipe Sizing|Water Supply|Drainage|Venting|Septic Tank|Grease Trap|Backflow|Hot Water|Storm Drainage|Other","npcReference":"NPC 2000 Sec. X.X","title":"under 8 words","description":"under 60 words","recommendation":"under 40 words","codeBasis":"under 30 words"}],"checklist":{"fixtureUnits":true,"pipeSizing":true,"waterSupply":true,"drainageSystem":true,"ventingSystem":true,"septicTank":null,"greaseTrap":null,"backflowPrevention":true,"hotWater":null,"stormDrainage":true}}`;

const FIXTURES = [
  {name:"Water Closet (Tank)",        dfu:4, wsfu_priv:5, wsfu_pub:6},
  {name:"Water Closet (Flush Valve)", dfu:6, wsfu_priv:7, wsfu_pub:8},
  {name:"Lavatory / Washbasin",       dfu:1, wsfu_priv:1, wsfu_pub:2},
  {name:"Bathtub (with shower)",      dfu:2, wsfu_priv:2, wsfu_pub:4},
  {name:"Shower (individual)",        dfu:2, wsfu_priv:2, wsfu_pub:3},
  {name:"Kitchen Sink",               dfu:2, wsfu_priv:2, wsfu_pub:4},
  {name:"Laundry Sink",               dfu:2, wsfu_priv:2, wsfu_pub:4},
  {name:"Floor Drain 2in",            dfu:1, wsfu_priv:1, wsfu_pub:1},
  {name:"Floor Drain 3in",            dfu:3, wsfu_priv:2, wsfu_pub:3},
  {name:"Floor Drain 4in",            dfu:6, wsfu_priv:3, wsfu_pub:4},
  {name:"Urinal (flush valve)",       dfu:4, wsfu_priv:4, wsfu_pub:6},
  {name:"Drinking Fountain",          dfu:1, wsfu_priv:1, wsfu_pub:1},
  {name:"Dishwasher",                 dfu:2, wsfu_priv:1.5,wsfu_pub:2},
  {name:"Washing Machine",            dfu:2, wsfu_priv:2, wsfu_pub:3},
  {name:"Slop Sink",                  dfu:3, wsfu_priv:2, wsfu_pub:3},
  {name:"Bidet",                      dfu:1, wsfu_priv:1.5,wsfu_pub:2},
  {name:"Hose Bib",                   dfu:0, wsfu_priv:2.5,wsfu_pub:2.5},
];

const DFU_TO_PIPE = [
  {maxDfu:1,dia:32},{maxDfu:3,dia:40},{maxDfu:6,dia:50},
  {maxDfu:12,dia:65},{maxDfu:20,dia:75},{maxDfu:160,dia:100},
  {maxDfu:360,dia:125},{maxDfu:620,dia:150},{maxDfu:1400,dia:200},
];

const WSFU_TO_GPM = wsfu => wsfu<=6?wsfu*1.5:wsfu<=10?wsfu*1.2:wsfu<=20?wsfu*1.0:wsfu*0.9;

// ─── SANICODE: AI PLAN CHECKER ────────────────────────────────────────────────
function PlumbingChecker({ apiKey }) {
  const [files,setFiles]=useState([]);
  const [result,setResult]=useState(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState(null);
  const [drag,setDrag]=useState(false);
  const [tab,setTab]=useState("all");
  const [open,setOpen]=useState({});
  const [checked,setChecked]=useState({});
  const [corrections,setCorrections]=useState(null);
  const [correcting,setCorrecting]=useState(false);
  const [revNum,setRevNum]=useState(1);
  const ref=useRef(null);
  const addFiles=useCallback(fs=>{setFiles(p=>[...p,...Array.from(fs).map(f=>({file:f,id:Math.random().toString(36).slice(2),name:f.name,size:f.size,type:f.type||"application/octet-stream"}))]);setResult(null);setError(null);},[]);
  const run=async()=>{
    if(!files.length)return;setBusy(true);setError(null);setResult(null);
    try{
      const blocks=[];
      for(const fo of files){const b64=await toBase64(fo.file);if(fo.type.startsWith("image/")){blocks.push({type:"image",source:{type:"base64",media_type:fo.type,data:b64}});blocks.push({type:"text",text:`[Image: ${fo.name}]`});}else if(fo.type==="application/pdf"){blocks.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}});blocks.push({type:"text",text:`[PDF: ${fo.name}]`});}}
      blocks.push({type:"text",text:"Analyze for NPC 2000 and PD 856 compliance. Return only JSON."});
      const hdrs={"Content-Type":"application/json"};if(apiKey)hdrs["x-api-key"]=apiKey;
      const res=await fetch("/api/anthropic",{method:"POST",headers:hdrs,body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:8000,system:NPC_SYSTEM_PROMPT,messages:[{role:"user",content:blocks}]})});
      const data=await res.json();if(data.error)throw new Error(data.error.message||"API Error");
      const raw=data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      let parsed;try{parsed=JSON.parse(raw);}catch{throw new Error("Could not parse AI response.");}
      setResult(parsed);setOpen({});setTab("all");setChecked({});setCorrections(null);
    }catch(e){setError(e.message||"Analysis failed.");}finally{setBusy(false);}
  };
  const findings=result?.findings||[];
  const filtered=tab==="all"?findings:findings.filter(f=>f.severity===tab);
  const checkedCount=Object.values(checked).filter(Boolean).length;
  const allChecked=findings.length>0&&findings.every(f=>checked[f.id]);
  const toggleAll=()=>{if(allChecked)setChecked({});else{const a={};findings.forEach(f=>a[f.id]=true);setChecked(a);}};
  const generateCorrections=async()=>{
    const selected=findings.filter(f=>checked[f.id]);if(!selected.length)return;
    setCorrecting(true);setCorrections(null);
    try{
      const hdrs={"Content-Type":"application/json"};if(apiKey)hdrs["x-api-key"]=apiKey;
      const prompt=`You are a licensed Sanitary Engineer. For each finding, generate specific NPC 2000 correction instructions.\nFindings:\n${selected.map((f,i)=>`${i+1}. [${f.severity}] ${f.title} — ${f.description} (${f.npcReference})`).join("\n")}\nRespond ONLY as valid JSON array: [{"id":1,"title":"...","severity":"...","description":"...","npcReference":"...","recommendation":"...","correctedValues":"specific corrected value e.g. Increase drain from 50mm to 75mm","draftingInstruction":"exact drafting instruction with sheet reference"}]`;
      const res=await fetch("/api/anthropic",{method:"POST",headers:hdrs,body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:4000,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();if(data.error)throw new Error(data.error.message);
      const raw=data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      setCorrections(JSON.parse(raw));
    }catch(e){alert("Could not generate corrections: "+e.message);}finally{setCorrecting(false);}
  };
  const STATUS_COL={"NON-COMPLIANT":"#dc2626","COMPLIANT WITH WARNINGS":"#d97706","COMPLIANT":"#16a34a"};
  return (
    <div>
      <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files)}} onClick={()=>ref.current?.click()} style={{border:`2px dashed ${drag?SC:T.border}`,borderRadius:16,padding:"40px 24px",textAlign:"center",cursor:"pointer",background:drag?"rgba(16,185,129,0.05)":"rgba(255,255,255,0.01)",transition:"all 0.2s",marginBottom:20}}>
        <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e=>addFiles(e.target.files)} style={{display:"none"}}/>
        <div style={{fontSize:40,marginBottom:12}}>🚿</div>
        <div style={{fontWeight:700,fontSize:16,color:T.text,marginBottom:6}}>Drop plumbing/sanitary plans here</div>
        <div style={{color:T.muted,fontSize:13,marginBottom:16}}>PDF drawings · JPG / PNG images</div>
        <div style={{display:"inline-block",background:`linear-gradient(135deg,${SC},#059669)`,color:"#fff",fontWeight:700,padding:"9px 22px",borderRadius:10,fontSize:14}}>Choose Files</div>
      </div>
      {files.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>{files.map(fo=><div key={fo.id} style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 10px",display:"flex",alignItems:"center",gap:8}}><span>{fo.type.startsWith("image")?"🖼️":"📄"}</span><div style={{fontSize:12,color:T.text,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fo.name}</div><button onClick={()=>setFiles(p=>p.filter(f=>f.id!==fo.id))} style={{background:"rgba(239,68,68,0.12)",border:"none",color:T.danger,width:22,height:22,borderRadius:5,cursor:"pointer",fontSize:12}}>✕</button></div>)}</div>}
      {files.length>0&&<button onClick={run} disabled={busy} style={{width:"100%",background:busy?`rgba(16,185,129,0.2)`:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:busy?"#666":"#fff",fontWeight:700,fontSize:15,padding:"14px",borderRadius:12,cursor:busy?"not-allowed":"pointer",marginBottom:20,transition:"all 0.2s"}}>{busy?"⚙️ Analyzing against NPC 2000 + PD 856…":`🚿 Run Plumbing Compliance Check (${files.length} file${files.length>1?"s":""})`}</button>}
      {error&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"12px 16px",marginBottom:20,color:T.danger,fontSize:14}}>⚠️ {error}</div>}
      {result&&(
        <div style={{animation:"fadeIn 0.35s ease"}}>
          <Card style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:11,color:T.muted,marginBottom:4}}>PROJECT</div>
                <div style={{fontWeight:800,fontSize:18,color:T.text}}>{result.summary.projectName}</div>
                <div style={{fontSize:13,color:T.muted,marginTop:2}}>{result.summary.buildingType}</div>
                <div style={{marginTop:12,display:"flex",gap:24}}>
                  <div><div style={{fontSize:26,fontWeight:800,color:"#dc2626"}}>{result.summary.criticalCount}</div><div style={{fontSize:11,color:T.muted}}>CRITICAL</div></div>
                  <div><div style={{fontSize:26,fontWeight:800,color:"#d97706"}}>{result.summary.warningCount}</div><div style={{fontSize:11,color:T.muted}}>WARNINGS</div></div>
                  <div><div style={{fontSize:26,fontWeight:800,color:SC}}>{result.summary.infoCount}</div><div style={{fontSize:11,color:T.muted}}>INFO</div></div>
                </div>
              </div>
              <div style={{background:`${STATUS_COL[result.summary.overallStatus]}14`,border:`2px solid ${STATUS_COL[result.summary.overallStatus]}44`,borderRadius:12,padding:"10px 18px",textAlign:"center"}}>
                <div style={{fontSize:10,color:T.muted,marginBottom:4}}>OVERALL STATUS</div>
                <div style={{fontSize:13,fontWeight:800,color:STATUS_COL[result.summary.overallStatus]}}>{result.summary.overallStatus}</div>
              </div>
            </div>
            <div style={{marginTop:12,fontSize:13,color:T.muted,lineHeight:1.6,background:T.dim,borderRadius:8,padding:"10px 14px"}}>{result.summary.analysisNotes}</div>
          </Card>
          {findings.length>0&&(
            <div>
              <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["all","CRITICAL","WARNING","INFO"].map(t=>{const cnt=t==="all"?findings.length:findings.filter(f=>f.severity===t).length;const active=tab===t;return <button key={t} onClick={()=>setTab(t)} style={{padding:"7px 16px",borderRadius:8,border:`1.5px solid ${active?SC:T.border}`,background:active?`rgba(16,185,129,0.12)`:"transparent",color:active?SC:T.muted,cursor:"pointer",fontSize:12,fontWeight:700}}>{t==="all"?"All":t} ({cnt})</button>;})}
                </div>
                <button onClick={toggleAll} style={{padding:"7px 14px",borderRadius:8,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>{allChecked?"☑ Deselect All":"☐ Select All"}</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                {filtered.map(f=>{
                  const col={CRITICAL:"#dc2626",WARNING:"#d97706",INFO:SC}[f.severity]||SC;
                  const bg={CRITICAL:"rgba(220,38,38,0.06)",WARNING:"rgba(217,119,6,0.06)",INFO:"rgba(16,185,129,0.06)"}[f.severity]||"rgba(16,185,129,0.06)";
                  const isOpen=open[f.id];const isChecked=!!checked[f.id];
                  return (
                    <div key={f.id} style={{background:isChecked?bg:"rgba(255,255,255,0.01)",border:`1.5px solid ${isChecked?col:T.border}`,borderRadius:12,overflow:"hidden",transition:"all 0.15s"}}>
                      <div style={{padding:"13px 18px",display:"flex",alignItems:"flex-start",gap:12}}>
                        <div onClick={()=>setChecked(p=>({...p,[f.id]:!p[f.id]}))} style={{width:20,height:20,borderRadius:5,border:`2px solid ${isChecked?col:T.muted}`,background:isChecked?col:"transparent",cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>{isChecked&&<span style={{color:"#fff",fontSize:12,fontWeight:800,lineHeight:1}}>✓</span>}</div>
                        <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setOpen(p=>({...p,[f.id]:!p[f.id]}))}>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:4,alignItems:"center"}}>
                            <span style={{background:col,color:"#fff",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:4}}>{f.severity}</span>
                            <span style={{fontSize:11,color:T.muted,fontFamily:"monospace"}}>{f.npcReference}</span>
                            <span style={{fontSize:11,color:T.muted,background:"rgba(255,255,255,0.04)",padding:"1px 8px",borderRadius:4}}>{f.category}</span>
                          </div>
                          <div style={{fontWeight:700,fontSize:14,color:T.text}}>{f.title}</div>
                        </div>
                        <span style={{color:T.muted,fontSize:12,marginTop:2,cursor:"pointer"}} onClick={()=>setOpen(p=>({...p,[f.id]:!p[f.id]}))}>{isOpen?"▲":"▼"}</span>
                      </div>
                      {isOpen&&<div style={{padding:"0 18px 16px 50px",borderTop:`1px solid ${col}33`}}><div style={{paddingTop:12,display:"flex",flexDirection:"column",gap:10}}><div><Label>Finding</Label><div style={{fontSize:13,color:T.muted,lineHeight:1.6}}>{f.description}</div></div><div><Label>Recommendation</Label><div style={{fontSize:13,color:T.success,lineHeight:1.6}}>✓ {f.recommendation}</div></div>{f.codeBasis&&<div style={{background:"rgba(0,0,0,0.2)",borderLeft:`3px solid ${col}`,padding:"10px 14px",borderRadius:"0 8px 8px 0",fontSize:12,color:T.muted,fontStyle:"italic",lineHeight:1.5}}>{f.codeBasis}</div>}</div></div>}
                    </div>
                  );
                })}
              </div>
              {checkedCount>0&&(
                <div style={{background:"rgba(16,185,129,0.08)",border:`1.5px solid rgba(16,185,129,0.25)`,borderRadius:12,padding:"16px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                  <div><div style={{fontWeight:700,fontSize:14,color:SC}}>{checkedCount} item{checkedCount>1?"s":""} selected</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>AI generates drafting instructions per NPC 2000</div></div>
                  <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><Label>Rev No.</Label><input type="number" value={revNum} min={1} max={99} onChange={e=>setRevNum(+e.target.value)} style={{width:60,background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:8,padding:"6px 10px",color:T.text,fontSize:14,fontWeight:700,outline:"none",textAlign:"center"}}/></div>
                    <button onClick={generateCorrections} disabled={correcting} style={{background:correcting?`rgba(16,185,129,0.3)`:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:correcting?"#666":"#fff",fontWeight:700,padding:"10px 20px",borderRadius:10,cursor:correcting?"not-allowed":"pointer",fontSize:13}}>{correcting?"⚙️ Generating…":"🤖 Generate Corrections"}</button>
                  </div>
                </div>
              )}
              {corrections&&(
                <div style={{background:"rgba(16,185,129,0.05)",border:`1.5px solid rgba(16,185,129,0.25)`,borderRadius:12,padding:20,marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
                    <div><div style={{fontWeight:800,fontSize:15,color:T.success}}>✅ Corrections Ready — Rev {revNum}</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>{corrections.length} instruction{corrections.length>1?"s":""} ready</div></div>
                    <button onClick={()=>{const w=window.open("","_blank");const date=new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});const rows=corrections.map((c,i)=>`<tr><td style="padding:8px;border:1px solid #e5e7eb;text-align:center;font-weight:700">REV-${String(i+1).padStart(2,"0")}</td><td style="padding:8px;border:1px solid #e5e7eb;color:${{CRITICAL:"#dc2626",WARNING:"#d97706",INFO:"#059669"}[c.severity]};font-weight:700">${c.severity}</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">${c.title}</td><td style="padding:8px;border:1px solid #e5e7eb;font-size:12px">${c.description}</td><td style="padding:8px;border:1px solid #e5e7eb;background:#fefce8">${c.correctedValues||c.recommendation}</td><td style="padding:8px;border:1px solid #e5e7eb;background:#f0fdf4;color:#15803d">${c.draftingInstruction||""}</td><td style="padding:8px;border:1px solid #e5e7eb;font-size:11px">${c.npcReference}</td></tr>`).join("");w.document.write(`<!DOCTYPE html><html><head><title>Plumbing Revision Rev ${revNum}</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#111;font-size:13px}table{border-collapse:collapse;width:100%}th{background:#065f46;color:#fff;padding:9px 8px;text-align:left;font-size:11px}h1{color:#065f46}@media print{button{display:none}}</style></head><body><h1>🚿 Plumbing Revision Report — Rev ${revNum}</h1><p style="color:#6b7280">NPC 2000 · PD 856 · ${date} · Jon Ureta</p><table><tr><th>Rev No.</th><th>Severity</th><th>Issue</th><th>Finding</th><th>Corrected Value</th><th>Drafting Instruction</th><th>NPC Ref.</th></tr>${rows}</table><p style="margin-top:24px;font-size:11px;color:#9ca3af">AI-generated. Verify with licensed Sanitary Engineer before implementation.</p></body></html>`);w.document.close();setTimeout(()=>w.print(),400);}} style={{background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,padding:"10px 20px",borderRadius:10,cursor:"pointer",fontSize:13}}>📄 Download Revision PDF</button>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {corrections.map((c,i)=>(
                      <div key={c.id||i} style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
                        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                          <span style={{background:"#064e3b",color:SC,fontSize:11,fontWeight:800,padding:"2px 10px",borderRadius:4}}>REV-{String(i+1).padStart(2,"0")}</span>
                          <span style={{fontSize:12,fontWeight:700,color:T.text}}>{c.title}</span>
                          <span style={{fontSize:11,color:T.muted,fontFamily:"monospace"}}>{c.npcReference}</span>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                          <div style={{background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,color:T.accent,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>📐 Corrected Value</div><div style={{fontSize:13,color:T.text,lineHeight:1.6}}>{c.correctedValues||c.recommendation}</div></div>
                          <div style={{background:"rgba(16,185,129,0.07)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,color:T.success,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>✏️ Drafting Instruction</div><div style={{fontSize:13,color:T.text,lineHeight:1.6}}>{c.draftingInstruction||"Apply correction as indicated"}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div style={{marginTop:20,padding:"10px 16px",background:T.dim,borderRadius:10,fontSize:12,color:T.muted,lineHeight:1.5}}>⚠️ AI-generated. Plans must be signed by a licensed Sanitary Engineer before LGU/DOH submission.</div>
        </div>
      )}
      {!files.length&&!result&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginTop:4}}>
          {[{i:"🏠",t:"Residential",d:"Water supply, drainage, septic"},{i:"🏢",t:"Commercial",d:"Fixture units, grease traps"},{i:"🏥",t:"Institutional",d:"Hospital, school plumbing"},{i:"🌊",t:"Storm Drainage",d:"NPC Sec. 11 compliance"}].map(x=>(
            <Card key={x.t} style={{textAlign:"center",padding:18}}><div style={{fontSize:28,marginBottom:8}}>{x.i}</div><div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:4}}>{x.t}</div><div style={{fontSize:11,color:T.muted,lineHeight:1.5}}>{x.d}</div></Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SANICODE: FIXTURE UNIT CALCULATOR ───────────────────────────────────────
function FixtureUnitCalc() {
  const [rows,setRows]=useState([{id:1,fixture:FIXTURES[0].name,qty:1}]);
  const [bldgType,setBldgType]=useState("private");
  const [result,setResult]=useState(null);
  const addRow=()=>setRows(p=>[...p,{id:Date.now(),fixture:FIXTURES[0].name,qty:1}]);
  const removeRow=id=>setRows(p=>p.filter(r=>r.id!==id));
  const updateRow=(id,k,v)=>setRows(p=>p.map(r=>r.id===id?{...r,[k]:v}:r));
  const calc=()=>{
    let totalDFU=0,totalWSFU=0;
    const detail=rows.map(r=>{const fx=FIXTURES.find(f=>f.name===r.fixture)||FIXTURES[0];const dfu=fx.dfu*r.qty;const wsfu=(bldgType==="private"?fx.wsfu_priv:fx.wsfu_pub)*r.qty;totalDFU+=dfu;totalWSFU+=wsfu;return {...r,dfu,wsfu,fx};});
    const drainPipe=DFU_TO_PIPE.find(p=>totalDFU<=p.maxDfu)||DFU_TO_PIPE[DFU_TO_PIPE.length-1];
    const gpm=WSFU_TO_GPM(totalWSFU);
    const supplyDia=gpm<=4?19:gpm<=8?25:gpm<=15?32:gpm<=30?38:gpm<=50?50:75;
    setResult({detail,totalDFU,totalWSFU,drainPipe,gpm,supplyDia});
  };
  return (
    <div>
      <Card style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
          <Label>Building Type</Label>
          <div style={{display:"flex",gap:8}}>
            {["private","public"].map(t=><button key={t} onClick={()=>setBldgType(t)} style={{padding:"6px 14px",borderRadius:8,border:`1.5px solid ${bldgType===t?SC:T.border}`,background:bldgType===t?`rgba(16,185,129,0.12)`:"transparent",color:bldgType===t?SC:T.muted,cursor:"pointer",fontSize:12,fontWeight:700}}>{t==="private"?"🏠 Private":"🏢 Public"}</button>)}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8}}><div style={{fontSize:11,fontWeight:700,color:T.muted}}>FIXTURE</div><div style={{fontSize:11,fontWeight:700,color:T.muted,textAlign:"center",width:70}}>QTY</div><div style={{width:36}}/></div>
          {rows.map(r=>(
            <div key={r.id} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8,alignItems:"center"}}>
              <Select value={r.fixture} onChange={e=>updateRow(r.id,"fixture",e.target.value)}>{FIXTURES.map(f=><option key={f.name} value={f.name}>{f.name}</option>)}</Select>
              <input type="number" value={r.qty} min={1} onChange={e=>updateRow(r.id,"qty",+e.target.value)} style={{width:70,background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:10,padding:"10px 8px",color:T.text,fontSize:14,outline:"none",textAlign:"center"}}/>
              <button onClick={()=>removeRow(r.id)} style={{width:36,height:36,borderRadius:8,background:"rgba(239,68,68,0.12)",border:"none",color:T.danger,cursor:"pointer",fontSize:14}}>✕</button>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={addRow} style={{flex:1,background:T.dim,border:`1.5px dashed ${T.border}`,color:T.muted,fontWeight:700,padding:"10px",borderRadius:10,cursor:"pointer",fontSize:13}}>+ Add Fixture</button>
          <button onClick={calc} style={{flex:2,background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,padding:"10px 20px",borderRadius:10,cursor:"pointer",fontSize:13}}>🚰 Calculate Fixture Units</button>
        </div>
      </Card>
      {result&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Card style={{background:"rgba(16,185,129,0.06)",border:`1.5px solid rgba(16,185,129,0.3)`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>TOTAL DRAINAGE FIXTURE UNITS</div>
            <div style={{fontSize:40,fontWeight:900,color:SC}}>{result.totalDFU} <span style={{fontSize:16,fontWeight:400}}>DFU</span></div>
            <div style={{marginTop:8,fontSize:13,color:T.muted}}>Min drain pipe: <strong style={{color:T.text}}>{result.drainPipe.dia}mm</strong></div>
          </Card>
          <Card style={{background:"rgba(16,185,129,0.06)",border:`1.5px solid rgba(16,185,129,0.3)`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>WATER SUPPLY FIXTURE UNITS</div>
            <div style={{fontSize:40,fontWeight:900,color:SC}}>{result.totalWSFU.toFixed(1)} <span style={{fontSize:16,fontWeight:400}}>WSFU</span></div>
            <div style={{marginTop:8,fontSize:13,color:T.muted}}>{result.gpm.toFixed(1)} GPM → <strong style={{color:T.text}}>{result.supplyDia}mm supply</strong></div>
          </Card>
          <Card style={{gridColumn:"1/-1"}}>
            <Label>Fixture Breakdown (NPC 2000 Table 4-1)</Label>
            <table style={{width:"100%",borderCollapse:"collapse",marginTop:8}}>
              <thead><tr style={{background:T.dim}}>{["Fixture","Qty","DFU ea","Total DFU","WSFU ea","Total WSFU"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:11,color:T.muted,fontWeight:700}}>{h}</th>)}</tr></thead>
              <tbody>{result.detail.map((r,i)=><tr key={r.id} style={{borderTop:`1px solid ${T.border}`,background:i%2===0?"transparent":T.dim}}><td style={{padding:"8px 10px",fontSize:13,color:T.text}}>{r.fixture}</td><td style={{padding:"8px 10px",fontSize:13,color:T.text,textAlign:"center"}}>{r.qty}</td><td style={{padding:"8px 10px",fontSize:13,color:T.muted,textAlign:"center"}}>{r.fx.dfu}</td><td style={{padding:"8px 10px",fontSize:13,fontWeight:700,color:SC,textAlign:"center"}}>{r.dfu}</td><td style={{padding:"8px 10px",fontSize:13,color:T.muted,textAlign:"center"}}>{bldgType==="private"?r.fx.wsfu_priv:r.fx.wsfu_pub}</td><td style={{padding:"8px 10px",fontSize:13,fontWeight:700,color:SC,textAlign:"center"}}>{r.wsfu.toFixed(1)}</td></tr>)}</tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── SANICODE: PIPE SIZING ────────────────────────────────────────────────────
function PipeSizing() {
  const [pipeType,setPipeType]=useState("drain");
  const [dfu,setDfu]=useState(20);
  const [wsfu,setWsfu]=useState(15);
  const [slope,setSlope]=useState(0.02);
  const [result,setResult]=useState(null);
  const calc=()=>{
    if(pipeType==="drain"){
      const rec=DFU_TO_PIPE.find(p=>dfu<=p.maxDfu)||DFU_TO_PIPE[DFU_TO_PIPE.length-1];
      const d=rec.dia/1000,n=0.013,r=d/4;
      const vel=(1/n)*Math.pow(r,2/3)*Math.pow(slope,0.5);
      const status=vel>=0.6&&vel<=3.0?"PASS — Self-cleansing":"CHECK SLOPE";
      setResult({type:"drain",rec,vel,status,dfu});
    }else{
      const gpm=WSFU_TO_GPM(wsfu);
      const lps=gpm*0.06309;
      const dia=gpm<=4?19:gpm<=8?25:gpm<=15?32:gpm<=30?38:gpm<=50?50:75;
      setResult({type:"supply",gpm,lps,dia,wsfu});
    }
  };
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Pipe System Type</Label>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[{k:"drain",l:"🚽 Drainage / DWV"},{k:"supply",l:"💧 Water Supply"}].map(t=><button key={t.k} onClick={()=>setPipeType(t.k)} style={{flex:1,padding:"8px",borderRadius:8,border:`1.5px solid ${pipeType===t.k?SC:T.border}`,background:pipeType===t.k?`rgba(16,185,129,0.12)`:"transparent",color:pipeType===t.k?SC:T.muted,cursor:"pointer",fontSize:12,fontWeight:700}}>{t.l}</button>)}
        </div>
        {pipeType==="drain"?(
          <><Label>Total DFU</Label><Input type="number" value={dfu} onChange={e=>setDfu(+e.target.value)} style={{marginBottom:16}}/><Label>Drain Slope</Label><Select value={slope} onChange={e=>setSlope(+e.target.value)} style={{marginBottom:16}}><option value={0.01}>1% (1:100)</option><option value={0.02}>2% (1:50) recommended</option><option value={0.04}>4% (1:25)</option><option value={0.0625}>6.25% (1:16)</option></Select></>
        ):(
          <><Label>Total WSFU</Label><Input type="number" value={wsfu} onChange={e=>setWsfu(+e.target.value)} style={{marginBottom:16}}/></>
        )}
        <button onClick={calc} style={{width:"100%",background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>📏 Size the Pipe</button>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:"rgba(16,185,129,0.06)",border:`1.5px solid rgba(16,185,129,0.3)`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>RECOMMENDED PIPE DIAMETER</div>
            <div style={{fontSize:48,fontWeight:900,color:SC}}>{result.type==="drain"?result.rec.dia:result.dia} <span style={{fontSize:18,fontWeight:400}}>mm</span></div>
            {result.type==="drain"&&<div style={{fontSize:13,color:T.muted,marginTop:4}}>Velocity: {result.vel.toFixed(2)} m/s — {result.status}</div>}
            {result.type==="supply"&&<div style={{fontSize:13,color:T.muted,marginTop:4}}>{result.gpm.toFixed(1)} GPM · {result.lps.toFixed(2)} L/s</div>}
          </Card>
          {result.type==="drain"&&[{l:"DFU load",v:`${result.dfu}`},{l:"Min pipe dia",v:`${result.rec.dia}mm`,h:true},{l:"Flow velocity",v:`${result.vel.toFixed(2)} m/s`},{l:"Status",v:result.status,h:true}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.h?`rgba(16,185,129,0.08)`:T.dim,borderRadius:8,border:r.h?`1px solid rgba(16,185,129,0.2)`:"none"}}><span style={{fontSize:13,color:T.muted}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.h?SC:T.text,fontFamily:"monospace"}}>{r.v}</span></div>)}
          {result.type==="supply"&&[{l:"WSFU",v:`${result.wsfu}`},{l:"Flow",v:`${result.gpm.toFixed(1)} GPM`,h:true},{l:"Flow L/s",v:`${result.lps.toFixed(2)} L/s`},{l:"Supply pipe",v:`${result.dia}mm`,h:true}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.h?`rgba(16,185,129,0.08)`:T.dim,borderRadius:8,border:r.h?`1px solid rgba(16,185,129,0.2)`:"none"}}><span style={{fontSize:13,color:T.muted}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.h?SC:T.text,fontFamily:"monospace"}}>{r.v}</span></div>)}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>NPC 2000 Sec. 4 · Manning n=0.013 · Hunter method for supply</div>
        </div>
      ):(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}><div style={{fontSize:48}}>📏</div><div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter parameters and click<br/>Size the Pipe</div></Card>
      )}
    </div>
  );
}

// ─── SANICODE: SEPTIC TANK ────────────────────────────────────────────────────
function SepticTankSizing() {
  const [persons,setPersons]=useState(10);
  const [bldgUse,setBldgUse]=useState("residential");
  const [retDays,setRetDays]=useState(1);
  const [result,setResult]=useState(null);
  const GPCD={residential:80,commercial:25,school:15,office:20};
  const calc=()=>{
    const gpcd=GPCD[bldgUse];
    const flow_lpd=persons*gpcd*3.785;
    const liq_vol=flow_lpd*retDays;
    const total_vol=liq_vol*1.3;
    const width=Math.max(1.2,Math.pow(total_vol/1000/(1.5*2),0.5));
    const length=2*width;
    const liquid_depth=liq_vol/1000/(width*length);
    const total_depth=liquid_depth+0.3;
    setResult({flow_lpd,liq_vol,total_vol,width,length,liquid_depth,total_depth,freeboard:0.3,gpcd,persons});
  };
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Building Use</Label>
        <Select value={bldgUse} onChange={e=>setBldgUse(e.target.value)} style={{marginBottom:16}}>
          <option value="residential">Residential (80 GPCD)</option>
          <option value="commercial">Commercial (25 GPCD)</option>
          <option value="school">School (15 GPCD)</option>
          <option value="office">Office (20 GPCD)</option>
        </Select>
        <Label>Number of Persons</Label>
        <Input type="number" value={persons} onChange={e=>setPersons(+e.target.value)} style={{marginBottom:16}}/>
        <Label>Retention Period (days)</Label>
        <Select value={retDays} onChange={e=>setRetDays(+e.target.value)} style={{marginBottom:20}}>
          <option value={1}>1 day — Residential</option>
          <option value={2}>2 days — Commercial</option>
          <option value={3}>3 days — Industrial</option>
        </Select>
        <button onClick={calc} style={{width:"100%",background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>🪣 Size Septic Tank</button>
        <div style={{marginTop:12,padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted}}>Per PD 856 Sanitation Code · NPC 2000 Sec. 13</div>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:"rgba(16,185,129,0.06)",border:`1.5px solid rgba(16,185,129,0.3)`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>SEPTIC TANK SIZE</div>
            <div style={{fontSize:26,fontWeight:900,color:SC}}>{result.length.toFixed(2)}m × {result.width.toFixed(2)}m × {result.total_depth.toFixed(2)}m</div>
            <div style={{fontSize:13,color:T.muted,marginTop:4}}>L × W × D</div>
          </Card>
          {[{l:"Wastewater flow",v:`${result.flow_lpd.toFixed(0)} L/day`},{l:"Liquid capacity",v:`${result.liq_vol.toFixed(0)} L`,h:true},{l:"Total volume",v:`${result.total_vol.toFixed(0)} L`,h:true},{l:"Tank length",v:`${result.length.toFixed(2)} m`},{l:"Tank width",v:`${result.width.toFixed(2)} m`},{l:"Liquid depth",v:`${result.liquid_depth.toFixed(2)} m`},{l:"Freeboard",v:"0.30 m"},{l:"Total depth",v:`${result.total_depth.toFixed(2)} m`,h:true}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.h?`rgba(16,185,129,0.08)`:T.dim,borderRadius:8,border:r.h?`1px solid rgba(16,185,129,0.2)`:"none"}}><span style={{fontSize:13,color:T.muted}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.h?SC:T.text,fontFamily:"monospace"}}>{r.v}</span></div>)}
        </div>
      ):(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}><div style={{fontSize:48}}>🪣</div><div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter parameters and click<br/>Size Septic Tank</div></Card>
      )}
    </div>
  );
}

// ─── SANICODE: WATER DEMAND ───────────────────────────────────────────────────
function WaterDemandCalc() {
  const [bldgType,setBldgType]=useState("residential");
  const [units,setUnits]=useState(10);
  const [persons,setPersons]=useState(4);
  const [floors,setFloors]=useState(3);
  const [result,setResult]=useState(null);
  const DEMANDS={residential:{label:"Residential (per person)",gpd:80,unit:"persons"},apartment:{label:"Apartment (per unit)",gpd:250,unit:"units"},office:{label:"Office (per person)",gpd:20,unit:"persons"},school:{label:"School (per student)",gpd:15,unit:"persons"},hospital:{label:"Hospital (per bed)",gpd:300,unit:"units"},hotel:{label:"Hotel (per room)",gpd:200,unit:"units"},restaurant:{label:"Restaurant (per seat)",gpd:50,unit:"units"},mall:{label:"Mall (per 100sqm)",gpd:400,unit:"units"}};
  const calc=()=>{
    const dem=DEMANDS[bldgType];
    const count=dem.unit==="persons"?persons*units:units;
    const avg_lpd=count*dem.gpd*3.785;
    const avg_lps=avg_lpd/86400;
    const peak_lps=avg_lps*3.5;
    const storage_L=avg_lpd*0.5;
    const roof_L=avg_lpd*0.25;
    setResult({avg_lpd,avg_lps,peak_lps,storage_L,tank_m3:storage_L/1000,roof_L,count,dem});
  };
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Building Type</Label>
        <Select value={bldgType} onChange={e=>setBldgType(e.target.value)} style={{marginBottom:16}}>{Object.entries(DEMANDS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</Select>
        {DEMANDS[bldgType].unit==="persons"&&<><Label>Units / Floors</Label><Input type="number" value={units} onChange={e=>setUnits(+e.target.value)} style={{marginBottom:16}}/><Label>Persons per Unit</Label><Input type="number" value={persons} onChange={e=>setPersons(+e.target.value)} style={{marginBottom:16}}/></>}
        {DEMANDS[bldgType].unit==="units"&&<><Label>Units / Beds / Seats / Rooms</Label><Input type="number" value={units} onChange={e=>setUnits(+e.target.value)} style={{marginBottom:16}}/></>}
        <Label>Number of Floors</Label>
        <Input type="number" value={floors} onChange={e=>setFloors(+e.target.value)} style={{marginBottom:20}}/>
        <button onClick={calc} style={{width:"100%",background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>💧 Calculate Water Demand</button>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:"rgba(16,185,129,0.06)",border:`1.5px solid rgba(16,185,129,0.3)`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>AVERAGE DAILY DEMAND</div>
            <div style={{fontSize:36,fontWeight:900,color:SC}}>{result.avg_lpd.toFixed(0)} <span style={{fontSize:16,fontWeight:400}}>L/day</span></div>
          </Card>
          {[{l:"Total occupants",v:`${result.count}`},{l:"Average daily demand",v:`${result.avg_lpd.toFixed(0)} L/day`,h:true},{l:"Average flow",v:`${result.avg_lps.toFixed(3)} L/s`},{l:"Peak demand",v:`${result.peak_lps.toFixed(3)} L/s`,h:true},{l:"Ground storage (12hr)",v:`${result.storage_L.toFixed(0)} L`,h:true},{l:"Roof tank (6hr)",v:`${result.roof_L.toFixed(0)} L`},{l:"Pressure zones",v:`${Math.ceil(floors/5)}`}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.h?`rgba(16,185,129,0.08)`:T.dim,borderRadius:8,border:r.h?`1px solid rgba(16,185,129,0.2)`:"none"}}><span style={{fontSize:13,color:T.muted}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.h?SC:T.text,fontFamily:"monospace"}}>{r.v}</span></div>)}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>NPC 2000 Sec. 6 · LWUA standards · 1 pressure zone per 5 floors</div>
        </div>
      ):(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}><div style={{fontSize:48}}>💧</div><div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter building data<br/>and click Calculate</div></Card>
      )}
    </div>
  );
}

// ─── SANICODE: PRESSURE LOSS ──────────────────────────────────────────────────
function PressureLoss() {
  const [flow,setFlow]=useState(1.5);
  const [dia,setDia]=useState(50);
  const [len,setLen]=useState(20);
  const [fitK,setFitK]=useState(5);
  const [elev,setElev]=useState(5);
  const [result,setResult]=useState(null);
  const calc=()=>{
    const d=dia/1000,A=Math.PI*d*d/4,V=flow/1000/A;
    const Re=V*d/1e-6;
    const f=Re<2300?64/Re:0.3164/Math.pow(Re,0.25);
    const hf=f*(len/d)*(V*V/(2*9.81));
    const hm=fitK*(V*V/(2*9.81));
    const htotal=hf+hm+elev;
    const status=V>=0.6&&V<=3.0?"GOOD VELOCITY":"CHECK VELOCITY";
    setResult({V,Re,f,hf,hm,he:elev,htotal,status});
  };
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Flow Rate (L/s)</Label><Input type="number" value={flow} onChange={e=>setFlow(+e.target.value)} step="0.1" style={{marginBottom:16}}/>
        <Label>Pipe Diameter (mm)</Label>
        <Select value={dia} onChange={e=>setDia(+e.target.value)} style={{marginBottom:16}}>{[13,19,25,32,38,50,63,75,100,150,200].map(d=><option key={d} value={d}>{d}mm</option>)}</Select>
        <Label>Pipe Length (m)</Label><Input type="number" value={len} onChange={e=>setLen(+e.target.value)} style={{marginBottom:16}}/>
        <Label>Sum of Minor Loss Coefficients K</Label><Input type="number" value={fitK} onChange={e=>setFitK(+e.target.value)} step="0.5" style={{marginBottom:8}}/>
        <div style={{fontSize:11,color:T.muted,marginBottom:16}}>Elbow=1.5 · Tee=2.0 · Gate valve=0.2 · Check valve=3.0</div>
        <Label>Elevation Change (m, + upward)</Label><Input type="number" value={elev} onChange={e=>setElev(+e.target.value)} step="0.5" style={{marginBottom:20}}/>
        <button onClick={calc} style={{width:"100%",background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>⬆️ Calculate Pressure Loss</button>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:result.status==="GOOD VELOCITY"?"rgba(16,185,129,0.06)":"rgba(245,158,11,0.06)",border:`1.5px solid ${result.status==="GOOD VELOCITY"?"rgba(16,185,129,0.3)":"rgba(245,158,11,0.3)"}`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>TOTAL HEAD LOSS</div>
            <div style={{fontSize:42,fontWeight:900,color:result.status==="GOOD VELOCITY"?SC:T.warn}}>{result.htotal.toFixed(2)} <span style={{fontSize:18,fontWeight:400}}>m</span></div>
            <div style={{fontSize:13,color:T.muted,marginTop:4}}>{result.V.toFixed(2)} m/s — {result.status}</div>
          </Card>
          {[{l:"Flow velocity",v:`${result.V.toFixed(3)} m/s`,h:true},{l:"Reynolds number",v:result.Re.toFixed(0)},{l:"Friction factor",v:result.f.toFixed(5)},{l:"Friction loss hf",v:`${result.hf.toFixed(3)} m`},{l:"Minor losses hm",v:`${result.hm.toFixed(3)} m`},{l:"Elevation he",v:`${result.he.toFixed(2)} m`},{l:"Total head loss",v:`${result.htotal.toFixed(3)} m`,h:true}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.h?`rgba(16,185,129,0.08)`:T.dim,borderRadius:8,border:r.h?`1px solid rgba(16,185,129,0.2)`:"none"}}><span style={{fontSize:13,color:T.muted}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.h?SC:T.text,fontFamily:"monospace"}}>{r.v}</span></div>)}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>Darcy-Weisbach · Blasius friction factor · NPC 2000 Sec. 6</div>
        </div>
      ):(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}><div style={{fontSize:48}}>⬆️</div><div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter pipe parameters<br/>and click Calculate</div></Card>
      )}
    </div>
  );
}

// ─── SANICODE: STORM DRAINAGE ─────────────────────────────────────────────────
function StormDrainage() {
  const [area,setArea]=useState(500);
  const [runoff,setRunoff]=useState(0.85);
  const [intensity,setIntensity]=useState(100);
  const [slope,setSlope]=useState(0.005);
  const [result,setResult]=useState(null);
  const RUNOFF={"Roof / Concrete (0.90)":0.90,"Asphalt pavement (0.85)":0.85,"Gravel / compacted (0.60)":0.60,"Lawns / grass (0.35)":0.35,"Mixed residential (0.55)":0.55};
  const calc=()=>{
    const Q=runoff*intensity*area/3600000;
    const Q_lps=Q*1000;
    let dia_m=0.1;
    for(let i=0;i<50;i++){const r=dia_m/4,A=Math.PI*dia_m*dia_m/4,Qfull=(1/0.013)*A*Math.pow(r,2/3)*Math.pow(slope,0.5);if(Qfull>=Q)break;dia_m+=0.025;}
    const dia_mm=Math.ceil(dia_m*1000/25)*25;
    const r=dia_mm/4000,A=Math.PI*(dia_mm/1000)*(dia_mm/1000)/4;
    const V=(1/0.013)*Math.pow(r,2/3)*Math.pow(slope,0.5);
    const Qcap=A*V*1000;
    setResult({Q_lps,dia_mm,V,Qcap});
  };
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Drainage Area (m²)</Label><Input type="number" value={area} onChange={e=>setArea(+e.target.value)} style={{marginBottom:16}}/>
        <Label>Surface / Runoff Coefficient C</Label>
        <Select value={runoff} onChange={e=>setRunoff(+e.target.value)} style={{marginBottom:16}}>{Object.entries(RUNOFF).map(([k,v])=><option key={k} value={v}>{k}</option>)}</Select>
        <Label>Rainfall Intensity (mm/hr)</Label><Input type="number" value={intensity} onChange={e=>setIntensity(+e.target.value)} style={{marginBottom:8}}/>
        <div style={{fontSize:11,color:T.muted,marginBottom:16}}>Metro Manila ≈ 100mm/hr · Visayas/Mindanao ≈ 80-120mm/hr</div>
        <Label>Storm Drain Slope (m/m)</Label>
        <Select value={slope} onChange={e=>setSlope(+e.target.value)} style={{marginBottom:20}}>
          <option value={0.003}>0.3% minimum</option><option value={0.005}>0.5% recommended</option><option value={0.01}>1.0%</option><option value={0.02}>2.0%</option>
        </Select>
        <button onClick={calc} style={{width:"100%",background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>🌊 Size Storm Drain</button>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:"rgba(16,185,129,0.06)",border:`1.5px solid rgba(16,185,129,0.3)`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>STORM DRAIN SIZE</div>
            <div style={{fontSize:48,fontWeight:900,color:SC}}>{result.dia_mm} <span style={{fontSize:18,fontWeight:400}}>mm dia.</span></div>
            <div style={{fontSize:13,color:T.muted,marginTop:4}}>Capacity: {result.Qcap.toFixed(1)} L/s @ {result.V.toFixed(2)} m/s</div>
          </Card>
          {[{l:"Design flow Q",v:`${result.Q_lps.toFixed(2)} L/s`,h:true},{l:"Required pipe dia.",v:`${result.dia_mm}mm`,h:true},{l:"Pipe capacity",v:`${result.Qcap.toFixed(1)} L/s`},{l:"Flow velocity",v:`${result.V.toFixed(2)} m/s`}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.h?`rgba(16,185,129,0.08)`:T.dim,borderRadius:8,border:r.h?`1px solid rgba(16,185,129,0.2)`:"none"}}><span style={{fontSize:13,color:T.muted}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.h?SC:T.text,fontFamily:"monospace"}}>{r.v}</span></div>)}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>Rational Method Q=CiA · Manning n=0.013 · NPC 2000 Sec. 11</div>
        </div>
      ):(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}><div style={{fontSize:48}}>🌊</div><div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter catchment data<br/>and click Size Storm Drain</div></Card>
      )}
    </div>
  );
}

// ─── SANICODE: MAIN WRAPPER ───────────────────────────────────────────────────
function SaniCode({ apiKey }) {
  const [tool,setTool]=useState("checker");
  const TOOLS=[
    {key:"checker",  icon:"🤖", label:"AI Plan Checker"},
    {key:"fixture",  icon:"🚰", label:"Fixture Units"},
    {key:"pipe",     icon:"📏", label:"Pipe Sizing"},
    {key:"septic",   icon:"🪣", label:"Septic Tank"},
    {key:"water",    icon:"💧", label:"Water Demand"},
    {key:"pressure", icon:"⬆️", label:"Pressure Loss"},
    {key:"storm",    icon:"🌊", label:"Storm Drainage"},
  ];
  return (
    <div>
      <div style={{display:"flex",gap:6,marginBottom:24,flexWrap:"wrap",paddingBottom:16,borderBottom:`1px solid ${T.border}`}}>
        {TOOLS.map(t=><button key={t.key} onClick={()=>setTool(t.key)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,border:`1.5px solid ${tool===t.key?SC:T.border}`,background:tool===t.key?`rgba(16,185,129,0.12)`:"transparent",color:tool===t.key?SC:T.muted,cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.15s"}}><span>{t.icon}</span><span>{t.label}</span></button>)}
      </div>
      {tool==="checker"  && <PlumbingChecker apiKey={apiKey}/>}
      {tool==="fixture"  && <FixtureUnitCalc/>}
      {tool==="pipe"     && <PipeSizing/>}
      {tool==="septic"   && <SepticTankSizing/>}
      {tool==="water"    && <WaterDemandCalc/>}
      {tool==="pressure" && <PressureLoss/>}
      {tool==="storm"    && <StormDrainage/>}
    </div>
  );
}

// ─── ROOT APP ────────────────────────────────────────────────────────────────
const TABS = [
  { key:"electrical", icon:"⚡", label:"ElectriCode", color:"#f59e0b" },
  { key:"structural", icon:"🏗️", label:"StructiCode", color:"#3b82f6" },
  { key:"sanitary",   icon:"🚿", label:"SaniCode",    color:"#10b981" },
];

export default function App() {
  const [module, setModule]   = useState("electrical");
  const [etab, setEtab]       = useState("checker");
  const [apiKey, setApiKey]   = useState("");
  const [showKey, setShowKey] = useState(false);
  const [splash, setSplash]   = useState(true);

  const ETABS = [
    {key:"checker", icon:"🔍", label:"Plan Checker"},
    {key:"vdrop",   icon:"📉", label:"Voltage Drop"},
    {key:"fault",   icon:"⚡", label:"Short Circuit"},
    {key:"load",    icon:"📊", label:"Load Calc"},
  ];

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'Sora','DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes splashIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
        input::-webkit-inner-spin-button{-webkit-appearance:none}
      `}</style>

      {/* ── SPLASH / WELCOME SCREEN ── */}
      {splash && (
        <div style={{
          position:"fixed", inset:0, zIndex:999,
          background:"rgba(8,12,24,0.97)",
          backdropFilter:"blur(12px)",
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:24, animation:"fadeIn 0.4s ease"
        }}>
          <div style={{
            background:T.card, border:`1px solid rgba(245,158,11,0.25)`,
            borderRadius:24, padding:"44px 48px", maxWidth:520, width:"100%",
            textAlign:"center", animation:"splashIn 0.45s ease",
            boxShadow:"0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.1)"
          }}>
            {/* Logo */}
            <div style={{
              width:72, height:72, borderRadius:20, margin:"0 auto 20px",
              background:`linear-gradient(135deg,${T.accent},#f97316)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:36, boxShadow:`0 8px 32px rgba(245,158,11,0.4)`
            }}>⚡</div>

            {/* App name */}
            <div style={{ fontSize:11, color:T.muted, letterSpacing:"2px", textTransform:"uppercase", marginBottom:8 }}>Welcome to</div>
            <h1 style={{ fontSize:28, fontWeight:800, color:T.text, letterSpacing:"-0.8px", marginBottom:6, lineHeight:1.1 }}>
              PH Engineering Suite
            </h1>
            <div style={{ fontSize:13, color:T.muted, marginBottom:28, lineHeight:1.6 }}>
              PEC 2017 · NSCP 2015 · NBC Philippines · NPC
            </div>

            {/* Divider */}
            <div style={{ height:1, background:`linear-gradient(90deg,transparent,rgba(245,158,11,0.3),transparent)`, marginBottom:28 }}/>

            {/* Developer credit */}
            <div style={{
              background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.18)",
              borderRadius:14, padding:"18px 24px", marginBottom:28
            }}>
              <div style={{ fontSize:11, color:T.muted, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:10 }}>Developed by</div>
              <div style={{ fontSize:26, fontWeight:800, color:T.accent, letterSpacing:"-0.5px", marginBottom:4 }}>Jon Ureta</div>
              <div style={{ fontSize:12, color:T.muted, lineHeight:1.6 }}>
                Electrical Engineer · Philippines<br/>
                <span style={{ fontSize:11, color:"rgba(100,116,139,0.7)" }}>Built with AI to help Filipino engineers work faster</span>
              </div>
            </div>

            {/* Feature list */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:28, textAlign:"left" }}>
              {[
                { icon:"⚡", label:"ElectriCode — PEC 2017" },
                { icon:"🏗️", label:"StructiCode — NSCP 2015" },
                { icon:"🏢", label:"ArchiCode — NBC PH" },
                { icon:"🚿", label:"SaniCode — NPC" },
              ].map(f => (
                <div key={f.label} style={{ display:"flex", alignItems:"center", gap:8, background:T.dim, borderRadius:8, padding:"8px 12px" }}>
                  <span style={{ fontSize:16 }}>{f.icon}</span>
                  <span style={{ fontSize:12, color:T.text, fontWeight:600 }}>{f.label}</span>
                </div>
              ))}
            </div>

            {/* Enter button */}
            <button
              onClick={() => setSplash(false)}
              style={{
                width:"100%", background:`linear-gradient(135deg,${T.accent},#f97316)`,
                border:"none", color:"#000", fontWeight:800, fontSize:16,
                padding:"14px", borderRadius:12, cursor:"pointer",
                boxShadow:`0 8px 24px rgba(245,158,11,0.35)`,
                letterSpacing:"-0.3px", transition:"all 0.2s"
              }}
              onMouseEnter={e => e.target.style.transform="translateY(-1px)"}
              onMouseLeave={e => e.target.style.transform="translateY(0)"}
            >
              Get Started →
            </button>

            <div style={{ marginTop:14, fontSize:11, color:"rgba(100,116,139,0.5)" }}>
              Free to use · Powered by Claude AI
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{ background:"rgba(22,27,39,0.9)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${T.border}`, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:58 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={()=>setSplash(true)}>
            <div style={{ width:34, height:34, borderRadius:9, background:`linear-gradient(135deg,${T.accent},#f97316)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, boxShadow:`0 4px 14px rgba(245,158,11,0.35)` }}>⚡</div>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:T.text, letterSpacing:"-0.3px" }}>PH Engineering Suite</div>
              <div style={{ fontSize:10, color:T.muted, letterSpacing:"0.6px" }}>by Jon Ureta · Philippines</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setModule(t.key)} style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"6px 13px", borderRadius:8,
                border:`1px solid ${module===t.key?t.color+"66":T.border}`,
                background:module===t.key?t.color+"18":"transparent",
                color:module===t.key?t.color:T.muted,
                cursor:"pointer", fontSize:12, fontWeight:700, transition:"all 0.15s"
              }}>
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
            <button onClick={()=>setShowKey(!showKey)} style={{ marginLeft:6, padding:"6px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, cursor:"pointer", fontSize:12, fontWeight:600 }}>🔑</button>
          </div>
        </div>

        {/* API key bar */}
        {showKey && (
          <div style={{ borderTop:`1px solid ${T.border}`, background:"rgba(245,158,11,0.04)", padding:"12px 24px" }}>
            <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", gap:12, alignItems:"center" }}>
              <span style={{ fontSize:13, color:T.accent, whiteSpace:"nowrap", fontWeight:600 }}>Anthropic API Key</span>
              <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-ant-..." style={{ flex:1, background:"#0f1117", border:`1.5px solid ${T.border}`, borderRadius:9, padding:"8px 14px", color:T.text, fontSize:13, outline:"none" }} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
              <button onClick={()=>setShowKey(false)} style={{ background:`linear-gradient(135deg,${T.accent},#f97316)`, border:"none", color:"#000", fontWeight:700, padding:"8px 18px", borderRadius:9, cursor:"pointer", fontSize:13 }}>Save</button>
            </div>
          </div>
        )}
      </div>

      {/* Page content */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 24px" }}>
        {module==="electrical" && (
          <>
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ width:28, height:28, borderRadius:7, background:`linear-gradient(135deg,${T.accent},#f97316)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>⚡</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:18, color:T.text }}>ElectriCode</div>
                  <div style={{ fontSize:11, color:T.muted }}>PEC 2017 · FSIC RA 9514 · Philippine Green Building Code</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {ETABS.map(t=>(
                  <button key={t.key} onClick={()=>setEtab(t.key)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:8,border:`1.5px solid ${etab===t.key?T.accent:T.border}`,background:etab===t.key?T.accentDim:"transparent",color:etab===t.key?T.accent:T.muted,cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.15s"}}>
                    <span>{t.icon}</span><span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <Card>
              {etab==="checker" && <PlanChecker apiKey={apiKey}/>}
              {etab==="vdrop"   && <VoltageDropCalc/>}
              {etab==="fault"   && <ShortCircuitCalc/>}
              {etab==="load"    && <LoadCalc/>}
            </Card>
          </>
        )}

        {module==="structural" && (
          <>
            <div style={{ marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#3b82f6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🏗️</div>
              <div>
                <div style={{ fontWeight:800, fontSize:18, color:T.text }}>StructiCode</div>
                <div style={{ fontSize:11, color:T.muted }}>NSCP 2015 7th Edition · DPWH Blue Book</div>
              </div>
            </div>
            <Card>
              <StructiCode apiKey={apiKey}/>
            </Card>
          </>
        )}

        {module==="sanitary" && (
          <>
            <div style={{ marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#10b981,#059669)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🚿</div>
              <div>
                <div style={{ fontWeight:800, fontSize:18, color:T.text }}>SaniCode</div>
                <div style={{ fontSize:11, color:T.muted }}>National Plumbing Code 2000 · PD 856 Sanitation Code</div>
              </div>
            </div>
            <Card>
              <SaniCode apiKey={apiKey}/>
            </Card>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop:`1px solid ${T.border}`, marginTop:40, padding:"20px 24px", textAlign:"center" }}>
        <div style={{ fontSize:12, color:"rgba(100,116,139,0.5)" }}>
          PH Engineering Suite · Developed by <strong style={{ color:T.muted }}>Jon Ureta</strong> · Philippines · Powered by Claude AI
        </div>
      </div>
    </div>
  );
}
