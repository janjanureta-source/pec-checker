import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { Card, Label } from "../../theme.jsx";

function ElecIntelligencePanel({ data, onClear, runState, elecResults, onRunAll, onNavigate }) {
  const ACCENT = "#ff6b2b";

  const sys = data?.system        || {};
  const vd  = data?.voltageDrop   || {};
  const sc  = data?.shortCircuit  || {};
  const lc  = data?.loadCalc      || {};
  const ps  = data?.panel         || {};
  const cf  = data?.conduit       || {};
  const amp = data?.ampacity      || {};

  const READINESS = [
    { key:"vdrop",    icon:"vdrop",    label:"Voltage Drop",      code:"PEC Art. 2.30",
      ok: !!(vd.voltage && vd.current && vd.wireSize),
      detail: vd.wireSize ? `#${vd.wireSize} AWG · ${vd.current}A · ${vd.length}m` : null,
      missing: !vd.voltage ? "No system voltage found" : !vd.current ? "No load current found" : "No wire size found" },
    { key:"fault",    icon:"fault",    label:"Short Circuit",     code:"PEC Art. 2.40",
      ok: !!(sc.voltage && sc.xfmrKVA),
      detail: sc.xfmrKVA ? `${sc.xfmrKVA}kVA xfmr · ${sc.xfmrZ||4}%Z` : null,
      missing: !sc.xfmrKVA ? "No transformer kVA found in plans" : "No system voltage" },
    { key:"load",     icon:"load",     label:"Load Calculator",   code:"PEC Art. 2.20",
      ok: !!(lc.loads?.length),
      detail: lc.loads?.length ? `${lc.loads.length} loads · ${lc.occupancy||"residential"}` : null,
      missing: "No load schedule found in plans" },
    { key:"panel",    icon:"panel",    label:"Panel Schedule",    code:"PEC Art. 2.20",
      ok: !!(ps.circuits?.length || ps.mainBreaker),
      detail: ps.circuits?.length ? `${ps.circuits.length} circuits · ${ps.mainBreaker||"?"}A main` : ps.mainBreaker ? `${ps.mainBreaker}A main breaker` : null,
      missing: "No panelboard schedule found in plans" },
    { key:"conduit",  icon:"conduit",  label:"Conduit Fill",      code:"PEC Art. 3.50",
      ok: !!(cf.conductors?.length),
      detail: cf.conductors?.length ? `${cf.conductors.reduce((s,c)=>s+(+c.qty||1),0)} conductors in ${cf.conduitSize||"?"} ${cf.conduitType||""}` : null,
      missing: "No conduit schedule found in plans" },
    { key:"ampacity", icon:"ampacity", label:"Ampacity Derating", code:"PEC Table 3.10",
      ok: !!(amp.wireSize && amp.loadCurrent),
      detail: amp.wireSize ? `#${amp.wireSize} AWG · ${amp.loadCurrent}A load · ${amp.ambient||30}°C` : null,
      missing: !amp.wireSize ? "No conductor size found" : "No load current found" },
  ];

  const readyCount = READINESS.filter(r=>r.ok).length;

  const getResult = (key) => elecResults?.items.find(i => i.tool === key);
  const statusCfg = {
    PASS:     { bg:"rgba(34,197,94,0.12)",  color:"#22c55e", border:"rgba(34,197,94,0.3)",  label:"✓ PASS"     },
    FAIL:     { bg:"rgba(239,68,68,0.12)",  color:"#ef4444", border:"rgba(239,68,68,0.3)",  label:"✗ FAIL"     },
    WARNING:  { bg:"rgba(245,158,11,0.12)", color:"#f59e0b", border:"rgba(245,158,11,0.3)", label:"⚠ WARNING"  },
    COMPUTED: { bg:"rgba(6,150,215,0.12)",  color:"#0696d7", border:"rgba(6,150,215,0.3)",  label:"✓ COMPUTED" },
  };

  return (
    <div style={{marginBottom:16,background:T.card,border:`1.5px solid rgba(255,107,43,0.25)`,borderRadius:14,overflow:"hidden"}}>

      {/* ── Header ── */}
      <div style={{padding:"14px 18px",background:"linear-gradient(135deg,rgba(255,107,43,0.07),rgba(255,107,43,0.03))",
        borderBottom:`1px solid rgba(255,107,43,0.15)`,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#ff6b2b,#e85520)",
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Icon name="electrical" size={17} color="#fff"/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:800,fontSize:14,color:T.text}}>{sys.projectName||"Electrical Project"}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:1}}>
            {[sys.voltage&&`${sys.voltage}V`, sys.phases===3?"3φ":"1φ", sys.occupancy].filter(Boolean).join(" · ")}
          </div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
          {elecResults && (
            <>
              {elecResults.summary.passCount>0 && <span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:8,background:"rgba(34,197,94,0.12)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.25)"}}>✓ {elecResults.summary.passCount} Pass</span>}
              {elecResults.summary.failCount>0 && <span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:8,background:"rgba(239,68,68,0.12)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.25)"}}>✗ {elecResults.summary.failCount} Fail</span>}
              {elecResults.summary.warnCount>0 && <span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:8,background:"rgba(245,158,11,0.12)",color:"#f59e0b",border:"1px solid rgba(245,158,11,0.25)"}}>⚠ {elecResults.summary.warnCount} Warn</span>}
            </>
          )}
          <button onClick={onRunAll} disabled={readyCount===0||runState?.running}
            style={{padding:"8px 16px",borderRadius:9,border:"none",
              background:readyCount>0?`linear-gradient(135deg,${ACCENT},#e85520)`:"rgba(100,116,139,0.2)",
              color:readyCount>0?"#fff":"#64748b",cursor:readyCount>0?"pointer":"not-allowed",
              fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
            {runState?.running
              ? <><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span> Running…</>
              : `▶ Run All Checks (${readyCount}/${READINESS.length})`}
          </button>
          <button onClick={onClear} title="Clear extracted data"
            style={{padding:"7px 10px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",
              color:T.muted,cursor:"pointer",fontSize:13}}>✕</button>
        </div>
      </div>

      {/* ── Calculator status grid — ALWAYS VISIBLE ── */}
      <div style={{padding:"14px 18px"}}>
        <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:12}}>
          Calculator Status — {readyCount} of {READINESS.length} populated from plans
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
          {READINESS.map(r => {
            const result = getResult(r.key);
            const hasSt  = !!result;
            const stCfg  = hasSt ? statusCfg[result.status] : null;
            const cardBorder = hasSt ? stCfg.border : r.ok ? "rgba(34,197,94,0.3)" : T.border;
            const cardBg     = hasSt ? stCfg.bg     : r.ok ? "rgba(34,197,94,0.04)" : "transparent";
            return (
              <button key={r.key} onClick={()=>onNavigate(r.key)}
                style={{background:cardBg,border:`1.5px solid ${cardBorder}`,borderRadius:10,
                  padding:"12px 14px",textAlign:"left",cursor:"pointer",transition:"all 0.15s",width:"100%"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=ACCENT;e.currentTarget.style.background="rgba(255,107,43,0.06)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=cardBorder;e.currentTarget.style.background=cardBg;}}>

                {/* Tool name row */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <Icon name={r.icon} size={13} color={hasSt?stCfg.color:r.ok?"#22c55e":T.muted}/>
                    <span style={{fontWeight:800,fontSize:12,color:T.text}}>{r.label}</span>
                  </div>
                  {/* Status badge */}
                  {hasSt ? (
                    <span style={{fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:6,
                      background:stCfg.bg,color:stCfg.color,border:`1px solid ${stCfg.border}`}}>
                      {stCfg.label}
                    </span>
                  ) : r.ok ? (
                    <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:6,
                      background:"rgba(34,197,94,0.1)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.2)"}}>
                      📥 DATA READY
                    </span>
                  ) : (
                    <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:6,
                      background:"rgba(100,116,139,0.1)",color:T.muted,border:`1px solid ${T.border}`}}>
                      ⊘ NO DATA
                    </span>
                  )}
                </div>

                {/* Result value (after run) */}
                {result?.value && (
                  <div style={{fontSize:22,fontWeight:900,color:stCfg?.color||T.text,fontFamily:"monospace",lineHeight:1,marginBottom:4}}>
                    {result.value}
                  </div>
                )}

                {/* Detail or missing reason */}
                <div style={{fontSize:11,color:r.ok?T.muted:"#ef444480",lineHeight:1.4}}>
                  {result?.detail || (r.ok ? r.detail : `⚠ ${r.missing}`)}
                </div>

                {/* PEC reference */}
                <div style={{fontSize:10,color:"rgba(255,107,43,0.5)",marginTop:5,fontWeight:600}}>{r.code}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ELEC COMPUTATION SUMMARY ─────────────────────────────────────────────────

// ─── VERIFY HINT BANNER ─────────────────────────────────────────────────────

export default ElecIntelligencePanel;
