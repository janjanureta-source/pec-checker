import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { Card, Label } from "../../theme.jsx";
import { Input, Select } from "../../theme.jsx";
import { SC } from "./constants.jsx";

function WaterDemandCalc() {
  const [bldgType,setBldgType]=useState("residential");
  const [units,setUnits]=useState(10);
  const [persons,setPersons]=useState(4);
  const [floors,setFloors]=useState(3);
  const [result,setResult]=useState(null);
  const DEMANDS={residential:{label:"Residential (per person)",gpd:80,unit:"persons"},apartment:{label:"Apartment (per unit)",gpd:250,unit:"units"},office:{label:"Office (per person)",gpd:20,unit:"persons"},school:{label:"School (per student)",gpd:15,unit:"persons"},hospital:{label:"Hospital (per bed)",gpd:300,unit:"units"},hotel:{label:"Hotel (per room)",gpd:200,unit:"units"},restaurant:{label:"Restaurant (per seat)",gpd:50,unit:"units"},mall:{label:"Mall (per 100sqm)",gpd:400,unit:"units"}};
  const calc=()=>{
    const dem=DEMANDS[bldgType];
    const count=dem.unit==="persons"?persons*units:units;
    const avg_lpd=count*dem.gpd*3.785;
    const avg_lps=avg_lpd/86400;
    const peak_lps=avg_lps*3.5;
    const storage_L=avg_lpd*0.5;
    const roof_L=avg_lpd*0.25;
    setResult({avg_lpd,avg_lps,peak_lps,storage_L,tank_m3:storage_L/1000,roof_L,count,dem});
  };
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Building Type</Label>
        <Select value={bldgType} onChange={e=>setBldgType(e.target.value)} style={{marginBottom:16}}>{Object.entries(DEMANDS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</Select>
        {DEMANDS[bldgType].unit==="persons"&&<><Label>Units / Floors</Label><Input type="number" value={units} onChange={e=>setUnits(+e.target.value)} style={{marginBottom:16}}/><Label>Persons per Unit</Label><Input type="number" value={persons} onChange={e=>setPersons(+e.target.value)} style={{marginBottom:16}}/></>}
        {DEMANDS[bldgType].unit==="units"&&<><Label>Units / Beds / Seats / Rooms</Label><Input type="number" value={units} onChange={e=>setUnits(+e.target.value)} style={{marginBottom:16}}/></>}
        <Label>Number of Floors</Label>
        <Input type="number" value={floors} onChange={e=>setFloors(+e.target.value)} style={{marginBottom:20}}/>
        <button onClick={calc} style={{width:"100%",background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>💧 Calculate Water Demand</button>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:"rgba(16,185,129,0.06)",border:`1.5px solid rgba(16,185,129,0.3)`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>AVERAGE DAILY DEMAND</div>
            <div style={{fontSize:36,fontWeight:900,color:SC}}>{result.avg_lpd.toFixed(0)} <span style={{fontSize:16,fontWeight:400}}>L/day</span></div>
          </Card>
          {[{l:"Total occupants",v:`${result.count}`},{l:"Average daily demand",v:`${result.avg_lpd.toFixed(0)} L/day`,h:true},{l:"Average flow",v:`${result.avg_lps.toFixed(3)} L/s`},{l:"Peak demand",v:`${result.peak_lps.toFixed(3)} L/s`,h:true},{l:"Ground storage (12hr)",v:`${result.storage_L.toFixed(0)} L`,h:true},{l:"Roof tank (6hr)",v:`${result.roof_L.toFixed(0)} L`},{l:"Pressure zones",v:`${Math.ceil(floors/5)}`}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.h?`rgba(16,185,129,0.08)`:T.dim,borderRadius:8,border:r.h?`1px solid rgba(16,185,129,0.2)`:"none"}}><span style={{fontSize:13,color:T.muted}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.h?SC:T.text,fontFamily:"monospace"}}>{r.v}</span></div>)}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>NPC 2000 Sec. 6 · LWUA standards · 1 pressure zone per 5 floors</div>
        </div>
      ):(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}><div style={{fontSize:48}}>💧</div><div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter building data<br/>and click Calculate</div></Card>
      )}
    </div>
  );
}

// ─── SANICODE: PRESSURE LOSS ──────────────────────────────────────────────────

export default WaterDemandCalc;
