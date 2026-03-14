import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { WIRE_DATA, AWG_SIZES } from "./constants.jsx";
import { Card, Label, Input, Select, Stat, ComplianceGauge } from "../../theme.jsx";
import VerifyHintBanner from "./VerifyHintBanner.jsx";

function VoltageDropCalc({ electricalData, calcState, onStateChange, verifyHint }) {
  const ed = electricalData?.voltageDrop || {};
  const init = calcState || {};
  const [phase,    setPhase]    = useState(init.phase    ?? ed.phase    ?? "single");
  const [voltage,  setVoltage]  = useState(init.voltage  ?? ed.voltage  ?? 230);
  const [current,  setCurrent]  = useState(init.current  ?? ed.current  ?? 20);
  const [length,   setLength]   = useState(init.length   ?? ed.length   ?? 30);
  const [wireSize, setWireSize] = useState(init.wireSize ?? ed.wireSize ?? 12);
  const [pf,       setPf]       = useState(init.pf       ?? ed.pf       ?? 0.9);
  const [material, setMaterial] = useState(init.material ?? ed.material ?? "copper");
  const [fp, setFp] = useState({
    phase: !!ed.phase, voltage: !!ed.voltage, current: !!ed.current,
    length: !!ed.length, wireSize: !!ed.wireSize, pf: !!ed.pf,
  });
  useEffect(() => {
    if (!ed || Object.keys(ed).length === 0) return;
    if (ed.phase    != null) { setPhase(ed.phase);       setFp(p=>({...p,phase:true})); }
    if (ed.voltage  != null) { setVoltage(+ed.voltage);  setFp(p=>({...p,voltage:true})); }
    if (ed.current  != null) { setCurrent(+ed.current);  setFp(p=>({...p,current:true})); }
    if (ed.length   != null) { setLength(+ed.length);    setFp(p=>({...p,length:true})); }
    if (ed.wireSize != null) { setWireSize(ed.wireSize); setFp(p=>({...p,wireSize:true})); }
    if (ed.pf       != null) { setPf(+ed.pf);            setFp(p=>({...p,pf:true})); }
    if (ed.material != null) { setMaterial(ed.material); }
  }, [electricalData]);
  // Persist state upward
  useEffect(() => {
    if (onStateChange) onStateChange({ phase, voltage, current, length, wireSize, pf, material });
  }, [phase, voltage, current, length, wireSize, pf, material]);

  // Resistance in mΩ/m (copper vs aluminum)
  const getR = () => {
    const base = WIRE_DATA[wireSize]?.resistance || WIRE_DATA[12].resistance;
    return material === "aluminum" ? base * 1.64 : base;
  };

  // Reactance approx (mΩ/m) for conduit
  const X = 0.0492;

  const R = getR();
  const angle = Math.acos(pf);
  const sinPF = Math.sin(angle);
  const multiplier = phase === "three" ? Math.sqrt(3) : 2;
  const vdrop = multiplier * current * length * (R * pf + X * sinPF) / 1000;
  const vdropPct = (vdrop / voltage) * 100;
  const vReceiving = voltage - vdrop;

  // PEC limits: 3% branch, 5% feeder+branch
  const branchLimit = 3;
  const feederLimit = 5;

  // Recommend minimum wire size
  const recommendWire = () => {
    for (const size of AWG_SIZES) {
      const r2 = material==="aluminum" ? WIRE_DATA[size]?.resistance*1.64 : WIRE_DATA[size]?.resistance;
      if (!r2) continue;
      const vd = multiplier * current * length * (r2 * pf + X * sinPF) / 1000;
      if ((vd / voltage) * 100 <= branchLimit) return size;
    }
    return "500+";
  };

  const recSize = recommendWire();
  const FpBadge = ({field}) => fp[field] ? <span style={{fontSize:8,background:"rgba(34,197,94,0.15)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.25)",padding:"0px 4px",borderRadius:3,fontWeight:700,marginLeft:5}}>PLANS</span> : null;

  return (
    <div>
      <VerifyHintBanner hint={verifyHint}/>
      <p style={{ color:T.muted, fontSize:13, margin:"0 0 20px" }}>
        Calculate conductor voltage drop per <strong style={{color:T.text}}>PEC 2017 Art. 2.30</strong> — max 3% for branch circuits, 5% total (feeder + branch).
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14, marginBottom:24 }}>
        <div><Label>Circuit Type <FpBadge field="phase"/></Label>
          <Select value={phase} onChange={e=>setPhase(e.target.value)}>
            <option value="single">Single Phase (1φ)</option>
            <option value="three">Three Phase (3φ)</option>
          </Select>
        </div>
        <div><Label>Source Voltage (V)</Label>
          <Select value={voltage} onChange={e=>setVoltage(+e.target.value)}>
            <option value={120}>120 V</option>
            <option value={230}>230 V</option>
            <option value={240}>240 V</option>
            <option value={400}>400 V (3φ)</option>
          </Select>
        </div>
        <div><Label>Load Current (A)</Label>
          <Input type="number" value={current} min={1} onChange={e=>setCurrent(+e.target.value)} placeholder="Amperes"/>
        </div>
        <div><Label>One-Way Cable Length (m)</Label>
          <Input type="number" value={length} min={1} onChange={e=>setLength(+e.target.value)} placeholder="Meters"/>
        </div>
        <div><Label>Conductor Size (AWG)</Label>
          <Select value={wireSize} onChange={e=>setWireSize(e.target.value)}>
            {AWG_SIZES.map(s=><option key={s} value={s}>{s} AWG{s>=250?" kcmil":""} — {WIRE_DATA[s]?.ampacity}A</option>)}
          </Select>
        </div>
        <div><Label>Conductor Material</Label>
          <Select value={material} onChange={e=>setMaterial(e.target.value)}>
            <option value="copper">Copper (Cu)</option>
            <option value="aluminum">Aluminum (Al)</option>
          </Select>
        </div>
        <div><Label>Power Factor</Label>
          <Select value={pf} onChange={e=>setPf(+e.target.value)}>
            <option value={1.0}>1.00 (Resistive)</option>
            <option value={0.95}>0.95</option>
            <option value={0.90}>0.90 (Typical)</option>
            <option value={0.85}>0.85</option>
            <option value={0.80}>0.80</option>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, alignItems:"start" }}>
        {/* Gauge */}
        <Card style={{ padding:24, textAlign:"center" }}>
          <Label>Voltage Drop — Branch Circuit</Label>
          <ComplianceGauge pct={vdropPct} limit={branchLimit} label="PEC limit: 3% (branch), 5% (total)" />
          <div style={{ marginTop:16, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div style={{ background:T.dim, borderRadius:10, padding:"10px 12px" }}>
              <div style={{ fontSize:11, color:T.muted, marginBottom:2 }}>Voltage Drop</div>
              <div style={{ fontSize:20, fontWeight:800, color: vdropPct>branchLimit?T.danger:T.success }}>{vdrop.toFixed(2)} V</div>
            </div>
            <div style={{ background:T.dim, borderRadius:10, padding:"10px 12px" }}>
              <div style={{ fontSize:11, color:T.muted, marginBottom:2 }}>Receiving End</div>
              <div style={{ fontSize:20, fontWeight:800, color:T.text }}>{vReceiving.toFixed(1)} V</div>
            </div>
          </div>
        </Card>

        {/* Results grid */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Stat label="Voltage Drop %" value={vdropPct.toFixed(3)+"%"} sub={`PEC branch limit: ${branchLimit}%`} color={vdropPct>branchLimit?T.danger:T.success}/>
          <Stat label="Conductor Resistance" value={(getR()*1000).toFixed(3)+" mΩ/m"} sub={`${material} — ${wireSize} AWG`}/>
          <Stat
            label="Recommended Min. Wire Size"
            value={recSize+" AWG"}
            sub={`to meet ${branchLimit}% drop limit`}
            accent={vdropPct>branchLimit}
          />
          <div style={{ background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.info, marginBottom:4 }}>📐 Formula Used</div>
            <div style={{ fontSize:12, color:T.muted, lineHeight:1.7, fontFamily:"monospace" }}>
              VD = {multiplier === 2 ? "2" : "√3"} × I × L × (R·cosθ + X·sinθ) / 1000<br/>
              VD = {multiplier} × {current} × {length} × ({(getR()).toFixed(4)}×{pf} + {X}×{sinPF.toFixed(3)})<br/>
              VD = <strong style={{color:T.text}}>{vdrop.toFixed(3)} V</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison table for nearby sizes */}
      <div style={{ marginTop:24 }}>
        <Label>Wire Size Comparison Table</Label>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:T.dim }}>
                {["Wire Size","Ampacity","Resistance (mΩ/m)","Voltage Drop (V)","VD %","Status"].map(h=>(
                  <th key={h} style={{ padding:"10px 14px", color:T.muted, fontWeight:700, fontSize:11, textTransform:"uppercase", textAlign:"left", borderBottom:`1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AWG_SIZES.filter((_,i)=>i%2===0||AWG_SIZES.indexOf(wireSize)===AWG_SIZES.indexOf(_)).map(size=>{
                const r2 = material==="aluminum" ? (WIRE_DATA[size]?.resistance||0)*1.64 : WIRE_DATA[size]?.resistance||0;
                const vd2 = multiplier * current * length * (r2 * pf + X * sinPF) / 1000;
                const pct2 = (vd2 / voltage) * 100;
                const isCurrent = String(size)===String(wireSize);
                const ok = pct2 <= branchLimit;
                return (
                  <tr key={size} style={{ background: isCurrent?"rgba(245,158,11,0.07)":"transparent", borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:"9px 14px", fontWeight: isCurrent?700:400, color: isCurrent?T.accent:T.text }}>
                      {isCurrent?"▶ ":""}{size} AWG{size>=250?" kcmil":""}
                    </td>
                    <td style={{ padding:"9px 14px", color:T.muted }}>{WIRE_DATA[size]?.ampacity} A</td>
                    <td style={{ padding:"9px 14px", color:T.muted, fontFamily:"monospace" }}>{(r2*1000).toFixed(3)}</td>
                    <td style={{ padding:"9px 14px", color:T.text, fontFamily:"monospace" }}>{vd2.toFixed(3)}</td>
                    <td style={{ padding:"9px 14px", fontWeight:600, color:ok?T.success:T.danger }}>{pct2.toFixed(2)}%</td>
                    <td style={{ padding:"9px 14px" }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:20, background:ok?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)", color:ok?T.success:T.danger }}>{ok?"✓ PASS":"✗ FAIL"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── SHORT CIRCUIT CALCULATOR ────────────────────────────────────────────────

export default VoltageDropCalc;
