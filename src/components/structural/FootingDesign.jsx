import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { CONCRETE_GRADES, REBAR_GRADES } from "./constants.jsx";
import { Card, Label } from "../../theme.jsx";
import { Input, Select } from "../../theme.jsx";
import { FromPlansBadge } from "./constants.jsx";

function FootingDesign({ structuralData, structuralResults }) {
  const sd=structuralData, f0=sd?.footings?.[0];
  const [fc,setFc]=useState(sd?.materials?.fc??"");
  const [fy,setFy]=useState(sd?.materials?.fy??"");
  const [P,setP]=useState(f0?.columnLoad??"");
  const [qa,setQa]=useState(f0?.soilBearing??"");
  const [Df,setDf]=useState(f0?.depthOfExcavation??f0?.depth??"");
  const [result,setResult]=useState(null);
  const [fp,setFp]=useState({fc:!!sd?.materials?.fc,fy:!!sd?.materials?.fy,P:!!f0?.columnLoad,qa:!!f0?.soilBearing,Df:!!(f0?.depthOfExcavation||f0?.depth)});

  useEffect(()=>{
    if(!sd) return; const f1=sd?.footings?.[0];
    if(sd.materials?.fc){setFc(sd.materials.fc);setFp(p=>({...p,fc:true}));}
    if(sd.materials?.fy){setFy(sd.materials.fy);setFp(p=>({...p,fy:true}));}
    if(f1?.columnLoad){setP(f1.columnLoad);setFp(p=>({...p,P:true}));}
    if(f1?.soilBearing){setQa(f1.soilBearing);setFp(p=>({...p,qa:true}));}
    if(f1?.depthOfExcavation||f1?.depth){setDf(f1.depthOfExcavation||f1.depth);setFp(p=>({...p,Df:true}));}
  },[sd]);

  const calc=()=>{
    if([fc,fy,P,qa,Df].some(v=>v==="")) return;
    const qnet=(+qa)-23.5*(+Df);
    if(qnet<=0){setResult({error:"Net bearing ≤ 0. Reduce Df or increase qa."});return;}
    const B=Math.ceil(Math.sqrt((+P)/qnet)*10)/10;
    const qu=1.2*(+P)/(B*B);
    const d=Math.max(B*1000/5,250);
    const c=(B-0.4)/2;
    const Mu_f=qu*B*c*c/2;
    const Rn=(Mu_f*1e6)/(0.90*(B*1000)*d*d);
    const rho=(0.85*+fc/+fy)*(1-Math.sqrt(Math.max(0,1-(2*Rn)/(0.85*+fc))));
    const rho_use=Math.max(rho,0.0018);
    const As=rho_use*(B*1000)*d;
    setResult({qnet,B,qu,d,Mu_f,As,rho_use});
  };

  const Hint=({c})=><div style={{fontSize:11,color:T.muted,marginBottom:12,fontStyle:"italic"}}>{c}</div>;
  const canCalc=[fc,fy,P,qa,Df].every(v=>v!=="");

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        {!sd && <div style={{padding:"10px 14px",background:"rgba(6,150,215,0.06)",border:"1px solid rgba(6,150,215,0.15)",borderRadius:8,marginBottom:16,fontSize:12,color:"#0696d7",lineHeight:1.6}}>💡 Upload structural plans in <strong>AI Plan Checker</strong> to auto-fill footing data.</div>}
        {sd && !sd.footings?.length && (
          <div style={{padding:"12px 14px",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8,marginBottom:16,fontSize:12,color:"#f59e0b",lineHeight:1.7}}>
            <strong style={{fontSize:13}}>⚠ Unverifiable — No footing data found in plans</strong><br/>
            <span style={{color:T.muted}}>The AI could not extract footing dimensions or soil bearing capacity from the uploaded plans. Enter column service load (P), allowable bearing (qa), and foundation depth (Df) manually below.</span>
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
        <Label>Column Service Load P (kN) {fp.P&&<FromPlansBadge/>}</Label>
        <Input type="number" value={P} onChange={e=>setP(e.target.value)} placeholder="e.g. 800 — unfactored service load" style={{marginBottom:4}}/>
        <Hint c="Use unfactored (service) load. Sum all floor loads from tributary area × floors above."/>
        <Label>Allowable Bearing qa (kPa) {fp.qa&&<FromPlansBadge/>}</Label>
        <Input type="number" value={qa} onChange={e=>setQa(e.target.value)} placeholder="e.g. 150 — from geotechnical report" style={{marginBottom:4}}/>
        <Hint c="Must come from a geotechnical investigation (NSCP Sec. 304). Never assume."/>
        <Label>Foundation Depth Df (m) {fp.Df&&<FromPlansBadge/>}</Label>
        <Input type="number" value={Df} onChange={e=>setDf(e.target.value)} step="0.1" placeholder="e.g. 1.50" style={{marginBottom:4}}/>
        <Hint c="Depth from finished grade to bottom of footing. Min 0.60m for non-frost areas."/>
        <button onClick={calc} disabled={!canCalc} style={{width:"100%",background:canCalc?"linear-gradient(135deg,#0696d7,#0569a8)":"rgba(255,255,255,0.05)",border:"none",color:canCalc?"#fff":T.muted,fontWeight:700,fontSize:14,padding:"13px",borderRadius:12,cursor:canCalc?"pointer":"not-allowed",marginTop:8,transition:"all 0.2s"}}>
          {canCalc?"⚡ Design Footing (NSCP 2015 Sec. 415)":"Fill all fields to calculate"}
        </button>
      </Card>
      {result?(
        result.error?(
          <Card style={{background:"rgba(239,68,68,0.06)",border:"1.5px solid rgba(239,68,68,0.3)"}}>
            <div style={{fontSize:14,color:"#ef4444",fontWeight:700}}>⚠ {result.error}</div>
          </Card>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <Card style={{background:"rgba(34,197,94,0.06)",border:"1.5px solid rgba(34,197,94,0.3)"}}>
              <div style={{fontSize:11,color:T.muted,marginBottom:2}}>FOOTING SIZE</div>
              <div style={{fontSize:32,fontWeight:900,color:"#22c55e"}}>{result.B.toFixed(2)} m × {result.B.toFixed(2)} m</div>
              <div style={{fontSize:13,color:T.muted,marginTop:4}}>d = {result.d.toFixed(0)} mm effective depth</div>
            </Card>
            {[
              {l:"Net Bearing qnet",v:`${result.qnet.toFixed(1)} kPa`},
              {l:"Factored Pressure qu",v:`${result.qu.toFixed(2)} kPa`},
              {l:"Design Moment Mu",v:`${result.Mu_f.toFixed(1)} kN·m`},
              {l:"Design ρ",v:`${(result.rho_use*100).toFixed(4)}%`,hi:true},
              {l:"Steel Area As",v:`${result.As.toFixed(0)} mm²/m`,hi:true},
            ].map(r=>(
              <div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 14px",background:r.hi?"rgba(6,150,215,0.08)":T.dim,borderRadius:7,border:r.hi?"1px solid rgba(6,150,215,0.2)":"none"}}>
                <span style={{fontSize:12,color:T.muted}}>{r.l}</span>
                <span style={{fontSize:13,fontWeight:700,color:r.hi?"#0696d7":T.text,fontFamily:"monospace"}}>{r.v}</span>
              </div>
            ))}
            {/* ── Engineering Insights ── */}
            <div style={{padding:"14px 16px",background:"rgba(34,197,94,0.04)",border:"1px solid rgba(34,197,94,0.15)",borderRadius:10}}>
              <div style={{fontSize:11,fontWeight:800,color:"#22c55e",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>✓ Engineering Insight</div>
              <div style={{fontSize:12,color:T.text,lineHeight:1.8}}>
                {(() => {
                  const insights = [];
                  const bearingUtil = ((+P)/(result.qnet*result.B*result.B)*100).toFixed(0);
                  const totalDepth = result.d + 75; // d + cover
                  // Bearing utilization
                  insights.push({type:"pass",text:`Soil bearing utilization: ${bearingUtil}% of net allowable capacity (qnet = ${result.qnet.toFixed(0)} kPa). ${+bearingUtil>90?"Near full bearing capacity — verify with geotechnical engineer.":+bearingUtil>70?"Good utilization of soil capacity.":"Conservative design — soil has significant reserve."}`});
                  // Footing proportions
                  if (result.B > 3.0) {
                    insights.push({type:"warn",text:`Footing width ${result.B.toFixed(2)}m is large (>3m). Consider a combined or mat foundation to reduce footing size, or verify soil capacity with a load test.`});
                  } else if (result.B < 1.0) {
                    insights.push({type:"pass",text:`Compact footing (${result.B.toFixed(2)}m). Efficient use of soil bearing capacity.`});
                  } else {
                    insights.push({type:"pass",text:`Footing size ${result.B.toFixed(2)}m × ${result.B.toFixed(2)}m is typical for this load level. Economical construction.`});
                  }
                  // Steel ratio
                  if (result.rho_use <= 0.0018) {
                    insights.push({type:"pass",text:`Steel ratio governs by minimum (ρ = 0.18%). Footing is lightly stressed — reinforcement is for shrinkage and temperature control per NSCP Sec. 407.12.`});
                  } else {
                    insights.push({type:"pass",text:`Steel ratio ρ = ${(result.rho_use*100).toFixed(3)}% exceeds minimum 0.18%. Flexure controls the reinforcement — use the computed As = ${result.As.toFixed(0)} mm²/m both ways.`});
                  }
                  // Punching shear warning
                  const bo = 4*(400 + result.d); // perimeter at d/2 from column face
                  const Vc_punch = (1/3)*Math.sqrt(+fc||27.6)*bo*result.d/1e6; // in kN
                  const Vu_punch = 1.2*(+P) - result.qu*(0.4+result.d/1000)*(0.4+result.d/1000);
                  if (Vu_punch > 0.75*Vc_punch) {
                    insights.push({type:"warn",text:`Punching shear may be critical (Vu ≈ ${Vu_punch.toFixed(0)} kN vs φVc ≈ ${(0.75*Vc_punch).toFixed(0)} kN). Verify two-way shear per NSCP Sec. 415.5.4 — may need to increase footing depth.`});
                  } else {
                    insights.push({type:"pass",text:`Punching shear check: Vu ≈ ${Vu_punch.toFixed(0)} kN < φVc ≈ ${(0.75*Vc_punch).toFixed(0)} kN — adequate. Two-way shear is OK.`});
                  }
                  // Total depth estimate
                  insights.push({type:"info",text:`Estimated total footing thickness: ${totalDepth.toFixed(0)} mm (d + 75mm cover). Excavation depth: ${(+Df).toFixed(2)}m from grade.`});
                  return insights.map((ins,i)=>(
                    <div key={i} style={{display:"flex",gap:8,marginBottom:i<insights.length-1?8:0}}>
                      <span style={{flexShrink:0,fontSize:11,fontWeight:800,color:ins.type==="fail"?"#ef4444":ins.type==="warn"?"#f59e0b":ins.type==="info"?"#0696d7":"#22c55e"}}>
                        {ins.type==="fail"?"✗":ins.type==="warn"?"⚠":ins.type==="info"?"ℹ":"✓"}
                      </span>
                      <span>{ins.text}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
            <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>NSCP 2015 Sec. 415 — Square isolated footing. Results above include punching shear estimate. Verify wide-beam shear and development length separately.</div>
          </div>
        )
      ):(
        (() => {
          const priorItems = structuralResults?.items?.filter(i=>i.tool==="footing") || [];
          const ftgMemberData = structuralResults?.memberData?.footings || [];
          if (priorItems.length > 0) {
            return (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <Card style={{background:priorItems.some(i=>i.status==="FAIL")?"rgba(239,68,68,0.06)":priorItems.some(i=>i.status==="INCOMPLETE"||i.status==="NO DATA")?"rgba(245,158,11,0.06)":"rgba(34,197,94,0.06)",border:`1.5px solid ${priorItems.some(i=>i.status==="FAIL")?"rgba(239,68,68,0.3)":priorItems.some(i=>i.status==="INCOMPLETE"||i.status==="NO DATA")?"rgba(245,158,11,0.3)":"rgba(34,197,94,0.3)"}`}}>
                  <div style={{fontSize:11,color:T.muted,marginBottom:4}}>RUN ALL — FOOTING DESIGN RESULTS</div>
                  <div style={{fontSize:16,fontWeight:900,color:priorItems.some(i=>i.status==="FAIL")?"#ef4444":priorItems.some(i=>i.status==="INCOMPLETE"||i.status==="NO DATA")?"#f59e0b":priorItems.every(i=>i.status==="PASS")?"#22c55e":"#0696d7",marginBottom:8}}>
                    {priorItems.some(i=>i.status==="FAIL")?"✗ FAIL — Footing(s) have issues":priorItems.some(i=>i.status==="INCOMPLETE"||i.status==="NO DATA")?"⚠ CANNOT VERIFY — Incomplete footing data":priorItems.every(i=>i.status==="PASS")?"✓ PASS — Footing(s) are adequate":"✓ COMPUTED"}
                  </div>
                  {priorItems.map((item,idx)=>(
                    <div key={idx} style={{padding:"10px 14px",background:T.dim,borderRadius:8,marginBottom:6,border:`1px solid ${item.status==="FAIL"?"rgba(239,68,68,0.2)":"rgba(34,197,94,0.2)"}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <span style={{fontSize:13,fontWeight:700,color:T.text}}>{item.id}</span>
                        <span style={{fontSize:11,fontWeight:800,color:item.status==="FAIL"?"#ef4444":"#22c55e",padding:"2px 8px",borderRadius:6,background:item.status==="FAIL"?"rgba(239,68,68,0.1)":"rgba(34,197,94,0.1)"}}>{item.status}</span>
                      </div>
                      {item.value && <div style={{fontSize:11,color:T.muted,fontFamily:"monospace"}}>{item.value}</div>}
                      {item.detail && <div style={{fontSize:11,color:T.muted,fontFamily:"monospace",marginTop:2}}>{item.detail}</div>}
                      {item.error && <div style={{fontSize:11,color:"#ef4444",marginTop:6,padding:"6px 10px",background:"rgba(239,68,68,0.06)",borderRadius:6,borderLeft:"2px solid #ef4444",lineHeight:1.6}}>{item.error}</div>}
                    </div>
                  ))}
                </Card>
                {/* Engineering insights from Run All data */}
                {ftgMemberData.length > 0 && ftgMemberData.map((ft,idx)=>(
                  <div key={idx} style={{padding:"14px 16px",background:"rgba(34,197,94,0.04)",border:"1px solid rgba(34,197,94,0.15)",borderRadius:10}}>
                    <div style={{fontSize:11,fontWeight:800,color:"#22c55e",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>✓ {ft.id} — Footing Reinforcement</div>
                    <div style={{fontSize:12,color:T.text,lineHeight:1.8}}>
                      {ft.thickness && <div style={{display:"flex",gap:8,marginBottom:4}}><span style={{flexShrink:0,fontSize:11,fontWeight:800,color:"#22c55e"}}>✓</span><span>Thickness: {ft.thickness}mm</span></div>}
                      {ft.As_per_m && <div style={{display:"flex",gap:8,marginBottom:4}}><span style={{flexShrink:0,fontSize:11,fontWeight:800,color:"#22c55e"}}>✓</span><span>Reinforcement: As = {ft.As_per_m}mm²/m ({ft.botBarDia}mmØ @ {ft.botBarSpacing}mm)</span></div>}
                      {ft.rho && <div style={{display:"flex",gap:8,marginBottom:4}}><span style={{flexShrink:0,fontSize:11,fontWeight:800,color:ft.rho>=0.0016?"#22c55e":"#ef4444"}}>{ft.rho>=0.0016?"✓":"✗"}</span><span>ρ = {(ft.rho*100).toFixed(3)}% {ft.rho>=0.0016?"≥ 0.18% min — OK":"< 0.18% min — Increase reinforcement"}</span></div>}
                      {ft.soilBearing && <div style={{display:"flex",gap:8}}><span style={{flexShrink:0,fontSize:11,fontWeight:800,color:"#0696d7"}}>ℹ</span><span>SBC = {ft.soilBearing} kPa documented</span></div>}
                    </div>
                  </div>
                ))}
                <Card style={{background:"rgba(6,150,215,0.04)",border:"1px solid rgba(6,150,215,0.15)"}}>
                  <div style={{fontSize:11,color:"#0696d7",fontWeight:700,marginBottom:4}}>MANUAL DETAILED CHECK</div>
                  <div style={{fontSize:11,color:T.muted,lineHeight:1.6}}>Enter column service load P (kN), allowable bearing qa (kPa), and foundation depth Df (m) on the left, then click Calculate for interactive results.</div>
                </Card>
              </div>
            );
          }
          return (
            <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}>
              <Icon name="footing" size={40} color={T.muted}/>
              <div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Fill parameters and click<br/>Calculate to see results</div>
            </Card>
          );
        })()
      )}
    </div>
  );
}

// ─── STRUCTICODE: SLAB DESIGN ────────────────────────────────────────────────

export default FootingDesign;
