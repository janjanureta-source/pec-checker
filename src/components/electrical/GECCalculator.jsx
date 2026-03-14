import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { WIRE_DATA, AWG_SIZES } from "./constants.jsx";
import { Card, Label } from "../../theme.jsx";

function GECCalculator({ electricalData, calcState, onStateChange }) {
  const ed = electricalData?.panel || {};
  const GEC_TBL={14:14,12:12,10:10,8:10,6:10,4:8,3:8,2:8,1:6,"1/0":6,"2/0":4,"3/0":4,"4/0":2,250:2,300:2,350:2,400:2,500:1};
  const EGC_TBL={15:14,20:12,30:10,40:10,60:10,100:8,200:6,300:4,400:3,500:2,600:1,800:"1/0",1000:"2/0",1200:"3/0"};
  const AWG_LIST=[14,12,10,8,6,4,3,2,1,"1/0","2/0","3/0","4/0",250,300,350,400,500];
  const [mainBkr,setMainBkr]=React.useState(+(calcState?.mainBkr||ed.mainBreaker||100));
  const [svcWire,setSvcWire]=React.useState(calcState?.svcWire||AWG_LIST.find(s=>(WIRE_DATA[s]?.ampacity||0)>=+(ed.mainBreaker||100))||"1/0");
  React.useEffect(()=>{if(onStateChange)onStateChange({mainBkr,svcWire});},[mainBkr,svcWire]);

  const gec=GEC_TBL[svcWire];
  const egcAt=Object.keys(EGC_TBL).map(Number).find(k=>k>=mainBkr)||1200;
  const egc=EGC_TBL[egcAt];
  const neutral=gec; // simplified: neutral ≥ GEC size

  return(
    <div>
      <p style={{color:T.muted,fontSize:13,margin:"0 0 20px"}}><strong style={{color:T.text}}>PEC 2017 Table 2.50.12</strong> — Grounding electrode conductor (GEC) sizing based on service conductor.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14,marginBottom:24}}>
        <div><Label>Main Breaker (AT)</Label>
          <input type="number" value={mainBkr} onChange={e=>setMainBkr(+e.target.value)}
            style={{width:"100%",background:T.dim,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",color:T.text,fontSize:14,fontFamily:"monospace"}}/>
        </div>
        <div><Label>Service Conductor Size</Label>
          <select value={svcWire} onChange={e=>setSvcWire(e.target.value)}
            style={{width:"100%",background:T.dim,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",color:T.text,fontSize:14}}>
            {AWG_LIST.map(s=><option key={s} value={s}>#{s} AWG ({WIRE_DATA[s]?.ampacity||"?"}A)</option>)}
          </select>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
        {[
          {label:"GEC (Grounding Electrode Conductor)",val:gec?`#${gec} AWG Cu`:"See table",ref:"PEC Table 2.50.12",col:"#22c55e"},
          {label:"EGC (Equipment Grounding Conductor)", val:egc?`#${egc} AWG Cu`:"See table",ref:`Based on ${egcAt}A OCPD`,col:"#0696d7"},
          {label:"Neutral / Grounded Conductor",        val:neutral?`#${neutral} AWG Cu`:"See table",ref:"Min = GEC size",col:"#8b5cf6"},
        ].map(r=>(
          <div key={r.label} style={{background:T.dim,border:`1px solid ${r.col}30`,borderRadius:12,padding:"16px 18px"}}>
            <div style={{fontSize:11,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>{r.label}</div>
            <div style={{fontSize:28,fontWeight:900,color:r.col,fontFamily:"monospace",marginBottom:4}}>{r.val}</div>
            <div style={{fontSize:11,color:T.muted}}>{r.ref}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:20,padding:"14px 18px",background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:12,fontSize:12,color:T.muted,lineHeight:1.7}}>
        <strong style={{color:"#f59e0b"}}>⚠ Ground Rod Requirements (PEC Art. 2.50):</strong> Minimum 2 ground rods, 2.4m long, spaced ≥1.8m apart. Resistance to earth ≤25Ω each. Use copper-clad steel rods (≥16mm dia).
      </div>
    </div>
  );
}


// ─── REVIEW SUMMARY SHEET ─────────────────────────────────────────────────────
// Phase 6: One-page exportable review for MERALCO/LGU/PEE submission

// ── CalcResultRow — extracted so useState is a valid top-level hook ──────────

export default GECCalculator;
