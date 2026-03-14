import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { CONCRETE_GRADES, REBAR_GRADES } from "./constants.jsx";
import { Card, Label } from "../../theme.jsx";
import { Input, Select } from "../../theme.jsx";
import { FromPlansBadge } from "./constants.jsx";

function SlabDesign({ structuralData, structuralResults }) {
  const sd=structuralData, s0=sd?.slabs?.[0];
  const [fc,setFc]=useState(sd?.materials?.fc??"");
  const [fy,setFy]=useState(sd?.materials?.fy??"");
  const [slabType,setSlabType]=useState(s0?.type||"one-way");
  const [L,setL]=useState(s0?.span??"");
  const [S,setS]=useState("");
  const [wDL,setWDL]=useState(s0?.DL??sd?.loads?.floorDL??"");
  const [wLL,setWLL]=useState(s0?.LL??sd?.loads?.floorLL??"");
  const [result,setResult]=useState(null);
  const [fp,setFp]=useState({fc:!!sd?.materials?.fc,fy:!!sd?.materials?.fy,L:!!s0?.span,wDL:!!(s0?.DL||sd?.loads?.floorDL),wLL:!!(s0?.LL||sd?.loads?.floorLL)});

  useEffect(()=>{
    if(!sd) return; const s1=sd?.slabs?.[0];
    if(sd.materials?.fc){setFc(sd.materials.fc);setFp(p=>({...p,fc:true}));}
    if(sd.materials?.fy){setFy(sd.materials.fy);setFp(p=>({...p,fy:true}));}
    if(s1?.span){setL(s1.span);setFp(p=>({...p,L:true}));}
    if(s1?.DL||sd.loads?.floorDL){setWDL(s1?.DL||sd.loads.floorDL);setFp(p=>({...p,wDL:true}));}
    if(s1?.LL||sd.loads?.floorLL){setWLL(s1?.LL||sd.loads.floorLL);setFp(p=>({...p,wLL:true}));}
  },[sd]);

  const calc=()=>{
    if([fc,fy,L,wDL,wLL].some(v=>v==="")||( slabType==="two-way"&&S==="")) return;
    const wu=1.2*(+wDL)+1.6*(+wLL);
    const h_min=slabType==="one-way"?(+L)*1000/20:(+S)*1000/33;
    const h=Math.max(Math.ceil(h_min/10)*10,100), d=h-25;
    let Ma=wu*(+L)*(+L)/8, Mb=null;
    if(slabType==="two-way"){
      const r=(+L)/(+S), Ca=Math.max(0.05,Math.min(0.5,0.0625+(r-1)*0.03));
      const Cb=Math.max(0.05,Math.min(0.5,0.0625-(r-1)*0.015));
      Ma=Ca*wu*(+S)*(+S); Mb=Cb*wu*(+L)*(+L);
    }
    const Mu_des=Mb!=null?Math.max(Ma,Mb):Ma;
    const Rn=(Mu_des*1e6)/(0.90*1000*d*d);
    const rho=(0.85*+fc/+fy)*(1-Math.sqrt(Math.max(0,1-(2*Rn)/(0.85*+fc))));
    const rho_use=Math.max(rho,0.0018);
    const As=rho_use*1000*d;
    setResult({wu,h,d,Ma,Mb,Mu_des,As,rho_use});
  };

  const Hint=({c})=><div style={{fontSize:11,color:T.muted,marginBottom:12,fontStyle:"italic"}}>{c}</div>;
  const canCalc=[fc,fy,L,wDL,wLL].every(v=>v!=="")&&(slabType==="one-way"||S!=="");

  const slabPriorItems = structuralResults?.items?.filter(i=>i.tool==="slab") || [];
  const slabAnyFail    = slabPriorItems.some(i=>i.status==="FAIL");
  const slabAllUnverifiable = slabPriorItems.length > 0 && slabPriorItems.every(i=>i.status==="INCOMPLETE"||i.status==="NO DATA");

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        {!sd && <div style={{padding:"10px 14px",background:"rgba(6,150,215,0.06)",border:"1px solid rgba(6,150,215,0.15)",borderRadius:8,marginBottom:16,fontSize:12,color:"#0696d7",lineHeight:1.6}}>💡 Upload structural plans in <strong>AI Plan Checker</strong> to auto-fill slab data.</div>}
        {sd && !sd.slabs?.length && (
          <div style={{padding:"12px 14px",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8,marginBottom:16,fontSize:12,color:"#f59e0b",lineHeight:1.7}}>
            <strong style={{fontSize:13}}>⚠ Unverifiable — No slab data found in plans</strong><br/>
            <span style={{color:T.muted}}>The AI could not extract slab dimensions or loading data from the uploaded plans. Enter slab type, span, thickness, and loads manually below to run the design check.</span>
          </div>
        )}
        <Label>Slab Type</Label>
        <Select value={slabType} onChange={e=>setSlabType(e.target.value)} style={{marginBottom:4}}>
          <option value="one-way">One-Way Slab (L/S &gt; 2)</option>
          <option value="two-way">Two-Way Slab (L/S ≤ 2)</option>
        </Select>
        <Hint c="One-way: strips span in one direction. Two-way: more efficient for near-square panels."/>
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
        <div style={{display:"grid",gridTemplateColumns:slabType==="two-way"?"1fr 1fr":"1fr",gap:12,marginBottom:4}}>
          <div>
            <Label>{slabType==="two-way"?"Short Span S (m)":"Span L (m)"} {fp.L&&<FromPlansBadge/>}</Label>
            <Input type="number" value={slabType==="two-way"?S:L} onChange={e=>slabType==="two-way"?setS(e.target.value):setL(e.target.value)} step="0.1" placeholder={slabType==="two-way"?"e.g. 4.0":"e.g. 4.5"}/>
          </div>
          {slabType==="two-way"&&<div><Label>Long Span L (m) {fp.L&&<FromPlansBadge/>}</Label><Input type="number" value={L} onChange={e=>setL(e.target.value)} step="0.1" placeholder="e.g. 6.0"/></div>}
        </div>
        <Hint c="Clear span measured face-to-face of supporting beams or walls."/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:4}}>
          <div><Label>DL (kPa) {fp.wDL&&<FromPlansBadge/>}</Label><Input type="number" value={wDL} onChange={e=>setWDL(e.target.value)} step="0.1" placeholder="e.g. 3.0"/></div>
          <div><Label>LL (kPa) {fp.wLL&&<FromPlansBadge/>}</Label><Input type="number" value={wLL} onChange={e=>setWLL(e.target.value)} step="0.1" placeholder="e.g. 2.4"/></div>
        </div>
        <Hint c="LL per NSCP Table 205-1: Residential=2.0, Office=2.4, Corridor=4.8kPa."/>
        <button onClick={calc} disabled={!canCalc} style={{width:"100%",background:canCalc?"linear-gradient(135deg,#0696d7,#0569a8)":"rgba(255,255,255,0.05)",border:"none",color:canCalc?"#fff":T.muted,fontWeight:700,fontSize:14,padding:"13px",borderRadius:12,cursor:canCalc?"pointer":"not-allowed",marginTop:8,transition:"all 0.2s"}}>
          {canCalc?"⚡ Design Slab (NSCP 2015 Sec. 409)":"Fill all fields to calculate"}
        </button>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Card style={{background:"rgba(34,197,94,0.06)",border:"1.5px solid rgba(34,197,94,0.3)"}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:2}}>SLAB THICKNESS</div>
            <div style={{fontSize:36,fontWeight:900,color:"#22c55e"}}>{result.h} <span style={{fontSize:16,fontWeight:400}}>mm</span></div>
            <div style={{fontSize:13,color:T.muted,marginTop:4}}>d = {result.d} mm</div>
          </Card>
          {[
            {l:"wu (factored)",v:`${result.wu.toFixed(2)} kPa`},
            {l:result.Mb!=null?"Ma (short dir)":"Design Moment",v:`${result.Ma.toFixed(2)} kN·m/m`},
            ...(result.Mb!=null?[{l:"Mb (long dir)",v:`${result.Mb.toFixed(2)} kN·m/m`}]:[]),
            {l:"ρ used",v:`${(result.rho_use*100).toFixed(4)}%`,hi:true},
            {l:"As required",v:`${result.As.toFixed(0)} mm²/m`,hi:true},
          ].map(r=>(
            <div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 14px",background:r.hi?"rgba(6,150,215,0.08)":T.dim,borderRadius:7,border:r.hi?"1px solid rgba(6,150,215,0.2)":"none"}}>
              <span style={{fontSize:12,color:T.muted}}>{r.l}</span>
              <span style={{fontSize:13,fontWeight:700,color:r.hi?"#0696d7":T.text,fontFamily:"monospace"}}>{r.v}</span>
            </div>
          ))}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>NSCP 2015 Sec. 409 — Minimum h for deflection control. Bar spacing ≤ 3h or 450mm (Sec. 407.7.5).</div>
        </div>
      ) : slabPriorItems.length > 0 ? (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Card style={{background:slabAnyFail?"rgba(239,68,68,0.06)":slabAllUnverifiable?"rgba(245,158,11,0.06)":"rgba(34,197,94,0.06)",border:`1.5px solid ${slabAnyFail?"rgba(239,68,68,0.3)":slabAllUnverifiable?"rgba(245,158,11,0.3)":"rgba(34,197,94,0.3)"}`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>RUN ALL — SLAB DESIGN RESULT</div>
            <div style={{fontSize:18,fontWeight:900,color:slabAnyFail?"#ef4444":slabAllUnverifiable?"#f59e0b":"#22c55e",marginBottom:8}}>
              {slabAnyFail?"✗ FAIL — Slab(s) do not satisfy NSCP Sec. 409":slabAllUnverifiable?"⚠ CANNOT VERIFY — Enter loads and span for each slab":"✓ PASS — All slabs satisfy NSCP requirements"}
            </div>
            <div style={{fontSize:11,color:T.muted,marginBottom:10}}>Results from last Run All. Fill in spans and loads then click Calculate for a full check.</div>
            {slabPriorItems.map((item,idx)=>(
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
            <div style={{fontSize:11,color:T.muted,lineHeight:1.6}}>1. Enter slab spans (S, L) and loads (DL, LL).<br/>2. Verify fc, fy, and slab type.<br/>3. Click Calculate for full thickness, reinforcement, and deflection check.</div>
          </Card>
        </div>
      ) : (
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}>
          <Icon name="slab" size={40} color={T.muted}/>
          <div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Fill parameters and click<br/>Calculate to see results</div>
        </Card>
      )}
    </div>
  );
}

// ─── STRUCTICODE: LOAD COMBINATIONS ──────────────────────────────────────────

export default SlabDesign;
