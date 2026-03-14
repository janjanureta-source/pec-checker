import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { addHistoryEntry } from "../../utils/history.js";
import PlumbingChecker from "./PlumbingChecker.jsx";
import FixtureUnitCalc from "./FixtureUnitCalc.jsx";
import PipeSizing from "./PipeSizing.jsx";
import SepticTankSizing from "./SepticTankSizing.jsx";
import WaterDemandCalc from "./WaterDemandCalc.jsx";
import PressureLoss from "./PressureLoss.jsx";
import StormDrainage from "./StormDrainage.jsx";
import { Card, Label } from "../../theme.jsx";
import { SC } from "./constants.jsx";

function SaniCode({ apiKey, sessionTick=0 }) {
  const [tool,          setTool]          = useState("checker");
  const [checkerResult, setCheckerResult] = useState(null);

  // ── Restore session on mount AND on navigation from history ──
  const _loadSaniSession = () => {
    try {
      const s = JSON.parse(localStorage.getItem("buildify_session_sanitary") || "null");
      if (!s?.checkerResult?.summary?.projectName) return;
      setCheckerResult(s.checkerResult);
      if (s._tool) setTool(s._tool);
    } catch {}
  };
  useEffect(() => { _loadSaniSession(); }, []); // eslint-disable-line
  useEffect(() => { if (sessionTick > 0) _loadSaniSession(); }, [sessionTick]); // eslint-disable-line

  const TOOLS=[
    {key:"checker",  icon:"🤖", label:"AI Plan Checker"},
    {key:"fixture",  icon:"🚰", label:"Fixture Units"},
    {key:"pipe",     icon:"📏", label:"Pipe Sizing"},
    {key:"septic",   icon:"🪣", label:"Septic Tank"},
    {key:"water",    icon:"water", label:"Water Demand"},
    {key:"pressure", icon:"⬆️", label:"Pressure Loss"},
    {key:"storm",    icon:"🌊", label:"Storm Drainage"},
  ];
  return (
    <div>
      <div style={{display:"flex",gap:6,marginBottom:24,flexWrap:"wrap",paddingBottom:16,borderBottom:`1px solid ${T.border}`,alignItems:"center"}}>
        <div style={{display:"flex",gap:6,flex:1,flexWrap:"wrap"}}>
        {TOOLS.map(t=><button key={t.key} onClick={()=>setTool(t.key)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,border:`1.5px solid ${tool===t.key?SC:T.border}`,background:tool===t.key?`rgba(16,185,129,0.12)`:"transparent",color:tool===t.key?SC:T.muted,cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.15s"}}><Icon name={t.icon||"report"} size={13} color={tool===t.key?"#0696d7":T.muted}/><span>{t.label}</span></button>)}
        </div>
        {checkerResult && (
          <button onClick={()=>{
            setCheckerResult(null); setTool("checker");
            // Session stays in localStorage so history cards can reopen it
          }}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:9,
              border:"1.5px solid rgba(6,182,212,0.3)",background:"rgba(6,182,212,0.07)",
              color:"#06b6d4",cursor:"pointer",fontSize:12,fontWeight:700,flexShrink:0}}>
            <Icon name="plus" size={13} color="#06b6d4"/> New Review
          </button>
        )}
      </div>
      {tool==="checker"  && <PlumbingChecker apiKey={apiKey}/>}
      {tool==="fixture"  && <FixtureUnitCalc/>}
      {tool==="pipe"     && <PipeSizing/>}
      {tool==="septic"   && <SepticTankSizing/>}
      {tool==="water"    && <WaterDemandCalc/>}
      {tool==="pressure" && <PressureLoss/>}
      {tool==="storm"    && <StormDrainage/>}
    </div>
  );
}


// ─── HISTORY SYSTEM ──────────────────────────────────────────────────────────
// ─── DB ABSTRACTION LAYER ─────────────────────────────────────────────────────
// All persistence goes through DB.*  — swap internals for Supabase later,
// zero changes needed anywhere else in the app.
// ─────────────────────────────────────────────────────────────────────────────
const HISTORY_KEY  = "buildify_history";
const SESSION_KEYS = {
  structural:  "buildify_session_structural",
  electrical:  "buildify_session_electrical",
  sanitary:    "buildify_session_sanitary",
  engtools:    "buildify_session_engtools",
};

export default SaniCode;
