import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { CONCRETE_GRADES, REBAR_GRADES } from "./constants.jsx";
import { Card, Label } from "../../theme.jsx";
import { Input, Select } from "../../theme.jsx";
import { FromPlansBadge } from "./constants.jsx";

function ColumnDesign({ structuralData, structuralResults }) {
  const sd=structuralData, c0=sd?.columns?.[0];
  const [fc,setFc]=useState(sd?.materials?.fc??"");
  const [fy,setFy]=useState(sd?.materials?.fy??"");
  const [b,setB]=useState(c0?.width??"");
  const [h,setH]=useState(c0?.height??"");
  const [Pu,setPu]=useState(c0?.Pu??"");
  const [Mu,setMu]=useState(c0?.Mu??"");
  const [type,setType]=useState(c0?.type==="spiral"?"spiral":"tied");
  const [result,setResult]=useState(null);
  const [fp,setFp]=useState({fc:!!sd?.materials?.fc,fy:!!sd?.materials?.fy,b:!!c0?.width,h:!!c0?.height,Pu:!!c0?.Pu,Mu:!!c0?.Mu});

  useEffect(()=>{
    if(!sd) return; const c1=sd?.columns?.[0];
    if(sd.materials?.fc){setFc(sd.materials.fc);setFp(p=>({...p,fc:true}));}
    if(sd.materials?.fy){setFy(sd.materials.fy);setFp(p=>({...p,fy:true}));}
    if(c1?.width){setB(c1.width);setFp(p=>({...p,b:true}));}
    if(c1?.height){setH(c1.height);setFp(p=>({...p,h:true}));}
    if(c1?.Pu){setPu(c1.Pu);setFp(p=>({...p,Pu:true}));}
    if(c1?.Mu){setMu(c1.Mu);setFp(p=>({...p,Mu:true}));}
    if(c1?.type){setType(c1.type==="spiral"?"spiral":"tied");}
  },[sd]);

  const calc=()=>{
    if([fc,fy,b,h,Pu].some(v=>v==="")) return;
    const phi=type==="spiral"?0.75:0.65, Ag=(+b)*(+h);
    const Pn_req=(+Pu)*1000/phi;
    const Ast_req=Math.max((Pn_req/0.80-0.85*+fc*Ag)/(+fy-0.85*+fc),0.01*Ag);
    const rho_req=Ast_req/Ag, rho_min=0.01, rho_max=0.08;
    const phiPn=phi*0.80*(0.85*+fc*(Ag-Ast_req)+Ast_req*(+fy))/1000;
    const ecc=Mu&&Pu?(+Mu*1e3)/(+Pu):0;
    const status=(rho_req<=rho_max&&rho_req>=rho_min&&phiPn>=(+Pu))?"PASS ✓":"FAIL ✗";
    setResult({Ag,Ast_req,rho_req,rho_min,rho_max,phiPn,ecc,status,phi});
  };

  const Hint=({c})=><div style={{fontSize:11,color:T.muted,marginBottom:12,fontStyle:"italic"}}>{c}</div>;
  const canCalc=[fc,fy,b,h,Pu].every(v=>v!=="");

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        {!sd && <div style={{padding:"10px 14px",background:"rgba(6,150,215,0.06)",border:"1px solid rgba(6,150,215,0.15)",borderRadius:8,marginBottom:16,fontSize:12,color:"#0696d7",lineHeight:1.6}}>💡 Upload structural plans in <strong>AI Plan Checker</strong> to auto-fill column schedule data.</div>}
        {sd && !sd.columns?.length && (
          <div style={{padding:"12px 14px",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8,marginBottom:16,fontSize:12,color:"#f59e0b",lineHeight:1.7}}>
            <strong style={{fontSize:13}}>⚠ Unverifiable — No column data found in plans</strong><br/>
            <span style={{color:T.muted}}>The AI could not extract column dimensions or schedule from the uploaded plans. Enter column dimensions (b, h) and factored axial load (Pu) manually below to run the design check.</span>
          </div>
        )}
        <Label>f'c (MPa) {fp.fc&&<FromPlansBadge/>}</Label>
        <Select value={fc} onChange={e=>setFc(+e.target.value)} style={{marginBottom:16}}>
          <option value="">— Select grade —</option>
          {Object.entries(CONCRETE_GRADES).map(([k,v])=><option key={k} value={v}>{k} ({v} MPa)</option>)}
        </Select>
        <Label>fy (MPa) {fp.fy&&<FromPlansBadge/>}</Label>
        <Select value={fy} onChange={e=>setFy(+e.target.value)} style={{marginBottom:16}}>
          <option value="">— Select grade —</option>
          {Object.entries(REBAR_GRADES).map(([k,v])=><option key={k} value={v}>{k} ({v} MPa)</option>)}
        </Select>
        <Label>Column Type</Label>
        <Select value={type} onChange={e=>setType(e.target.value)} style={{marginBottom:4}}>
          <option value="tied">Tied Column (φ = 0.65)</option>
          <option value="spiral">Spiral Column (φ = 0.75)</option>
        </Select>
        <Hint c="Spiral columns preferred in high seismic zones for ductility."/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:4}}>
          <div><Label>Width b (mm) {fp.b&&<FromPlansBadge/>}</Label><Input type="number" value={b} onChange={e=>setB(e.target.value)} placeholder="e.g. 400"/></div>
          <div><Label>Height h (mm) {fp.h&&<FromPlansBadge/>}</Label><Input type="number" value={h} onChange={e=>setH(e.target.value)} placeholder="e.g. 400"/></div>
        </div>
        <Hint c="Min. 300mm per NSCP Sec. 421 for seismic zones. From column schedule on structural plans."/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:4}}>
          <div><Label>Pu (kN) {fp.Pu&&<FromPlansBadge/>}</Label><Input type="number" value={Pu} onChange={e=>setPu(e.target.value)} placeholder="e.g. 1500"/></div>
          <div><Label>Mu (kN·m) {fp.Mu&&<FromPlansBadge/>}</Label><Input type="number" value={Mu} onChange={e=>setMu(e.target.value)} placeholder="Optional"/></div>
        </div>
        <Hint c="Pu = 1.2D + 1.6L. Sum tributary loads per floor × number of floors above."/>
        <button onClick={calc} disabled={!canCalc} style={{width:"100%",background:canCalc?"linear-gradient(135deg,#0696d7,#0569a8)":"rgba(255,255,255,0.05)",border:"none",color:canCalc?"#fff":T.muted,fontWeight:700,fontSize:14,padding:"13px",borderRadius:12,cursor:canCalc?"pointer":"not-allowed",marginTop:8,transition:"all 0.2s"}}>
          {canCalc?"⚡ Design Column (NSCP 2015 Sec. 410)":"Fill required fields to calculate"}
        </button>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Card style={{background:result.status.includes("PASS")?"rgba(34,197,94,0.06)":"rgba(239,68,68,0.06)",border:`1.5px solid ${result.status.includes("PASS")?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"}`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:2}}>STATUS</div>
            <div style={{fontSize:16,fontWeight:800,color:result.status.includes("PASS")?"#22c55e":"#ef4444"}}>{result.status}</div>
            <div style={{fontSize:22,fontWeight:900,color:T.text,marginTop:8}}>{result.Ast_req.toFixed(0)} <span style={{fontSize:13,fontWeight:400,color:T.muted}}>mm² steel req'd</span></div>
          </Card>
          {[
            {l:"Gross Area Ag",v:`${result.Ag.toFixed(0)} mm²`},
            {l:"Required ρ",v:`${(result.rho_req*100).toFixed(2)}%`},
            {l:"Min ρ / Max ρ",v:`${(result.rho_min*100).toFixed(0)}% / ${(result.rho_max*100).toFixed(0)}%`},
            {l:"φPn capacity",v:`${result.phiPn.toFixed(1)} kN`,hi:true},
            {l:"Ast required",v:`${result.Ast_req.toFixed(0)} mm²`,hi:true},
            {l:"Eccentricity e",v:result.ecc?`${result.ecc.toFixed(1)} mm`:"—"},
            {l:"φ factor",v:`${result.phi}`},
          ].map(r=>(
            <div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 14px",background:r.hi?"rgba(6,150,215,0.08)":T.dim,borderRadius:7,border:r.hi?"1px solid rgba(6,150,215,0.2)":"none"}}>
              <span style={{fontSize:12,color:T.muted}}>{r.l}</span>
              <span style={{fontSize:13,fontWeight:700,color:r.hi?"#0696d7":T.text,fontFamily:"monospace"}}>{r.v}</span>
            </div>
          ))}
          {/* ── Engineering Insights ── */}
          <div style={{padding:"14px 16px",background:result.status.includes("PASS")?"rgba(34,197,94,0.04)":"rgba(239,68,68,0.04)",border:`1px solid ${result.status.includes("PASS")?"rgba(34,197,94,0.15)":"rgba(239,68,68,0.15)"}`,borderRadius:10}}>
            <div style={{fontSize:11,fontWeight:800,color:result.status.includes("PASS")?"#22c55e":"#ef4444",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>
              {result.status.includes("PASS") ? "✓ Engineering Insight" : "⚠ Why This Column Fails"}
            </div>
            <div style={{fontSize:12,color:T.text,lineHeight:1.8}}>
              {(() => {
                const insights = [];
                const rhoP = (result.rho_req*100).toFixed(2);
                const capRatio = (result.phiPn/(+Pu)*100).toFixed(0);
                // Check steel ratio
                if (result.rho_req > result.rho_max) {
                  insights.push({type:"fail",text:`Steel ratio ρ = ${rhoP}% exceeds the 8% maximum (NSCP Sec. 410.3.1). The column section is too small for the applied load — you need to increase the column size or use higher-strength concrete.`});
                } else if (result.rho_req < result.rho_min) {
                  insights.push({type:"fail",text:`Steel ratio ρ = ${rhoP}% is below the 1% minimum (NSCP Sec. 410.3.1). Use ρ = 1% minimum. This column is lightly loaded — consider reducing the section size if architecturally feasible.`});
                } else if (result.rho_req > 0.04) {
                  insights.push({type:"warn",text:`Steel ratio ρ = ${rhoP}% is within limits but high (>4%). This will cause rebar congestion and difficulty in concrete placement. Consider increasing the column section or using higher f'c.`});
                } else {
                  insights.push({type:"pass",text:`Steel ratio ρ = ${rhoP}% is within the 1–8% range — efficient design with good constructability.`});
                }
                // Check capacity
                if (result.phiPn < (+Pu)) {
                  insights.push({type:"fail",text:`Design capacity φPn = ${result.phiPn.toFixed(0)} kN is less than the factored load Pu = ${Pu} kN (capacity/demand = ${capRatio}%). The column cannot safely carry this load. Increase the section size, use higher f'c, or add more steel.`});
                } else {
                  const utilization = (+Pu)/result.phiPn*100;
                  insights.push({type:"pass",text:`Capacity φPn = ${result.phiPn.toFixed(0)} kN > Pu = ${Pu} kN. Utilization: ${utilization.toFixed(0)}%. ${utilization>90?"Near full capacity — minimal safety margin.":utilization>70?"Good utilization.":"Conservative design — section has significant reserve capacity."}`});
                }
                // Eccentricity check
                if (result.ecc > Math.min(+b,+h)/6) {
                  insights.push({type:"warn",text:`Eccentricity e = ${result.ecc.toFixed(0)} mm > ${(Math.min(+b,+h)/6).toFixed(0)} mm (h/6). Kern exceeded — tensile stresses develop on one face. Full P-M interaction check is recommended per NSCP Sec. 410.12.`});
                } else if (Mu && +Mu > 0) {
                  insights.push({type:"pass",text:`Eccentricity e = ${result.ecc.toFixed(0)} mm is within the kern (h/6 = ${(Math.min(+b,+h)/6).toFixed(0)} mm). No tensile face — concentric load assumption is reasonable.`});
                }
                // Recommendations
                if (result.status.includes("FAIL")) {
                  const newB = Math.ceil(Math.sqrt(result.Ast_req / (0.04 * 1))*1.1 / 50)*50; // target 4% ratio
                  insights.push({type:"fix",text:`Suggested fix: Try increasing the column to at least ${Math.max(newB,Math.max(+b,+h)+50)}mm × ${Math.max(newB,Math.max(+b,+h)+50)}mm, or upgrade concrete to a higher grade. Re-run after changes.`});
                }
                return insights.map((ins,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:i<insights.length-1?8:0}}>
                    <span style={{flexShrink:0,fontSize:11,fontWeight:800,color:ins.type==="fail"?"#ef4444":ins.type==="warn"?"#f59e0b":ins.type==="fix"?"#0696d7":"#22c55e"}}>
                      {ins.type==="fail"?"✗":ins.type==="warn"?"⚠":ins.type==="fix"?"→":"✓"}
                    </span>
                    <span>{ins.text}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>NSCP 2015 Sec. 410 — Short column, concentric load. Apply magnification for slender columns per Sec. 410.12.</div>
        </div>
      ):(
        (() => {
          const priorItems = structuralResults?.items?.filter(i=>i.tool==="column") || [];
          const colMemberData = structuralResults?.memberData?.columns || [];
          if (priorItems.length > 0) {
            return (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <Card style={{background:priorItems.some(i=>i.status==="FAIL")?"rgba(239,68,68,0.06)":priorItems.some(i=>i.status==="INCOMPLETE"||i.status==="NO DATA")?"rgba(245,158,11,0.06)":"rgba(34,197,94,0.06)",border:`1.5px solid ${priorItems.some(i=>i.status==="FAIL")?"rgba(239,68,68,0.3)":priorItems.some(i=>i.status==="INCOMPLETE"||i.status==="NO DATA")?"rgba(245,158,11,0.3)":"rgba(34,197,94,0.3)"}`}}>
                  <div style={{fontSize:11,color:T.muted,marginBottom:4}}>RUN ALL — COLUMN DESIGN RESULTS</div>
                  <div style={{fontSize:16,fontWeight:900,color:priorItems.some(i=>i.status==="FAIL")?"#ef4444":priorItems.some(i=>i.status==="INCOMPLETE"||i.status==="NO DATA")?"#f59e0b":priorItems.every(i=>i.status==="PASS")?"#22c55e":"#0696d7",marginBottom:8}}>
                    {priorItems.some(i=>i.status==="FAIL")?"✗ FAIL — Column(s) do not satisfy NSCP Sec. 410":priorItems.some(i=>i.status==="INCOMPLETE"||i.status==="NO DATA")?"⚠ CANNOT VERIFY — Incomplete column data":"✓ PASS — Column(s) satisfy NSCP requirements"}
                  </div>
                  {priorItems.map((item,idx)=>(
                    <div key={idx} style={{padding:"10px 14px",background:T.dim,borderRadius:8,marginBottom:6,border:`1px solid ${item.status==="FAIL"?"rgba(239,68,68,0.2)":item.status==="CANNOT VERIFY"?"rgba(245,158,11,0.2)":"rgba(34,197,94,0.2)"}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <span style={{fontSize:13,fontWeight:700,color:T.text}}>{item.id}</span>
                        <span style={{fontSize:11,fontWeight:800,color:item.status==="FAIL"?"#ef4444":item.status==="PASS"?"#22c55e":item.status==="CANNOT VERIFY"?"#f59e0b":"#0696d7",padding:"2px 8px",borderRadius:6,background:item.status==="FAIL"?"rgba(239,68,68,0.1)":item.status==="PASS"?"rgba(34,197,94,0.1)":item.status==="CANNOT VERIFY"?"rgba(245,158,11,0.1)":"rgba(6,150,215,0.1)"}}>{item.status}</span>
                      </div>
                      {item.value && <div style={{fontSize:11,color:T.muted,fontFamily:"monospace"}}>{item.value}</div>}
                      {item.detail && <div style={{fontSize:11,color:T.muted,fontFamily:"monospace",marginTop:2}}>{item.detail}</div>}
                      {item.error && <div style={{fontSize:11,color:item.status==="CANNOT VERIFY"?"#f59e0b":"#ef4444",marginTop:6,padding:"6px 10px",background:item.status==="CANNOT VERIFY"?"rgba(245,158,11,0.06)":"rgba(239,68,68,0.06)",borderRadius:6,borderLeft:`2px solid ${item.status==="CANNOT VERIFY"?"#f59e0b":"#ef4444"}`,lineHeight:1.6}}>{item.error}</div>}
                    </div>
                  ))}
                </Card>
                {/* Engineering insights from Run All data */}
                {colMemberData.length > 0 && colMemberData.map((col,idx)=>(
                  <div key={idx} style={{padding:"14px 16px",background:col.rho>=0.0095&&col.rho<=0.084?"rgba(34,197,94,0.04)":"rgba(239,68,68,0.04)",border:`1px solid ${col.rho>=0.0095&&col.rho<=0.084?"rgba(34,197,94,0.15)":"rgba(239,68,68,0.15)"}`,borderRadius:10}}>
                    <div style={{fontSize:11,fontWeight:800,color:col.rho>=0.0095&&col.rho<=0.084?"#22c55e":"#ef4444",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>
                      {col.id} — {col.rho>=0.0095&&col.rho<=0.084?"✓ NSCP Compliant":"⚠ Check Required"}
                    </div>
                    <div style={{fontSize:12,color:T.text,lineHeight:1.8}}>
                      <div style={{display:"flex",gap:8,marginBottom:4}}><span style={{flexShrink:0,fontSize:11,fontWeight:800,color:"#22c55e"}}>✓</span><span>Section: {col.b}mm × {col.h}mm (Ag = {col.Ag?.toFixed(0)} mm²)</span></div>
                      <div style={{display:"flex",gap:8,marginBottom:4}}><span style={{flexShrink:0,fontSize:11,fontWeight:800,color:col.rho>=0.0095?"#22c55e":"#ef4444"}}>{col.rho>=0.0095?"✓":"✗"}</span><span>ρ = {(col.rho*100).toFixed(2)}% — As = {col.Ast?.toFixed(0)}mm² ({col.mainBarCount}-{col.mainBarDia}mmØ)</span></div>
                      {col.tieDia && col.tieSpacing && <div style={{display:"flex",gap:8}}><span style={{flexShrink:0,fontSize:11,fontWeight:800,color:"#0696d7"}}>ℹ</span><span>Ties: {col.tieDia}mmØ @ {col.tieSpacing}mm</span></div>}
                    </div>
                  </div>
                ))}
                <Card style={{background:"rgba(6,150,215,0.04)",border:"1px solid rgba(6,150,215,0.15)"}}>
                  <div style={{fontSize:11,color:"#0696d7",fontWeight:700,marginBottom:4}}>MANUAL DETAILED CHECK</div>
                  <div style={{fontSize:11,color:T.muted,lineHeight:1.6}}>Enter Pu (kN) and optionally Mu (kN·m) on the left, then click Calculate for a full detailed analysis with interactive parameters.</div>
                </Card>
              </div>
            );
          }
          return (
            <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}>
              <Icon name="column" size={40} color={T.muted}/>
              <div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Fill parameters and click<br/>Calculate to see results</div>
            </Card>
          );
        })()
      )}
    </div>
  );
}

// ─── STRUCTICODE: FOOTING DESIGN ─────────────────────────────────────────────

export default ColumnDesign;
