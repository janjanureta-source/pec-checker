import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { CONCRETE_GRADES, REBAR_GRADES } from "./constants.jsx";
import { Card, Label } from "../../theme.jsx";
import { Input, Select } from "../../theme.jsx";
import { FromPlansBadge } from "./constants.jsx";

function BeamDesign({ structuralData, structuralResults }) {
  const sd = structuralData;
  const b0 = sd?.beams?.[0];
  const [fc, setFc] = useState(sd?.materials?.fc ?? "");
  const [fy, setFy] = useState(sd?.materials?.fy ?? "");
  const [b,  setB]  = useState(b0?.width  ?? "");
  const [d,  setD]  = useState(b0?.depth  ?? "");
  const [Mu, setMu] = useState(b0?.Mu     ?? "");
  const [Vu, setVu] = useState(b0?.Vu     ?? "");
  const [result, setResult] = useState(null);
  const [fp, setFp] = useState({fc:!!sd?.materials?.fc,fy:!!sd?.materials?.fy,b:!!b0?.width,d:!!b0?.depth,Mu:!!b0?.Mu,Vu:!!b0?.Vu});

  useEffect(()=>{
    if(!sd) return;
    const b1=sd?.beams?.[0];
    if(sd.materials?.fc)  {setFc(sd.materials.fc);  setFp(p=>({...p,fc:true}));}
    if(sd.materials?.fy)  {setFy(sd.materials.fy);  setFp(p=>({...p,fy:true}));}
    if(b1?.width) {setB(b1.width);  setFp(p=>({...p,b:true}));}
    if(b1?.depth) {setD(b1.depth);  setFp(p=>({...p,d:true}));}
    if(b1?.Mu)    {setMu(b1.Mu);    setFp(p=>({...p,Mu:true}));}
    if(b1?.Vu)    {setVu(b1.Vu);    setFp(p=>({...p,Vu:true}));}
  },[sd]);

  const calc = () => {
    if([fc,fy,b,d,Mu,Vu].some(v=>v==="")) return;
    const bm=+b/1000, dm=+d/1000, phi_b=0.90, phi_v=0.85;
    const Rn = (+Mu*1e3)/(phi_b*bm*dm*dm*1e6);
    const beta1 = +fc>=28 ? Math.max(0.65, 0.85-0.05*(+fc-28)/7) : 0.85;
    const rho_req = (0.85*+fc/+fy)*(1-Math.sqrt(Math.max(0,1-(2*Rn)/(0.85*+fc))));
    const rho_min = Math.max(0.25*Math.sqrt(+fc)/+fy, 1.4/+fy);
    const rho_max = 0.75*0.85*beta1*(+fc/+fy)*(600/(600+(+fy)));
    const rho_use = Math.max(rho_req, rho_min);
    const As_req  = rho_use*(+b)*(+d);
    const Vc = (1/6)*Math.sqrt(+fc)*(+b)*(+d)/1000;
    const Vs_req = +Vu/phi_v - Vc;
    const status_flex  = rho_req<=rho_max ? "PASS ✓" : "FAIL — over-reinforced ✗";
    const status_shear = Vc*phi_v>=(+Vu) ? "Vc adequate ✓" : `Stirrups required (Vs=${Vs_req.toFixed(1)} kN)`;
    setResult({Rn,rho_req,rho_min,rho_max,rho_use,As_req,Vc,Vs_req,status_flex,status_shear});
  };

  const Hint = ({c}) => <div style={{fontSize:11,color:T.muted,marginBottom:12,fontStyle:"italic"}}>{c}</div>;
  const canCalc = [fc,fy,b,d,Mu,Vu].every(v=>v!=="");

  const beamPriorItems = structuralResults?.items?.filter(i=>i.tool==="beam") || [];
  const beamAnyFail         = beamPriorItems.some(i=>i.status==="FAIL");
  const beamAnyUnverifiable = beamPriorItems.some(i=>i.status==="INCOMPLETE"||i.status==="NO DATA");
  const beamAllUnverifiable = beamPriorItems.length > 0 && beamPriorItems.every(i=>i.status==="INCOMPLETE"||i.status==="NO DATA");
  // Mixed: some verified PASS but others cannot verify — still warn
  const beamMixed           = beamAnyUnverifiable && !beamAllUnverifiable && !beamAnyFail;
  const beamAnyVerified     = beamPriorItems.some(i=>i.status==="PASS"||i.status==="FAIL");
  // True PASS only if items exist AND none are unverifiable or failing
  const beamTruePass        = beamPriorItems.length > 0 && !beamAnyFail && !beamAnyUnverifiable;
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        {!sd && <div style={{padding:"10px 14px",background:"rgba(6,150,215,0.06)",border:"1px solid rgba(6,150,215,0.15)",borderRadius:8,marginBottom:16,fontSize:12,color:"#0696d7",lineHeight:1.6}}>💡 Upload structural plans in <strong>AI Plan Checker</strong> to auto-fill beam dimensions.</div>}
        {sd && !sd.beams?.length && (
          <div style={{padding:"12px 14px",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8,marginBottom:16,fontSize:12,color:"#f59e0b",lineHeight:1.7}}>
            <strong style={{fontSize:13}}>⚠ No beam schedule found in plans</strong><br/>
            <span style={{color:T.muted}}>The AI could not extract beam dimensions or schedule from the uploaded plans. Enter beam dimensions manually below for a design check, or re-upload plans with the beam schedule visible.</span>
          </div>
        )}
        {sd && sd.beams?.length > 0 && (
          <div style={{padding:"12px 14px",background:"rgba(6,150,215,0.06)",border:"1px solid rgba(6,150,215,0.2)",borderRadius:8,marginBottom:16,fontSize:12,color:"#0696d7",lineHeight:1.7}}>
            <strong style={{fontSize:13}}>✓ {sd.beams.length} beam(s) extracted — NSCP verification available via Run All</strong><br/>
            <span style={{color:T.muted}}>Beam reinforcement was extracted from plans. Click "Run All" in the intelligence panel to verify against NSCP minimums. The manual calculator below is for additional analysis with factored loads (Mu, Vu) if available.</span>
          </div>
        )}
        <Label>Concrete Strength f'c (MPa) {fp.fc && <FromPlansBadge/>}</Label>
        <Select value={fc} onChange={e=>setFc(+e.target.value)} style={{marginBottom:4}}>
          <option value="">— Select grade —</option>
          {Object.entries(CONCRETE_GRADES).map(([k,v])=><option key={k} value={v}>{k} ({v} MPa)</option>)}
        </Select>
        <Hint c="Standard: 20.7 MPa (3000psi) residential, 27.6 MPa (4000psi) commercial."/>
        <Label>Steel Yield Strength fy (MPa) {fp.fy && <FromPlansBadge/>}</Label>
        <Select value={fy} onChange={e=>setFy(+e.target.value)} style={{marginBottom:16}}>
          <option value="">— Select grade —</option>
          {Object.entries(REBAR_GRADES).map(([k,v])=><option key={k} value={v}>{k} ({v} MPa)</option>)}
        </Select>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:4}}>
          <div><Label>Width b (mm) {fp.b && <FromPlansBadge/>}</Label><Input type="number" value={b} onChange={e=>setB(e.target.value)} placeholder="e.g. 300"/></div>
          <div><Label>Eff. Depth d (mm) {fp.d && <FromPlansBadge/>}</Label><Input type="number" value={d} onChange={e=>setD(e.target.value)} placeholder="e.g. 450"/></div>
        </div>
        <Hint c="Effective depth d = total depth − cover (40mm) − stirrup dia. − ½ main bar dia."/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:4}}>
          <div><Label>Mu (kN·m) {fp.Mu && <FromPlansBadge/>}</Label><Input type="number" value={Mu} onChange={e=>setMu(e.target.value)} placeholder="Factored moment"/></div>
          <div><Label>Vu (kN) {fp.Vu && <FromPlansBadge/>}</Label><Input type="number" value={Vu} onChange={e=>setVu(e.target.value)} placeholder="Factored shear"/></div>
        </div>
        <Hint c="Use factored loads per NSCP Sec. 203. Critical section for Vu at distance d from face of support."/>
        <button onClick={calc} disabled={!canCalc} style={{width:"100%",background:canCalc?"linear-gradient(135deg,#0696d7,#0569a8)":"rgba(255,255,255,0.05)",border:"none",color:canCalc?"#fff":T.muted,fontWeight:700,fontSize:14,padding:"13px",borderRadius:12,cursor:canCalc?"pointer":"not-allowed",marginTop:8,transition:"all 0.2s"}}>
          {canCalc ? "⚡ Design Beam (NSCP 2015 Sec. 406)" : "Fill all fields to calculate"}
        </button>
      </Card>
      {result ? (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Card style={{background:result.status_flex.includes("PASS")?"rgba(34,197,94,0.06)":"rgba(239,68,68,0.06)",border:`1.5px solid ${result.status_flex.includes("PASS")?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"}`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:2}}>FLEXURE STATUS</div>
            <div style={{fontSize:16,fontWeight:800,color:result.status_flex.includes("PASS")?"#22c55e":"#ef4444"}}>{result.status_flex}</div>
            <div style={{fontSize:22,fontWeight:900,color:T.text,marginTop:8}}>{result.As_req.toFixed(0)} <span style={{fontSize:13,fontWeight:400,color:T.muted}}>mm² required</span></div>
          </Card>
          {[
            {l:"Nominal Coeff. Rn",v:`${result.Rn.toFixed(4)} MPa`},
            {l:"Required ρ",v:`${(result.rho_req*100).toFixed(4)}%`},
            {l:"Minimum ρ",v:`${(result.rho_min*100).toFixed(4)}%`},
            {l:"Maximum ρ (0.75ρb)",v:`${(result.rho_max*100).toFixed(4)}%`},
            {l:"Design ρ used",v:`${(result.rho_use*100).toFixed(4)}%`,hi:true},
            {l:"Steel Area As",v:`${result.As_req.toFixed(0)} mm²`,hi:true},
            {l:"Concrete Shear Vc",v:`${result.Vc.toFixed(1)} kN`},
            {l:"Shear Status",v:result.status_shear,color:result.status_shear.includes("✓")?"#22c55e":"#f59e0b"},
          ].map(r=>(
            <div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 14px",background:r.hi?"rgba(6,150,215,0.08)":T.dim,borderRadius:7,border:r.hi?"1px solid rgba(6,150,215,0.2)":"none"}}>
              <span style={{fontSize:12,color:T.muted}}>{r.l}</span>
              <span style={{fontSize:13,fontWeight:700,color:r.color||(r.hi?"#0696d7":T.text),fontFamily:"monospace"}}>{r.v}</span>
            </div>
          ))}
          {/* ── Engineering Insights ── */}
          <div style={{padding:"14px 16px",background:result.status_flex.includes("PASS")?"rgba(34,197,94,0.04)":"rgba(239,68,68,0.04)",border:`1px solid ${result.status_flex.includes("PASS")?"rgba(34,197,94,0.15)":"rgba(239,68,68,0.15)"}`,borderRadius:10}}>
            <div style={{fontSize:11,fontWeight:800,color:result.status_flex.includes("PASS")?"#22c55e":"#ef4444",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>
              {result.status_flex.includes("PASS") ? "✓ Engineering Insight" : "⚠ Why This Beam Fails"}
            </div>
            <div style={{fontSize:12,color:T.text,lineHeight:1.8}}>
              {(() => {
                const insights = [];
                const rhoP = (result.rho_req*100).toFixed(3);
                // Flexure
                if (result.rho_req > result.rho_max) {
                  insights.push({type:"fail",text:`Over-reinforced: ρ_req = ${rhoP}% exceeds ρ_max = ${(result.rho_max*100).toFixed(3)}% (NSCP Sec. 406.3.3). The section is too small for the applied moment. Increase beam depth, width, or use higher f'c.`});
                } else if (result.rho_req <= result.rho_min) {
                  insights.push({type:"pass",text:`Minimum steel governs (ρ_min = ${(result.rho_min*100).toFixed(3)}%). Beam is lightly loaded in flexure — efficient section.`});
                } else {
                  const utilization = (result.rho_req/result.rho_max*100).toFixed(0);
                  insights.push({type:"pass",text:`Flexure OK: ρ_req = ${rhoP}% (${utilization}% of ρ_max). ${+utilization>80?"Moderately reinforced — approaching tension-controlled limit.":"Under-reinforced as intended — ductile failure mode."}`});
                }
                // Shear
                if (result.Vs_req > 0) {
                  insights.push({type:"warn",text:`Stirrups required: Vu exceeds φVc. Need Vs = ${result.Vs_req.toFixed(1)} kN capacity from stirrups. Typical: Ø10mm 2-leg stirrups spaced per NSCP Sec. 406.6.`});
                } else {
                  insights.push({type:"pass",text:`Concrete shear capacity (φVc = ${(result.Vc*0.85).toFixed(1)} kN) is sufficient. Minimum stirrups still required per NSCP Sec. 406.6.3.`});
                }
                return insights.map((ins,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:i<insights.length-1?8:0}}>
                    <span style={{flexShrink:0,fontSize:11,fontWeight:800,color:ins.type==="fail"?"#ef4444":ins.type==="warn"?"#f59e0b":"#22c55e"}}>
                      {ins.type==="fail"?"✗":ins.type==="warn"?"⚠":"✓"}
                    </span>
                    <span>{ins.text}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>NSCP 2015 Sec. 406 — Singly reinforced. Verify bar selection and spacing per Sec. 406.4.</div>
        </div>
      ) : beamPriorItems.length > 0 ? (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Card style={{background:beamAnyFail?"rgba(239,68,68,0.06)":(beamAllUnverifiable||beamMixed)?"rgba(245,158,11,0.06)":beamTruePass?"rgba(34,197,94,0.06)":"rgba(255,255,255,0.03)",border:`1.5px solid ${beamAnyFail?"rgba(239,68,68,0.3)":(beamAllUnverifiable||beamMixed)?"rgba(245,158,11,0.3)":beamTruePass?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.08)"}`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>RUN ALL — BEAM DESIGN RESULT</div>
            <div style={{fontSize:18,fontWeight:900,color:beamAnyFail?"#ef4444":(beamAllUnverifiable||beamMixed)?"#f59e0b":beamTruePass?"#22c55e":T.muted,marginBottom:8}}>
              {beamAnyFail?"✗ FAIL — Beam(s) do not satisfy NSCP Sec. 406":beamAllUnverifiable?"⚠ CANNOT VERIFY — Enter Mu and Vu for each beam":beamMixed?"⚠ PARTIAL — Some beams cannot be verified":beamTruePass?"✓ PASS — All beams satisfy NSCP requirements":"— Run All to compute beam results"}
            </div>
            <div style={{fontSize:11,color:T.muted,marginBottom:10}}>Results from last Run All. Enter Mu and Vu then click Calculate for a full detailed check on any member.</div>
            {beamPriorItems.map((item,idx)=>(
              <div key={idx} style={{padding:"8px 12px",background:T.dim,borderRadius:8,marginBottom:6,border:`1px solid ${item.status==="FAIL"?"rgba(239,68,68,0.3)":"rgba(34,197,94,0.2)"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,fontWeight:700,color:T.text}}>{item.id}</span>
                  <span style={{fontSize:11,fontWeight:800,color:item.status==="FAIL"?"#ef4444":item.status==="PASS"?"#22c55e":"#0696d7",padding:"1px 8px",borderRadius:6,background:item.status==="FAIL"?"rgba(239,68,68,0.1)":item.status==="PASS"?"rgba(34,197,94,0.1)":"rgba(6,150,215,0.1)"}}>{item.status}</span>
                </div>
                {item.value && <div style={{fontSize:11,color:T.muted,marginTop:4,fontFamily:"monospace"}}>{item.value}</div>}
                {item.detail && <div style={{fontSize:11,color:T.muted,marginTop:2,fontFamily:"monospace"}}>{item.detail}</div>}
                {item.failReason && <div style={{fontSize:11,color:"#ef4444",marginTop:5,padding:"5px 8px",background:"rgba(239,68,68,0.08)",borderRadius:6,borderLeft:"2px solid #ef4444",lineHeight:1.5}}>⚠ Why it failed: {item.failReason}</div>}
                {item.error && <div style={{fontSize:11,color:item.status==="CANNOT VERIFY"?"#f59e0b":"#ef4444",marginTop:5,padding:"5px 8px",background:item.status==="CANNOT VERIFY"?"rgba(245,158,11,0.08)":"rgba(239,68,68,0.08)",borderRadius:6,borderLeft:`2px solid ${item.status==="CANNOT VERIFY"?"#f59e0b":"#ef4444"}`,lineHeight:1.5}}>{item.status==="CANNOT VERIFY"?"⚠ Cannot verify: ":"⚠ "}{item.error}</div>}
              </div>
            ))}
          </Card>
          <Card style={{background:"rgba(6,150,215,0.04)",border:"1px solid rgba(6,150,215,0.15)"}}>
            <div style={{fontSize:11,color:"#0696d7",fontWeight:700,marginBottom:4}}>HOW TO DO A DETAILED CHECK</div>
            <div style={{fontSize:11,color:T.muted,lineHeight:1.6}}>1. Enter the beam's Mu (factored moment) and Vu (factored shear) on the left.<br/>2. Verify fc, fy, width b, effective depth d for that member.<br/>3. Click Calculate for full Rn, ρ, As, Vc compliance check.</div>
          </Card>
        </div>
      ) : (
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}>
          <Icon name="beam" size={40} color={T.muted}/>
          <div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Fill parameters and click<br/>Calculate to see results</div>
        </Card>
      )}
    </div>
  );
}

// ─── STRUCTICODE: COLUMN DESIGN ──────────────────────────────────────────────

export default BeamDesign;
