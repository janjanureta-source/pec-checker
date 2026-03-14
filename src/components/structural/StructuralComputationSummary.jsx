import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { selectBars, selectSlabBars, selectStirrups, PH_BAR_SIZES } from "./constants.jsx";
import { Card, Label } from "../../theme.jsx";

function StructuralComputationSummary({ results, data, onNavigate }) {
  if (!results) return null;

  const statusColor = { PASS:"#22c55e", FAIL:"#ef4444", INCOMPLETE:"#f59e0b", "NO DATA":"#64748b", COMPUTED:"#0696d7", ERROR:"#f59e0b", "CANNOT VERIFY":"#f59e0b" };
  const statusBg    = { PASS:"rgba(34,197,94,0.1)", FAIL:"rgba(239,68,68,0.1)", INCOMPLETE:"rgba(245,158,11,0.1)", "NO DATA":"rgba(100,116,139,0.1)", COMPUTED:"rgba(6,150,215,0.1)", ERROR:"rgba(245,158,11,0.1)", "CANNOT VERIFY":"rgba(245,158,11,0.1)" };
  const toolLabel   = { seismic:"Seismic", beam:"Beam", column:"Column", footing:"Footing", slab:"Slab", loads:"Load Combos" };

  const fc  = data?.materials?.fc || "—";
  const fy  = data?.materials?.fy || "—";
  const projName = data?.building?.name || "Structural Project";
  const md  = results.memberData || {};

  const exportFullReport = () => {
    try {
    if (!results || !results.items || !results.summary) return;
    // Safe fallbacks for any missing fields (e.g. stale localStorage)
    const summary = {
      pass:     results.summary.pass     ?? 0,
      fail:     results.summary.fail     ?? 0,
      computed: results.summary.computed ?? 0,
      total:    results.summary.total    ?? results.items.length,
    };
    const date = new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});

    // ── member rows
    const memberRows = results.items.map(item=>`
      <tr>
        <td><b>${toolLabel[item.tool]||item.tool}</b></td>
        <td style="font-family:monospace;font-weight:700">${item.id}</td>
        <td style="font-family:monospace">${item.value||"—"}</td>
        <td style="font-size:11px;color:#64748b">${item.detail||"—"}</td>
        <td style="color:${statusColor[item.status]||"#64748b"};font-weight:800;text-align:center">${item.status}</td>
      </tr>`).join("");

    // ── load combos
    const combosHtml = (results.loadCombos||[]).map(c=>
      `<tr><td>${c.name}</td><td style="font-weight:700;font-family:monospace">${c.val} kN/m²</td></tr>`
    ).join("");

    // ── rebar schedule tables (safe Number() wrappers prevent toFixed crashes on undefined)
    const beamRows = (md.beams||[]).map(bm=>{
      const As_req = Number(bm.As_req)||0;
      const Vs_req = Number(bm.Vs_req)||0;
      const mainBar = selectBars(As_req||1, bm.b||200);
      const stirrup = selectStirrups(Vs_req, bm.b||200, bm.d||300, Number(fy)||414, Number(fc)||27.6);
      return `<tr>
        <td><b>${bm.id||"—"}</b></td><td>${bm.b||"—"}×${bm.d||"—"}</td><td>${bm.span||"—"}</td>
        <td>${As_req.toFixed(0)}</td>
        <td style="color:#0284c7;font-weight:700">${mainBar.n}-Ø${mainBar.bar.dia}</td>
        <td>${mainBar.As_prov.toFixed(0)}</td>
        <td>Ø${stirrup.dia}@${stirrup.spacing}mm</td>
        <td style="color:${bm.status==="PASS"?"#16a34a":"#dc2626"};font-weight:700">${bm.status||"—"}</td>
      </tr>`;
    }).join("");

    const colRows = (md.columns||[]).map(col=>{
      const Ast_req = Number(col.Ast_req)||0;
      const rho_req = Number(col.rho_req)||0;
      const mainBar = selectBars(Ast_req||1, Math.min(col.b||300,col.h||300));
      const tieSpacing = Math.floor(Math.min(16*mainBar.bar.dia, 480, Math.min(col.b||300,col.h||300))/25)*25;
      return `<tr>
        <td><b>${col.id||"—"}</b></td><td>${col.b||"—"}×${col.h||"—"}</td><td>${col.type==="spiral"?"Spiral":"Tied"}</td>
        <td>${Ast_req.toFixed(0)}</td>
        <td style="color:#0284c7;font-weight:700">${mainBar.n}-Ø${mainBar.bar.dia}</td>
        <td>${mainBar.As_prov.toFixed(0)}</td>
        <td>Ø10@${tieSpacing}mm</td>
        <td>${(rho_req*100).toFixed(2)}%</td>
        <td style="color:${col.status==="PASS"?"#16a34a":"#dc2626"};font-weight:700">${col.status||"—"}</td>
      </tr>`;
    }).join("");

    const ftRows = (md.footings||[]).map(ft=>{
      const ftB = Number(ft.B)||0;
      const ftD = Number(ft.d)||0;
      const ftAs = Number(ft.As)||0;
      const bar = selectSlabBars((ftB > 0 ? ftAs/ftB : 0)||1);
      return `<tr>
        <td><b>${ft.id||"—"}</b></td><td>${ftB.toFixed(2)}×${ftB.toFixed(2)}m</td>
        <td>${ftD.toFixed(0)}</td><td>${ft.qa||"—"}</td>
        <td>${(ftB > 0 ? ftAs/ftB : 0).toFixed(0)}</td>
        <td style="color:#0284c7;font-weight:700">Ø${bar.bar.dia}@${bar.spacing}mm (EW)</td>
      </tr>`;
    }).join("");

    const slabRows = (md.slabs||[]).map(sl=>{
      const slAs = Number(sl.As)||0;
      const slWu = Number(sl.wu)||0;
      const slMu = Number(sl.Mu)||0;
      const bar = selectSlabBars(slAs||1);
      const tmp = selectSlabBars(slAs*0.0018/(sl.rho_use||0.002)||1);
      return `<tr>
        <td><b>${sl.id||"—"}</b></td><td>${sl.L||"—"}m</td><td>${sl.h||"—"}mm</td>
        <td>${slWu.toFixed(2)}</td><td>${slMu.toFixed(1)}</td>
        <td>${slAs.toFixed(0)}</td>
        <td style="color:#0284c7;font-weight:700">Ø${bar.bar.dia}@${bar.spacing}mm</td>
        <td>Ø${tmp.bar.dia}@${tmp.spacing}mm</td>
      </tr>`;
    }).join("");

    const seismic = results.seismic || {};

    const html = `<!DOCTYPE html><html><head>
      <title>Structural Summary Report — ${projName}</title>
      <style>
        *{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;padding:0;font-size:12px;color:#1e293b}
        .cover{background:linear-gradient(135deg,#0f1624,#0a1628);color:#fff;padding:50px;min-height:200px;page-break-after:always}
        .cover h1{font-size:28px;font-weight:900;color:#0696d7;margin:0 0 8px;letter-spacing:-0.5px}
        .cover p{margin:4px 0;color:#94a3b8;font-size:12px}
        .badge{display:inline-block;background:rgba(6,150,215,0.25);color:#60c6f7;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;margin-top:8px}
        .content{padding:30px 50px}
        h2{font-size:15px;font-weight:800;color:#0f172a;border-bottom:3px solid #0696d7;padding-bottom:6px;margin:28px 0 12px}
        h3{font-size:12px;font-weight:700;color:#334155;margin:14px 0 6px;text-transform:uppercase;letter-spacing:.5px}
        table{border-collapse:collapse;width:100%;margin-bottom:12px;font-size:11px}
        th{background:#1e293b;color:#e2e8f0;padding:7px 9px;text-align:left;font-weight:700;font-size:11px}
        td{border:1px solid #e2e8f0;padding:6px 9px;vertical-align:middle}
        tr:nth-child(even) td{background:#f8fafc}
        .kpi{display:flex;gap:16px;margin:12px 0;flex-wrap:wrap}
        .kpi-card{background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px 18px;min-width:120px;text-align:center}
        .kpi-val{font-size:26px;font-weight:900;color:#0284c7}
        .kpi-lbl{font-size:10px;color:#64748b;margin-top:2px;text-transform:uppercase;letter-spacing:.5px}
        .kpi-pass .kpi-val{color:#16a34a}.kpi-fail .kpi-val{color:#dc2626}.kpi-comp .kpi-val{color:#0284c7}
        .nscp{background:#f0f9ff;border-left:3px solid #0696d7;padding:8px 12px;font-size:11px;color:#0369a1;margin:8px 0;border-radius:0 4px 4px 0}
        .warn{background:#fff7ed;border-left:3px solid #f59e0b;padding:8px 12px;font-size:11px;color:#92400e;margin:8px 0;border-radius:0 4px 4px 0}
        .footer{margin-top:40px;padding:18px 50px;background:#f1f5f9;border-top:2px solid #e2e8f0;font-size:10px;color:#94a3b8;line-height:1.6}
        .sig-block{display:flex;gap:40px;margin-top:30px}
        .sig{border-top:1px solid #94a3b8;padding-top:8px;min-width:200px;font-size:11px;color:#64748b}
        @media print{.no-print{display:none}@page{margin:15mm 20mm;size:A4 portrait}}
      </style>
    </head><body>

    <div class="cover">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:10px;color:#64748b;letter-spacing:2px;margin-bottom:10px">BUILDIFY · STRUCTURAL MODULE</div>
          <h1>Structural Summary Report</h1>
          <p style="font-size:15px;color:#e2e8f0;font-weight:600;margin:4px 0 16px">${projName}</p>
          <div>
            <span class="badge">NSCP 2015</span>
            <span class="badge">f'c = ${fc} MPa</span>
            <span class="badge">fy = ${fy} MPa</span>
            ${seismic.zone ? `<span class="badge">${seismic.zone}</span>` : ""}
            ${data?.building?.floors ? `<span class="badge">${data.building.floors} Floors</span>` : ""}
          </div>
        </div>
        <div style="text-align:right;color:#64748b;font-size:11px">
          <div style="font-size:12px;color:#94a3b8">${date}</div>
          <div style="margin-top:4px">Prepared by: Buildify</div>
          <div style="margin-top:16px;color:#ef4444;font-size:10px;font-weight:700;border:1px solid #ef4444;padding:4px 8px;border-radius:4px">PRELIMINARY — NOT FOR CONSTRUCTION</div>
        </div>
      </div>
    </div>

    <div class="content">

      <!-- SUMMARY SCORECARD -->
      <h2>1. Computation Summary</h2>
      <div class="kpi">
        <div class="kpi-card kpi-pass"><div class="kpi-val">${summary.pass}</div><div class="kpi-lbl">PASS</div></div>
        <div class="kpi-card kpi-fail"><div class="kpi-val">${summary.fail}</div><div class="kpi-lbl">FAIL</div></div>
        <div class="kpi-card kpi-comp"><div class="kpi-val">${summary.computed}</div><div class="kpi-lbl">COMPUTED</div></div>
        <div class="kpi-card"><div class="kpi-val">${summary.total}</div><div class="kpi-lbl">TOTAL CHECKS</div></div>
      </div>
      <table><thead><tr><th>Category</th><th>Member ID</th><th>Result</th><th>Detail</th><th style="text-align:center">Status</th></tr></thead><tbody>
        ${memberRows}
      </tbody></table>

      <!-- SEISMIC -->
      ${seismic.V ? `
      <h2>2. Seismic Design (NSCP 2015 Sec. 208)</h2>
      <div class="nscp">Method: Equivalent Static Force Procedure · NSCP 2015 Section 208</div>
      <table><thead><tr><th>Parameter</th><th>Value</th><th>Parameter</th><th>Value</th></tr></thead><tbody>
        <tr><td>Seismic Zone</td><td><b>${seismic.zone}</b></td><td>Seismic Weight W</td><td><b>${seismic.W} kN</b></td></tr>
        <tr><td>Soil Type</td><td>${seismic.soil||"—"}</td><td>Base Shear V</td><td><b style="color:#0284c7">${seismic.V} kN</b></td></tr>
        <tr><td>Occupancy Category</td><td>${seismic.occ||"—"}</td><td>Seismic Coefficient Cs</td><td>${seismic.Cs}%</td></tr>
        <tr><td>I (Importance Factor)</td><td>${seismic.I||"—"}</td><td>R (Response Factor)</td><td>${seismic.R||"—"}</td></tr>
        <tr><td>Ca</td><td>${seismic.Ca?.toFixed(4)||"—"}</td><td>Cv</td><td>${seismic.Cv?.toFixed(4)||"—"}</td></tr>
      </tbody></table>` : ""}

      <!-- LOAD COMBINATIONS -->
      ${combosHtml ? `
      <h2>3. Load Combinations (NSCP 2015 Sec. 203)</h2>
      <div class="nscp">Per NSCP 2015 Section 203 — factored load combinations for RC design</div>
      <table style="max-width:400px"><thead><tr><th>Combination</th><th>Value (kN/m²)</th></tr></thead><tbody>
        ${combosHtml}
      </tbody></table>` : ""}

      <!-- BEAM SCHEDULE -->
      ${beamRows ? `
      <h2>4. Beam Rebar Schedule (NSCP 2015 Sec. 406)</h2>
      <div class="nscp">Cover = 40mm · Stirrups: deformed bars · Spacing per NSCP Sec. 406.4</div>
      <table><thead><tr><th>Mark</th><th>b×d (mm)</th><th>Span (m)</th><th>As req (mm²)</th><th>Bottom Bars</th><th>As prov (mm²)</th><th>Stirrups</th><th style="text-align:center">Status</th></tr></thead><tbody>
        ${beamRows}
      </tbody></table>
      <div class="warn">Top bars: provide min. 2-Ø10 or as required by moment diagram. Verify development lengths per Sec. 412.</div>` : ""}

      <!-- COLUMN SCHEDULE -->
      ${colRows ? `
      <h2>5. Column Rebar Schedule (NSCP 2015 Sec. 410)</h2>
      <div class="nscp">Short column, axial + bending · φ = 0.65 tied, 0.75 spiral · ρ: 1% to 8%</div>
      <table><thead><tr><th>Mark</th><th>b×h (mm)</th><th>Type</th><th>Ast req (mm²)</th><th>Long. Bars</th><th>As prov (mm²)</th><th>Ties</th><th>ρ (%)</th><th style="text-align:center">Status</th></tr></thead><tbody>
        ${colRows}
      </tbody></table>` : ""}

      <!-- FOOTING SCHEDULE -->
      ${ftRows ? `
      <h2>6. Footing Schedule (NSCP 2015 Sec. 415)</h2>
      <div class="nscp">Square isolated footing · ρ_min = 0.0018 · Bars placed EW (bottom mat)</div>
      <table><thead><tr><th>Mark</th><th>Plan Size</th><th>d (mm)</th><th>qa (kPa)</th><th>As req (mm²/m)</th><th>Bottom Bars (EW)</th></tr></thead><tbody>
        ${ftRows}
      </tbody></table>
      <div class="warn">Verify punching shear (two-way action) and wide-beam shear at d from column face. Dowel bars: min. 4-Ø of column bars.</div>` : ""}

      <!-- SLAB SCHEDULE -->
      ${slabRows ? `
      <h2>7. Slab Schedule (NSCP 2015 Sec. 409)</h2>
      <div class="nscp">One-way slab · ρ_temp = 0.0018 · Temperature bars perpendicular to span</div>
      <table><thead><tr><th>Mark</th><th>Span (m)</th><th>h (mm)</th><th>wu (kPa)</th><th>Mu (kN·m/m)</th><th>As req (mm²/m)</th><th>Main Bars</th><th>Temp. Bars</th></tr></thead><tbody>
        ${slabRows}
      </tbody></table>` : ""}

      <!-- SIGNATURE BLOCK -->
      <h2>8. Engineer's Certification</h2>
      <div class="warn">This report is generated by Buildify AI-assisted structural tools using simplified NSCP 2015 procedures. It is a <strong>PRELIMINARY DESIGN</strong> only. All computations, bar sizes, and spacings must be independently verified and signed and sealed by a licensed Professional Civil/Structural Engineer (PSCE) registered with PRC before being used in permit applications, contract documents, or construction.</div>
      <div class="sig-block">
        <div class="sig"><div style="margin-bottom:40px">Reviewed by:</div><div>________________________</div><div>Professional Civil/Structural Engineer</div><div>PRC License No.: ____________</div><div>Date: ______________________</div></div>
        <div class="sig"><div style="margin-bottom:40px">Noted by:</div><div>________________________</div><div>Project Owner / Representative</div><div>Date: ______________________</div></div>
      </div>

    </div>
    <div class="footer">
      <strong>⚠ PRELIMINARY — NOT FOR CONSTRUCTION.</strong> Buildify Structural Module · NSCP 2015 · Generated: ${date}<br/>
      Bar sizes per ASTM A615 / PNS 49. Methods: Equivalent Static Force (Sec. 208), USD flexure &amp; shear (Sec. 406, 410, 415, 409). All values require PSCE verification.
    </div>
    </body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.target   = "_blank";
    a.rel      = "noopener";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch(e) { console.error("Export Full Report error:", e); alert("Export failed: " + e.message); }
  };

  return (
    <div style={{background:"rgba(6,150,215,0.04)",border:"1.5px solid rgba(6,150,215,0.2)",borderRadius:14,padding:20,marginBottom:20,animation:"fadeIn 0.35s ease"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontWeight:800,fontSize:15,color:T.text}}>Structural Computation Package</div>
          <div style={{fontSize:11,color:T.muted,marginTop:2}}>NSCP 2015 · {new Date().toLocaleDateString("en-PH")} · {(data?.materials?.fc ? `f'c=${data.materials.fc}MPa · fy=${data.materials.fy}MPa` : "")}</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {[
              {label:`${results.summary.pass} PASS`, color:"#22c55e", bg:"rgba(34,197,94,0.1)"},
              {label:`${results.summary.fail} FAIL`, color:"#ef4444", bg:"rgba(239,68,68,0.1)"},
              {label:`${results.summary.computed} COMPUTED`, color:"#0696d7", bg:"rgba(6,150,215,0.1)"},
            ].map(s=>(
              <span key={s.label} style={{fontSize:11,fontWeight:700,color:s.color,background:s.bg,padding:"4px 10px",borderRadius:6}}>{s.label}</span>
            ))}
          </div>
          <button onClick={exportFullReport}
            style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",background:"linear-gradient(135deg,#0696d7,#0569a8)",border:"none",color:"#fff",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>
            <Icon name="download" size={13} color="#fff"/> Export Full Report
          </button>
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {results.items.map((item,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:statusBg[item.status]||T.dim,borderRadius:9,border:`1px solid ${statusColor[item.status]||T.border}33`}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:statusColor[item.status]||T.muted,flexShrink:0}}/>
            <div style={{width:80,flexShrink:0}}>
              <span style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase"}}>{toolLabel[item.tool]||item.tool}</span>
            </div>
            <div style={{width:70,flexShrink:0}}>
              <span style={{fontSize:12,fontWeight:700,color:T.text,fontFamily:"monospace"}}>{item.id}</span>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <span style={{fontSize:12,color:T.text,fontWeight:600}}>{item.value||"—"}</span>
              {item.detail && <span style={{fontSize:11,color:T.muted,marginLeft:8}}>{item.detail}</span>}
              {item.error  && <span style={{fontSize:11,color:"#f59e0b",marginLeft:8}}>⚠ {item.error}</span>}
            </div>
            <span style={{fontSize:11,fontWeight:800,color:statusColor[item.status],background:statusBg[item.status],padding:"3px 10px",borderRadius:5,flexShrink:0}}>{item.status}</span>
            {onNavigate && item.tool !== "loads" && (
              <button onClick={()=>onNavigate(item.tool)}
                style={{fontSize:10,color:"#0696d7",background:"rgba(6,150,215,0.1)",border:"1px solid rgba(6,150,215,0.25)",borderRadius:5,padding:"3px 10px",cursor:"pointer",fontWeight:700,flexShrink:0}}>Open →</button>
            )}
          </div>
        ))}
      </div>

      <div style={{marginTop:14,padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>
        ⚠️ All computations use simplified NSCP 2015 methods. Results are for preliminary design only. Full detailed analysis and stamping by a licensed PSCE is required before construction.
      </div>
    </div>
  );
}

export default StructuralComputationSummary;
