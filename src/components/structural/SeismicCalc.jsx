import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { PH_SEISMIC_ZONES, SOIL_TYPES, OCCUPANCY_I } from "./constants.jsx";
import { Card, Label } from "../../theme.jsx";
import { Input, Select } from "../../theme.jsx";
import { FromPlansBadge } from "./constants.jsx";

function SeismicCalc({ structuralData, structuralResults }) {
  const sd = structuralData;
  const [zone, setZone] = useState(sd?.seismic?.zone || "");
  const [soil, setSoil] = useState(sd?.seismic?.soilTypeLabel || "");
  const [occ,  setOcc]  = useState(sd?.seismic?.occupancyCategory || "");
  const [W,    setW]    = useState(sd?.seismic?.seismicWeight ?? "");
  const [TK,   setTp]   = useState(sd?.seismic?.naturalPeriod  ?? "");
  const [R,    setR]    = useState(sd?.seismic?.responseFactor  ?? "");
  const [result, setResult] = useState(null);
  const [fp, setFp] = useState({
    zone: !!sd?.seismic?.zone, soil: !!sd?.seismic?.soilTypeLabel,
    occ: !!sd?.seismic?.occupancyCategory, W: sd?.seismic?.seismicWeight != null,
    TK: sd?.seismic?.naturalPeriod != null, R: sd?.seismic?.responseFactor != null,
  });

  useEffect(() => {
    if (!sd?.seismic) return;
    const s = sd.seismic;
    if (s.zone)              { setZone(s.zone);              setFp(p=>({...p,zone:true})); }
    if (s.soilTypeLabel)     { setSoil(s.soilTypeLabel);     setFp(p=>({...p,soil:true})); }
    if (s.occupancyCategory) { setOcc(s.occupancyCategory);  setFp(p=>({...p,occ:true})); }
    if (s.seismicWeight != null) { setW(s.seismicWeight);    setFp(p=>({...p,W:true})); }
    if (s.naturalPeriod  != null){ setTp(s.naturalPeriod);   setFp(p=>({...p,TK:true})); }
    if (s.responseFactor != null){ setR(s.responseFactor);   setFp(p=>({...p,R:true})); }
  }, [sd]);

  const calc = () => {
    if (!zone || !soil || !occ || W==="" || TK==="" || R==="") return;
    const Zv = PH_SEISMIC_ZONES[zone]?.Z;
    if (!Zv) return;
    const soilKey = Object.keys(SOIL_TYPES).find(k=>k===soil) || Object.keys(SOIL_TYPES)[3];
    const {Fa,Fv} = SOIL_TYPES[soilKey];
    const I  = OCCUPANCY_I[occ] || 1.0;
    const Ca = 0.4*Fa*Zv;
    const Cv = 0.4*Fv*Zv*1.5;
    const Ts = Cv/(2.5*Ca);
    const T0 = 0.2*Ts;
    const t  = +TK;
    const Sa = t<=T0 ? Ca*(0.6*(t/T0)+0.4) : t<=Ts ? 2.5*Ca : Cv/t;
    const Vmin = 0.11*Ca*I*(+W);
    const Vmax = 2.5*Ca*I*(+W)/(+R);
    const V    = Math.max(Vmin, Math.min(Sa*I*(+W)/(+R), Vmax));
    const Cs   = V/(+W);
    setResult({Ca,Cv,Ts,T0,Sa,V,Cs,Vmin,Vmax,Zv,I,Fa,Fv});
  };

  const Hint = ({children}) => <div style={{fontSize:11,color:T.muted,marginBottom:12,fontStyle:"italic"}}>{children}</div>;
  const canCalc = zone && soil && occ && W!=="" && TK!=="" && R!=="";

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        {!sd && (
          <div style={{padding:"10px 14px",background:"rgba(6,150,215,0.06)",border:"1px solid rgba(6,150,215,0.15)",borderRadius:8,marginBottom:16,fontSize:12,color:"#0696d7",lineHeight:1.6}}>
            💡 Upload structural plans in <strong>AI Plan Checker</strong> to auto-fill these parameters, or enter values manually below.
          </div>
        )}
        {sd && !sd.seismic?.seismicWeight && !sd.seismic?.zone && (
          <div style={{padding:"12px 14px",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8,marginBottom:16,fontSize:12,color:"#f59e0b",lineHeight:1.7}}>
            <strong style={{fontSize:13}}>⚠ Unverifiable — No seismic data found in plans</strong><br/>
            <span style={{color:T.muted}}>The AI could not extract seismic parameters (zone, weight, period, soil type) from the uploaded structural plans. This is common when plans don't include a seismic analysis sheet. Enter values manually below to run the computation, or re-upload plans that include seismic design data.</span>
          </div>
        )}
        <Label>Seismic Zone (NSCP 2015 Sec. 208.4) {fp.zone && <FromPlansBadge/>}</Label>
        <Select value={zone} onChange={e=>setZone(e.target.value)} style={{marginBottom:4}}>
          <option value="">— Select zone —</option>
          {Object.entries(PH_SEISMIC_ZONES).map(([k,v])=><option key={k} value={k}>{k} — Z={v.Z}</option>)}
        </Select>
        {zone ? <div style={{fontSize:11,color:T.muted,marginBottom:16}}>{PH_SEISMIC_ZONES[zone].desc}</div>
               : <Hint>Zone 4 covers most of Luzon and Mindanao. Confirm with geohazard map.</Hint>}

        <Label>Soil Profile Type (NSCP Table 208-2) {fp.soil && <FromPlansBadge/>}</Label>
        <Select value={soil} onChange={e=>setSoil(e.target.value)} style={{marginBottom:4}}>
          <option value="">— Select soil type —</option>
          {Object.keys(SOIL_TYPES).map(k=><option key={k} value={k}>{k}</option>)}
        </Select>
        <Hint>From geotechnical report. SD (Stiff Soil) is most common for urban sites.</Hint>

        <Label>Occupancy Category {fp.occ && <FromPlansBadge/>}</Label>
        <Select value={occ} onChange={e=>setOcc(e.target.value)} style={{marginBottom:16}}>
          <option value="">— Select occupancy —</option>
          {Object.keys(OCCUPANCY_I).map(k=><option key={k} value={k}>{k} (I={OCCUPANCY_I[k]})</option>)}
        </Select>

        <Label>Seismic Weight W (kN) {fp.W && <FromPlansBadge/>}</Label>
        <Input type="number" value={W} onChange={e=>setW(e.target.value)} placeholder="e.g. 5000 — total gravity load at base" style={{marginBottom:16}}/>

        <Label>Fundamental Period T (seconds) {fp.TK && <FromPlansBadge/>}</Label>
        <Input type="number" value={TK} onChange={e=>setTp(e.target.value)} step="0.05" placeholder="e.g. 0.30 — use NSCP Eq. 208-8 or modal analysis" style={{marginBottom:16}}/>

        <Label>Response Modification Factor R {fp.R && <FromPlansBadge/>}</Label>
        <Input type="number" value={R} onChange={e=>setR(e.target.value)} step="0.5" placeholder="SMRF=8.5 · OMRF=3.5 · Shear Wall=5.5" style={{marginBottom:4}}/>
        <Hint>Per NSCP Table 208-11. Confirm with structural system type.</Hint>

        <button onClick={calc} disabled={!canCalc} style={{width:"100%",background:canCalc?"linear-gradient(135deg,#0696d7,#0569a8)":"rgba(255,255,255,0.05)",border:"none",color:canCalc?"#fff":T.muted,fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:canCalc?"pointer":"not-allowed",marginTop:8,transition:"all 0.2s"}}>
          {canCalc ? "⚡ Calculate Seismic Base Shear" : "Fill all fields to calculate"}
        </button>
      </Card>
      {result ? (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:"rgba(6,150,215,0.06)",border:"1.5px solid rgba(6,150,215,0.3)"}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>DESIGN BASE SHEAR</div>
            <div style={{fontSize:42,fontWeight:900,color:"#0696d7",letterSpacing:"-2px"}}>{result.V.toFixed(1)} <span style={{fontSize:18,fontWeight:400}}>kN</span></div>
            <div style={{fontSize:13,color:T.muted,marginTop:4}}>Cs = {(result.Cs*100).toFixed(2)}% of seismic weight</div>
          </Card>
          {[
            {l:"Zone Factor Z",v:`${result.Zv}`},{l:"Fa",v:`${result.Fa}`},{l:"Fv",v:`${result.Fv}`},
            {l:"Ca",v:result.Ca.toFixed(4)},{l:"Cv",v:result.Cv.toFixed(4)},{l:"Sa",v:`${result.Sa.toFixed(4)} g`},
            {l:"Ts",v:`${result.Ts.toFixed(3)} s`},{l:"Vmin",v:`${result.Vmin.toFixed(1)} kN`},{l:"Vmax",v:`${result.Vmax.toFixed(1)} kN`},
            {l:"Design Base Shear V",v:`${result.V.toFixed(1)} kN`,hi:true},
          ].map(r=>(
            <div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 14px",background:r.hi?"rgba(6,150,215,0.1)":T.dim,borderRadius:8,border:r.hi?"1px solid rgba(6,150,215,0.3)":"none"}}>
              <span style={{fontSize:13,color:T.muted}}>{r.l}</span>
              <span style={{fontSize:14,fontWeight:700,color:r.hi?"#0696d7":T.text,fontFamily:"monospace"}}>{r.v}</span>
            </div>
          ))}
          {/* ── Engineering Insights ── */}
          <div style={{padding:"14px 16px",background:"rgba(6,150,215,0.04)",border:"1px solid rgba(6,150,215,0.15)",borderRadius:10}}>
            <div style={{fontSize:11,fontWeight:800,color:"#0696d7",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>✓ Engineering Insight</div>
            <div style={{fontSize:12,color:T.text,lineHeight:1.8}}>
              {(() => {
                const insights = [];
                const CsPercent = (result.Cs*100).toFixed(2);
                // Seismic coefficient context
                if (result.Cs > 0.15) {
                  insights.push({type:"warn",text:`High seismic coefficient Cs = ${CsPercent}%. This building experiences significant lateral forces. Ensure all connections and detailing comply with NSCP Sec. 421 (seismic provisions).`});
                } else if (result.Cs > 0.08) {
                  insights.push({type:"pass",text:`Moderate seismic coefficient Cs = ${CsPercent}%. Typical for mid-rise structures in Zone 4 with stiff soil.`});
                } else {
                  insights.push({type:"pass",text:`Low seismic coefficient Cs = ${CsPercent}%. Lateral forces are modest — likely governed by wind load. Check wind per NSCP Sec. 207.`});
                }
                // Base shear distribution guidance
                insights.push({type:"info",text:`Base shear V = ${result.V.toFixed(1)} kN must be distributed vertically per NSCP Sec. 208.5.5 using Ft (top force) + Fx per floor based on height and weight.`});
                // R factor context
                if (+R >= 8) {
                  insights.push({type:"pass",text:`R = ${R} (Special Moment Resisting Frame). High ductility required — all beam-column joints must satisfy NSCP Sec. 421 strong-column/weak-beam provisions.`});
                } else if (+R >= 4.5) {
                  insights.push({type:"pass",text:`R = ${R} (Intermediate system). Moderate ductility detailing required per NSCP Sec. 421. Verify stirrup spacing in plastic hinge zones.`});
                } else {
                  insights.push({type:"warn",text:`R = ${R} (Ordinary/Shear Wall system). Low ductility demand but higher seismic forces. Verify wall-to-frame load path per NSCP Sec. 208.7.`});
                }
                // Min/Max check
                if (result.V <= result.Vmin*1.05) {
                  insights.push({type:"info",text:`Base shear governed by Vmin = ${result.Vmin.toFixed(1)} kN (0.11·Ca·I·W). Period may be long — verify T with modal analysis if available.`});
                } else if (result.V >= result.Vmax*0.95) {
                  insights.push({type:"info",text:`Base shear governed by Vmax = ${result.Vmax.toFixed(1)} kN cap. This limits the design force. Actual ductility demand may be higher — ensure detailing complies.`});
                }
                return insights.map((ins,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:i<insights.length-1?8:0}}>
                    <span style={{flexShrink:0,fontSize:11,fontWeight:800,color:ins.type==="fail"?"#ef4444":ins.type==="warn"?"#f59e0b":ins.type==="info"?"#0696d7":"#22c55e"}}>
                      {ins.type==="fail"?"✗":ins.type==="warn"?"⚠":ins.type==="info"?"ℹ":"✓"}
                    </span>
                    <span>{ins.text}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>V = Sa·I·W/R, bounded by Vmin=0.11·Ca·I·W and Vmax=2.5·Ca·I·W/R (NSCP 2015 Sec. 208.5.2)</div>
        </div>
      ) : (
        (() => {
          const priorItems = structuralResults?.items?.filter(i=>i.tool==="seismic") || [];
          const seisRes = structuralResults?.seismic;
          if (priorItems.length > 0) {
            return (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <Card style={{background:priorItems[0].status==="CANNOT VERIFY"?"rgba(245,158,11,0.06)":"rgba(6,150,215,0.06)",border:`1.5px solid ${priorItems[0].status==="CANNOT VERIFY"?"rgba(245,158,11,0.3)":"rgba(6,150,215,0.3)"}`}}>
                  <div style={{fontSize:11,color:T.muted,marginBottom:4}}>RUN ALL — SEISMIC LOAD RESULT</div>
                  <div style={{fontSize:16,fontWeight:900,color:priorItems[0].status==="CANNOT VERIFY"?"#f59e0b":"#0696d7",marginBottom:4}}>
                    {priorItems[0].status==="CANNOT VERIFY"?"⚠ CANNOT VERIFY":"✓ COMPUTED"}
                  </div>
                  {priorItems[0].value && <div style={{fontSize:28,fontWeight:900,color:"#0696d7"}}>{priorItems[0].value}</div>}
                  {priorItems[0].error && <div style={{fontSize:12,color:"#f59e0b",marginTop:6,padding:"8px 12px",background:"rgba(245,158,11,0.06)",borderRadius:8,borderLeft:"2px solid #f59e0b",lineHeight:1.6}}>{priorItems[0].error}</div>}
                </Card>
                {seisRes && (
                  <div style={{padding:"14px 16px",background:"rgba(6,150,215,0.04)",border:"1px solid rgba(6,150,215,0.15)",borderRadius:10}}>
                    <div style={{fontSize:11,fontWeight:800,color:"#0696d7",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>✓ Engineering Insight</div>
                    <div style={{fontSize:12,color:T.text,lineHeight:1.8}}>
                      <div style={{display:"flex",gap:8,marginBottom:6}}><span style={{flexShrink:0,fontSize:11,fontWeight:800,color:"#22c55e"}}>✓</span><span>Base shear V = {seisRes.V} kN (Cs = {seisRes.Cs}%). {seisRes.Cs>15?"High seismic demand.":seisRes.Cs>8?"Moderate seismic demand.":"Low seismic demand."}</span></div>
                      <div style={{display:"flex",gap:8,marginBottom:6}}><span style={{flexShrink:0,fontSize:11,fontWeight:800,color:"#0696d7"}}>ℹ</span><span>Zone: {seisRes.zone}, R = {seisRes.R}. Distribute V vertically per NSCP Sec. 208.5.5.</span></div>
                    </div>
                  </div>
                )}
                <Card style={{background:"rgba(6,150,215,0.04)",border:"1px solid rgba(6,150,215,0.15)"}}>
                  <div style={{fontSize:11,color:"#0696d7",fontWeight:700,marginBottom:4}}>MANUAL DETAILED CHECK</div>
                  <div style={{fontSize:11,color:T.muted,lineHeight:1.6}}>Fill in seismic zone, soil type, W, T, and R on the left then click Calculate for a full parameter breakdown.</div>
                </Card>
              </div>
            );
          }
          return (
            <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}>
              <Icon name="seismic" size={40} color={T.muted}/>
              <div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Fill parameters and click<br/>Calculate to see results</div>
            </Card>
          );
        })()
      )}
    </div>
  );
}

// ─── STRUCTICODE: BEAM DESIGN ────────────────────────────────────────────────

export default SeismicCalc;
