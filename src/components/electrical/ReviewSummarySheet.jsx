import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { WIRE_DATA, AWG_SIZES } from "./constants.jsx";
import { Card, Label } from "../../theme.jsx";
import CalcResultRow from "./CalcResultRow.jsx";

function ReviewSummarySheet({ checkerResult, electricalData, elecResults }) {
  const ACCENT = "#ff6b2b";

  // ── Derived data ────────────────────────────────────────────────────────────
  const sys     = electricalData?.system      || {};
  const panel   = electricalData?.panel       || {};
  const findings= checkerResult?.findings     || [];
  const checks  = checkerResult?.checklist    || {};
  const summary = checkerResult?.summary      || {};
  const items   = elecResults?.items          || [];
  const chain   = items.find(i=>i.tool==="service")?.chain;

  const criticals = findings.filter(f=>f.severity==="CRITICAL");
  const warnings  = findings.filter(f=>f.severity==="WARNING");
  const infos     = findings.filter(f=>f.severity==="INFO");

  const CALC_LABELS = {
    vdrop:"Voltage Drop",fault:"Short Circuit",load:"Load Calc",
    panel:"Panel Schedule",conduit:"Conduit Fill",ampacity:"Ampacity Derating",
    branch80:"Branch 80%",motor:"Motor Circuits",grounding:"Grounding (GEC)",
    vdrop_table:"VD All Circuits",service:"Service Entrance",
  };
  const calcItems = items.filter(i=>["vdrop","fault","load","panel","conduit","ampacity","branch80","motor","grounding","vdrop_table"].includes(i.tool));
  const passes    = calcItems.filter(i=>i.status==="PASS"||i.status==="COMPUTED").length;
  const fails     = calcItems.filter(i=>i.status==="FAIL").length;
  const noInputs  = calcItems.filter(i=>i.status==="NO INPUT").length;

  // PEE sign-off checklist
  const SIGNOFF = [
    { key:"service",    label:"Service entrance size verified",         ref:"PEC Art. 2.20"       },
    { key:"vdrop",      label:"Voltage drop ≤3% branch, ≤5% total",    ref:"PEC Art. 2.30"       },
    { key:"fault",      label:"Short circuit / AIC adequacy checked",   ref:"PEC Art. 2.40"       },
    { key:"ground",     label:"Grounding system per PEC Table 2.50.12", ref:"PEC Table 2.50.12"   },
    { key:"branch80",   label:"All circuits ≤80% breaker (continuous)", ref:"PEC Art. 2.20.3.2"   },
    { key:"motor",      label:"Motor circuits 250% breaker rule",        ref:"PEC Art. 4.30"       },
    { key:"conduit",    label:"Conduit fill ≤40% for 3+ conductors",    ref:"PEC Art. 3.50"       },
    { key:"fsic",       label:"FSIC / RA 9514 fire protection checked", ref:"RA 9514"             },
    { key:"meralco",    label:"MERALCO load data sheet prepared",        ref:"MERALCO Std."        },
    { key:"panel",      label:"Panel schedule complete and labeled",     ref:"PEC Art. 2.20"       },
    { key:"lgu",        label:"LGU permit documents ready",             ref:"Local Code"          },
  ];
  const [signoff, setSignoff] = React.useState(()=>{
    const init={};
    SIGNOFF.forEach(s=>{
      const res=items.find(i=>i.tool===s.key);
      init[s.key]= res?(res.status==="PASS"||res.status==="COMPUTED"):false;
    });
    return init;
  });
  const signedCount = Object.values(signoff).filter(Boolean).length;

  // ── Export PDF ──────────────────────────────────────────────────────────────
  const exportReviewPDF = () => {
    const w = window.open("","_blank");
    const date = new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});
    const statusBg = fails>0?"#dc2626":criticals.length>0||noInputs>0?"#d97706":"#16a34a";
    const statusLbl= fails>0?"NON-COMPLIANT":criticals.length>0?"COMPLIANT WITH WARNINGS":noInputs>0?"NEEDS REVIEW":"COMPLIANT";

    const findingRows = [...criticals,...warnings,...infos].map(f=>{
      const col={CRITICAL:"#dc2626",WARNING:"#d97706",INFO:"#2563eb"}[f.severity]||"#555";
      return `<tr>
        <td style="padding:7px 10px;border:1px solid #e5e7eb;color:${col};font-weight:700;white-space:nowrap;font-size:11px">${f.severity}</td>
        <td style="padding:7px 10px;border:1px solid #e5e7eb;font-size:11px;white-space:nowrap">${f.category||""}</td>
        <td style="padding:7px 10px;border:1px solid #e5e7eb;font-weight:600;font-size:12px">${f.title}</td>
        <td style="padding:7px 10px;border:1px solid #e5e7eb;font-size:11px;color:#15803d">${f.recommendation||""}</td>
        <td style="padding:7px 10px;border:1px solid #e5e7eb;font-size:10px;color:#6b7280;white-space:nowrap">${f.pecReference||""}</td>
      </tr>`;
    }).join("");

    const calcRows = calcItems.map(i=>{
      const col=i.status==="PASS"||i.status==="COMPUTED"?"#16a34a":i.status==="FAIL"?"#dc2626":"#d97706";
      const detailText = i.status==="NO INPUT" ? `⚠ INPUT NEEDED: ${i.detail}` : (i.detail||"");
      return `<tr>
        <td style="padding:7px 10px;border:1px solid #e5e7eb;font-size:12px;font-weight:600">${CALC_LABELS[i.tool]||i.tool}</td>
        <td style="padding:7px 10px;border:1px solid #e5e7eb;font-family:monospace;font-size:13px;font-weight:700">${i.value||"—"}</td>
        <td style="padding:7px 10px;border:1px solid #e5e7eb;font-size:11px;color:${i.status==='NO INPUT'?'#d97706':'#6b7280'};font-style:${i.status==='NO INPUT'?'italic':'normal'}">${detailText}</td>
        <td style="padding:7px 10px;border:1px solid #e5e7eb;color:${col};font-weight:700;font-size:11px">${i.status}</td>
      </tr>`;
    }).join("");

    const soRows = SIGNOFF.map(s=>`<tr>
      <td style="padding:7px 12px;border:1px solid #e5e7eb;font-size:12px">${s.label}</td>
      <td style="padding:7px 12px;border:1px solid #e5e7eb;font-size:11px;color:#6b7280">${s.ref}</td>
      <td style="padding:7px 12px;border:1px solid #e5e7eb;text-align:center;font-size:16px">${signoff[s.key]?"✓":""}</td>
      <td style="padding:7px 12px;border:1px solid #e5e7eb;width:120px"></td>
    </tr>`).join("");

    w.document.write(`<!DOCTYPE html><html><head><title>PEE Electrical Review — ${summary.projectName||"Project"}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:0;color:#111;font-size:13px}
      .page{max-width:900px;margin:0 auto;padding:32px 40px}
      h2{color:#1f2937;border-bottom:2px solid #f3f4f6;padding-bottom:6px;margin:24px 0 12px}
      table{border-collapse:collapse;width:100%;margin-bottom:16px}
      th{background:#1f2937;color:#fff;padding:9px 10px;text-align:left;font-size:11px}
      .badge{display:inline-block;padding:5px 18px;border-radius:20px;font-weight:800;font-size:14px;background:${statusBg}22;color:${statusBg};border:2px solid ${statusBg}}
      .chain-box{display:inline-block;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:10px 18px;margin-right:12px;text-align:center;min-width:100px}
      .chain-label{font-size:10px;color:#9ca3af;font-weight:700;text-transform:uppercase}
      .chain-val{font-size:18px;font-weight:900;color:#1f2937;font-family:monospace}
      .sig-box{border:1px solid #d1d5db;border-radius:8px;padding:20px 24px;margin-top:8px}
      .footer{margin-top:32px;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px;text-align:center}
      .print-btn{position:fixed;top:16px;right:16px;padding:9px 20px;background:#ff6b2b;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700}
      @media print{.print-btn{display:none}}
    </style></head><body>
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
    <div class="page">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px">
        <div>
          <div style="font-size:22px;font-weight:900;color:#111">⚡ PEE Electrical Review</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:2px">Philippine Electrical Code 2017 · ${date}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:#9ca3af">Prepared by</div>
          <div style="font-size:13px;font-weight:700;color:#111">Buildify · buildify.ph</div>
          <div style="font-size:10px;color:#9ca3af">AI-assisted — PEE review required</div>
        </div>
      </div>

      <table style="width:auto;margin-bottom:16px">
        <tr>
          <td style="padding:4px 24px 4px 0"><b>Project:</b> ${summary.projectName||sys.projectName||"—"}</td>
          <td style="padding:4px 24px"><b>Voltage:</b> ${sys.voltage||"—"}V ${sys.phases===3?"3-phase":"1-phase"}</td>
          <td style="padding:4px 0"><b>Occupancy:</b> ${sys.occupancy||summary.occupancyType||"—"}</td>
        </tr>
      </table>
      <div style="margin-bottom:20px"><span class="badge">${statusLbl}</span></div>

      ${chain?`<h2>Service Entrance Summary</h2>
      <div style="margin-bottom:16px">
        <div class="chain-box"><div class="chain-label">Demand</div><div class="chain-val">${chain.demandA.toFixed(1)} A</div><div class="chain-label">at ${chain.voltage}V</div></div>
        <span style="font-size:18px;color:#9ca3af;margin-right:12px">→</span>
        <div class="chain-box"><div class="chain-label">Min. Main Breaker</div><div class="chain-val">${chain.reqMainA} A</div><div class="chain-label">125% × demand</div></div>
        <span style="font-size:18px;color:#9ca3af;margin-right:12px">→</span>
        <div class="chain-box"><div class="chain-label">Service Wire</div><div class="chain-val">#${chain.reqWire} AWG</div><div class="chain-label">Cu 75°C</div></div>
        ${chain.reqAIC_kA?`<span style="font-size:18px;color:#9ca3af;margin-right:12px">→</span>
        <div class="chain-box"><div class="chain-label">Min. AIC</div><div class="chain-val">${chain.reqAIC_kA} kA</div><div class="chain-label">interrupt</div></div>`:""}
      </div>`:""}

      ${calcItems.length?`<h2>Calculator Results (${passes} pass · ${fails} fail)</h2>
      <table><tr><th>Check</th><th>Result</th><th>Detail</th><th>Status</th></tr>${calcRows}</table>`:""}

      ${findings.length?`<h2>AI Findings (${criticals.length} Critical · ${warnings.length} Warning · ${infos.length} Info)</h2>
      <table><tr><th>Severity</th><th>Category</th><th>Issue</th><th>Recommendation</th><th>PEC Ref.</th></tr>${findingRows}</table>`:""}

      <h2>PEE Sign-Off Checklist</h2>
      <table>
        <tr><th style="width:50%">Item</th><th style="width:15%">Code Reference</th><th style="width:8%">✓</th><th style="width:27%">Remarks / Stamp</th></tr>
        ${soRows}
      </table>

      <div class="sig-box">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px">
          <div>
            <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:700;margin-bottom:40px">Prepared by (Designer)</div>
            <div style="border-top:1px solid #111;padding-top:6px;font-size:11px;color:#6b7280">Signature over Printed Name · Date · PRC No.</div>
          </div>
          <div>
            <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:700;margin-bottom:40px">Reviewed by (PEE / RME)</div>
            <div style="border-top:1px solid #111;padding-top:6px;font-size:11px;color:#6b7280">Signature over Printed Name · Date · PRC No. · PTR No.</div>
          </div>
        </div>
      </div>

      <div class="footer">
        ⚠️ This is an AI-generated reference document. It must be independently reviewed, signed, and sealed by a duly licensed Professional Electrical Engineer (PEE) before submission to MERALCO, LGU, or any regulatory body. Buildify and its AI do not assume liability for errors or omissions.
      </div>
    </div>
    </body></html>`);
    w.document.close(); setTimeout(()=>w.print(),500);
  };

  // ── Screen render ────────────────────────────────────────────────────────────
  const noData = !checkerResult && !electricalData && !elecResults;

  if (noData) {
    return (
      <div style={{padding:"48px 24px",textAlign:"center",color:T.muted}}>
        <div style={{fontSize:40,marginBottom:12}}>📋</div>
        <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:8}}>No review data yet</div>
        <div style={{fontSize:13}}>Upload plans, run AI extraction, and click <strong style={{color:ACCENT}}>Run All Checks</strong> to generate your Review Summary Sheet.</div>
      </div>
    );
  }

  const statusColor = fails>0?"#ef4444":criticals.length>0||noInputs>0?"#f59e0b":"#22c55e";
  const statusLabel = fails>0?"NON-COMPLIANT":criticals.length>0?"COMPLIANT WITH WARNINGS":noInputs>0?"NEEDS REVIEW":"COMPLIANT";

  return (
    <div>
      {/* Sheet header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:18,fontWeight:900,color:T.text}}>📋 Review Summary Sheet</div>
          <div style={{fontSize:11,color:T.muted,marginTop:2}}>
            {summary.projectName||sys.projectName||"Electrical Project"} · {new Date().toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}
          </div>
        </div>
        <button onClick={exportReviewPDF}
          style={{display:"flex",alignItems:"center",gap:8,padding:"10px 22px",borderRadius:10,border:"none",
            background:`linear-gradient(135deg,${ACCENT},#e85520)`,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,
            boxShadow:"0 4px 14px rgba(255,107,43,0.35)"}}>
          🖨️ Print / Export PDF
        </button>
      </div>

      {/* Overall status */}
      <div style={{marginBottom:20,padding:"16px 20px",borderRadius:12,border:`2px solid ${statusColor}30`,background:`${statusColor}08`,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
        <div style={{fontSize:11,fontWeight:800,padding:"4px 14px",borderRadius:20,background:`${statusColor}20`,color:statusColor,border:`2px solid ${statusColor}40`}}>{statusLabel}</div>
        <div style={{display:"flex",gap:20}}>
          {criticals.length>0&&<span style={{fontSize:13,fontWeight:700,color:"#ef4444"}}>⚑ {criticals.length} Critical</span>}
          {warnings.length>0&&<span style={{fontSize:13,fontWeight:700,color:"#f59e0b"}}>⚠ {warnings.length} Warning</span>}
          {infos.length>0&&<span style={{fontSize:13,fontWeight:700,color:"#0696d7"}}>ℹ {infos.length} Info</span>}
          {calcItems.length>0&&<>
            <span style={{fontSize:13,fontWeight:700,color:"#22c55e"}}>✓ {passes} pass</span>
            {fails>0&&<span style={{fontSize:13,fontWeight:700,color:"#ef4444"}}>✗ {fails} fail</span>}
            {noInputs>0&&<span style={{fontSize:13,fontWeight:700,color:"#f59e0b"}}>⚠ {noInputs} needs input</span>}
          </>}
        </div>
      </div>

      {/* Project info */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginBottom:20}}>
        {[
          {l:"System Voltage",  v:sys.voltage?`${sys.voltage}V`:"—"},
          {l:"Phase",           v:sys.phases===3?"3-Phase":"1-Phase"},
          {l:"Occupancy",       v:sys.occupancy||summary.occupancyType||"—"},
          {l:"Main Breaker",    v:panel.mainBreaker?`${panel.mainBreaker} AT`:"—"},
          {l:"Circuits",        v:panel.circuits?.length||"—"},
          {l:"Bus Rating",      v:panel.busRating?`${panel.busRating}A`:"—"},
        ].map(b=>(
          <div key={b.l} style={{background:T.dim,borderRadius:10,padding:"12px 14px",border:`1px solid ${T.border}`}}>
            <div style={{fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>{b.l}</div>
            <div style={{fontSize:16,fontWeight:800,color:T.text,fontFamily:"monospace"}}>{b.v}</div>
          </div>
        ))}
      </div>

      {/* Service chain */}
      {chain&&(
        <div style={{marginBottom:20,padding:"16px 18px",background:"rgba(255,107,43,0.04)",border:"1px solid rgba(255,107,43,0.2)",borderRadius:12}}>
          <div style={{fontSize:11,fontWeight:700,color:ACCENT,textTransform:"uppercase",letterSpacing:"0.7px",marginBottom:12}}>⛓ Service Entrance Chain</div>
          <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",rowGap:8}}>
            {[
              {l:"DEMAND",v:`${chain.demandA.toFixed(1)} A`,s:`at ${chain.voltage}V`,c:"#ff6b2b"},
              {l:"MIN. BREAKER",v:`${chain.reqMainA} A`,s:"125%×demand",c:"#22c55e"},
              {l:"SERVICE WIRE",v:`#${chain.reqWire} AWG`,s:"Cu 75°C",c:"#8b5cf6"},
              ...(chain.reqAIC_kA?[{l:"MIN. AIC",v:`${chain.reqAIC_kA} kAIC`,s:"interrupt",c:"#f59e0b"}]:[]),
            ].map((box,i,arr)=>(
              <React.Fragment key={i}>
                <div style={{background:`${box.c}12`,border:`1px solid ${box.c}40`,borderRadius:9,padding:"8px 14px",minWidth:108,textAlign:"center"}}>
                  <div style={{fontSize:10,color:box.c,fontWeight:700,marginBottom:3}}>{box.l}</div>
                  <div style={{fontSize:16,fontWeight:900,color:box.c,fontFamily:"monospace"}}>{box.v}</div>
                  <div style={{fontSize:10,color:T.muted,marginTop:2}}>{box.s}</div>
                </div>
                {i<arr.length-1&&<div style={{fontSize:16,color:T.muted,padding:"0 4px"}}>→</div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Calculator results table */}
      {calcItems.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:10}}>Calculator Results</div>
          <div style={{background:T.card,borderRadius:12,border:`1px solid ${T.border}`,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:T.dim}}>
                  {["Check","Result","Detail","Status"].map(h=>(
                    <th key={h} style={{padding:"10px 14px",color:T.muted,fontWeight:700,fontSize:11,textAlign:"left",borderBottom:`1px solid ${T.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calcItems.map(item=>(
                  <CalcResultRow key={item.tool} item={item} T={T} CALC_LABELS={CALC_LABELS}/>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Findings summary */}
      {findings.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:10}}>AI Findings ({findings.length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {[...criticals,...warnings,...infos].map(f=>{
              const col={CRITICAL:"#ef4444",WARNING:"#f59e0b",INFO:"#0696d7"}[f.severity]||"#0696d7";
              return(
                <div key={f.id} style={{background:T.card,border:`1px solid ${col}25`,borderRadius:10,padding:"12px 16px",display:"flex",gap:12,alignItems:"flex-start"}}>
                  <span style={{fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:4,background:`${col}15`,color:col,border:`1px solid ${col}30`,flexShrink:0,marginTop:2}}>{f.severity}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:3}}>{f.title}</div>
                    <div style={{fontSize:11,color:"#22c55e"}}>✓ {f.recommendation}</div>
                    <div style={{fontSize:10,color:"rgba(255,107,43,0.6)",marginTop:3,fontWeight:600}}>{f.pecReference} · {f.category}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PEE sign-off checklist */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.6px"}}>PEE Sign-Off Checklist</div>
          <span style={{fontSize:11,fontWeight:700,color:signedCount===SIGNOFF.length?"#22c55e":ACCENT}}>{signedCount}/{SIGNOFF.length} items confirmed</span>
        </div>
        <div style={{background:T.card,borderRadius:12,border:`1px solid ${T.border}`,overflow:"hidden"}}>
          {SIGNOFF.map((s,i)=>(
            <div key={s.key} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",borderBottom:i<SIGNOFF.length-1?`1px solid ${T.border}`:"none",
              background:signoff[s.key]?"rgba(34,197,94,0.04)":"transparent",transition:"background 0.15s"}}>
              <div onClick={()=>setSignoff(p=>({...p,[s.key]:!p[s.key]}))}
                style={{width:20,height:20,borderRadius:5,border:`2px solid ${signoff[s.key]?"#22c55e":T.muted}`,
                  background:signoff[s.key]?"#22c55e":"transparent",cursor:"pointer",flexShrink:0,
                  display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                {signoff[s.key]&&<span style={{color:"#fff",fontSize:12,fontWeight:800}}>✓</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:signoff[s.key]?600:400,color:signoff[s.key]?T.text:T.muted,transition:"all 0.15s"}}>{s.label}</div>
              </div>
              <span style={{fontSize:10,color:"rgba(255,107,43,0.5)",fontWeight:600,flexShrink:0}}>{s.ref}</span>
            </div>
          ))}
        </div>
        {signedCount===SIGNOFF.length&&(
          <div style={{marginTop:12,padding:"12px 18px",background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:10,fontSize:12,color:"#22c55e",fontWeight:700}}>
            ✓ All checklist items confirmed — ready for PEE signature and MERALCO/LGU submission.
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div style={{padding:"12px 16px",background:T.dim,borderRadius:10,fontSize:11,color:T.muted,lineHeight:1.6,borderLeft:`3px solid rgba(255,107,43,0.4)`}}>
        ⚠️ This is an AI-generated reference document. It must be independently reviewed, signed, and sealed by a duly licensed Professional Electrical Engineer (PEE) before submission to MERALCO, LGU, or any regulatory body.
      </div>
    </div>
  );
}

export default ReviewSummarySheet;
