import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { WIRE_DATA, AWG_SIZES } from "./constants.jsx";
import { Card, Label, Input, Select, Stat } from "../../theme.jsx";
import VerifyHintBanner from "./VerifyHintBanner.jsx";

function ShortCircuitCalc({ electricalData, calcState, onStateChange, verifyHint }) {
  const ed = electricalData?.shortCircuit || {};
  const init = calcState || {};
  const [voltage,     setVoltage]     = useState(init.voltage     ?? ed.voltage     ?? 230);
  const [phases,      setPhases]      = useState(init.phases      ?? ed.phases      ?? 1);
  const [xfmrKVA,     setXfmrKVA]     = useState(init.xfmrKVA     ?? ed.xfmrKVA     ?? 25);
  const [xfmrZ,       setXfmrZ]       = useState(init.xfmrZ       ?? ed.xfmrZ       ?? 4);
  const [cableLen,    setCableLen]    = useState(init.cableLen    ?? ed.cableLen    ?? 15);
  const [cableSize,   setCableSize]   = useState(init.cableSize   ?? ed.cableSize   ?? 8);
  const [material,    setMaterial]    = useState(init.material    ?? ed.material    ?? "copper");
  const [existingFLA, setExistingFLA] = useState(init.existingFLA ?? 20);
  const [fp, setFp] = useState({
    voltage: !!ed.voltage, phases: !!ed.phases, xfmrKVA: !!ed.xfmrKVA,
    xfmrZ: !!ed.xfmrZ, cableLen: !!ed.cableLen, cableSize: !!ed.cableSize,
  });
  const [xfmrFromPlans,setXfmrFromPlans]=useState(false);
  useEffect(()=>{
    if(!ed||Object.keys(ed).length===0)return;
    const sN=(v,fb)=>{const n=+v;return isFinite(n)&&n>0?n:fb;};
    if(sN(ed.voltage,0)>0){setVoltage(sN(ed.voltage,230));setFp(p=>({...p,voltage:true}));}
    if(sN(ed.phases,0)>0){setPhases(sN(ed.phases,1));setFp(p=>({...p,phases:true}));}
    if(sN(ed.xfmrKVA,0)>0){setXfmrKVA(sN(ed.xfmrKVA,25));setFp(p=>({...p,xfmrKVA:true}));setXfmrFromPlans(true);}
    if(sN(ed.xfmrZ,0)>0){setXfmrZ(sN(ed.xfmrZ,4));setFp(p=>({...p,xfmrZ:true}));}
    if(sN(ed.cableLen,0)>0){setCableLen(sN(ed.cableLen,15));setFp(p=>({...p,cableLen:true}));}
    if(ed.cableSize!=null){setCableSize(ed.cableSize);setFp(p=>({...p,cableSize:true}));}
    if(ed.material!=null){setMaterial(ed.material);}
  },[electricalData]);
  useEffect(()=>{if(onStateChange)onStateChange({voltage,phases,xfmrKVA,xfmrZ,cableLen,cableSize,material,existingFLA});},[voltage,phases,xfmrKVA,xfmrZ,cableLen,cableSize,material,existingFLA]);
  const R_cable=material==="aluminum"?(WIRE_DATA[cableSize]?.resistance||0.002061)*1.64:WIRE_DATA[cableSize]?.resistance||0.002061;
  const safeKVA=xfmrKVA>0?xfmrKVA:25,safeZ=xfmrZ>0?xfmrZ:4;
  const Zxfmr=(safeZ/100)*((voltage*voltage)/(safeKVA*1000));
  const Rcable=R_cable*cableLen*2,Xcable=0.0492e-3*cableLen*2;
  const Xtxfmr=Zxfmr*0.95,Rtxfmr=Zxfmr*0.05,Rtotal=Rtxfmr+Rcable,Xtotal=Xtxfmr+Xcable;
  const Ztotal=Math.sqrt(Rtotal*Rtotal+Xtotal*Xtotal);
  const sqrtFactor=phases===3?Math.sqrt(3):1;
  const Isc_sym=(isFinite(Ztotal)&&Ztotal>0)?voltage/(sqrtFactor*Ztotal):0;
  const Isc_asym=Isc_sym*1.414*Math.exp(-Math.PI*Rtotal/Xtotal);
  const Isc_peak=Isc_sym*Math.sqrt(2)*(1+Math.exp(-Math.PI*Rtotal/Xtotal));

  // Standard breaker ratings (ANSI)
  const STD_AIC = [5000,10000,14000,18000,22000,25000,35000,42000,65000,100000,200000];
  const minAIC  = STD_AIC.find(r => r >= Isc_sym) || 200000;

  // Arc flash rough estimate (simplified IEEE 1584 approach)
  const Iarc = Isc_sym * 0.85;
  const arcLevel = Iarc > 50000 ? "Extreme (>4 cal/cm²)" : Iarc > 20000 ? "High (>4 cal/cm²)" : Iarc > 5000 ? "Moderate (1-4 cal/cm²)" : "Low (<1 cal/cm²)";
  const arcColor = Iarc > 20000 ? T.danger : Iarc > 5000 ? T.warn : T.success;

  const rows = [
    { label:"Transformer Impedance (Ztx)", val:Zxfmr.toFixed(5)+" Ω", note:"Referred to LV side" },
    { label:"Cable Impedance (Zcbl)", val:(Math.sqrt(Rcable*Rcable+Xcable*Xcable)).toFixed(5)+" Ω", note:`${cableLen}m × 2 (L+N)` },
    { label:"Total Impedance (Ztotal)", val:Ztotal.toFixed(5)+" Ω", note:"Series combination" },
    { label:"X/R Ratio", val:(Xtotal/Rtotal).toFixed(2), note:"System X/R" },
  ];

  return (
    <div>
      <p style={{ color:T.muted, fontSize:13, margin:"0 0 20px" }}>
        Estimate available fault current for breaker interrupting capacity per <strong style={{color:T.text}}>PEC 2017 Art. 2.40</strong>.
      </p>
      <VerifyHintBanner hint={verifyHint}/>
      {!xfmrFromPlans&&(<div style={{background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.25)",borderRadius:10,padding:"10px 16px",marginBottom:16,fontSize:12,color:"#93c5fd"}}>ℹ️ <strong>Transformer not found in plans</strong> — enter MERALCO nameplate values. Defaults (25 kVA, 4%Z) used.</div>)}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14, marginBottom:24 }}>
        <div><Label>System Voltage</Label>
          <Select value={voltage} onChange={e=>setVoltage(+e.target.value)}>
            <option value={120}>120 V</option>
            <option value={230}>230 V</option>
            <option value={400}>400 V</option>
            <option value={13800}>13,800 V</option>
          </Select>
        </div>
        <div><Label>Phases</Label>
          <Select value={phases} onChange={e=>setPhases(+e.target.value)}>
            <option value={1}>Single Phase (1φ)</option>
            <option value={3}>Three Phase (3φ)</option>
          </Select>
        </div>
        <div><Label>Transformer Rating (kVA)</Label>
          <Input type="number" value={xfmrKVA} min={1} onChange={e=>setXfmrKVA(+e.target.value)} placeholder="kVA"/>
        </div>
        <div><Label>Transformer %Z (Impedance)</Label>
          <Input type="number" value={xfmrZ} min={0.5} step={0.25} onChange={e=>setXfmrZ(+e.target.value)} placeholder="%"/>
        </div>
        <div><Label>Cable Length (meters)</Label>
          <Input type="number" value={cableLen} min={1} onChange={e=>setCableLen(+e.target.value)} placeholder="Meters"/>
        </div>
        <div><Label>Cable Size (AWG)</Label>
          <Select value={cableSize} onChange={e=>setCableSize(e.target.value)}>
            {AWG_SIZES.map(s=><option key={s} value={s}>{s} AWG{s>=250?" kcmil":""}</option>)}
          </Select>
        </div>
        <div><Label>Cable Material</Label>
          <Select value={material} onChange={e=>setMaterial(e.target.value)}>
            <option value="copper">Copper (Cu)</option>
            <option value="aluminum">Aluminum (Al)</option>
          </Select>
        </div>
        <div><Label>Existing Breaker FLA (A)</Label>
          <Input type="number" value={existingFLA} min={1} onChange={e=>setExistingFLA(+e.target.value)} placeholder="Amperes"/>
        </div>
      </div>

      {/* Main results */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:12, marginBottom:20 }}>
        <Stat label="Symmetrical Fault Current" value={Math.round(Isc_sym).toLocaleString()+" A"} sub="RMS (worst case)" color={T.danger}/>
        <Stat label="Asymmetrical Fault Current" value={Math.round(Isc_asym).toLocaleString()+" A"} sub="First half-cycle" color={T.warn}/>
        <Stat label="Peak Fault Current" value={Math.round(Isc_peak).toLocaleString()+" A"} sub="Instantaneous peak" color={T.muted}/>
        <Stat label="Required Min. AIC Rating" value={minAIC.toLocaleString()+" A"} sub="Next standard ANSI rating" accent/>
        <Stat label="Estimated Arc Fault Current" value={Math.round(Iarc).toLocaleString()+" A"} sub="IEEE 1584 estimate (85%)" color={arcColor}/>
        <div style={{ background:T.dim, border:`1.5px solid ${T.border}`, borderRadius:12, padding:"16px 18px" }}>
          <Label>Arc Flash Category</Label>
          <div style={{ fontSize:14, fontWeight:700, color:arcColor, lineHeight:1.3 }}>{arcLevel}</div>
          <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>Wear appropriate PPE</div>
        </div>
      </div>

      {/* Breaker check */}
      <Card style={{ marginBottom:20 }}>
        <Label>Breaker Interrupting Capacity Check</Label>
        <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap", marginTop:8 }}>
          <div>
            <div style={{ fontSize:12, color:T.muted }}>Available Fault Current</div>
            <div style={{ fontSize:22, fontWeight:800, color:T.danger }}>{Math.round(Isc_sym).toLocaleString()} A</div>
          </div>
          <div style={{ fontSize:24, color:T.muted }}>vs</div>
          <div>
            <div style={{ fontSize:12, color:T.muted }}>Your Breaker AIC ({existingFLA}A breaker)</div>
            <div style={{ fontSize:22, fontWeight:800, color:T.accent }}>10,000 A <span style={{fontSize:13, color:T.muted}}>(assumed standard)</span></div>
          </div>
          <div style={{ flex:1, minWidth:160 }}>
            {Isc_sym <= 10000
              ? <div style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:10, padding:"10px 16px", color:T.success, fontWeight:700 }}>✓ Standard 10kA breaker is adequate</div>
              : <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"10px 16px", color:T.danger, fontWeight:700 }}>✗ Upgrade to {minAIC.toLocaleString()}A AIC rated breaker!</div>
            }
          </div>
        </div>
      </Card>

      {/* Impedance breakdown */}
      <Label>Impedance Breakdown</Label>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ background:T.dim }}>
              {["Component","Impedance","Note"].map(h=>(
                <th key={h} style={{ padding:"10px 14px", color:T.muted, fontWeight:700, fontSize:11, textTransform:"uppercase", textAlign:"left", borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.label} style={{ borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:"9px 14px", color:T.text }}>{r.label}</td>
                <td style={{ padding:"9px 14px", fontFamily:"monospace", color:T.accent, fontWeight:600 }}>{r.val}</td>
                <td style={{ padding:"9px 14px", color:T.muted, fontSize:12 }}>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop:14, padding:"10px 14px", background:"rgba(59,130,246,0.07)", border:"1px solid rgba(59,130,246,0.18)", borderRadius:10, fontSize:12, color:T.muted }}>
        ⚠️ Estimated values for preliminary design. A formal short-circuit study by a licensed PEE is required per PEC Art. 2.40 before final equipment specification.
      </div>
    </div>
  );
}

// ─── LOAD CALCULATOR ─────────────────────────────────────────────────────────

export default ShortCircuitCalc;
