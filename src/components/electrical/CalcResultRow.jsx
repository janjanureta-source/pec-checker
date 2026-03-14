import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { Card, Label } from "../../theme.jsx";

function CalcResultRow({ item, T, CALC_LABELS }) {
  const [whyOpen, setWhyOpen] = React.useState(false);
  const isNoInput = item.status === "NO INPUT";
  const col = item.status==="PASS"||item.status==="COMPUTED" ? "#22c55e"
             : item.status==="FAIL"    ? "#ef4444"
             : "#f59e0b";
  const showWhy = item.status !== "PASS" && item.status !== "COMPUTED";

  // For NO INPUT: always expanded, full-width action box spanning all columns
  if (isNoInput) {
    return (
      <>
        <tr style={{borderBottom:"none"}}>
          <td style={{padding:"10px 14px 4px",fontWeight:600,color:T.text}}>{CALC_LABELS[item.tool]||item.tool}</td>
          <td style={{padding:"10px 14px 4px",fontFamily:"monospace",fontWeight:800,color:col,fontSize:14}}>{item.value||"—"}</td>
          <td colSpan={2} style={{padding:"10px 14px 4px"}}>
            <span style={{fontSize:10,fontWeight:800,padding:"2px 9px",borderRadius:6,
              background:`${col}15`,color:col,border:`1px solid ${col}30`}}>
              NEEDS INPUT
            </span>
          </td>
        </tr>
        <tr style={{borderBottom:`1px solid ${T.border}`}}>
          <td colSpan={4} style={{padding:"0 14px 12px"}}>
            <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.3)",
              borderRadius:8,padding:"10px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:16,flexShrink:0}}>👉</span>
              <div style={{fontSize:12,color:"#f59e0b",lineHeight:1.7}}>
                <strong style={{display:"block",marginBottom:3,fontSize:13}}>What to do:</strong>
                {item.detail}
              </div>
            </div>
          </td>
        </tr>
      </>
    );
  }

  return (
    <tr style={{borderBottom:`1px solid ${T.border}`}}>
      <td style={{padding:"10px 14px",fontWeight:600,color:T.text}}>{CALC_LABELS[item.tool]||item.tool}</td>
      <td style={{padding:"10px 14px",fontFamily:"monospace",fontWeight:800,color:col,fontSize:14}}>{item.value||"—"}</td>
      <td style={{padding:"10px 14px",color:T.muted,fontSize:11}}>{item.detail}</td>
      <td style={{padding:"10px 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
          <span style={{fontSize:10,fontWeight:800,padding:"2px 9px",borderRadius:6,
            background:`${col}15`,color:col,border:`1px solid ${col}30`}}>
            {item.status}
          </span>
          {showWhy&&(
            <button onClick={()=>setWhyOpen(p=>!p)}
              style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:5,
                border:`1px solid ${col}40`,background:`${col}10`,color:col,
                cursor:"pointer",flexShrink:0}}>
              {whyOpen?"▲":"ⓘ Why?"}
            </button>
          )}
        </div>
        {whyOpen&&(
          <div style={{marginTop:6,fontSize:11,color:T.muted,lineHeight:1.6,
            background:`${col}08`,border:`1px solid ${col}25`,borderRadius:7,
            padding:"8px 10px",maxWidth:260}}>
            {item.status==="FAIL"
              ? "This check ran and the result does not meet the PEC requirement. Review the calculator inputs and correct the design."
              : "Result is within acceptable limits but warrants review."}
          </div>
        )}
      </td>
    </tr>
  );
}

export default CalcResultRow;
