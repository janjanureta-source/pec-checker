import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { callAI, toBase64, compressImage, getKey, repairJSON } from "../../utils/callAI.js";
import { NPC_SYSTEM_PROMPT, SC} from "./constants.jsx";
import { Card, Label } from "../../theme.jsx";
import { addHistoryEntry } from "../../utils/history.js";
import { NoKeyBanner } from "../electrical/PlanChecker.jsx";

function PlumbingChecker({ apiKey }) {
  const [files,setFiles]=useState([]);
  const [result,setResult]=useState(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState(null);
  const [drag,setDrag]=useState(false);
  const [tab,setTab]=useState("all");
  const [open,setOpen]=useState({});
  const [checked,setChecked]=useState({});
  const [corrections,setCorrections]=useState(null);
  const [correcting,setCorrecting]=useState(false);
  const [revNum,setRevNum]=useState(1);
  const ref=useRef(null);
  const addFiles=useCallback(fs=>{setFiles(p=>[...p,...Array.from(fs).map(f=>({file:f,id:Math.random().toString(36).slice(2),name:f.name,size:f.size,type:f.type||"application/octet-stream"}))]);setResult(null);setError(null);},[]);
  const [busyMsg,setBusyMsg]=useState("");
  const tick=()=>new Promise(r=>setTimeout(r,0));
  const run=async()=>{
    if(!files.length)return;
    setBusy(true);setError(null);setResult(null);
    try{
      const blocks=[];
      for(let i=0;i<files.length;i++){
        const fo=files[i];
        setBusyMsg(`📂 Reading ${i+1}/${files.length}: ${fo.name}…`);await tick();
        const b64=fo.type.startsWith("image/")?(setBusyMsg(`🗜️ Compressing ${fo.name}…`),await tick(),await compressImage(fo.file)):await toBase64(fo.file);
        if(fo.type.startsWith("image/")){blocks.push({type:"image",source:{type:"base64",media_type:"image/jpeg",data:b64}});blocks.push({type:"text",text:`[Image: ${fo.name}]`});}
        else if(fo.type==="application/pdf"){blocks.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}});blocks.push({type:"text",text:`[PDF: ${fo.name}]`});}
      }
      blocks.push({type:"text",text:`You are reviewing these sanitary/plumbing plans as a licensed Sanitary Engineer.

STEP 1 — READ: Scan every page. Note building type, fixture count, pipe sizes, riser diagrams, and isometric drawings.
STEP 2 — MISSING DATA: Identify every required schedule, riser diagram, or spec absent from the plans.
STEP 3 — CHECK: For each NPC section in your checklist, state PASS, FAIL, or CANNOT VERIFY with reason.
STEP 4 — OUTPUT: Return complete JSON per the schema. Include ALL violations. Do not truncate.

Return only valid JSON — no markdown, no preamble.`});
      setBusyMsg("🤖 AI is checking NPC 2000 compliance…");await tick();
      const data=await callAI({ apiKey, system:NPC_SYSTEM_PROMPT, messages:[{role:"user",content:blocks}] });
      const raw=data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      let parsed;try{parsed=JSON.parse(raw);}catch{throw new Error("Could not parse AI response.");}
      setResult(parsed);
      if(onResultChange) onResultChange(parsed);setOpen({});setTab("all");setChecked({});setCorrections(null);
      addHistoryEntry({ tool:"plumbing", module:"sanitary", projectName:parsed?.summary?.projectName||"Plumbing Check", meta:{ status:parsed?.summary?.overallStatus, findings:(parsed?.findings?.length||0), summary:parsed?.summary?.analysisNotes||"" } });
      // Direct save — no React state, no callbacks, always works
      try { localStorage.setItem("buildify_session_sanitary", JSON.stringify({ checkerResult: parsed, _savedAt: new Date().toISOString(), _module: "sanitary", userId: "local" })); } catch(e) { console.warn("Session save failed", e); }
    }catch(e){setError(e.message||"Analysis failed.");}finally{setBusy(false);setBusyMsg("");}
  };
  const findings=result?.findings||[];
  const filtered=tab==="all"?findings:findings.filter(f=>f.severity===tab);
  const checkedCount=Object.values(checked).filter(Boolean).length;
  const allChecked=findings.length>0&&findings.every(f=>checked[f.id]);
  const toggleAll=()=>{if(allChecked)setChecked({});else{const a={};findings.forEach(f=>a[f.id]=true);setChecked(a);}};
  const generateCorrections=async()=>{
    const selected=findings.filter(f=>checked[f.id]);if(!selected.length)return;
    setCorrecting(true);setCorrections(null);
    try{
      const hdrs={"Content-Type":"application/json"};if(apiKey)hdrs["x-api-key"]=apiKey;
      const prompt=`You are a licensed Sanitary Engineer. For each finding, generate specific NPC 2000 correction instructions.\nFindings:\n${selected.map((f,i)=>`${i+1}. [${f.severity}] ${f.title} — ${f.description} (${f.npcReference})`).join("\n")}\nRespond ONLY as valid JSON array: [{"id":1,"title":"...","severity":"...","description":"...","npcReference":"...","recommendation":"...","correctedValues":"specific corrected value e.g. Increase drain from 50mm to 75mm","draftingInstruction":"exact drafting instruction with sheet reference"}]`;
      const data=await callAI({ apiKey, messages:[{role:"user",content:prompt}], max_tokens:4000 });
      const raw=data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      setCorrections(JSON.parse(raw));
    }catch(e){alert("Could not generate corrections: "+e.message);}finally{setCorrecting(false);}
  };
  const STATUS_COL={"NON-COMPLIANT":"#dc2626","COMPLIANT WITH WARNINGS":"#d97706","COMPLIANT":"#16a34a"};
  return (
    <div>
      <NoKeyBanner/>
      <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files)}} onClick={()=>ref.current?.click()} style={{border:`2px dashed ${drag?SC:T.border}`,borderRadius:16,padding:"40px 24px",textAlign:"center",cursor:"pointer",background:drag?"rgba(16,185,129,0.05)":"rgba(255,255,255,0.01)",transition:"all 0.2s",marginBottom:20}}>
        <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e=>addFiles(e.target.files)} style={{display:"none"}}/>
        <div style={{fontSize:40,marginBottom:12}}>🚿</div>
        <div style={{fontWeight:700,fontSize:16,color:T.text,marginBottom:6}}>Drop plumbing/sanitary plans here</div>
        <div style={{color:T.muted,fontSize:13,marginBottom:16}}>PDF drawings · JPG / PNG images</div>
        <div style={{display:"inline-block",background:`linear-gradient(135deg,${SC},#059669)`,color:"#fff",fontWeight:700,padding:"9px 22px",borderRadius:10,fontSize:14}}>Choose Files</div>
      </div>
      {files.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>{files.map(fo=><div key={fo.id} style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 10px",display:"flex",alignItems:"center",gap:8}}><span>{fo.type.startsWith("image")?"🖼️":"📄"}</span><div style={{fontSize:12,color:T.text,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fo.name}</div><button onClick={()=>setFiles(p=>p.filter(f=>f.id!==fo.id))} style={{background:"rgba(239,68,68,0.12)",border:"none",color:T.danger,width:22,height:22,borderRadius:5,cursor:"pointer",fontSize:12}}>✕</button></div>)}</div>}
      {files.length>0&&<button onClick={run} disabled={busy} style={{width:"100%",background:busy?`rgba(16,185,129,0.2)`:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:busy?"#666":"#fff",fontWeight:700,fontSize:15,padding:"14px",borderRadius:12,cursor:busy?"not-allowed":"pointer",marginBottom:20,transition:"all 0.2s"}}>{busy?(busyMsg||"⚙️ Analyzing…"):`🚿 Run Plumbing Compliance Check (${files.length} file${files.length>1?"s":""})`}</button>}
      {error&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"12px 16px",marginBottom:20,color:T.danger,fontSize:14}}>⚠️ {error}</div>}
      {result&&(
        <div style={{animation:"fadeIn 0.35s ease"}}>
          <Card style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:11,color:T.muted,marginBottom:4}}>PROJECT</div>
                <div style={{fontWeight:800,fontSize:18,color:T.text}}>{result.summary.projectName}</div>
                <div style={{fontSize:13,color:T.muted,marginTop:2}}>{result.summary.buildingType}</div>
                <div style={{marginTop:12,display:"flex",gap:24}}>
                  <div><div style={{fontSize:26,fontWeight:800,color:"#dc2626"}}>{result.summary.criticalCount}</div><div style={{fontSize:11,color:T.muted}}>CRITICAL</div></div>
                  <div><div style={{fontSize:26,fontWeight:800,color:"#d97706"}}>{result.summary.warningCount}</div><div style={{fontSize:11,color:T.muted}}>WARNINGS</div></div>
                  <div><div style={{fontSize:26,fontWeight:800,color:SC}}>{result.summary.infoCount}</div><div style={{fontSize:11,color:T.muted}}>INFO</div></div>
                </div>
              </div>
              <div style={{background:`${STATUS_COL[result.summary.overallStatus]}14`,border:`2px solid ${STATUS_COL[result.summary.overallStatus]}44`,borderRadius:12,padding:"10px 18px",textAlign:"center"}}>
                <div style={{fontSize:10,color:T.muted,marginBottom:4}}>OVERALL STATUS</div>
                <div style={{fontSize:13,fontWeight:800,color:STATUS_COL[result.summary.overallStatus]}}>{result.summary.overallStatus}</div>
              </div>
            </div>
            <div style={{marginTop:12,fontSize:13,color:T.muted,lineHeight:1.6,background:T.dim,borderRadius:8,padding:"10px 14px"}}>{result.summary.analysisNotes}</div>
          </Card>
          {findings.length>0&&(
            <div>
              <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["all","CRITICAL","WARNING","INFO"].map(t=>{const cnt=t==="all"?findings.length:findings.filter(f=>f.severity===t).length;const active=tab===t;return <button key={t} onClick={()=>setTab(t)} style={{padding:"7px 16px",borderRadius:8,border:`1.5px solid ${active?SC:T.border}`,background:active?`rgba(16,185,129,0.12)`:"transparent",color:active?SC:T.muted,cursor:"pointer",fontSize:12,fontWeight:700}}>{t==="all"?"All":t} ({cnt})</button>;})}
                </div>
                <button onClick={toggleAll} style={{padding:"7px 14px",borderRadius:8,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>{allChecked?"☑ Deselect All":"☐ Select All"}</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                {filtered.map(f=>{
                  const col={CRITICAL:"#dc2626",WARNING:"#d97706",INFO:SC}[f.severity]||SC;
                  const bg={CRITICAL:"rgba(220,38,38,0.06)",WARNING:"rgba(217,119,6,0.06)",INFO:"rgba(16,185,129,0.06)"}[f.severity]||"rgba(16,185,129,0.06)";
                  const isOpen=open[f.id];const isChecked=!!checked[f.id];
                  return (
                    <div key={f.id} style={{background:isChecked?bg:"rgba(255,255,255,0.01)",border:`1.5px solid ${isChecked?col:T.border}`,borderRadius:12,overflow:"hidden",transition:"all 0.15s"}}>
                      <div style={{padding:"13px 18px",display:"flex",alignItems:"flex-start",gap:12}}>
                        <div onClick={()=>setChecked(p=>({...p,[f.id]:!p[f.id]}))} style={{width:20,height:20,borderRadius:5,border:`2px solid ${isChecked?col:T.muted}`,background:isChecked?col:"transparent",cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>{isChecked&&<span style={{color:"#fff",fontSize:12,fontWeight:800,lineHeight:1}}>✓</span>}</div>
                        <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setOpen(p=>({...p,[f.id]:!p[f.id]}))}>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:4,alignItems:"center"}}>
                            <span style={{background:col,color:"#fff",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:4}}>{f.severity}</span>
                            {f.confidence && <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:4,
                              background:f.confidence==="HIGH"?"rgba(22,163,74,0.15)":f.confidence==="LOW"?"rgba(239,68,68,0.12)":"rgba(234,179,8,0.12)",
                              color:f.confidence==="HIGH"?"#16a34a":f.confidence==="LOW"?"#ef4444":"#ca8a04",
                              border:`1px solid ${f.confidence==="HIGH"?"rgba(22,163,74,0.3)":f.confidence==="LOW"?"rgba(239,68,68,0.3)":"rgba(234,179,8,0.3)"}`
                            }}>{f.confidence==="HIGH"?"● HIGH CONFIDENCE":f.confidence==="LOW"?"◌ LOW CONFIDENCE":"◑ MEDIUM CONF."}</span>}
                            <span style={{fontSize:11,color:T.muted,fontFamily:"monospace"}}>{f.npcReference}</span>
                            <span style={{fontSize:11,color:T.muted,background:"rgba(255,255,255,0.04)",padding:"1px 8px",borderRadius:4}}>{f.category}</span>
                          </div>
                          <div style={{fontWeight:700,fontSize:14,color:T.text}}>{f.title}</div>
                        </div>
                        <span style={{color:T.muted,fontSize:12,marginTop:2,cursor:"pointer"}} onClick={()=>setOpen(p=>({...p,[f.id]:!p[f.id]}))}>{isOpen?"▲":"▼"}</span>
                      </div>
                      {isOpen&&<div style={{padding:"0 18px 16px 50px",borderTop:`1px solid ${col}33`}}><div style={{paddingTop:12,display:"flex",flexDirection:"column",gap:10}}><div><Label>Finding</Label><div style={{fontSize:13,color:T.muted,lineHeight:1.6}}>{f.description}</div></div><div><Label>Recommendation</Label><div style={{fontSize:13,color:T.success,lineHeight:1.6}}>✓ {f.recommendation}</div></div>{f.codeBasis&&<div style={{background:"rgba(0,0,0,0.2)",borderLeft:`3px solid ${col}`,padding:"10px 14px",borderRadius:"0 8px 8px 0",fontSize:12,color:T.muted,fontStyle:"italic",lineHeight:1.5}}>{f.codeBasis}</div>}</div></div>}
                    </div>
                  );
                })}
              </div>
              {checkedCount>0&&(
                <div style={{background:"rgba(16,185,129,0.08)",border:`1.5px solid rgba(16,185,129,0.25)`,borderRadius:12,padding:"16px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                  <div><div style={{fontWeight:700,fontSize:14,color:SC}}>{checkedCount} item{checkedCount>1?"s":""} selected</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>AI generates drafting instructions per NPC 2000</div></div>
                  <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><Label>Rev No.</Label><input type="number" value={revNum} min={1} max={99} onChange={e=>setRevNum(+e.target.value)} style={{width:60,background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:8,padding:"6px 10px",color:T.text,fontSize:14,fontWeight:700,outline:"none",textAlign:"center"}}/></div>
                    <button onClick={generateCorrections} disabled={correcting} style={{background:correcting?`rgba(16,185,129,0.3)`:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:correcting?"#666":"#fff",fontWeight:700,padding:"10px 20px",borderRadius:10,cursor:correcting?"not-allowed":"pointer",fontSize:13}}>{correcting?"⚙️ Generating…":"🤖 Generate Corrections"}</button>
                  </div>
                </div>
              )}
              {corrections&&(
                <div style={{background:"rgba(16,185,129,0.05)",border:`1.5px solid rgba(16,185,129,0.25)`,borderRadius:12,padding:20,marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
                    <div><div style={{fontWeight:800,fontSize:15,color:T.success}}>✅ Corrections Ready — Rev {revNum}</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>{corrections.length} instruction{corrections.length>1?"s":""} ready</div></div>
                    <button onClick={()=>{const w=window.open("","_blank");const date=new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});const rows=corrections.map((c,i)=>`<tr><td style="padding:8px;border:1px solid #e5e7eb;text-align:center;font-weight:700">REV-${String(i+1).padStart(2,"0")}</td><td style="padding:8px;border:1px solid #e5e7eb;color:${{CRITICAL:"#dc2626",WARNING:"#d97706",INFO:"#059669"}[c.severity]};font-weight:700">${c.severity}</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">${c.title}</td><td style="padding:8px;border:1px solid #e5e7eb;font-size:12px">${c.description}</td><td style="padding:8px;border:1px solid #e5e7eb;background:#fefce8">${c.correctedValues||c.recommendation}</td><td style="padding:8px;border:1px solid #e5e7eb;background:#f0fdf4;color:#15803d">${c.draftingInstruction||""}</td><td style="padding:8px;border:1px solid #e5e7eb;font-size:11px">${c.npcReference}</td></tr>`).join("");w.document.write(`<!DOCTYPE html><html><head><title>Plumbing Revision Rev ${revNum}</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#111;font-size:13px}table{border-collapse:collapse;width:100%}th{background:#065f46;color:#fff;padding:9px 8px;text-align:left;font-size:11px}h1{color:#065f46}@media print{button{display:none}}</style></head><body><h1>🚿 Plumbing Revision Report — Rev ${revNum}</h1><p style="color:#6b7280">NPC 2000 · PD 856 · ${date} · Jon Ureta</p><table><tr><th>Rev No.</th><th>Severity</th><th>Issue</th><th>Finding</th><th>Corrected Value</th><th>Drafting Instruction</th><th>NPC Ref.</th></tr>${rows}</table><p style="margin-top:24px;font-size:11px;color:#9ca3af">AI-generated. Verify with licensed Sanitary Engineer before implementation.</p></body></html>`);w.document.close();setTimeout(()=>w.print(),400);}} style={{background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,padding:"10px 20px",borderRadius:10,cursor:"pointer",fontSize:13}}>📄 Download Revision PDF</button>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {corrections.map((c,i)=>(
                      <div key={c.id||i} style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
                        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                          <span style={{background:"#064e3b",color:SC,fontSize:11,fontWeight:800,padding:"2px 10px",borderRadius:4}}>REV-{String(i+1).padStart(2,"0")}</span>
                          <span style={{fontSize:12,fontWeight:700,color:T.text}}>{c.title}</span>
                          <span style={{fontSize:11,color:T.muted,fontFamily:"monospace"}}>{c.npcReference}</span>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                          <div style={{background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,color:T.accent,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>📐 Corrected Value</div><div style={{fontSize:13,color:T.text,lineHeight:1.6}}>{c.correctedValues||c.recommendation}</div></div>
                          <div style={{background:"rgba(16,185,129,0.07)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,color:T.success,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>✏️ Drafting Instruction</div><div style={{fontSize:13,color:T.text,lineHeight:1.6}}>{c.draftingInstruction||"Apply correction as indicated"}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div style={{marginTop:20,padding:"10px 16px",background:T.dim,borderRadius:10,fontSize:12,color:T.muted,lineHeight:1.5}}>⚠️ AI-generated. Plans must be signed by a licensed Sanitary Engineer before LGU/DOH submission.</div>
        </div>
      )}
      {!files.length&&!result&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginTop:4}}>
          {[{i:"🏠",t:"Residential",d:"Water supply, drainage, septic"},{i:"🏢",t:"Commercial",d:"Fixture units, grease traps"},{i:"🏥",t:"Institutional",d:"Hospital, school plumbing"},{i:"🌊",t:"Storm Drainage",d:"NPC Sec. 11 compliance"}].map(x=>(
            <Card key={x.t} style={{textAlign:"center",padding:18}}><div style={{fontSize:28,marginBottom:8}}>{x.i}</div><div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:4}}>{x.t}</div><div style={{fontSize:11,color:T.muted,lineHeight:1.5}}>{x.d}</div></Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SANICODE: FIXTURE UNIT CALCULATOR ───────────────────────────────────────

export default PlumbingChecker;
