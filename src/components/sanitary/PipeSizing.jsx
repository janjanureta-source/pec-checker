import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { DFU_TO_PIPE, WSFU_TO_GPM, SC} from "./constants.jsx";
import { Card, Label } from "../../theme.jsx";
import { Input, Select } from "../../theme.jsx";

function PipeSizing() {
  const [pipeType,setPipeType]=useState("drain");
  const [dfu,setDfu]=useState(20);
  const [wsfu,setWsfu]=useState(15);
  const [slope,setSlope]=useState(0.02);
  const [result,setResult]=useState(null);
  const calc=()=>{
    if(pipeType==="drain"){
      const rec=DFU_TO_PIPE.find(p=>dfu<=p.maxDfu)||DFU_TO_PIPE[DFU_TO_PIPE.length-1];
      const d=rec.dia/1000,n=0.013,r=d/4;
      const vel=(1/n)*Math.pow(r,2/3)*Math.pow(slope,0.5);
      const status=vel>=0.6&&vel<=3.0?"PASS — Self-cleansing":"CHECK SLOPE";
      setResult({type:"drain",rec,vel,status,dfu});
    }else{
      const gpm=WSFU_TO_GPM(wsfu);
      const lps=gpm*0.06309;
      const dia=gpm<=4?19:gpm<=8?25:gpm<=15?32:gpm<=30?38:gpm<=50?50:75;
      setResult({type:"supply",gpm,lps,dia,wsfu});
    }
  };
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Pipe System Type</Label>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[{k:"drain",l:"🚽 Drainage / DWV"},{k:"supply",l:"💧 Water Supply"}].map(t=><button key={t.k} onClick={()=>setPipeType(t.k)} style={{flex:1,padding:"8px",borderRadius:8,border:`1.5px solid ${pipeType===t.k?SC:T.border}`,background:pipeType===t.k?`rgba(16,185,129,0.12)`:"transparent",color:pipeType===t.k?SC:T.muted,cursor:"pointer",fontSize:12,fontWeight:700}}>{t.l}</button>)}
        </div>
        {pipeType==="drain"?(
          <><Label>Total DFU</Label><Input type="number" value={dfu} onChange={e=>setDfu(+e.target.value)} style={{marginBottom:16}}/><Label>Drain Slope</Label><Select value={slope} onChange={e=>setSlope(+e.target.value)} style={{marginBottom:16}}><option value={0.01}>1% (1:100)</option><option value={0.02}>2% (1:50) recommended</option><option value={0.04}>4% (1:25)</option><option value={0.0625}>6.25% (1:16)</option></Select></>
        ):(
          <><Label>Total WSFU</Label><Input type="number" value={wsfu} onChange={e=>setWsfu(+e.target.value)} style={{marginBottom:16}}/></>
        )}
        <button onClick={calc} style={{width:"100%",background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>📏 Size the Pipe</button>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:"rgba(16,185,129,0.06)",border:`1.5px solid rgba(16,185,129,0.3)`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>RECOMMENDED PIPE DIAMETER</div>
            <div style={{fontSize:48,fontWeight:900,color:SC}}>{result.type==="drain"?result.rec.dia:result.dia} <span style={{fontSize:18,fontWeight:400}}>mm</span></div>
            {result.type==="drain"&&<div style={{fontSize:13,color:T.muted,marginTop:4}}>Velocity: {result.vel.toFixed(2)} m/s — {result.status}</div>}
            {result.type==="supply"&&<div style={{fontSize:13,color:T.muted,marginTop:4}}>{result.gpm.toFixed(1)} GPM · {result.lps.toFixed(2)} L/s</div>}
          </Card>
          {result.type==="drain"&&[{l:"DFU load",v:`${result.dfu}`},{l:"Min pipe dia",v:`${result.rec.dia}mm`,h:true},{l:"Flow velocity",v:`${result.vel.toFixed(2)} m/s`},{l:"Status",v:result.status,h:true}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.h?`rgba(16,185,129,0.08)`:T.dim,borderRadius:8,border:r.h?`1px solid rgba(16,185,129,0.2)`:"none"}}><span style={{fontSize:13,color:T.muted}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.h?SC:T.text,fontFamily:"monospace"}}>{r.v}</span></div>)}
          {result.type==="supply"&&[{l:"WSFU",v:`${result.wsfu}`},{l:"Flow",v:`${result.gpm.toFixed(1)} GPM`,h:true},{l:"Flow L/s",v:`${result.lps.toFixed(2)} L/s`},{l:"Supply pipe",v:`${result.dia}mm`,h:true}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.h?`rgba(16,185,129,0.08)`:T.dim,borderRadius:8,border:r.h?`1px solid rgba(16,185,129,0.2)`:"none"}}><span style={{fontSize:13,color:T.muted}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.h?SC:T.text,fontFamily:"monospace"}}>{r.v}</span></div>)}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>NPC 2000 Sec. 4 · Manning n=0.013 · Hunter method for supply</div>
        </div>
      ):(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}><div style={{fontSize:48}}>📏</div><div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter parameters and click<br/>Size the Pipe</div></Card>
      )}
    </div>
  );
}

// ─── SANICODE: SEPTIC TANK ────────────────────────────────────────────────────

export default PipeSizing;
