import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { Card, Label, Input, Select, Stat } from "../../theme.jsx";
import { ComplianceGauge } from "../../theme.jsx";
import { WIRE_DATA, AWG_SIZES } from "./constants.jsx";

function ConduitFillCalc({ electricalData, calcState, onStateChange }) {
  const ACCENT = "#ff6b2b";
  const ed   = electricalData?.conduit || {};
  const init = calcState || {};

  // PEC 2017 Art. 3.50 — Conduit trade sizes with internal area (mm²)
  const CONDUIT_DATA = {
    "RSC/IMC": {
      "1/2\"":  { area:122.71,  label:"½\" (16mm)" },
      "3/4\"":  { area:201.06,  label:"¾\" (19mm)" },
      "1\"":    { area:338.16,  label:"1\" (25mm)" },
      "1-1/4\"":{area:573.76,  label:"1¼\" (32mm)" },
      "1-1/2\"":{area:747.13,  label:"1½\" (38mm)" },
      "2\"":    { area:1194.59, label:"2\" (50mm)" },
      "2-1/2\"":{area:1937.09, label:"2½\" (63mm)" },
      "3\"":    { area:2848.06, label:"3\" (75mm)" },
      "4\"":    { area:5013.27, label:"4\" (100mm)" },
    },
    "EMT": {
      "1/2\"":  { area:90.97,   label:"½\" (16mm)" },
      "3/4\"":  { area:163.87,  label:"¾\" (19mm)" },
      "1\"":    { area:283.53,  label:"1\" (25mm)" },
      "1-1/4\"":{area:484.54,  label:"1¼\" (32mm)" },
      "1-1/2\"":{area:637.94,  label:"1½\" (38mm)" },
      "2\"":    { area:1017.87, label:"2\" (50mm)" },
      "2-1/2\"":{area:1649.55, label:"2½\" (63mm)" },
      "3\"":    { area:2430.19, label:"3\" (75mm)" },
      "4\"":    { area:4268.22, label:"4\" (100mm)" },
    },
    "PVC (Schedule 40)": {
      "1/2\"":  { area:122.71,  label:"½\" (16mm)" },
      "3/4\"":  { area:201.06,  label:"¾\" (19mm)" },
      "1\"":    { area:338.16,  label:"1\" (25mm)" },
      "1-1/4\"":{area:573.76,  label:"1¼\" (32mm)" },
      "1-1/2\"":{area:747.13,  label:"1½\" (38mm)" },
      "2\"":    { area:1194.59, label:"2\" (50mm)" },
      "3\"":    { area:2848.06, label:"3\" (75mm)" },
      "4\"":    { area:5013.27, label:"4\" (100mm)" },
    },
  };

  // THWN conductor OD areas (mm²) — outer diameter incl. insulation
  const CONDUCTOR_AREA = {
    14: 8.97,  12: 11.68, 10: 16.77, 8: 24.26,  6: 37.16,
    4: 52.84,  3: 62.77,  2: 73.16,  1: 95.03,
    "1/0": 113.10, "2/0": 133.77, "3/0": 158.06, "4/0": 192.52,
    250: 225.81, 300: 264.52, 350: 298.45, 400: 345.35, 500: 411.55,
  };

  const MTP={"16mm":"1/2\"","20mm":"3/4\"","25mm":"1\"","32mm":"1-1/4\"","38mm":"1-1/2\"","50mm":"2\"","63mm":"2-1/2\"","75mm":"3\"","100mm":"4\""}
  const nCS=(s)=>{if(!s)return'3/4\"';const k=String(s).trim().replace(/^\d+mm$/i,m=>m.replace(/^0+/,""));return MTP[k]||s;};
  const nCT=(t)=>{if(!t)return"PVC (Schedule 40)";if(/^pvc/i.test(t))return"PVC (Schedule 40)";if(/^(rsc|imc)/i.test(t))return"RSC/IMC";return"PVC (Schedule 40)";};
  const [conduitType,setConduitType]=useState(nCT(init.conduitType??ed.conduitType));
  const [conduitSize,setConduitSize]=useState(nCS(init.conduitSize??ed.conduitSize)||'3/4\"');
  const [conductors,setConductors]=useState(()=>{
    if(init.conductors)return init.conductors;
    if(ed.conductors?.length)return ed.conductors.filter(c=>c).map((c,i)=>({id:i+1,size:String(c.size||"12"),qty:+(c.qty||1),type:c.type||"THWN"}));
    return[{id:1,size:"12",qty:3,type:"THWN"}];
  });
  const [fp,setFp]=useState({conduitType:!!ed.conduitType,conduitSize:!!ed.conduitSize,conductors:!!(ed.conductors?.length)});
  useEffect(()=>{
    if(!ed||Object.keys(ed).length===0)return;
    if(ed.conduitType!=null){setConduitType(nCT(ed.conduitType));setFp(p=>({...p,conduitType:true}));}
    if(ed.conduitSize!=null){setConduitSize(nCS(ed.conduitSize));setFp(p=>({...p,conduitSize:true}));}
    if(ed.conductors?.length){setConductors(ed.conductors.filter(c=>c).map((c,i)=>({id:i+1,size:String(c.size||"12"),qty:+(c.qty||1),type:c.type||"THWN"})));setFp(p=>({...p,conductors:true}));}
  },[electricalData]);
  useEffect(() => {
    if (onStateChange) onStateChange({ conduitType, conduitSize, conductors });
  }, [conduitType, conduitSize, conductors]);

  const addConductor = () => setConductors(p=>[...p,{id:Date.now(),size:"12",qty:1,type:"THWN"}]);
  const remConductor = id => setConductors(p=>p.filter(c=>c.id!==id));
  const updC = (id,f,v) => setConductors(p=>p.map(c=>c.id===id?{...c,[f]:v}:c));

  const conduitArea    = CONDUIT_DATA[conduitType]?.[conduitSize]?.area || 0;
  const totalWireArea  = conductors.reduce((s,c)=>{
    const area = CONDUCTOR_AREA[c.size] || 0;
    return s + area * (+c.qty||1);
  }, 0);
  const fillPct        = conduitArea > 0 ? (totalWireArea / conduitArea * 100) : 0;

  const totalWires     = conductors.reduce((s,c)=>s+(+c.qty||1),0);
  const fillLimit      = totalWires === 1 ? 53 : totalWires === 2 ? 31 : 40;

  // Find minimum conduit size that fits
  const recConduit = () => {
    const sizes = Object.keys(CONDUIT_DATA[conduitType] || {});
    for (const sz of sizes) {
      const area = CONDUIT_DATA[conduitType][sz].area;
      const pct  = totalWireArea / area * 100;
      if (pct <= fillLimit) return { size: sz, label: CONDUIT_DATA[conduitType][sz].label, pct };
    }
    return null;
  };
  const rec = recConduit();
  const ok  = fillPct <= fillLimit;

  const thS = { padding:"9px 12px", color:T.muted, fontWeight:700, fontSize:11,
    textTransform:"uppercase", textAlign:"left", borderBottom:`1px solid ${T.border}`, background:T.dim };
  const tdS = { padding:"8px 10px", borderBottom:`1px solid ${T.border}`, verticalAlign:"middle" };

  return (
    <div>
      <p style={{color:T.muted,fontSize:13,margin:"0 0 20px"}}>
        Check conductor fill per <strong style={{color:T.text}}>PEC 2017 Art. 3.50</strong>: max 40% for 3+ wires, 31% for 2 wires, 53% for 1 wire.
      </p>

      {/* Conduit selection */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:24}}>
        <div><Label>Conduit Type</Label>
          <Select value={conduitType} onChange={e=>{setConduitType(e.target.value);setConduitSize(Object.keys(CONDUIT_DATA[e.target.value])[1]);}}>
            {Object.keys(CONDUIT_DATA).map(t=><option key={t} value={t}>{t}</option>)}
          </Select></div>
        <div><Label>Conduit Trade Size</Label>
          <Select value={conduitSize} onChange={e=>setConduitSize(e.target.value)}>
            {Object.entries(CONDUIT_DATA[conduitType]||{}).map(([k,v])=>(
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select></div>
      </div>

      {/* Results row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24,alignItems:"start"}}>
        {/* Gauge */}
        <Card style={{padding:20,textAlign:"center"}}>
          <Label>Conduit Fill</Label>
          <ComplianceGauge pct={fillPct} limit={fillLimit} label={`PEC limit: ${fillLimit}% (${totalWires} wire${totalWires!==1?"s":""})`}/>
          <div style={{marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div style={{background:T.dim,borderRadius:9,padding:"10px 12px"}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:2}}>Wire Area Used</div>
              <div style={{fontSize:17,fontWeight:800,color:T.text}}>{totalWireArea.toFixed(1)} mm²</div>
            </div>
            <div style={{background:T.dim,borderRadius:9,padding:"10px 12px"}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:2}}>Conduit Area</div>
              <div style={{fontSize:17,fontWeight:800,color:T.text}}>{conduitArea.toFixed(1)} mm²</div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Stat label="Fill Percentage" value={fillPct.toFixed(2)+"%"} sub={`Limit: ${fillLimit}%`} color={ok?T.success:T.danger}/>
          <Stat label="Total Conductors" value={totalWires+" wires"} sub="Current-carrying"/>
          {rec ? (
            <div style={{background:ok?"rgba(34,197,94,0.07)":"rgba(245,158,11,0.07)",
              border:`1.5px solid ${ok?"rgba(34,197,94,0.2)":"rgba(245,158,11,0.2)"}`,
              borderRadius:12,padding:"14px 16px"}}>
              <div style={{fontSize:11,color:T.muted,marginBottom:4,fontWeight:700}}>
                {ok ? "✓ CURRENT CONDUIT IS ADEQUATE" : "MINIMUM CONDUIT REQUIRED"}
              </div>
              <div style={{fontSize:18,fontWeight:800,color:ok?T.success:T.warn}}>
                {rec.label}
              </div>
              <div style={{fontSize:11,color:T.muted,marginTop:2}}>
                {rec.pct.toFixed(1)}% fill with {conduitType}
              </div>
            </div>
          ) : (
            <div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:12,padding:"14px 16px"}}>
              <div style={{fontSize:13,fontWeight:700,color:T.danger}}>✗ Exceeds all available sizes</div>
              <div style={{fontSize:11,color:T.muted,marginTop:4}}>Split conductors into multiple conduits.</div>
            </div>
          )}
        </div>
      </div>

      {/* Conductor table */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <Label>Conductors in Conduit</Label>
        <button onClick={addConductor} style={{padding:"5px 12px",borderRadius:7,border:`1.5px dashed ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>+ Add Conductor</button>
      </div>
      <div style={{overflowX:"auto",borderRadius:12,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:20}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr>{["Wire Size (AWG)","Insulation","Qty","Area/Wire (mm²)","Total Area (mm²)",""].map(h=>(
              <th key={h} style={thS}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {conductors.map((c,idx)=>{
              const area = CONDUCTOR_AREA[c.size]||0;
              const total = area * (+c.qty||1);
              return (
                <tr key={c.id} style={{background:idx%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
                  <td style={tdS}>
                    <Select value={c.size} onChange={e=>updC(c.id,"size",e.target.value)} style={{width:140}}>
                      {AWG_SIZES.map(s=><option key={s} value={s}>{s} AWG — {WIRE_DATA[s]?.ampacity}A</option>)}
                    </Select>
                  </td>
                  <td style={tdS}>
                    <Select value={c.type} onChange={e=>updC(c.id,"type",e.target.value)} style={{width:100}}>
                      <option value="THWN">THWN</option>
                      <option value="XHHW">XHHW</option>
                      <option value="THW">THW</option>
                      <option value="TW">TW</option>
                    </Select>
                  </td>
                  <td style={tdS}>
                    <Input type="number" value={c.qty} min={1} onChange={e=>updC(c.id,"qty",+e.target.value)} style={{width:70}}/>
                  </td>
                  <td style={{...tdS,fontFamily:"monospace",color:T.muted,textAlign:"right"}}>{area.toFixed(2)}</td>
                  <td style={{...tdS,fontFamily:"monospace",color:ACCENT,fontWeight:700,textAlign:"right"}}>{total.toFixed(2)}</td>
                  <td style={{...tdS,width:36,textAlign:"center"}}>
                    <button onClick={()=>remConductor(c.id)} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:T.danger,width:26,height:26,borderRadius:6,cursor:"pointer",fontSize:14,lineHeight:1}}>×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{background:T.dim,borderTop:`2px solid ${T.border}`}}>
              <td colSpan={3} style={{padding:"9px 12px",fontWeight:800,color:T.muted,fontSize:11}}>TOTAL</td>
              <td style={{padding:"9px 12px",fontFamily:"monospace",color:T.muted,textAlign:"right"}}>{(totalWireArea/Math.max(1,totalWires)).toFixed(2)} avg</td>
              <td style={{padding:"9px 12px",fontFamily:"monospace",color:ACCENT,fontWeight:800,textAlign:"right"}}>{totalWireArea.toFixed(2)} mm²</td>
              <td/>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* All conduit sizes comparison */}
      <Label>Conduit Size Comparison — {conduitType}</Label>
      <div style={{overflowX:"auto",marginTop:8}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{background:T.dim}}>
              {["Trade Size","Internal Area (mm²)","Wire Area (mm²)","Fill %","Status"].map(h=>(
                <th key={h} style={{padding:"9px 12px",color:T.muted,fontWeight:700,fontSize:11,textTransform:"uppercase",textAlign:"left",borderBottom:`1px solid ${T.border}`}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(CONDUIT_DATA[conduitType]||{}).map(([sz,data],idx)=>{
              const pct = data.area > 0 ? (totalWireArea/data.area*100) : 0;
              const isCurrent = sz === conduitSize;
              const fits = pct <= fillLimit;
              return (
                <tr key={sz} style={{background:isCurrent?"rgba(255,107,43,0.06)":"transparent",borderBottom:`1px solid ${T.border}`,cursor:"pointer"}}
                  onClick={()=>setConduitSize(sz)}>
                  <td style={{padding:"9px 12px",fontWeight:isCurrent?800:400,color:isCurrent?ACCENT:T.text}}>{isCurrent?"▶ ":""}{data.label}</td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",color:T.muted}}>{data.area.toFixed(1)}</td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",color:T.muted}}>{totalWireArea.toFixed(1)}</td>
                  <td style={{padding:"9px 12px",fontWeight:700,color:fits?T.success:T.danger,fontFamily:"monospace"}}>{pct.toFixed(1)}%</td>
                  <td style={{padding:"9px 12px"}}>
                    <span style={{fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20,background:fits?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",color:fits?T.success:T.danger}}>
                      {fits?"✓ FITS":"✗ OVERFILLED"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── WIRE AMPACITY DERATING ───────────────────────────────────────────────────

export default ConduitFillCalc;
