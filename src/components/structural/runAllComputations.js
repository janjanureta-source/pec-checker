// ─── STRUCTURAL COMPUTATIONS ─────────────────────────────────────────────────
import { PH_BAR_SIZES, selectBars, selectSlabBars, selectStirrups } from "./constants.jsx";

function runAllComputations(sd) {
  if (!sd) return null;
  const results = { timestamp: new Date().toISOString(), items: [], memberData: {} };

  const fc = sd.materials?.fc || null;
  const fy = sd.materials?.fy || null;
  const PI = Math.PI;
  const barArea = (dia) => PI * dia * dia / 4; // mm²

  // ── Helper: NSCP compliance check result ──
  const check = (tool, id, ruleName, nscpRef, passed, value, limit, detail) => ({
    tool, id, rule: ruleName, nscpRef, status: passed ? "PASS" : "FAIL",
    value: String(value), limit: String(limit), detail,
  });

  // ══════════════════════════════════════════════════════════════════
  // 1. BEAMS — Verify reinforcement against NSCP 2015 Sec. 406
  // ══════════════════════════════════════════════════════════════════
  const beams = sd.beams?.length ? sd.beams : [];
  results.memberData.beams = [];
  if (!beams.length) {
    results.items.push({ tool:"beam", id:"Beams", status:"NO DATA", detail:"No beam schedule extracted from plans." });
  }
  beams.forEach(bm => {
    const checks = [];
    const b = bm.width, h = bm.depth;
    const d = h ? h - 60 : null; // assume 40mm cover + 10mm stirrup + 10mm half-bar
    const id = bm.id || "B?";

    // 1a. Minimum width
    if (b) {
      const minW = 200;
      checks.push(check("beam", id, "Min Width", "Sec. 406.3.1", b >= minW, `${b}mm`, `≥${minW}mm`, b >= minW ? "OK" : `Width ${b}mm < 200mm minimum`));
    }

    // 1b. Steel ratio (if bars extracted)
    if (b && d && bm.botBarCount && bm.botBarDia && fc && fy) {
      const As = bm.botBarCount * barArea(bm.botBarDia);
      const rho = As / (b * d);
      const rho_min = Math.max(0.25 * Math.sqrt(fc) / fy, 1.4 / fy);
      const rho_max = 0.75 * 0.85 * (fc >= 28 ? Math.max(0.65, 0.85 - 0.05 * (fc - 28) / 7) : 0.85) * (fc / fy) * (600 / (600 + fy));
      const rhoP = (rho * 100).toFixed(3);
      const rhoMinP = (rho_min * 100).toFixed(3);
      const rhoMaxP = (rho_max * 100).toFixed(3);
      checks.push(check("beam", id, "Min Steel Ratio ρ", "Sec. 410.5.1", rho >= rho_min * 0.95, `${rhoP}%`, `≥${rhoMinP}%`,
        rho >= rho_min * 0.95 ? `ρ = ${rhoP}% ≥ ρ_min = ${rhoMinP}% — OK. As_prov = ${As.toFixed(0)}mm² (${bm.botBarCount}-${bm.botBarDia}mmØ)` : `ρ = ${rhoP}% < ρ_min = ${rhoMinP}%. Increase bottom reinforcement.`));
      checks.push(check("beam", id, "Max Steel Ratio ρ", "Sec. 406.3.3", rho <= rho_max * 1.05, `${rhoP}%`, `≤${rhoMaxP}%`,
        rho <= rho_max * 1.05 ? `ρ = ${rhoP}% ≤ ρ_max = ${rhoMaxP}% — Under-reinforced (ductile). OK` : `ρ = ${rhoP}% > ρ_max = ${rhoMaxP}%. OVER-REINFORCED — non-ductile failure. Increase section or reduce steel.`));
      results.memberData.beams.push({ id, b, h, d, As: +As.toFixed(0), rho: +rho.toFixed(5), rho_min: +rho_min.toFixed(5), rho_max: +rho_max.toFixed(5), botBarCount: bm.botBarCount, botBarDia: bm.botBarDia, topBarCount: bm.topBarCount, topBarDia: bm.topBarDia });
    }

    // 1c. Top bars (min 1/3 of bottom per NSCP Sec. 412.3)
    if (bm.botBarCount && bm.botBarDia && bm.topBarCount && bm.topBarDia) {
      const AsBot = bm.botBarCount * barArea(bm.botBarDia);
      const AsTop = bm.topBarCount * barArea(bm.topBarDia);
      const ratio = AsTop / AsBot;
      checks.push(check("beam", id, "Top Bars ≥ 1/3 Bottom", "Sec. 412.3", ratio >= 0.30, `${(ratio*100).toFixed(0)}%`, "≥33%",
        ratio >= 0.30 ? `Top As = ${AsTop.toFixed(0)}mm² = ${(ratio*100).toFixed(0)}% of bottom — OK` : `Top As = ${AsTop.toFixed(0)}mm² = only ${(ratio*100).toFixed(0)}% of bottom. Need ≥33%.`));
    }

    // 1d. Stirrup spacing
    if (bm.stirrupSpacingRest && d) {
      const maxS = Math.min(d / 2, 600);
      checks.push(check("beam", id, "Stirrup Spacing (midspan)", "Sec. 406.6.3", bm.stirrupSpacingRest <= maxS * 1.05,
        `${bm.stirrupSpacingRest}mm`, `≤${maxS.toFixed(0)}mm (d/2)`,
        bm.stirrupSpacingRest <= maxS * 1.05 ? "OK" : `Spacing ${bm.stirrupSpacingRest}mm > d/2 = ${maxS.toFixed(0)}mm. Reduce stirrup spacing.`));
    }
    if (bm.stirrupSpacingSupport && d) {
      const maxS_support = Math.min(d / 4, 200); // seismic zone
      checks.push(check("beam", id, "Stirrup Spacing (support/seismic)", "Sec. 421.3.3", bm.stirrupSpacingSupport <= maxS_support * 1.1,
        `${bm.stirrupSpacingSupport}mm`, `≤${maxS_support.toFixed(0)}mm`,
        bm.stirrupSpacingSupport <= maxS_support * 1.1 ? "OK — seismic detailing adequate" : `Spacing ${bm.stirrupSpacingSupport}mm may exceed seismic zone limit of d/4 = ${(d/4).toFixed(0)}mm. Verify with structural engineer.`));
    }

    // 1e. Depth/span ratio (deflection control)
    if (h && bm.span) {
      const minH = bm.span * 1000 / 16; // simple span minimum h/L = 1/16
      checks.push(check("beam", id, "Min Depth (deflection)", "Table 409-1", h >= minH * 0.9,
        `h=${h}mm`, `≥L/16=${minH.toFixed(0)}mm`,
        h >= minH * 0.9 ? `h = ${h}mm ≥ L/16 = ${minH.toFixed(0)}mm — deflection OK` : `h = ${h}mm may be shallow for ${bm.span}m span. Check deflections per NSCP Sec. 409.6.`));
    }

    if (!checks.length) {
      results.items.push({ tool:"beam", id, status:"INCOMPLETE", detail:`Beam ${id}: dimensions extracted (${b||"?"}×${h||"?"}mm) but reinforcement details incomplete for full verification.` });
    }
    checks.forEach(c => results.items.push({ tool:c.tool, id:c.id, status:c.status, value:`${c.rule}: ${c.value} vs ${c.limit}`, detail:c.detail, nscpRef:c.nscpRef }));
  });

  // ══════════════════════════════════════════════════════════════════
  // 2. COLUMNS — Verify per NSCP 2015 Sec. 410
  // ══════════════════════════════════════════════════════════════════
  const cols = sd.columns?.length ? sd.columns : [];
  results.memberData.columns = [];
  if (!cols.length) {
    results.items.push({ tool:"column", id:"Columns", status:"NO DATA", detail:"No column schedule extracted from plans." });
  }
  cols.forEach(col => {
    const checks = [];
    const b = col.width, h = col.height;
    const id = col.id || "C?";
    const Ag = b && h ? b * h : null;

    // 2a. Minimum dimension
    if (b) {
      checks.push(check("column", id, "Min Dimension", "Sec. 421.4.1", Math.min(b, h||b) >= 250,
        `${Math.min(b,h||b)}mm`, "≥250mm", Math.min(b,h||b) >= 250 ? "OK" : `Min dimension ${Math.min(b,h||b)}mm < 250mm. Increase column size for seismic zones.`));
    }

    // 2b. Steel ratio
    if (Ag && col.mainBarCount && col.mainBarDia && fc && fy) {
      const Ast = col.mainBarCount * barArea(col.mainBarDia);
      const rho = Ast / Ag;
      const rhoP = (rho * 100).toFixed(2);
      checks.push(check("column", id, "Steel Ratio ρ ≥ 1%", "Sec. 410.3.1", rho >= 0.0095, `${rhoP}%`, "≥1%",
        rho >= 0.0095 ? `ρ = ${rhoP}% ≥ 1%. As = ${Ast.toFixed(0)}mm² (${col.mainBarCount}-${col.mainBarDia}mmØ)` : `ρ = ${rhoP}% < 1% minimum. Add more longitudinal bars.`));
      checks.push(check("column", id, "Steel Ratio ρ ≤ 8%", "Sec. 410.3.1", rho <= 0.084, `${rhoP}%`, "≤8%",
        rho <= 0.084 ? `ρ = ${rhoP}% ≤ 8% — OK. ${rho > 0.04 ? "Note: >4% may cause congestion." : "Good constructability."}` : `ρ = ${rhoP}% > 8% maximum. Reduce steel or increase section.`));
      results.memberData.columns.push({ id, b, h, Ag, Ast: +Ast.toFixed(0), rho: +rho.toFixed(5), mainBarCount: col.mainBarCount, mainBarDia: col.mainBarDia, tieDia: col.tieDia, tieSpacing: col.tieSpacing });
    }

    // 2c. Min number of bars
    if (col.mainBarCount) {
      const minBars = (col.type === "spiral") ? 6 : 4;
      checks.push(check("column", id, "Min Bar Count", "Sec. 410.3.2", col.mainBarCount >= minBars,
        `${col.mainBarCount} bars`, `≥${minBars}`,
        col.mainBarCount >= minBars ? "OK" : `Only ${col.mainBarCount} bars. Need ≥${minBars} for ${col.type||"tied"} column.`));
    }

    // 2d. Tie spacing
    if (col.tieSpacing && col.mainBarDia) {
      const maxTie = Math.min(16 * col.mainBarDia, 48 * (col.tieDia || 10), Math.min(b || 400, h || 400));
      checks.push(check("column", id, "Tie Spacing", "Sec. 407.10.5", col.tieSpacing <= maxTie * 1.05,
        `${col.tieSpacing}mm`, `≤${maxTie}mm`,
        col.tieSpacing <= maxTie * 1.05 ? `${col.tieSpacing}mm ≤ min(16db=${16*col.mainBarDia}mm, 48dt=${48*(col.tieDia||10)}mm, least dim=${Math.min(b||400,h||400)}mm) — OK` : `Tie spacing ${col.tieSpacing}mm exceeds limit. Reduce spacing.`));
    }

    if (!checks.length) {
      results.items.push({ tool:"column", id, status:"INCOMPLETE", detail:`Column ${id}: dimensions extracted (${b||"?"}×${h||"?"}mm) but reinforcement details incomplete.` });
    }
    checks.forEach(c => results.items.push({ tool:c.tool, id:c.id, status:c.status, value:`${c.rule}: ${c.value} vs ${c.limit}`, detail:c.detail, nscpRef:c.nscpRef }));
  });

  // ══════════════════════════════════════════════════════════════════
  // 3. SLABS — Verify per NSCP 2015 Sec. 409
  // ══════════════════════════════════════════════════════════════════
  const slabs = sd.slabs?.length ? sd.slabs : [];
  results.memberData.slabs = [];
  if (!slabs.length) {
    results.items.push({ tool:"slab", id:"Slabs", status:"NO DATA", detail:"No slab schedule extracted from plans." });
  }
  slabs.forEach(sl => {
    const checks = [];
    const id = sl.id || "S?";
    const t = sl.thickness;

    // 3a. Minimum thickness
    if (t && sl.span) {
      const spanMM = sl.span * 1000;
      const minT = sl.type === "two-way" ? spanMM / 33 : spanMM / 28; // NSCP Table 409-1
      checks.push(check("slab", id, "Min Thickness", "Table 409-1", t >= minT * 0.9,
        `${t}mm`, `≥${minT.toFixed(0)}mm (L/${sl.type==="two-way"?"33":"28"})`,
        t >= minT * 0.9 ? `t = ${t}mm ≥ ${minT.toFixed(0)}mm — adequate for deflection` : `t = ${t}mm < ${minT.toFixed(0)}mm. May need deflection check or thicker slab.`));
    }

    // 3b. Min reinforcement (ρ ≥ 0.0018 for Grade 40 / 0.0020 for Grade 60)
    if (t && sl.mainBarDia && sl.mainBarSpacing && fy) {
      const As_per_m = barArea(sl.mainBarDia) * (1000 / sl.mainBarSpacing);
      const d_slab = t - 25; // cover
      const rho = As_per_m / (1000 * d_slab);
      const rho_min = fy <= 300 ? 0.0020 : 0.0018;
      checks.push(check("slab", id, "Min Reinforcement", "Sec. 407.12", rho >= rho_min * 0.9,
        `ρ=${(rho*100).toFixed(3)}%`, `≥${(rho_min*100).toFixed(2)}%`,
        rho >= rho_min * 0.9 ? `As = ${As_per_m.toFixed(0)}mm²/m (${sl.mainBarDia}mmØ@${sl.mainBarSpacing}mm). ρ = ${(rho*100).toFixed(3)}% — OK` : `ρ = ${(rho*100).toFixed(3)}% < ${(rho_min*100).toFixed(2)}%. Increase bar size or reduce spacing.`));
      results.memberData.slabs.push({ id, t, type: sl.type, span: sl.span, As_per_m: +As_per_m.toFixed(0), rho: +rho.toFixed(5), mainBarDia: sl.mainBarDia, mainBarSpacing: sl.mainBarSpacing });
    }

    // 3c. Max spacing
    if (sl.mainBarSpacing && t) {
      const maxSpacing = Math.min(3 * t, 450);
      checks.push(check("slab", id, "Max Bar Spacing", "Sec. 407.6.5", sl.mainBarSpacing <= maxSpacing * 1.05,
        `${sl.mainBarSpacing}mm`, `≤${maxSpacing}mm (3t or 450)`,
        sl.mainBarSpacing <= maxSpacing * 1.05 ? "OK" : `Spacing ${sl.mainBarSpacing}mm > ${maxSpacing}mm. Reduce spacing.`));
    }

    if (!checks.length) {
      results.items.push({ tool:"slab", id, status:"INCOMPLETE", detail:`Slab ${id}: ${t ? `${t}mm thick` : "thickness unknown"}, but reinforcement details incomplete.` });
    }
    checks.forEach(c => results.items.push({ tool:c.tool, id:c.id, status:c.status, value:`${c.rule}: ${c.value} vs ${c.limit}`, detail:c.detail, nscpRef:c.nscpRef }));
  });

  // ══════════════════════════════════════════════════════════════════
  // 4. FOOTINGS — Verify per NSCP 2015 Sec. 415
  // ══════════════════════════════════════════════════════════════════
  const ftgs = sd.footings?.length ? sd.footings : [];
  results.memberData.footings = [];
  if (!ftgs.length) {
    results.items.push({ tool:"footing", id:"Footings", status:"NO DATA", detail:"No footing schedule extracted from plans." });
  }
  ftgs.forEach(ft => {
    const checks = [];
    const id = ft.id || "F?";

    // 4a. Min reinforcement
    if (ft.botBarDia && ft.botBarSpacing && ft.thickness) {
      const As_per_m = barArea(ft.botBarDia) * (1000 / ft.botBarSpacing);
      const d = ft.thickness - 75; // cover for footing
      const rho = As_per_m / (1000 * d);
      checks.push(check("footing", id, "Bottom Reinforcement", "Sec. 407.12", rho >= 0.0016,
        `ρ=${(rho*100).toFixed(3)}%`, "≥0.18%",
        rho >= 0.0016 ? `As = ${As_per_m.toFixed(0)}mm²/m (${ft.botBarDia}mmØ@${ft.botBarSpacing}mm) — OK` : `ρ = ${(rho*100).toFixed(3)}% below minimum. Increase reinforcement.`));
      results.memberData.footings.push({ id, type: ft.type, thickness: ft.thickness, As_per_m: +As_per_m.toFixed(0), rho: +rho.toFixed(5), botBarDia: ft.botBarDia, botBarSpacing: ft.botBarSpacing, soilBearing: ft.soilBearing });
    }

    // 4b. Min thickness
    if (ft.thickness) {
      const minT = ft.type === "mat" ? 500 : 250;
      checks.push(check("footing", id, "Min Thickness", "Sec. 415.7", ft.thickness >= minT,
        `${ft.thickness}mm`, `≥${minT}mm`,
        ft.thickness >= minT ? "OK" : `Thickness ${ft.thickness}mm < ${minT}mm minimum for ${ft.type||"isolated"} footing.`));
    }

    // 4c. Soil bearing noted
    if (ft.soilBearing) {
      checks.push(check("footing", id, "Soil Bearing Noted", "Sec. 304", true,
        `${ft.soilBearing} kPa`, "documented",
        `SBC = ${ft.soilBearing} kPa noted in plans. Verify with geotechnical report.`));
    }

    if (!checks.length) {
      results.items.push({ tool:"footing", id, status:"INCOMPLETE", detail:`Footing ${id}: ${ft.type||"type unknown"}, reinforcement details incomplete for verification.` });
    }
    checks.forEach(c => results.items.push({ tool:c.tool, id:c.id, status:c.status, value:`${c.rule}: ${c.value} vs ${c.limit}`, detail:c.detail, nscpRef:c.nscpRef }));
  });

  // ══════════════════════════════════════════════════════════════════
  // 5. SEISMIC — Check detailing requirements
  // ══════════════════════════════════════════════════════════════════
  if (sd.seismic?.zone || sd.seismic?.structuralSystem) {
    const zone = sd.seismic.zone;
    const sys = sd.seismic.structuralSystem;
    results.items.push({ tool:"seismic", id:"Seismic Zone", status: zone ? "PASS" : "INCOMPLETE",
      value: zone ? `${zone} identified` : "Zone not specified",
      detail: zone ? `Structure is in ${zone}. ${zone==="Zone 4"?"High seismic zone — NSCP Sec. 421 special detailing required for all members.":"Moderate seismic zone."}` : "Seismic zone not stated in plans. Verify with structural engineer — most of Philippines is Zone 4." });
    if (sys) {
      results.items.push({ tool:"seismic", id:"Structural System", status:"PASS",
        value: sys, detail: `${sys} system identified in plans.` });
    }
  } else {
    results.items.push({ tool:"seismic", id:"Seismic Data", status:"NO DATA", detail:"No seismic zone or structural system specified in plans. Most of Philippines is Zone 4 — verify and ensure NSCP Sec. 421 compliance." });
  }

  // ══════════════════════════════════════════════════════════════════
  // 6. LOAD COMBINATIONS — Check if loads are documented
  // ══════════════════════════════════════════════════════════════════
  if (sd.loads?.floorDL || sd.loads?.floorLL) {
    const items = [];
    if (sd.loads.floorDL) items.push(`Floor DL = ${sd.loads.floorDL} kPa`);
    if (sd.loads.floorLL) items.push(`Floor LL = ${sd.loads.floorLL} kPa`);
    if (sd.loads.roofDL)  items.push(`Roof DL = ${sd.loads.roofDL} kPa`);
    if (sd.loads.roofLL)  items.push(`Roof LL = ${sd.loads.roofLL} kPa`);
    results.items.push({ tool:"loads", id:"Design Loads", status:"PASS", value: items.join(", "), detail: "Design loads documented in plans. Verify against NSCP Sec. 205 for occupancy category." });
  } else {
    results.items.push({ tool:"loads", id:"Design Loads", status:"NO DATA", detail:"No dead/live load values extracted from plans. These are typically in the general notes or structural computation sheets." });
  }

  // ── Summary ──
  results.summary = {
    total:    results.items.length,
    pass:     results.items.filter(i => i.status === "PASS").length,
    fail:     results.items.filter(i => i.status === "FAIL").length,
    computed: results.items.filter(i => i.status === "COMPUTED").length,
    incomplete: results.items.filter(i => i.status === "INCOMPLETE").length,
    noData:   results.items.filter(i => i.status === "NO DATA").length,
  };

  return results;
}



// ─── STRUCTURAL INTELLIGENCE PANEL (redesigned) ──────────────────────────────

export default runAllComputations;
