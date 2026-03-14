import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { selectBars, selectSlabBars, selectStirrups, PH_BAR_SIZES } from "./constants.jsx";
import { Card, Label } from "../../theme.jsx";

function RebarSchedule({ structuralData, structuralResults }) {
  const sd  = structuralData;
  const res = structuralResults;
  const [view, setView] = useState("beams"); // beams|columns|footings|slabs

  // Detect data format
  const hasOldFormat = res?.memberData?.beams?.[0]?.As_req !== undefined;

  // No data at all — show empty state
  if (!sd) {
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:60,gap:16,textAlign:"center"}}>
        <Icon name="report" size={48} color={T.muted}/>
        <div style={{fontSize:15,fontWeight:700,color:T.text}}>No Data Available</div>
        <div style={{fontSize:13,color:T.muted,maxWidth:340,lineHeight:1.7}}>
          Upload structural plans in <strong style={{color:"#0696d7"}}>AI Plan Checker</strong> first, then click <strong style={{color:"#0696d7"}}>Run All</strong> to generate the reinforcement schedule.
        </div>
      </div>
    );
  }

  // ── NEW FORMAT: Show extracted reinforcement from plans ──
  if (!hasOldFormat) {
    const allBeams = sd.beams || [];
    const allCols = sd.columns || [];
    const allFtgs = sd.footings || [];
    const allSlabs = sd.slabs || [];
    const tabs = [
      { key:"beams", label:"Beams", count:allBeams.length },
      { key:"columns", label:"Columns", count:allCols.length },
      { key:"footings", label:"Footings", count:allFtgs.length },
      { key:"slabs", label:"Slabs", count:allSlabs.length },
    ];
    return (
      <div>
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          {tabs.map(t=>(
            <button key={t.key} onClick={()=>setView(t.key)}
              style={{padding:"7px 14px",borderRadius:8,border:`1.5px solid ${view===t.key?"#0696d7":T.border}`,
                background:view===t.key?"rgba(6,150,215,0.12)":"transparent",
                color:view===t.key?"#0696d7":T.muted,cursor:"pointer",fontSize:12,fontWeight:700}}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>
        <div style={{fontSize:11,color:"#0696d7",marginBottom:12,padding:"8px 12px",background:"rgba(6,150,215,0.06)",borderRadius:8}}>
          Reinforcement extracted from plans. NSCP compliance checks are in the individual tool tabs above.
        </div>

        {view==="beams" && (allBeams.length ? (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {allBeams.map((bm,i)=>(
              <div key={i} style={{padding:"12px 16px",background:T.card,borderRadius:10,border:`1px solid ${T.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:14,fontWeight:800,color:T.text}}>{bm.id}</span>
                  <span style={{fontSize:11,color:T.muted}}>{bm.width}×{bm.depth}mm {bm.span?`· L=${bm.span}m`:""}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  <div style={{background:T.dim,borderRadius:6,padding:"8px 10px"}}><div style={{fontSize:9,color:T.muted,fontWeight:700,marginBottom:3}}>BOTTOM BARS</div><div style={{fontSize:12,fontWeight:700,color:T.text}}>{bm.botBarCount?`${bm.botBarCount}-${bm.botBarDia}mmØ`:"—"}</div></div>
                  <div style={{background:T.dim,borderRadius:6,padding:"8px 10px"}}><div style={{fontSize:9,color:T.muted,fontWeight:700,marginBottom:3}}>TOP BARS</div><div style={{fontSize:12,fontWeight:700,color:T.text}}>{bm.topBarCount?`${bm.topBarCount}-${bm.topBarDia}mmØ`:"—"}</div></div>
                  <div style={{background:T.dim,borderRadius:6,padding:"8px 10px"}}><div style={{fontSize:9,color:T.muted,fontWeight:700,marginBottom:3}}>STIRRUPS</div><div style={{fontSize:12,fontWeight:700,color:T.text}}>{bm.stirrupDia?`${bm.stirrupDia}mmØ @ ${bm.stirrupSpacingRest||"?"}mm`:"—"}</div></div>
                </div>
              </div>
            ))}
          </div>
        ) : <div style={{padding:20,textAlign:"center",color:T.muted}}>No beam data extracted from plans.</div>)}

        {view==="columns" && (allCols.length ? (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {allCols.map((col,i)=>(
              <div key={i} style={{padding:"12px 16px",background:T.card,borderRadius:10,border:`1px solid ${T.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:14,fontWeight:800,color:T.text}}>{col.id}</span>
                  <span style={{fontSize:11,color:T.muted}}>{col.width}×{col.height}mm · {col.type||"tied"}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div style={{background:T.dim,borderRadius:6,padding:"8px 10px"}}><div style={{fontSize:9,color:T.muted,fontWeight:700,marginBottom:3}}>MAIN BARS</div><div style={{fontSize:12,fontWeight:700,color:T.text}}>{col.mainBarCount?`${col.mainBarCount}-${col.mainBarDia}mmØ`:"—"}</div></div>
                  <div style={{background:T.dim,borderRadius:6,padding:"8px 10px"}}><div style={{fontSize:9,color:T.muted,fontWeight:700,marginBottom:3}}>TIES</div><div style={{fontSize:12,fontWeight:700,color:T.text}}>{col.tieDia?`${col.tieDia}mmØ @ ${col.tieSpacing||"?"}mm`:"—"}</div></div>
                </div>
              </div>
            ))}
          </div>
        ) : <div style={{padding:20,textAlign:"center",color:T.muted}}>No column data extracted from plans.</div>)}

        {view==="footings" && (allFtgs.length ? (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {allFtgs.map((ft,i)=>(
              <div key={i} style={{padding:"12px 16px",background:T.card,borderRadius:10,border:`1px solid ${T.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:14,fontWeight:800,color:T.text}}>{ft.id}</span>
                  <span style={{fontSize:11,color:T.muted}}>{ft.type||"—"} · {ft.thickness?`t=${ft.thickness}mm`:""} {ft.soilBearing?`· SBC=${ft.soilBearing}kPa`:""}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div style={{background:T.dim,borderRadius:6,padding:"8px 10px"}}><div style={{fontSize:9,color:T.muted,fontWeight:700,marginBottom:3}}>BOTTOM BARS</div><div style={{fontSize:12,fontWeight:700,color:T.text}}>{ft.botBarDia?`${ft.botBarDia}mmØ @ ${ft.botBarSpacing}mm`:"—"}</div></div>
                  <div style={{background:T.dim,borderRadius:6,padding:"8px 10px"}}><div style={{fontSize:9,color:T.muted,fontWeight:700,marginBottom:3}}>TOP BARS</div><div style={{fontSize:12,fontWeight:700,color:T.text}}>{ft.topBarDia?`${ft.topBarDia}mmØ @ ${ft.topBarSpacing}mm`:"—"}</div></div>
                </div>
              </div>
            ))}
          </div>
        ) : <div style={{padding:20,textAlign:"center",color:T.muted}}>No footing data extracted from plans.</div>)}

        {view==="slabs" && (allSlabs.length ? (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {allSlabs.map((sl,i)=>(
              <div key={i} style={{padding:"12px 16px",background:T.card,borderRadius:10,border:`1px solid ${T.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:14,fontWeight:800,color:T.text}}>{sl.id}</span>
                  <span style={{fontSize:11,color:T.muted}}>{sl.type||"—"} · t={sl.thickness||"?"}mm {sl.span?`· L=${sl.span}m`:""}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div style={{background:T.dim,borderRadius:6,padding:"8px 10px"}}><div style={{fontSize:9,color:T.muted,fontWeight:700,marginBottom:3}}>MAIN BARS</div><div style={{fontSize:12,fontWeight:700,color:T.text}}>{sl.mainBarDia?`${sl.mainBarDia}mmØ @ ${sl.mainBarSpacing}mm`:"—"}</div></div>
                  <div style={{background:T.dim,borderRadius:6,padding:"8px 10px"}}><div style={{fontSize:9,color:T.muted,fontWeight:700,marginBottom:3}}>TEMP BARS</div><div style={{fontSize:12,fontWeight:700,color:T.text}}>{sl.tempBarDia?`${sl.tempBarDia}mmØ @ ${sl.tempBarSpacing}mm`:"—"}</div></div>
                </div>
              </div>
            ))}
          </div>
        ) : <div style={{padding:20,textAlign:"center",color:T.muted}}>No slab data extracted from plans.</div>)}

        <div style={{marginTop:16,padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>
          ⚠️ Reinforcement schedule extracted by AI from structural plans. All bar sizes, counts, and spacings must be verified against the original drawings by a licensed PSCE.
        </div>
      </div>
    );
  }

  // ── OLD FORMAT: Full rebar schedule from computation results ──
  // (Only reached if hasOldFormat is true — i.e. old computation engine was used)
  if (!res || !res.memberData) {
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:60,gap:16,textAlign:"center"}}>
        <Icon name="report" size={48} color={T.muted}/>
        <div style={{fontSize:15,fontWeight:700,color:T.text}}>No Computation Results</div>
        <div style={{fontSize:13,color:T.muted,maxWidth:340,lineHeight:1.7}}>
          Run <strong style={{color:"#0696d7"}}>Run All</strong> in the AI Plan Checker first to generate rebar schedule data.
        </div>
      </div>
    );
  }

  const fc = sd.materials?.fc || 27.6;
  const fy = sd.materials?.fy || 414;
  const md = res.memberData || {};

  // ── BEAM SCHEDULE ──
  const beamRows = (md.beams||[]).map(bm => {
    const mainBar   = selectBars(bm.As_req, bm.b);
    const topBar    = selectBars(Math.max(bm.As_req*0.33, 2*PH_BAR_SIZES[1].area), bm.b);
    const stirrup   = selectStirrups(bm.Vs_req, bm.b, bm.d, fy, fc);
    const coverH    = bm.d + 25 + 10 + mainBar.bar.dia/2; // total depth approx
    return { ...bm, mainBar, topBar, stirrup, totalDepth: Math.round(coverH/10)*10 + 50 };
  });

  // ── COLUMN SCHEDULE ──
  const colRows = (md.columns||[]).map(col => {
    const mainBar = selectBars(col.Ast_req, Math.min(col.b, col.h));
    // Ties: NSCP 408.3 — s ≤ 16db, 48 tie-dia, least dim of section
    const tieBar  = { dia:10 };
    const tieSpacing = Math.min(16*mainBar.bar.dia, 48*tieBar.dia, Math.min(col.b,col.h));
    return { ...col, mainBar, tieBar, tieSpacing: Math.floor(tieSpacing/25)*25 };
  });

  // ── FOOTING SCHEDULE ──
  const ftRows = (md.footings||[]).map(ft => {
    const bar = selectSlabBars(ft.As / ft.B);
    return { ...ft, bar };
  });

  // ── SLAB SCHEDULE ──
  const slabRows = (md.slabs||[]).map(sl => {
    const bar = selectSlabBars(sl.As);
    const tempBar = selectSlabBars(sl.As * 0.0018 / (sl.rho_use || 0.0018));
    return { ...sl, bar, tempBar };
  });

  const TABS = [
    { key:"beams",    label:"Beams",    count:beamRows.length },
    { key:"columns",  label:"Columns",  count:colRows.length },
    { key:"footings", label:"Footings", count:ftRows.length },
    { key:"slabs",    label:"Slabs",    count:slabRows.length },
  ];

  const BarTag = ({dia, n, label}) => (
    <span style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:"#0696d7",background:"rgba(6,150,215,0.1)",padding:"2px 8px",borderRadius:4}}>
      {n ? `${n}-Ø${dia}` : `Ø${dia}`}{label?` @ ${label}mm`:""}
    </span>
  );

  const exportSchedule = () => {
    const w = window.open("","_blank");
    const date = new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});
    const projName = sd.building?.name || "Project";

    const beamTable = `<table><thead><tr>
      <th>Mark</th><th>b×d (mm)</th><th>Span (m)</th>
      <th>As req (mm²)</th><th>Top Bars</th><th>Bot. Bars</th><th>As prov (mm²)</th>
      <th>Stirrups</th><th>Remarks</th></tr></thead><tbody>
      ${beamRows.map(r=>`<tr>
        <td><b>${r.id}</b></td>
        <td>${r.b}×${r.d}</td>
        <td>${(r.span||"—")}</td>
        <td>${r.As_req.toFixed(0)}</td>
        <td>${r.topBar.n}-Ø${r.topBar.bar.dia}</td>
        <td>${r.mainBar.n}-Ø${r.mainBar.bar.dia}</td>
        <td style="color:#0284c7;font-weight:700">${r.mainBar.As_prov.toFixed(0)}</td>
        <td>Ø${r.stirrup.dia}@${r.stirrup.spacing}mm</td>
        <td style="font-size:11px;color:#64748b">${r.status_flex==="PASS"?"OK":"CHECK"} flex · ${r.status_shear}</td>
      </tr>`).join("")}
    </tbody></table>`;

    const colTable = `<table><thead><tr>
      <th>Mark</th><th>b×h (mm)</th><th>Type</th>
      <th>Ast req (mm²)</th><th>Main Bars</th><th>As prov (mm²)</th>
      <th>ρ (%)</th><th>Ties</th><th>φPn (kN)</th></tr></thead><tbody>
      ${colRows.map(r=>`<tr>
        <td><b>${r.id}</b></td>
        <td>${r.b}×${r.h}</td>
        <td>${r.type==="spiral"?"Spiral":"Tied"}</td>
        <td>${r.Ast_req.toFixed(0)}</td>
        <td>${r.mainBar.n}-Ø${r.mainBar.bar.dia}</td>
        <td style="color:#0284c7;font-weight:700">${r.mainBar.As_prov.toFixed(0)}</td>
        <td>${(r.rho_req*100).toFixed(2)}%</td>
        <td>Ø${r.tieBar.dia}@${r.tieSpacing}mm</td>
        <td>${r.phiPn.toFixed(0)}</td>
      </tr>`).join("")}
    </tbody></table>`;

    const ftTable = `<table><thead><tr>
      <th>Mark</th><th>Size (m)</th><th>Depth d (mm)</th>
      <th>As req (mm²/m)</th><th>Bars (Bot. EW)</th><th>Spacing</th><th>As prov (mm²/m)</th>
      <th>qa (kPa)</th></tr></thead><tbody>
      ${ftRows.map(r=>`<tr>
        <td><b>${r.id}</b></td>
        <td>${r.B.toFixed(2)}×${r.B.toFixed(2)}</td>
        <td>${r.d.toFixed(0)}</td>
        <td>${(r.As/r.B).toFixed(0)}</td>
        <td>Ø${r.bar.bar.dia}</td>
        <td>${r.bar.spacing}mm c/c</td>
        <td style="color:#0284c7;font-weight:700">${r.bar.As_prov.toFixed(0)}</td>
        <td>${r.qa}</td>
      </tr>`).join("")}
    </tbody></table>`;

    const slabTable = `<table><thead><tr>
      <th>Mark</th><th>Span (m)</th><th>h (mm)</th><th>d (mm)</th>
      <th>wu (kPa)</th><th>Mu (kN·m/m)</th>
      <th>As req (mm²/m)</th><th>Main Bars</th><th>Temp. Bars</th></tr></thead><tbody>
      ${slabRows.map(r=>`<tr>
        <td><b>${r.id}</b></td>
        <td>${r.L}</td>
        <td>${r.h}</td>
        <td>${r.d}</td>
        <td>${r.wu.toFixed(2)}</td>
        <td>${r.Mu.toFixed(1)}</td>
        <td>${r.As.toFixed(0)}</td>
        <td style="color:#0284c7;font-weight:700">Ø${r.bar.bar.dia}@${r.bar.spacing}mm</td>
        <td>Ø${r.tempBar.bar.dia}@${r.tempBar.spacing}mm</td>
      </tr>`).join("")}
    </tbody></table>`;

    w.document.write(`<!DOCTYPE html><html><head>
      <title>Rebar Schedule — ${projName}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;margin:0;padding:0;font-size:12px;color:#1e293b}
        .cover{background:#0f1624;color:#fff;padding:40px 50px;min-height:160px}
        .cover h1{font-size:24px;font-weight:900;color:#0696d7;margin:0 0 6px}
        .cover p{margin:4px 0;color:#94a3b8;font-size:12px}
        .badge{display:inline-block;background:rgba(6,150,215,0.2);color:#60c6f7;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;margin-right:8px}
        .content{padding:24px 40px}
        h2{font-size:15px;font-weight:800;color:#0f172a;border-bottom:2px solid #0696d7;padding-bottom:6px;margin-top:28px}
        h3{font-size:12px;font-weight:700;color:#475569;margin:14px 0 6px}
        table{border-collapse:collapse;width:100%;margin-bottom:12px;font-size:11px}
        th{background:#1e293b;color:#e2e8f0;padding:7px 8px;text-align:left;font-weight:700}
        td{border:1px solid #e2e8f0;padding:6px 8px;vertical-align:top}
        tr:nth-child(even) td{background:#f8fafc}
        .nscp{background:#f0f9ff;border-left:3px solid #0696d7;padding:8px 12px;font-size:11px;color:#0369a1;margin:8px 0}
        .warn{background:#fff7ed;border-left:3px solid #f59e0b;padding:8px 12px;font-size:11px;color:#92400e;margin:8px 0}
        .footer{margin-top:30px;padding:16px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8}
        @media print{.no-print{display:none}@page{margin:15mm 20mm}}
      </style>
    </head><body>
      <div class="cover">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:11px;color:#64748b;margin-bottom:6px;letter-spacing:1px">BUILDIFY · STRUCTURAL MODULE</div>
            <h1>Rebar Schedule</h1>
            <p>${projName}</p>
            <p style="margin-top:10px">
              <span class="badge">NSCP 2015</span>
              <span class="badge">f'c = ${fc} MPa</span>
              <span class="badge">fy = ${fy} MPa</span>
            </p>
          </div>
          <div style="text-align:right;color:#64748b;font-size:11px">
            <div>${date}</div>
            <div style="margin-top:4px">Prepared by: Buildify</div>
            <div style="margin-top:4px;color:#ef4444;font-size:10px">PRELIMINARY — NOT FOR CONSTRUCTION</div>
          </div>
        </div>
      </div>
      <div class="content">

        <h2>1. Beam Rebar Schedule</h2>
        <div class="nscp">NSCP 2015 Sec. 406 · ACI 318-14 · Cover: 40mm clear · Stirrups: Ø10 or Ø12 deformed</div>
        ${beamTable}
        <div class="warn">Top bars: min. 1/3 of bottom steel or as required by moment diagram. Provide development length per NSCP Sec. 412.</div>

        <h2>2. Column Rebar Schedule</h2>
        <div class="nscp">NSCP 2015 Sec. 410 · Tie spacing: min of 16db, 48 tie-dia, least column dim</div>
        ${colTable}

        <h2>3. Footing Rebar Schedule</h2>
        <div class="nscp">NSCP 2015 Sec. 415 · ρ_min = 0.0018 · Bars placed EW (both directions, bottom mat)</div>
        ${ftTable}
        <div class="warn">Development length of dowels from column into footing: ℓd ≥ 300mm per NSCP Sec. 412.</div>

        <h2>4. Slab Rebar Schedule</h2>
        <div class="nscp">NSCP 2015 Sec. 409 · ρ_temp = 0.0018 for temperature & shrinkage bars · Ø10 or Ø12 top bars perpendicular to span</div>
        ${slabTable}

      </div>
      <div class="footer">
        <strong>⚠ PRELIMINARY DESIGN — FOR REVIEW ONLY.</strong> This rebar schedule was generated by Buildify using simplified NSCP 2015 methods. Bar sizes, counts, and spacing must be verified and stamped by a licensed Professional Civil/Structural Engineer (PSCE) before use in contract documents or construction. Buildify and its developers accept no liability for the use of these outputs.
        <div style="margin-top:4px">Generated: ${date} · Buildify Structural Module · NSCP 2015</div>
      </div>
    </body></html>`);
    w.document.close();
    setTimeout(()=>w.print(),500);
  };

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:18,fontWeight:900,color:T.text,letterSpacing:"-0.5px"}}>Rebar Schedule</div>
          <div style={{fontSize:12,color:T.muted,marginTop:2}}>
            NSCP 2015 · f'c = {fc} MPa · fy = {fy} MPa · {sd.building?.name || "Project"}
          </div>
        </div>
        <button onClick={exportSchedule}
          style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",background:"linear-gradient(135deg,#0696d7,#0569a8)",border:"none",color:"#fff",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13}}>
          <Icon name="download" size={15} color="#fff"/> Export PDF Schedule
        </button>
      </div>

      {/* Scope note */}
      <div style={{padding:"10px 16px",background:"rgba(6,150,215,0.06)",border:"1px solid rgba(6,150,215,0.2)",borderRadius:8,marginBottom:20,fontSize:12,color:"#0696d7",lineHeight:1.7}}>
        Bar sizes selected per <strong>ASTM A615 / PNS 49</strong> standard PH deformed bars. Spacing governed by <strong>NSCP 2015</strong> min/max limits and practical constructability.
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:20,borderBottom:`1px solid ${T.border}`,paddingBottom:12}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setView(t.key)}
            style={{padding:"8px 16px",borderRadius:8,border:`1.5px solid ${view===t.key?"#0696d7":T.border}`,
              background:view===t.key?"rgba(6,150,215,0.12)":"transparent",
              color:view===t.key?"#0696d7":T.muted,cursor:"pointer",fontSize:13,fontWeight:700,transition:"all 0.15s"}}>
            {t.label} <span style={{fontSize:10,marginLeft:4,opacity:0.7}}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* ── BEAMS ── */}
      {view==="beams" && (
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px"}}>NSCP 2015 Sec. 406 — Singly Reinforced Beams</div>
          {beamRows.length === 0 ? (
            <div style={{padding:40,textAlign:"center",color:T.muted}}>No beam data. Run computations first.</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {beamRows.map((bm,i)=>(
                <div key={i} style={{background:T.card,border:`1px solid ${bm.status==="PASS"?"rgba(34,197,94,0.25)":"rgba(239,68,68,0.25)"}`,borderRadius:12,padding:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
                    <div style={{fontWeight:900,fontSize:16,color:T.text,minWidth:40}}>{bm.id}</div>
                    <span style={{fontSize:11,fontWeight:700,background:T.dim,color:T.muted,padding:"3px 8px",borderRadius:4}}>
                      {bm.b} × {bm.d} mm
                    </span>
                    {bm.span && <span style={{fontSize:11,color:T.muted}}>L = {bm.span}m</span>}
                    <span style={{fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:5,
                      background:bm.status==="PASS"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",
                      color:bm.status==="PASS"?"#22c55e":"#ef4444"}}>{bm.status}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
                    {/* Bottom bars */}
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Bottom (Tension) Bars</div>
                      <BarTag dia={bm.mainBar.bar.dia} n={bm.mainBar.n}/>
                      <div style={{fontSize:11,color:T.muted,marginTop:6}}>
                        As req: <strong style={{color:T.text}}>{bm.As_req.toFixed(0)}</strong> mm²<br/>
                        As prov: <strong style={{color:"#0696d7"}}>{bm.mainBar.As_prov.toFixed(0)}</strong> mm²
                        {bm.mainBar.As_prov >= bm.As_req
                          ? <span style={{color:"#22c55e",marginLeft:4}}>✓ OK</span>
                          : <span style={{color:"#ef4444",marginLeft:4}}>✗ Insufficient</span>}
                      </div>
                    </div>
                    {/* Top bars */}
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Top (Compression) Bars</div>
                      <BarTag dia={bm.topBar.bar.dia} n={bm.topBar.n}/>
                      <div style={{fontSize:11,color:T.muted,marginTop:6}}>Min. 1/3 of bottom steel<br/>per NSCP Sec. 412</div>
                    </div>
                    {/* Stirrups */}
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Stirrups (Shear)</div>
                      <BarTag dia={bm.stirrup.dia} label={bm.stirrup.spacing}/>
                      <div style={{fontSize:11,color:T.muted,marginTop:6}}>
                        Vc = {bm.Vc.toFixed(1)} kN · Vs = {bm.Vs_req.toFixed(1)} kN<br/>
                        {bm.status_shear}
                        {bm.stirrup.note && <div style={{color:"#f59e0b"}}>{bm.stirrup.note}</div>}
                      </div>
                    </div>
                    {/* Section summary */}
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Design Values</div>
                      <div style={{fontSize:11,color:T.muted,lineHeight:1.8}}>
                        ρ req: <strong style={{color:T.text}}>{(bm.rho_req*100).toFixed(4)}%</strong><br/>
                        ρ min: {(bm.rho_min*100).toFixed(4)}%<br/>
                        ρ max: {(bm.rho_max*100).toFixed(4)}%<br/>
                        Flexure: <strong style={{color:bm.status_flex==="PASS"?"#22c55e":"#ef4444"}}>{bm.status_flex}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── COLUMNS ── */}
      {view==="columns" && (
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px"}}>NSCP 2015 Sec. 410 — RC Columns</div>
          {colRows.length === 0 ? (
            <div style={{padding:40,textAlign:"center",color:T.muted}}>No column data. Run computations first.</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {colRows.map((col,i)=>(
                <div key={i} style={{background:T.card,border:`1px solid ${col.status==="PASS"?"rgba(34,197,94,0.25)":"rgba(239,68,68,0.25)"}`,borderRadius:12,padding:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
                    <div style={{fontWeight:900,fontSize:16,color:T.text,minWidth:40}}>{col.id}</div>
                    <span style={{fontSize:11,fontWeight:700,background:T.dim,color:T.muted,padding:"3px 8px",borderRadius:4}}>{col.b}×{col.h} mm</span>
                    <span style={{fontSize:11,color:T.muted}}>{col.type==="spiral"?"Spiral":"Tied"}</span>
                    <span style={{fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:5,
                      background:col.status==="PASS"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",
                      color:col.status==="PASS"?"#22c55e":"#ef4444"}}>{col.status}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Longitudinal Bars</div>
                      <BarTag dia={col.mainBar.bar.dia} n={col.mainBar.n}/>
                      <div style={{fontSize:11,color:T.muted,marginTop:6}}>
                        Ast req: <strong style={{color:T.text}}>{col.Ast_req.toFixed(0)}</strong> mm²<br/>
                        Ast prov: <strong style={{color:"#0696d7"}}>{col.mainBar.As_prov.toFixed(0)}</strong> mm²
                        {col.mainBar.As_prov >= col.Ast_req
                          ? <span style={{color:"#22c55e",marginLeft:4}}>✓</span>
                          : <span style={{color:"#ef4444",marginLeft:4}}>✗</span>}
                      </div>
                    </div>
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Lateral Ties</div>
                      <BarTag dia={col.tieBar.dia} label={col.tieSpacing}/>
                      <div style={{fontSize:11,color:T.muted,marginTop:6}}>
                        s ≤ min(16db, 48t, b_min)<br/>= min({16*col.mainBar.bar.dia}, {48*col.tieBar.dia}, {Math.min(col.b,col.h)}) = {col.tieSpacing}mm
                      </div>
                    </div>
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Capacity</div>
                      <div style={{fontSize:11,color:T.muted,lineHeight:1.8}}>
                        ρ: <strong style={{color:T.text}}>{(col.rho_req*100).toFixed(2)}%</strong> (min 1%, max 8%)<br/>
                        φPn: <strong style={{color:"#0696d7"}}>{col.phiPn.toFixed(0)} kN</strong><br/>
                        Pu: {col.Pu} kN · φ = {col.phi}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FOOTINGS ── */}
      {view==="footings" && (
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px"}}>NSCP 2015 Sec. 415 — Isolated Square Footings · ρ_min = 0.0018</div>
          {ftRows.length === 0 ? (
            <div style={{padding:40,textAlign:"center",color:T.muted}}>No footing data. Run computations first.</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {ftRows.map((ft,i)=>(
                <div key={i} style={{background:T.card,border:"1px solid rgba(34,197,94,0.25)",borderRadius:12,padding:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
                    <div style={{fontWeight:900,fontSize:16,color:T.text,minWidth:40}}>{ft.id}</div>
                    <span style={{fontSize:11,fontWeight:700,background:T.dim,color:T.muted,padding:"3px 8px",borderRadius:4}}>
                      {ft.B.toFixed(2)}m × {ft.B.toFixed(2)}m × d={ft.d.toFixed(0)}mm
                    </span>
                    <span style={{fontSize:11,color:T.muted}}>qa = {ft.qa} kPa</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Bottom Reinf. (Both Directions)</div>
                      <BarTag dia={ft.bar.bar.dia} label={ft.bar.spacing}/>
                      <div style={{fontSize:11,color:T.muted,marginTop:6}}>
                        As req: <strong style={{color:T.text}}>{(ft.As/ft.B).toFixed(0)}</strong> mm²/m<br/>
                        As prov: <strong style={{color:"#0696d7"}}>{ft.bar.As_prov.toFixed(0)}</strong> mm²/m
                      </div>
                    </div>
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Design Values</div>
                      <div style={{fontSize:11,color:T.muted,lineHeight:1.8}}>
                        qnet: {ft.qnet.toFixed(1)} kPa · qu: {ft.qu.toFixed(2)} kPa<br/>
                        Mu: {ft.Mu_ft.toFixed(1)} kN·m · ρ: {(ft.rho_use*100).toFixed(4)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SLABS ── */}
      {view==="slabs" && (
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px"}}>NSCP 2015 Sec. 409 — One-Way Slabs · ρ_temp = 0.0018</div>
          {slabRows.length === 0 ? (
            <div style={{padding:40,textAlign:"center",color:T.muted}}>No slab data. Run computations first.</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {slabRows.map((sl,i)=>(
                <div key={i} style={{background:T.card,border:"1px solid rgba(34,197,94,0.25)",borderRadius:12,padding:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
                    <div style={{fontWeight:900,fontSize:16,color:T.text,minWidth:40}}>{sl.id}</div>
                    <span style={{fontSize:11,fontWeight:700,background:T.dim,color:T.muted,padding:"3px 8px",borderRadius:4}}>
                      h={sl.h}mm · d={sl.d}mm · L={sl.L}m
                    </span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Main Bars (Along Span)</div>
                      <BarTag dia={sl.bar.bar.dia} label={sl.bar.spacing}/>
                      <div style={{fontSize:11,color:T.muted,marginTop:6}}>
                        As req: <strong style={{color:T.text}}>{sl.As.toFixed(0)}</strong> mm²/m<br/>
                        As prov: <strong style={{color:"#0696d7"}}>{sl.bar.As_prov.toFixed(0)}</strong> mm²/m
                      </div>
                    </div>
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Temp. & Shrinkage Bars</div>
                      <BarTag dia={sl.tempBar.bar.dia} label={sl.tempBar.spacing}/>
                      <div style={{fontSize:11,color:T.muted,marginTop:6}}>
                        Perpendicular to span<br/>ρ_temp = 0.0018
                      </div>
                    </div>
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Loading</div>
                      <div style={{fontSize:11,color:T.muted,lineHeight:1.8}}>
                        DL: {sl.wDL} kPa · LL: {sl.wLL} kPa<br/>
                        wu: {sl.wu.toFixed(2)} kPa · Mu: {sl.Mu.toFixed(1)} kN·m/m
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{marginTop:20,padding:"10px 16px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>
        ⚠️ Bar sizes selected per NSCP 2015 / ASTM A615 / PNS 49 standard PH deformed bars. Verify development lengths (Sec. 412), lap splices, hooks, and seismic detailing (Sec. 421) per full design. All schedules must be stamped by a licensed PSCE before construction.
      </div>
    </div>
  );
}

export default RebarSchedule;
