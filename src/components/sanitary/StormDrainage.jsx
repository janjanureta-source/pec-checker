import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { Card, Label } from "../../theme.jsx";
import { Input, Select } from "../../theme.jsx";
import { SC } from "./constants.jsx";

function StormDrainage() {
  const [area,setArea]=useState(500);
  const [runoff,setRunoff]=useState(0.85);
  const [intensity,setIntensity]=useState(100);
  const [slope,setSlope]=useState(0.005);
  const [result,setResult]=useState(null);
  const RUNOFF={"Roof / Concrete (0.90)":0.90,"Asphalt pavement (0.85)":0.85,"Gravel / compacted (0.60)":0.60,"Lawns / grass (0.35)":0.35,"Mixed residential (0.55)":0.55};
  const calc=()=>{
    const Q=runoff*intensity*area/3600000;
    const Q_lps=Q*1000;
    let dia_m=0.1;
    for(let i=0;i<50;i++){const r=dia_m/4,A=Math.PI*dia_m*dia_m/4,Qfull=(1/0.013)*A*Math.pow(r,2/3)*Math.pow(slope,0.5);if(Qfull>=Q)break;dia_m+=0.025;}
    const dia_mm=Math.ceil(dia_m*1000/25)*25;
    const r=dia_mm/4000,A=Math.PI*(dia_mm/1000)*(dia_mm/1000)/4;
    const V=(1/0.013)*Math.pow(r,2/3)*Math.pow(slope,0.5);
    const Qcap=A*V*1000;
    setResult({Q_lps,dia_mm,V,Qcap});
  };
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Drainage Area (m²)</Label><Input type="number" value={area} onChange={e=>setArea(+e.target.value)} style={{marginBottom:16}}/>
        <Label>Surface / Runoff Coefficient C</Label>
        <Select value={runoff} onChange={e=>setRunoff(+e.target.value)} style={{marginBottom:16}}>{Object.entries(RUNOFF).map(([k,v])=><option key={k} value={v}>{k}</option>)}</Select>
        <Label>Rainfall Intensity (mm/hr)</Label><Input type="number" value={intensity} onChange={e=>setIntensity(+e.target.value)} style={{marginBottom:8}}/>
        <div style={{fontSize:11,color:T.muted,marginBottom:16}}>Metro Manila ≈ 100mm/hr · Visayas/Mindanao ≈ 80-120mm/hr</div>
        <Label>Storm Drain Slope (m/m)</Label>
        <Select value={slope} onChange={e=>setSlope(+e.target.value)} style={{marginBottom:20}}>
          <option value={0.003}>0.3% minimum</option><option value={0.005}>0.5% recommended</option><option value={0.01}>1.0%</option><option value={0.02}>2.0%</option>
        </Select>
        <button onClick={calc} style={{width:"100%",background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>🌊 Size Storm Drain</button>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:"rgba(16,185,129,0.06)",border:`1.5px solid rgba(16,185,129,0.3)`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>STORM DRAIN SIZE</div>
            <div style={{fontSize:48,fontWeight:900,color:SC}}>{result.dia_mm} <span style={{fontSize:18,fontWeight:400}}>mm dia.</span></div>
            <div style={{fontSize:13,color:T.muted,marginTop:4}}>Capacity: {result.Qcap.toFixed(1)} L/s @ {result.V.toFixed(2)} m/s</div>
          </Card>
          {[{l:"Design flow Q",v:`${result.Q_lps.toFixed(2)} L/s`,h:true},{l:"Required pipe dia.",v:`${result.dia_mm}mm`,h:true},{l:"Pipe capacity",v:`${result.Qcap.toFixed(1)} L/s`},{l:"Flow velocity",v:`${result.V.toFixed(2)} m/s`}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.h?`rgba(16,185,129,0.08)`:T.dim,borderRadius:8,border:r.h?`1px solid rgba(16,185,129,0.2)`:"none"}}><span style={{fontSize:13,color:T.muted}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.h?SC:T.text,fontFamily:"monospace"}}>{r.v}</span></div>)}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>Rational Method Q=CiA · Manning n=0.013 · NPC 2000 Sec. 11</div>
        </div>
      ):(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}><div style={{fontSize:48}}>🌊</div><div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter catchment data<br/>and click Size Storm Drain</div></Card>
      )}
    </div>
  );
}

// ─── SANICODE: MAIN WRAPPER ───────────────────────────────────────────────────
// ─── ELECCODE: MAIN ELECTRICAL MODULE ───────────────────────────────────────

// ─── PANEL SCHEDULE BUILDER ──────────────────────────────────────────────────

export default StormDrainage;
