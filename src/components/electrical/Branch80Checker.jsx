import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { Card, Label } from "../../theme.jsx";
import VerifyHintBanner from "./VerifyHintBanner.jsx";

function Branch80Checker({ electricalData, calcState, onStateChange, verifyHint }) {
  const ed = electricalData?.panel || {};
  const initCircuits = () => {
    if(calcState?.circuits?.length) return calcState.circuits;
    if(ed.circuits?.length) return ed.circuits.map((c,i)=>({...c,id:i+1,continuous:false}));
    return [];
  };
  const [circuits, setCircuits] = React.useState(initCircuits);
  const [voltage,  setVoltage]  = React.useState(+(calcState?.voltage||ed.voltage||230));
  React.useEffect(()=>{ if(onStateChange)onStateChange({circuits,voltage}); },[circuits,voltage]);

  const toggle = (id,field,val) => setCircuits(p=>p.map(c=>c.id===id?{...c,[field]:val}:c));

  return(
    <div>
      <VerifyHintBanner hint={verifyHint}/>
      <p style={{color:T.muted,fontSize:13,margin:"0 0 16px"}}>
        Per <strong style={{color:T.text}}>PEC 2017 Art. 2.20.3.2</strong>, continuous loads must not exceed 80% of breaker rating.
        Toggle "Continuous" for loads energised ≥3 hours.
      </p>
      {circuits.length===0&&(
        <div style={{padding:"32px",textAlign:"center",color:T.muted,fontSize:13,background:T.dim,borderRadius:12}}>
          Upload plans and run AI extraction to populate circuits, or add from Panel Schedule.
        </div>
      )}
      {circuits.length>0&&(
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:T.dim}}>
                {["Circuit","VA","Breaker (A)","Load A","80% Limit","Utilisation","Continuous","Status"].map(h=>(
                  <th key={h} style={{padding:"9px 12px",color:T.muted,fontWeight:700,fontSize:11,textAlign:"left",borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {circuits.map(circ=>{
                const va=+(circ.va||0),bkr=+(circ.breaker||20),loadA=va/voltage;
                const limit=circ.continuous?bkr*0.8:bkr,pct=bkr>0?loadA/bkr*100:0;
                const pass=loadA<=limit;
                const barCol=pct>100?"#ef4444":pct>80?"#f59e0b":"#22c55e";
                return(
                  <tr key={circ.id} style={{borderBottom:`1px solid ${T.border}`,background:pass?"transparent":"rgba(239,68,68,0.04)"}}>
                    <td style={{padding:"8px 12px",fontWeight:600,color:T.text}}>{circ.desc||`Circuit ${circ.id}`}</td>
                    <td style={{padding:"8px 12px",color:T.muted,fontFamily:"monospace"}}>{va.toLocaleString()}</td>
                    <td style={{padding:"8px 12px",color:T.muted,fontFamily:"monospace"}}>{bkr}</td>
                    <td style={{padding:"8px 12px",color:T.text,fontFamily:"monospace",fontWeight:600}}>{loadA.toFixed(1)}</td>
                    <td style={{padding:"8px 12px",color:T.muted,fontFamily:"monospace"}}>{limit.toFixed(1)}</td>
                    <td style={{padding:"8px 12px",minWidth:100}}>
                      <div style={{height:6,background:"rgba(255,255,255,0.08)",borderRadius:3,overflow:"hidden",marginBottom:3}}>
                        <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:barCol,borderRadius:3,transition:"width 0.3s"}}/>
                      </div>
                      <span style={{fontSize:10,color:barCol,fontWeight:700}}>{pct.toFixed(1)}%</span>
                    </td>
                    <td style={{padding:"8px 12px",textAlign:"center"}}>
                      <input type="checkbox" checked={!!circ.continuous} onChange={e=>toggle(circ.id,"continuous",e.target.checked)}
                        style={{accentColor:T.accent,width:15,height:15,cursor:"pointer"}}/>
                    </td>
                    <td style={{padding:"8px 12px"}}>
                      {pass
                        ? <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:5,background:"rgba(34,197,94,0.12)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.25)"}}>✓ PASS</span>
                        : <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:5,background:"rgba(239,68,68,0.12)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.25)"}} title={`Upgrade to ${Math.ceil(loadA/0.8/5)*5}A breaker`}>✗ FAIL — need {Math.ceil(loadA/0.8/5)*5}A</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {circuits.length>0&&(()=>{
        const fails=circuits.filter(c=>{const la=+(c.va||0)/voltage,lim=c.continuous?+(c.breaker||20)*0.8:+(c.breaker||20);return la>lim;}).length;
        return(
          <div style={{marginTop:16,padding:"12px 16px",borderRadius:10,background:fails===0?"rgba(34,197,94,0.06)":"rgba(239,68,68,0.06)",border:`1px solid ${fails===0?"rgba(34,197,94,0.25)":"rgba(239,68,68,0.25)"}`}}>
            <span style={{fontWeight:700,fontSize:13,color:fails===0?"#22c55e":"#ef4444"}}>{fails===0?`✓ All ${circuits.length} circuits pass 80% rule`:`✗ ${fails} circuit${fails>1?"s":""} exceed 80% — upgrade breakers or reduce load`}</span>
          </div>
        );
      })()}
    </div>
  );
}

// ─── MULTI-CIRCUIT VOLTAGE DROP TABLE ────────────────────────────────────────

export default Branch80Checker;
