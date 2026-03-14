import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { Card, Label } from "../../theme.jsx";
import { Input, Select } from "../../theme.jsx";
import { SC } from "./constants.jsx";

function SepticTankSizing() {
  const [persons,setPersons]=useState(10);
  const [bldgUse,setBldgUse]=useState("residential");
  const [retDays,setRetDays]=useState(1);
  const [result,setResult]=useState(null);
  const GPCD={residential:80,commercial:25,school:15,office:20};
  const calc=()=>{
    const gpcd=GPCD[bldgUse];
    const flow_lpd=persons*gpcd*3.785;
    const liq_vol=flow_lpd*retDays;
    const total_vol=liq_vol*1.3;
    const width=Math.max(1.2,Math.pow(total_vol/1000/(1.5*2),0.5));
    const length=2*width;
    const liquid_depth=liq_vol/1000/(width*length);
    const total_depth=liquid_depth+0.3;
    setResult({flow_lpd,liq_vol,total_vol,width,length,liquid_depth,total_depth,freeboard:0.3,gpcd,persons});
  };
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Building Use</Label>
        <Select value={bldgUse} onChange={e=>setBldgUse(e.target.value)} style={{marginBottom:16}}>
          <option value="residential">Residential (80 GPCD)</option>
          <option value="commercial">Commercial (25 GPCD)</option>
          <option value="school">School (15 GPCD)</option>
          <option value="office">Office (20 GPCD)</option>
        </Select>
        <Label>Number of Persons</Label>
        <Input type="number" value={persons} onChange={e=>setPersons(+e.target.value)} style={{marginBottom:16}}/>
        <Label>Retention Period (days)</Label>
        <Select value={retDays} onChange={e=>setRetDays(+e.target.value)} style={{marginBottom:20}}>
          <option value={1}>1 day — Residential</option>
          <option value={2}>2 days — Commercial</option>
          <option value={3}>3 days — Industrial</option>
        </Select>
        <button onClick={calc} style={{width:"100%",background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>🪣 Size Septic Tank</button>
        <div style={{marginTop:12,padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted}}>Per PD 856 Sanitation Code · NPC 2000 Sec. 13</div>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:"rgba(16,185,129,0.06)",border:`1.5px solid rgba(16,185,129,0.3)`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>SEPTIC TANK SIZE</div>
            <div style={{fontSize:26,fontWeight:900,color:SC}}>{result.length.toFixed(2)}m × {result.width.toFixed(2)}m × {result.total_depth.toFixed(2)}m</div>
            <div style={{fontSize:13,color:T.muted,marginTop:4}}>L × W × D</div>
          </Card>
          {[{l:"Wastewater flow",v:`${result.flow_lpd.toFixed(0)} L/day`},{l:"Liquid capacity",v:`${result.liq_vol.toFixed(0)} L`,h:true},{l:"Total volume",v:`${result.total_vol.toFixed(0)} L`,h:true},{l:"Tank length",v:`${result.length.toFixed(2)} m`},{l:"Tank width",v:`${result.width.toFixed(2)} m`},{l:"Liquid depth",v:`${result.liquid_depth.toFixed(2)} m`},{l:"Freeboard",v:"0.30 m"},{l:"Total depth",v:`${result.total_depth.toFixed(2)} m`,h:true}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.h?`rgba(16,185,129,0.08)`:T.dim,borderRadius:8,border:r.h?`1px solid rgba(16,185,129,0.2)`:"none"}}><span style={{fontSize:13,color:T.muted}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.h?SC:T.text,fontFamily:"monospace"}}>{r.v}</span></div>)}
        </div>
      ):(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}><div style={{fontSize:48}}>🪣</div><div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter parameters and click<br/>Size Septic Tank</div></Card>
      )}
    </div>
  );
}

// ─── SANICODE: WATER DEMAND ───────────────────────────────────────────────────

export default SepticTankSizing;
