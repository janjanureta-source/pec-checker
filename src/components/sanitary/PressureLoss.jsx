import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { Card, Label } from "../../theme.jsx";
import { Input, Select } from "../../theme.jsx";
import { SC } from "./constants.jsx";

function PressureLoss() {
  const [flow,setFlow]=useState(1.5);
  const [dia,setDia]=useState(50);
  const [len,setLen]=useState(20);
  const [fitK,setFitK]=useState(5);
  const [elev,setElev]=useState(5);
  const [result,setResult]=useState(null);
  const calc=()=>{
    const d=dia/1000,A=Math.PI*d*d/4,V=flow/1000/A;
    const Re=V*d/1e-6;
    const f=Re<2300?64/Re:0.3164/Math.pow(Re,0.25);
    const hf=f*(len/d)*(V*V/(2*9.81));
    const hm=fitK*(V*V/(2*9.81));
    const htotal=hf+hm+elev;
    const status=V>=0.6&&V<=3.0?"GOOD VELOCITY":"CHECK VELOCITY";
    setResult({V,Re,f,hf,hm,he:elev,htotal,status});
  };
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Flow Rate (L/s)</Label><Input type="number" value={flow} onChange={e=>setFlow(+e.target.value)} step="0.1" style={{marginBottom:16}}/>
        <Label>Pipe Diameter (mm)</Label>
        <Select value={dia} onChange={e=>setDia(+e.target.value)} style={{marginBottom:16}}>{[13,19,25,32,38,50,63,75,100,150,200].map(d=><option key={d} value={d}>{d}mm</option>)}</Select>
        <Label>Pipe Length (m)</Label><Input type="number" value={len} onChange={e=>setLen(+e.target.value)} style={{marginBottom:16}}/>
        <Label>Sum of Minor Loss Coefficients K</Label><Input type="number" value={fitK} onChange={e=>setFitK(+e.target.value)} step="0.5" style={{marginBottom:8}}/>
        <div style={{fontSize:11,color:T.muted,marginBottom:16}}>Elbow=1.5 · Tee=2.0 · Gate valve=0.2 · Check valve=3.0</div>
        <Label>Elevation Change (m, + upward)</Label><Input type="number" value={elev} onChange={e=>setElev(+e.target.value)} step="0.5" style={{marginBottom:20}}/>
        <button onClick={calc} style={{width:"100%",background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>⬆️ Calculate Pressure Loss</button>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:result.status==="GOOD VELOCITY"?"rgba(16,185,129,0.06)":"rgba(245,158,11,0.06)",border:`1.5px solid ${result.status==="GOOD VELOCITY"?"rgba(16,185,129,0.3)":"rgba(245,158,11,0.3)"}`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>TOTAL HEAD LOSS</div>
            <div style={{fontSize:42,fontWeight:900,color:result.status==="GOOD VELOCITY"?SC:T.warn}}>{result.htotal.toFixed(2)} <span style={{fontSize:18,fontWeight:400}}>m</span></div>
            <div style={{fontSize:13,color:T.muted,marginTop:4}}>{result.V.toFixed(2)} m/s — {result.status}</div>
          </Card>
          {[{l:"Flow velocity",v:`${result.V.toFixed(3)} m/s`,h:true},{l:"Reynolds number",v:result.Re.toFixed(0)},{l:"Friction factor",v:result.f.toFixed(5)},{l:"Friction loss hf",v:`${result.hf.toFixed(3)} m`},{l:"Minor losses hm",v:`${result.hm.toFixed(3)} m`},{l:"Elevation he",v:`${result.he.toFixed(2)} m`},{l:"Total head loss",v:`${result.htotal.toFixed(3)} m`,h:true}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.h?`rgba(16,185,129,0.08)`:T.dim,borderRadius:8,border:r.h?`1px solid rgba(16,185,129,0.2)`:"none"}}><span style={{fontSize:13,color:T.muted}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.h?SC:T.text,fontFamily:"monospace"}}>{r.v}</span></div>)}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>Darcy-Weisbach · Blasius friction factor · NPC 2000 Sec. 6</div>
        </div>
      ):(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}><div style={{fontSize:48}}>⬆️</div><div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter pipe parameters<br/>and click Calculate</div></Card>
      )}
    </div>
  );
}

// ─── SANICODE: STORM DRAINAGE ─────────────────────────────────────────────────

export default PressureLoss;
