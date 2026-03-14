import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { FIXTURES, DFU_TO_PIPE, WSFU_TO_GPM, SC} from "./constants.jsx";
import { Card, Label } from "../../theme.jsx";
import { Select } from "../../theme.jsx";

function FixtureUnitCalc() {
  const [rows,setRows]=useState([{id:1,fixture:FIXTURES[0].name,qty:1}]);
  const [bldgType,setBldgType]=useState("private");
  const [result,setResult]=useState(null);
  const addRow=()=>setRows(p=>[...p,{id:Date.now(),fixture:FIXTURES[0].name,qty:1}]);
  const removeRow=id=>setRows(p=>p.filter(r=>r.id!==id));
  const updateRow=(id,k,v)=>setRows(p=>p.map(r=>r.id===id?{...r,[k]:v}:r));
  const calc=()=>{
    let totalDFU=0,totalWSFU=0;
    const detail=rows.map(r=>{const fx=FIXTURES.find(f=>f.name===r.fixture)||FIXTURES[0];const dfu=fx.dfu*r.qty;const wsfu=(bldgType==="private"?fx.wsfu_priv:fx.wsfu_pub)*r.qty;totalDFU+=dfu;totalWSFU+=wsfu;return {...r,dfu,wsfu,fx};});
    const drainPipe=DFU_TO_PIPE.find(p=>totalDFU<=p.maxDfu)||DFU_TO_PIPE[DFU_TO_PIPE.length-1];
    const gpm=WSFU_TO_GPM(totalWSFU);
    const supplyDia=gpm<=4?19:gpm<=8?25:gpm<=15?32:gpm<=30?38:gpm<=50?50:75;
    setResult({detail,totalDFU,totalWSFU,drainPipe,gpm,supplyDia});
  };
  return (
    <div>
      <Card style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
          <Label>Building Type</Label>
          <div style={{display:"flex",gap:8}}>
            {["private","public"].map(t=><button key={t} onClick={()=>setBldgType(t)} style={{padding:"6px 14px",borderRadius:8,border:`1.5px solid ${bldgType===t?SC:T.border}`,background:bldgType===t?`rgba(16,185,129,0.12)`:"transparent",color:bldgType===t?SC:T.muted,cursor:"pointer",fontSize:12,fontWeight:700}}>{t==="private"?"🏠 Private":"🏢 Public"}</button>)}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8}}><div style={{fontSize:11,fontWeight:700,color:T.muted}}>FIXTURE</div><div style={{fontSize:11,fontWeight:700,color:T.muted,textAlign:"center",width:70}}>QTY</div><div style={{width:36}}/></div>
          {rows.map(r=>(
            <div key={r.id} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8,alignItems:"center"}}>
              <Select value={r.fixture} onChange={e=>updateRow(r.id,"fixture",e.target.value)}>{FIXTURES.map(f=><option key={f.name} value={f.name}>{f.name}</option>)}</Select>
              <input type="number" value={r.qty} min={1} onChange={e=>updateRow(r.id,"qty",+e.target.value)} style={{width:70,background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:10,padding:"10px 8px",color:T.text,fontSize:14,outline:"none",textAlign:"center"}}/>
              <button onClick={()=>removeRow(r.id)} style={{width:36,height:36,borderRadius:8,background:"rgba(239,68,68,0.12)",border:"none",color:T.danger,cursor:"pointer",fontSize:14}}>✕</button>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={addRow} style={{flex:1,background:T.dim,border:`1.5px dashed ${T.border}`,color:T.muted,fontWeight:700,padding:"10px",borderRadius:10,cursor:"pointer",fontSize:13}}>+ Add Fixture</button>
          <button onClick={calc} style={{flex:2,background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,padding:"10px 20px",borderRadius:10,cursor:"pointer",fontSize:13}}>🚰 Calculate Fixture Units</button>
        </div>
      </Card>
      {result&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Card style={{background:"rgba(16,185,129,0.06)",border:`1.5px solid rgba(16,185,129,0.3)`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>TOTAL DRAINAGE FIXTURE UNITS</div>
            <div style={{fontSize:40,fontWeight:900,color:SC}}>{result.totalDFU} <span style={{fontSize:16,fontWeight:400}}>DFU</span></div>
            <div style={{marginTop:8,fontSize:13,color:T.muted}}>Min drain pipe: <strong style={{color:T.text}}>{result.drainPipe.dia}mm</strong></div>
          </Card>
          <Card style={{background:"rgba(16,185,129,0.06)",border:`1.5px solid rgba(16,185,129,0.3)`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>WATER SUPPLY FIXTURE UNITS</div>
            <div style={{fontSize:40,fontWeight:900,color:SC}}>{result.totalWSFU.toFixed(1)} <span style={{fontSize:16,fontWeight:400}}>WSFU</span></div>
            <div style={{marginTop:8,fontSize:13,color:T.muted}}>{result.gpm.toFixed(1)} GPM → <strong style={{color:T.text}}>{result.supplyDia}mm supply</strong></div>
          </Card>
          <Card style={{gridColumn:"1/-1"}}>
            <Label>Fixture Breakdown (NPC 2000 Table 4-1)</Label>
            <table style={{width:"100%",borderCollapse:"collapse",marginTop:8}}>
              <thead><tr style={{background:T.dim}}>{["Fixture","Qty","DFU ea","Total DFU","WSFU ea","Total WSFU"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:11,color:T.muted,fontWeight:700}}>{h}</th>)}</tr></thead>
              <tbody>{result.detail.map((r,i)=><tr key={r.id} style={{borderTop:`1px solid ${T.border}`,background:i%2===0?"transparent":T.dim}}><td style={{padding:"8px 10px",fontSize:13,color:T.text}}>{r.fixture}</td><td style={{padding:"8px 10px",fontSize:13,color:T.text,textAlign:"center"}}>{r.qty}</td><td style={{padding:"8px 10px",fontSize:13,color:T.muted,textAlign:"center"}}>{r.fx.dfu}</td><td style={{padding:"8px 10px",fontSize:13,fontWeight:700,color:SC,textAlign:"center"}}>{r.dfu}</td><td style={{padding:"8px 10px",fontSize:13,color:T.muted,textAlign:"center"}}>{bldgType==="private"?r.fx.wsfu_priv:r.fx.wsfu_pub}</td><td style={{padding:"8px 10px",fontSize:13,fontWeight:700,color:SC,textAlign:"center"}}>{r.wsfu.toFixed(1)}</td></tr>)}</tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── SANICODE: PIPE SIZING ────────────────────────────────────────────────────

export default FixtureUnitCalc;
