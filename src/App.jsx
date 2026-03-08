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

// ─── ROOT APP ────────────────────────────────────────────────────────────────
const TABS = [
  { key:"checker",  icon:"🔍", label:"Plan Checker"      },
  { key:"vdrop",    icon:"📉", label:"Voltage Drop"      },
  { key:"fault",    icon:"⚡", label:"Short Circuit"     },
  { key:"load",     icon:"📊", label:"Load Calculator"   },
];

export default function App() {
  const [tab, setTab]         = useState("checker");
  const [apiKey, setApiKey]   = useState("");
  const [showKey, setShowKey] = useState(false);
  const [splash, setSplash]   = useState(true);

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
              PEC Compliance Suite
            </h1>
            <div style={{ fontSize:13, color:T.muted, marginBottom:28, lineHeight:1.6 }}>
              PEC 2017 · FSIC RA 9514 · Philippine Green Building Code
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
                { icon:"🔍", label:"AI Plan Checker" },
                { icon:"📉", label:"Voltage Drop Calc" },
                { icon:"⚡", label:"Short Circuit Calc" },
                { icon:"📊", label:"Load Calculator" },
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
              <div style={{ fontWeight:800, fontSize:15, color:T.text, letterSpacing:"-0.3px" }}>PEC Compliance Suite</div>
              <div style={{ fontSize:10, color:T.muted, letterSpacing:"0.6px" }}>by Jon Ureta · PEC 2017 · FSIC RA 9514</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)} style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"6px 13px", borderRadius:8,
                border:`1px solid ${tab===t.key?"rgba(245,158,11,0.4)":T.border}`,
                background:tab===t.key?T.accentDim:"transparent",
                color:tab===t.key?T.accent:T.muted,
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
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:"clamp(22px,3.5vw,32px)", fontWeight:800, letterSpacing:"-0.8px", color:T.text, marginBottom:4 }}>
            { tab==="checker" && "⚡ AI Electrical Plan Reviewer" }
            { tab==="vdrop"   && "📉 Voltage Drop Calculator" }
            { tab==="fault"   && "⚡ Short Circuit Analysis" }
            { tab==="load"    && "📊 Load Schedule Calculator" }
          </h1>
          <div style={{ fontSize:13, color:T.muted }}>
            { tab==="checker" && "Upload plans for PEC 2017 · FSIC (RA 9514) · Philippine Green Building Code compliance check" }
            { tab==="vdrop"   && "Check conductor voltage drop compliance — PEC 2017 Art. 2.30 · 3% branch / 5% feeder+branch limits" }
            { tab==="fault"   && "Estimate available fault current for breaker interrupting capacity sizing — PEC 2017 Art. 2.40" }
            { tab==="load"    && "PEC 2017 Art. 2.20 demand factor method · Residential & commercial load calculations" }
          </div>
        </div>

        <Card>
          { tab==="checker" && <PlanChecker apiKey={apiKey}/> }
          { tab==="vdrop"   && <VoltageDropCalc/> }
          { tab==="fault"   && <ShortCircuitCalc/> }
          { tab==="load"    && <LoadCalc/> }
        </Card>
      </div>

      {/* Footer */}
      <div style={{ borderTop:`1px solid ${T.border}`, marginTop:40, padding:"20px 24px", textAlign:"center" }}>
        <div style={{ fontSize:12, color:"rgba(100,116,139,0.5)" }}>
          PEC Compliance Suite · Developed by <strong style={{ color:T.muted }}>Jon Ureta</strong> · Philippines · Powered by Claude AI
        </div>
      </div>
    </div>
  );
}
