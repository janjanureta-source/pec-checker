// ─── STRUCTURAL CONSTANTS ────────────────────────────────────────────────────

function validateExtractedData(raw) {
  if (!raw || typeof raw !== "object") return { data: raw, warnings: ["No data extracted"] };
  const d = JSON.parse(JSON.stringify(raw)); // deep clone
  const warnings = [];

  // ── Materials validation ──
  if (d.materials) {
    const { fc, fy } = d.materials;
    if (fc !== null && fc !== undefined) {
      if (fc > 100) { warnings.push(`f'c = ${fc} MPa seems too high (max typical: 60 MPa). Set to null.`); d.materials.fc = null; }
      else if (fc < 10) { warnings.push(`f'c = ${fc} MPa seems too low (min typical: 15 MPa). Set to null.`); d.materials.fc = null; }
    }
    if (fy !== null && fy !== undefined) {
      if (fy > 600) { warnings.push(`fy = ${fy} MPa exceeds max (550). Set to null.`); d.materials.fy = null; }
      else if (fy < 200) { warnings.push(`fy = ${fy} MPa below min (230). Set to null.`); d.materials.fy = null; }
    }
  }

  // ── Beams validation ──
  if (d.beams && Array.isArray(d.beams)) {
    d.beams = d.beams.filter(bm => {
      if (!bm || (!bm.width && !bm.depth && !bm.span)) { warnings.push(`Beam ${bm?.id||"?"}: no dimensions — removed.`); return false; }
      if (bm.width && (bm.width < 100 || bm.width > 1000)) { warnings.push(`Beam ${bm.id}: width ${bm.width}mm out of range (100-1000). Nulled.`); bm.width = null; }
      if (bm.depth && (bm.depth < 150 || bm.depth > 2000)) { warnings.push(`Beam ${bm.id}: depth ${bm.depth}mm out of range (150-2000). Nulled.`); bm.depth = null; }
      if (bm.span && bm.span > 20) { warnings.push(`Beam ${bm.id}: span ${bm.span}m > 20m — possible mm→m error. Nulled.`); bm.span = null; }
      if (bm.Mu && bm.Mu > 5000) { warnings.push(`Beam ${bm.id}: Mu=${bm.Mu} kN·m very high. Verify.`); }
      return true;
    });
  }

  // ── Columns validation ──
  if (d.columns && Array.isArray(d.columns)) {
    d.columns = d.columns.filter(col => {
      if (!col || (!col.width && !col.height)) { warnings.push(`Column ${col?.id||"?"}: no dimensions — removed.`); return false; }
      if (col.width && (col.width < 100 || col.width > 2000)) { warnings.push(`Col ${col.id}: width ${col.width}mm out of range. Nulled.`); col.width = null; }
      if (col.height && (col.height < 100 || col.height > 2000)) { warnings.push(`Col ${col.id}: height ${col.height}mm out of range. Nulled.`); col.height = null; }
      if (col.mainBarDia && (col.mainBarDia < 10 || col.mainBarDia > 40)) { warnings.push(`Col ${col.id}: bar dia ${col.mainBarDia}mm out of range (10-40). Nulled.`); col.mainBarDia = null; }
      return col.width || col.height;
    });
  }

  // ── Footings validation ──
  if (d.footings && Array.isArray(d.footings)) {
    d.footings = d.footings.filter(ft => {
      if (!ft) return false;
      // Fix common unit errors
      if (ft.soilBearing && ft.soilBearing > 1000) {
        warnings.push(`Footing ${ft.id}: qa=${ft.soilBearing} likely in Pa not kPa. Converted to ${(ft.soilBearing/1000).toFixed(1)} kPa.`);
        ft.soilBearing = +(ft.soilBearing / 1000).toFixed(1);
      }
      if (ft.depthOfExcavation && ft.depthOfExcavation > 20) {
        warnings.push(`Footing ${ft.id}: Df=${ft.depthOfExcavation} likely in mm not m. Converted to ${(ft.depthOfExcavation/1000).toFixed(2)}m.`);
        ft.depthOfExcavation = +(ft.depthOfExcavation / 1000).toFixed(2);
      }
      // Also handle old 'depth' field for backward compatibility
      if (ft.depth && ft.depth > 20) {
        ft.depth = +(ft.depth / 1000).toFixed(2);
      }
      if (ft.soilBearing && (ft.soilBearing < 10 || ft.soilBearing > 600)) {
        warnings.push(`Footing ${ft.id}: qa=${ft.soilBearing}kPa out of typical range (10-600). Nulled.`);
        ft.soilBearing = null;
      }
      if (ft.thickness && ft.thickness > 3000) {
        warnings.push(`Footing ${ft.id}: thickness=${ft.thickness}mm seems too large. Capped at 3000mm.`);
        ft.thickness = null;
      }
      return true;
    });
  }

  // ── Slabs validation ──
  if (d.slabs && Array.isArray(d.slabs)) {
    d.slabs = d.slabs.filter(sl => {
      if (!sl || (!sl.span && !sl.thickness)) { return false; }
      if (sl.thickness && (sl.thickness < 50 || sl.thickness > 500)) { warnings.push(`Slab ${sl.id}: thickness ${sl.thickness}mm out of range. Nulled.`); sl.thickness = null; }
      if (sl.span && sl.span > 15) { warnings.push(`Slab ${sl.id}: span ${sl.span}m > 15m — verify.`); }
      return true;
    });
  }

  // ── Seismic validation ──
  if (d.seismic) {
    if (d.seismic.naturalPeriod && (d.seismic.naturalPeriod > 5 || d.seismic.naturalPeriod < 0.05)) {
      warnings.push(`Seismic T=${d.seismic.naturalPeriod}s out of range. Nulled.`);
      d.seismic.naturalPeriod = null;
    }
    if (d.seismic.responseFactor && (d.seismic.responseFactor > 10 || d.seismic.responseFactor < 1)) {
      warnings.push(`Seismic R=${d.seismic.responseFactor} out of range (1-10). Nulled.`);
      d.seismic.responseFactor = null;
    }
    if (d.seismic.seismicWeight && d.seismic.seismicWeight > 500000) {
      warnings.push(`Seismic W=${d.seismic.seismicWeight}kN extremely high. Verify.`);
    }
  }

  // ── Loads validation ──
  if (d.loads) {
    ["floorDL","floorLL","roofDL","roofLL"].forEach(k => {
      if (d.loads[k] && (d.loads[k] > 50 || d.loads[k] < 0.5)) {
        warnings.push(`Load ${k}=${d.loads[k]}kPa out of typical range (0.5-50). Nulled.`);
        d.loads[k] = null;
      }
    });
  }

  // ── Building validation ──
  if (d.building) {
    if (d.building.floorHeight && (d.building.floorHeight > 10 || d.building.floorHeight < 2)) {
      warnings.push(`Floor height ${d.building.floorHeight}m out of range (2-10). Nulled.`);
      d.building.floorHeight = null;
    }
    if (d.building.floors && (d.building.floors > 80 || d.building.floors < 1)) {
      warnings.push(`Floor count ${d.building.floors} out of range. Nulled.`);
      d.building.floors = null;
    }
  }

  return { data: d, warnings };
}

const NSCP_EXTRACTION_PROMPT = `You are a licensed Professional Civil/Structural Engineer (PSCE) reviewing Philippine structural drawings. Extract member schedules and reinforcement details.

CRITICAL RULES:
1. Extract ONLY what is EXPLICITLY shown — schedules, details, notes, dimensions.
2. NEVER guess or estimate. Use null if not clearly visible.
3. Extract ALL members listed in each schedule table, not just the first one.
4. UNITS: dimensions in mm, spans in meters, bar diameters in mm, spacing in mm.

WHERE TO FIND DATA IN TYPICAL PH STRUCTURAL PLANS:
- BEAM SCHEDULE: Usually a table near beam details showing mark, width×depth, top bars, bottom bars, stirrups
- COLUMN SCHEDULE: Table showing mark, dimensions, main bars, ties
- SLAB SCHEDULE: Table showing mark, thickness, reinforcement spacing
- FOOTING SCHEDULE: Table or detail showing mark, dimensions, reinforcement
- GENERAL NOTES: f'c, fy, concrete cover, soil bearing capacity (SBC), seismic zone
- STRUCTURAL ELEVATION: Floor heights, total building height

For bar notation like "3-25mmØ" → topBarCount=3, topBarDia=25
For stirrups like "12mmØ 1@50mm, 4@100mm, rest@150mm" → stirrupDia=12, stirrupSpacingRest=150
For "12mmØ @ 150mm O.C." → barDia=12, spacing=150

Return ONLY valid JSON — no markdown, no preamble.

{
  "building": {
    "name": "project name from title block or null",
    "occupancy": "Residential|Commercial|Industrial|Institutional|null",
    "floors": null,
    "floorHeight": "floor-to-floor height in METERS or null",
    "totalHeight": "total building height in METERS or null"
  },
  "materials": {
    "fc": "concrete strength in MPa or null",
    "fy": "steel yield strength in MPa or null",
    "coverBeam": "beam cover in mm or null",
    "coverColumn": "column cover in mm or null",
    "coverSlab": "slab cover in mm or null"
  },
  "beams": [
    {
      "id": "beam mark from schedule (B1, B2, GB, RB, etc.)",
      "width": "beam width in mm or null",
      "depth": "beam TOTAL depth h in mm (not effective depth) or null",
      "span": "span in METERS or null",
      "topBarCount": "number of top bars at support or null",
      "topBarDia": "top bar diameter in mm or null",
      "botBarCount": "number of bottom bars at midspan or null",
      "botBarDia": "bottom bar diameter in mm or null",
      "stirrupDia": "stirrup diameter in mm or null",
      "stirrupSpacingSupport": "first stirrup zone spacing in mm or null",
      "stirrupSpacingRest": "rest of stirrup spacing in mm or null"
    }
  ],
  "columns": [
    {
      "id": "column mark (C1, C2, etc.)",
      "width": "shorter dimension in mm or null",
      "height": "longer dimension in mm or null",
      "mainBarCount": "total number of longitudinal bars or null",
      "mainBarDia": "main bar diameter in mm or null",
      "tieDia": "tie bar diameter in mm or null",
      "tieSpacing": "tie spacing in mm or null",
      "type": "tied|spiral|null"
    }
  ],
  "footings": [
    {
      "id": "footing mark (F1, MF, IF-1, etc.)",
      "type": "isolated|mat|combined|wall|null",
      "length": "footing length in METERS or null",
      "widthFt": "footing width in METERS or null",
      "thickness": "footing thickness in mm or null",
      "topBarDia": "top bar dia in mm or null",
      "topBarSpacing": "top bar spacing in mm or null",
      "botBarDia": "bottom bar dia in mm or null",
      "botBarSpacing": "bottom bar spacing in mm or null",
      "soilBearing": "SBC in kPa (NOT Pa) or null",
      "depthOfExcavation": "depth in METERS (NOT mm) or null"
    }
  ],
  "slabs": [
    {
      "id": "slab mark (S1, S2, etc.)",
      "thickness": "slab thickness in mm or null",
      "type": "one-way|two-way|null",
      "span": "clear span in METERS or null",
      "mainBarDia": "main bar diameter in mm or null",
      "mainBarSpacing": "main bar spacing in mm or null",
      "tempBarDia": "temperature bar diameter in mm or null",
      "tempBarSpacing": "temperature bar spacing in mm or null"
    }
  ],
  "seismic": {
    "zone": "Zone 2|Zone 4|null",
    "soilType": "SA|SB|SC|SD|SE|SF|null",
    "soilTypeLabel": "e.g. SD - Stiff Soil or null",
    "occupancyCategory": "I - Standard|II - Essential|III - Hazardous|null",
    "structuralSystem": "SMRF|OMRF|Shear Wall|Dual|null"
  },
  "loads": {
    "floorDL": "floor dead load in kPa or null",
    "floorLL": "floor live load in kPa or null",
    "roofDL": "roof dead load in kPa or null",
    "roofLL": "roof live load in kPa or null"
  },
  "notes": "any relevant structural general notes verbatim or null"
}`;

const NSCP_SYSTEM_PROMPT = `You are a licensed Professional Civil/Structural Engineer (PSCE) with deep expertise in:
- NSCP 2015 7th Edition (primary reference)
- DPWH Blue Book (Design Guidelines, Criteria and Standards)
- ACI 318-14 (referenced by NSCP for concrete design)
- AISC 360 (referenced by NSCP for steel design)
- ASCE 7-10 (referenced by NSCP for load combinations)
- PHIVOLCS seismic hazard maps for Philippine seismic zones

REVIEW PROCESS — follow these steps before writing output:
1. Read ALL uploaded pages carefully. Note the project name, structure type, materials, dimensions.
2. Identify what IS shown and what is MISSING (missing specs are findings, not silence).
3. For each code section below, determine: PASS, FAIL, or CANNOT VERIFY (insufficient data shown).
4. A finding must cite the EXACT section number, describe the violation precisely, and state the required value.
5. Do not invent violations. Do not omit real ones. Flag CANNOT VERIFY items as INFO severity.

CHECK ALL OF THE FOLLOWING — no cap on findings:
LOAD COMBINATIONS
- NSCP Sec. 203.3: Verify U = 1.2D + 1.6L, 1.2D + 1.0E + 1.0L, 0.9D + 1.0W etc. are explicitly shown or noted
- NSCP Sec. 203.4: Serviceability checks (deflection limits L/240, L/360)

SEISMIC DESIGN
- NSCP Sec. 208.4: Seismic zone classification (Philippines: Zone 2 or Zone 4) — verify matches PHIVOLCS map for the project location
- NSCP Sec. 208.5: Design base shear V = (Cv×I / R×T) × W — check if Z, I, R, Cv, Ca values are explicitly stated
- NSCP Sec. 208.6: Seismic dead load W includes partitions, permanent equipment
- NSCP Sec. 208.7: Diaphragm design, irregularity checks for torsion
- NSCP Sec. 208.8: Drift limits (0.02h for Zone 4)
- NSCP Sec. 421: Special Moment Resisting Frame (SMRF) detailing — determine occupancy category from plans (hospital, jail, school, fire station = Essential I=1.25; hazardous = I=1.50; standard residential/commercial = I=1.0). For Zone 4 buildings with I ≥ 1.25 OR any building 4 storeys and above in Zone 4:
  * Beam stirrups must be at d/4 spacing in critical zones (within 2× beam depth from face of support), not just d/2
  * Column confinement ties at s0 = min(8db_longitudinal, 24db_tie, 0.5×least_column_dimension, 300mm) in end regions
  * If plans show only standard stirrup spacing without any SMRF or seismic detailing note, flag as CRITICAL
  * Shear wall boundary element requirements per Sec. 421.7 if shear walls are present
  * For standard residential (I=1.0, 1-3 storeys), IMRF (Intermediate) detailing per Sec. 421.3 applies instead

WIND LOAD
- NSCP Sec. 207.5: Wind speed map compliance — Metro Manila 200 kph, minimum
- NSCP Sec. 207.6: Exposure category, Kz, GCp, GCpi factors
- NSCP Sec. 207.9: Roof uplift calculations explicitly shown

CONCRETE DESIGN
- NSCP Sec. 403: f'c ≥ 21 MPa for structural elements; fy for main bars and ties — must be explicitly stated on plans
- NSCP Sec. 405: Minimum concrete cover per exposure class (exterior 50mm, interior 40mm, foundations 75mm)
- NSCP Sec. 406/407/408: Beam/column/slab minimum steel ratios (ρmin = 1.4/fy for beams)
- NSCP Sec. 408: Slab minimum thickness per span/20 (simply supported), span/24 (continuous) — verify all slab spans
- NSCP Sec. 409: Shear reinforcement — stirrups at d/2 max spacing in non-critical zones, d/4 in critical zones
- NSCP Sec. 410: Column ties spacing ≤ 16db, 48 tie diameters, or least column dimension
- NSCP Sec. 411: Lap splice lengths per NSCP Table 412.3

COLUMN SCHEDULE CHECK — CRITICAL
- Verify a complete column schedule exists showing: mark, size (b×h), longitudinal bar count and diameter, tie bar size and spacing
- If column marks appear on plans (e.g. C1, C2) but NO column schedule is shown with reinforcement details, this is a CRITICAL finding
- Check that column sizes match between framing plans and column schedule
- Verify column bar ratios: ρ = 1% to 8% (NSCP Sec. 410.4)

BEAM SCHEDULE CHECK
- Verify beam schedule shows: mark, b×d, top bars at support, bottom bars at midspan, stirrup size and spacing
- Confirm stirrup spacing matches NSCP Sec. 409 (d/2 max midspan, d/4 at critical zones for SMRF)
- For any beam with a different stirrup pattern (e.g. tighter spacing), verify it is consistent with the shear demand and occupancy category

SHEAR WALL CHECK
- If shear walls are present: verify design calculations showing shear demand vs. capacity are provided
- Check boundary element requirements per NSCP Sec. 421.7 — required if wall stress > 0.2f'c
- Verify horizontal and vertical reinforcement ratios meet NSCP Sec. 421.7.3 minimums (ρ ≥ 0.0025 each way)
- If shear wall details are shown but no design calculation is provided, flag as CRITICAL

FOUNDATION
- NSCP Sec. 303: Allowable bearing capacity vs. soil investigation report — SBC must reference a soil report by name/date
- NSCP Sec. 304: Minimum footing depth 600mm below natural grade
- NSCP Sec. 305: Pile design if soil report requires
- For mat footings: verify both top and bottom reinforcement are specified with bar sizes and spacing; flag if top and bottom bar spacings differ significantly (e.g. more than 2×) without a supporting calculation visible in the plans
- For isolated or combined footings: verify bar size, spacing, and cover are all explicitly noted in the footing schedule

STEEL DESIGN (if applicable)
- NSCP Sec. 502: ASTM A36 or A572 Gr50 material specification must be explicitly noted for ALL steel sections shown
- NSCP Sec. 506: Connection design — bolt grades (A325 or A490), weld type and size must be explicitly shown for all connections; if steel sections appear on plans (W-shapes, angles) without connection details, flag as CRITICAL
- NSCP Sec. 508: Slenderness ratio limits (KL/r ≤ 200 for compression members)
- For any steel member connected to an RC frame (roof beams, cage structures, canopies, mezzanines): the connection detail to the RC element must be explicitly shown with anchor bolt sizes, weld type, or embedded plate specs

DETAILING QUALITY
- Are ALL member rebar schedules present and complete? (beams, columns, slabs, footings, shear walls — each must have its own schedule)
- If a member type appears on framing plans but has no schedule, flag it specifically by name
- Are all sections/details cross-referenced to plan locations with sheet and detail numbers?
- Is the title block complete with PRC license number of PSCE on ALL sheets?
- Are revision blocks present and filled in?

STRICT RULES — NEVER HALLUCINATE COMPLIANCE:
- NEVER mark loadCombinations, seismicDesign, or windLoad as PASS unless the actual design calculations or load combination tables are explicitly shown in the uploaded plans.
- Structural drawings (foundation plan, framing plan, rebar schedules) do NOT prove load combination or seismic compliance — only explicit design calculation sheets do.
- If no seismic analysis worksheet, load combination table, or design calculation is visible in the plans, you MUST return "CANNOT VERIFY" for loadCombinations and seismicDesign, and create a WARNING finding for each.
- Do not assume compliance from the absence of violations. Assume non-compliance until proven otherwise by visible data.

CONFIDENCE GUIDANCE:
- Use CRITICAL for clear code violations where the plan shows non-compliant values
- Use WARNING for likely violations where key data is missing (cannot verify compliance)
- Use INFO for best-practice recommendations or items requiring field verification
- Set confidence: "HIGH" if you can see the actual values in the plans, "MEDIUM" if inferred, "LOW" if assumed from project type

Respond ONLY as valid JSON (no markdown, no preamble):
{
  "summary": {
    "projectName": "string",
    "projectLocation": "city/province if shown or null",
    "structureType": "Residential|Commercial|Industrial|Bridge|Retaining Wall|Unknown",
    "numberOfStoreys": null,
    "fileType": "string",
    "overallStatus": "NON-COMPLIANT|COMPLIANT WITH WARNINGS|COMPLIANT",
    "criticalCount": 0,
    "warningCount": 0,
    "infoCount": 0,
    "analysisNotes": "2-3 sentence professional summary of the most critical issues",
    "cannotVerifyItems": ["list of items that could not be checked due to missing plan data"]
  },
  "findings": [
    {
      "id": 1,
      "severity": "CRITICAL|WARNING|INFO",
      "confidence": "HIGH|MEDIUM|LOW",
      "category": "Load Combination|Seismic|Wind|Concrete|Steel|Foundation|Beam/Column|Slab|Connection|Materials|Detailing|Other",
      "nscpReference": "NSCP 2015 Sec. X.X.X",
      "title": "concise title under 10 words",
      "description": "precise technical description — state the observed value, the required value, and the specific code requirement violated. Do not truncate.",
      "recommendation": "specific corrective action with target values",
      "codeBasis": "exact code language or formula referenced"
    }
  ],
  "checklist": {
    "loadCombinations": "PASS|FAIL|CANNOT VERIFY",
    "seismicDesign": "PASS|FAIL|CANNOT VERIFY",
    "windLoad": "PASS|FAIL|CANNOT VERIFY",
    "concreteDesign": "PASS|FAIL|CANNOT VERIFY",
    "steelDesign": "PASS|FAIL|CANNOT VERIFY|NOT APPLICABLE",
    "foundationDesign": "PASS|FAIL|CANNOT VERIFY",
    "beamColumnDetailing": "PASS|FAIL|CANNOT VERIFY",
    "slabDesign": "PASS|FAIL|CANNOT VERIFY",
    "connectionDesign": "PASS|FAIL|CANNOT VERIFY|NOT APPLICABLE",
    "materialSpecs": "PASS|FAIL|CANNOT VERIFY"
  }
}`;

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

// Philippine standard deformed bar sizes (ASTM A615 / PNS 49)
const PH_BAR_SIZES = [
  { dia:10, area:78.54,  label:"10mm",  weight:0.617 },
  { dia:12, area:113.10, label:"12mm",  weight:0.888 },
  { dia:16, area:201.06, label:"16mm",  weight:1.578 },
  { dia:20, area:314.16, label:"20mm",  weight:2.466 },
  { dia:25, area:490.87, label:"25mm",  weight:3.853 },
  { dia:28, area:615.75, label:"28mm",  weight:4.834 },
  { dia:32, area:804.25, label:"32mm",  weight:6.313 },
  { dia:36, area:1017.9, label:"36mm",  weight:7.990 },
];

// Pick the optimal bar: fewest bars that meet As_req with standard sizes, min 2 bars
const selectBars = (As_req, sectionWidth) => {
  // Try each bar size, pick smallest dia where n_bars is practical
  for (const bar of PH_BAR_SIZES) {
    const n = Math.ceil(As_req / bar.area);
    if (n < 2) continue;
    // Check spacing: width - 2*cover(40) - 2*stirrup(10) - n*dia >= (n-1)*25mm min clear
    const clearSpace = (sectionWidth - 80 - 20 - n*bar.dia);
    if (n <= 2 || clearSpace >= (n-1)*25) {
      return { bar, n: Math.max(n,2), As_prov: Math.max(n,2)*bar.area };
    }
  }
  // Fallback: largest bar
  const bar = PH_BAR_SIZES[PH_BAR_SIZES.length-1];
  const n = Math.ceil(As_req/bar.area);
  return { bar, n: Math.max(n,2), As_prov: Math.max(n,2)*bar.area };
};

// For slabs/footings: select bar size for given As_req per meter width, return spacing
const selectSlabBars = (As_req_per_m) => {
  for (const bar of PH_BAR_SIZES) {
    const spacing = Math.floor((bar.area / As_req_per_m) * 1000 / 25) * 25; // round down to 25mm
    if (spacing >= 150 && spacing <= 300) {
      return { bar, spacing: Math.min(spacing, 300), As_prov: bar.area / spacing * 1000 };
    }
  }
  // Dense: use 10mm @ 150
  const bar = PH_BAR_SIZES[0];
  return { bar, spacing:150, As_prov: bar.area/0.150 };
};

// Stirrup recommendation based on Vs_req
const selectStirrups = (Vs_req, b, d, fy, fc) => {
  if (Vs_req <= 0) return { dia:10, spacing: Math.min(d/2, 300), note:"Min. stirrups (Av_min)" };
  const Av_req = Vs_req*1000 / (fy * d/1000 * 0.85); // mm² per mm length → for two legs
  const s_for_10 = 2*78.54 / Av_req;
  const s_for_12 = 2*113.1 / Av_req;
  if (s_for_10 >= 75)  return { dia:10, spacing: Math.max(Math.min(Math.floor(s_for_10/25)*25, Math.floor(d/2/25)*25, 300), 75), note:"" };
  if (s_for_12 >= 75)  return { dia:12, spacing: Math.max(Math.min(Math.floor(s_for_12/25)*25, Math.floor(d/2/25)*25, 300), 75), note:"" };
  return { dia:12, spacing:75, note:"High shear — verify with full design" };
};


// ─── STRUCTICODE: AI PLAN CHECKER ────────────────────────────────────────────
// ── "From Plans" badge shown on pre-filled fields ────────────────────────────
const FromPlansBadge = () => (
  <span title="Value extracted from uploaded plans" style={{fontSize:9,background:"rgba(34,197,94,0.15)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.3)",padding:"1px 6px",borderRadius:4,fontWeight:700,marginLeft:6,verticalAlign:"middle"}}>FROM PLANS ✓</span>
);

export { validateExtractedData, NSCP_EXTRACTION_PROMPT, NSCP_SYSTEM_PROMPT, PH_SEISMIC_ZONES, SOIL_TYPES, OCCUPANCY_I, CONCRETE_GRADES, REBAR_GRADES, PH_BAR_SIZES, selectBars, selectSlabBars, selectStirrups, FromPlansBadge };
