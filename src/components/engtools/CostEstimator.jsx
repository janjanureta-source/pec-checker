import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { callAI, toBase64, compressImage, getKey } from "../../utils/callAI.js";
import { Card, Label } from "../../theme.jsx";
import { addHistoryEntry } from "../../utils/history.js";
import { NoKeyBanner } from "../electrical/PlanChecker.jsx";

const COST_ESTIMATOR_PROMPT = `You are a licensed Philippine Quantity Surveyor (PQS) and Cost Estimator with 20+ years of experience on Philippine government and private construction projects. You produce parametric cost estimates that practicing engineers and project owners trust for budget planning and bid preparation.

═══════════════════════════════════════════
PHILIPPINE CONSTRUCTION RATE REFERENCE TABLE
(NCR baseline, Q1 2026 market rates — contractor all-in rates including labor, materials, equipment)
NOTE: These are TOTAL CONTRACTOR RATES per sqm of FLOOR AREA for complete works.
Adjust by location modifier provided in context.
═══════════════════════════════════════════

TOTAL PROJECT COST BENCHMARKS (all-in, contractor rate per sqm GFA):
- Economy Residential (bare, basic fixtures):             ₱20,000–₱25,000/sqm GFA
- Standard Residential (move-in ready, mid-range):        ₱28,000–₱38,000/sqm GFA
- High-End Residential (premium finishes):                ₱40,000–₱65,000/sqm GFA
- Standard Commercial/Office:                             ₱32,000–₱48,000/sqm GFA
- School/Institutional (DPWH standard):                   ₱28,000–₱42,000/sqm GFA
- Warehouse/Industrial:                                   ₱16,000–₱26,000/sqm GFA
- Hospital/Medical:                                       ₱55,000–₱90,000/sqm GFA

USE THESE BENCHMARKS as your sanity check. If your trade-by-trade total falls outside
the benchmark range for the project type, recheck your quantities and rates.

STRUCTURAL WORKS (trade rate, per sqm of floor area):
- RC Frame (columns, beams, slabs) — Residential 1–3F:   ₱9,000–₱13,500/sqm
- RC Frame — Multi-storey Residential 4–10F:              ₱12,000–₱18,000/sqm
- RC Frame — Commercial/Office 4–10F:                    ₱13,500–₱20,000/sqm
- RC Frame — Government/Institutional:                    ₱15,000–₱22,000/sqm
- Structural Steel Frame (industrial/warehouse):           ₱8,000–₱12,000/sqm
- Masonry load-bearing (single storey only):              ₱5,500–₱8,000/sqm
- Mat Foundation (per sqm of mat area):                   ₱10,000–₱17,000/sqm
- Isolated Footing (per footing, 1.2m×1.2m typical):     ₱15,000–₱28,000/pc
- Pile Foundation (precast RC 300mm, per lm):             ₱5,500–₱9,000/lm
- Shear Walls (200–300mm RC, per sqm of wall):            ₱7,000–₱11,000/sqm
NOTE: RC Frame should be 30–38% of total project cost for standard residential.

ARCHITECTURAL WORKS:
- CHB Masonry Walls 150mm, plastered both sides (sqm):    ₱1,800–₱2,800/sqm
- CHB Masonry Walls 100mm, plastered both sides (sqm):    ₱1,400–₱2,200/sqm
- Ceramic tile flooring, basic 30×30–40×40 (sqm):        ₱1,200–₱1,900/sqm
- Ceramic tile flooring, mid-range 60×60 (sqm):          ₱2,000–₱3,500/sqm
- Granite/marble tile flooring (sqm):                     ₱5,500–₱12,000/sqm
- Painted concrete floor (sqm):                           ₱350–₱600/sqm
- Ceiling — cement board, painted (sqm):                  ₱900–₱1,400/sqm
- Ceiling — gypsum board, painted (sqm):                  ₱1,100–₱1,800/sqm
- Ceiling — T-bar suspended, acoustic tile (sqm):         ₱1,400–₱2,200/sqm
- Doors — hollow-core flush (per set incl frame):         ₱10,000–₱18,000/set
- Doors — laminated solid wood panel (per set):           ₱22,000–₱42,000/set
- Doors — aluminum glass door (per set):                  ₱28,000–₱55,000/set
- Windows — aluminum awning/sliding (sqm of window):      ₱5,000–₱8,500/sqm
- Windows — frameless glass (sqm):                        ₱9,000–₱18,000/sqm
- Roof — pre-painted long-span G.I. (sqm of roof):       ₱1,100–₱1,800/sqm
- Roof — concrete slab + waterproofing (sqm):             ₱4,500–₱7,500/sqm
- Roof — clay/concrete tiles on framing (sqm):            ₱3,500–₱6,000/sqm
- Exterior paint — elastomeric, 2 coats (sqm):            ₱380–₱580/sqm
- Interior paint — 2 coats (sqm):                         ₱280–₱420/sqm

PLUMBING WORKS:
- Residential plumbing, complete (per fixture):           ₱22,000–₱38,000/fixture
- Commercial plumbing (per fixture):                      ₱32,000–₱55,000/fixture
- Sanitary/drain lines, PVC (per lm):                     ₱800–₱1,400/lm
- Water supply lines, PPR (per lm):                       ₱600–₱950/lm
- Septic tank, 2-chamber RC (per unit):                   ₱45,000–₱80,000/unit
- Sewage treatment plant (per unit, varies by capacity):  ₱180,000–₱850,000/unit

ELECTRICAL WORKS:
- Residential electrical, complete (per sqm of GFA):      ₱1,200–₱1,900/sqm
- Commercial electrical, complete (per sqm of GFA):       ₱2,500–₱4,500/sqm
- Industrial/3-phase electrical (per sqm of GFA):         ₱3,500–₱6,500/sqm
- Emergency generator set, 50kVA (per unit):              ₱350,000–₱550,000/unit
- Emergency generator set, 100kVA (per unit):             ₱850,000–₱1,200,000/unit
- Emergency generator set, 200kVA (per unit):             ₱1,400,000–₱1,900,000/unit
- Emergency generator set, 400kVA (per unit):             ₱2,200,000–₱3,200,000/unit
- Automatic transfer switch, 100kVA (per unit):           ₱120,000–₱180,000/unit
- Automatic transfer switch, 400kVA (per unit):           ₱280,000–₱420,000/unit
- Solar PV system, 5kWp (per unit):                       ₱280,000–₱420,000/unit

FIRE PROTECTION:
- Wet pipe sprinkler system (per sqm of floor):           ₱1,200–₱2,000/sqm
- Fire detection and alarm system (per sqm):              ₱450–₱850/sqm
- Fire standpipe and hose cabinet (per floor):            ₱35,000–₱65,000/floor
- Fire extinguishers (per unit):                          ₱3,500–₱6,000/unit

HVAC / AIRCONDITIONING:
- Window-type AC unit, 1HP (supply + install):            ₱22,000–₱35,000/unit
- Split-type AC, 1.5HP (supply + install):                ₱38,000–₱58,000/unit
- Cassette-type AC, 2HP (supply + install):               ₱65,000–₱95,000/unit
- VRF/VRV system (per TR of cooling):                     ₱95,000–₱145,000/TR
- Ventilation exhaust fan (per unit):                     ₱4,500–₱8,500/unit

SPECIAL SYSTEMS (as applicable):
- CCTV system (per camera, complete):                     ₱15,000–₱28,000/camera
- Access control (per door):                              ₱25,000–₱55,000/door
- Data/communications cabling (per port):                 ₱4,500–₱8,500/port
- Elevator, 6-stop (supply + install):                    ₱5,500,000–₱9,000,000/unit
- Elevator, 10-stop (supply + install):                   ₱8,500,000–₱14,000,000/unit

SITE WORKS:
- Site clearing and grubbing (per sqm):                   ₱85–₱180/sqm
- Earthfill and compaction (per cu.m):                    ₱550–₱950/cu.m
- Perimeter fence, CHB 1.8m (per lm):                     ₱4,500–₱7,500/lm
- Perimeter fence, precast concrete (per lm):             ₱8,500–₱14,000/lm
- Concrete paving, 150mm (per sqm):                       ₱1,100–₱1,800/sqm
- Asphalt paving, 50mm (per sqm):                         ₱850–₱1,400/sqm
- Landscaping, basic (per sqm):                           ₱350–₱750/sqm
- Drainage canal (per lm):                                ₱2,500–₱4,500/lm

GOVERNMENT / DPWH-SPECIFIC ITEMS:
- Anti-corrosion paint on rebar (per sqm of structure):   ₱120–₱220/sqm
- Epoxy floor coating (per sqm):                          ₱850–₱1,600/sqm
- Security grille (steel bar, per sqm):                   ₱2,800–₱4,500/sqm
- Detention cell doors (heavy steel, per set):            ₱85,000–₱145,000/set
- Bullet-resistant glazing (per sqm):                     ₱28,000–₱55,000/sqm
- CCTV with recording (per camera, high-security):        ₱25,000–₱45,000/camera

PROFESSIONAL FEES (PRC/AAIF schedule, based on project cost):
- Architectural services: 6–8% of construction cost
- Civil/Structural engineering: 3–5% of construction cost
- Mechanical/Electrical/Plumbing: 2–4% of construction cost
- Full design team (Arch + CE + MEP): 10–15% combined
- Construction management: 3–5% of construction cost
- Government projects (DPWH): fees per RA 9184 and agency-specific rates

OVERHEAD, PROFIT & CONTINGENCY:
- Contractor's O&P (typically included in unit rates above): 15–25%
- Contingency for schematic plans: add 20–25%
- Contingency for design development plans: add 10–15%
- Contingency for construction documents (complete): add 5–10%
- Government projects: include 12% VAT on contract price + 1% withholding tax

═══════════════════════════════════════════
PROJECT-TYPE TRADE BREAKDOWN GUIDE
═══════════════════════════════════════════
Always customize the trade list to match the actual project type:

RESIDENTIAL (house, duplex, townhouse):
Required trades: Site Works, Foundation, RC Structure, Masonry/Walls, Roofing, Waterproofing, Doors/Windows, Tile Works, Painting, Plumbing, Electrical, Kitchen Cabinetry, Landscaping
Optional: CCTV, Solar, Airconditioning, Carport/Garage

CONDOMINIUM / MID–HIGH-RISE:
Required trades: Site Works, Deep Foundation (piles), RC Frame (multistorey), Curtain Wall/Glazing, Waterproofing, Interior Fit-out per floor, Elevators, Fire Protection, Building Automation, HVAC, Electrical (HV/LV), Plumbing, Generator, Podium/Parking
Add: Common areas, lobby, amenities floor separately

COMMERCIAL / RETAIL / OFFICE:
Required trades: Site Works, Foundation, RC/Steel Frame, Architectural Shell, MEP rough-in, Partitions, Raised Floor/Ceiling, HVAC, Fire Protection, Electrical (commercial), Data/Comms, Signage, Parking, Landscape
Add: Tenant fit-out allowance if applicable

SCHOOL / INSTITUTIONAL:
Required trades: Site Works, Foundation, RC Frame (typically 3–5 storeys), Classrooms fit-out, Covered walk/canopy, Comfort rooms (per DepEd standards), Electrical, Plumbing, Fire exits/safety, Site paving, Perimeter fence, Flag ceremony area
Rates: Apply DPWH Blue Book school building costs (₱18,000–₱25,000/sqm typical)

GOVERNMENT / JAIL / DETENTION:
Required trades: Site Works (extensive perimeter), Deep Foundation, Heavy RC Frame with shear walls, Security fencing (reinforced), Security grilles on all openings, Heavy-duty detention doors, CCTV (high-density), Access control, Separate plumbing per cell block, Fire protection, Generator (mandatory), Staff quarters
Security premium: add 25–40% to standard construction cost
Apply DPWH Blue Book government building rates

WAREHOUSE / INDUSTRIAL:
Required trades: Site Works, Raft/Strip Foundation, Steel Frame or Tilt-up, Metal roofing (long-span), Concrete floor slab (heavy duty), Loading docks, Industrial electrical (3-phase), Fire protection (ESFR sprinklers for storage), Perimeter fence
Rates: ₱8,500–₱14,000/sqm typical for industrial

HOSPITAL / MEDICAL:
Required trades: RC Frame (seismically isolated preferred), Medical gas system, HVAC (HEPA filtration), Specialized plumbing, Electrical (UPS, emergency), Clean rooms, Radiation shielding (radiology), Pneumatic tube, Nurse call system, Elevators (bed-sized)
Medical premium: add 40–60% to standard institutional cost

RENOVATION / REMODEL:
Light: Estimate affected area only — paint, flooring, fixtures — NO structural
Moderate: Include new partitions, plumbing rough-in, electrical panel upgrade
Heavy/Gut: Include full demolition costs (₱850–₱1,800/sqm), structural modifications, complete MEP replacement
Always include demolition/hauling as a separate trade

FIT-OUT / INTERIOR ONLY:
Estimate interior works only: partition walls, ceiling, flooring, electrical outlets, data points, lighting, HVAC, painting, built-in furniture
Typical fit-out cost: ₱8,000–₱35,000/sqm depending on finish level (economy to luxury)

═══════════════════════════════════════════
MATERIAL COMPOSITION REFERENCE (per sqm of built area)
These are typical material quantities embedded in the parametric rates above.
Use these to cross-check if individual material quantities are known.
═══════════════════════════════════════════

RC FRAME (per sqm of floor area, standard residential):
- Concrete (27.5 MPa): 0.25–0.35 cu.m/sqm (columns + beams + slab combined)
- Reinforcing steel: 25–40 kg/sqm (residential), 40–65 kg/sqm (commercial), 60–90 kg/sqm (government/high-rise)
- Formwork: 1.5–2.2 sqm formwork per sqm of floor
- Cement: ~9.5 bags per cu.m of concrete (1:2:4 mix), ~8 bags for 1:1.5:3

CHB WALLS (per sqm of wall face):
- CHB 150mm: 12.5 pcs/sqm + mortar (cement: ~0.4 bag/sqm)
- CHB 100mm: 12.5 pcs/sqm + mortar (cement: ~0.3 bag/sqm)
- Current market prices (NCR, 2024–2025):
  - 40kg Portland cement bag (40kg): ₱295–₱345/bag
  - Deformed steel bar (12mm): ₱62–₱78/kg
  - Deformed steel bar (16mm): ₱62–₱78/kg
  - River sand (per cu.m): ₱1,400–₱2,200/cu.m
  - Crushed gravel (per cu.m): ₱1,600–₱2,400/cu.m
  - CHB 150mm: ₱17–₱22/pc
  - CHB 100mm: ₱13–₱17/pc
  - Ceramic tiles 60×60 (sqm supply only): ₱850–₱1,800/sqm
  - Plywood 1/2" ordinary: ₱750–₱1,100/sheet

SOIL CONDITION IMPACT ON FOUNDATION COST:
- Rock / very stiff: use LOW end of foundation rates (minimal excavation, shallow footing OK)
- Good (dense sand/gravel, SBC ≥120 kPa): use LOW-MID rates, standard isolated footings
- Average (medium stiff clay, SBC 75–120 kPa): use MID rates, possibly need larger footings
- Soft (loose fill, SBC <75 kPa): use HIGH rates, likely needs piles or mat footing, add 20–40% to foundation cost
- Unknown: use MID-HIGH rates and flag in marketWarnings

ESCALATION / PRICE INFLATION:
- Philippine construction inflation: ~6–10% per year (2023–2025 trend)
- Steel and cement most volatile: can move ±15–25% in 12 months
- If construction start is 6+ months away, add escalation to estimate:
  - 6 months: +3–5% to material-heavy trades (structural, MEP)
  - 12 months: +6–10%
  - 18 months: +9–15%
  - 24 months: +12–20%

═══════════════════════════════════════════
PRECISION RULES — READ CAREFULLY
═══════════════════════════════════════════

1. PLAN READING FIRST: Before estimating, extract from the plans:
   - Actual GFA per floor (count visible grid dimensions if possible)
   - Number and type of structural members visible (columns, beams, shear walls)
   - Foundation type shown on foundation plan
   - Number of toilets/fixtures visible
   - Roof type and area
   - Any special features visible (elevator pit, generator room, security features, etc.)

2. LOCATION-ADJUSTED RATES: Apply the exact location modifier given in the project context to EVERY trade rate. Do not use NCR rates for provincial projects.

3. FINISH-LEVEL RATES: 
   - Basic/Economy: use the LOW end of architectural rates above
   - Standard: use the MID point of rates above
   - High-end/Premium: use the HIGH end of architectural rates above, or higher for imported materials
   - Luxury: multiply high-end rates by 1.3–1.8×

4. PROJECT-TYPE RATES: Use the project-type trade breakdown guide above. Do not use a residential trade list for a government project, or a warehouse list for a school.

5. QUANTITY TAKEOFF: For each trade, provide realistic quantities taken from the plans:
   - Structural works: use actual floor area per floor × number of floors
   - Walls: estimate perimeter × floor height × 0.85 (deduct openings)
   - Roofing: use roof plan area if visible, or GFA × 1.1 for sloped roofs
   - MEP: use GFA-based parametric rates with project-type multiplier

6. CONTINGENCY: Set contingency based on plan completeness shown:
   - Complete CDs (all details visible): 8–10%
   - Design development (floor plans + elevations only): 12–18%
   - Schematic/conceptual only: 20–25%

7. GOVERNMENT PROJECTS: Always add:
   - 12% VAT on all contract items
   - DPWH standard 10% mobilization and demobilization
   - Bond premium estimate (2–3% of contract price)
   - Project billboard and safety signage (₱45,000–₱85,000 lump sum)

8. MATH CHECK: Verify that sum of all trade totalMid values equals summary.totalMid before outputting. percentOfTotal for each trade must sum to approximately 100%.

9. CONFIDENCE RATING:
   - HIGH: Complete plans with dimensions, schedules, and specifications visible
   - MEDIUM: Floor plans and elevations available but details/specs missing
   - LOW: Schematic or conceptual plans only, significant assumptions made

STRICT OUTPUT RULES:
- Return ONLY valid JSON — no markdown, no explanation, no preamble, no trailing text.
- All monetary values must be plain numbers (no ₱ symbol, no commas, no text).
- Every trade must have qty, unit, rateLow, rateHigh, totalLow, totalHigh, percentOfTotal.
- Do not truncate. Complete the full JSON including all trades, VE items, warnings, and next steps.
- max_tokens is set to 12000 — use as much as needed to be complete and precise.

Return this exact JSON structure:
{
  "project": {
    "name": "string",
    "type": "Residential|Duplex|Condominium|Commercial|Office|Retail|School|Warehouse|Government|Hospital|Mixed-Use|Infrastructure",
    "location": "string — specific city/province if visible in plans, otherwise region",
    "finishLevel": "Basic|Standard|High-end|Luxury",
    "scopeMode": "new-construction|renovation|fitout|addition|adhoc",
    "numberOfFloors": 0,
    "estimatedGFA": 0,
    "gfaSource": "user-provided|measured-from-plans|estimated",
    "gfaPerFloor": [{"floor": "Ground", "area": 0}],
    "structuralSystem": "string",
    "foundationType": "string",
    "roofType": "string",
    "numberOfFixtures": 0,
    "hasElevator": false,
    "hasGenerator": false,
    "hasFireProtection": false,
    "specialFeatures": ["list any visible special features from plans"],
    "scopeIncluded": ["detailed list of all scope items included"],
    "scopeExcluded": ["list of items explicitly excluded — be specific"],
    "estimationBasis": "string — describe exactly how quantities were derived from plans",
    "planQuality": "Complete|Design-Development|Schematic",
    "planQualityNote": "string — what was and wasn't visible in the plans"
  },
  "summary": {
    "totalLow": 0,
    "totalHigh": 0,
    "totalMid": 0,
    "midpoint": 0,
    "costPerSqmLow": 0,
    "costPerSqmHigh": 0,
    "costPerSqmMid": 0,
    "contingencyLow": 0,
    "contingencyHigh": 0,
    "contingencyPct": 0,
    "professionalFeesLow": 0,
    "professionalFeesHigh": 0,
    "professionalFeesPct": 0,
    "grandTotalLow": 0,
    "grandTotalHigh": 0,
    "marketBenchmarkLow": 0,
    "marketBenchmarkHigh": 0,
    "benchmarkSource": "string — cite the specific rate source, e.g. DPWH Blue Book 2024 School Building, NCR residential parametric",
    "vatAmount": 0,
    "vatIncluded": false,
    "vatNote": "string or null",
    "profFeeIncluded": false,
    "profFeeAmount": 0,
    "profFeeBasis": "string or null",
    "overallConfidence": "High|Medium|Low",
    "confidenceNote": "string — specific reason for this confidence level based on plan quality"
  },
  "trades": [
    {
      "trade": "string",
      "icon": "emoji",
      "description": "string — technical scope",
      "plainDescription": "string — plain language for client",
      "qty": 0,
      "unit": "sqm|cu.m|lm|pc|set|unit|lot|floor",
      "rateLow": 0,
      "rateHigh": 0,
      "totalLow": 0,
      "totalHigh": 0,
      "totalMid": 0,
      "percentOfTotal": 0,
      "isMajor": true,
      "included": true,
      "assumptions": "string — key assumptions made for this trade",
      "notes": "string — any risks, notes, or alternatives",
      "dpwhReference": "string or null"
    }
  ],
  "valueEngineering": [
    {
      "suggestion": "string — specific, actionable recommendation",
      "plainExplanation": "string — explain to a non-engineer client",
      "affectedTrade": "string — which trade this applies to",
      "savingLow": 0,
      "savingHigh": 0,
      "qualityImpact": "None|Minor|Moderate|Significant",
      "feasibility": "Easy|Moderate|Difficult",
      "recommendation": "Recommended|Consider|Last Resort"
    }
  ],
  "marketWarnings": [
    {
      "item": "string",
      "warning": "string — specific risk with Philippine market context",
      "level": "High|Medium|Low",
      "mitigation": "string — how to mitigate this risk"
    }
  ],
  "nextSteps": [
    {
      "step": 1,
      "action": "string",
      "detail": "string",
      "priority": "Urgent|High|Medium|Low"
    }
  ]
}`;

function CostEstimator({ apiKey }) {
  // ── Props ───────────────────────────────────────────────────────────────────
  // apiKey  {string}  Anthropic API key
  // Standalone: no parent state dependencies — self-contained

  const [files,       setFiles]       = useState([]);
  const [drag,        setDrag]        = useState(false);
  const [result,      setResult]      = useState(null);
  const [busy,        setBusy]        = useState(false);
  const [busyMsg,     setBusyMsg]     = useState("");
  const [error,       setError]       = useState(null);
  const [activeTab,   setActiveTab]   = useState("summary");

  // Project context
  const [scopeMode,     setScopeMode]     = useState("new");        // new | renovation | adhoc
  const [projectType,   setProjectType]   = useState("residential");
  const [finishLevel,   setFinishLevel]   = useState("standard");
  const [location,      setLocation]      = useState("ncr");
  const [gfaOverride,   setGfaOverride]   = useState("");
  const [clientName,    setClientName]    = useState("");
  const [projectName,   setProjectName]   = useState("");
  const [engineerName,  setEngineerName]  = useState("");
  const [specialNotes,  setSpecialNotes]  = useState("");
  const [inclProfFees,  setInclProfFees]  = useState(true);

  // Renovation / adhoc extras
  const [renovScope,    setRenovScope]    = useState("moderate");   // light | moderate | heavy
  const [adhocItems,    setAdhocItems]    = useState("");           // free text

  // ── Accuracy enhancers ──
  const [storeyHeight,   setStoreyHeight]   = useState("");          // floor-to-floor height in meters
  const [soilCondition,  setSoilCondition]  = useState("average");   // good | average | soft | rock
  const [constructionStart, setConstructionStart] = useState("");    // expected start: months from now
  const [knownQty,       setKnownQty]       = useState("");          // known quantities free text
  const [supplierPrices, setSupplierPrices] = useState("");          // supplier price overrides
  const [showAdvanced,   setShowAdvanced]   = useState(false);

  const fileRef = useRef(null);
  const STR = "#0696d7";
  const GOLD = "#f59e0b";
  const tick  = () => new Promise(r => setTimeout(r, 0));
  const fmt   = n => `₱${(+n||0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const fmtN  = n => (+n||0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2});
  const fmtR  = n => (+n||0).toLocaleString("en-PH",{maximumFractionDigits:0});

  // ── Restore last estimate session on mount ──
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("buildify_session_engtools") || "null");
      if (!s?.estimateResult?.summary) return;
      setResult(s.estimateResult);
    } catch {}
  }, []); // eslint-disable-line

  const addFiles = useCallback(fs => setFiles(p => [...p, ...Array.from(fs).map(f => ({
    file:f, id:Math.random().toString(36).slice(2), name:f.name, size:f.size, type:f.type||"application/octet-stream"
  }))]), []);

  const SCOPE_MODES = [
    { v:"new",        l:"🏗️ New Construction" },
    { v:"renovation", l:"🔧 Renovation / Remodel" },
    { v:"addition",   l:"➕ Addition / Extension" },
    { v:"fitout",     l:"🪑 Fit-out / Interior Only" },
    { v:"adhoc",      l:"📝 Ad-hoc / Custom Scope" },
  ];
  const PROJECT_TYPES = [
    { v:"residential",    l:"Residential" },
    { v:"duplex",         l:"Duplex / Townhouse" },
    { v:"condo",          l:"Condominium" },
    { v:"commercial",     l:"Commercial" },
    { v:"office",         l:"Office" },
    { v:"retail",         l:"Retail / Store" },
    { v:"school",         l:"School / Institutional" },
    { v:"warehouse",      l:"Warehouse / Industrial" },
    { v:"mixed_use",      l:"Mixed-Use" },
    { v:"infrastructure", l:"Infrastructure / Civil" },
  ];
  const FINISH_LEVELS = [
    { v:"basic",    l:"Basic",     desc:"Standard CHB, plain tiles, basic fixtures" },
    { v:"standard", l:"Standard",  desc:"Good quality tiles, mid-range fixtures, painted" },
    { v:"highend",  l:"High-end",  desc:"Imported materials, designer fixtures, custom finishes" },
  ];
  const LOCATIONS = [
    { v:"ncr",              l:"Metro Manila (NCR)" },
    { v:"ncr_makati",       l:"Makati / BGC / Taguig" },
    { v:"ncr_qc",           l:"Quezon City / Caloocan" },
    { v:"luzon_bulacan",    l:"Bulacan" },
    { v:"luzon_cavite",     l:"Cavite" },
    { v:"luzon_laguna",     l:"Laguna / Rizal" },
    { v:"luzon_pampanga",   l:"Pampanga / Central Luzon" },
    { v:"luzon_batangas",   l:"Batangas" },
    { v:"luzon_ilocos",     l:"Ilocos Region" },
    { v:"luzon_bicol",      l:"Bicol Region" },
    { v:"luzon_other",      l:"Luzon (other provinces)" },
    { v:"visayas_cebu",     l:"Cebu City / Metro Cebu" },
    { v:"visayas_iloilo",   l:"Iloilo" },
    { v:"visayas_other",    l:"Visayas (other)" },
    { v:"mindanao_davao",   l:"Davao City" },
    { v:"mindanao_cdo",     l:"Cagayan de Oro" },
    { v:"mindanao_other",   l:"Mindanao (other)" },
  ];
  const RENOV_LEVELS = [
    { v:"light",    l:"Light",    desc:"Paint, flooring, minor fixtures — no structural" },
    { v:"moderate", l:"Moderate", desc:"Kitchen/bath remodel, partitions, MEP updates" },
    { v:"heavy",    l:"Heavy / Gut", desc:"Full interior strip, structural modifications" },
  ];

  // Location cost modifiers — granular by city/region
  const LOCATION_DATA = {
    ncr:      { label:"Metro Manila (NCR)",         mod:1.00, vatRule:"12% VAT applies to all works",         laborNote:"Highest labor rates, abundant skilled trades" },
    ncr_makati:{ label:"Makati / BGC / Taguig",     mod:1.08, vatRule:"12% VAT applies to all works",         laborNote:"Premium location — expect 8–12% location premium on all trades" },
    ncr_qc:   { label:"Quezon City / Caloocan",     mod:1.00, vatRule:"12% VAT applies to all works",         laborNote:"NCR standard rates" },
    luzon_bulacan:{ label:"Bulacan",                mod:0.93, vatRule:"12% VAT applies",                      laborNote:"Close to NCR — materials cost similar, labor slightly lower" },
    luzon_cavite: { label:"Cavite",                 mod:0.92, vatRule:"12% VAT applies",                      laborNote:"Active construction area, competitive rates" },
    luzon_laguna: { label:"Laguna / Rizal",         mod:0.91, vatRule:"12% VAT applies",                      laborNote:"CALABARZON rates — slightly below NCR" },
    luzon_pampanga:{ label:"Pampanga / Central Luzon", mod:0.88, vatRule:"12% VAT applies",                   laborNote:"Lower labor cost, materials transport adds 3–5%" },
    luzon_batangas:{ label:"Batangas",              mod:0.87, vatRule:"12% VAT applies",                      laborNote:"Industrial zone presence helps material availability" },
    luzon_ilocos:  { label:"Ilocos Region",         mod:0.83, vatRule:"12% VAT applies",                      laborNote:"Remote from NCR — add 5–8% for material transport" },
    luzon_bicol:   { label:"Bicol Region",          mod:0.82, vatRule:"12% VAT applies",                      laborNote:"Typhoon zone — add 5–10% for wind-load-rated materials" },
    luzon_other:   { label:"Luzon (other provinces)",mod:0.88, vatRule:"12% VAT applies",                     laborNote:"Transport costs add 4–7% for materials" },
    visayas_cebu:  { label:"Cebu City / Metro Cebu",mod:0.92, vatRule:"12% VAT applies",                      laborNote:"Active market, competitive with NCR on some trades" },
    visayas_iloilo:{ label:"Iloilo",                mod:0.87, vatRule:"12% VAT applies",                      laborNote:"Growing construction market, good trade availability" },
    visayas_other: { label:"Visayas (other)",       mod:0.83, vatRule:"12% VAT applies",                      laborNote:"Island transport adds 6–10% to material costs" },
    mindanao_davao:{ label:"Davao City",            mod:0.88, vatRule:"12% VAT applies",                      laborNote:"Second largest market, good availability" },
    mindanao_cdo:  { label:"Cagayan de Oro",        mod:0.85, vatRule:"12% VAT applies",                      laborNote:"Northern Mindanao hub, active construction market" },
    mindanao_other:{ label:"Mindanao (other)",      mod:0.80, vatRule:"12% VAT applies; some areas BARMM-specific rules", laborNote:"Most remote — add 8–15% transport cost on materials" },
  };

  const buildContext = () => {
    const scope   = SCOPE_MODES.find(s=>s.v===scopeMode)?.l || scopeMode;
    const type    = PROJECT_TYPES.find(t=>t.v===projectType)?.l || projectType;
    const finish  = FINISH_LEVELS.find(f=>f.v===finishLevel)?.l || finishLevel;
    const locData = LOCATION_DATA[location] || LOCATION_DATA["ncr"];
    const renov   = RENOV_LEVELS.find(r=>r.v===renovScope)?.l || renovScope;

    // Finish level rate guidance
    const finishGuide = {
      basic:    "Use LOW end of all architectural rate ranges. Economy tiles, hollow-core doors, basic fixtures, plain painted concrete floors.",
      standard: "Use MID-POINT of all architectural rate ranges. Good-quality local tiles, aluminum windows, standard fixtures, painted ceilings.",
      highend:  "Use HIGH end of all architectural rate ranges. Imported or designer tiles, powder-coated aluminum, premium fixtures, suspended ceilings.",
    }[finishLevel] || "Use standard rates";

    // Project type specific instructions
    const typeGuide = {
      residential:   "Single-family home or simple house. Include: site, foundation, RC frame or masonry, roofing, doors/windows, tile works, painting, basic plumbing, basic electrical. Carport if visible.",
      duplex:        "Two-unit residential. Estimate as residential × 2 but share foundation and party wall. Include separate utilities for each unit.",
      condo:         "Multi-storey condominium. Include: deep foundation (likely piles), RC frame, curtain wall, elevator(s), fire protection, BAS, HVAC, common areas. Estimate per floor.",
      commercial:    "Commercial building. Include: RC/steel frame, MEP for commercial loads, fire protection, signage allowance, parking. Higher electrical capacity than residential.",
      office:        "Office building. Include: raised floor, suspended ceiling, commercial HVAC, data/comms, fire protection, security, elevator if multi-storey.",
      retail:        "Retail store or mall space. Include: high-clearance structure, display lighting, commercial HVAC, fire protection, shopfront glazing.",
      school:        "School building. Apply DepEd and DPWH school building standards. Include: classrooms fit-out, covered walkways, comfort rooms (1 per 50 students), flag ceremony area, perimeter fence. Typical: ₱18,000–₱25,000/sqm DPWH rate.",
      warehouse:     "Warehouse or factory. Steel frame preferred. Include: heavy concrete floor slab (200mm+), loading docks, industrial electrical (3-phase), fire protection (ESFR), perimeter fence.",
      mixed_use:     "Mixed-use building. Split estimate by use: ground floor commercial rates + upper floor residential rates. Separate MEP systems.",
      infrastructure:"Civil infrastructure. Consult DPWH Blue Book for specific item codes. Include: earthworks, drainage, paving, structures per linear meter or unit.",
    }[projectType] || "Use appropriate trade breakdown for this project type";

    return `═══════════════════════════════════════════
PROJECT CONTEXT — READ BEFORE ESTIMATING
═══════════════════════════════════════════

PROJECT DETAILS:
- Project Name: ${projectName || "Not specified"}
- Client: ${clientName || "Not specified"}
- Scope Mode: ${scope}
- Project Type: ${type}
- Finish Level: ${finish}
- Location: ${locData.label}
- Location Cost Modifier: ×${locData.mod} applied to ALL NCR baseline rates
- Tax Rule: ${locData.vatRule}
- Labor Context: ${locData.laborNote}

FINISH LEVEL GUIDANCE:
${finishGuide}

PROJECT TYPE GUIDANCE:
${typeGuide}

GFA / AREA:
${gfaOverride
  ? `- USER-PROVIDED GFA: ${gfaOverride} sqm — USE THIS EXACT VALUE. Do not estimate differently from plans.`
  : `- GFA NOT PROVIDED — measure from plan dimensions or estimate from grid layout. Report your measurement method in estimationBasis.`}

${scopeMode==="renovation" ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCOPE: RENOVATION / REMODEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Renovation Level: ${renov}

WHAT TO INCLUDE vs EXCLUDE:
- EXCLUDE: site work, new foundations, structural frame (unless Heavy scope)
- INCLUDE: works being modified or replaced in the existing structure

LIGHT RENOVATION — finishes only:
  • Paint all surfaces (₱85–180/m2)
  • Replace floor tiles or vinyl flooring
  • Replace fixtures (plumbing fixtures, light fixtures)
  • No structural work, no MEP rough-in replacement
  • Typical cost: ₱2,500–₱5,000/sqm

MODERATE RENOVATION — partial systems:
  • All Light items PLUS:
  • New or relocated partitions (CHB or metal stud)
  • Partial MEP: panel upgrade, additional outlets, fixture relocations
  • Kitchen/bath remodel (cabinets, counters, tiles, new fixtures)
  • Ceiling replacement (gypsum board or painted)
  • Typical cost: ₱5,000–₱12,000/sqm

HEAVY / GUT RENOVATION — full strip and rebuild:
  • Full demolition of finishes and non-structural elements: ₱850–₱1,800/sqm
  • Complete MEP replacement (wiring, pipes, drains)
  • Structural repairs or modifications if needed
  • All new finishes, doors, windows, fixtures
  • Typical cost: ₱12,000–₱22,000/sqm

DEMOLITION RATES (include for Moderate and Heavy):
  - Strip tiles/flooring: ₱180–₱280/m2
  - Remove partitions CHB: ₱320–₱480/m2
  - Remove ceiling: ₱120–₱200/m2
  - Full interior gut: ₱850–₱1,800/sqm of renovated area
  - Hauling & disposal: ₱3,500–₱5,500/trip (10m3 truck)` : ""}

${scopeMode==="fitout" ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCOPE: FIT-OUT / INTERIOR ONLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fit-out Level: ${renov}

STRICT RULE — EXCLUDE ALL OF THESE (already built by developer/landlord):
  ✗ No site work, no earthworks
  ✗ No foundation, no structural frame, no roof
  ✗ No main electrical panel or service entrance (assume existing)
  ✗ No main plumbing risers (assume existing)
  ✗ No exterior works (facade, windows already installed)

INCLUDE ONLY INTERIOR FIT-OUT WORKS:
  ✓ Interior partitions (metal stud + gypsum board or CHB)
  ✓ Ceiling system (gypsum board, mineral fiber, exposed)
  ✓ Floor finishes (tiles, vinyl, carpet, epoxy)
  ✓ Interior doors (flush doors, glass partitions)
  ✓ Interior painting and skim coat
  ✓ Branch circuit wiring + outlets + switches (from existing panel)
  ✓ Plumbing rough-in for T&B and pantry only (tap to existing riser)
  ✓ HVAC/ACU installation (split-type units + linesets)
  ✓ Lighting fixtures
  ✓ Built-in cabinets, counters, millwork
  ✓ Signage and branding (if commercial)
  ✓ IT/data cabling (if office)

LIGHT FIT-OUT: paint + flooring + basic fixtures only → ₱4,500–₱8,000/sqm
STANDARD FIT-OUT: partitions + ceiling + full MEP branch + fixtures → ₱8,000–₱16,000/sqm
PREMIUM FIT-OUT: imported materials + custom millwork + full HVAC → ₱16,000–₱35,000/sqm` : ""}

${scopeMode==="addition" ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCOPE: ADDITION / EXTENSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT THIS SCOPE MEANS:
  New construction added to an EXISTING building — new floor, new wing, new room, or vertical extension.

INCLUDE (new works only):
  ✓ New foundation for addition (if horizontal extension)
  ✓ New structural frame, roof for added area
  ✓ All finishes for new area
  ✓ MEP extension: new circuits tapped from existing panel, new pipes tapped from existing risers
  ✓ TIE-IN / INTERFACE COSTS (critical — always include):
      - Opening existing wall/slab for structural connection: ₱8,500–₱15,000/opening
      - Patching and repairing disturbed existing finishes: ₱1,200–₱2,500/m2
      - MEP tie-in to existing panel/risers: ₱15,000–₱35,000/lot
      - Waterproofing new-to-old joint: ₱1,800–₱3,200/lm

EXCLUDE (existing building — already built):
  ✗ Foundation of existing building
  ✗ Structure of existing building
  ✗ Existing MEP systems (unless upgrade required)
  ✗ Existing finishes (unless damaged by tie-in work)

RATE GUIDANCE:
  - Estimate new area at full new-construction rates per sqm
  - Add tie-in costs as a separate line item under "Addition Interface Works"
  - Add contingency of 10–15% for unknown existing conditions (flag in marketWarnings)` : ""}

${scopeMode==="adhoc" && adhocItems ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCOPE: AD-HOC / CUSTOM SCOPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESTIMATE ONLY THESE SPECIFIC ITEMS (do not add other trades):
${adhocItems}

For each item: use unit rates from the reference table. Show qty, unit, rate range, total range.
If item is not in the reference table, use best available market data and flag confidence as LOW.` : ""}

${specialNotes ? `SPECIAL NOTES FROM ENGINEER:
${specialNotes}` : ""}

PROFESSIONAL FEES:
${inclProfFees
  ? `- INCLUDE professional fees in the estimate
- Use PRC/AAIF schedule: Arch 6–8%, CE 3–5%, MEP 2–4%, CM 3–5% of construction cost
- Government projects: apply agency-specific fee schedule`
  : `- EXCLUDE professional fees — construction cost only`}

SITE & STRUCTURAL CONDITIONS:
- Storey height: ${storeyHeight ? storeyHeight + " m — use for wall area, column height, MEP run calcs" : "Not specified — assume 3.0m residential / 3.6m commercial / 4.0m government"}
- Soil: ${soilCondition==="rock"?"Rock/Very Stiff: LOW foundation rates, shallow footings":soilCondition==="good"?"Good (SBC ≥120 kPa): LOW-MID foundation rates, standard isolated footings":soilCondition==="soft"?"SOFT SOIL (SBC <75 kPa): HIGH rates, likely pile/mat footing, +20–40% on foundation, flag HIGH risk in marketWarnings":soilCondition==="unknown"?"Unknown: MID-HIGH foundation rates, recommend geotech investigation, flag in warnings":"Average (SBC 75–120 kPa): MID foundation rates"}

${constructionStart?`PRICE ESCALATION: ~${constructionStart} months to construction start. Apply to structural and MEP trades: ${+constructionStart<=3?"+1-2%":+constructionStart<=6?"+3-5%":+constructionStart<=12?"+6-10%":+constructionStart<=18?"+9-15%":"+12-20%"}. Show as separate escalation trade line. Flag as market warning if >=12 months.`:"No escalation specified."}

${knownQty?`LOCKED QUANTITIES (engineer-confirmed — use these exactly, do not estimate differently):
${knownQty}
For each quantity: set trade qty to stated value. Note in assumptions: "Quantity confirmed by engineer."`:""} 

${supplierPrices?`CANVASSED SUPPLIER PRICES (override reference table with these confirmed rates):
${supplierPrices}
For affected trades: use these prices for rateLow/rateHigh. Note in trade notes: "Rate from canvassed supplier price."`:""}

CRITICAL INSTRUCTIONS:
1. Read ALL uploaded plan pages. Extract every structural member, fixture, special feature.
2. Apply ×${locData.mod} location modifier to every trade rate.
3. Apply soil condition impact to foundation costs per above.
4. Apply price escalation to structural/MEP trades if construction start is specified.
5. Use any locked quantities and supplier prices above — they override the reference table.
6. Match trade list to project type as specified in project-type guidance.
7. Every trade: qty, unit, rateLow, rateHigh, totalLow, totalHigh, totalMid, percentOfTotal required.
8. Math check: sum(all trade.totalMid) + contingency + profFees must equal summary.totalMid.
9. Set contingency per plan completeness rules in system prompt.
10. Compute ALL summary fields: totalLow, totalHigh, totalMid, midpoint (= totalMid), costPerSqmLow, costPerSqmHigh, grandTotalLow, grandTotalHigh, contingencyLow, contingencyHigh, professionalFeesLow, professionalFeesHigh. midpoint MUST equal (totalLow + totalHigh) / 2. grandTotalLow = totalLow + professionalFeesLow. grandTotalHigh = totalHigh + professionalFeesHigh.
11. percentOfTotal for each trade = (trade.totalMid / summary.totalMid) × 100. The sum of all percentOfTotal must equal 100%.
12. RC Frame / Structural Works should NOT exceed 40% of total for standard residential. If it does, recheck your rates — you likely applied a per-sqm rate to the entire GFA instead of just structural elements.
13. Return ONLY valid JSON. No text before or after the JSON object.`;
  };

  const run = async () => {
    if (!files.length) { setError("Please upload at least one plan file."); return; }
    const bad = files.find(f => !f.type.startsWith("image/") && f.type !== "application/pdf" && !f.name.match(/\.pdf$/i));
    if (bad) { setError(`"${bad.name}" must be a PDF or image file.`); return; }

    setBusy(true); setError(null); setResult(null);
    try {
      const blocks = [];
      for (let i = 0; i < files.length; i++) {
        const fo = files[i];
        setBusyMsg(`Reading file ${i+1}/${files.length}: ${fo.name}…`); await tick();
        let b64;
        if (fo.type.startsWith("image/")) {
          setBusyMsg(`Compressing: ${fo.name}…`); await tick();
          b64 = await compressImage(fo.file);
          blocks.push({ type:"image", source:{ type:"base64", media_type:"image/jpeg", data:b64 } });
        } else {
          b64 = await toBase64(fo.file);
          blocks.push({ type:"document", source:{ type:"base64", media_type:"application/pdf", data:b64 } });
        }
        blocks.push({ type:"text", text:`[PLAN FILE: ${fo.name}]` });
      }
      blocks.push({ type:"text", text: buildContext() });

      setBusyMsg("AI is reading plans and generating cost estimate…"); await tick();
      const data = await callAI({ apiKey, system:COST_ESTIMATOR_PROMPT, messages:[{ role:"user", content:blocks }], max_tokens:12000 });
      const raw  = data.content?.map(b => b.text||"").join("").replace(/```json|```/g,"").trim();
      let parsed;
      try { parsed = JSON.parse(raw); } catch { throw new Error("Could not parse AI response. Please try again."); }
      setResult(parsed);
      setActiveTab("summary");
      // ── Save to history ──
      addHistoryEntry({
        tool: "estimate",
        module: "structural",
        projectName: parsed?.project?.name || projectName || "Cost Estimate",
        meta: {
          totalHigh: parsed?.summary?.totalHigh,
          summary: `${parsed?.project?.type||""} · ${parsed?.project?.finishLevel||""} · ${(parsed?.project?.estimatedGFA||0).toLocaleString()} sqm`,
        }
      });
      // Direct save — merge with existing structural session
      try {
        const _cur = JSON.parse(localStorage.getItem("buildify_session_engtools") || "{}");
        localStorage.setItem("buildify_session_engtools", JSON.stringify({ ..._cur, estimateResult: parsed, _savedAt: new Date().toISOString(), _module: "structural", userId: "local" }));
      } catch(e) { console.warn("Session save failed", e); }
    } catch(e) {
      setError(e.message || "Estimation failed. Please try again.");
    } finally {
      setBusy(false); setBusyMsg("");
    }
  };

  // ── Export client-facing document ──
const exportDocument = () => {
    if (!result) return;
    const p   = result.project  || {};
    const _rs  = result.summary || {};
    const _tL  = +(_rs.totalLow  || _rs.constructionCostLow  || 0);
    const _tH  = +(_rs.totalHigh || _rs.constructionCostHigh || 0);
    const _tM  = +(_rs.totalMid  || _rs.midpoint || ((_tL + _tH) / 2) || 0);
    const _cp  = +(_rs.contingencyPct || _rs.contingencyPercent || 10);
    const _fp  = +(_rs.professionalFeesPct || 8);
    const _gtL = +(_rs.grandTotalLow  || (_tL * (1 + _fp/100)) || 0);
    const _gtH = +(_rs.grandTotalHigh || (_tH * (1 + _fp/100)) || 0);
    const s    = { ..._rs,
      totalLow: _tL, totalHigh: _tH, totalMid: _tM, midpoint: _tM,
      grandTotalLow: _gtL, grandTotalHigh: _gtH,
      costPerSqmLow:  +(_rs.costPerSqmLow  || (_tL / (+result?.project?.estimatedGFA||1)) || 0),
      costPerSqmHigh: +(_rs.costPerSqmHigh || (_tH / (+result?.project?.estimatedGFA||1)) || 0),
    };
    const trades = result.trades || [];
    const ve  = result.valueEngineering || [];
    const mw  = result.marketWarnings   || [];
    const ns  = result.nextSteps        || [];
    const refId = `EST-${Date.now().toString().slice(-6)}`;
    const date  = new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});
    const fmt   = n => `₱${(+n||0).toLocaleString("en-PH",{minimumFractionDigits:0,maximumFractionDigits:0})}`;
    const fmtR  = n => `₱${(+n||0).toLocaleString("en-PH",{minimumFractionDigits:0,maximumFractionDigits:0})}`;
    const pct   = n => `${(+n||0).toFixed(1)}%`;

    const included  = (p.scopeIncluded  || []).map(i => `<li>✓ ${i}</li>`).join("");
    const excluded  = (p.scopeExcluded  || []).map(i => `<li>✗ ${i}</li>`).join("");
    const majorTrades = trades.filter(t => t.included !== false);

    const tradeRows = majorTrades.map((t,i) => `
      <tr class="${i%2===0?'even':'odd'}${t.isMajor?' major':''}">
        <td><span class="trade-icon">${t.icon||'🏗'}</span> <strong>${t.trade}</strong><br><span class="small">${t.plainDescription||t.description||''}</span></td>
        <td class="center">${t.qty||''} ${t.unit||''}</td>
        <td class="right">${fmtR(t.totalLow)}</td>
        <td class="right bold">${fmtR(t.totalHigh)}</td>
        <td class="center chip">${t.percentOfTotal?pct(t.percentOfTotal):''}</td>
      </tr>`).join("");

    const veRows = ve.map(v => `
      <tr>
        <td>${v.suggestion||v.item||''}<br><span class="small muted">${v.plainExplanation||''}</span></td>
        <td class="center impact-${(v.qualityImpact||'').toLowerCase()}">${v.qualityImpact||'—'}</td>
        <td class="right green bold">${fmtR(v.savingLow||0)} – ${fmtR(v.savingHigh||0)}</td>
      </tr>`).join("");

    const warnItems = mw.map(w => `
      <div class="warn-item warn-${(w.level||'').toLowerCase()}">
        <span class="warn-dot"></span>
        <div><strong>${w.item||''}</strong><br><span class="small">${w.warning||''}</span></div>
      </div>`).join("");

    const stepItems = ns.map(n => `
      <div class="step-item">
        <div class="step-num">${n.step||''}</div>
        <div><strong>${n.action||''}</strong><br><span class="small muted">${n.detail||''}</span></div>
      </div>`).join("");

    const totalVeSaveLow  = ve.reduce((a,v)=>a+(+v.savingLow||0),0);
    const totalVeSaveHigh = ve.reduce((a,v)=>a+(+v.savingHigh||0),0);

    const w = window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><title>Cost Estimate — ${p.name||projectName||"Project"}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:#f1f5f9;color:#0f172a;font-size:14px;line-height:1.5}
  .page{max-width:900px;margin:0 auto;background:#fff}
  @media print{body{background:#fff}.no-print{display:none!important}.page{max-width:100%}}

  /* HEADER */
  .header{background:#0f2444;padding:28px 36px;display:flex;justify-content:space-between;align-items:center}
  .header-left .brand{font-size:20px;font-weight:900;color:#0696d7;letter-spacing:-0.5px}
  .header-left .brand-sub{font-size:11px;color:#94a3b8;margin-top:2px}
  .header-right{text-align:right}
  .header-right .doc-label{font-size:11px;color:#94a3b8}
  .header-right .doc-ref{font-size:13px;color:#fff;font-weight:700;margin-top:2px}
  .header-right .doc-date{font-size:11px;color:#94a3b8;margin-top:2px}

  /* CONTENT PADDING */
  .content{padding:28px 36px}
  section{margin-bottom:28px}

  /* PROJECT TITLE */
  .project-title{font-size:26px;font-weight:900;color:#0f2444;letter-spacing:-0.5px;line-height:1.2;margin-bottom:6px}
  .project-sub{font-size:13px;color:#64748b}

  /* FACT CARDS */
  .facts{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0}
  .fact-card{background:#f8fafc;border-radius:10px;padding:14px;text-align:center}
  .fact-val{font-size:18px;font-weight:800;color:#0f2444}
  .fact-lbl{font-size:11px;color:#64748b;margin-top:4px;line-height:1.4}

  /* BIG NUMBER */
  .cost-hero{border:2px solid #e2e8f0;border-radius:12px;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;gap:20px;margin:16px 0}
  .cost-main .cost-label{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px}
  .cost-main .cost-range{font-size:30px;font-weight:900;color:#0f2444;line-height:1.1;margin:4px 0}
  .cost-main .cost-mid{font-size:13px;color:#64748b;margin-top:4px}
  .cost-sqm{background:#e8f4fc;border-radius:10px;padding:14px 20px;text-align:center;min-width:160px}
  .cost-sqm .sqm-val{font-size:18px;font-weight:800;color:#0696d7}
  .cost-sqm .sqm-lbl{font-size:11px;color:#64748b;margin-top:2px}
  .cost-sqm .sqm-mkt{font-size:10px;color:#94a3b8;margin-top:6px;line-height:1.4}

  /* SECTION HEADINGS */
  h2{font-size:15px;font-weight:800;color:#0f2444;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #e2e8f0}

  /* WHAT'S INCLUDED GRID */
  .includes-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .include-card{background:#f8fafc;border-radius:8px;padding:12px;border-left:3px solid #0696d7}
  .include-card .inc-title{font-size:12px;font-weight:700;color:#0f2444;margin-bottom:3px}
  .include-card .inc-desc{font-size:11.5px;color:#64748b;line-height:1.4}

  /* TRADE TABLE */
  table{width:100%;border-collapse:collapse;font-size:12.5px}
  thead th{background:#0f2444;color:#fff;padding:9px 10px;text-align:left;font-size:11px;font-weight:700}
  th.right,td.right{text-align:right}
  th.center,td.center{text-align:center}
  tr.even td{background:#fff}
  tr.odd td{background:#f8fafc}
  tr.major td{background:#f0f7ff}
  td{padding:9px 10px;vertical-align:middle;border-bottom:1px solid #f1f5f9}
  .trade-icon{font-size:14px;margin-right:4px}
  .small{font-size:11px;color:#94a3b8;line-height:1.4}
  .muted{color:#94a3b8}
  .bold{font-weight:700}
  .green{color:#16a34a}
  .chip{font-size:11px;font-weight:700;color:#0696d7}
  tr.subtotal td{background:#e8f0fb;font-weight:700;color:#0f2444;border-top:2px solid #0f2444}
  tr.contingency td{background:#f8fafc;color:#64748b}
  tr.grand-total td{background:#0f2444;color:#fff;font-weight:800;font-size:13px;padding:12px 10px}

  /* FEES BOX */
  .fees-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border-radius:10px;overflow:hidden}
  .fees-left{background:#fef3c7;padding:16px 18px}
  .fees-right{background:#fffbeb;padding:16px 18px;border-left:2px solid #d97706}
  .fees-lbl{font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px}
  .fees-val{font-size:20px;font-weight:900;color:#0f2444;margin:4px 0}
  .fees-sub{font-size:11.5px;color:#64748b;line-height:1.4}
  .fees-q{font-size:12px;font-weight:700;color:#d97706;margin-bottom:6px}
  .fees-a{font-size:11.5px;color:#64748b;line-height:1.5}

  /* INCLUDE/EXCLUDE */
  .ie-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border-radius:10px;overflow:hidden}
  .ie-incl{background:#dcfce7;padding:16px 18px}
  .ie-excl{background:#fee2e2;padding:16px 18px}
  .ie-hdr{font-size:11px;font-weight:800;padding:8px 12px;margin:-16px -18px 10px;display:block}
  .ie-incl .ie-hdr{background:#166534;color:#fff}
  .ie-excl .ie-hdr{background:#7f1d1d;color:#fff}
  .ie-incl ul,.ie-excl ul{list-style:none;padding:0}
  .ie-incl li{font-size:12px;color:#166534;padding:3px 0}
  .ie-excl li{font-size:12px;color:#991b1b;padding:3px 0}

  /* SAVINGS TABLE */
  .impact-none{color:#16a34a;font-weight:700;font-size:11px}
  .impact-minimal{color:#16a34a;font-weight:700;font-size:11px}
  .impact-moderate{color:#d97706;font-weight:700;font-size:11px}
  .impact-significant{color:#dc2626;font-weight:700;font-size:11px}

  /* WARNINGS */
  .warn-item{display:flex;gap:10px;align-items:flex-start;padding:10px 14px;border-radius:8px;margin-bottom:8px;background:#fef3c7}
  .warn-item.warn-high{background:#fee2e2}
  .warn-item.warn-low{background:#f0fdf4}
  .warn-dot{width:10px;height:10px;border-radius:50%;background:#d97706;margin-top:4px;flex-shrink:0}
  .warn-high .warn-dot{background:#dc2626}
  .warn-low .warn-dot{background:#16a34a}
  .warn-item strong{font-size:12.5px;color:#0f2444}

  /* NEXT STEPS */
  .step-item{display:flex;gap:14px;align-items:flex-start;padding:12px;background:#eff6ff;border-radius:8px;margin-bottom:8px}
  .step-num{width:28px;height:28px;border-radius:50%;background:#0696d7;color:#fff;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .step-item strong{font-size:13px;color:#0f2444}

  /* CLIENT NOTE */
  .client-note{background:#eff6ff;border-left:4px solid #0696d7;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:20px;font-size:13px;color:#0f2444;line-height:1.6}

  /* DISCLAIMER */
  .disclaimer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 36px;font-size:11px;color:#94a3b8;line-height:1.6}

  /* FOOTER */
  .footer{background:#0f2444;padding:14px 36px;display:flex;justify-content:space-between;font-size:11px;color:#64748b}
  .footer a{color:#0696d7;text-decoration:none}

  /* PRINT BUTTON */
  .print-btn{position:fixed;top:20px;right:20px;padding:10px 22px;background:#0696d7;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;box-shadow:0 2px 10px rgba(0,0,0,0.2);z-index:999}
  .print-btn:hover{background:#0578b5}
</style></head><body>

<button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save PDF</button>

<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      <div class="brand">BUILDIFY</div>
      <div class="brand-sub">by Jon Ureta · PH Engineering Suite</div>
    </div>
    <div class="header-right">
      <div class="doc-label">COST ESTIMATE</div>
      <div class="doc-ref">${refId}</div>
      <div class="doc-date">${date}</div>
    </div>
  </div>

  <div class="content">

    <!-- PROJECT TITLE -->
    <section>
      <div class="project-title">${p.name||projectName||"Project Cost Estimate"}</div>
      <div class="project-sub">${p.location||""} &nbsp;·&nbsp; ${p.type||""} &nbsp;·&nbsp; ${p.finishLevel||""} Finish</div>
      ${p.clientNote ? `<div class="client-note">${p.clientNote}</div>` : ""}
      <div class="facts">
        <div class="fact-card"><div class="fact-val">${(+p.estimatedGFA||0).toLocaleString()} sqm</div><div class="fact-lbl">${p.gfaBreakdown||"Total Floor Area"}</div></div>
        <div class="fact-card"><div class="fact-val">${p.floors||"—"} ${+p.floors===1?"Storey":"Storeys"}</div><div class="fact-lbl">${p.subtype||""}</div></div>
        <div class="fact-card"><div class="fact-val">${p.finishLevel||"Standard"}</div><div class="fact-lbl">Finish Level</div></div>
      </div>
    </section>

    <!-- BIG COST NUMBER -->
    <section>
      <div class="cost-hero">
        <div class="cost-main">
          <div class="cost-label">Estimated Construction Cost</div>
          <div class="cost-range">${fmt(s.totalLow)} – ${fmt(s.totalHigh)}</div>
          <div class="cost-mid">Midpoint: <strong>${fmt(s.midpoint)}</strong> &nbsp;·&nbsp; ±20–35% parametric accuracy</div>
        </div>
        <div class="cost-sqm">
          <div class="sqm-val">${fmt(s.costPerSqmLow)} – ${fmt(s.costPerSqmHigh)}</div>
          <div class="sqm-lbl">per square meter</div>
          ${s.marketSqmNote ? `<div class="sqm-mkt">${s.marketSqmNote}</div>` : ""}
        </div>
      </div>
    </section>

    <!-- WHAT'S INCLUDED IN PLAIN LANGUAGE -->
    <section>
      <h2>What's included in this estimate?</h2>
      <div class="includes-grid">
        ${majorTrades.filter(t=>t.icon).map(t=>`
          <div class="include-card">
            <div class="inc-title">${t.icon} ${t.trade}</div>
            <div class="inc-desc">${t.plainDescription||t.description||""}</div>
          </div>`).join("")}
      </div>
    </section>

    <!-- TRADE BREAKDOWN TABLE -->
    <section>
      <h2>Cost Breakdown by Work Category</h2>
      <p style="font-size:12px;color:#64748b;margin-bottom:12px">Each range shows low (basic materials) to high (better quality). Highlighted rows are your biggest cost items.</p>
      <table>
        <thead><tr>
          <th>Work Category</th>
          <th class="center">Scope</th>
          <th class="right">Low Estimate</th>
          <th class="right">High Estimate</th>
          <th class="center">% of Total</th>
        </tr></thead>
        <tbody>
          ${tradeRows}
          <tr class="subtotal">
            <td colspan="2">Construction Subtotal</td>
            <td class="right">${fmt(s.constructionCostLow)}</td>
            <td class="right">${fmt(s.constructionCostHigh)}</td>
            <td></td>
          </tr>
          <tr class="contingency">
            <td colspan="2">+ ${s.contingencyPct||10}% Contingency Fund <span class="small">(buffer for surprises)</span></td>
            <td class="right">${fmt(s.contingencyLow)}</td>
            <td class="right">${fmt(s.contingencyHigh)}</td>
            <td></td>
          </tr>
          <tr class="grand-total">
            <td colspan="2">TOTAL CONSTRUCTION COST</td>
            <td class="right">${fmt(s.totalLow)}</td>
            <td class="right">${fmt(s.totalHigh)}</td>
            <td class="center">100%</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- PROFESSIONAL FEES -->
    <section>
      <h2>Including Professional Fees</h2>
      <div class="fees-grid">
        <div class="fees-left">
          <div class="fees-lbl">Grand Total with Fees (${s.professionalFeesPct||8}%)</div>
          <div class="fees-val">${fmt(s.grandTotalLow)} – ${fmt(s.grandTotalHigh)}</div>
          <div class="fees-sub">${s.professionalFeesNote||"Professional fees cover your Architect and Engineer."}</div>
          ${s.permitFeeNote ? `<div class="fees-sub" style="margin-top:6px;font-size:11px">${s.permitFeeNote}</div>` : ""}
          ${s.vatNote ? `<div class="fees-sub" style="margin-top:4px;font-size:11px">${s.vatNote}</div>` : ""}
        </div>
        <div class="fees-right">
          <div class="fees-q">What are professional fees?</div>
          <div class="fees-a">These are fees paid to your licensed Architect and Engineer for designing the house, getting permits, and supervising construction. Think of it like a doctor's fee — it's separate from the cost of medicine (construction).</div>
        </div>
      </div>
    </section>

    <!-- INCLUDED / EXCLUDED -->
    <section>
      <h2>Included &amp; Not Included</h2>
      <div class="ie-grid">
        <div class="ie-incl"><span class="ie-hdr">INCLUDED IN THIS ESTIMATE</span><ul>${included}</ul></div>
        <div class="ie-excl"><span class="ie-hdr">NOT INCLUDED — add separately</span><ul>${excluded}</ul></div>
      </div>
    </section>

    ${ve.length ? `
    <!-- COST SAVING IDEAS -->
    <section>
      <h2>Ways to Reduce Cost</h2>
      <p style="font-size:12px;color:#64748b;margin-bottom:12px">Ask your contractor about these options before finalizing materials.</p>
      <table>
        <thead><tr><th>What to Change</th><th class="center">Quality Impact</th><th class="right">Potential Saving</th></tr></thead>
        <tbody>
          ${veRows}
          <tr class="subtotal">
            <td>Total Possible Savings (if all applied)</td>
            <td></td>
            <td class="right green">${fmtR(totalVeSaveLow)} – ${fmtR(totalVeSaveHigh)}</td>
          </tr>
        </tbody>
      </table>
    </section>` : ""}

    ${mw.length ? `
    <!-- MARKET WARNINGS -->
    <section>
      <h2>Market Conditions to Watch</h2>
      ${warnItems}
    </section>` : ""}

    ${ns.length ? `
    <!-- NEXT STEPS -->
    <section>
      <h2>Your Next Steps</h2>
      ${stepItems}
    </section>` : ""}

    <!-- ASSUMPTIONS -->
    ${p.assumptions && p.assumptions.length ? `
    <section>
      <h2>Assumptions &amp; Notes</h2>
      <ul style="font-size:12px;color:#64748b;padding-left:18px;line-height:1.8">
        ${p.assumptions.map(a=>`<li>${a}</li>`).join("")}
      </ul>
    </section>` : ""}

  </div><!-- /content -->

  <!-- DISCLAIMER -->
  <div class="disclaimer">
    <strong>RATE REFERENCES:</strong> Structural &amp; civil rates — DPWH Blue Book 2024. Material prices — PSA CMWPI, Jan 2026. Labor, finishing &amp; MEP — NCR Contractor Market Survey, Q1 2026. Rebar &amp; cement spot prices cross-checked vs. Pag-asa Steel &amp; Holcim dealer quotes, Feb 2026. Professional fees — AAIF/PRC Schedule of Minimum Fees (current edition). Rates reviewed quarterly by Buildify.<br><br>
    <strong>IMPORTANT DISCLAIMER:</strong> This is a parametric pre-design cost estimate (±20–35% accuracy) for budgeting and client guidance purposes only.
    It is NOT a contract, Bill of Quantities, or formal tender document. Actual costs will vary based on final material choices, site conditions,
    contractor rates, and market prices at time of construction. ${p.validityNote||""} ${p.accuracyNote||""}
    A formal Bill of Quantities by a licensed Quantity Surveyor is required before awarding any contract. VAT (12%) is not included unless stated.
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <span>Prepared by <strong style="color:#0696d7">Buildify</strong> · PH Engineering Suite</span>
    <span>${refId} · Valid 90 days from date of issue</span>
  </div>

</div><!-- /page -->
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 600);
  };

  const trades   = result?.trades?.filter(t=>t.included!==false) || [];
  const _s       = result?.summary || {};
  // Compute missing fields so display never shows ₱0
  const _tLow    = +(_s.totalLow  || _s.constructionCostLow  || 0);
  const _tHigh   = +(_s.totalHigh || _s.constructionCostHigh || 0);
  const _tMid    = +(_s.totalMid  || _s.midpoint || ((_tLow + _tHigh) / 2) || 0);
  const _contPct = +(_s.contingencyPct || _s.contingencyPercent || 10);
  const _contL   = +(_s.contingencyLow  || _tLow  * _contPct / 100 || 0);
  const _contH   = +(_s.contingencyHigh || _tHigh * _contPct / 100 || 0);
  const _fpct    = +(_s.professionalFeesPct || _s.profFeePct || 8);
  const _fL      = +(_s.professionalFeesLow  || _s.profFeeAmount || (_tLow  * _fpct / 100) || 0);
  const _fH      = +(_s.professionalFeesHigh || (_tHigh * _fpct / 100) || 0);
  const _gtL     = +(_s.grandTotalLow  || (_tLow  + _fL)  || 0);
  const _gtH     = +(_s.grandTotalHigh || (_tHigh + _fH) || 0);
  const summary  = {
    ..._s,
    totalLow:  _tLow,  totalHigh:  _tHigh,  totalMid: _tMid,
    midpoint:  _tMid,
    contingencyLow: _contL, contingencyHigh: _contH, contingencyPct: _contPct,
    professionalFeesLow: _fL, professionalFeesHigh: _fH, professionalFeesPct: _fpct,
    grandTotalLow: _gtL, grandTotalHigh: _gtH,
    costPerSqmLow:  +(_s.costPerSqmLow  || (_tLow  / (+result?.project?.estimatedGFA || 1)) || 0),
    costPerSqmHigh: +(_s.costPerSqmHigh || (_tHigh / (+result?.project?.estimatedGFA || 1)) || 0),
  };
  const project  = result?.project || {};
  const veItems  = result?.valueEngineering || [];
  const warnings = result?.marketWarnings   || [];
  const nextSteps = result?.nextSteps || [];

  // ── Rate flag / feedback system ──
  const [flagged,    setFlagged]    = useState({});
  const [flagOpen,   setFlagOpen]   = useState(null);
  const [flagRate,   setFlagRate]   = useState("");
  const [flagNote,   setFlagNote]   = useState("");

  const RATES_VERSION = "Q1 2026";
  const RATES_SOURCES = "DPWH Blue Book 2024 · PSA CMWPI Jan 2026 · NCR contractor survey Q1 2026";
  const RATES_DETAIL = [
    { source: "DPWH Blue Book 2024", scope: "Structural & civil works unit rates", date: "2024 edition" },
    { source: "PSA Construction Materials Wholesale Price Index (CMWPI)", scope: "Cement, steel, aggregates", date: "January 2026" },
    { source: "NCR Contractor Market Survey", scope: "Labor, finishing trades, MEP", date: "Q1 2026" },
    { source: "Pag-asa Steel / Holcim dealer quotes", scope: "Rebar & cement spot prices cross-check", date: "February 2026" },
    { source: "AAIF / PRC Schedule of Minimum Fees", scope: "Professional fees basis", date: "Current edition" },
  ];

  const submitFlag = (tradeIdx, trade) => {
    const entry = { tradeIdx, trade: trade.trade, unit: trade.unit,
      aiRateLow: trade.rateLow, aiRateHigh: trade.rateHigh,
      userRate: flagRate, note: flagNote,
      location, projectType, ts: new Date().toISOString() };
    try {
      const existing = JSON.parse(localStorage.getItem("buildify_rate_flags") || "[]");
      existing.push(entry);
      localStorage.setItem("buildify_rate_flags", JSON.stringify(existing.slice(-200)));
    } catch {}
    setFlagged(p => ({ ...p, [tradeIdx]: entry }));
    setFlagOpen(null); setFlagRate(""); setFlagNote("");
  };

  const TRADE_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4","#f97316","#84cc16","#ec4899","#6366f1","#14b8a6","#a78bfa"];

  const handleNewEstimate = () => {
    setResult(null); setFiles([]);
    // Session stays in localStorage so history cards can reopen it
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <NoKeyBanner/>

      {result && (
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <button onClick={handleNewEstimate}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:9,
              border:"1.5px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.07)",
              color:"#ef4444",cursor:"pointer",fontSize:12,fontWeight:700}}>
            <Icon name="plus" size={13} color="#ef4444"/> New Estimate
          </button>
        </div>
      )}

      {/* ── Config Panel ── */}
      <Card>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${GOLD},#f97316)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>💰</div>
          <div>
            <div style={{fontWeight:800,fontSize:16,color:T.text,letterSpacing:"-0.3px"}}>Project Cost Estimator</div>
            <div style={{fontSize:11,color:T.muted}}>Upload plans → AI reads scope → generates client-ready estimate</div>
          </div>
        </div>

        {/* Scope mode */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Scope Mode</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {SCOPE_MODES.map(o=>(
              <button key={o.v} onClick={()=>setScopeMode(o.v)} style={{padding:"7px 14px",borderRadius:9,border:`1.5px solid ${scopeMode===o.v?GOLD:T.border}`,background:scopeMode===o.v?"rgba(245,158,11,0.12)":"transparent",color:scopeMode===o.v?GOLD:T.muted,cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.15s"}}>{o.l}</button>
            ))}
          </div>
        </div>

        {/* Renovation level (conditional) */}
        {(scopeMode==="renovation"||scopeMode==="fitout") && (
          <div style={{marginBottom:14,background:"rgba(245,158,11,0.05)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:10,padding:14}}>
            <div style={{fontSize:10,fontWeight:700,color:GOLD,marginBottom:8,textTransform:"uppercase"}}>{scopeMode==="fitout" ? "Fit-out Level" : "Renovation Extent"}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {RENOV_LEVELS.map(o=>(
                <button key={o.v} onClick={()=>setRenovScope(o.v)} style={{flex:1,minWidth:140,padding:"10px 12px",borderRadius:9,border:`1.5px solid ${renovScope===o.v?GOLD:T.border}`,background:renovScope===o.v?"rgba(245,158,11,0.12)":"transparent",color:renovScope===o.v?GOLD:T.muted,cursor:"pointer",transition:"all 0.15s",textAlign:"left"}}>
                  <div style={{fontSize:12,fontWeight:800}}>{o.l}</div>
                  <div style={{fontSize:10,marginTop:2,lineHeight:1.4}}>{o.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ad-hoc custom scope */}
        {scopeMode==="addition" && (
          <div style={{marginBottom:14,background:"rgba(6,150,215,0.05)",border:"1px solid rgba(6,150,215,0.2)",borderRadius:10,padding:14}}>
            <div style={{fontSize:10,fontWeight:700,color:"#0696d7",marginBottom:6,textTransform:"uppercase"}}>Addition Scope Notes</div>
            <div style={{fontSize:12,color:T.muted,lineHeight:1.6}}>
              Estimate covers <strong style={{color:T.text}}>new construction only</strong> — existing building structure is excluded. 
              Tie-in and interface costs will be added automatically. 
              Upload plans showing both existing building and the proposed addition for best accuracy.
            </div>
          </div>
        )}

        {scopeMode==="adhoc" && (
          <div style={{marginBottom:14,background:"rgba(99,102,241,0.05)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:10,padding:14}}>
            <div style={{fontSize:10,fontWeight:700,color:"#6366f1",marginBottom:6,textTransform:"uppercase"}}>Custom Scope Description</div>
            <textarea value={adhocItems} onChange={e=>setAdhocItems(e.target.value)}
              placeholder={"Describe the specific works to be estimated. Examples:\n- Replace all windows (12 units, analok frame)\n- Install new 150A electrical panel + rewire 2nd floor\n- Construct perimeter fence 45 linear meters\n- Install ceramic tiles living/dining area ~80 sqm"}
              style={{width:"100%",background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:9,padding:"10px 12px",color:T.text,fontSize:12,outline:"none",resize:"vertical",minHeight:100,lineHeight:1.6,fontFamily:"inherit"}}
              onFocus={e=>e.target.style.borderColor="#6366f1"} onBlur={e=>e.target.style.borderColor=T.border}/>
          </div>
        )}

        {/* Project details grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5,textTransform:"uppercase"}}>Project Type</div>
            <select value={projectType} onChange={e=>setProjectType(e.target.value)}
              style={{width:"100%",background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:9,padding:"8px 12px",color:T.text,fontSize:12,outline:"none",cursor:"pointer"}}>
              {PROJECT_TYPES.map(p=><option key={p.v} value={p.v}>{p.l}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5,textTransform:"uppercase"}}>Finish Level</div>
            <select value={finishLevel} onChange={e=>setFinishLevel(e.target.value)}
              style={{width:"100%",background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:9,padding:"8px 12px",color:T.text,fontSize:12,outline:"none",cursor:"pointer"}}>
              {FINISH_LEVELS.map(f=><option key={f.v} value={f.v}>{f.l} — {f.desc}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5,textTransform:"uppercase"}}>Location</div>
            <select value={location} onChange={e=>setLocation(e.target.value)}
              style={{width:"100%",background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:9,padding:"8px 12px",color:T.text,fontSize:12,outline:"none",cursor:"pointer"}}>
              {LOCATIONS.map(l=><option key={l.v} value={l.v}>{l.l}</option>)}
            </select>
          </div>
        </div>

        {/* Client / Engineer fields + GFA override */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:14}}>
          {[
            {l:"Client Name",      v:clientName,     s:setClientName,     ph:"e.g. Mr. Juan Dela Cruz"},
            {l:"Project Name",     v:projectName,    s:setProjectName,    ph:"e.g. Dela Cruz Residence"},
            {l:"Prepared By",      v:engineerName,   s:setEngineerName,   ph:"Engr. / Arch. name"},
            {l:"GFA Override (sqm)",v:gfaOverride,   s:setGfaOverride,    ph:"Leave blank to auto-detect"},
          ].map(f=>(
            <div key={f.l}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5,textTransform:"uppercase"}}>{f.l}</div>
              <input value={f.v} onChange={e=>f.s(e.target.value)} placeholder={f.ph}
                style={{width:"100%",background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:9,padding:"8px 10px",color:T.text,fontSize:12,outline:"none"}}
                onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor=T.border}/>
            </div>
          ))}
        </div>

        {/* Special notes + pro fees toggle */}
        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,marginBottom:14,alignItems:"start"}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5,textTransform:"uppercase"}}>Special Notes / Scope Clarifications</div>
            <input value={specialNotes} onChange={e=>setSpecialNotes(e.target.value)} placeholder="e.g. Exclude MEP works · Ground floor only · Existing slab to remain"
              style={{width:"100%",background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:9,padding:"8px 12px",color:T.text,fontSize:12,outline:"none"}}
              onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor=T.border}/>
          </div>
          <div style={{paddingTop:20}}>
            <button onClick={()=>setInclProfFees(!inclProfFees)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:9,border:`1.5px solid ${inclProfFees?"#10b981":T.border}`,background:inclProfFees?"rgba(16,185,129,0.1)":"transparent",color:inclProfFees?"#10b981":T.muted,cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>
              <span>{inclProfFees?"✓":"○"}</span> Include Prof. Fees
            </button>
          </div>
        </div>

        {/* ── Advanced Accuracy Inputs ── */}
        <div style={{marginBottom:14}}>
          <button onClick={()=>setShowAdvanced(p=>!p)}
            style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",borderRadius:9,border:`1.5px solid ${showAdvanced?"rgba(99,102,241,0.5)":T.border}`,background:showAdvanced?"rgba(99,102,241,0.08)":"transparent",color:showAdvanced?"#818cf8":T.muted,cursor:"pointer",fontSize:12,fontWeight:700,width:"100%",justifyContent:"space-between"}}>
            <span>🎯 Advanced Accuracy Inputs <span style={{fontSize:10,fontWeight:400,opacity:0.7}}>(optional — improves estimate precision)</span></span>
            <span style={{fontSize:14,transition:"transform 0.2s",transform:showAdvanced?"rotate(180deg)":"none"}}>▾</span>
          </button>

          {showAdvanced && (
            <div style={{marginTop:10,background:"rgba(99,102,241,0.04)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:12,padding:16,display:"flex",flexDirection:"column",gap:14}}>

              {/* Row 1: Storey height + Soil condition + Construction start */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:"#818cf8",marginBottom:5,textTransform:"uppercase"}}>Floor-to-Floor Height (m)</div>
                  <input value={storeyHeight} onChange={e=>setStoreyHeight(e.target.value)} placeholder="e.g. 3.0 (leave blank = AI assumes)"
                    style={{width:"100%",background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:9,padding:"8px 10px",color:T.text,fontSize:12,outline:"none"}}
                    onFocus={e=>e.target.style.borderColor="#818cf8"} onBlur={e=>e.target.style.borderColor=T.border}/>
                  <div style={{fontSize:9,color:T.muted,marginTop:3}}>Affects wall area, MEP runs, column height costs</div>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:"#818cf8",marginBottom:5,textTransform:"uppercase"}}>Soil Condition</div>
                  <select value={soilCondition} onChange={e=>setSoilCondition(e.target.value)}
                    style={{width:"100%",background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:9,padding:"8px 10px",color:T.text,fontSize:12,outline:"none",cursor:"pointer"}}
                    onFocus={e=>e.target.style.borderColor="#818cf8"} onBlur={e=>e.target.style.borderColor=T.border}>
                    <option value="rock">Rock / Very Stiff — cheapest foundation</option>
                    <option value="good">Good (dense sand/gravel, SBC ≥120 kPa)</option>
                    <option value="average">Average (medium clay, SBC 75–120 kPa)</option>
                    <option value="soft">Soft (loose fill, SBC &lt;75 kPa) — most expensive</option>
                    <option value="unknown">Unknown — AI will use conservative rates</option>
                  </select>
                  <div style={{fontSize:9,color:T.muted,marginTop:3}}>Directly affects foundation type and cost</div>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:"#818cf8",marginBottom:5,textTransform:"uppercase"}}>Expected Construction Start</div>
                  <select value={constructionStart} onChange={e=>setConstructionStart(e.target.value)}
                    style={{width:"100%",background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:9,padding:"8px 10px",color:T.text,fontSize:12,outline:"none",cursor:"pointer"}}
                    onFocus={e=>e.target.style.borderColor="#818cf8"} onBlur={e=>e.target.style.borderColor=T.border}>
                    <option value="">Immediate / Not specified</option>
                    <option value="3">~3 months from now</option>
                    <option value="6">~6 months from now (+3–5% escalation)</option>
                    <option value="12">~12 months from now (+6–10% escalation)</option>
                    <option value="18">~18 months from now (+9–15% escalation)</option>
                    <option value="24">~24 months from now (+12–20% escalation)</option>
                  </select>
                  <div style={{fontSize:9,color:T.muted,marginTop:3}}>PH construction inflation ~6–10%/yr — affects material costs</div>
                </div>
              </div>

              {/* Row 2: Known quantities */}
              <div>
                <div style={{fontSize:10,fontWeight:700,color:"#818cf8",marginBottom:5,textTransform:"uppercase"}}>Known Material Quantities <span style={{color:T.muted,fontWeight:400,textTransform:"none",fontSize:9}}>(from BOQ, structural schedules, or takeoff)</span></div>
                <textarea value={knownQty} onChange={e=>setKnownQty(e.target.value)}
                  placeholder={`Enter any confirmed quantities — AI will use these instead of estimating:\n• Reinforcing steel: 12,500 kg\n• Concrete volume: 185 cu.m\n• CHB 150mm walls: 420 sqm\n• Ceramic floor tiles: 310 sqm\n• Plumbing fixtures: 18 pcs`}
                  style={{width:"100%",background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:9,padding:"10px 12px",color:T.text,fontSize:12,outline:"none",resize:"vertical",minHeight:90,lineHeight:1.6,fontFamily:"inherit"}}
                  onFocus={e=>e.target.style.borderColor="#818cf8"} onBlur={e=>e.target.style.borderColor=T.border}/>
                <div style={{fontSize:9,color:T.muted,marginTop:3}}>Any quantity you enter is locked — the AI will not estimate it differently. More quantities = more accurate total.</div>
              </div>

              {/* Row 3: Supplier price overrides */}
              <div>
                <div style={{fontSize:10,fontWeight:700,color:"#818cf8",marginBottom:5,textTransform:"uppercase"}}>Supplier / Canvassed Prices <span style={{color:T.muted,fontWeight:400,textTransform:"none",fontSize:9}}>(override AI rates with actual quotes)</span></div>
                <textarea value={supplierPrices} onChange={e=>setSupplierPrices(e.target.value)}
                  placeholder={`Enter confirmed prices from supplier quotes or recent projects:\n• Portland cement 40kg: ₱295/bag (canvassed Holcim dealer, March 2025)\n• Deformed bars 12mm: ₱61/kg (Pag-asa Steel quote)\n• CHB 150mm: ₱16/pc (local supplier)\n• Ceramic tiles 60×60: ₱1,150/sqm (supplier quote)\n• Split-type AC 1.5HP: ₱44,000/unit installed`}
                  style={{width:"100%",background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:9,padding:"10px 12px",color:T.text,fontSize:12,outline:"none",resize:"vertical",minHeight:90,lineHeight:1.6,fontFamily:"inherit"}}
                  onFocus={e=>e.target.style.borderColor="#818cf8"} onBlur={e=>e.target.style.borderColor=T.border}/>
                <div style={{fontSize:9,color:T.muted,marginTop:3}}>These prices will override the reference table rates for affected trades. Canvassed prices produce the most accurate estimates.</div>
              </div>

            </div>
          )}
        </div>

        {/* File upload */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,color:GOLD,marginBottom:6,textTransform:"uppercase"}}>📐 Upload Plans * <span style={{color:T.muted,fontWeight:400,textTransform:"none"}}>(PDF, JPG, PNG — floor plans, elevations, site plans)</span></div>
          <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
            onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files)}} onClick={()=>fileRef.current?.click()}
            style={{border:`2px dashed ${drag?GOLD:T.border}`,borderRadius:12,padding:"20px",textAlign:"center",cursor:"pointer",background:drag?"rgba(245,158,11,0.06)":"rgba(255,255,255,0.01)",transition:"all 0.2s"}}>
            <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e=>addFiles(e.target.files)} style={{display:"none"}}/>
            <div style={{fontSize:28,marginBottom:6}}>📐</div>
            <div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:3}}>Drag & drop plans here</div>
            <div style={{color:T.muted,fontSize:11,marginBottom:10}}>More plans = more accurate estimate · floor plans · site plan · elevations</div>
            <div style={{display:"inline-block",background:GOLD,color:"#000",fontWeight:700,padding:"7px 18px",borderRadius:8,fontSize:12}}>Choose Files</div>
          </div>
          {files.length>0 && (
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>
              {files.map(fo=>(
                <div key={fo.id} style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:7,padding:"4px 8px",display:"flex",alignItems:"center",gap:5,maxWidth:200}}>
                  <span style={{fontSize:10}}>{fo.type?.startsWith("image/")?"🖼️":"📄"}</span>
                  <span style={{fontSize:10,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{fo.name}</span>
                  <button onClick={e=>{e.stopPropagation();setFiles(p=>p.filter(f=>f.id!==fo.id))}} style={{background:"rgba(239,68,68,0.12)",border:"none",color:T.danger,width:16,height:16,borderRadius:3,cursor:"pointer",fontSize:10,flexShrink:0}}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:13,color:T.danger}}>⚠️ {error}</div>}

        <button onClick={run} disabled={busy||!files.length} style={{width:"100%",background:busy||!files.length?`rgba(245,158,11,0.2)`:`linear-gradient(135deg,${GOLD},#f97316)`,border:"none",color:busy||!files.length?"#555":"#000",fontWeight:800,fontSize:15,padding:"13px",borderRadius:12,cursor:busy||!files.length?"not-allowed":"pointer",transition:"all 0.2s"}}>
          {busy ? (busyMsg||"⚙️ Generating estimate…") : "💰 Generate Cost Estimate"}
        </button>
        {busy && (
          <div style={{marginTop:10,background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:10,padding:"10px 16px",fontSize:12,color:GOLD,display:"flex",alignItems:"center",gap:10}}>
            <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⏳</span>
            <span>{busyMsg||"Working…"}</span>
          </div>
        )}
        {!files.length && !busy && <div style={{textAlign:"center",fontSize:11,color:T.muted,marginTop:7}}>Upload at least one plan file to begin</div>}
      </Card>

      {/* ── RESULTS ── */}
      {result && (
        <div style={{animation:"fadeIn 0.35s ease"}}>

          {/* Summary header */}
          <Card style={{marginBottom:14,background:"rgba(245,158,11,0.04)",border:"1.5px solid rgba(245,158,11,0.25)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:14}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontSize:10,color:T.muted,marginBottom:3}}>PROJECT</div>
                <div style={{fontWeight:800,fontSize:19,color:T.text,letterSpacing:"-0.5px"}}>{project.name||projectName||"Project"}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:2}}>{project.type} · {project.subtype} · {project.finishLevel} Finish</div>
                <div style={{fontSize:11,color:T.muted,marginTop:1}}>{project.location} · {fmtN(project.estimatedGFA)} sqm · {project.floors} floor{project.floors>1?"s":""}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:8,lineHeight:1.6,background:T.dim,borderRadius:8,padding:"8px 12px"}}>{project.scopeSummary}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,minWidth:240}}>
                <div style={{background:`rgba(245,158,11,0.12)`,border:"1.5px solid rgba(245,158,11,0.35)",borderRadius:12,padding:"16px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:T.muted,marginBottom:4}}>ESTIMATED CONSTRUCTION COST</div>
                  <div style={{fontSize:22,fontWeight:900,color:GOLD,fontFamily:"monospace",letterSpacing:"-0.5px"}}>₱{fmtR(summary.totalLow)}</div>
                  <div style={{fontSize:14,color:T.muted,margin:"4px 0"}}>to</div>
                  <div style={{fontSize:22,fontWeight:900,color:GOLD,fontFamily:"monospace",letterSpacing:"-0.5px"}}>₱{fmtR(summary.totalHigh)}</div>
                  <div style={{fontSize:11,color:T.muted,marginTop:6}}>Midpoint: <strong style={{color:T.text}}>₱{fmtR(summary.midpoint)}</strong></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                  <div style={{background:T.dim,borderRadius:9,padding:"10px 12px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:T.muted,marginBottom:2}}>COST / SQM</div>
                    <div style={{fontSize:12,fontWeight:800,color:T.text,fontFamily:"monospace"}}>₱{fmtR(summary.costPerSqmLow)}–₱{fmtR(summary.costPerSqmHigh)}</div>
                  </div>
                  <div style={{background:T.dim,borderRadius:9,padding:"10px 12px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:T.muted,marginBottom:2}}>GFA</div>
                    <div style={{fontSize:12,fontWeight:800,color:T.text}}>{fmtN(project.estimatedGFA)} sqm</div>
                  </div>
                </div>
                {inclProfFees && summary.grandTotalLow && (
                  <div style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:9,padding:"10px 12px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:T.muted,marginBottom:2}}>GRAND TOTAL (incl. Prof. Fees)</div>
                    <div style={{fontSize:14,fontWeight:800,color:"#10b981",fontFamily:"monospace"}}>₱{fmtR(summary.grandTotalLow)} – ₱{fmtR(summary.grandTotalHigh)}</div>
                  </div>
                )}
              </div>
            </div>
            {warnings.length>0 && (
              <div style={{marginTop:12,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:8,padding:"8px 12px",fontSize:12,color:GOLD}}>
                ⚠️ {warnings.map(w => typeof w === "string" ? w : (w.title || w.message || w.warning || JSON.stringify(w))).join(" · ")}
              </div>
            )}
          </Card>

          {/* ── Rates freshness badge + Confidence meter ── */}
          <div style={{display:"flex",gap:10,marginBottom:10,flexWrap:"wrap",alignItems:"flex-start"}}>
            {/* Rates version badge */}
            <div style={{display:"flex",alignItems:"flex-start",gap:8,padding:"10px 14px",background:"rgba(6,150,215,0.07)",border:"1px solid rgba(6,150,215,0.2)",borderRadius:10,flex:"0 0 auto",width:"100%",boxSizing:"border-box"}}>
              <span style={{fontSize:16,marginTop:2}}>📅</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:9,color:T.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:2}}>Rate References — {RATES_VERSION}</div>
                {RATES_DETAIL.map((r,i) => (
                  <div key={i} style={{fontSize:9,color:T.muted,lineHeight:1.7,display:"flex",gap:4,flexWrap:"wrap"}}>
                    <span style={{color:STR,fontWeight:600,flexShrink:0}}>· {r.source}</span>
                    <span style={{color:"rgba(148,163,184,0.6)"}}>— {r.scope} ({r.date})</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Confidence meter */}
            {(() => {
              const conf = summary.overallConfidence || project.planQuality;
              const confMap = {
                High:   { color:"#10b981", bg:"rgba(16,185,129,0.08)", border:"rgba(16,185,129,0.25)", label:"High Confidence", pct:90, note: project.planQualityNote || "Complete drawings with dimensions and schedules." },
                Medium: { color:GOLD,       bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.25)", label:"Medium Confidence ±20%", pct:60, note: project.planQualityNote || "Some details assumed. Commission full QS for bid." },
                Low:    { color:"#ef4444",  bg:"rgba(239,68,68,0.08)",  border:"rgba(239,68,68,0.25)",  label:"Low Confidence ±30%", pct:30, note: project.planQualityNote || "Schematic plans only. Budget figure, not for contract." },
              };
              const c = confMap[conf] || confMap["Medium"];
              return (
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",background:c.bg,border:`1px solid ${c.border}`,borderRadius:10,flex:1,minWidth:240}}>
                  <span style={{fontSize:16}}>🎯</span>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <div style={{fontSize:9,color:T.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px"}}>Estimate Confidence</div>
                      <div style={{fontSize:10,fontWeight:800,color:c.color}}>{c.label}</div>
                    </div>
                    <div style={{background:T.border,borderRadius:99,height:6,overflow:"hidden",marginBottom:4}}>
                      <div style={{width:`${c.pct}%`,height:"100%",background:c.color,borderRadius:99,transition:"width 0.6s ease"}}/>
                    </div>
                    <div style={{fontSize:9,color:T.muted,lineHeight:1.4}}>{c.note}</div>
                  </div>
                </div>
              );
            })()}
            {/* Cost/sqm benchmark */}
            {summary.costPerSqmMid && summary.marketBenchmarkLow && (
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:T.dim,border:`1px solid ${T.border}`,borderRadius:10,flex:1,minWidth:200}}>
                <span style={{fontSize:16}}>📈</span>
                <div>
                  <div style={{fontSize:9,color:T.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px"}}>vs Market Benchmark</div>
                  <div style={{fontSize:11,fontWeight:700,color:T.text}}>Your estimate: <span style={{color:GOLD}}>₱{fmtR(summary.costPerSqmMid)}/sqm</span></div>
                  <div style={{fontSize:10,color:T.muted}}>Market range: ₱{fmtR(summary.marketBenchmarkLow)}–₱{fmtR(summary.marketBenchmarkHigh)}/sqm</div>
                  <div style={{fontSize:9,color:T.muted,marginTop:1}}>{summary.benchmarkSource}</div>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:5,marginBottom:14,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {[
                {k:"summary",  l:"📊 Summary"},
                {k:"trades",   l:`🏗️ By Trade (${trades.length})`},
                {k:"scope",    l:"📋 Scope & Assumptions"},
                {k:"ve",       l:`💡 Value Engineering (${veItems.length})`},
                {k:"risks",    l:`⚠️ Risks (${warnings.length})`},
                {k:"nextsteps",l:`✅ Next Steps (${nextSteps.length})`},
              ].map(t=>(
                <button key={t.k} onClick={()=>setActiveTab(t.k)} style={{padding:"6px 13px",borderRadius:8,border:`1.5px solid ${activeTab===t.k?GOLD:T.border}`,background:activeTab===t.k?"rgba(245,158,11,0.12)":"transparent",color:activeTab===t.k?GOLD:T.muted,cursor:"pointer",fontSize:11,fontWeight:700,transition:"all 0.15s"}}>{t.l}</button>
              ))}
            </div>
            <button onClick={exportDocument} style={{background:`linear-gradient(135deg,${GOLD},#f97316)`,border:"none",color:"#000",fontWeight:700,padding:"8px 18px",borderRadius:9,cursor:"pointer",fontSize:11,fontWeight:800}}>📄 Export Client Document</button>
          </div>

          {/* SUMMARY TAB */}
          {activeTab==="summary" && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <Card>
                <Label>Cost Breakdown</Label>
                <div style={{display:"flex",flexDirection:"column",gap:7,marginTop:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"7px 12px",background:T.dim,borderRadius:8}}><span style={{fontSize:12,color:T.muted}}>Construction Subtotal</span><span style={{fontSize:12,fontWeight:700,color:T.text,fontFamily:"monospace"}}>₱{fmtR(summary.constructionCostLow)} – ₱{fmtR(summary.constructionCostHigh)}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"7px 12px",background:"rgba(245,158,11,0.06)",borderRadius:8}}><span style={{fontSize:12,color:T.muted}}>Contingency ({summary.contingencyPct}%)</span><span style={{fontSize:12,fontWeight:700,color:GOLD,fontFamily:"monospace"}}>+₱{fmtR(summary.contingencyLow)} – ₱{fmtR(summary.contingencyHigh)}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:`rgba(245,158,11,0.12)`,border:`1.5px solid rgba(245,158,11,0.3)`,borderRadius:10}}><span style={{fontSize:13,fontWeight:800,color:T.text}}>Total Construction</span><span style={{fontSize:14,fontWeight:900,color:GOLD,fontFamily:"monospace"}}>₱{fmtR(summary.totalLow)} – ₱{fmtR(summary.totalHigh)}</span></div>
                  {inclProfFees && summary.professionalFeesLow && <>
                    <div style={{display:"flex",justifyContent:"space-between",padding:"7px 12px",background:"rgba(16,185,129,0.06)",borderRadius:8}}><span style={{fontSize:12,color:T.muted}}>Professional Fees ({summary.professionalFeesPct}%)</span><span style={{fontSize:12,fontWeight:700,color:"#10b981",fontFamily:"monospace"}}>₱{fmtR(summary.professionalFeesLow)} – ₱{fmtR(summary.professionalFeesHigh)}</span></div>
                    <div style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:"rgba(16,185,129,0.1)",border:"1.5px solid rgba(16,185,129,0.3)",borderRadius:10}}><span style={{fontSize:13,fontWeight:800,color:T.text}}>Grand Total</span><span style={{fontSize:14,fontWeight:900,color:"#10b981",fontFamily:"monospace"}}>₱{fmtR(summary.grandTotalLow)} – ₱{fmtR(summary.grandTotalHigh)}</span></div>
                  </>}
                  <div style={{fontSize:10,color:T.muted,padding:"6px 10px",background:T.dim,borderRadius:6,lineHeight:1.5}}>{summary.vatNote}</div>
                </div>
              </Card>
              <Card>
                <Label>Trade Distribution</Label>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:12}}>
                  {trades.slice(0,8).map((t,i)=>{
                    const maxTotal = Math.max(...trades.map(x=>x.totalHigh||0));
                    const pct = maxTotal ? ((t.totalHigh||0)/maxTotal*100) : 0;
                    return (
                      <div key={t.id||i}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                          <span style={{fontSize:11,color:T.text,fontWeight:600}}>{t.trade}</span>
                          <span style={{fontSize:11,color:TRADE_COLORS[i%TRADE_COLORS.length],fontFamily:"monospace",fontWeight:700}}>₱{fmtR(t.totalHigh)}</span>
                        </div>
                        <div style={{background:T.border,borderRadius:99,height:5,overflow:"hidden"}}>
                          <div style={{width:`${pct}%`,height:"100%",background:TRADE_COLORS[i%TRADE_COLORS.length],borderRadius:99,transition:"width 0.5s ease"}}/>
                        </div>
                      </div>
                    );
                  })}
                  {trades.length>8 && <div style={{fontSize:11,color:T.muted,textAlign:"center",marginTop:4}}>+{trades.length-8} more trades</div>}
                </div>
              </Card>
            </div>
          )}

          {/* TRADES TAB */}
          {activeTab==="trades" && (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontSize:11,color:T.muted,padding:"6px 10px",background:"rgba(6,150,215,0.06)",border:"1px solid rgba(6,150,215,0.15)",borderRadius:8}}>
                💡 <strong style={{color:STR}}>Know a better rate?</strong> Click <strong>🚩 Flag</strong> on any trade row to submit the actual rate you paid. Your input helps keep Buildify accurate for all Philippine engineers.
              </div>
              <Card style={{padding:0,overflow:"hidden"}}>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:860}}>
                    <thead><tr style={{background:"rgba(245,158,11,0.1)"}}>
                      {["Trade","Scope","Qty","Unit","Rate Low","Rate High","Total Low","Total High","Flag Rate"].map(h=>(
                        <th key={h} style={{padding:"9px 10px",textAlign:["Rate Low","Rate High","Total Low","Total High"].includes(h)?"right":"left",fontSize:10,color:T.muted,fontWeight:700,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {trades.map((t,i)=>(
                        <tr key={t.id||i} style={{borderBottom:`1px solid ${T.border}`,background:i%2===0?"transparent":"rgba(255,255,255,0.01)",position:"relative"}}>
                          <td style={{padding:"9px 10px",fontSize:12,fontWeight:700,color:TRADE_COLORS[i%TRADE_COLORS.length]}}>{t.icon} {t.trade}</td>
                          <td style={{padding:"9px 10px",fontSize:11,color:T.muted,maxWidth:180,lineHeight:1.4}}>{t.description}</td>
                          <td style={{padding:"9px 10px",fontSize:11,color:T.text,textAlign:"right",fontFamily:"monospace"}}>{fmtN(t.qty)}</td>
                          <td style={{padding:"9px 10px",fontSize:11,color:T.muted}}>{t.unit}</td>
                          <td style={{padding:"9px 10px",fontSize:11,textAlign:"right",fontFamily:"monospace",color:T.text}}>₱{fmtR(t.rateLow)}</td>
                          <td style={{padding:"9px 10px",fontSize:11,textAlign:"right",fontFamily:"monospace",color:T.text}}>₱{fmtR(t.rateHigh)}</td>
                          <td style={{padding:"9px 10px",fontSize:11,textAlign:"right",fontFamily:"monospace",color:T.muted}}>₱{fmtR(t.totalLow)}</td>
                          <td style={{padding:"9px 10px",fontSize:12,textAlign:"right",fontFamily:"monospace",color:GOLD,fontWeight:700}}>₱{fmtR(t.totalHigh)}</td>
                          <td style={{padding:"9px 6px",textAlign:"center",position:"relative"}}>
                            {flagged[i] ? (
                              <span style={{fontSize:10,color:"#10b981",fontWeight:700}}>✓ Flagged</span>
                            ) : (
                              <button onClick={()=>{setFlagOpen(flagOpen===i?null:i);setFlagRate("");setFlagNote("");}}
                                style={{fontSize:10,padding:"4px 8px",borderRadius:6,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.07)",color:"#ef4444",cursor:"pointer",fontWeight:700}}>
                                🚩 Flag
                              </button>
                            )}
                            {flagOpen===i && (
                              <div style={{position:"absolute",right:0,top:"110%",zIndex:99,background:T.card,border:`1.5px solid rgba(239,68,68,0.4)`,borderRadius:12,padding:14,minWidth:220,boxShadow:"0 8px 32px rgba(0,0,0,0.4)",textAlign:"left"}}>
                                <div style={{fontSize:11,fontWeight:700,color:"#ef4444",marginBottom:8}}>🚩 Flag Rate for: {t.trade}</div>
                                <div style={{fontSize:10,color:T.muted,marginBottom:4}}>AI rate: ₱{fmtR(t.rateLow)}–₱{fmtR(t.rateHigh)}/{t.unit}</div>
                                <div style={{fontSize:10,color:T.muted,marginBottom:4}}>Your actual rate (₱/{t.unit}):</div>
                                <input value={flagRate} onChange={e=>setFlagRate(e.target.value)} placeholder="e.g. 14500"
                                  style={{width:"100%",background:T.dim,border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 8px",color:T.text,fontSize:12,marginBottom:6,outline:"none"}}
                                  onFocus={e=>e.target.style.borderColor="#ef4444"} onBlur={e=>e.target.style.borderColor=T.border}/>
                                <div style={{fontSize:10,color:T.muted,marginBottom:4}}>Location / notes (optional):</div>
                                <input value={flagNote} onChange={e=>setFlagNote(e.target.value)} placeholder="e.g. Cebu, Aug 2025, confirmed with supplier"
                                  style={{width:"100%",background:T.dim,border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 8px",color:T.text,fontSize:12,marginBottom:8,outline:"none"}}
                                  onFocus={e=>e.target.style.borderColor="#ef4444"} onBlur={e=>e.target.style.borderColor=T.border}/>
                                <div style={{display:"flex",gap:6}}>
                                  <button onClick={()=>submitFlag(i,t)} disabled={!flagRate}
                                    style={{flex:1,padding:"6px 0",borderRadius:7,border:"none",background:flagRate?"#ef4444":T.border,color:flagRate?"#fff":T.muted,fontWeight:700,fontSize:11,cursor:flagRate?"pointer":"default"}}>
                                    Submit
                                  </button>
                                  <button onClick={()=>setFlagOpen(null)}
                                    style={{padding:"6px 10px",borderRadius:7,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,fontSize:11,cursor:"pointer"}}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr style={{background:"rgba(245,158,11,0.1)",borderTop:`2px solid rgba(245,158,11,0.3)`}}>
                      <td colSpan={6} style={{padding:"10px 10px",fontSize:13,fontWeight:800,color:T.text}}>CONSTRUCTION COST TOTAL</td>
                      <td style={{padding:"10px 10px",fontSize:13,fontWeight:800,color:T.muted,textAlign:"right",fontFamily:"monospace"}}>₱{fmtR(summary.constructionCostLow)}</td>
                      <td style={{padding:"10px 10px",fontSize:13,fontWeight:800,color:GOLD,textAlign:"right",fontFamily:"monospace"}}>₱{fmtR(summary.constructionCostHigh)}</td>
                      <td/>
                    </tr></tfoot>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* SCOPE & ASSUMPTIONS TAB */}
          {activeTab==="scope" && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <Card>
                <Label>Scope Included</Label>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:12}}>
                  {(project.scopeIncluded||[]).map((s,i)=>(
                    <div key={i} style={{display:"flex",gap:8,padding:"7px 10px",background:T.dim,borderRadius:8}}>
                      <span style={{color:"#10b981",fontWeight:800,flexShrink:0}}>✓</span>
                      <span style={{fontSize:12,color:T.text}}>{s}</span>
                    </div>
                  ))}
                </div>
                <Label style={{marginTop:16}}>Scope Excluded</Label>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:10}}>
                  {(project.scopeExcluded||[]).map((s,i)=>(
                    <div key={i} style={{display:"flex",gap:8,padding:"7px 10px",background:T.dim,borderRadius:8}}>
                      <span style={{color:"#ef4444",fontWeight:800,flexShrink:0}}>✗</span>
                      <span style={{fontSize:12,color:T.muted}}>{s}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <Label>Key Assumptions</Label>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:12}}>
                  {(project.assumptions||[]).map((a,i)=>(
                    <div key={i} style={{display:"flex",gap:8,padding:"7px 10px",background:T.dim,borderRadius:8}}>
                      <span style={{color:GOLD,fontWeight:800,flexShrink:0,fontSize:12}}>•</span>
                      <span style={{fontSize:12,color:T.text,lineHeight:1.5}}>{a}</span>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:14,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:9,padding:"10px 12px"}}>
                  <div style={{fontSize:11,color:GOLD,fontWeight:700,marginBottom:4}}>⚠️ Accuracy Note</div>
                  <div style={{fontSize:11,color:T.muted,lineHeight:1.6}}>{project.accuracyNote}</div>
                </div>
                <div style={{marginTop:8,background:"rgba(100,116,139,0.08)",border:"1px solid rgba(100,116,139,0.15)",borderRadius:9,padding:"10px 12px"}}>
                  <div style={{fontSize:11,color:T.muted,lineHeight:1.6}}>{project.validityNote}</div>
                </div>
              </Card>
            </div>
          )}

          {/* VALUE ENGINEERING TAB */}
          {activeTab==="ve" && (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {veItems.length===0
                ? <Card style={{textAlign:"center",opacity:0.5,padding:40}}><div style={{fontSize:40,marginBottom:12}}>💡</div><div style={{color:T.muted}}>No value engineering suggestions generated</div></Card>
                : veItems.map((v,i)=>(
                  <div key={i} style={{background:"rgba(16,185,129,0.05)",border:"1.5px solid rgba(16,185,129,0.2)",borderRadius:12,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16}}>
                    <div style={{display:"flex",gap:12,alignItems:"flex-start",flex:1}}>
                      <span style={{fontSize:20,flexShrink:0}}>💡</span>
                      <span style={{fontSize:13,color:T.text,lineHeight:1.6}}>{v.item}</span>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:9,color:T.muted,marginBottom:2}}>POTENTIAL SAVING</div>
                      <div style={{fontSize:14,fontWeight:800,color:"#10b981"}}>{v.potentialSaving}</div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* RISKS TAB */}
          {activeTab==="risks" && (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {warnings.length===0
                ? <Card style={{textAlign:"center",opacity:0.5,padding:40}}><div style={{fontSize:40,marginBottom:12}}>✅</div><div style={{color:T.muted}}>No market risk items flagged</div></Card>
                : warnings.map((w,i)=>{
                    const lvlMap = { High:{c:"#ef4444",bg:"rgba(239,68,68,0.07)",border:"rgba(239,68,68,0.25)",icon:"🔴"}, Medium:{c:GOLD,bg:"rgba(245,158,11,0.07)",border:"rgba(245,158,11,0.25)",icon:"🟡"}, Low:{c:"#10b981",bg:"rgba(16,185,129,0.07)",border:"rgba(16,185,129,0.2)",icon:"🟢"} }[w.level]||{c:T.muted,bg:T.dim,border:T.border,icon:"⚪"};
                    return (
                      <div key={i} style={{background:lvlMap.bg,border:`1.5px solid ${lvlMap.border}`,borderRadius:12,padding:"14px 18px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:6}}>
                          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                            <span style={{fontSize:18,flexShrink:0}}>{lvlMap.icon}</span>
                            <div>
                              <div style={{fontSize:12,fontWeight:700,color:lvlMap.c,marginBottom:2}}>{w.item}</div>
                              <div style={{fontSize:12,color:T.text,lineHeight:1.6}}>{w.warning}</div>
                            </div>
                          </div>
                          <span style={{fontSize:10,padding:"3px 8px",borderRadius:99,background:lvlMap.bg,border:`1px solid ${lvlMap.border}`,color:lvlMap.c,fontWeight:800,flexShrink:0}}>{w.level} RISK</span>
                        </div>
                        {w.mitigation && (
                          <div style={{marginTop:8,padding:"8px 12px",background:"rgba(255,255,255,0.04)",borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>
                            <strong style={{color:T.text}}>💡 Mitigation:</strong> {w.mitigation}
                          </div>
                        )}
                      </div>
                    );
                  })
              }
              <div style={{padding:"10px 14px",background:"rgba(6,150,215,0.06)",border:"1px solid rgba(6,150,215,0.15)",borderRadius:9,fontSize:11,color:T.muted,lineHeight:1.6}}>
                📊 <strong style={{color:STR}}>Check current prices:</strong> PSA Construction Materials Wholesale Price Index (psa.gov.ph) · DPWH price lists (dpwh.gov.ph) · PhilGEPS awarded bids for real project benchmarks
              </div>
            </div>
          )}

          {/* NEXT STEPS TAB */}
          {activeTab==="nextsteps" && (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {nextSteps.length===0
                ? <Card style={{textAlign:"center",opacity:0.5,padding:40}}><div style={{fontSize:40,marginBottom:12}}>📋</div><div style={{color:T.muted}}>No next steps generated</div></Card>
                : nextSteps.map((ns,i)=>{
                    const prioMap = { Urgent:{c:"#ef4444",bg:"rgba(239,68,68,0.08)",border:"rgba(239,68,68,0.25)"}, High:{c:GOLD,bg:"rgba(245,158,11,0.08)",border:"rgba(245,158,11,0.2)"}, Medium:{c:STR,bg:"rgba(6,150,215,0.07)",border:"rgba(6,150,215,0.2)"}, Low:{c:T.muted,bg:T.dim,border:T.border} }[ns.priority]||{c:T.muted,bg:T.dim,border:T.border};
                    return (
                      <div key={i} style={{background:prioMap.bg,border:`1.5px solid ${prioMap.border}`,borderRadius:12,padding:"14px 18px",display:"flex",gap:14,alignItems:"flex-start"}}>
                        <div style={{width:32,height:32,borderRadius:"50%",background:prioMap.c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0}}>{ns.step}</div>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                            <div style={{fontSize:13,fontWeight:700,color:T.text}}>{ns.action}</div>
                            {ns.priority && <span style={{fontSize:9,padding:"2px 7px",borderRadius:99,background:prioMap.bg,border:`1px solid ${prioMap.border}`,color:prioMap.c,fontWeight:800}}>{ns.priority}</span>}
                          </div>
                          <div style={{fontSize:12,color:T.muted,lineHeight:1.6}}>{ns.detail}</div>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          )}

          <div style={{marginTop:12,padding:"9px 14px",background:T.dim,borderRadius:9,fontSize:11,color:T.muted,lineHeight:1.5}}>
            ⚠️ Parametric pre-design estimate ±20–35%. Not a contract document or bill of quantities. For contract award, commission a full QS. · PH Engineering Suite
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !busy && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
          {[
            {i:"📐",t:"Reads Your Plans",       d:"AI identifies GFA, scope, building type from drawings"},
            {i:"🏗️",t:"New Construction",        d:"Full parametric estimate by trade, NCR to Mindanao"},
            {i:"🔧",t:"Renovations & Fit-outs",  d:"Light, moderate, or heavy — only affected trades"},
            {i:"📝",t:"Ad-hoc / Custom Scope",   d:"Describe specific works, AI estimates line by line"},
            {i:"📊",t:"Detailed Breakdown",      d:"12 trade categories, low–high range per item"},
            {i:"💡",t:"Value Engineering",        d:"AI suggests where to save without compromising quality"},
            {i:"📄",t:"Client Document Export",   d:"Professional cost estimate letter, ready to send"},
            {i:"🏛️",t:"Covers All Locations",    d:"NCR, Luzon, Visayas, Mindanao cost modifiers"},
          ].map(x=>(
            <Card key={x.t} style={{textAlign:"center",padding:18}}>
              <div style={{fontSize:24,marginBottom:7}}>{x.i}</div>
              <div style={{fontWeight:700,fontSize:12,color:T.text,marginBottom:3}}>{x.t}</div>
              <div style={{fontSize:10,color:T.muted,lineHeight:1.5}}>{x.d}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRUCTURAL MODULE — StrucCode wrapper + all structural calculators
// The BOMReview and CostEstimator components above are intentionally kept
// outside this section — they will be moved to EngineeringTools in Phase D.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── STRUCTURAL INTELLIGENCE: PURE COMPUTATION ENGINE ────────────────────────
// Runs all design calcs from structuralData without React state.
// Returns a structuralResults object consumable by the summary panel.

export default CostEstimator;
