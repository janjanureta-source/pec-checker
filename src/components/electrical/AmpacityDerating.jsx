import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { WIRE_DATA, AWG_SIZES } from "./constants.jsx";
import { Card, Label, Input, Select, Stat } from "../../theme.jsx";

function AmpacityDerating({ electricalData, calcState, onStateChange }) {
  const ACCENT = "#ff6b2b";
  const ed   = electricalData?.ampacity || {};
  const init = calcState || {};

  // Base ampacity tables per PEC 2017 Table 3.10 (THWN 75°C Cu in conduit)
  // Already in WIRE_DATA but we need separate insulation tables
  const BASE_AMPACITY = {
    // size: { TW_60: A, THWN_75: A, XHHW_90: A }
    14:    { TW_60:15,  THWN_75:20,  XHHW_90:25  },
    12:    { TW_60:20,  THWN_75:25,  XHHW_90:30  },
    10:    { TW_60:30,  THWN_75:35,  XHHW_90:40  },
    8:     { TW_60:40,  THWN_75:50,  XHHW_90:55  },
    6:     { TW_60:55,  THWN_75:65,  XHHW_90:75  },
    4:     { TW_60:70,  THWN_75:85,  XHHW_90:95  },
    3:     { TW_60:85,  THWN_75:100, XHHW_90:110 },
    2:     { TW_60:95,  THWN_75:115, XHHW_90:130 },
    1:     { TW_60:110, THWN_75:130, XHHW_90:145 },
    "1/0": { TW_60:125, THWN_75:150, XHHW_90:170 },
    "2/0": { TW_60:145, THWN_75:175, XHHW_90:195 },
    "3/0": { TW_60:165, THWN_75:200, XHHW_90:225 },
    "4/0": { TW_60:195, THWN_75:230, XHHW_90:260 },
    250:   { TW_60:215, THWN_75:255, XHHW_90:290 },
    300:   { TW_60:240, THWN_75:285, XHHW_90:320 },
    350:   { TW_60:260, THWN_75:310, XHHW_90:350 },
    400:   { TW_60:280, THWN_75:335, XHHW_90:380 },
    500:   { TW_60:320, THWN_75:380, XHHW_90:430 },
  };

  // Temperature correction factors (PEC Table 3.10 Notes)
  // For ambient temps above 30°C (base)
  const TEMP_FACTORS = {
    TW_60:   { 21:1.08,26:1.00,31:0.91,36:0.82,41:0.71,46:0.58,51:0.41 },
    THWN_75: { 21:1.05,26:1.00,31:0.94,36:0.88,41:0.82,46:0.75,51:0.67,56:0.58,61:0.33 },
    XHHW_90: { 21:1.04,26:1.00,31:0.96,36:0.91,41:0.87,46:0.82,51:0.76,56:0.71,61:0.65,66:0.58,71:0.50 },
  };

  // Conduit fill adjustment factors (PEC Table 3.13)
  const FILL_FACTORS = {
    1:1.00, 2:1.00, 3:1.00, 4:0.80, 5:0.80, 6:0.80,
    7:0.70, 8:0.70, 9:0.70, 10:0.70, 11:0.70, 12:0.70,
    13:0.70, 14:0.70, 15:0.70, 16:0.70, 17:0.70, 18:0.70,
    19:0.70, 20:0.50,
  };
  const getFillFactor = n => n >= 20 ? 0.50 : FILL_FACTORS[n] || 0.70;

  const INS_TYPES = [
    { key:"TW_60",   label:"TW (60°C)",   maxTemp:60  },
    { key:"THWN_75", label:"THWN (75°C)", maxTemp:75  },
    { key:"XHHW_90", label:"XHHW (90°C)", maxTemp:90  },
  ];

  const [wireSize,    setWireSize]    = useState(init.wireSize    ?? ed.wireSize    ?? 12);
  const [insulation,  setInsulation]  = useState(init.insulation  ?? ed.insulation  ?? "THWN_75");
  const [ambient,     setAmbient]     = useState(init.ambient     ?? ed.ambient     ?? 30);
  const [numWires,    setNumWires]    = useState(init.numWires    ?? ed.numWires    ?? 3);
  const [material,    setMaterial]    = useState(init.material    ?? ed.material    ?? "copper");
  const [loadCurrent, setLoadCurrent] = useState(init.loadCurrent ?? ed.loadCurrent ?? 20);
  const [fp, setFp] = useState({
    wireSize: !!ed.wireSize, insulation: !!ed.insulation, ambient: ed.ambient != null,
    numWires: ed.numWires != null, loadCurrent: ed.loadCurrent != null,
  });
  useEffect(() => {
    if (!ed || Object.keys(ed).length === 0) return;
    if (ed.wireSize    != null) { setWireSize(ed.wireSize);          setFp(p=>({...p,wireSize:true})); }
    if (ed.insulation  != null) { setInsulation(ed.insulation);      setFp(p=>({...p,insulation:true})); }
    if (ed.ambient     != null) { setAmbient(+ed.ambient);           setFp(p=>({...p,ambient:true})); }
    if (ed.numWires    != null) { setNumWires(+ed.numWires);         setFp(p=>({...p,numWires:true})); }
    if (ed.material    != null) { setMaterial(ed.material); }
    if (ed.loadCurrent != null) { setLoadCurrent(+ed.loadCurrent);   setFp(p=>({...p,loadCurrent:true})); }
  }, [electricalData]);
  useEffect(() => {
    if (onStateChange) onStateChange({ wireSize, insulation, ambient, numWires, material, loadCurrent });
  }, [wireSize, insulation, ambient, numWires, material, loadCurrent]);

  const insTempKey  = Object.keys(TEMP_FACTORS).find(k=>k===insulation) || "THWN_75";
  const tempFactors = TEMP_FACTORS[insTempKey] || {};

  // Get nearest temp factor key
  const getTF = (amb) => {
    const keys = Object.keys(tempFactors).map(Number).sort((a,b)=>a-b);
    let best = keys[0];
    for (const k of keys) { if (k <= amb) best = k; }
    return tempFactors[best] || 1.0;
  };

  const baseAmp     = (BASE_AMPACITY[wireSize]?.[insulation] || 0) * (material==="aluminum" ? 0.84 : 1);
  const tempFactor  = getTF(ambient);
  const fillFactor  = getFillFactor(numWires);
  const deratedAmp  = baseAmp * tempFactor * fillFactor;
  const ok          = deratedAmp >= loadCurrent;
  const utilPct     = deratedAmp > 0 ? (loadCurrent / deratedAmp * 100) : 0;

  // Recommend minimum wire size
  const recWire = () => {
    for (const size of AWG_SIZES) {
      const base = (BASE_AMPACITY[size]?.[insulation]||0) * (material==="aluminum"?0.84:1);
      const derated = base * tempFactor * fillFactor;
      if (derated >= loadCurrent) return { size, derated };
    }
    return null;
  };
  const rec = recWire();

  // Full table for all wire sizes
  const tableRows = AWG_SIZES.map(sz=>{
    const base    = (BASE_AMPACITY[sz]?.[insulation]||0) * (material==="aluminum"?0.84:1);
    const derated = base * tempFactor * fillFactor;
    const isCurrent = String(sz) === String(wireSize);
    return { sz, base, derated, isCurrent };
  });

  const ambientOptions = [21,26,30,31,36,41,46,51,56,61].filter(t=>{
    const ins = INS_TYPES.find(i=>i.key===insulation);
    return t <= (ins?.maxTemp || 90);
  });

  return (
    <div>
      <p style={{color:T.muted,fontSize:13,margin:"0 0 20px"}}>
        Apply temperature and conduit fill derating to conductor ampacity per <strong style={{color:T.text}}>PEC 2017 Table 3.10 & 3.13</strong>.
      </p>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14,marginBottom:24}}>
        <div><Label>Wire Size (AWG)</Label>
          <Select value={wireSize} onChange={e=>setWireSize(e.target.value)}>
            {AWG_SIZES.map(s=><option key={s} value={s}>{s} AWG</option>)}
          </Select></div>
        <div><Label>Insulation Type</Label>
          <Select value={insulation} onChange={e=>setInsulation(e.target.value)}>
            {INS_TYPES.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}
          </Select></div>
        <div><Label>Material</Label>
          <Select value={material} onChange={e=>setMaterial(e.target.value)}>
            <option value="copper">Copper (Cu)</option>
            <option value="aluminum">Aluminum (Al) −16%</option>
          </Select></div>
        <div><Label>Ambient Temperature (°C)</Label>
          <Select value={ambient} onChange={e=>setAmbient(+e.target.value)}>
            {ambientOptions.map(t=><option key={t} value={t}>{t}°C {t===30?"(Base)":t>35?"(Hot)":""}</option>)}
          </Select></div>
        <div><Label>Conductors in Conduit</Label>
          <Input type="number" value={numWires} min={1} max={30} onChange={e=>setNumWires(Math.min(30,+e.target.value))}/></div>
        <div><Label>Load Current (A)</Label>
          <Input type="number" value={loadCurrent} min={1} onChange={e=>setLoadCurrent(+e.target.value)}/></div>
      </div>

      {/* Main results */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24,alignItems:"start"}}>
        {/* Visual result card */}
        <Card style={{padding:22}}>
          <Label>Derated Ampacity Result</Label>
          <div style={{marginTop:12,display:"flex",alignItems:"flex-end",gap:8}}>
            <div style={{fontSize:48,fontWeight:900,color:ok?T.success:T.danger,lineHeight:1,fontFamily:"monospace"}}>
              {deratedAmp.toFixed(1)}
            </div>
            <div style={{fontSize:18,color:T.muted,paddingBottom:6}}>A</div>
          </div>
          <div style={{marginTop:6,fontSize:12,color:T.muted}}>Derated ampacity for #{wireSize} AWG {material}</div>

          {/* Utilization bar */}
          <div style={{marginTop:16}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.muted,marginBottom:4}}>
              <span>Load Utilization</span>
              <span style={{fontWeight:700,color:ok?T.success:T.danger}}>{utilPct.toFixed(1)}%</span>
            </div>
            <div style={{background:T.border,borderRadius:99,height:10,overflow:"hidden"}}>
              <div style={{width:`${Math.min(utilPct,100)}%`,height:"100%",
                background:`linear-gradient(90deg,${ok?"#22c55e":"#ef4444"},${ok?"#16a34a":"#dc2626"})`,
                borderRadius:99,transition:"width 0.5s ease"}}/>
            </div>
            <div style={{marginTop:8,fontSize:12,fontWeight:700,color:ok?T.success:T.danger,padding:"6px 12px",borderRadius:8,background:ok?"rgba(34,197,94,0.08)":"rgba(239,68,68,0.08)",border:`1px solid ${ok?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.2)"}`}}>
              {ok ? `✓ Wire adequate — ${(deratedAmp-loadCurrent).toFixed(1)}A margin` : `✗ Insufficient — ${(loadCurrent-deratedAmp).toFixed(1)}A short`}
            </div>
          </div>
        </Card>

        {/* Derating breakdown */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Stat label="Base Ampacity"          value={baseAmp.toFixed(1)+" A"}    sub={`${insulation.replace("_"," ")} in conduit`}/>
          <Stat label="Temp. Correction Factor" value={"× "+tempFactor.toFixed(2)} sub={`Ambient ${ambient}°C`} color={tempFactor<1?T.warn:T.success}/>
          <Stat label="Conduit Fill Factor"     value={"× "+fillFactor.toFixed(2)} sub={`${numWires} conductor${numWires!==1?"s":""} in conduit`} color={fillFactor<1?T.warn:T.success}/>
          <div style={{background:T.dim,border:`1.5px solid ${T.border}`,borderRadius:12,padding:"14px 16px"}}>
            <Label>Formula</Label>
            <div style={{fontSize:12,color:T.muted,fontFamily:"monospace",lineHeight:1.8,marginTop:6}}>
              Derated = Base × T.F. × C.F.<br/>
              = {baseAmp.toFixed(1)} × {tempFactor.toFixed(2)} × {fillFactor.toFixed(2)}<br/>
              = <strong style={{color:ok?T.success:T.danger}}>{deratedAmp.toFixed(1)} A</strong>
            </div>
          </div>
          {!ok && rec && (
            <div style={{background:"rgba(245,158,11,0.08)",border:"1.5px solid rgba(245,158,11,0.3)",borderRadius:12,padding:"14px 16px"}}>
              <div style={{fontSize:11,color:T.warn,fontWeight:700,marginBottom:4}}>MINIMUM WIRE SIZE REQUIRED</div>
              <div style={{fontSize:20,fontWeight:800,color:T.warn}}>#{rec.size} AWG</div>
              <div style={{fontSize:11,color:T.muted,marginTop:2}}>Derated ampacity: {rec.derated.toFixed(1)}A</div>
            </div>
          )}
        </div>
      </div>

      {/* Wire size comparison table */}
      <Label>Full Wire Size Derating Table — {insulation.replace("_"," ")}, {ambient}°C ambient, {numWires} wires</Label>
      <div style={{overflowX:"auto",marginTop:10}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{background:T.dim}}>
              {["Wire Size","Base Ampacity","Temp Factor","Fill Factor","Derated Ampacity","Adequate for Load",""].map(h=>(
                <th key={h} style={{padding:"9px 12px",color:T.muted,fontWeight:700,fontSize:11,textTransform:"uppercase",textAlign:"left",borderBottom:`1px solid ${T.border}`}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map(({sz,base,derated,isCurrent})=>{
              const adequate = derated >= loadCurrent;
              return (
                <tr key={sz} style={{background:isCurrent?"rgba(255,107,43,0.06)":"transparent",borderBottom:`1px solid ${T.border}`,cursor:"pointer"}}
                  onClick={()=>setWireSize(sz)}>
                  <td style={{padding:"9px 12px",fontWeight:isCurrent?800:400,color:isCurrent?ACCENT:T.text}}>
                    {isCurrent?"▶ ":""}{sz} AWG{sz>=250?" kcmil":""}
                  </td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",color:T.muted}}>{base.toFixed(1)} A</td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",color:T.muted}}>{tempFactor.toFixed(2)}</td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",color:T.muted}}>{fillFactor.toFixed(2)}</td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",fontWeight:700,color:adequate?T.success:T.danger}}>{derated.toFixed(1)} A</td>
                  <td style={{padding:"9px 12px"}}>
                    <span style={{fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20,
                      background:adequate?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",
                      color:adequate?T.success:T.danger}}>
                      {adequate?"✓ YES":"✗ NO"}
                    </span>
                  </td>
                  <td style={{padding:"9px 12px",width:36}}/>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:12,padding:"10px 14px",background:"rgba(59,130,246,0.07)",border:"1px solid rgba(59,130,246,0.18)",borderRadius:10,fontSize:12,color:T.muted}}>
        ⚠️ Derating factors per PEC 2017. Aluminum values use 84% of copper ampacity. Always verify with licensed PEE before final design.
      </div>
    </div>
  );
}



// ─── RUN ELECTRICAL COMPUTATIONS ─────────────────────────────────────────────

// ─── BRANCH 80% CHECKER ──────────────────────────────────────────────────────

export default AmpacityDerating;
