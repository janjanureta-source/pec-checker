import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { addHistoryEntry } from "../../utils/history.js";
import StructuralChecker from "./StructuralChecker.jsx";
import SeismicCalc from "./SeismicCalc.jsx";
import BeamDesign from "./BeamDesign.jsx";
import ColumnDesign from "./ColumnDesign.jsx";
import FootingDesign from "./FootingDesign.jsx";
import SlabDesign from "./SlabDesign.jsx";
import LoadCombinations from "./LoadCombinations.jsx";
import runAllComputations from "./runAllComputations.js";
import StructuralIntelligencePanel from "./StructuralIntelligencePanel.jsx";
import StructuralComputationSummary from "./StructuralComputationSummary.jsx";
import RebarSchedule from "./RebarSchedule.jsx";
import SubToolHeader from "./SubToolHeader.jsx";
import { Card, Label } from "../../theme.jsx";

function StructiCode({ apiKey, initialTool, sessionTick=0 }) {
  // ── Top-level 3 tools ──
  const [tab, setTab] = useState("checker");
  useEffect(()=>{ if(initialTool && initialTool !== "bom" && initialTool !== "estimate") setTab(initialTool); },[initialTool]);

  // ── Structural data (lives here, never lost on tool switch) ──
  const [structuralData, setStructuralData]       = useState(null);
  // ── Plan Checker results — lifted here so they survive sub-tool navigation ──
  const [checkerResult,     setCheckerResult]     = useState(null);
  const [checkerExtracted,  setCheckerExtracted]  = useState(null);
  const [structuralResults, setStructuralResults] = useState(null);
  const [runState,          setRunState]          = useState(null);

  // ── Sub-tool inside Plan Checker ──
  const [subTool, setSubTool] = useState(null);

  // ── Restore session on mount AND whenever navigated to from a history card ──
  useEffect(() => {
    if (sessionTick === 0) return; // 0 = initial mount already handled below
    try {
      const s = JSON.parse(localStorage.getItem("buildify_session_structural") || "null");
      if (!s?.checkerResult?.summary?.projectName) return;
      setCheckerResult(s.checkerResult);
      if (s.checkerExtracted?.building) { setCheckerExtracted(s.checkerExtracted); setStructuralData(s.checkerExtracted); }
      if (s.structuralResults?.items)   setStructuralResults(s.structuralResults);
      if (s.runState)                   setRunState(s.runState);
    } catch {}
  }, [sessionTick]); // eslint-disable-line

  // ── Also restore on first mount (tick=0) ──
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("buildify_session_structural") || "null");
      if (!s?.checkerResult?.summary?.projectName) return;
      setCheckerResult(s.checkerResult);
      if (s.checkerExtracted?.building) { setCheckerExtracted(s.checkerExtracted); setStructuralData(s.checkerExtracted); }
      if (s.structuralResults?.items)   setStructuralResults(s.structuralResults);
      if (s.runState)                   setRunState(s.runState);
    } catch {}
  }, []); // eslint-disable-line

  const handleDataExtracted = (d) => {
    setStructuralData(d);
    setCheckerExtracted(d);
    setStructuralResults(null);
    setRunState(null);
    // Persist structuralData so session restore can show Intelligence Panel
    try {
      const cur = JSON.parse(localStorage.getItem("buildify_session_structural") || "{}");
      localStorage.setItem("buildify_session_structural", JSON.stringify({ ...cur, checkerExtracted: d }));
    } catch {}
  };

  const handleRunAll = async () => {
    if (!structuralData) return;
    setRunState({ running: true });
    setStructuralResults(null);
    await new Promise(r => setTimeout(r, 80));
    const results = runAllComputations(structuralData);
    setStructuralResults(results);
    setRunState({ running: false, summary: results.summary });
    // Persist structuralResults so session restore shows full computation package
    try {
      const cur = JSON.parse(localStorage.getItem("buildify_session_structural") || "{}");
      localStorage.setItem("buildify_session_structural", JSON.stringify({
        ...cur, structuralResults: results, runState: { running: false, summary: results.summary }
      }));
    } catch {}
  };

  const handleClear = () => {
    setStructuralData(null);
    setCheckerResult(null);
    setCheckerExtracted(null);
    setStructuralResults(null);
    setRunState(null);
    setSubTool(null);
  };

  // Sub-tool definitions
  const SUB_TOOLS = [
    { key:"seismic", icon:"seismic", label:"Seismic Load",       code:"NSCP Sec. 208" },
    { key:"beam",    icon:"beam",    label:"Beam Design",         code:"NSCP Sec. 406" },
    { key:"column",  icon:"column",  label:"Column Design",       code:"NSCP Sec. 410" },
    { key:"footing", icon:"footing", label:"Footing Design",      code:"NSCP Sec. 415" },
    { key:"slab",    icon:"slab",    label:"Slab Design",         code:"NSCP Sec. 409" },
    { key:"loads",   icon:"loads",   label:"Load Combinations",   code:"NSCP Sec. 203" },
    { key:"rebar",   icon:"report",  label:"Rebar Schedule",      code:"NSCP / PNS 49", noDataCheck:true },
  ];

  // Which sub-tools have extracted data
  const hasData = (key) => {
    if (!structuralData) return false;
    if (key==="seismic") return !!(structuralData.seismic?.zone||structuralData.seismic?.seismicWeight);
    if (key==="beam")    return !!(structuralData.beams?.length);
    if (key==="column")  return !!(structuralData.columns?.length);
    if (key==="footing") return !!(structuralData.footings?.length);
    if (key==="slab")    return !!(structuralData.slabs?.length);
    if (key==="loads")   return !!(structuralData.loads?.floorDL);
    if (key==="rebar")   return !!(structuralResults); // rebar needs computed results
    return false;
  };

  // Which sub-tools have computed results
  const getResult = (key) => {
    if (!structuralResults) return null;
    return structuralResults.items.filter(i=>i.tool===key);
  };

  const MAIN_TABS = [
    { key:"checker",  icon:"checker",  label:"AI Plan Checker" },
  ];

  const SubToolStatus = ({ toolKey }) => {
    const items = getResult(toolKey);
    const hasDat = hasData(toolKey);
    if (items && items.length > 0) {
      const anyUnverifiable = items.some(i=>i.status==="INCOMPLETE"||i.status==="NO DATA");
      const allUnverifiable = items.every(i=>i.status==="NO DATA");
      const allPass  = items.every(i=>i.status==="PASS"||i.status==="COMPUTED");
      const anyFail  = items.some(i=>i.status==="FAIL");
      // Check if there's extracted data even though computation couldn't verify
      const hasPartialData = hasDat && anyUnverifiable;
      // Priority: FAIL > INCOMPLETE (has data but can't compute) > NO DATA (nothing at all) > PASS
      let bg, color, border, label;
      if (anyFail) {
        bg="rgba(239,68,68,0.12)"; color="#ef4444"; border="rgba(239,68,68,0.25)"; label="✗ FAIL";
      } else if (anyUnverifiable && hasPartialData) {
        bg="rgba(245,158,11,0.12)"; color="#f59e0b"; border="rgba(245,158,11,0.25)"; label="⚠ INCOMPLETE";
      } else if (anyUnverifiable && !hasPartialData) {
        bg="rgba(245,158,11,0.12)"; color="#f59e0b"; border="rgba(245,158,11,0.25)"; label="? NO DATA";
      } else if (allPass) {
        bg="rgba(34,197,94,0.12)"; color="#22c55e"; border="rgba(34,197,94,0.25)"; label="✓";
      } else {
        bg="rgba(6,150,215,0.12)"; color="#0696d7"; border="rgba(6,150,215,0.25)"; label="✓";
      }
      return (
        <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:8,
          background:bg, color:color, border:`1px solid ${border}`}}>
          {label}
        </span>
      );
    }
    if (hasDat) return <span style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",display:"inline-block",boxShadow:"0 0 4px #22c55e",marginLeft:4}}/>;
    return <span style={{width:7,height:7,borderRadius:"50%",background:T.muted,display:"inline-block",opacity:0.3,marginLeft:4}}/>;
  };

  const handleNewReview = () => {
    setCheckerResult(null);
    setCheckerExtracted(null);
    setStructuralData(null);
    setStructuralResults(null);
    setRunState(null);
    setSubTool(null);
    setTab("checker");
    // Note: session stays in localStorage so history cards can still reopen it
  };

  return (
    <div>
      {/* ── 3 Main Tabs ── */}
      <div style={{display:"flex",gap:8,marginBottom:24,paddingBottom:16,borderBottom:`1px solid ${T.border}`,alignItems:"center"}}>
        <div style={{display:"flex",gap:8,flex:1,flexWrap:"wrap"}}>
          {MAIN_TABS.map(t=>(
            <button key={t.key} onClick={()=>{ setTab(t.key); setSubTool(null); }}
              style={{display:"flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:10,
                border:`1.5px solid ${tab===t.key?"#0696d7":T.border}`,
                background:tab===t.key?"rgba(6,150,215,0.12)":"transparent",
                color:tab===t.key?"#0696d7":T.muted,
                cursor:"pointer",fontSize:13,fontWeight:700,transition:"all 0.15s"}}>
              <Icon name={t.icon||"report"} size={15} color={tab===t.key?"#0696d7":T.muted}/>
              <span>{t.label}</span>
              {t.badge && <span style={{fontSize:9,background:"rgba(245,158,11,0.2)",color:"#f59e0b",padding:"1px 5px",borderRadius:4,fontWeight:800}}>{t.badge}</span>}
            </button>
          ))}
        </div>
        {checkerResult && (
          <button onClick={handleNewReview}
            title="Clear session and start a new review"
            style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,
              border:`1.5px solid rgba(239,68,68,0.3)`,background:"rgba(239,68,68,0.07)",
              color:"#ef4444",cursor:"pointer",fontSize:12,fontWeight:700,flexShrink:0,
              transition:"all 0.15s"}}>
            <Icon name="plus" size={13} color="#ef4444"/>
            New Review
          </button>
        )}
      </div>

      {/* ── AI Plan Checker (main tab with embedded sub-tools) ── */}
      {tab==="checker" && (
        <div>
          {/* ── Analysis result persists: always mounted, shown/hidden cleanly ── */}
          <div style={{display: subTool===null ? "block" : "none"}}>
            {/* Compact data strip — shown only when structuralData exists */}
            {structuralData && (
              <StructuralIntelligencePanel
                data={structuralData}
                onUpdate={setStructuralData}
                onRunAll={handleRunAll}
                onClear={handleClear}
                runState={runState}
                structuralResults={structuralResults}
                onNavigate={(key)=>setSubTool(key)}
              />
            )}

            {/* ── Computation Summary — full PASS/FAIL table after Run All ── */}
            {structuralResults && (
              <StructuralComputationSummary
                results={structuralResults}
                data={structuralData}
                onNavigate={(key)=>setSubTool(key)}
              />
            )}

            {/* Plan upload + compliance findings — always mounted */}
            <StructuralChecker
              apiKey={apiKey}
              onDataExtracted={handleDataExtracted}
              externalResult={checkerResult}
              onResultChange={(result) => {
                setCheckerResult(result);
                try {
                  const cur = JSON.parse(localStorage.getItem("buildify_session_electrical") || "{}");
                  localStorage.setItem("buildify_session_electrical", JSON.stringify({ ...cur, checkerResult: result }));
                } catch {}
              }}
              externalExtracted={checkerExtracted}
             
            />
          </div>

          {/* ── Design calc sub-tools — with persistent analysis strip on top ── */}
          {subTool !== null && (
            <div>
              {/* Compact breadcrumb + analysis snapshot */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,padding:"10px 16px",background:T.card,borderRadius:10,border:`1px solid ${T.border}`,flexWrap:"wrap"}}>
                <button onClick={()=>setSubTool(null)}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,color:"#0696d7",cursor:"pointer",fontSize:12,fontWeight:700,flexShrink:0}}>
                  ← Plan Analysis
                </button>
                <div style={{width:1,height:20,background:T.border}}/>
                {(() => { const t = SUB_TOOLS.find(t=>t.key===subTool); return t ? (
                  <>
                    <Icon name={t.icon} size={15} color="#0696d7"/>
                    <div>
                      <div style={{fontSize:13,fontWeight:800,color:T.text}}>{t.label}</div>
                      <div style={{fontSize:11,color:T.muted}}>{t.code}</div>
                    </div>
                  </>
                ) : null; })()}
                {hasData(subTool) && (
                  <span style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#22c55e",fontWeight:700,marginLeft:4}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>
                    Pre-filled from plans
                  </span>
                )}
                {/* Mini analysis status if available */}
                {checkerResult && (
                  <div style={{marginLeft:"auto",display:"flex",gap:12,alignItems:"center"}}>
                    <span style={{fontSize:11,color:T.muted}}>
                      {checkerResult.summary?.projectName && <strong style={{color:T.text}}>{checkerResult.summary.projectName}</strong>}
                    </span>
                    {checkerResult.summary?.criticalCount > 0 && <span style={{fontSize:11,fontWeight:700,color:"#ef4444"}}>⚑ {checkerResult.summary.criticalCount} Critical</span>}
                    {checkerResult.summary?.warningCount  > 0 && <span style={{fontSize:11,fontWeight:700,color:"#f59e0b"}}>⚠ {checkerResult.summary.warningCount} Warnings</span>}
                  </div>
                )}
              </div>

              {/* Design Calc tab strip */}
              <div style={{display:"flex",gap:5,marginBottom:20,flexWrap:"wrap"}}>
                {SUB_TOOLS.map(t=>(
                  <button key={t.key} onClick={()=>setSubTool(t.key)}
                    style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,
                      border:`1.5px solid ${subTool===t.key?"#0696d7":T.border}`,
                      background:subTool===t.key?"rgba(6,150,215,0.12)":"transparent",
                      color:subTool===t.key?"#0696d7":T.muted,cursor:"pointer",fontSize:11,fontWeight:700,transition:"all 0.15s"}}>
                    <Icon name={t.icon} size={12} color={subTool===t.key?"#0696d7":T.muted}/>
                    <span>{t.label}</span>
                    <SubToolStatus toolKey={t.key}/>
                  </button>
                ))}
              </div>

              {subTool==="seismic" && <SeismicCalc   structuralData={structuralData} structuralResults={structuralResults}/>}
              {subTool==="beam"    && <BeamDesign     structuralData={structuralData} structuralResults={structuralResults}/>}
              {subTool==="column"  && <ColumnDesign   structuralData={structuralData} structuralResults={structuralResults}/>}
              {subTool==="footing" && <FootingDesign  structuralData={structuralData} structuralResults={structuralResults}/>}
              {subTool==="slab"    && <SlabDesign     structuralData={structuralData} structuralResults={structuralResults}/>}
              {subTool==="loads"   && <LoadCombinations structuralData={structuralData} structuralResults={structuralResults}/>}
              {subTool==="rebar"   && <RebarSchedule  structuralData={structuralData} structuralResults={structuralResults}/>}
            </div>
          )}

          {/* Design calc launcher — visible on Plan Analysis view only, after analysis */}
          {subTool===null && checkerResult && (
            <div style={{marginTop:16,padding:"12px 16px",background:T.card,borderRadius:10,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px"}}>Open Design Calculator</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {SUB_TOOLS.map(t=>{
                  const hd = hasData(t.key);
                  const items = getResult(t.key);
                  const isIncomplete = hd && items && items.some(i=>i.status==="INCOMPLETE"||i.status==="NO DATA");
                  const isPass = items && items.length > 0 && items.every(i=>i.status==="PASS"||i.status==="COMPUTED");
                  const isFail = items && items.some(i=>i.status==="FAIL");
                  const borderColor = isFail ? "rgba(239,68,68,0.35)" : isIncomplete ? "rgba(245,158,11,0.35)" : hd ? "rgba(34,197,94,0.35)" : T.border;
                  const bgColor = isFail ? "rgba(239,68,68,0.06)" : isIncomplete ? "rgba(245,158,11,0.06)" : hd ? "rgba(34,197,94,0.06)" : "transparent";
                  const txtColor = isFail ? "#ef4444" : isIncomplete ? "#f59e0b" : hd ? "#22c55e" : T.muted;
                  return (
                    <button key={t.key} onClick={()=>setSubTool(t.key)}
                      style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:8,
                        border:`1.5px solid ${borderColor}`, background:bgColor,
                        color:txtColor, cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.15s"}}>
                      <Icon name={t.icon} size={13} color={txtColor}/>
                      <span>{t.label}</span>
                      {isFail && <span style={{fontSize:9,background:"rgba(239,68,68,0.15)",color:"#ef4444",padding:"1px 5px",borderRadius:3,fontWeight:800}}>FAIL</span>}
                      {isIncomplete && <span style={{fontSize:9,background:"rgba(245,158,11,0.15)",color:"#f59e0b",padding:"1px 5px",borderRadius:3,fontWeight:800}}>PARTIAL</span>}
                      {hd && !isIncomplete && !isFail && <span style={{fontSize:9,background:"rgba(34,197,94,0.15)",color:"#22c55e",padding:"1px 5px",borderRadius:3,fontWeight:800}}>DATA</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Sub-tool breadcrumb header

export default StructiCode;
