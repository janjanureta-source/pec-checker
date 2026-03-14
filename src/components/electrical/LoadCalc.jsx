import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { WIRE_DATA, AWG_SIZES, DEMAND_FACTORS, calcDemand, APPLIANCE_CATEGORIES, APPLIANCE_MAP, CUSTOM_OPTION } from "./constants.jsx";
import { Card, Label, Input, Select, Stat } from "../../theme.jsx";

function LoadCalc({ electricalData, calcState, onStateChange, verifyHint }) {
  const ed = electricalData?.loadCalc || {};
  const init = calcState || {};
  const defaultLoads = [
    { id:1, name:"LED Bulb (15W)",           watts:15,  pct:100 },
    { id:2, name:"General Receptacle Outlet",watts:180, pct:100 },
    { id:3, name:"Split-Type AC 1HP",        watts:900, pct:80  },
    { id:4, name:"Refrigerator (Medium)",    watts:150, pct:100 },
    { id:5, name:"LED TV 43\"",              watts:80,  pct:60  },
  ];
  const [occupancy,    setOccupancy]    = useState(init.occupancy ?? ed.occupancy ?? "residential");
  const [voltage,      setVoltage]      = useState(init.voltage   ?? ed.voltage   ?? 230);
  const [showPicker,   setShowPicker]   = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [fp, setFp] = useState({ occupancy: !!ed.occupancy, voltage: !!ed.voltage, loads: !!(ed.loads?.length) });
  const buildLoads = (raw) => raw.filter(l=>l&&(+(l.watts||0)>0||l.name)).map((l,i) => ({
    id: i+1, name: l.name||"Custom Load", watts: +(l.watts||0), pct: +(l.pct||100), qty: +(l.qty||1),
  }));
  const [loads, setLoads] = useState(() =>
    init.loads ? init.loads : (ed.loads?.length ? buildLoads(ed.loads) : defaultLoads)
  );
  useEffect(() => {
    if (!ed || Object.keys(ed).length === 0) return;
    if (ed.occupancy != null) { setOccupancy(ed.occupancy); setFp(p=>({...p,occupancy:true})); }
    if (ed.voltage   != null) { setVoltage(+ed.voltage);    setFp(p=>({...p,voltage:true})); }
    if (ed.loads?.length)     { setLoads(buildLoads(ed.loads)); setFp(p=>({...p,loads:true})); }
  }, [electricalData]);
  useEffect(() => {
    if (onStateChange) onStateChange({ occupancy, voltage, loads });
  }, [occupancy, voltage, loads]);

  const remLoad  = id => setLoads(p => p.filter(l => l.id !== id));
  const upd      = (id, f, v) => setLoads(p => p.map(l => l.id === id ? { ...l, [f]: v } : l));

  // When dropdown changes, auto-fill watts & pct if it's a known appliance
  const handleNameChange = (id, newName) => {
    const preset = APPLIANCE_MAP[newName];
    if (preset && newName !== CUSTOM_OPTION) {
      setLoads(p => p.map(l => l.id === id ? { ...l, name: newName, watts: preset.watts, pct: preset.pct } : l));
    } else {
      setLoads(p => p.map(l => l.id === id ? { ...l, name: newName } : l));
    }
  };

  const addFromPicker = (item) => {
    setLoads(p => [...p, { id: Date.now(), name: item.name, watts: item.watts, pct: item.pct, qty: 1 }]);
    setShowPicker(false);
    setPickerSearch("");
  };

  const addBlankLoad = () => {
    setLoads(p => [...p, { id: Date.now(), name: CUSTOM_OPTION, watts: 100, pct: 100, qty: 1 }]);
  };

  const totalVA  = loads.reduce((s, l) => s + (l.qty||1) * l.watts * (l.pct / 100), 0);
  const demandVA = calcDemand(totalVA, occupancy);
  const currentA = demandVA / voltage;
  const serviceA = Math.ceil(currentA * 1.25 / 5) * 5;
  const recWire  = () => { for (const s of AWG_SIZES) { if ((WIRE_DATA[s]?.ampacity||0) >= serviceA) return s; } return "500+"; };

  // Filtered appliances for picker
  const filteredCats = pickerSearch.trim()
    ? [{ category: "Search Results", items: Object.entries(APPLIANCE_MAP).filter(([n]) => n.toLowerCase().includes(pickerSearch.toLowerCase())).map(([name, v]) => ({ name, ...v })) }]
    : APPLIANCE_CATEGORIES;

  const thStyle = { padding:"10px 12px", color:T.muted, fontWeight:700, fontSize:11, textTransform:"uppercase", textAlign:"left", borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap" };
  const tdStyle = { padding:"6px 8px", borderBottom:`1px solid ${T.border}`, verticalAlign:"middle" };

  return (
    <div>
      <p style={{ color:T.muted, fontSize:13, margin:"0 0 6px" }}>
        PEC 2017 Art. 2.20 demand factor method · Watts/unit and demand % are pre-filled from typical averages but fully editable.
      </p>

      {/* Top controls */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
        <div><Label>Occupancy Type</Label>
          <Select value={occupancy} onChange={e => setOccupancy(e.target.value)}>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
          </Select>
        </div>
        <div><Label>Supply Voltage</Label>
          <Select value={voltage} onChange={e => setVoltage(+e.target.value)}>
            <option value={230}>230 V (1φ)</option>
            <option value={400}>400 V (3φ)</option>
          </Select>
        </div>
      </div>

      {/* Load table */}
      <div style={{ overflowX:"auto", marginBottom:14, borderRadius:12, border:`1px solid ${T.border}`, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ background:T.dim }}>
              <th style={{ ...thStyle, minWidth:220 }}>Appliance / Load</th>
              <th style={{ ...thStyle, width:70 }}>Qty</th>
              <th style={{ ...thStyle, width:110 }}>Watts/Unit</th>
              <th style={{ ...thStyle, width:100 }}>Demand %</th>
              <th style={{ ...thStyle, width:100 }}>Total VA</th>
              <th style={{ ...thStyle, width:44 }}></th>
            </tr>
          </thead>
          <tbody>
            {loads.map((l, idx) => {
              const rowVA = (l.qty||1) * l.watts * (l.pct / 100);
              const isEven = idx % 2 === 0;
              return (
                <tr key={l.id} style={{ background: isEven ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  {/* Appliance dropdown */}
                  <td style={tdStyle}>
                    <select
                      value={l.name}
                      onChange={e => handleNameChange(l.id, e.target.value)}
                      style={{
                        width:"100%", background:"#0f1117", border:`1.5px solid ${T.border}`,
                        borderRadius:8, padding:"7px 10px", color:T.text, fontSize:13,
                        outline:"none", cursor:"pointer"
                      }}
                    >
                      {/* Show current name if custom typed */}
                      {!APPLIANCE_MAP[l.name] && <option value={l.name}>{l.name||"— Select appliance —"}</option>}
                      {APPLIANCE_CATEGORIES.map(cat => (
                        <optgroup key={cat.category} label={cat.category}>
                          {cat.items.map(item => (
                            <option key={item.name} value={item.name}>{item.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </td>
                  {/* Qty */}
                  <td style={tdStyle}>
                    <input
                      type="number" value={l.qty||1} min={1}
                      onChange={e => upd(l.id, "qty", +e.target.value)}
                      style={{ width:"100%", background:"#0f1117", border:`1.5px solid ${T.border}`, borderRadius:8, padding:"7px 8px", color:T.text, fontSize:13, outline:"none", textAlign:"center" }}
                    />
                  </td>
                  {/* Watts - editable */}
                  <td style={tdStyle}>
                    <div style={{ position:"relative" }}>
                      <input
                        type="number" value={l.watts} min={0}
                        onChange={e => upd(l.id, "watts", +e.target.value)}
                        style={{ width:"100%", background:"#0f1117", border:`1.5px solid ${T.border}`, borderRadius:8, padding:"7px 8px 7px 8px", color:T.text, fontSize:13, outline:"none" }}
                      />
                      <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:10, color:T.muted, pointerEvents:"none" }}>W</span>
                    </div>
                  </td>
                  {/* Demand % - editable */}
                  <td style={tdStyle}>
                    <div style={{ position:"relative" }}>
                      <input
                        type="number" value={l.pct} min={0} max={100}
                        onChange={e => upd(l.id, "pct", +e.target.value)}
                        style={{ width:"100%", background:"#0f1117", border:`1.5px solid ${T.border}`, borderRadius:8, padding:"7px 8px", color:T.text, fontSize:13, outline:"none" }}
                      />
                      <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:10, color:T.muted, pointerEvents:"none" }}>%</span>
                    </div>
                  </td>
                  {/* Total VA */}
                  <td style={{ ...tdStyle, fontWeight:700, color: rowVA > 2000 ? T.warn : T.accent, fontFamily:"monospace", whiteSpace:"nowrap" }}>
                    {rowVA.toFixed(0)} VA
                  </td>
                  {/* Remove */}
                  <td style={{ ...tdStyle, textAlign:"center" }}>
                    <button onClick={() => remLoad(l.id)} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:T.danger, width:28, height:28, borderRadius:7, cursor:"pointer", fontSize:15, lineHeight:1 }}>×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Footer totals row */}
          <tfoot>
            <tr style={{ background:T.dim, borderTop:`2px solid ${T.border}` }}>
              <td colSpan={4} style={{ padding:"10px 12px", fontWeight:700, color:T.muted, fontSize:12 }}>TOTAL CONNECTED LOAD</td>
              <td colSpan={2} style={{ padding:"10px 12px", fontWeight:800, color:T.accent, fontSize:14, fontFamily:"monospace" }}>{totalVA.toFixed(0)} VA</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add buttons */}
      <div style={{ display:"flex", gap:10, marginBottom:24, flexWrap:"wrap" }}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          style={{ display:"flex", alignItems:"center", gap:8, background:showPicker?T.accentDim:"transparent", border:`1.5px solid ${showPicker?T.accent:T.border}`, color:showPicker?T.accent:T.muted, padding:"8px 18px", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:600, transition:"all 0.15s" }}
        >
          🔍 Browse Appliances
        </button>
        <button
          onClick={addBlankLoad}
          style={{ display:"flex", alignItems:"center", gap:8, background:"transparent", border:`1.5px dashed ${T.border}`, color:T.muted, padding:"8px 18px", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:600 }}
        >
          + Add Custom Load
        </button>
      </div>

      {/* Appliance Picker Panel */}
      {showPicker && (
        <div style={{ background:T.dim, border:`1.5px solid ${T.border}`, borderRadius:14, padding:20, marginBottom:24, animation:"fadeIn 0.2s ease" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ fontWeight:700, fontSize:14, color:T.text }}>🔌 Appliance Library</div>
            <button onClick={() => { setShowPicker(false); setPickerSearch(""); }} style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, color:T.muted, padding:"4px 12px", borderRadius:6, cursor:"pointer", fontSize:12 }}>✕ Close</button>
          </div>
          {/* Search */}
          <input
            value={pickerSearch}
            onChange={e => setPickerSearch(e.target.value)}
            placeholder="🔍  Search appliances (e.g. aircon, ref, TV…)"
            style={{ width:"100%", background:"#0f1117", border:`1.5px solid ${T.border}`, borderRadius:10, padding:"9px 14px", color:T.text, fontSize:13, outline:"none", marginBottom:16 }}
            onFocus={e => e.target.style.borderColor = T.accent}
            onBlur={e => e.target.style.borderColor = T.border}
            autoFocus
          />
          {/* Category grid */}
          <div style={{ maxHeight:340, overflowY:"auto", paddingRight:4 }}>
            {filteredCats.filter(c => c.items.length > 0).map(cat => (
              <div key={cat.category} style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.muted, letterSpacing:"0.6px", textTransform:"uppercase", marginBottom:8, padding:"0 2px" }}>{cat.category}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {cat.items.map(item => (
                    <button
                      key={item.name}
                      onClick={() => addFromPicker(item)}
                      style={{
                        background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`,
                        borderRadius:8, padding:"7px 12px", cursor:"pointer", textAlign:"left",
                        transition:"all 0.12s", color:T.text
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.accentDim; e.currentTarget.style.borderColor = T.accent; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = T.border; }}
                    >
                      <div style={{ fontSize:12, fontWeight:600, color:T.text, whiteSpace:"nowrap" }}>{item.name}</div>
                      <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{item.watts}W · {item.pct}% demand</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filteredCats.every(c => c.items.length === 0) && (
              <div style={{ textAlign:"center", padding:"20px 0", color:T.muted, fontSize:13 }}>No appliances found. Use "+ Add Custom Load" instead.</div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(170px, 1fr))", gap:12 }}>
        <Stat label="Total Connected Load" value={(totalVA/1000).toFixed(2)+" kVA"} sub={totalVA.toFixed(0)+" VA total"}/>
        <Stat label="Demand Load (PEC)" value={(demandVA/1000).toFixed(2)+" kVA"} sub={occupancy+" demand factor"}/>
        <Stat label="Design Current" value={currentA.toFixed(1)+" A"} sub={`at ${voltage}V`}/>
        <Stat label="Min. Service Breaker" value={serviceA+" A"} sub="125% × design current"/>
        <Stat label="Min. Wire Size" value={recWire()+" AWG"} sub="Cu, 75°C, conduit" accent/>
      </div>

      {/* Demand breakdown note */}
      <div style={{ marginTop:16, padding:"12px 16px", background:"rgba(59,130,246,0.07)", border:"1px solid rgba(59,130,246,0.18)", borderRadius:10, fontSize:12, color:T.muted, lineHeight:1.7 }}>
        <strong style={{ color:T.info }}>ℹ️ Demand Factor Applied (PEC Art. 2.20):</strong>
        {occupancy==="residential"
          ? " First 3,000 VA @ 100% · Next 117,000 VA @ 35% · Remainder @ 25%"
          : " First 10,000 VA @ 100% · Remainder @ 50%"}
        <br/>
        <span style={{ fontSize:11 }}>Watts/unit and Demand% values are typical averages. Adjust them to match your actual equipment nameplate ratings.</span>
      </div>
    </div>
  );
}

// Shown at top of any AI checker when no API key is set

export default LoadCalc;
