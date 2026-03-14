import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { WIRE_DATA, AWG_SIZES } from "./constants.jsx";
import { Card, Label } from "../../theme.jsx";
import VerifyHintBanner from "./VerifyHintBanner.jsx";

function MultiCircuitVDTable({ electricalData, calcState, onStateChange, verifyHint }) {
  const ed = electricalData?.panel || {};
  const sysV = +(calcState?.voltage||ed.voltage||electricalData?.system?.voltage||230);
  const FL={1:15,2:25,3:35,4:45,5:55,6:65};
  const gLen=d=>{const m=String(d||"").match(/[Ff](\d)/);return m?FL[+m[1]]||30:30;};
  const initRows=()=>{
    if(calcState?.rows?.length)return calcState.rows;
    if(ed.circuits?.length)return ed.circuits.filter(c=>+(c.va||0)>0).map((c,i)=>({
      id:i+1,desc:c.desc||`Ckt ${i+1}`,va:+(c.va||0),breaker:+(c.breaker||20),
      wire:c.wire||AWG_SIZES.find(s=>(WIRE_DATA[s]?.ampacity||0)>=+(c.breaker||20))||12,
      length:gLen(c.desc),
    }));
    return[];
  };
  const [rows,setRows]=React.useState(initRows);
  const [voltage]=React.useState(sysV);

  const vpf=0.9,sinP=Math.sin(Math.acos(vpf));
  const calcVD=(row)=>{
    const R=WIRE_DATA[row.wire]?.resistance||WIRE_DATA[12].resistance;
    const loadA=row.va/voltage,vd=2*loadA*row.length*(R*vpf+0.0492*sinP)/1000;
    const pct=voltage>0?vd/voltage*100:0;
    const minWire=AWG_SIZES.find(s=>{const Rr=WIRE_DATA[s]?.resistance||0;return Rr>0&&2*loadA*row.length*(Rr*vpf+0.0492*sinP)/1000/voltage*100<=3;})||"500+";
    return{vd,pct,minWire,pass:pct<=3};
  };

  const setField=(id,field,val)=>setRows(p=>p.map(r=>r.id===id?{...r,[field]:field==="va"||field==="length"?+val:val}:r));

  React.useEffect(()=>{if(onStateChange)onStateChange({rows,voltage});},[rows]);

  return(
    <div>
      <VerifyHintBanner hint={verifyHint}/>
      <p style={{color:T.muted,fontSize:13,margin:"0 0 16px"}}>
        <strong style={{color:T.text}}>PEC 2017 Art. 2.30</strong> — max 3% branch, 5% total. Run lengths estimated from floor tag (F1=15m, F2=25m…) — edit inline.
      </p>
      {rows.length===0&&<div style={{padding:"32px",textAlign:"center",color:T.muted,fontSize:13,background:T.dim,borderRadius:12}}>Upload plans with a panel schedule to populate all circuits.</div>}
      {rows.length>0&&(
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:T.dim}}>
                {["Circuit","VA","Wire","Run (m)","VD (V)","VD%","Min Wire","Status"].map(h=>(
                  <th key={h} style={{padding:"9px 12px",color:T.muted,fontWeight:700,fontSize:11,textAlign:"left",borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row=>{
                const {vd,pct,minWire,pass}=calcVD(row);
                const barCol=pct>5?"#ef4444":pct>3?"#f59e0b":"#22c55e";
                return(
                  <tr key={row.id} style={{borderBottom:`1px solid ${T.border}`,background:pass?"transparent":"rgba(239,68,68,0.04)"}}>
                    <td style={{padding:"6px 12px",fontWeight:600,color:T.text,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.desc}</td>
                    <td style={{padding:"4px 8px"}}>
                      <input type="number" value={row.va} onChange={e=>setField(row.id,"va",e.target.value)}
                        style={{width:70,background:T.dim,border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 8px",color:T.text,fontSize:12,fontFamily:"monospace"}}/>
                    </td>
                    <td style={{padding:"4px 8px"}}>
                      <select value={row.wire} onChange={e=>setField(row.id,"wire",e.target.value)}
                        style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 6px",color:T.text,fontSize:12}}>
                        {AWG_SIZES.map(s=><option key={s} value={s}>#{s}</option>)}
                      </select>
                    </td>
                    <td style={{padding:"4px 8px"}}>
                      <input type="number" value={row.length} onChange={e=>setField(row.id,"length",e.target.value)}
                        style={{width:60,background:T.dim,border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 8px",color:T.text,fontSize:12,fontFamily:"monospace"}}/>
                    </td>
                    <td style={{padding:"6px 12px",color:T.text,fontFamily:"monospace"}}>{vd.toFixed(3)}</td>
                    <td style={{padding:"6px 12px",minWidth:90}}>
                      <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:3,overflow:"hidden",marginBottom:3}}>
                        <div style={{height:"100%",width:`${Math.min(pct/5*100,100)}%`,background:barCol,borderRadius:3}}/>
                      </div>
                      <span style={{fontSize:11,color:barCol,fontWeight:700}}>{pct.toFixed(2)}%</span>
                    </td>
                    <td style={{padding:"6px 12px",color:T.muted,fontFamily:"monospace",fontSize:11}}>{pass?"—":`#${minWire}`}</td>
                    <td style={{padding:"6px 12px"}}>
                      {pass
                        ? <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:5,background:"rgba(34,197,94,0.12)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.25)"}}>✓ OK</span>
                        : <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:5,background:"rgba(239,68,68,0.12)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.25)"}}>✗ FAIL</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {rows.length>0&&(()=>{
        const fails=rows.filter(r=>!calcVD(r).pass).length;
        return(
          <div style={{marginTop:16,padding:"12px 16px",borderRadius:10,background:fails===0?"rgba(34,197,94,0.06)":"rgba(239,68,68,0.06)",border:`1px solid ${fails===0?"rgba(34,197,94,0.25)":"rgba(239,68,68,0.25)"}`}}>
            <span style={{fontWeight:700,fontSize:13,color:fails===0?"#22c55e":"#ef4444"}}>{fails===0?`✓ All ${rows.length} circuits within 3% VD limit`:`✗ ${fails} circuit${fails>1?"s":""} exceed 3% — upgrade wire or shorten run`}</span>
          </div>
        );
      })()}
    </div>
  );
}

// ─── GEC CALCULATOR ───────────────────────────────────────────────────────────

export default MultiCircuitVDTable;
