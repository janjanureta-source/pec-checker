import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { callAI, toBase64, compressImage, getKey, repairJSON } from "../../utils/callAI.js";
import { addHistoryEntry } from "../../utils/history.js";
import PlanChecker, { NoKeyBanner } from "./PlanChecker.jsx";
import VoltageDropCalc from "./VoltageDropCalc.jsx";
import ShortCircuitCalc from "./ShortCircuitCalc.jsx";
import LoadCalc from "./LoadCalc.jsx";
import PanelScheduleBuilder from "./PanelScheduleBuilder.jsx";
import ConduitFillCalc from "./ConduitFillCalc.jsx";
import AmpacityDerating from "./AmpacityDerating.jsx";
import Branch80Checker from "./Branch80Checker.jsx";
import MultiCircuitVDTable from "./MultiCircuitVDTable.jsx";
import GECCalculator from "./GECCalculator.jsx";
import CalcResultRow from "./CalcResultRow.jsx";
import ReviewSummarySheet from "./ReviewSummarySheet.jsx";
import runElecComputations from "./runElecComputations.js";
import ElecIntelligencePanel from "./ElecIntelligencePanel.jsx";
import VerifyHintBanner from "./VerifyHintBanner.jsx";
import { Card, Label } from "../../theme.jsx";

function ElecCode({ apiKey, sessionTick=0 }) {
  const ACCENT     = "#ff6b2b";
  const ACCENT_DIM = "rgba(255,107,43,0.1)";

  // ── All state lives here — never lost on tab switch ──
  const [checkerResult,  setCheckerResult]  = useState(null);
  const [electricalData, setElectricalData] = useState(null);
  const [elecResults,    setElecResults]    = useState(null);
  const [runState,       setRunState]       = useState(null);

  // ── Sticky calculator states ──
  const [calcStates, setCalcStates] = useState({});
  const updateCalcState = (key, state) => setCalcStates(p => ({ ...p, [key]: state }));

  // ── Navigation ──
  const [mainTab,  setMainTab]  = useState("checker");

  // ── Restore session on mount AND on navigation from history ──
  const _loadElecSession = () => {
    try {
      const s = JSON.parse(localStorage.getItem("buildify_session_electrical") || "null");
      if (!s) return;
      if (s.checkerResult)  setCheckerResult(s.checkerResult);
      if (s.electricalData) setElectricalData(s.electricalData);
      if (s.elecResults)    setElecResults(s.elecResults);
      if (s.runState)       setRunState(s.runState);
      if (s.calcStates)     setCalcStates(s.calcStates);
      if (s._mainTab)       setMainTab(s._mainTab);
    } catch {}
  };
  useEffect(() => { _loadElecSession(); }, []); // load once on mount only — component stays mounted so no reload needed
  const [calcTool, setCalcTool] = useState(null);

  const CALC_TOOLS = [
    { key:"vdrop",    icon:"vdrop",      label:"Voltage Drop",      code:"PEC Art. 2.30" },
    { key:"fault",    icon:"fault",      label:"Short Circuit",     code:"PEC Art. 2.40" },
    { key:"load",     icon:"load",       label:"Load Calculator",   code:"PEC Art. 2.20" },
    { key:"panel",    icon:"panel",      label:"Panel Schedule",    code:"PEC Art. 2.20" },
    { key:"conduit",  icon:"conduit",    label:"Conduit Fill",      code:"PEC Art. 3.50" },
    { key:"ampacity", icon:"ampacity",   label:"Ampacity Derating", code:"PEC Table 3.10" },
    { key:"branch80", icon:"load",       label:"Branch 80% Check",  code:"PEC Art. 2.20.3" },
    { key:"vdtable",  icon:"vdrop",      label:"VD All Circuits",   code:"PEC Art. 2.30" },
    { key:"gec",      icon:"electrical", label:"Grounding (GEC)",   code:"PEC Table 2.50.12" },
  ];

  const handleDataExtracted = (extracted) => {
    setElectricalData(extracted);
    setElecResults(null);
    setRunState(null);
    // Persist electricalData so session restore can show Intelligence Panel
    try {
      const cur = JSON.parse(localStorage.getItem("buildify_session_electrical") || "{}");
      localStorage.setItem("buildify_session_electrical", JSON.stringify({ ...cur, electricalData: extracted }));
    } catch {}
  };

  const handleRunAll = () => {
    setRunState({ running: true });
    // Use setTimeout to let React render the "running" state before heavy computation
    setTimeout(() => {
      const results = runElecComputations(electricalData, calcStates);
      setElecResults(results);
      setRunState({ running: false });
      try {
        const cur = JSON.parse(localStorage.getItem("buildify_session_electrical") || "{}");
        localStorage.setItem("buildify_session_electrical", JSON.stringify({
          ...cur, elecResults: results, runState: { running: false }
        }));
      } catch {}
    }, 50);
  };

  const handleClear = () => {
    setCheckerResult(null);
    setElectricalData(null);
    setElecResults(null);
    setRunState(null);
    setCalcStates({});
    setCalcTool(null);
  };

  const hasData = (key) => {
    if (!electricalData) return false;
    if (key==="vdrop")    return !!(electricalData.voltageDrop?.voltage && electricalData.voltageDrop?.current);
    if (key==="fault")    return !!(electricalData.shortCircuit?.voltage && electricalData.shortCircuit?.xfmrKVA);
    if (key==="load")     return !!(electricalData.loadCalc?.loads?.length);
    if (key==="panel")    return !!(electricalData.panel?.circuits?.length || electricalData.panel?.mainBreaker);
    if (key==="conduit")  return !!(electricalData.conduit?.conductors?.length);
    if (key==="ampacity") return !!(electricalData.ampacity?.wireSize);
    if (key==="branch80") return !!(electricalData.panel?.circuits?.length);
    if (key==="vdtable")  return !!(electricalData.panel?.circuits?.length);
    if (key==="gec")      return !!(electricalData.panel?.mainBreaker||electricalData.panel?.circuits?.length);
    return false;
  };

  const getCalcStatus = (key) => {
    if (!elecResults) return null;
    const item = elecResults.items.find(i => i.tool === key);
    if (!item) return null;
    if (item.status === "PASS" || item.status === "COMPUTED") return "pass";
    if (item.status === "FAIL") return "fail";
    if (item.status === "WARNING") return "warn";
    if (item.status === "NO INPUT") return "noinput";
    return null;
  };

  const SubToolStatus = ({ toolKey }) => {
    const st = getCalcStatus(toolKey);
    const hasDat = hasData(toolKey);
    if (st) {
      const cfg = {
        pass:    ["rgba(34,197,94,0.12)","#22c55e","rgba(34,197,94,0.25)","\u2713 PASS"],
        fail:    ["rgba(239,68,68,0.12)","#ef4444","rgba(239,68,68,0.25)","\u2717 FAIL"],
        warn:    ["rgba(245,158,11,0.12)","#f59e0b","rgba(245,158,11,0.25)","\u26a0 WARN"],
        noinput: ["rgba(245,158,11,0.12)","#f59e0b","rgba(245,158,11,0.25)","\u26a0 INPUT"],
      }[st];
      return <span style={{fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:7,background:cfg[0],color:cfg[1],border:`1px solid ${cfg[2]}`}}>{cfg[3]}</span>;
    }
    if (hasDat) return <span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block",boxShadow:"0 0 4px #22c55e",marginLeft:3}}/>;
    return <span style={{width:6,height:6,borderRadius:"50%",background:T.muted,display:"inline-block",opacity:0.3,marginLeft:3}}/>;
  };

  return (
    <div>
      {/* Module header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#ff6b2b,#e85520)",
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Icon name="electrical" size={20} color="#fff"/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:900,fontSize:20,color:T.text,letterSpacing:"-0.5px"}}>Electrical</div>
          <div style={{fontSize:11,color:T.muted,marginTop:1}}>PEC 2017 · RA 9514 (FSIC) · Philippine Green Building Code</div>
        </div>
        {checkerResult && (
          <button onClick={()=>{
            setCheckerResult(null); setElectricalData(null); setElecResults(null);
            setRunState(null); setCalcStates({}); setMainTab("checker");
            // Session stays in localStorage so history cards can reopen it
          }}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:9,
              border:"1.5px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.07)",
              color:"#ef4444",cursor:"pointer",fontSize:12,fontWeight:700,flexShrink:0}}>
            <Icon name="plus" size={13} color="#ef4444"/> New Review
          </button>
        )}
      </div>

      {/* Main tabs */}
      <div style={{display:"flex",gap:8,marginBottom:24,paddingBottom:16,borderBottom:`1px solid ${T.border}`}}>
        {[
          { key:"checker", icon:"checker",    label:"AI Plan Checker" },
          { key:"tools",   icon:"electrical", label:"Calculators" },
          { key:"review",  icon:"panel",      label:"Review Sheet",
            badge: elecResults ? (elecResults.summary.failCount>0 ? "FAIL" : elecResults.summary.noInputCount>0 ? "NEEDS REVIEW" : "PASS") : null },
        ].map(t => {
          const active = mainTab === t.key;
          const bc = t.badge==="FAIL"?"#ef4444":"#22c55e";
          return (
            <button key={t.key} onClick={()=>{
                setMainTab(t.key);
                try {
                  const cur2 = JSON.parse(localStorage.getItem("buildify_session_electrical") || "{}");
                  localStorage.setItem("buildify_session_electrical", JSON.stringify({ ...cur2, _mainTab: t.key }));
                } catch {}
                if (t.key === "review" && electricalData && !elecResults) {
                  setTimeout(() => {
                    const results = runElecComputations(electricalData, calcStates);
                    setElecResults(results);
                    try {
                      const cur3 = JSON.parse(localStorage.getItem("buildify_session_electrical") || "{}");
                      localStorage.setItem("buildify_session_electrical", JSON.stringify({
                        ...cur3, _mainTab: t.key, elecResults: results, runState: { running: false }
                      }));
                    } catch {}
                  }, 50);
                }
              }}
              style={{display:"flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:10,
                border:`1.5px solid ${active?ACCENT:T.border}`,
                background:active?ACCENT_DIM:"transparent",
                color:active?ACCENT:T.muted,cursor:"pointer",fontSize:13,fontWeight:700,transition:"all 0.15s"}}>
              <Icon name={t.icon} size={14} color={active?ACCENT:T.muted}/>
              {t.label}
              {t.badge&&<span style={{fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:5,
                background:`${bc}15`,color:bc,border:`1px solid ${bc}30`,marginLeft:2}}>{t.badge}</span>}
            </button>
          );
        })}
      </div>

      {/* ── AI PLAN CHECKER TAB ── */}
      {mainTab === "checker" && (
        <div>
          {electricalData && (
            <ElecIntelligencePanel
              data={electricalData}
              onClear={handleClear}
              runState={runState}
              elecResults={elecResults}
              onRunAll={handleRunAll}
              onNavigate={(key)=>{ setMainTab("tools"); setCalcTool(key); }}
            />
          )}

          <Card>
            <PlanChecker
              apiKey={apiKey}
              externalResult={checkerResult}
              onResultChange={(result) => {
                setCheckerResult(result);
                try {
                  const cur = JSON.parse(localStorage.getItem("buildify_session_electrical") || "{}");
                  localStorage.setItem("buildify_session_electrical", JSON.stringify({ ...cur, checkerResult: result }));
                } catch {}
              }}
              onDataExtracted={handleDataExtracted}
              onVerifyFinding={(finding,toolKey)=>{
                const desc=(finding.description||"")+" "+(finding.recommendation||"");
                const hint={_verifyHint:{findingId:finding.id,title:finding.title,severity:finding.severity,
                  description:finding.description,recommendation:finding.recommendation,pecRef:finding.pecReference}};
                const nM=(str,re)=>{const m=str.match(re);return m?+m[1]:null;};
                const ex={};
                if(toolKey==="vdrop"){
                  const A=nM(desc,/(\d+(?:\.\d+)?)\s*[Aa](?:mps?|T)?/),m=nM(desc,/(\d+(?:\.\d+)?)\s*m(?:etre|eter)?s?/),awg=nM(desc,/#?(\d+)\s*AWG/i);
                  if(A)ex.current=A; if(m)ex.length=m; if(awg)ex.wireSize=awg;
                }
                if(toolKey==="fault"){
                  const kva=nM(desc,/(\d+(?:\.\d+)?)\s*kVA/i),z=nM(desc,/(\d+(?:\.\d+)?)\s*%Z/i);
                  if(kva)ex.xfmrKVA=kva; if(z)ex.xfmrZ=z;
                }
                if(toolKey==="panel"){
                  const at=nM(desc,/(\d+)\s*A(?:T|mps?)?\s+(?:main|breaker)/i);
                  if(at)ex.mainBreaker=at;
                }
                updateCalcState(toolKey,{...calcStates[toolKey],...ex,...hint});
                setMainTab("tools"); setCalcTool(toolKey);
              }}
            />
          </Card>
          {checkerResult && (
            <div style={{marginTop:16,padding:"12px 16px",background:T.card,borderRadius:10,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px"}}>Open Calculator</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {CALC_TOOLS.map(t => (
                  <button key={t.key} onClick={()=>{ setMainTab("tools"); setCalcTool(t.key); }}
                    style={{display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:8,
                      border:`1.5px solid ${hasData(t.key)?"rgba(34,197,94,0.35)":T.border}`,
                      background:hasData(t.key)?"rgba(34,197,94,0.06)":"transparent",
                      color:hasData(t.key)?"#22c55e":T.muted,cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.15s"}}>
                    <Icon name={t.icon} size={13} color={hasData(t.key)?"#22c55e":T.muted}/>
                    {t.label}
                    {hasData(t.key) && <span style={{fontSize:9,background:"rgba(34,197,94,0.15)",color:"#22c55e",padding:"1px 4px",borderRadius:3,fontWeight:800}}>DATA</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CALCULATORS TAB ── */}
      {mainTab === "tools" && (
        <div>
          {electricalData && (
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,padding:"10px 16px",
              background:T.card,borderRadius:10,border:`1px solid ${T.border}`,flexWrap:"wrap"}}>
              <button onClick={()=>{ setMainTab("checker"); }}
                style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"transparent",
                  border:`1px solid ${T.border}`,borderRadius:7,color:ACCENT,cursor:"pointer",fontSize:12,fontWeight:700,flexShrink:0}}>
                ← Plan Analysis
              </button>
              <div style={{width:1,height:20,background:T.border}}/>
              <Icon name="electrical" size={14} color={ACCENT}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:800,color:T.text}}>{electricalData.system?.projectName||"Electrical Project"}</div>
                <div style={{fontSize:11,color:T.muted}}>{electricalData.system?.voltage}V · {electricalData.system?.occupancy}</div>
              </div>
              {elecResults && (
                <div style={{display:"flex",gap:8}}>
                  {elecResults.summary.passCount>0 && <span style={{fontSize:11,fontWeight:700,color:"#22c55e"}}>✓ {elecResults.summary.passCount} Pass</span>}
                  {elecResults.summary.failCount>0 && <span style={{fontSize:11,fontWeight:700,color:"#ef4444"}}>✗ {elecResults.summary.failCount} Fail</span>}
                </div>
              )}
            </div>
          )}

          {!calcTool && (
            <div>
              <div style={{fontSize:12,color:T.muted,marginBottom:16,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>Select a Calculator</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
                {CALC_TOOLS.map(t => {
                  const populated = hasData(t.key);
                  const st = getCalcStatus(t.key);
                  return (
                    <button key={t.key} onClick={()=>setCalcTool(t.key)}
                      style={{background:T.card,border:`1.5px solid ${populated?"rgba(34,197,94,0.3)":T.border}`,
                        borderRadius:14,padding:"20px",cursor:"pointer",textAlign:"left",transition:"all 0.15s",
                        display:"flex",flexDirection:"column",gap:10,position:"relative"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=ACCENT;e.currentTarget.style.background=ACCENT_DIM;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=populated?"rgba(34,197,94,0.3)":T.border;e.currentTarget.style.background=T.card;}}>
                      {st && (
                        <div style={{position:"absolute",top:10,right:10}}>
                          <span style={{fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:6,
                            background:st==="pass"?"rgba(34,197,94,0.12)":st==="fail"?"rgba(239,68,68,0.12)":"rgba(245,158,11,0.12)",
                            color:st==="pass"?"#22c55e":st==="fail"?"#ef4444":"#f59e0b"}}>
                            {st==="pass"?"✓ PASS":st==="fail"?"✗ FAIL":"⚠ WARN"}
                          </span>
                        </div>
                      )}
                      {populated && !st && (
                        <div style={{position:"absolute",top:10,right:10}}>
                          <span style={{fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:6,background:"rgba(34,197,94,0.12)",color:"#22c55e"}}>DATA</span>
                        </div>
                      )}
                      <div style={{width:40,height:40,borderRadius:10,background:"rgba(255,107,43,0.1)",
                        display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <Icon name={t.icon} size={20} color={ACCENT}/>
                      </div>
                      <div>
                        <div style={{fontWeight:800,fontSize:15,color:T.text}}>{t.label}</div>
                        <div style={{fontSize:11,color:T.muted,marginTop:3}}>{t.code}</div>
                      </div>
                      <div style={{fontSize:12,color:ACCENT,fontWeight:700}}>Open →</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {calcTool && (
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                <button onClick={()=>setCalcTool(null)}
                  style={{background:"transparent",border:"none",color:T.muted,cursor:"pointer",
                    fontSize:13,padding:0,display:"flex",alignItems:"center",gap:4}}>
                  ← Calculators
                </button>
                <span style={{color:T.border}}>›</span>
                <span style={{fontSize:13,fontWeight:700,color:ACCENT}}>
                  {CALC_TOOLS.find(t=>t.key===calcTool)?.label}
                </span>
                {hasData(calcTool) && (
                  <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#22c55e",fontWeight:700}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>
                    Pre-filled from plans
                  </span>
                )}
                <span style={{marginLeft:"auto",fontSize:11,color:T.muted,background:T.dim,padding:"3px 10px",borderRadius:6}}>
                  {CALC_TOOLS.find(t=>t.key===calcTool)?.code}
                </span>
              </div>

              <div style={{display:"flex",gap:5,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
                {CALC_TOOLS.map(t => (
                  <button key={t.key} onClick={()=>setCalcTool(t.key)}
                    style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,
                      border:`1.5px solid ${calcTool===t.key?ACCENT:T.border}`,
                      background:calcTool===t.key?ACCENT_DIM:"transparent",
                      color:calcTool===t.key?ACCENT:T.muted,cursor:"pointer",fontSize:11,fontWeight:700,
                      whiteSpace:"nowrap",transition:"all 0.15s"}}>
                    <Icon name={t.icon} size={12} color={calcTool===t.key?ACCENT:T.muted}/>
                    {t.label}
                    <SubToolStatus toolKey={t.key}/>
                  </button>
                ))}
              </div>

              <Card>
                {/* True conditional — each calc only mounts when selected. State lives in calcStates so nothing is lost on switch. */}
                {calcTool==="vdrop"    && <VoltageDropCalc      electricalData={electricalData} calcState={calcStates.vdrop}    onStateChange={s=>updateCalcState("vdrop",s)}    verifyHint={calcStates.vdrop?._verifyHint}/>}
                {calcTool==="fault"    && <ShortCircuitCalc     electricalData={electricalData} calcState={calcStates.fault}    onStateChange={s=>updateCalcState("fault",s)}    verifyHint={calcStates.fault?._verifyHint}/>}
                {calcTool==="load"     && <LoadCalc             electricalData={electricalData} calcState={calcStates.load}     onStateChange={s=>updateCalcState("load",s)}     verifyHint={calcStates.load?._verifyHint}/>}
                {calcTool==="panel"    && <PanelScheduleBuilder electricalData={electricalData} calcState={calcStates.panel}    onStateChange={s=>updateCalcState("panel",s)}    verifyHint={calcStates.panel?._verifyHint}/>}
                {calcTool==="conduit"  && <ConduitFillCalc      electricalData={electricalData} calcState={calcStates.conduit}  onStateChange={s=>updateCalcState("conduit",s)}/>}
                {calcTool==="ampacity" && <AmpacityDerating     electricalData={electricalData} calcState={calcStates.ampacity} onStateChange={s=>updateCalcState("ampacity",s)}/>}
                {calcTool==="branch80" && <Branch80Checker      electricalData={electricalData} calcState={calcStates.branch80} onStateChange={s=>updateCalcState("branch80",s)} verifyHint={calcStates.branch80?._verifyHint}/>}
                {calcTool==="vdtable"  && <MultiCircuitVDTable  electricalData={electricalData} calcState={calcStates.vdtable}  onStateChange={s=>updateCalcState("vdtable",s)}  verifyHint={calcStates.vdtable?._verifyHint}/>}
                {calcTool==="gec"      && <GECCalculator        electricalData={electricalData} calcState={calcStates.gec}      onStateChange={s=>updateCalcState("gec",s)}/>}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── REVIEW SHEET TAB ── */}
      {mainTab === "review" && (
        <ReviewSummarySheet
          checkerResult={checkerResult}
          electricalData={electricalData}
          elecResults={elecResults}
        />
      )}
    </div>
  );
}

export default ElecCode;
