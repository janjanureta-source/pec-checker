import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { Card, Label } from "../../theme.jsx";
import { Input } from "../../theme.jsx";
import { FromPlansBadge } from "./constants.jsx";

function LoadCombinations({ structuralData, structuralResults }) {
  const sd = structuralData;
  const [D, setD] = useState(sd?.loads?.floorDL ? sd.loads.floorDL*50 : "");
  const [L, setL] = useState(sd?.loads?.floorLL ? sd.loads.floorLL*50 : "");
  const [W, setW] = useState("");
  const [E, setE] = useState("");
  const [S, setS] = useState("");
  const [result, setResult] = useState(null);
  const [fp, setFp] = useState({D:!!sd?.loads?.floorDL, L:!!sd?.loads?.floorLL});

  useEffect(()=>{
    if (!sd?.loads) return;
    if (sd.loads.floorDL) { setD(sd.loads.floorDL*50); setFp(p=>({...p,D:true})); }
    if (sd.loads.floorLL) { setL(sd.loads.floorLL*50); setFp(p=>({...p,L:true})); }
  },[sd]);

  const calc = () => {
    if (D===""||L==="") return;
    const d=+D,l=+L,w=W?+W:0,e=E?+E:0,s=S?+S:0;
    const combos = [
      {name:"1.4D",              val:1.4*d,             formula:"1.4D"},
      {name:"1.2D + 1.6L",      val:1.2*d+1.6*l,       formula:"1.2D + 1.6L + 0.5Lr"},
      {name:"1.2D + 1.0W + L",  val:1.2*d+1.0*w+l,    formula:"1.2D + 1.0W + L"},
      {name:"0.9D + 1.0W",      val:0.9*d+1.0*w,       formula:"0.9D + 1.0W"},
      {name:"1.2D + 1.0E + L",  val:1.2*d+1.0*e+l,    formula:"1.2D + 1.0E + L"},
      {name:"0.9D + 1.0E",      val:0.9*d+1.0*e,       formula:"0.9D + 1.0E"},
    ];
    const maxVal = Math.max(...combos.map(c=>c.val));
    setResult(combos.map(c=>({...c,isMax:Math.abs(c.val-maxVal)<0.01})));
  };

  const Hint = ({c}) => <div style={{fontSize:11,color:T.muted,marginBottom:12,fontStyle:"italic"}}>{c}</div>;
  const canCalc = D!==""&&L!=="";

  const fields = [
    {l:"Dead Load D (kN)",     v:D,s:setD, fp:fp.D, ph:"e.g. 150 — total gravity dead load"},
    {l:"Live Load L (kN)",     v:L,s:setL, fp:fp.L, ph:"e.g. 120 — total floor live load"},
    {l:"Wind Load W (kN)",     v:W,s:setW, fp:false, ph:"e.g. 40 — from wind analysis (optional)"},
    {l:"Seismic Load E (kN)", v:E,s:setE, fp:false, ph:"From seismic base shear V (optional)"},
    {l:"Snow Load S (kN)",     v:S,s:setS, fp:false, ph:"0 for most PH locations (optional)"},
  ];

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        {!sd && (
          <div style={{padding:"10px 14px",background:"rgba(6,150,215,0.06)",border:"1px solid rgba(6,150,215,0.15)",borderRadius:8,marginBottom:16,fontSize:12,color:"#0696d7",lineHeight:1.6}}>
            💡 Upload plans in <strong>AI Plan Checker</strong> to auto-fill D and L, or run <strong>Seismic Load</strong> first to get E.
          </div>
        )}
        {sd && !sd.loads?.floorDL && !sd.loads?.floorLL && (
          <div style={{padding:"12px 14px",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8,marginBottom:16,fontSize:12,color:"#f59e0b",lineHeight:1.7}}>
            <strong style={{fontSize:13}}>⚠ Unverifiable — No load data found in plans</strong><br/>
            <span style={{color:T.muted}}>The AI could not extract dead load (DL) or live load (LL) values from the uploaded plans. Enter load values manually below to compute NSCP load combinations.</span>
          </div>
        )}
        <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.5px"}}>NSCP 2015 Sec. 203 — Factored Load Combinations (LRFD)</div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
          {fields.map(f=>(
            <div key={f.l}>
              <Label>{f.l} {f.fp && <FromPlansBadge/>}</Label>
              <Input type="number" value={f.v} onChange={e=>f.s(e.target.value)} placeholder={f.ph}/>
            </div>
          ))}
        </div>
        <Hint c="D and L are required. W and E are optional — combos using zero values will show 0 contribution."/>
        <button onClick={calc} disabled={!canCalc} style={{width:"100%",background:canCalc?"linear-gradient(135deg,#0696d7,#0569a8)":"rgba(255,255,255,0.05)",border:"none",color:canCalc?"#fff":T.muted,fontWeight:700,fontSize:14,padding:"13px",borderRadius:12,cursor:canCalc?"pointer":"not-allowed",transition:"all 0.2s"}}>
          {canCalc ? "📊 Calculate Load Combinations" : "Enter D and L to calculate"}
        </button>
      </Card>

      {result ? (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{fontSize:12,color:T.muted,marginBottom:4}}>Factored load combinations — NSCP 2015 Sec. 203.3</div>
          {result.map(r=>(
            <div key={r.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:r.isMax?"rgba(239,68,68,0.08)":T.dim,borderRadius:10,border:r.isMax?"1.5px solid rgba(239,68,68,0.3)":"1px solid transparent",transition:"all 0.15s"}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:r.isMax?"#ef4444":T.text}}>{r.name}</div>
                <div style={{fontSize:10,color:T.muted,marginTop:2,fontFamily:"monospace"}}>{r.formula}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:18,fontWeight:900,color:r.isMax?"#ef4444":T.text,fontFamily:"monospace"}}>{r.val.toFixed(1)}</div>
                <div style={{fontSize:10,color:T.muted}}>kN</div>
              </div>
            </div>
          ))}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6,marginTop:4}}>
            Highlighted combination governs design. Use for member sizing and connection design.
          </div>
        </div>
      ) : (
        (() => {
          const priorItems = structuralResults?.items?.filter(i=>i.tool==="loads") || [];
          const combos = structuralResults?.loadCombos;
          if (priorItems.length > 0) {
            return (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <Card style={{background:priorItems[0].status==="CANNOT VERIFY"?"rgba(245,158,11,0.06)":"rgba(6,150,215,0.06)",border:`1.5px solid ${priorItems[0].status==="CANNOT VERIFY"?"rgba(245,158,11,0.3)":"rgba(6,150,215,0.3)"}`}}>
                  <div style={{fontSize:11,color:T.muted,marginBottom:4}}>RUN ALL — LOAD COMBINATIONS</div>
                  <div style={{fontSize:16,fontWeight:900,color:priorItems[0].status==="CANNOT VERIFY"?"#f59e0b":"#0696d7",marginBottom:4}}>
                    {priorItems[0].status==="CANNOT VERIFY"?"⚠ CANNOT VERIFY — No load data in plans":"✓ COMPUTED"}
                  </div>
                  {priorItems[0].value && <div style={{fontSize:14,fontWeight:700,color:"#0696d7",fontFamily:"monospace"}}>{priorItems[0].value} = {priorItems[0].detail}</div>}
                  {priorItems[0].error && <div style={{fontSize:12,color:"#f59e0b",marginTop:6,padding:"8px 12px",background:"rgba(245,158,11,0.06)",borderRadius:8,borderLeft:"2px solid #f59e0b",lineHeight:1.6}}>{priorItems[0].error}</div>}
                </Card>
                {combos && combos.length > 0 && (
                  <div style={{padding:"14px 16px",background:"rgba(6,150,215,0.04)",border:"1px solid rgba(6,150,215,0.15)",borderRadius:10}}>
                    <div style={{fontSize:11,fontWeight:800,color:"#0696d7",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>NSCP Load Combinations (Sec. 203)</div>
                    <div style={{fontSize:12,color:T.text,lineHeight:1.8}}>
                      {combos.map((c,i)=>{
                        const isMax = c.val === Math.max(...combos.map(x=>x.val));
                        return (
                          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",marginBottom:3,borderRadius:6,background:isMax?"rgba(6,150,215,0.08)":"transparent",border:isMax?"1px solid rgba(6,150,215,0.2)":"none"}}>
                            <span style={{fontFamily:"monospace",fontSize:12,color:isMax?"#0696d7":T.muted}}>{c.name}</span>
                            <span style={{fontFamily:"monospace",fontSize:12,fontWeight:isMax?800:400,color:isMax?"#0696d7":T.text}}>{c.val} kN/m²{isMax?" ← GOVERNS":""}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <Card style={{background:"rgba(6,150,215,0.04)",border:"1px solid rgba(6,150,215,0.15)"}}>
                  <div style={{fontSize:11,color:"#0696d7",fontWeight:700,marginBottom:4}}>MANUAL CHECK</div>
                  <div style={{fontSize:11,color:T.muted,lineHeight:1.6}}>Enter D, L, and E values on the left then click Calculate for interactive results with custom loads.</div>
                </Card>
              </div>
            );
          }
          return (
            <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}>
              <Icon name="loads" size={40} color={T.muted}/>
              <div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter loads and click<br/>Calculate to see combinations</div>
            </Card>
          );
        })()
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOM REVIEW MODULE
// Components: BOMReview
// Prompts:    BOM_GENERATE_PROMPT, BOM_SYSTEM_PROMPT
// Session:    buildify_session_structural (to be migrated to engtools in Phase D)
// ═══════════════════════════════════════════════════════════════════════════════

export default LoadCombinations;
