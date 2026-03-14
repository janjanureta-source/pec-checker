import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";

function VerifyHintBanner({ hint }) {
  const [gone,setGone] = React.useState(false);
  if(!hint||gone) return null;
  const SC={CRITICAL:"#ef4444",WARNING:"#f59e0b",INFO:"#0696d7"};
  const col=SC[hint.severity]||"#0696d7";
  return(
    <div style={{background:`${col}0f`,border:`1.5px solid ${col}30`,borderRadius:12,padding:"12px 16px",marginBottom:18,position:"relative"}}>
      <button onClick={()=>setGone(true)} style={{position:"absolute",top:8,right:10,background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14}}>✕</button>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={{fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:4,background:col,color:"#fff"}}>{hint.severity}</span>
        <span style={{fontSize:12,fontWeight:700,color:T.text}}>Verifying Finding #{hint.findingId}: {hint.title}</span>
      </div>
      <div style={{fontSize:12,color:T.muted,lineHeight:1.6,marginBottom:hint.recommendation?4:0}}>{hint.description}</div>
      {hint.recommendation&&<div style={{fontSize:12,color:"#22c55e",lineHeight:1.6}}>✓ {hint.recommendation}</div>}
      <div style={{fontSize:10,color:`${col}80`,marginTop:4,fontWeight:600}}>{hint.pecRef} · Values pre-filled where extracted from finding</div>
    </div>
  );
}

export default VerifyHintBanner;
