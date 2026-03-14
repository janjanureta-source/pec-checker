import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon, BuildifyLogo } from "../shared/Icon.jsx";
import BOMReview from "./BOMReview.jsx";
import CostEstimator from "./CostEstimator.jsx";
import { Card, Label } from "../../theme.jsx";

function EngineeringTools({ apiKey, sessionTick=0 }) {
  const PURPLE = "#a78bfa";
  const [tab, setTab] = useState("bom");

  const TABS = [
    { key:"bom",      label:"📋 BOM Review",     icon:"bom"      },
    { key:"estimate", label:"💰 Cost Estimator",  icon:"estimate" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
      {/* Tab bar */}
      <div style={{ display:"flex", gap:4, marginBottom:20, borderBottom:`1px solid ${T.border}`, paddingBottom:0 }}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                display:"flex", alignItems:"center", gap:7,
                padding:"10px 18px",
                borderRadius:"9px 9px 0 0",
                border:`1.5px solid ${active ? PURPLE+"66" : "transparent"}`,
                borderBottom: active ? `1.5px solid ${T.bg}` : "transparent",
                background: active ? `${PURPLE}12` : "transparent",
                color: active ? PURPLE : T.muted,
                cursor:"pointer", fontSize:13, fontWeight: active ? 800 : 600,
                transition:"all 0.15s",
                marginBottom: active ? -1 : 0,
              }}>
              <Icon name={t.icon} size={15} color={active ? PURPLE : "#64748b"}/>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ animation:"fadeIn 0.2s ease" }} key={tab}>
        {tab === "bom"      && <BOMReview    apiKey={apiKey} sessionTick={sessionTick}/>}
        {tab === "estimate" && <CostEstimator apiKey={apiKey}/>}
      </div>
    </div>
  );
}

export default EngineeringTools;
