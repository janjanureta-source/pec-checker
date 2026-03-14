import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { Card, Label } from "../../theme.jsx";

function StructuralIntelligencePanel({ data, onUpdate, onRunAll, onClear, runState, structuralResults, onNavigate }) {
  const [expanded, setExpanded] = useState(false); // collapsed by default
  const [showMembers, setShowMembers] = useState(false);

  const bldg = data.building  || {};
  const mat  = data.materials || {};
  const sei  = data.seismic   || {};
  const lds  = data.loads     || {};
  const beams   = data.beams    || [];
  const cols    = data.columns  || [];
  const ftgs    = data.footings || [];
  const slbs    = data.slabs    || [];

  // Computation readiness — which calcs have enough data
  const readiness = [
    { key:"seismic", label:"Seismic",      ok: !!(sei.zone || sei.seismicWeight),            detail: sei.zone || "", noData:"not in plans" },
    { key:"beam",    label:"Beam",          ok: !!(beams.length && mat.fc),                   detail: beams.length ? `${beams.length} extracted` : "", noData:"not in plans" },
    { key:"column",  label:"Column",        ok: !!(cols.length && mat.fc),                    detail: cols.length ? `${cols.length} extracted` : "", noData:"not in plans" },
    { key:"footing", label:"Footing",       ok: !!(ftgs.length),                              detail: ftgs.length ? `${ftgs.length} extracted` : "", noData:"not in plans" },
    { key:"slab",    label:"Slab",          ok: !!(slbs.length),                              detail: slbs.length ? `${slbs.length} extracted` : "", noData:"not in plans" },
    { key:"loads",   label:"Load Combos",   ok: !!(lds.floorDL && lds.floorLL),               detail: lds.floorDL ? `DL=${lds.floorDL}` : "", noData:"not in plans" },
    { key:"rebar",   label:"Rebar Sched",   ok: false, isRebar: true,                         detail: "", noData:"run all first" },
  ];

  const readyCount = readiness.filter(r=>r.ok).length;

  // Computation results summary
  const getItemStatus = (key) => {
    if (!structuralResults) return null;
    const items = structuralResults.items.filter(i=>i.tool===key);
    if (!items.length) return null;
    if (items.some(i=>i.status==="NO DATA") && items.every(i=>i.status==="NO DATA")) return "nodata";
    if (items.some(i=>i.status==="FAIL")) return "fail";
    if (items.some(i=>i.status==="INCOMPLETE"||i.status==="NO DATA")) return "incomplete";
    return items.every(i=>i.status==="PASS") ? "pass" : "pass";
  };

  const statusColor = { pass:"#22c55e", fail:"#ef4444", incomplete:"#f59e0b", nodata:"#64748b" };
  const statusIcon  = { pass:"✓", fail:"✗", incomplete:"⚠", nodata:"—" };

  // Inline field editor (only shown when expanded)
  const Field = ({label, value, path, type="number", fp=false}) => {
    const parts = path.split(".");
    const handleChange = (v) => {
      const updated = JSON.parse(JSON.stringify(data));
      let ref = updated;
      for (let i=0;i<parts.length-1;i++) { if(!ref[parts[i]]) ref[parts[i]]={};  ref=ref[parts[i]]; }
      ref[parts[parts.length-1]] = type==="number" ? +v : v;
      onUpdate(updated);
    };
    return (
      <div>
        <div style={{fontSize:10,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.3px",fontWeight:600}}>
          {label}{fp && <span style={{fontSize:8,background:"rgba(34,197,94,0.15)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.25)",padding:"0px 4px",borderRadius:3,fontWeight:700,marginLeft:5}}>PLANS</span>}
        </div>
        <input type={type} value={value??""} onChange={e=>handleChange(e.target.value)}
          style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${fp?"rgba(34,197,94,0.25)":T.border}`,
            borderRadius:6,padding:"5px 8px",color:T.text,fontSize:12,fontWeight:600,outline:"none",width:"100%"}}/>
      </div>
    );
  };

  return (
    <div style={{marginBottom:20}}>
      {/* ── Compact summary bar ── */}
      <div style={{background:"rgba(6,150,215,0.06)",border:"1.5px solid rgba(6,150,215,0.2)",borderRadius:12,padding:"12px 16px"}}>

        {/* Top row: project info + actions */}
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#0696d7,#0569a8)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Icon name="structural" size={16} color="#fff"/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:800,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {bldg.name || "Structural Plans Loaded"}
            </div>
            <div style={{fontSize:11,color:T.muted}}>
              {[bldg.floors&&`${bldg.floors}F`, sei.zone, mat.fc&&`f'c=${mat.fc}MPa`, mat.fy&&`fy=${mat.fy}MPa`].filter(Boolean).join(" · ")||"Ready for computation"}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
            <button onClick={()=>setExpanded(p=>!p)}
              style={{padding:"6px 12px",background:"transparent",border:`1px solid ${T.border}`,color:T.muted,borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600}}>
              {expanded ? "▲ Less" : "▼ Edit Data"}
            </button>
            <button onClick={onRunAll} disabled={runState?.running}
              style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",
                background:runState?.running?"rgba(6,150,215,0.2)":"linear-gradient(135deg,#0696d7,#0569a8)",
                border:"none",color:runState?.running?"#64748b":"#fff",borderRadius:8,
                cursor:runState?.running?"not-allowed":"pointer",fontWeight:800,fontSize:12,transition:"all 0.2s"}}>
              {runState?.running
                ? <><span style={{display:"inline-block",animation:"spin 1s linear infinite"}}>⚙</span> Running…</>
                : <><Icon name="loads" size={13} color="#fff"/> Run All</>}
            </button>
            <button onClick={onClear}
              style={{padding:"8px 10px",background:"transparent",border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,cursor:"pointer",fontSize:11}}>
              ✕
            </button>
          </div>
        </div>

        {/* ── Computation readiness checklist ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,marginTop:12}}>
          {readiness.map(r => {
            const computed = getItemStatus(r.key);
            // Rebar schedule: available only after Run All
            const isRebarReady = r.isRebar && structuralResults;
            const rebarHasData = r.isRebar && structuralResults?.items?.length > 0;
            const effectiveOk = r.isRebar ? isRebarReady : r.ok;
            const effectiveComputed = r.isRebar ? (rebarHasData ? "computed" : null) : computed;
            return (
              <button key={r.key} onClick={()=>onNavigate&&onNavigate(r.key)}
                style={{padding:"7px 8px",borderRadius:8,cursor:"pointer",textAlign:"center",border:"none",
                  background: effectiveComputed ? (effectiveComputed==="fail"?"rgba(239,68,68,0.08)":effectiveComputed==="unverifiable"?"rgba(245,158,11,0.08)":"rgba(34,197,94,0.08)") : effectiveOk ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                  transition:"all 0.15s"}}>
                <div style={{fontSize:14,fontWeight:900,marginBottom:2,
                  color: effectiveComputed ? statusColor[effectiveComputed] : effectiveOk ? "#0696d7" : T.muted}}>
                  {effectiveComputed ? statusIcon[effectiveComputed] : effectiveOk ? "●" : "○"}
                </div>
                <div style={{fontSize:10,fontWeight:700,color:effectiveComputed?statusColor[effectiveComputed]:effectiveOk?T.text:T.muted,lineHeight:1.2}}>{r.label}</div>
                {effectiveComputed && (
                  <div style={{fontSize:9,color:statusColor[effectiveComputed],fontWeight:700,marginTop:1,textTransform:"uppercase"}}>
                    {effectiveComputed === "incomplete" ? "partial" : effectiveComputed === "nodata" ? "no data" : effectiveComputed}
                  </div>
                )}
                {!effectiveComputed && effectiveOk && r.detail && (
                  <div style={{fontSize:9,color:T.muted,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.detail}</div>
                )}
                {!effectiveComputed && !effectiveOk && (
                  <div style={{fontSize:9,color:T.muted,marginTop:1}}>{r.noData || "no data"}</div>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Run All result summary (shows after computation) ── */}
        {structuralResults && (
          <div style={{display:"flex",gap:10,marginTop:10,padding:"8px 12px",background:T.dim,borderRadius:8,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:T.muted,fontWeight:600}}>Computation result:</span>
            {[
              {label:`${structuralResults.summary.pass} PASS`,   color:"#22c55e", bg:"rgba(34,197,94,0.1)"},
              {label:`${structuralResults.summary.fail} FAIL`,   color:"#ef4444", bg:"rgba(239,68,68,0.1)"},
              ...(structuralResults.summary.incomplete > 0 ? [{label:`${structuralResults.summary.incomplete} INCOMPLETE`, color:"#f59e0b", bg:"rgba(245,158,11,0.1)"}] : []),
              ...(structuralResults.summary.noData > 0 ? [{label:`${structuralResults.summary.noData} NO DATA`, color:"#64748b", bg:"rgba(100,116,139,0.1)"}] : []),
            ].map(s=>(
              <span key={s.label} style={{fontSize:11,fontWeight:700,color:s.color,background:s.bg,padding:"3px 10px",borderRadius:6}}>{s.label}</span>
            ))}
            <button onClick={()=>{ /* export handled by StructuralComputationSummary */
              const w=window.open("","_blank");
              const date=new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});
              const toolLabel={seismic:"Seismic",beam:"Beam",column:"Column",footing:"Footing",slab:"Slab",loads:"Load Combos"};
              const statusColor2={PASS:"#16a34a",FAIL:"#dc2626",COMPUTED:"#0284c7",ERROR:"#d97706"};
              const rows=structuralResults.items.map(item=>`<tr><td>${toolLabel[item.tool]||item.tool}</td><td><strong>${item.id}</strong></td><td>${item.value||"-"}</td><td>${item.detail||"-"}</td><td style="color:${statusColor2[item.status]};font-weight:700">${item.status}</td></tr>`).join("");
              w.document.write(`<!DOCTYPE html><html><head><title>Structural Computation Package</title><style>body{font-family:Arial,sans-serif;margin:40px;font-size:13px}table{border-collapse:collapse;width:100%}th{background:#1e293b;color:#fff;padding:9px}td{border:1px solid #e2e8f0;padding:8px 10px}h1{color:#0696d7}@media print{button{display:none}}</style></head><body><h1>Structural Computation Package</h1><p style="color:#64748b">NSCP 2015 · ${date} · Buildify</p><table><tr><th>Tool</th><th>Member ID</th><th>Result</th><th>Detail</th><th>Status</th></tr>${rows}</table><p style="margin-top:24px;font-size:11px;color:#9ca3af">⚠️ For preliminary design only. Verify with licensed PSCE.</p></body></html>`);
              w.document.close(); setTimeout(()=>w.print(),400);
            }} style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,padding:"5px 12px",background:"linear-gradient(135deg,#0696d7,#0569a8)",border:"none",color:"#fff",borderRadius:6,cursor:"pointer",fontWeight:700,fontSize:11}}>
              <Icon name="download" size={11} color="#fff"/> Export PDF
            </button>
          </div>
        )}

        {/* ── Expandable data editor ── */}
        {expanded && (
          <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${T.border}`}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>

              {/* Building + Seismic */}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{fontSize:10,fontWeight:800,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px"}}>Building Info</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div style={{gridColumn:"1/-1"}}><Field label="Project Name" value={bldg.name} path="building.name" type="text" fp={!!bldg.name}/></div>
                  <Field label="Floors" value={bldg.floors} path="building.floors" fp={!!bldg.floors}/>
                  <Field label="Floor Height (m)" value={bldg.floorHeight} path="building.floorHeight" fp={!!bldg.floorHeight}/>
                </div>
                <div style={{fontSize:10,fontWeight:800,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px",marginTop:4}}>Materials</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <Field label="f'c (MPa)" value={mat.fc} path="materials.fc" fp={!!mat.fc}/>
                  <Field label="fy (MPa)"  value={mat.fy} path="materials.fy" fp={!!mat.fy}/>
                </div>
                <div style={{fontSize:10,fontWeight:800,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px",marginTop:4}}>Floor Loads</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <Field label="DL (kPa)" value={lds.floorDL} path="loads.floorDL" fp={!!lds.floorDL}/>
                  <Field label="LL (kPa)" value={lds.floorLL} path="loads.floorLL" fp={!!lds.floorLL}/>
                </div>
              </div>

              {/* Seismic */}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{fontSize:10,fontWeight:800,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px"}}>Seismic Parameters</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <Field label="Zone" value={sei.zone} path="seismic.zone" type="text" fp={!!sei.zone}/>
                  <Field label="Soil Type" value={sei.soilTypeLabel} path="seismic.soilTypeLabel" type="text" fp={!!sei.soilTypeLabel}/>
                  <Field label="Weight W (kN)" value={sei.seismicWeight} path="seismic.seismicWeight" fp={sei.seismicWeight!=null}/>
                  <Field label="Period T (s)" value={sei.naturalPeriod} path="seismic.naturalPeriod" fp={sei.naturalPeriod!=null}/>
                  <Field label="Factor R" value={sei.responseFactor} path="seismic.responseFactor" fp={sei.responseFactor!=null}/>
                </div>
              </div>
            </div>

            {/* Members — collapsible */}
            {(beams.length+cols.length+ftgs.length+slbs.length) > 0 && (
              <div style={{marginTop:12}}>
                <button onClick={()=>setShowMembers(p=>!p)}
                  style={{background:"transparent",border:`1px solid ${T.border}`,color:T.muted,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:600}}>
                  {showMembers?"▲":"▼"} Member Schedule ({beams.length+cols.length+ftgs.length+slbs.length} extracted)
                </button>
                {showMembers && (
                  <div style={{marginTop:10,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10}}>
                    {beams.length>0&&(
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:"#0696d7",marginBottom:6,textTransform:"uppercase"}}>Beams ({beams.length})</div>
                        {beams.map((bm,i)=>(
                          <div key={i} style={{display:"flex",gap:8,padding:"6px 10px",background:"rgba(6,150,215,0.05)",borderRadius:7,marginBottom:5,fontSize:11,flexWrap:"wrap"}}>
                            <span style={{fontWeight:700,color:"#0696d7",minWidth:28}}>{bm.id||`B${i+1}`}</span>
                            {bm.width&&<span style={{color:T.muted}}>b={bm.width}</span>}
                            {bm.depth&&<span style={{color:T.muted}}>d={bm.depth}</span>}
                            {bm.Mu&&<span style={{color:T.muted}}>Mu={bm.Mu}</span>}
                            {bm.Vu&&<span style={{color:T.muted}}>Vu={bm.Vu}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {cols.length>0&&(
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:"#f59e0b",marginBottom:6,textTransform:"uppercase"}}>Columns ({cols.length})</div>
                        {cols.map((c,i)=>(
                          <div key={i} style={{display:"flex",gap:8,padding:"6px 10px",background:"rgba(245,158,11,0.05)",borderRadius:7,marginBottom:5,fontSize:11,flexWrap:"wrap"}}>
                            <span style={{fontWeight:700,color:"#f59e0b",minWidth:28}}>{c.id||`C${i+1}`}</span>
                            {c.width&&<span style={{color:T.muted}}>b={c.width}</span>}
                            {c.height&&<span style={{color:T.muted}}>h={c.height}</span>}
                            {c.Pu&&<span style={{color:T.muted}}>Pu={c.Pu}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {ftgs.length>0&&(
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:"#22c55e",marginBottom:6,textTransform:"uppercase"}}>Footings ({ftgs.length})</div>
                        {ftgs.map((f,i)=>(
                          <div key={i} style={{display:"flex",gap:8,padding:"6px 10px",background:"rgba(34,197,94,0.05)",borderRadius:7,marginBottom:5,fontSize:11,flexWrap:"wrap"}}>
                            <span style={{fontWeight:700,color:"#22c55e",minWidth:28}}>{f.id||`F${i+1}`}</span>
                            {f.columnLoad&&<span style={{color:T.muted}}>P={f.columnLoad}</span>}
                            {f.soilBearing&&<span style={{color:T.muted}}>qa={f.soilBearing}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{marginTop:10,fontSize:11,color:T.muted,fontStyle:"italic"}}>
              All fields editable above. Green label = extracted from plans. Changes feed into all design calculators.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── STRUCTURAL COMPUTATION SUMMARY ──────────────────────────────────────────

export default StructuralIntelligencePanel;
