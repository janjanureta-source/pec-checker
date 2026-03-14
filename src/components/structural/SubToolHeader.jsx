import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { Card } from "../../theme.jsx";

function SubToolHeader({ tool, onBack, hasData }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,padding:"10px 16px",background:T.card,borderRadius:10,border:`1px solid ${T.border}`}}>
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,color:T.muted,cursor:"pointer",fontSize:12,fontWeight:600,transition:"all 0.15s"}}>
        ← Plan Analysis
      </button>
      <div style={{width:1,height:20,background:T.border}}/>
      <Icon name={tool.icon} size={16} color="#0696d7"/>
      <div>
        <div style={{fontSize:14,fontWeight:800,color:T.text}}>{tool.label}</div>
        <div style={{fontSize:11,color:T.muted}}>{tool.code}</div>
      </div>
      {hasData && (
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#22c55e",fontWeight:700}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>
          Pre-filled from plans
        </div>
      )}
    </div>
  );
}


// ─── SANICODE DATA ────────────────────────────────────────────────────────────
const SC = "#06b6d4";

const NPC_SYSTEM_PROMPT = `You are a licensed Sanitary Engineer with deep expertise in:
- National Plumbing Code of the Philippines (NPC 2000) — primary reference
- Sanitation Code of the Philippines (PD 856) — septic tank and waste disposal
- Philippine Green Building Code (PGBC) — water efficiency, rainwater harvesting
- DPWH Blue Book — material and installation standards
- DOH Administrative Orders on water supply and sanitation

REVIEW PROCESS — follow these steps before writing output:
1. Read ALL uploaded pages. Note building type, number of floors, fixture count, pipe sizes shown.
2. Identify what IS shown vs. what is MISSING — missing legends, pipe schedules, and riser diagrams are findings.
3. For each item below, check compliance or flag CANNOT VERIFY if data is insufficient.
4. Cite EXACT NPC section numbers. State observed vs. required values wherever possible.
5. Do not cap findings — report every real violation found.

CHECK ALL OF THE FOLLOWING:

FIXTURE UNIT LOADING (NPC Table 4-1)
- Count all plumbing fixtures shown; compute total Drainage Fixture Units (DFU)
- Verify fixture unit values match NPC Table 4-1 (e.g. water closet = 4 DFU, lavatory = 1 DFU)
- Minimum fixtures per occupancy per NPC Table 4-2 (1 WC per 15 persons male/female residential)

WATER SUPPLY PIPE SIZING (NPC Sec. 6)
- Supply pipe sizing per NPC Table 6-4: total fixture units vs. pipe diameter
- Minimum cold water supply: 12mm for individual fixtures, 19mm for branch, 25mm for main
- Water pressure at topmost fixture: minimum 70 kPa (10 psi) — check if booster pump is needed
- Maximum static pressure: 550 kPa (80 psi) — PRV required if exceeded
- Hot and cold water lines shown separately and labeled

DRAINAGE PIPE SIZING (NPC Sec. 7)
- Horizontal drain slope: minimum 2% (1:50) for pipes ≤75mm; 1% (1:100) for pipes >75mm
- Building drain sizing per NPC Table 7-3 (DFU vs. pipe diameter)
- Soil stack sizing: 100mm minimum for WC connections
- Cleanouts: at base of each stack, at each change of direction >45°, max 15m spacing on horizontal runs

VENTING SYSTEM (NPC Sec. 9)
- Individual vent for each water closet (NPC Sec. 9.7)
- Vent pipe sizing per NPC Table 9-1
- Vent termination: minimum 150mm above roof, 900mm from any opening (window/door)
- Wet venting permitted only per NPC Sec. 9.4 limitations
- Stack vent or vent stack shown on riser diagram

SEPTIC TANK (PD 856 / NPC Sec. 7.14)
- Capacity: minimum 1 day retention time; 0.1 m³ per person per day
- For residential: 1.5m × 1.0m × 1.5m minimum for up to 6 persons
- Two-compartment design for >6 persons
- Minimum 3.0m from any building, 6.0m from water source
- Overflow to subsurface absorption field or approved disposal

GREASE TRAP (NPC Sec. 10 / DENR standards)
- Required for all kitchen drains in commercial occupancy
- Grease trap sizing: minimum 30-minute retention time
- Accessible for cleaning: manhole cover shown

BACKFLOW PREVENTION (NPC Sec. 6.9)
- Air gap minimum 2× pipe diameter above flood rim of fixture
- Vacuum breakers on hose bibbs, irrigation lines, and submerged inlets
- Reduced pressure zone (RPZ) valve for high-hazard connections

STORM DRAINAGE (NPC Sec. 11)
- Roof drain sizing per rainfall intensity (Metro Manila: 75 mm/hr minimum design)
- Roof drain strainers shown
- Storm and sanitary drains kept separate (NPC Sec. 11.1)
- Secondary overflow drain for roofs >100m²

HOT WATER SYSTEM (NPC Sec. 8, if applicable)
- Hot water supply: 60°C at heater outlet, 49°C min at fixtures
- Thermal expansion relief valve shown on storage type heaters
- Circulation loop for runs >15m

GREEN BUILDING
- Low-flow fixtures: WC ≤6 LPF, lavatory faucets ≤8 LPM (PGBC)
- Rainwater harvesting system shown if floor area >5000m²
- Greywater reuse system noted if applicable

CONFIDENCE GUIDANCE:
- CRITICAL: clear code violation with visible non-compliant values
- WARNING: likely violation or missing data preventing compliance verification
- INFO: best-practice gap or item needing field verification
- confidence: HIGH (values visible), MEDIUM (inferred), LOW (assumed from building type)

Respond ONLY as valid JSON (no markdown, no preamble):
{
  "summary": {
    "projectName": "string",
    "projectLocation": "city/province if shown or null",
    "buildingType": "Residential|Commercial|Industrial|Institutional|Unknown",
    "numberOfStoreys": null,
    "totalFixtures": null,
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
      "category": "Fixture Units|Pipe Sizing|Water Supply|Drainage|Venting|Septic Tank|Grease Trap|Backflow|Hot Water|Storm Drainage|Green Building|Other",
      "npcReference": "NPC 2000 Sec. X.X or PD 856 Sec. X",
      "title": "concise title under 10 words",
      "description": "precise technical description — state observed value, required value, and code requirement. Do not truncate.",
      "recommendation": "specific corrective action with target pipe sizes or dimensions",
      "codeBasis": "exact code requirement or table reference"
    }
  ],
  "checklist": {
    "fixtureUnits": true,
    "pipeSizing": true,
    "waterSupply": true,
    "drainageSystem": true,
    "ventingSystem": true,
    "septicTank": null,
    "greaseTrap": null,
    "backflowPrevention": true,
    "hotWater": null,
    "stormDrainage": true,
    "greenBuilding": true
  }
}`;

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

export default SubToolHeader;
