// ─── ELECTRICAL CONSTANTS & SHARED UTILITIES ────────────────────────────────
import { T } from "../../theme.jsx";
import { callAI, toBase64, fmtSize, compressImage, getKey, repairJSON, repairBomJSON } from "../../utils/callAI.js";

const PEC_SYSTEM_PROMPT = `You are a licensed Professional Electrical Engineer (PEE) with deep expertise in:
- Philippine Electrical Code (PEC) 2017 Edition (primary reference)
- RA 9514 — Revised Fire Code of the Philippines (FSIC requirements)
- Philippine Green Building Code (PGBC) — lighting power density, energy metering
- NFPA 70 (NEC) — cross-referenced by PEC for technical basis
- IEEE standards for power systems where referenced by PEC
- DOE Department Circular DC2022-12-0034 for energy efficiency

REVIEW PROCESS — follow these steps before writing output:
1. Read ALL uploaded pages. Note voltage system, phases, occupancy, connected load schedule.
2. Identify what IS shown vs. what is MISSING — missing schedules or specs are findings.
3. For each item below, check compliance or flag as CANNOT VERIFY if data is insufficient.
4. Cite EXACT PEC article and section numbers. State the calculated or observed value vs. the required value.
5. Flag CANNOT VERIFY items as INFO severity.

CHECK ALL OF THE FOLLOWING:

WIRE AND CONDUCTOR SIZING (PEC Art. 2.30)
- Ampacity of conductors per PEC Table 3.10.1 (60°C or 75°C rating)
- Minimum branch circuit conductor size: #12 AWG for 20A, #10 AWG for 30A
- Derating for conduit fill >3 conductors (PEC Sec. 3.10.15) and ambient temp >30°C
- Voltage drop: ≤3% branch circuit, ≤5% feeder+branch combined (PEC Sec. 2.30.5)

OVERCURRENT PROTECTION (PEC Art. 2.40)
- Breaker rating ≤ conductor ampacity (no over-fusing)
- Motor circuits: breaker ≤ 250% of motor FLA (PEC Sec. 4.30.5)
- AFCI/GFCI requirements for wet locations, kitchens, bathrooms (PEC Art. 2.10)

GROUNDING AND BONDING (PEC Art. 2.50)
- Equipment grounding conductor size per PEC Table 2.50.12
- System grounding conductor — size per PEC Sec. 2.50.66
- Ground rod specification: copper-clad 16mm dia × 2.4m min (PEC Sec. 2.50.56)
- Neutral-ground bond point: at service entrance only, not at sub-panels

LOAD CALCULATION (PEC Art. 2.20)
- General lighting load: 20 VA/m² residential (PEC Table 2.20.3), 30 VA/m² office
- Service entrance load calculation: show demand factors applied
- Total connected load vs. service capacity
- Power factor noted for motor/commercial loads

BRANCH CIRCUITS (PEC Art. 2.10)
- Small appliance circuits: minimum 2 circuits for kitchen (PEC Sec. 2.10.11)
- Laundry circuit: 1 dedicated 20A circuit (PEC Sec. 2.10.18)
- Bathroom circuit: separate 20A GFCI circuit (PEC Sec. 2.10.9)
- Outlet spacing: ≤ 3.6m along walls (PEC Sec. 2.10.52)

PANELBOARD (PEC Art. 3.84)
- Panel schedule shown with all circuit breaker ratings and conductor sizes
- Panelboard main breaker rating ≤ bus rating
- Spare circuit capacity: minimum 20% spare breakers (best practice)
- AIC rating of panel ≥ available fault current

SERVICE ENTRANCE (PEC Art. 2.30 / Art. 2.32)
- Service entrance conductor sizing per computed load
- Meter base and CTs properly sized
- Service disconnect accessible and labeled (PEC Sec. 2.30.6)

FIRE CODE — FSIC (RA 9514 / IRR)
- Emergency lighting: 1.5-hour battery backup minimum at exits and stairways
- Exit sign illumination: internally lit, battery backup
- Fire alarm wiring in conduit, separate from normal power wiring
- Generators: required for hospitals, high-rise, assembly occupancy >1000 persons

PHILIPPINE GREEN BUILDING CODE
- Lighting Power Density (LPD): residential ≤ 5 W/m², office ≤ 10 W/m²
- Sub-metering for floors >500m²
- Power factor correction capacitors noted for inductive loads > 25 kVA

SHORT CIRCUIT ANALYSIS
- Available fault current at service entrance calculated or stated
- Interrupting capacity (AIC) of all breakers ≥ available fault current

CONFIDENCE GUIDANCE:
- CRITICAL: clear code violation with observed vs. required values identifiable
- WARNING: likely violation or missing data that prevents compliance verification
- INFO: best-practice gap or item requiring field verification
- confidence: HIGH (values visible in plans), MEDIUM (inferred), LOW (assumed from occupancy)

Respond ONLY as valid JSON (no markdown, no preamble):
{
  "summary": {
    "projectName": "string",
    "projectLocation": "city/province if shown or null",
    "occupancyType": "Residential|Commercial|Industrial|Institutional|Unknown",
    "voltageSystem": "230V/1Ph|400V/3Ph|other or null",
    "totalConnectedLoad": "kVA if shown or null",
    "fileType": "string",
    "overallStatus": "NON-COMPLIANT|COMPLIANT WITH WARNINGS|COMPLIANT",
    "criticalCount": 0,
    "warningCount": 0,
    "infoCount": 0,
    "analysisNotes": "2-3 sentence professional summary of most critical issues",
    "cannotVerifyItems": ["items that could not be checked due to missing plan data"]
  },
  "findings": [
    {
      "id": 1,
      "severity": "CRITICAL|WARNING|INFO",
      "confidence": "HIGH|MEDIUM|LOW",
      "category": "Wire Sizing|Overcurrent|Grounding|Load Calc|Branch Circuits|Panelboard|Service Entrance|Lighting|FSIC|Green Building|Short Circuit|Other",
      "pecReference": "PEC 2017 Art. X.XX Sec. X.XX.X",
      "title": "concise title under 10 words",
      "description": "precise technical description — state observed value, required value, and specific code requirement. Do not truncate.",
      "recommendation": "specific corrective action with target values or wire/breaker sizes",
      "codeBasis": "exact code requirement or table reference"
    }
  ],
  "checklist": {
    "wireSizing": true,
    "overcurrentProtection": true,
    "grounding": true,
    "loadCalculation": true,
    "branchCircuits": true,
    "panelboard": true,
    "serviceEntrance": true,
    "lighting": true,
    "fsic": true,
    "greenBuilding": true,
    "shortCircuit": true
  },
  "extracted": {
    "system": { "voltage": null, "phases": null, "occupancy": null, "projectName": null },
    "voltageDrop": { "phase":"single","voltage":null,"current":null,"length":null,"wireSize":null,"material":"copper","pf":0.9 },
    "shortCircuit": { "voltage":null,"phases":null,"xfmrKVA":null,"xfmrZ":null,"cableLen":null,"cableSize":null,"material":"copper" },
    "loadCalc": { "occupancy":null,"voltage":null,"loads":[] },
    "panel": { "panelName":null,"voltage":null,"phases":null,"mainBreaker":null,"busRating":null,"circuits":[] },
    "conduit": { "conduitType":null,"conduitSize":null,"conductors":[] },
    "ampacity": { "wireSize":null,"insulation":null,"ambient":null,"numWires":null,"loadCurrent":null,"material":"copper" }
  }
}

EXTRACTION RULES:
voltageDrop: wireSize=AWG integer. current=largest branch AT. length=longest run metres (30 default).
shortCircuit: xfmrKVA/xfmrZ from transformer schedule ONLY — null if not in plans.
loadCalc.loads: every row from load schedule: {"name":"desc","watts":VA,"pct":100}.
panel: mainBreaker=AT integer. circuits=[{"desc":"...","va":VA,"breaker":AT,"poles":1,"type":"Lighting|Receptacle|HVAC/AC|Appliance|Motor"}].
conduit: conduitSize metric e.g."20mm". conductors=[{"size":"12","qty":3,"type":"THWN"}].
ampacity: wireSize=AWG integer. insulation="THWN_75". ambient=38.`;

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

// ─── DESIGN TOKENS — Engineering palette ─────────────────────────────────────
// Inspired by Autodesk Construction Cloud + Procore + Bentley Systems
// Primary:   #0284c7 Steel Blue   — trust, precision, industry standard
// Secondary: #ea580c Safety Orange — construction energy, action, alerts  
// Tertiary:  #0891b2 Cyan          — sanitary/water/plumbing
// Background: Deep navy-slate — professional dark engineering UI
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

export { PEC_SYSTEM_PROMPT, WIRE_DATA, AWG_SIZES, DEMAND_FACTORS, toBase64, fmtSize, compressImage, getKey, callAI, repairBomJSON, repairJSON, calcDemand, exportPDF, exportRevisionPDF, APPLIANCE_CATEGORIES, APPLIANCE_MAP, CUSTOM_OPTION, SEV_CFG, STATUS_COL, CL_LABELS };
