import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { WIRE_DATA, AWG_SIZES } from "./constants.jsx";
import { Card, Label, Input, Select } from "../../theme.jsx";
import { Stat } from "../../theme.jsx";
import VerifyHintBanner from "./VerifyHintBanner.jsx";

function PanelScheduleBuilder({ electricalData, calcState, onStateChange, verifyHint }) {
  const ACCENT = "#ff6b2b";
  const fmt = n => (+n||0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2});
  const fmtA = n => (+n||0).toFixed(1);

  const PHASES = ["A","B","C"];
  const CIRCUIT_TYPES = ["Lighting","Receptacle","HVAC/AC","Appliance","Motor","Spare","Space"];
  const VOLTAGES = [230,240,120,400];

  const ed   = electricalData?.panel || {};
  const init = calcState || {};
  const [panelName,   setPanelName]   = useState(init.panelName   ?? ed.panelName   ?? "LP-1");
  const [panelVolt,   setPanelVolt]   = useState(init.panelVolt   ?? ed.voltage     ?? 230);
  const [panelPhase,  setPanelPhase]  = useState(init.panelPhase  ?? (ed.phases===3?"3":"1"));
  const [mainBreaker, setMainBreaker] = useState(init.mainBreaker ?? ed.mainBreaker ?? 100);
  const [busRating,   setBusRating]   = useState(init.busRating   ?? ed.busRating   ?? 100);
  const [occupancy,   setOccupancy]   = useState(init.occupancy   ?? ed.occupancy   ?? "residential");
  const [showExport,  setShowExport]  = useState(false);
  const [fp, setFp] = useState({
    panelName: !!ed.panelName, voltage: !!ed.voltage, phases: !!ed.phases,
    mainBreaker: !!ed.mainBreaker, busRating: !!ed.busRating, circuits: !!(ed.circuits?.length),
  });
  useEffect(()=>{
    if(!ed||Object.keys(ed).length===0)return;
    const sN=(v,fb)=>{const n=+v;return isFinite(n)&&n>0?n:fb;};
    const TM={Lighting:"Lighting",Receptacle:"Receptacle","HVAC/AC":"HVAC/AC",Appliance:"Appliance",Motor:"Motor"};
    if(ed.panelName!=null){setPanelName(ed.panelName);setFp(p=>({...p,panelName:true}));}
    if(sN(ed.voltage,0)>0){setPanelVolt(sN(ed.voltage,230));setFp(p=>({...p,voltage:true}));}
    if(ed.phases!=null){setPanelPhase(+ed.phases===3?"3":"1");setFp(p=>({...p,phases:true}));}
    if(sN(ed.mainBreaker,0)>0){setMainBreaker(sN(ed.mainBreaker,100));setFp(p=>({...p,mainBreaker:true}));}
    if(sN(ed.busRating,0)>0){setBusRating(sN(ed.busRating,100));setFp(p=>({...p,busRating:true}));}
    if(ed.circuits?.length){const v=sN(ed.voltage,230);setCircuits(ed.circuits.filter(c=>c).map((c,i)=>{const va=sN(c.va||c.watts,0);return{id:i+1,num:i*2+1,phase:c.phase||PHASES[i%2]||"A",desc:c.desc||c.name||"",type:TM[c.type]||"Lighting",poles:sN(c.poles,1),va,amps:va/v,breaker:sN(c.breaker,20),wire:"12",notes:""};}))
;setFp(p=>({...p,circuits:true}));}
  },[electricalData]);
  useEffect(() => {
    if (onStateChange) onStateChange({ panelName, panelVolt, panelPhase, mainBreaker, busRating, occupancy, circuits });
  }, [panelName, panelVolt, panelPhase, mainBreaker, busRating, occupancy]);

  const makeCircuit = (id, phase="A") => ({
    id, num: id*2-1, phase,
    desc:"", type:"Lighting",
    poles:1, va:0, amps:0, breaker:20,
    wire: "12", notes:""
  });

  const [circuits, setCircuits] = useState([
    makeCircuit(1,"A"), makeCircuit(2,"B"), makeCircuit(3,"A"),
    makeCircuit(4,"B"), makeCircuit(5,"A"), makeCircuit(6,"B"),
  ]);

  const addRow = () => {
    const newId = circuits.length + 1;
    const phase = PHASES[(circuits.length) % (panelPhase==="3" ? 3 : 1 === 0 ? 1 : 2)];
    setCircuits(p => [...p, makeCircuit(newId, phase||"A")]);
  };
  const remRow = id => setCircuits(p => p.filter(c => c.id !== id));
  const upd    = (id, field, val) => setCircuits(p => p.map(c => c.id===id ? {...c,[field]:val} : c));

  // Auto-calc amps from VA
  const updVA = (id, va) => {
    const amps = panelVolt > 0 ? (va / panelVolt) : 0;
    setCircuits(p => p.map(c => c.id===id ? {...c, va:+va, amps:+fmtA(amps)} : c));
  };

  // Totals
  const totalVA     = circuits.reduce((s,c)=>s+(+c.va||0),0);
  const demandVA    = occupancy==="residential"
    ? (totalVA<=3000 ? totalVA : 3000 + (Math.min(totalVA,120000)-3000)*0.35 + Math.max(0,totalVA-120000)*0.25)
    : (totalVA<=10000 ? totalVA : 10000 + (totalVA-10000)*0.5);
  const totalAmps   = panelVolt > 0 ? demandVA / panelVolt : 0;
  const requiredMain = Math.ceil(totalAmps * 1.25 / 5) * 5;

  // Recommend wire for each breaker
  const recWire = (breaker) => {
    for (const s of AWG_SIZES) {
      if ((WIRE_DATA[s]?.ampacity||0) >= breaker) return s;
    }
    return "500+";
  };

  const phaseLoad = { A:0, B:0, C:0 };
  circuits.forEach(c => { phaseLoad[c.phase] = (phaseLoad[c.phase]||0) + (+c.va||0); });
  const maxLoad = Math.max(...Object.values(phaseLoad));
  const minLoad = Math.min(...Object.values(phaseLoad));
  const imbalance = maxLoad > 0 ? ((maxLoad - minLoad) / maxLoad * 100) : 0;

  const thS = { padding:"8px 10px", color:T.muted, fontWeight:700, fontSize:10,
    textTransform:"uppercase", textAlign:"left", borderBottom:`1px solid ${T.border}`,
    whiteSpace:"nowrap", background:T.dim };
  const tdS = { padding:"6px 8px", borderBottom:`1px solid ${T.border}`, verticalAlign:"middle" };
  const inS = { background:"#0a0f1a", border:`1px solid ${T.border}`, borderRadius:7,
    padding:"5px 8px", color:T.text, fontSize:12, outline:"none", width:"100%" };

  const exportSchedule = () => {
    const circRows = circuits.map(c=>`
      <tr>
        <td style="text-align:center;font-weight:700">${c.num}</td>
        <td style="text-align:center">${c.phase}</td>
        <td>${c.desc||"—"}</td>
        <td style="text-align:center">${c.type}</td>
        <td style="text-align:center">${c.poles}P</td>
        <td style="text-align:right;font-family:monospace">${(+c.va||0).toLocaleString()}</td>
        <td style="text-align:right;font-family:monospace">${fmtA(+c.amps||0)}</td>
        <td style="text-align:center;font-weight:700">${c.breaker}A</td>
        <td style="text-align:center">#${c.wire} AWG</td>
        <td style="font-size:11px">${c.notes||""}</td>
      </tr>`).join("");
    const w = window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>Panel Schedule — ${panelName}</title>
    <style>body{font-family:Arial,sans-serif;margin:32px;color:#111;font-size:12px}
    table{border-collapse:collapse;width:100%}
    th{background:#1e3a5f;color:#fff;padding:7px 8px;font-size:10px;text-align:center;border:1px solid #ccc}
    td{padding:6px 8px;border:1px solid #ddd;vertical-align:middle}
    tr:nth-child(even)td{background:#f9fafb}
    h2{color:#1e3a5f;margin:0 0 4px}
    .kv{display:inline-block;margin-right:20px;font-size:12px}
    .kv b{color:#1e3a5f}
    @media print{button{display:none}}</style></head><body>
    <button onclick="window.print()" style="float:right;padding:6px 16px;background:#1e3a5f;color:#fff;border:none;border-radius:5px;cursor:pointer">🖨️ Print</button>
    <h2>PANEL SCHEDULE — ${panelName}</h2>
    <div style="margin:8px 0 16px">
      <span class="kv"><b>Voltage:</b> ${panelVolt}V</span>
      <span class="kv"><b>Phase:</b> ${panelPhase}φ</span>
      <span class="kv"><b>Main Breaker:</b> ${mainBreaker}A</span>
      <span class="kv"><b>Bus Rating:</b> ${busRating}A</span>
      <span class="kv"><b>Total Connected:</b> ${totalVA.toLocaleString()} VA</span>
      <span class="kv"><b>Demand Load:</b> ${Math.round(demandVA).toLocaleString()} VA</span>
      <span class="kv"><b>Required Main:</b> ${requiredMain}A</span>
    </div>
    <table><thead><tr>
      <th>Ckt#</th><th>Phase</th><th>Circuit Description</th><th>Type</th>
      <th>Poles</th><th>VA</th><th>Amps</th><th>Breaker</th><th>Wire</th><th>Notes</th>
    </tr></thead><tbody>${circRows}</tbody>
    <tfoot><tr style="background:#1e3a5f;color:#fff">
      <td colspan="5" style="padding:8px;font-weight:700;color:#fff">TOTAL CONNECTED</td>
      <td style="text-align:right;font-family:monospace;font-weight:700;color:#fff">${totalVA.toLocaleString()} VA</td>
      <td style="text-align:right;font-family:monospace;color:#fff">${fmtA(totalVA/panelVolt)} A</td>
      <td colspan="3"></td>
    </tr></tfoot></table>
    <p style="margin-top:20px;font-size:10px;color:#9ca3af">PEC 2017 Art. 2.20 Demand Factor applied · PRELIMINARY — verify with licensed PEE · Buildify</p>
    </body></html>`);
    w.document.close(); setTimeout(()=>w.print(),300);
  };

  return (
    <div>
      <VerifyHintBanner hint={verifyHint}/>
      <p style={{color:T.muted,fontSize:13,margin:"0 0 20px"}}>
        Build a complete panel schedule per <strong style={{color:T.text}}>PEC 2017 Art. 2.20</strong>. VA auto-calculates amps. Export a print-ready schedule.
      </p>

      {/* Panel info */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:20}}>
        <div><Label>Panel Name / ID</Label>
          <input value={panelName} onChange={e=>setPanelName(e.target.value)}
            style={{...inS}} placeholder="LP-1"/></div>
        <div><Label>System Voltage</Label>
          <Select value={panelVolt} onChange={e=>setPanelVolt(+e.target.value)}>
            {VOLTAGES.map(v=><option key={v} value={v}>{v}V</option>)}
          </Select></div>
        <div><Label>Phase</Label>
          <Select value={panelPhase} onChange={e=>setPanelPhase(e.target.value)}>
            <option value="1">Single Phase (1φ)</option>
            <option value="3">Three Phase (3φ)</option>
          </Select></div>
        <div><Label>Main Breaker (A)</Label>
          <Input type="number" value={mainBreaker} min={15} onChange={e=>setMainBreaker(+e.target.value)}/></div>
        <div><Label>Bus Rating (A)</Label>
          <Input type="number" value={busRating} min={15} onChange={e=>setBusRating(+e.target.value)}/></div>
        <div><Label>Occupancy</Label>
          <Select value={occupancy} onChange={e=>setOccupancy(e.target.value)}>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
          </Select></div>
      </div>

      {/* Summary KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginBottom:20}}>
        <Stat label="Connected Load"  value={(totalVA/1000).toFixed(2)+" kVA"} sub={totalVA.toLocaleString()+" VA"}/>
        <Stat label="Demand Load"     value={(demandVA/1000).toFixed(2)+" kVA"} sub="PEC Art. 2.20"/>
        <Stat label="Design Current"  value={fmtA(totalAmps)+" A"} sub={`at ${panelVolt}V`}/>
        <Stat label="Required Main"   value={requiredMain+" A"} sub="125% × demand" accent={requiredMain > mainBreaker}/>
        <div style={{background:imbalance>10?T.dim:"rgba(34,197,94,0.07)",border:`1.5px solid ${imbalance>10?T.border:"rgba(34,197,94,0.2)"}`,borderRadius:12,padding:"16px 18px"}}>
          <Label>Phase Imbalance</Label>
          <div style={{fontSize:22,fontWeight:800,color:imbalance>10?T.warn:T.success}}>{imbalance.toFixed(1)}%</div>
          <div style={{fontSize:11,color:T.muted}}>{imbalance>10?"⚠️ Rebalance loads":"✓ Balanced"}</div>
        </div>
        {panelPhase==="3" && (
          <div style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 18px"}}>
            <Label>Phase Loads (VA)</Label>
            {Object.entries(phaseLoad).map(([ph,va])=>(
              <div key={ph} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginTop:4}}>
                <span style={{color:T.muted,fontWeight:700}}>Phase {ph}</span>
                <span style={{fontFamily:"monospace",color:T.text}}>{(+va||0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warnings */}
      {requiredMain > mainBreaker && (
        <div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:T.danger}}>
          ⚠️ <strong>Main breaker undersized.</strong> Demand load requires at least {requiredMain}A main — current setting is {mainBreaker}A.
        </div>
      )}
      {requiredMain > busRating && (
        <div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:T.danger}}>
          ⚠️ <strong>Bus rating exceeded.</strong> Demand current ({fmtA(totalAmps)}A) exceeds bus rating ({busRating}A).
        </div>
      )}

      {/* Circuit table */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <Label>Circuit Schedule ({circuits.length} circuits)</Label>
        <div style={{display:"flex",gap:8}}>
          <button onClick={addRow} style={{padding:"6px 14px",borderRadius:8,border:`1.5px dashed ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>+ Add Circuit</button>
          <button onClick={exportSchedule} style={{padding:"6px 14px",borderRadius:8,border:"none",background:`linear-gradient(135deg,${ACCENT},#e85520)`,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700}}>📄 Export Schedule</button>
        </div>
      </div>
      <div style={{overflowX:"auto",borderRadius:12,border:`1px solid ${T.border}`,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr>
              {["Ckt #","Ph","Description","Type","Poles","VA","Amps","Breaker","Wire (Auto)","Notes",""].map(h=>(
                <th key={h} style={thS}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {circuits.map((c,idx)=>(
              <tr key={c.id} style={{background:idx%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
                <td style={{...tdS,textAlign:"center",fontWeight:700,color:ACCENT,width:40}}>{c.num}</td>
                <td style={{...tdS,width:50}}>
                  <Select value={c.phase} onChange={e=>upd(c.id,"phase",e.target.value)} style={{width:54,padding:"4px 6px",fontSize:11}}>
                    {PHASES.map(ph=><option key={ph} value={ph}>{ph}</option>)}
                  </Select>
                </td>
                <td style={{...tdS,minWidth:160}}>
                  <input value={c.desc} onChange={e=>upd(c.id,"desc",e.target.value)}
                    placeholder="e.g. Bedroom lights" style={{...inS,fontSize:12}}/>
                </td>
                <td style={{...tdS,width:110}}>
                  <Select value={c.type} onChange={e=>upd(c.id,"type",e.target.value)} style={{width:"100%",padding:"4px 6px",fontSize:11}}>
                    {CIRCUIT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </Select>
                </td>
                <td style={{...tdS,width:60}}>
                  <Select value={c.poles} onChange={e=>upd(c.id,"poles",+e.target.value)} style={{width:54,padding:"4px 6px",fontSize:11}}>
                    <option value={1}>1P</option>
                    <option value={2}>2P</option>
                    <option value={3}>3P</option>
                  </Select>
                </td>
                <td style={{...tdS,width:90}}>
                  <input type="number" value={c.va||""} min={0}
                    onChange={e=>updVA(c.id,e.target.value)}
                    placeholder="VA" style={{...inS,textAlign:"right"}}/>
                </td>
                <td style={{...tdS,width:70,fontFamily:"monospace",textAlign:"right",color:T.accent}}>
                  {fmtA(+c.amps||0)}
                </td>
                <td style={{...tdS,width:80}}>
                  <Select value={c.breaker} onChange={e=>upd(c.id,"breaker",+e.target.value)} style={{width:"100%",padding:"4px 6px",fontSize:11}}>
                    {[15,20,30,40,50,60,70,80,100,125,150,200].map(b=><option key={b} value={b}>{b}A</option>)}
                  </Select>
                </td>
                <td style={{...tdS,width:90,textAlign:"center"}}>
                  <span style={{fontSize:11,fontWeight:700,color:T.muted,background:T.dim,padding:"2px 8px",borderRadius:5}}>
                    #{recWire(c.breaker)} AWG
                  </span>
                </td>
                <td style={{...tdS,minWidth:120}}>
                  <input value={c.notes} onChange={e=>upd(c.id,"notes",e.target.value)}
                    placeholder="Notes…" style={{...inS,fontSize:11}}/>
                </td>
                <td style={{...tdS,width:36,textAlign:"center"}}>
                  <button onClick={()=>remRow(c.id)} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:T.danger,width:26,height:26,borderRadius:6,cursor:"pointer",fontSize:14,lineHeight:1}}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{background:T.dim,borderTop:`2px solid ${T.border}`}}>
              <td colSpan={5} style={{padding:"9px 10px",fontWeight:800,color:T.muted,fontSize:11}}>TOTAL CONNECTED</td>
              <td style={{padding:"9px 10px",fontWeight:800,color:ACCENT,fontSize:13,fontFamily:"monospace",textAlign:"right"}}>{totalVA.toLocaleString()} VA</td>
              <td style={{padding:"9px 10px",fontFamily:"monospace",color:T.text,textAlign:"right"}}>{fmtA(totalVA/panelVolt)}</td>
              <td colSpan={4}/>
            </tr>
          </tfoot>
        </table>
      </div>
      <div style={{marginTop:12,fontSize:11,color:T.muted}}>
        💡 Wire size is auto-recommended per breaker rating. Verify insulation type and derating factors for final design.
      </div>
    </div>
  );
}

// ─── CONDUIT FILL CALCULATOR ─────────────────────────────────────────────────

export default PanelScheduleBuilder;
