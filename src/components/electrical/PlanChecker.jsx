import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon, BuildifyLogo } from "../shared/Icon.jsx";
import { callAI, toBase64, compressImage, getKey, repairJSON, fmtSize } from "../../utils/callAI.js";
import {PEC_SYSTEM_PROMPT, SEV_CFG, CL_LABELS, exportPDF, exportRevisionPDF, STATUS_COL} from "./constants.jsx";
import { Card, Label } from "../../theme.jsx";
import { addHistoryEntry } from "../../utils/history.js";

function NoKeyBanner() {
  const hasKey = getKey().startsWith("sk-");
  if (hasKey) return null;
  return (
    <div style={{background:"rgba(245,158,11,0.08)",border:"1.5px solid rgba(245,158,11,0.35)",borderRadius:12,padding:"12px 18px",marginBottom:18,display:"flex",alignItems:"center",gap:12}}>
      <span style={{fontSize:22}}>🔑</span>
      <div>
        <div style={{fontWeight:700,fontSize:13,color:"#f59e0b",marginBottom:2}}>API Key Required</div>
        <div style={{fontSize:12,color:"#a3a3a3",lineHeight:1.5}}>
          Paste your Anthropic API key into the <strong style={{color:"#f59e0b"}}>🔑 field in the top navigation bar</strong> and press <strong>Enter</strong> or click <strong>Save</strong>. The key starts with <code style={{background:"rgba(255,255,255,0.08)",padding:"1px 5px",borderRadius:3}}>sk-ant-</code>.
        </div>
      </div>
    </div>
  );
}

function PlanChecker({ apiKey, externalResult=null, onResultChange=null, onDataExtracted=null, onVerifyFinding=null }) {
  const [files, setFiles]   = useState([]);
  const [busy, setBusy]     = useState(false);
  const [busyMsg, setBusyMsg] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError]         = useState(null);
  const [drag, setDrag]           = useState(false);
  const [tab, setTab]             = useState("all");
  const [open, setOpen]           = useState({});
  const [checked, setChecked]     = useState({});
  const [corrections, setCorrections] = useState(null);
  const [correcting, setCorrecting]   = useState(false);
  const [revNum, setRevNum]           = useState(1);
  const ref = useRef(null);
  const tick = () => new Promise(r => setTimeout(r, 0));

  const addFiles = useCallback(fs=>{
    setFiles(p=>[...p,...Array.from(fs).map(f=>({file:f,id:Math.random().toString(36).slice(2),name:f.name,size:f.size,type:f.type||"application/octet-stream"}))]);
    setError(null); // preserve existing result when adding more files
  },[]);

  // Sync external result → local state (handles both navigation and session restore)
  useEffect(()=>{ setResult(externalResult||null); if(externalResult){ setTab("all"); setOpen({}); setChecked({}); } },[externalResult]);

  const run = async () => {
    if(!files.length) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const blocks=[];
      for(let i=0;i<files.length;i++){
        const fo=files[i];
        setBusyMsg(`📂 Reading file ${i+1} of ${files.length}: ${fo.name}…`); await tick();
        const b64 = fo.type.startsWith("image/") ? (setBusyMsg(`🗜️ Compressing ${fo.name}…`), await tick(), await compressImage(fo.file)) : await toBase64(fo.file);
        if(fo.type.startsWith("image/")) { blocks.push({type:"image",source:{type:"base64",media_type:"image/jpeg",data:b64}}); blocks.push({type:"text",text:`[Image: ${fo.name}]`}); }
        else if(fo.type==="application/pdf") { blocks.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}}); blocks.push({type:"text",text:`[PDF: ${fo.name}]`}); }
        else blocks.push({type:"text",text:`[File: ${fo.name}]`});
      }
      blocks.push({type:"text",text:`You are reviewing these electrical plans as a licensed PEE.

STEP 1 — READ: Scan every page. Note voltage system, load schedule, conductor sizes, breaker ratings, panel details.
STEP 2 — MISSING DATA: Identify every required schedule, calculation, or spec that is absent from the plans.
STEP 3 — CHECK: For each PEC article in your checklist, state PASS, FAIL, or CANNOT VERIFY with reason.
STEP 4 — EXTRACT: Populate the extracted field with all numerical data visible in the plans for use in calculators.
STEP 5 — OUTPUT: Return complete JSON per the schema. Include ALL violations. Do not truncate.

Return only valid JSON — no markdown, no preamble.`});
      setBusyMsg("🤖 AI is checking PEC 2017 compliance…"); await tick();
      const data = await callAI({ apiKey, system:PEC_SYSTEM_PROMPT, messages:[{role:"user",content:blocks}] });
      const raw = data.content?.map(b=>b.text||"").join("");
      const parsed = repairJSON(raw.replace(/```json|```/g,"").trim());
      if(!parsed) throw new Error("Could not parse AI response. Try uploading fewer pages or a smaller file.");
      setResult(parsed);
      // ── Lift result to parent (ElecCode) so Review Sheet and Intelligence Panel receive it ──
      if (onResultChange) onResultChange(parsed);
      if (onDataExtracted && parsed.extracted) onDataExtracted(parsed.extracted);
      setOpen({}); setTab("all"); setChecked({}); setCorrections(null);
      addHistoryEntry({ tool:"electrical", module:"electrical", projectName:parsed?.summary?.projectName||"Electrical Check", meta:{ status:parsed?.summary?.overallStatus, findings:(parsed?.findings?.length||0), summary:parsed?.summary?.analysisNotes||"" } });
      // Merge into existing session — preserve electricalData and other fields
      try {
        const cur = JSON.parse(localStorage.getItem("buildify_session_electrical") || "{}");
        localStorage.setItem("buildify_session_electrical", JSON.stringify({ ...cur, checkerResult: parsed, _savedAt: new Date().toISOString() }));
      } catch(e) { console.warn("Session save failed", e); }
    } catch(e) { setError(e.message||"Analysis failed."); }
    finally { setBusy(false); setBusyMsg(""); }
  };

  const findings = result?.findings||[];
  const filtered = tab==="all" ? findings : findings.filter(f=>f.severity===tab);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const allChecked = findings.length > 0 && findings.every(f => checked[f.id]);

  const toggleAll = () => {
    if (allChecked) setChecked({});
    else { const all={}; findings.forEach(f=>all[f.id]=true); setChecked(all); }
  };

  const generateCorrections = async () => {
    const selected = findings.filter(f => checked[f.id]);
    if (!selected.length) return;
    setCorrecting(true); setCorrections(null);
    try {
      const hdrs = {"Content-Type":"application/json"};
      if(apiKey) hdrs["x-api-key"]=apiKey;
      const prompt = `You are a licensed PEE. For each finding below, generate specific drafting correction instructions for a CAD draftsman.

Findings to correct:
${selected.map((f,i)=>`${i+1}. [${f.severity}] ${f.title} — ${f.description} (${f.pecReference})`).join("\n")}

Respond ONLY as valid JSON array (no markdown):
[{"id":${selected[0]?.id},"title":"...","severity":"...","description":"...","pecReference":"...","recommendation":"...","correctedValues":"Specific corrected value e.g. Change wire from #12 AWG to #10 AWG, upgrade breaker from 20A to 30A","draftingInstruction":"Exact instruction for draftsman e.g. On Sheet E-2, Panel Schedule, revise circuit 3 wire size notation from #12 AWG THWN to #10 AWG THWN. Add revision cloud around affected area."}]

Be very specific with corrected values and drafting instructions. Reference typical drawing sheet names (E-1, E-2, etc.).`;

      const data = await callAI({ apiKey, messages:[{role:"user",content:prompt}], max_tokens:4000 });
      const raw = data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(raw);
      setCorrections(parsed);
    } catch(e) { alert("Could not generate corrections: "+e.message); }
    finally { setCorrecting(false); }
  };

  return (
    <div>
      <NoKeyBanner/>
      {/* Drop zone */}
      <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files)}}
        onClick={()=>ref.current?.click()}
        style={{ border:`2px dashed ${drag?T.accent:T.border}`, borderRadius:16, padding:"40px 24px", textAlign:"center", cursor:"pointer", background:drag?T.accentDim:"rgba(255,255,255,0.01)", transition:"all 0.2s", marginBottom:20 }}>
        <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.dwg,.dxf" onChange={e=>addFiles(e.target.files)} style={{display:"none"}}/>
        <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
        <div style={{ fontWeight:700, fontSize:16, color:T.text, marginBottom:6 }}>Drop your electrical plans here</div>
        <div style={{ color:T.muted, fontSize:13, marginBottom:16 }}>PDF drawings · JPG / PNG images · Excel load schedules</div>
        <div style={{ display:"inline-block", background:`linear-gradient(135deg,${T.accent},#f97316)`, color:"#000", fontWeight:700, padding:"9px 22px", borderRadius:10, fontSize:14 }}>Choose Files</div>
      </div>

      {/* File chips */}
      {files.length>0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
          {files.map(fo=>(
            <div key={fo.id} style={{ background:T.dim, border:`1px solid ${T.border}`, borderRadius:8, padding:"7px 10px", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:18 }}>{fo.type.startsWith("image")?"🖼️":fo.type==="application/pdf"?"📄":"📎"}</span>
              <div>
                <div style={{ fontSize:12, color:T.text, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{fo.name}</div>
                <div style={{ fontSize:10, color:T.muted }}>{fmtSize(fo.size)}</div>
              </div>
              <button onClick={()=>setFiles(p=>p.filter(f=>f.id!==fo.id))} style={{ background:"rgba(239,68,68,0.12)", border:"none", color:T.danger, width:22, height:22, borderRadius:5, cursor:"pointer", fontSize:12 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {files.length>0 && (
        <button onClick={run} disabled={busy} style={{ width:"100%", background:busy?"rgba(245,158,11,0.2)":`linear-gradient(135deg,${T.accent},#f97316)`, border:"none", color:busy?"#666":"#000", fontWeight:700, fontSize:15, padding:"14px", borderRadius:12, cursor:busy?"not-allowed":"pointer", marginBottom:20, boxShadow:busy?"none":"0 6px 24px rgba(245,158,11,0.25)", transition:"all 0.2s" }}>
          {busy ? (busyMsg || "⚙️ Analyzing…") : `⚡ Run Full Compliance Check  (${files.length} file${files.length>1?"s":""})`}
        </button>
      )}

      {error && <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"12px 16px", marginBottom:20, color:T.danger, fontSize:14 }}>⚠️ {error}</div>}

      {result?.summary && (
        <div style={{ animation:"fadeIn 0.35s ease" }}>
          {/* Summary card */}
          <Card style={{ marginBottom:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:20, alignItems:"start" }}>
              <div>
                <div style={{ fontSize:11, color:T.muted, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:6 }}>Compliance Assessment</div>
                <div style={{ fontSize:22, fontWeight:800, color:T.text, marginBottom:6 }}>{result.summary.projectName}</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                  {[result.summary.occupancyType, result.summary.fileType].filter(Boolean).map(t=>(
                    <span key={t} style={{ background:T.dim, padding:"2px 10px", borderRadius:20, fontSize:11, color:T.muted }}>{t}</span>
                  ))}
                </div>
                <div style={{ color:T.muted, fontSize:13, marginBottom:18, lineHeight:1.6 }}>{result.summary.analysisNotes}</div>
                <div style={{ display:"flex", gap:24 }}>
                  {[{l:"Critical",c:result.summary.criticalCount,col:"#ef4444"},{l:"Warnings",c:result.summary.warningCount,col:"#f59e0b"},{l:"Info",c:result.summary.infoCount,col:"#3b82f6"}].map(x=>(
                    <div key={x.l} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:28, fontWeight:800, color:x.col, lineHeight:1 }}>{x.c}</div>
                      <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{x.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"flex-end" }}>
                <div style={{ background:`${STATUS_COL[result.summary.overallStatus]}14`, border:`2px solid ${STATUS_COL[result.summary.overallStatus]}44`, borderRadius:12, padding:"10px 18px", textAlign:"center", minWidth:160 }}>
                  <div style={{ fontSize:10, color:T.muted, marginBottom:4, letterSpacing:"0.5px" }}>OVERALL STATUS</div>
                  <div style={{ fontSize:13, fontWeight:800, color:STATUS_COL[result.summary.overallStatus] }}>{result.summary.overallStatus}</div>
                </div>
                <button onClick={()=>exportPDF(result,findings)} style={{ background:`linear-gradient(135deg,${T.accent},#f97316)`, border:"none", color:"#000", fontWeight:700, padding:"8px 16px", borderRadius:10, cursor:"pointer", fontSize:13 }}>📄 Export PDF</button>
              </div>
            </div>
          </Card>

          {/* Checklist */}
          <Card style={{ marginBottom:16 }}>
            <Label>PEC Compliance Checklist</Label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(170px, 1fr))", gap:8, marginTop:10 }}>
              {Object.entries(CL_LABELS).map(([k,info])=>{
                const v=result.checklist?.[k];
                const vStr = v===null||v===undefined ? null : (typeof v==="boolean" ? (v?"PASS":"FAIL") : String(v));
                const col = vStr===null?T.muted : vStr==="PASS"?T.success : vStr==="CANNOT VERIFY"||vStr==="NOT APPLICABLE"?"#f59e0b" : T.danger;
                const icon = vStr===null?"—" : vStr==="PASS"?"✓" : vStr==="CANNOT VERIFY"?"?" : vStr==="NOT APPLICABLE"?"N/A" : "✗";
                return (
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:10, background:T.dim, borderRadius:8, padding:"8px 12px" }}>
                    <span style={{ color:col, fontWeight:800, fontSize:16, width:18 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize:12, color:vStr===null?T.muted:T.text }}>{info.l}</div>
                      <div style={{ fontSize:10, color:col, fontWeight:600 }}>{vStr||"—"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Findings */}
          {findings.length>0 && (
            <div>
              {/* Filter tabs + Select All */}
              <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {["all","CRITICAL","WARNING","INFO"].map(t=>{
                    const cnt=t==="all"?findings.length:findings.filter(f=>f.severity===t).length;
                    const active=tab===t;
                    return <button key={t} onClick={()=>setTab(t)} style={{ padding:"7px 16px", borderRadius:8, border:`1.5px solid ${active?T.accent:T.border}`, background:active?T.accentDim:"transparent", color:active?T.accent:T.muted, cursor:"pointer", fontSize:12, fontWeight:700, transition:"all 0.15s" }}>{t==="all"?"All":t} ({cnt})</button>;
                  })}
                </div>
                <button onClick={toggleAll} style={{ padding:"7px 14px", borderRadius:8, border:`1.5px solid ${T.border}`, background:"transparent", color:T.muted, cursor:"pointer", fontSize:12, fontWeight:600 }}>
                  {allChecked ? "☑ Deselect All" : "☐ Select All"}
                </button>
              </div>

              {/* Finding cards with checkboxes */}
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
                {filtered.map(f=>{
                  const cfg=SEV_CFG[f.severity]||SEV_CFG.INFO;
                  const isOpen=open[f.id];
                  const isChecked=!!checked[f.id];
                  return (
                    <div key={f.id} style={{ background:isChecked?`${cfg.bg}`:"rgba(255,255,255,0.01)", border:`1.5px solid ${isChecked?cfg.border:T.border}`, borderRadius:12, overflow:"hidden", transition:"all 0.15s" }}>
                      <div style={{ padding:"13px 18px", display:"flex", alignItems:"flex-start", gap:12 }}>
                        {/* Checkbox */}
                        <div
                          onClick={()=>setChecked(p=>({...p,[f.id]:!p[f.id]}))}
                          style={{ width:20, height:20, borderRadius:5, border:`2px solid ${isChecked?cfg.badge:T.muted}`, background:isChecked?cfg.badge:"transparent", cursor:"pointer", flexShrink:0, marginTop:2, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}
                        >
                          {isChecked && <span style={{ color:"#fff", fontSize:12, fontWeight:800, lineHeight:1 }}>✓</span>}
                        </div>
                        {/* Content — click to expand */}
                        <div style={{ flex:1, minWidth:0, cursor:"pointer" }} onClick={()=>setOpen(p=>({...p,[f.id]:!p[f.id]}))}>
                          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:4, alignItems:"center" }}>
                            <span style={{ background:cfg.badge, color:"#fff", fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:4 }}>{f.severity}</span>
                            {f.confidence && <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:4,
                              background:f.confidence==="HIGH"?"rgba(22,163,74,0.15)":f.confidence==="LOW"?"rgba(239,68,68,0.12)":"rgba(234,179,8,0.12)",
                              color:f.confidence==="HIGH"?"#16a34a":f.confidence==="LOW"?"#ef4444":"#ca8a04",
                              border:`1px solid ${f.confidence==="HIGH"?"rgba(22,163,74,0.3)":f.confidence==="LOW"?"rgba(239,68,68,0.3)":"rgba(234,179,8,0.3)"}`
                            }}>{f.confidence==="HIGH"?"● HIGH CONFIDENCE":f.confidence==="LOW"?"◌ LOW CONFIDENCE":"◑ MEDIUM CONF."}</span>}
                            <span style={{ fontSize:11, color:T.muted, fontFamily:"monospace" }}>{f.pecReference}</span>
                            <span style={{ fontSize:11, color:T.muted, background:"rgba(255,255,255,0.04)", padding:"1px 8px", borderRadius:4 }}>{f.category}</span>
                          </div>
                          <div style={{ fontWeight:700, fontSize:14, color:T.text }}>{f.title}</div>
                        </div>
                        <span style={{ color:T.muted, fontSize:12, marginTop:2, flexShrink:0, cursor:"pointer" }} onClick={()=>setOpen(p=>({...p,[f.id]:!p[f.id]}))}>{isOpen?"▲":"▼"}</span>
                      </div>
                      {isOpen && (
                        <div style={{ padding:"0 18px 16px 50px", borderTop:`1px solid ${cfg.border}` }}>
                          <div style={{ paddingTop:12, display:"flex", flexDirection:"column", gap:10 }}>
                            <div><Label>Finding</Label><div style={{ fontSize:13, color:T.muted, lineHeight:1.6 }}>{f.description}</div></div>
                            <div><Label>Recommendation</Label><div style={{ fontSize:13, color:T.success, lineHeight:1.6 }}>✓ {f.recommendation}</div></div>
                            {f.codeBasis && <div style={{ background:"rgba(0,0,0,0.2)", borderLeft:`3px solid ${cfg.border}`, padding:"10px 14px", borderRadius:"0 8px 8px 0", fontSize:12, color:T.muted, fontStyle:"italic", lineHeight:1.5 }}>{f.codeBasis}</div>}
                          {onVerifyFinding && (()=>{
                            const txt=(f.title+" "+f.description+" "+f.recommendation).toLowerCase();
                            const tool=
                              f.category==="Wire Sizing"?"vdrop":
                              f.category==="Overcurrent"||f.category==="Short Circuit"?"fault":
                              f.category==="Load Calc"?"load":
                              f.category==="Panelboard"?"panel":
                              f.category==="Branch Circuits"?"branch80":
                              f.category==="Grounding"?"gec":
                              f.category==="Conduit Fill"?"conduit":
                              f.category==="Ampacity"?"ampacity":
                              /voltage.?drop|wire.?size|conductor.?size|#\d+\s*awg/.test(txt)?"vdrop":
                              /fault.?current|short.?circuit|interrupt|kaic/.test(txt)?"fault":
                              /load.?calc|total.?demand|demand.?load|kva/.test(txt)?"load":
                              /main.?breaker|circuit.?break|panelboard/.test(txt)?"panel":
                              /80%|continuous.?load/.test(txt)?"branch80":
                              /ground|gec|earth/.test(txt)?"gec":
                              /conduit|raceway/.test(txt)?"conduit":null;
                            if(!tool)return null;
                            const LBL={vdrop:"Voltage Drop",fault:"Short Circuit",load:"Load Calc",panel:"Panel Schedule",conduit:"Conduit Fill",ampacity:"Ampacity",branch80:"Branch 80% Check",gec:"Grounding (GEC)"};
                            return(
                              <button onClick={()=>onVerifyFinding(f,tool)}
                                style={{marginTop:12,display:"flex",alignItems:"center",gap:8,padding:"8px 18px",
                                  borderRadius:10,border:"1.5px solid rgba(255,107,43,0.35)",
                                  background:"rgba(255,107,43,0.07)",color:"#ff6b2b",cursor:"pointer",
                                  fontSize:12,fontWeight:700,transition:"all 0.15s",width:"fit-content"}}
                                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,107,43,0.16)";e.currentTarget.style.borderColor="#ff6b2b";}}
                                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,107,43,0.07)";e.currentTarget.style.borderColor="rgba(255,107,43,0.35)";}}>
                                <Icon name={tool==="vdrop"?"vdrop":tool==="fault"?"fault":tool==="load"?"load":tool==="panel"?"panel":"electrical"} size={13} color="#ff6b2b"/>
                                Verify in {LBL[tool]||tool} Calculator →
                              </button>
                            );
                          })()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Correction action bar */}
              {checkedCount > 0 && (
                <div style={{ background:T.accentDim, border:`1.5px solid rgba(245,158,11,0.3)`, borderRadius:12, padding:"16px 20px", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, animation:"fadeIn 0.2s ease" }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:T.accent }}>{checkedCount} error{checkedCount>1?"s":""} selected for correction</div>
                    <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>AI will generate specific drafting instructions for each selected item</div>
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <Label>Revision No.</Label>
                      <input type="number" value={revNum} min={1} max={99} onChange={e=>setRevNum(+e.target.value)} style={{ width:60, background:"#0f1117", border:`1.5px solid ${T.border}`, borderRadius:8, padding:"6px 10px", color:T.text, fontSize:14, fontWeight:700, outline:"none", textAlign:"center" }}/>
                    </div>
                    <button onClick={generateCorrections} disabled={correcting} style={{ background:correcting?"rgba(245,158,11,0.3)":`linear-gradient(135deg,${T.accent},#f97316)`, border:"none", color:correcting?"#666":"#000", fontWeight:700, padding:"10px 20px", borderRadius:10, cursor:correcting?"not-allowed":"pointer", fontSize:13, transition:"all 0.2s" }}>
                      {correcting ? "⚙️ Generating…" : "🤖 Generate Corrections"}
                    </button>
                  </div>
                </div>
              )}

              {/* Corrections result panel */}
              {corrections && (
                <div style={{ background:"rgba(16,185,129,0.05)", border:"1.5px solid rgba(16,185,129,0.25)", borderRadius:12, padding:20, marginBottom:16, animation:"fadeIn 0.3s ease" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:15, color:T.success }}>✅ Corrections Generated — Rev {revNum}</div>
                      <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{corrections.length} drafting instruction{corrections.length>1?"s":""} ready for your draftsman</div>
                    </div>
                    <button onClick={()=>exportRevisionPDF(result, corrections, revNum)} style={{ background:`linear-gradient(135deg,${T.success},#059669)`, border:"none", color:"#fff", fontWeight:700, padding:"10px 20px", borderRadius:10, cursor:"pointer", fontSize:13, boxShadow:"0 4px 14px rgba(16,185,129,0.3)" }}>
                      📄 Download Revision PDF
                    </button>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {corrections.map((c,i)=>(
                      <div key={c.id||i} style={{ background:T.dim, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
                          <span style={{ background:"#1f2937", color:T.accent, fontSize:11, fontWeight:800, padding:"2px 10px", borderRadius:4, letterSpacing:"0.5px" }}>REV-{String(i+1).padStart(2,"0")}</span>
                          <span style={{ fontSize:12, fontWeight:700, color:T.text }}>{c.title}</span>
                          <span style={{ fontSize:11, color:T.muted, fontFamily:"monospace" }}>{c.pecReference}</span>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                          <div style={{ background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:8, padding:"10px 12px" }}>
                            <div style={{ fontSize:10, fontWeight:700, color:T.accent, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>📐 Corrected Value</div>
                            <div style={{ fontSize:13, color:T.text, lineHeight:1.6 }}>{c.correctedValues||c.recommendation}</div>
                          </div>
                          <div style={{ background:"rgba(16,185,129,0.07)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:8, padding:"10px 12px" }}>
                            <div style={{ fontSize:10, fontWeight:700, color:T.success, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>✏️ Drafting Instruction</div>
                            <div style={{ fontSize:13, color:T.text, lineHeight:1.6 }}>{c.draftingInstruction||"Apply correction as indicated"}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div style={{ marginTop:20, padding:"10px 16px", background:T.dim, borderRadius:10, fontSize:12, color:T.muted, lineHeight:1.5 }}>
            ⚠️ AI-generated report for reference only. All plans must be reviewed and stamped by a licensed PEE before submission to MERALCO, LGU, or DPWH.
          </div>
        </div>
      )}

      {!files.length && !result && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10, marginTop:4 }}>
          {[{i:"🏠",t:"Residential",d:"House wiring, circuits, panels"},{i:"🏢",t:"Commercial",d:"Office, mall, GFCI/AFCI"},{i:"🔥",t:"FSIC / Fire Code",d:"Emergency lights, exit signs"},{i:"🌱",t:"Green Building",d:"LPD, sub-metering"}].map(x=>(
            <Card key={x.t} style={{ textAlign:"center", padding:18 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{x.i}</div>
              <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:4 }}>{x.t}</div>
              <div style={{ fontSize:11, color:T.muted, lineHeight:1.5 }}>{x.d}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STRUCTURAL CODE DATA ────────────────────────────────────────────────────


// ─── POST-EXTRACTION DATA VALIDATOR ──────────────────────────────────────────
// Validates and sanitizes ALL extracted structural data after AI returns it.
// Catches unit errors, out-of-range values, and suspicious data.
// Returns { data: sanitizedData, warnings: string[] }

export { NoKeyBanner };
export default PlanChecker;
