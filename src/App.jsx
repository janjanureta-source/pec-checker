import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── SVG ICON SYSTEM — Professional (Phosphor/Linear-grade) ────────────────
const Icon = ({ name, size=16, color="currentColor", strokeWidth=1.6 }) => {
  const p = { xmlns:"http://www.w3.org/2000/svg", viewBox:"0 0 24 24", width:size, height:size,
    fill:"none", stroke:color, strokeWidth, strokeLinecap:"round", strokeLinejoin:"round",
    style:{ width:size, height:size, display:"inline-block", flexShrink:0, verticalAlign:"middle" } };
  const paths = {
    // ── Navigation
    home:        <><path d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9.5z"/><path d="M9 21v-7h6v7"/></>,
    structural:  <><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><path d="M17 13v8M13 17h8"/></>,
    electrical:  <><path d="M14.5 2H9l-1 8h5l-1.5 12 8.5-11h-6l1.5-9z"/></>,
    sanitary:    <><path d="M12 2C8.5 2 5 5.8 5 10c0 4 3 8 7 10 4-2 7-6 7-10 0-4.2-3.5-8-7-8z"/><path d="M8.5 10.5c.5-2 2-3 3.5-3s3 1 3.5 3"/></>,
    signout:     <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    // ── Document & Report tools  
    bom:         <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></>,
    report:      <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="8" y1="9" x2="11" y2="9"/></>,
    estimate:    <><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5a4 4 0 0 0-7 2c0 4 7 3 7 7a4 4 0 0 1-7 1.5"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/></>,
    checker:     <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
    file:        <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></>,
    // ── Structural engineering
    seismic:     <><polyline points="2 12 6 12 8 5 12 19 16 9 18 12 22 12"/></>,
    beam:        <><rect x="2" y="9" width="20" height="5" rx="1"/><line x1="6" y1="14" x2="5" y2="21"/><line x1="12" y1="14" x2="12" y2="21"/><line x1="18" y1="14" x2="19" y2="21"/></>,
    column:      <><rect x="10" y="3" width="4" height="18" rx="1"/><rect x="7" y="3" width="10" height="3" rx="1"/><rect x="7" y="18" width="10" height="3" rx="1"/></>,
    footing:     <><rect x="8" y="3" width="8" height="11" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/><line x1="12" y1="14" x2="12" y2="17"/></>,
    slab:        <><rect x="2" y="9" width="20" height="4" rx="1"/><line x1="5" y1="5" x2="5" y2="9"/><line x1="10" y1="4" x2="10" y2="9"/><line x1="14" y1="4" x2="14" y2="9"/><line x1="19" y1="5" x2="19" y2="9"/></>,
    loads:       <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
    // ── Electrical
    vdrop:       <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    fault:       <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill={color}/></>,
    load:        <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></>,
    // ── Sanitary / plumbing
    fixture:     <><path d="M4 17v1a3 3 0 0 0 6 0v-1"/><path d="M14 17v1a3 3 0 0 0 6 0v-1"/><path d="M4 17h16"/><path d="M12 3v8"/><circle cx="12" cy="5" r="2"/></>,
    pipe:        <><path d="M2 12h5"/><path d="M17 12h5"/><path d="M7 12a5 5 0 0 1 10 0"/><circle cx="12" cy="12" r="1" fill={color}/></>,
    septic:      <><rect x="3" y="10" width="18" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><line x1="12" y1="14" x2="12" y2="17"/></>,
    water:       <><path d="M12 2.5c-5 4.5-7 8-7 11a7 7 0 0 0 14 0c0-3-2-6.5-7-11z"/></>,
    pressure:    <><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M8.5 10l3.5 2"/><path d="M7 15h10"/></>,
    storm:       <><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/><path d="M11 13l-2 5 4-2 2 4"/></>,
    // ── Actions
    download:    <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    upload:      <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    open:        <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
    trash:       <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
    filter:      <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    history:     <><path d="M3 3v6h6"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><line x1="12" y1="7" x2="12" y2="12"/><line x1="12" y1="12" x2="15.5" y2="14.5"/></>,
    search:      <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    key:         <><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>,
    check:       <><polyline points="20 6 9 17 4 12"/></>,
    x:           <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    plus:        <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    "chevron-left":  <><polyline points="15 18 9 12 15 6"/></>,
    "chevron-right": <><polyline points="9 18 15 12 9 6"/></>,
    menu:        <><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></>,
    settings:    <><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>,
    info:        <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8.5" strokeWidth={2.5}/><path d="M12 12v5"/></>,
    alert:       <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r=".5" fill={color}/></>,
    logo:        <><path d="M3 6h8v12H3zM13 6h8v12h-8z" strokeWidth={1.4}/><line x1="3" y1="12" x2="11" y2="12"/><line x1="13" y1="12" x2="21" y2="12"/></>,
    // ── New electrical icons
    panel:       <><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="8" y1="3" x2="8" y2="21"/><line x1="2" y1="9" x2="8" y2="9"/><line x1="2" y1="14" x2="8" y2="14"/><line x1="11" y1="8" x2="18" y2="8"/><line x1="11" y1="12" x2="18" y2="12"/><line x1="11" y1="16" x2="15" y2="16"/></>,
    conduit:     <><path d="M3 12h18"/><path d="M3 7c0-2 2-4 4-4h8c2 0 4 2 4 4"/><path d="M3 17c0 2 2 4 4 4h8c2 0 4-2 4-4"/><circle cx="7" cy="12" r="1.5" fill={color}/><circle cx="12" cy="12" r="1.5" fill={color}/><circle cx="17" cy="12" r="1.5" fill={color}/></>,
    ampacity:    <><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/><path d="M5 20v2M19 2v2"/></>,
  };
  const content = paths[name] || <><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill={color}/></>;
  return <svg {...p}>{content}</svg>;
};

// Buildify Logo Mark — professional wordmark-style icon
const BuildifyLogo = ({ size=28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0696d7"/><stop offset="1" stopColor="#0461a0"/>
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#bg1)"/>
    {/* Stylised "B" constructed from structural beam + column geometry */}
    <rect x="8" y="7" width="2.5" height="18" rx="1" fill="white"/>
    <rect x="8" y="7" width="10" height="2.5" rx="1" fill="white"/>
    <rect x="8" y="14.75" width="9" height="2.5" rx="1" fill="white"/>
    <rect x="8" y="22.5" width="10" height="2.5" rx="1" fill="white"/>
    <rect x="18" y="7" width="2.5" height="10" rx="1" fill="rgba(255,255,255,0.9)"/>
    <rect x="17" y="14.75" width="2.5" height="10.25" rx="1" fill="rgba(255,255,255,0.9)"/>
    {/* Accent dot */}
    <circle cx="24" cy="24" r="3" fill="rgba(255,255,255,0.25)"/>
    <circle cx="24" cy="24" r="1.5" fill="rgba(255,255,255,0.8)"/>
  </svg>
);

// ─── HISTORY REPORT DOWNLOAD ──────────────────────────────────────────────────
function downloadHistoryReport(entry, meta) {
  const fmtR = n => (+n||0).toLocaleString("en-PH", { maximumFractionDigits:0 });
  const fmtDate = iso => new Date(iso).toLocaleDateString("en-PH", { year:"numeric", month:"long", day:"numeric", hour:"2-digit", minute:"2-digit" });
  const MODULE_LABEL = { structural:"Structural", electrical:"Electrical", sanitary:"Sanitary" };
  const TOOL_LABEL   = { bom:"BOM Review", estimate:"Cost Estimator", structural:"Structural Check", electrical:"Electrical Check", plumbing:"Plumbing Check", seismic:"Seismic Load", beam:"Beam Design", column:"Column Design", footing:"Footing Design", slab:"Slab Design", loads:"Load Combinations", vdrop:"Voltage Drop", fault:"Short Circuit", load:"Load Schedule", fixture:"Fixture Units", pipe:"Pipe Sizing", septic:"Septic Tank", water:"Water Demand", pressure:"Pressure Loss", storm:"Storm Drainage" };

  const title     = `${TOOL_LABEL[entry.tool]||entry.tool} Report`;
  const project   = entry.projectName || "Untitled Project";
  const module    = MODULE_LABEL[entry.module] || entry.module;
  const runDate   = fmtDate(entry.timestamp);
  const hasCost   = !!entry.meta?.totalHigh;
  const hasStatus = !!entry.meta?.status;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>${title} — ${project}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;color:#1e293b;background:#fff;padding:0}
  .page{max-width:780px;margin:0 auto;padding:48px 56px}
  .header{border-bottom:3px solid #0696d7;padding-bottom:24px;margin-bottom:32px;display:flex;justify-content:space-between;align-items:flex-start}
  .logo-area{display:flex;align-items:center;gap:10}
  .logo-box{width:38px;height:38px;background:linear-gradient(135deg,#0696d7,#0569a8);border-radius:8px;display:flex;align-items:center;justify-content:center}
  .logo-box svg{width:22px;height:22px}
  .brand{font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-0.5px}
  .brand-sub{font-size:9px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-top:1px}
  .report-meta{text-align:right}
  .report-meta .doc-type{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
  .report-meta .doc-num{font-size:12px;color:#475569;font-family:monospace}
  h1{font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;margin-bottom:4px}
  .project-name{font-size:16px;color:#0696d7;font-weight:700;margin-bottom:20px}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:28px}
  .info-cell{padding:12px 16px;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0}
  .info-cell:nth-child(2n){border-right:none}
  .info-cell:nth-last-child(-n+2){border-bottom:none}
  .info-label{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;margin-bottom:3px}
  .info-value{font-size:13px;color:#1e293b;font-weight:600}
  .section{margin-bottom:28px}
  .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#0696d7;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #e2e8f0}
  .summary-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 20px}
  .summary-box p{font-size:13px;color:#475569;line-height:1.7}
  .cost-box{background:linear-gradient(135deg,rgba(6,150,215,0.06),rgba(6,150,215,0.02));border:1.5px solid rgba(6,150,215,0.25);border-radius:12px;padding:20px 24px;display:flex;align-items:center;gap:16}
  .cost-amount{font-size:28px;font-weight:800;color:#0696d7;font-family:'Courier New',monospace;letter-spacing:-1px}
  .cost-label{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-top:3px}
  .status-box{display:inline-flex;align-items:center;gap:8;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:700}
  .status-VALIDATED{background:#dcfce7;color:#166534;border:1px solid #86efac}
  .status-ACCEPTABLE{background:#fef3c7;color:#92400e;border:1px solid #fcd34d}
  .status-NEEDS{background:#fee2e2;color:#991b1b;border:1px solid #fca5a5}
  .findings-row{display:flex;align-items:center;gap:8;padding:10px 14px;border-radius:7px;border:1px solid #e2e8f0;margin-bottom:6px;background:#fff}
  .findings-num{font-size:18px;font-weight:800;color:#0696d7;font-family:monospace;min-width:32px}
  .findings-label{font-size:12px;color:#475569;font-weight:500}
  .footer{margin-top:48px;padding-top:20px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center}
  .footer-left{font-size:10px;color:#94a3b8;line-height:1.5}
  .disclaimer{margin-top:24px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;font-size:10px;color:#92400e;line-height:1.6}
  .disclaimer strong{font-weight:700}
  @media print{body{padding:0}.page{padding:32px 40px}}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo-area">
      <div class="logo-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 20V8h4a3 3 0 010 6H7M15 8h2a4 4 0 010 8h-2V8z"/>
        </svg>
      </div>
      <div>
        <div class="brand">Buildify</div>
        <div class="brand-sub">Engineering Suite · PH</div>
      </div>
    </div>
    <div class="report-meta">
      <div class="doc-type">Technical Report</div>
      <div class="doc-num">REF: BLD-${Date.now().toString(36).toUpperCase()}</div>
    </div>
  </div>

  <h1>${title}</h1>
  <div class="project-name">${project}</div>

  <div class="info-grid">
    <div class="info-cell"><div class="info-label">Module</div><div class="info-value">${module}</div></div>
    <div class="info-cell"><div class="info-label">Tool</div><div class="info-value">${TOOL_LABEL[entry.tool]||entry.tool}</div></div>
    <div class="info-cell"><div class="info-label">Run Date</div><div class="info-value">${runDate}</div></div>
    <div class="info-cell"><div class="info-label">Reference Codes</div><div class="info-value">NSCP 2015 · PEC 2017 · NPC 2000 · DPWH</div></div>
  </div>

  ${hasCost ? `
  <div class="section">
    <div class="section-title">Cost Summary</div>
    <div class="cost-box">
      <div>
        <div class="cost-amount">₱${fmtR(entry.meta.totalHigh)}</div>
        <div class="cost-label">Estimated High Value</div>
      </div>
    </div>
  </div>` : ""}

  ${hasStatus ? `
  <div class="section">
    <div class="section-title">Compliance Status</div>
    <div>
      <span class="status-box status-${(entry.meta.status||"").replace(/[^A-Z]/g,'')||'VALIDATED'}">${entry.meta.status}</span>
    </div>
  </div>` : ""}

  ${entry.meta?.findings ? `
  <div class="section">
    <div class="section-title">Findings Summary</div>
    <div class="findings-row">
      <div class="findings-num">${entry.meta.findings}</div>
      <div class="findings-label">Total findings reviewed</div>
    </div>
  </div>` : ""}

  ${entry.meta?.summary ? `
  <div class="section">
    <div class="section-title">Analysis Notes</div>
    <div class="summary-box"><p>${entry.meta.summary}</p></div>
  </div>` : ""}

  <div class="disclaimer">
    <strong>Disclaimer:</strong> This report was generated by Buildify AI using publicly available Philippine engineering codes and 2025 market rate estimates. Results are intended as a reference and professional aid only. All figures must be verified by a licensed engineer or qualified estimator before use in contracts, permits, or official submissions. Buildify and its developers assume no liability for decisions made based solely on this output.
  </div>

  <div class="footer">
    <div class="footer-left">
      Generated by Buildify · AI-Powered Engineering Suite · Philippines<br/>
      Powered by Claude AI (Anthropic) · ${new Date().toLocaleDateString("en-PH", {year:"numeric",month:"long",day:"numeric"})}
    </div>
    <div style="font-size:10px;color:#cbd5e1;text-align:right">NSCP 2015 · PEC 2017<br/>NPC 2000 · DPWH Blue Book</div>
  </div>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type:"text/html" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `Buildify_${(TOOL_LABEL[entry.tool]||entry.tool).replace(/ /g,"_")}_${(project).replace(/[^a-zA-Z0-9]/g,"_")}.html`;
  a.click();
  URL.revokeObjectURL(url);
}


// ─── PEC SYSTEM PROMPT ───────────────────────────────────────────────────────
const PEC_SYSTEM_PROMPT = `You are a licensed Professional Electrical Engineer (PEE) with deep expertise in:
- Philippine Electrical Code (PEC) 2017 Edition (primary reference)
- RA 9514 — Revised Fire Code of the Philippines (FSIC requirements)
- Philippine Green Building Code (PGBC) — lighting power density, energy metering
- NFPA 70 (NEC) — cross-referenced by PEC for technical basis
- IEEE standards for power systems where referenced by PEC
- DOE Department Circular DC2022-12-0034 for energy efficiency

REVIEW PROCESS — follow these steps before writing output:
1. Read ALL uploaded pages. Note voltage system, phases, occupancy, connected load schedule.
2. Identify what IS shown vs. what is MISSING — missing schedules or specs are findings.
3. For each item below, check compliance or flag as CANNOT VERIFY if data is insufficient.
4. Cite EXACT PEC article and section numbers. State the calculated or observed value vs. the required value.
5. Flag CANNOT VERIFY items as INFO severity.

CHECK ALL OF THE FOLLOWING:

WIRE AND CONDUCTOR SIZING (PEC Art. 2.30)
- Ampacity of conductors per PEC Table 3.10.1 (60°C or 75°C rating)
- Minimum branch circuit conductor size: #12 AWG for 20A, #10 AWG for 30A
- Derating for conduit fill >3 conductors (PEC Sec. 3.10.15) and ambient temp >30°C
- Voltage drop: ≤3% branch circuit, ≤5% feeder+branch combined (PEC Sec. 2.30.5)

OVERCURRENT PROTECTION (PEC Art. 2.40)
- Breaker rating ≤ conductor ampacity (no over-fusing)
- Motor circuits: breaker ≤ 250% of motor FLA (PEC Sec. 4.30.5)
- AFCI/GFCI requirements for wet locations, kitchens, bathrooms (PEC Art. 2.10)

GROUNDING AND BONDING (PEC Art. 2.50)
- Equipment grounding conductor size per PEC Table 2.50.12
- System grounding conductor — size per PEC Sec. 2.50.66
- Ground rod specification: copper-clad 16mm dia × 2.4m min (PEC Sec. 2.50.56)
- Neutral-ground bond point: at service entrance only, not at sub-panels

LOAD CALCULATION (PEC Art. 2.20)
- General lighting load: 20 VA/m² residential (PEC Table 2.20.3), 30 VA/m² office
- Service entrance load calculation: show demand factors applied
- Total connected load vs. service capacity
- Power factor noted for motor/commercial loads

BRANCH CIRCUITS (PEC Art. 2.10)
- Small appliance circuits: minimum 2 circuits for kitchen (PEC Sec. 2.10.11)
- Laundry circuit: 1 dedicated 20A circuit (PEC Sec. 2.10.18)
- Bathroom circuit: separate 20A GFCI circuit (PEC Sec. 2.10.9)
- Outlet spacing: ≤ 3.6m along walls (PEC Sec. 2.10.52)

PANELBOARD (PEC Art. 3.84)
- Panel schedule shown with all circuit breaker ratings and conductor sizes
- Panelboard main breaker rating ≤ bus rating
- Spare circuit capacity: minimum 20% spare breakers (best practice)
- AIC rating of panel ≥ available fault current

SERVICE ENTRANCE (PEC Art. 2.30 / Art. 2.32)
- Service entrance conductor sizing per computed load
- Meter base and CTs properly sized
- Service disconnect accessible and labeled (PEC Sec. 2.30.6)

FIRE CODE — FSIC (RA 9514 / IRR)
- Emergency lighting: 1.5-hour battery backup minimum at exits and stairways
- Exit sign illumination: internally lit, battery backup
- Fire alarm wiring in conduit, separate from normal power wiring
- Generators: required for hospitals, high-rise, assembly occupancy >1000 persons

PHILIPPINE GREEN BUILDING CODE
- Lighting Power Density (LPD): residential ≤ 5 W/m², office ≤ 10 W/m²
- Sub-metering for floors >500m²
- Power factor correction capacitors noted for inductive loads > 25 kVA

SHORT CIRCUIT ANALYSIS
- Available fault current at service entrance calculated or stated
- Interrupting capacity (AIC) of all breakers ≥ available fault current

CONFIDENCE GUIDANCE:
- CRITICAL: clear code violation with observed vs. required values identifiable
- WARNING: likely violation or missing data that prevents compliance verification
- INFO: best-practice gap or item requiring field verification
- confidence: HIGH (values visible in plans), MEDIUM (inferred), LOW (assumed from occupancy)

Respond ONLY as valid JSON (no markdown, no preamble):
{
  "summary": {
    "projectName": "string",
    "projectLocation": "city/province if shown or null",
    "occupancyType": "Residential|Commercial|Industrial|Institutional|Unknown",
    "voltageSystem": "230V/1Ph|400V/3Ph|other or null",
    "totalConnectedLoad": "kVA if shown or null",
    "fileType": "string",
    "overallStatus": "NON-COMPLIANT|COMPLIANT WITH WARNINGS|COMPLIANT",
    "criticalCount": 0,
    "warningCount": 0,
    "infoCount": 0,
    "analysisNotes": "2-3 sentence professional summary of most critical issues",
    "cannotVerifyItems": ["items that could not be checked due to missing plan data"]
  },
  "findings": [
    {
      "id": 1,
      "severity": "CRITICAL|WARNING|INFO",
      "confidence": "HIGH|MEDIUM|LOW",
      "category": "Wire Sizing|Overcurrent|Grounding|Load Calc|Branch Circuits|Panelboard|Service Entrance|Lighting|FSIC|Green Building|Short Circuit|Other",
      "pecReference": "PEC 2017 Art. X.XX Sec. X.XX.X",
      "title": "concise title under 10 words",
      "description": "precise technical description — state observed value, required value, and specific code requirement. Do not truncate.",
      "recommendation": "specific corrective action with target values or wire/breaker sizes",
      "codeBasis": "exact code requirement or table reference"
    }
  ],
  "checklist": {
    "wireSizing": true,
    "overcurrentProtection": true,
    "grounding": true,
    "loadCalculation": true,
    "branchCircuits": true,
    "panelboard": true,
    "serviceEntrance": true,
    "lighting": true,
    "fsic": true,
    "greenBuilding": true,
    "shortCircuit": true
  },
  "extracted": {
    "system": { "voltage": null, "phases": null, "occupancy": null, "projectName": null },
    "voltDrop": { "voltage": null, "current": null, "length": null, "conductor": null, "conduitType": null },
    "shortCircuit": { "voltage": null, "impedance": null, "kva": null },
    "loadCalc": { "floorArea": null, "occupancy": null, "voltage": null, "phases": null, "powerFactor": null },
    "panel": { "voltage": null, "phases": null, "mainBreaker": null, "circuits": [] },
    "conduit": { "conduitType": null, "conduitSize": null, "conductors": [] },
    "ampacity": { "conductor": null, "ambientTemp": null, "conduitFill": null }
  }
}`;

// ─── DATA TABLES ─────────────────────────────────────────────────────────────
const WIRE_DATA = {
  14:    { ampacity: 15,  resistance: 8.286  },
  12:    { ampacity: 20,  resistance: 5.211  },
  10:    { ampacity: 30,  resistance: 3.277  },
  8:     { ampacity: 50,  resistance: 2.061  },
  6:     { ampacity: 65,  resistance: 1.296  },
  4:     { ampacity: 85,  resistance: 0.8152 },
  3:     { ampacity: 100, resistance: 0.6463 },
  2:     { ampacity: 115, resistance: 0.5127 },
  1:     { ampacity: 130, resistance: 0.4066 },
  "1/0": { ampacity: 150, resistance: 0.3225 },
  "2/0": { ampacity: 175, resistance: 0.2558 },
  "3/0": { ampacity: 200, resistance: 0.2028 },
  "4/0": { ampacity: 230, resistance: 0.1609 },
  250:   { ampacity: 255, resistance: 0.1363 },
  300:   { ampacity: 285, resistance: 0.1138 },
  350:   { ampacity: 310, resistance: 0.09766},
  400:   { ampacity: 335, resistance: 0.08548},
  500:   { ampacity: 380, resistance: 0.06837},
};
const AWG_SIZES = [14,12,10,8,6,4,3,2,1,"1/0","2/0","3/0","4/0",250,300,350,400,500];

const DEMAND_FACTORS = {
  residential: [{upTo:3000,f:1.0},{upTo:120000,f:0.35},{upTo:Infinity,f:0.25}],
  commercial:  [{upTo:10000,f:1.0},{upTo:Infinity,f:0.5}],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const toBase64 = f => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(f); });
const fmtSize  = n => n<1024?n+" B":n<1048576?(n/1024).toFixed(1)+" KB":(n/1048576).toFixed(1)+" MB";

// Compress an image file to JPEG at reduced quality/size before base64 encoding
const compressImage = (file, maxPx = 1600, quality = 0.75) => new Promise((resolve, reject) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    URL.revokeObjectURL(url);
    let { width: w, height: h } = img;
    if (w > maxPx || h > maxPx) {
      if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
      else       { w = Math.round(w * maxPx / h); h = maxPx; }
    }
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    canvas.toBlob(blob => {
      if (!blob) { resolve(file); return; } // fallback to original
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }, "image/jpeg", quality);
  };
  img.onerror = reject;
  img.src = url;
});

// ─── UNIFIED AI CALLER — always via proxy, images compressed first ────────────
const getKey = () => {
  // Always read fresh from localStorage so it works even before React state syncs
  const stored = localStorage.getItem("phen_key") || "";
  if (stored.startsWith("sk-")) {
    window.__PHEN_KEY__ = stored; // keep window in sync
    return stored;
  }
  if (window.__PHEN_KEY__ && window.__PHEN_KEY__.startsWith("sk-")) return window.__PHEN_KEY__;
  return "";
};

const callAI = async ({ apiKey, system, messages, max_tokens = 8000 }) => {
  // Try: explicit prop → localStorage → window global
  const key = (typeof apiKey === "string" && apiKey.startsWith("sk-"))
    ? apiKey
    : getKey();

  if (!key) throw new Error(
    "API key required. Paste your Anthropic API key (starts with sk-ant-...) into the field in the top navigation bar, then press Enter."
  );

  const payload = { model: "claude-sonnet-4-20250514", max_tokens, messages };
  if (system) payload.system = system;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Anthropic API error");
  return data;
};

const repairJSON = str => {
  try { return JSON.parse(str); } catch {}
  let s = str;
  const last = s.lastIndexOf("},");
  if (last>0){
    s=s.substring(0,last+1)+']},"checklist":{"wireSizing":null,"overcurrentProtection":null,"grounding":null,"loadCalculation":null,"branchCircuits":null,"panelboard":null,"serviceEntrance":null,"lighting":null,"fsic":null,"greenBuilding":null,"shortCircuit":null}}';
    try { return JSON.parse(s); } catch {}
  }
  return null;
};

const calcDemand = (va, type) => {
  const tiers = DEMAND_FACTORS[type]||DEMAND_FACTORS.residential;
  let d=0, rem=va, prev=0;
  for(const t of tiers){ const band=Math.min(rem,t.upTo-prev); if(band<=0)break; d+=band*t.f; rem-=band; prev=t.upTo; if(rem<=0)break; }
  return d;
};

const exportPDF = (result, findings) => {
  const w = window.open("","_blank");
  const sc = { "NON-COMPLIANT":"#dc2626","COMPLIANT WITH WARNINGS":"#d97706","COMPLIANT":"#16a34a" }[result.summary.overallStatus]||"#555";
  const rows = findings.map(f=>{
    const col = {CRITICAL:"#dc2626",WARNING:"#d97706",INFO:"#2563eb"}[f.severity]||"#555";
    return `<tr><td style="padding:8px;border:1px solid #e5e7eb;color:${col};font-weight:700;white-space:nowrap">${f.severity}</td><td style="padding:8px;border:1px solid #e5e7eb;font-size:12px">${f.category}</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">${f.title}</td><td style="padding:8px;border:1px solid #e5e7eb;font-size:12px">${f.description}</td><td style="padding:8px;border:1px solid #e5e7eb;font-size:12px;color:#15803d">${f.recommendation}</td><td style="padding:8px;border:1px solid #e5e7eb;font-size:11px;color:#6b7280">${f.pecReference}</td></tr>`;
  }).join("");
  w.document.write(`<!DOCTYPE html><html><head><title>PEC Report</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#111;font-size:13px}h1{color:#111}h2{color:#374151;border-bottom:2px solid #f3f4f6;padding-bottom:6px;margin-top:28px}table{border-collapse:collapse;width:100%}th{background:#1f2937;color:#fff;padding:10px 8px;text-align:left;font-size:12px}.badge{display:inline-block;padding:4px 14px;border-radius:20px;font-weight:700;font-size:14px;background:${sc}22;color:${sc};border:2px solid ${sc}}.footer{margin-top:36px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px}@media print{button{display:none}}</style></head><body>
  <h1>⚡ PEC Compliance Report</h1>
  <p style="color:#6b7280">Philippine Electrical Code 2017 &nbsp;·&nbsp; ${new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"})}</p>
  <table style="width:auto;margin-bottom:16px"><tr><td style="padding:4px 20px 4px 0"><b>Project:</b> ${result.summary.projectName}</td><td style="padding:4px 20px"><b>Type:</b> ${result.summary.occupancyType}</td></tr></table>
  <span class="badge">${result.summary.overallStatus}</span>
  <p>${result.summary.analysisNotes}</p>
  <div style="display:flex;gap:32px;margin:16px 0">
    <div><div style="font-size:28px;font-weight:800;color:#dc2626">${result.summary.criticalCount}</div><div style="font-size:11px;color:#9ca3af">CRITICAL</div></div>
    <div><div style="font-size:28px;font-weight:800;color:#d97706">${result.summary.warningCount}</div><div style="font-size:11px;color:#9ca3af">WARNINGS</div></div>
    <div><div style="font-size:28px;font-weight:800;color:#2563eb">${result.summary.infoCount}</div><div style="font-size:11px;color:#9ca3af">INFO</div></div>
  </div>
  <h2>Findings (${findings.length})</h2>
  <table><tr><th>Severity</th><th>Category</th><th>Issue</th><th>Description</th><th>Recommendation</th><th>PEC Ref.</th></tr>${rows}</table>
  <div class="footer">⚠️ AI-generated report for reference only. Must be reviewed and stamped by a licensed PEE before MERALCO/LGU/DPWH submission.</div>
  </body></html>`);
  w.document.close(); setTimeout(()=>w.print(),400);
};

const exportRevisionPDF = (result, corrections, revNum) => {
  const w = window.open("","_blank");
  const date = new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});
  const revRows = corrections.map((c,i) => `
    <tr style="page-break-inside:avoid">
      <td style="padding:10px 8px;border:1px solid #e5e7eb;font-weight:700;color:#6b7280;text-align:center;white-space:nowrap">REV-${String(i+1).padStart(2,"0")}</td>
      <td style="padding:10px 8px;border:1px solid #e5e7eb;font-size:11px;color:${{CRITICAL:"#dc2626",WARNING:"#d97706",INFO:"#2563eb"}[c.severity]};font-weight:700">${c.severity}</td>
      <td style="padding:10px 8px;border:1px solid #e5e7eb;font-size:12px;font-weight:600">${c.title}</td>
      <td style="padding:10px 8px;border:1px solid #e5e7eb;font-size:12px;color:#374151">${c.description}</td>
      <td style="padding:10px 8px;border:1px solid #e5e7eb;font-size:12px;background:#fefce8">${c.correctedValues||c.recommendation}</td>
      <td style="padding:10px 8px;border:1px solid #e5e7eb;font-size:12px;background:#f0fdf4;color:#15803d">${c.draftingInstruction||""}</td>
      <td style="padding:10px 8px;border:1px solid #e5e7eb;font-size:11px;color:#6b7280">${c.pecReference}</td>
    </tr>`).join("");

  const histRows = Array.from({length: revNum}, (_,i) => `
    <tr>
      <td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:700">Rev ${i+1}</td>
      <td style="padding:6px 10px;border:1px solid #e5e7eb">${i+1 === revNum ? date : "—"}</td>
      <td style="padding:6px 10px;border:1px solid #e5e7eb">${i+1 === revNum ? `PEC compliance corrections — ${corrections.length} item(s) addressed` : "Previous revision"}</td>
      <td style="padding:6px 10px;border:1px solid #e5e7eb">Prepared by AI · For review by PEE</td>
    </tr>`).join("");

  w.document.write(`<!DOCTYPE html><html><head><title>Revision Report Rev ${revNum}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:0;color:#111;font-size:13px}
    .page{margin:40px;padding-bottom:40px}
    h1{color:#1f2937;font-size:20px;margin-bottom:4px}
    h2{color:#374151;font-size:14px;border-bottom:2px solid #f3f4f6;padding-bottom:6px;margin-top:28px}
    table{border-collapse:collapse;width:100%}
    th{background:#1f2937;color:#fff;padding:9px 8px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
    .rev-badge{display:inline-block;background:#1f2937;color:#f59e0b;font-weight:800;font-size:18px;padding:6px 18px;border-radius:6px;letter-spacing:1px}
    .title-block{border:2px solid #1f2937;border-radius:8px;padding:16px 20px;margin-bottom:24px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px}
    .info-item{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:10px 14px}
    .info-label{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;margin-bottom:2px}
    .info-value{font-size:14px;font-weight:700;color:#111}
    .legend{display:flex;gap:16px;margin:12px 0;font-size:11px}
    .legend-item{display:flex;align-items:center;gap:6px}
    .dot{width:12px;height:12px;border-radius:2px}
    .footer{margin-top:40px;padding-top:12px;border-top:2px solid #e5e7eb;font-size:11px;color:#9ca3af;display:flex;justify-content:space-between}
    @media print{@page{margin:20mm} button{display:none}}
  </style></head><body>
  <div class="page">
    <!-- Title Block -->
    <div class="title-block">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:11px;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Philippine Electrical Code 2017 Compliance</div>
          <h1 style="margin:0 0 6px">⚡ Drawing Revision Report</h1>
          <div style="font-size:13px;color:#6b7280">For Draftsman / CAD Operator Use</div>
        </div>
        <div style="text-align:right">
          <div class="rev-badge">REV ${revNum}</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:6px">${date}</div>
        </div>
      </div>
    </div>

    <!-- Project Info -->
    <div class="info-grid">
      <div class="info-item"><div class="info-label">Project Name</div><div class="info-value">${result.summary.projectName}</div></div>
      <div class="info-item"><div class="info-label">Occupancy Type</div><div class="info-value">${result.summary.occupancyType}</div></div>
      <div class="info-item"><div class="info-label">Total Corrections</div><div class="info-value">${corrections.length} items</div></div>
    </div>

    <!-- Legend -->
    <div class="legend">
      <strong style="font-size:11px">Legend:</strong>
      <div class="legend-item"><div class="dot" style="background:#fefce8;border:1px solid #ca8a04"></div> Corrected Value</div>
      <div class="legend-item"><div class="dot" style="background:#f0fdf4;border:1px solid #16a34a"></div> Drafting Instruction</div>
    </div>

    <!-- Corrections Table -->
    <h2>Corrections for This Revision (${corrections.length} items)</h2>
    <table>
      <tr>
        <th>Rev No.</th>
        <th>Severity</th>
        <th>Issue</th>
        <th>Original Finding</th>
        <th style="background:#92400e">Corrected Value</th>
        <th style="background:#166534">Drafting Instruction</th>
        <th>PEC Ref.</th>
      </tr>
      ${revRows}
    </table>

    <!-- Revision History -->
    <h2>Revision History</h2>
    <table>
      <tr><th>Revision</th><th>Date</th><th>Description</th><th>Prepared By</th></tr>
      ${histRows}
    </table>

    <!-- Notes -->
    <div style="margin-top:24px;background:#fffbeb;border:1px solid #fbbf24;border-radius:8px;padding:14px 18px">
      <div style="font-weight:700;font-size:13px;color:#92400e;margin-bottom:6px">📋 Instructions for Draftsman</div>
      <ol style="margin:0;padding-left:18px;color:#78350f;font-size:12px;line-height:2">
        <li>Apply all corrections listed in the table above to the drawing file</li>
        <li>Update the revision block on the title sheet with Rev ${revNum} and date ${date}</li>
        <li>Add revision clouds around all modified areas</li>
        <li>Tag each revision cloud with the corresponding Rev No. (e.g. REV-01, REV-02)</li>
        <li>Submit revised drawings to the Engineer-of-Record for review and signature</li>
      </ol>
    </div>

    <div class="footer">
      <span>⚠️ AI-generated revision report. All corrections must be verified by a licensed PEE before implementation.</span>
      <span>Page 1 of 1 &nbsp;·&nbsp; PEC Compliance Suite</span>
    </div>
  </div>
  </body></html>`);
  w.document.close();
  setTimeout(()=>w.print(), 500);
};

// ─── DESIGN TOKENS — Engineering palette ─────────────────────────────────────
// Inspired by Autodesk Construction Cloud + Procore + Bentley Systems
// Primary:   #0284c7 Steel Blue   — trust, precision, industry standard
// Secondary: #ea580c Safety Orange — construction energy, action, alerts  
// Tertiary:  #0891b2 Cyan          — sanitary/water/plumbing
// Background: Deep navy-slate — professional dark engineering UI
const T = {
  bg:        "#070c14",
  card:      "#0d1421",
  border:    "rgba(148,163,184,0.1)",
  accent:    "#0284c7",
  accentDim: "rgba(2,132,199,0.12)",
  text:      "#e2e8f0",
  muted:     "#64748b",
  dim:       "#111827",
  success:   "#16a34a",
  danger:    "#dc2626",
  warn:      "#d97706",
  info:      "#0284c7",
};


// ─── SHARED UI COMPONENTS ────────────────────────────────────────────────────
const Card = ({children, style={}}) => (
  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, ...style }}>
    {children}
  </div>
);

const Label = ({children}) => (
  <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.8px", textTransform:"uppercase", color:T.muted, marginBottom:6 }}>
    {children}
  </div>
);

const Input = ({style={}, ...props}) => (
  <input style={{
    width:"100%", background:"#0f1117", border:`1.5px solid ${T.border}`,
    borderRadius:10, padding:"10px 14px", color:T.text, fontSize:14,
    outline:"none", transition:"border 0.15s",
    ...style
  }} {...props}
  onFocus={e=>e.target.style.borderColor=T.accent}
  onBlur={e=>e.target.style.borderColor=T.border}
  />
);

const Select = ({children, style={}, ...props}) => (
  <select style={{
    width:"100%", background:"#0f1117", border:`1.5px solid ${T.border}`,
    borderRadius:10, padding:"10px 14px", color:T.text, fontSize:14,
    outline:"none", cursor:"pointer", ...style
  }} {...props}>
    {children}
  </select>
);

const Stat = ({label, value, sub, color=T.text, accent=false}) => (
  <div style={{
    background: accent ? T.accentDim : T.dim,
    border: `1.5px solid ${accent ? "rgba(245,158,11,0.3)" : T.border}`,
    borderRadius:12, padding:"16px 18px",
  }}>
    <Label>{label}</Label>
    <div style={{ fontSize:24, fontWeight:800, color: accent ? T.accent : color, lineHeight:1.1, marginBottom:4 }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:T.muted }}>{sub}</div>}
  </div>
);

// Compliance gauge arc
const ComplianceGauge = ({ pct, limit, label }) => {
  const ok = pct <= limit;
  const danger = pct > limit * 1.5;
  const color = ok ? T.success : danger ? T.danger : T.warn;
  const angle = Math.min(pct / (limit * 2), 1) * 180;
  const r = 54, cx = 70, cy = 70;
  const toXY = (deg) => {
    const rad = (deg - 180) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const start = toXY(0), end = toXY(angle);
  const large = angle > 90 ? 1 : 0;
  return (
    <div style={{ textAlign:"center" }}>
      <svg width={140} height={80} style={{ overflow:"visible" }}>
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke={T.border} strokeWidth={10} strokeLinecap="round"/>
        {pct > 0 && <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" style={{transition:"all 0.5s ease"}}/>}
        <line x1={cx} y1={cy} x2={end.x} y2={end.y} stroke={color} strokeWidth={3} strokeLinecap="round" style={{transition:"all 0.5s ease"}}/>
        <circle cx={cx} cy={cy} r={5} fill={color}/>
        <text x={cx} y={cy+20} textAnchor="middle" fill={color} fontSize={18} fontWeight={800}>{pct.toFixed(2)}%</text>
        <text x={cx-r+4} y={cy+18} fill={T.muted} fontSize={10}>0%</text>
        <text x={cx+r-14} y={cy+18} fill={T.muted} fontSize={10}>{(limit*2).toFixed(0)}%</text>
      </svg>
      <div style={{ fontSize:12, color:T.muted, marginTop:-4 }}>{label}</div>
      <div style={{ marginTop:6, display:"inline-block", padding:"3px 12px", borderRadius:20, fontSize:12, fontWeight:700, background: ok?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)", color: ok?T.success:T.danger }}>
        {ok ? `✓ WITHIN ${limit}% LIMIT` : `✗ EXCEEDS ${limit}% LIMIT`}
      </div>
    </div>
  );
};

// ─── VOLTAGE DROP CALCULATOR ──────────────────────────────────────────────────

// ─── APPLIANCE DATABASE ───────────────────────────────────────────────────────
const APPLIANCE_CATEGORIES = [
  {
    category: "💡 Lighting",
    items: [
      { name: "LED Bulb (9W)",            watts: 9,    pct: 100 },
      { name: "LED Bulb (15W)",           watts: 15,   pct: 100 },
      { name: "Fluorescent Lamp (40W)",   watts: 40,   pct: 100 },
      { name: "Downlight / Recessed LED", watts: 12,   pct: 100 },
      { name: "Tube Light (LED T8)",      watts: 18,   pct: 100 },
      { name: "Outdoor Floodlight",       watts: 50,   pct: 100 },
      { name: "Emergency Light",          watts: 10,   pct: 100 },
    ]
  },
  {
    category: "❄️ Air Conditioning",
    items: [
      { name: "Window AC 0.5HP",          watts: 450,  pct: 80 },
      { name: "Window AC 1HP",            watts: 746,  pct: 80 },
      { name: "Window AC 1.5HP",          watts: 1119, pct: 80 },
      { name: "Split-Type AC 1HP",        watts: 900,  pct: 80 },
      { name: "Split-Type AC 1.5HP",      watts: 1300, pct: 80 },
      { name: "Split-Type AC 2HP",        watts: 1800, pct: 80 },
      { name: "Inverter AC 1HP",          watts: 700,  pct: 80 },
      { name: "Inverter AC 1.5HP",        watts: 1000, pct: 80 },
      { name: "Cassette-Type AC 2HP",     watts: 1800, pct: 80 },
    ]
  },
  {
    category: "🍳 Kitchen Appliances",
    items: [
      { name: "Electric Range / Stove",   watts: 2000, pct: 65 },
      { name: "Microwave Oven",           watts: 1000, pct: 50 },
      { name: "Rice Cooker",              watts: 700,  pct: 50 },
      { name: "Electric Kettle",          watts: 1500, pct: 20 },
      { name: "Refrigerator (Small)",     watts: 100,  pct: 100 },
      { name: "Refrigerator (Medium)",    watts: 150,  pct: 100 },
      { name: "Refrigerator (Large)",     watts: 250,  pct: 100 },
      { name: "Electric Oven / Toaster",  watts: 1200, pct: 25 },
      { name: "Dishwasher",               watts: 1500, pct: 25 },
      { name: "Blender / Mixer",          watts: 350,  pct: 15 },
      { name: "Coffee Maker",             watts: 800,  pct: 15 },
      { name: "Food Processor",           watts: 500,  pct: 15 },
      { name: "Electric Grill / Griddle", watts: 1500, pct: 20 },
    ]
  },
  {
    category: "🛁 Bathroom / Utility",
    items: [
      { name: "Electric Water Heater (Instant)", watts: 3500, pct: 25 },
      { name: "Electric Water Heater (Storage)", watts: 1500, pct: 30 },
      { name: "Washing Machine (Auto)",   watts: 500,  pct: 35 },
      { name: "Washing Machine (Semi-Auto)", watts: 350, pct: 35 },
      { name: "Clothes Dryer",            watts: 2000, pct: 25 },
      { name: "Vacuum Cleaner",           watts: 1000, pct: 10 },
      { name: "Electric Fan (Stand)",     watts: 60,   pct: 80 },
      { name: "Electric Fan (Desk)",      watts: 35,   pct: 80 },
      { name: "Exhaust Fan",              watts: 30,   pct: 60 },
      { name: "Hair Dryer",               watts: 1200, pct: 10 },
      { name: "Electric Iron",            watts: 1000, pct: 15 },
    ]
  },
  {
    category: "📺 Entertainment & Office",
    items: [
      { name: "LED TV 32\"",              watts: 50,   pct: 60 },
      { name: "LED TV 43\"",              watts: 80,   pct: 60 },
      { name: "LED TV 55\"",              watts: 120,  pct: 60 },
      { name: "Desktop Computer",         watts: 250,  pct: 50 },
      { name: "Laptop / Notebook",        watts: 65,   pct: 60 },
      { name: "Wi-Fi Router / Modem",     watts: 15,   pct: 100 },
      { name: "Printer / Scanner",        watts: 200,  pct: 10 },
      { name: "Gaming Console",           watts: 150,  pct: 30 },
      { name: "Sound System / Speaker",   watts: 100,  pct: 40 },
      { name: "Set-Top Box / Receiver",   watts: 20,   pct: 70 },
    ]
  },
  {
    category: "🔌 General / Other",
    items: [
      { name: "General Receptacle Outlet",watts: 180,  pct: 100 },
      { name: "Water Pump (0.5HP)",       watts: 370,  pct: 30 },
      { name: "Water Pump (1HP)",         watts: 746,  pct: 30 },
      { name: "Sump Pump",                watts: 500,  pct: 20 },
      { name: "Gate Motor / Garage Door", watts: 400,  pct: 5  },
      { name: "Security Camera (per unit)",watts: 15,  pct: 100 },
      { name: "Electric Vehicle Charger", watts: 7200, pct: 30 },
      { name: "UPS / Battery Backup",     watts: 500,  pct: 50 },
      { name: "Custom / Other",           watts: 100,  pct: 100 },
    ]
  }
];

// Flat lookup map: name → { watts, pct }
const APPLIANCE_MAP = {};
APPLIANCE_CATEGORIES.forEach(cat => cat.items.forEach(item => { APPLIANCE_MAP[item.name] = { watts: item.watts, pct: item.pct }; }));
const CUSTOM_OPTION = "Custom / Other";


// ─── PLAN CHECKER ────────────────────────────────────────────────────────────
const SEV_CFG = {
  CRITICAL: { bg:"rgba(239,68,68,0.08)",  border:"rgba(239,68,68,0.25)",  text:"#ef4444", badge:"#ef4444" },
  WARNING:  { bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.25)", text:"#f59e0b", badge:"#f59e0b" },
  INFO:     { bg:"rgba(59,130,246,0.08)", border:"rgba(59,130,246,0.25)", text:"#3b82f6", badge:"#3b82f6" },
};
const STATUS_COL = { "NON-COMPLIANT":"#ef4444","COMPLIANT WITH WARNINGS":"#f59e0b","COMPLIANT":"#10b981" };
const CL_LABELS = {
  wireSizing:{l:"Wire Sizing",a:"Art. 2.30"},overcurrentProtection:{l:"Overcurrent",a:"Art. 2.40"},
  grounding:{l:"Grounding",a:"Art. 2.50"},loadCalculation:{l:"Load Calc",a:"Art. 2.20"},
  branchCircuits:{l:"Branch Circuits",a:"Art. 2.10"},panelboard:{l:"Panelboards",a:"Art. 3.84"},
  serviceEntrance:{l:"Service Entrance",a:"Art. 2.30"},lighting:{l:"Lighting",a:"Art. 3.30"},
  fsic:{l:"Fire Code",a:"RA 9514"},greenBuilding:{l:"Green Building",a:"PGBC"},shortCircuit:{l:"Short Circuit",a:"Art. 2.40"},
};


function VoltageDropCalc({ electricalData, calcState, onStateChange }) {
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
function ShortCircuitCalc({ electricalData, calcState, onStateChange }) {
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
  useEffect(() => {
    if (!ed || Object.keys(ed).length === 0) return;
    if (ed.voltage   != null) { setVoltage(+ed.voltage);   setFp(p=>({...p,voltage:true})); }
    if (ed.phases    != null) { setPhases(+ed.phases);     setFp(p=>({...p,phases:true})); }
    if (ed.xfmrKVA   != null) { setXfmrKVA(+ed.xfmrKVA);  setFp(p=>({...p,xfmrKVA:true})); }
    if (ed.xfmrZ     != null) { setXfmrZ(+ed.xfmrZ);      setFp(p=>({...p,xfmrZ:true})); }
    if (ed.cableLen  != null) { setCableLen(+ed.cableLen); setFp(p=>({...p,cableLen:true})); }
    if (ed.cableSize != null) { setCableSize(ed.cableSize);setFp(p=>({...p,cableSize:true})); }
    if (ed.material  != null) { setMaterial(ed.material); }
  }, [electricalData]);
  useEffect(() => {
    if (onStateChange) onStateChange({ voltage, phases, xfmrKVA, xfmrZ, cableLen, cableSize, material, existingFLA });
  }, [voltage, phases, xfmrKVA, xfmrZ, cableLen, cableSize, material, existingFLA]);

  const R_cable = material==="aluminum"
    ? (WIRE_DATA[cableSize]?.resistance||0.002061)*1.64
    : WIRE_DATA[cableSize]?.resistance || 0.002061;

  // Transformer impedance referred to LV
  const Zxfmr  = (xfmrZ / 100) * ((voltage * voltage) / (xfmrKVA * 1000));
  const Rcable  = R_cable * cableLen * 2;
  const Xcable  = 0.0492e-3 * cableLen * 2; // approx reactance
  const Xtxfmr  = Zxfmr * 0.95; // typical X/R ~20 → X≈95%Z
  const Rtxfmr  = Zxfmr * 0.05;
  const Rtotal  = Rtxfmr + Rcable;
  const Xtotal  = Xtxfmr + Xcable;
  const Ztotal  = Math.sqrt(Rtotal*Rtotal + Xtotal*Xtotal);

  const sqrtFactor = phases===3 ? Math.sqrt(3) : 1;
  const Isc_sym  = voltage / (sqrtFactor * Ztotal);
  const Isc_asym = Isc_sym * 1.414 * Math.exp(-Math.PI * Rtotal / Xtotal);
  const Isc_peak = Isc_sym * Math.sqrt(2) * (1 + Math.exp(-Math.PI * Rtotal / Xtotal));

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
function LoadCalc({ electricalData, calcState, onStateChange }) {
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
  const buildLoads = (raw) => raw.map((l,i) => ({
    id: i+1, name: l.name||"Custom Load",
    watts: +(l.watts||0), pct: +(l.qty||l.pct||100),
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
function NoKeyBanner() {
  const hasKey = getKey().startsWith("sk-");
  if (hasKey) return null;
  return (
    <div style={{background:"rgba(245,158,11,0.08)",border:"1.5px solid rgba(245,158,11,0.35)",borderRadius:12,padding:"12px 18px",marginBottom:18,display:"flex",alignItems:"center",gap:12}}>
      <span style={{fontSize:22}}>🔑</span>
      <div>
        <div style={{fontWeight:700,fontSize:13,color:"#f59e0b",marginBottom:2}}>API Key Required</div>
        <div style={{fontSize:12,color:"#a3a3a3",lineHeight:1.5}}>
          Paste your Anthropic API key into the <strong style={{color:"#f59e0b"}}>🔑 field in the top navigation bar</strong> and press <strong>Enter</strong> or click <strong>Save</strong>. The key starts with <code style={{background:"rgba(255,255,255,0.08)",padding:"1px 5px",borderRadius:3}}>sk-ant-</code>.
        </div>
      </div>
    </div>
  );
}

function PlanChecker({ apiKey, externalResult=null, onResultChange=null, onDataExtracted=null }) {
  const [files, setFiles]   = useState([]);
  const [busy, setBusy]     = useState(false);
  const [busyMsg, setBusyMsg] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError]         = useState(null);
  const [drag, setDrag]           = useState(false);
  const [tab, setTab]             = useState("all");
  const [open, setOpen]           = useState({});
  const [checked, setChecked]     = useState({});
  const [corrections, setCorrections] = useState(null);
  const [correcting, setCorrecting]   = useState(false);
  const [revNum, setRevNum]           = useState(1);
  const ref = useRef(null);
  const tick = () => new Promise(r => setTimeout(r, 0));

  const addFiles = useCallback(fs=>{
    setFiles(p=>[...p,...Array.from(fs).map(f=>({file:f,id:Math.random().toString(36).slice(2),name:f.name,size:f.size,type:f.type||"application/octet-stream"}))]);
    setError(null); // preserve existing result when adding more files
  },[]);

  // Sync external result → local state (handles both navigation and session restore)
  useEffect(()=>{ setResult(externalResult||null); if(externalResult){ setTab("all"); setOpen({}); setChecked({}); } },[externalResult]);

  const run = async () => {
    if(!files.length) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const blocks=[];
      for(let i=0;i<files.length;i++){
        const fo=files[i];
        setBusyMsg(`📂 Reading file ${i+1} of ${files.length}: ${fo.name}…`); await tick();
        const b64 = fo.type.startsWith("image/") ? (setBusyMsg(`🗜️ Compressing ${fo.name}…`), await tick(), await compressImage(fo.file)) : await toBase64(fo.file);
        if(fo.type.startsWith("image/")) { blocks.push({type:"image",source:{type:"base64",media_type:"image/jpeg",data:b64}}); blocks.push({type:"text",text:`[Image: ${fo.name}]`}); }
        else if(fo.type==="application/pdf") { blocks.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}}); blocks.push({type:"text",text:`[PDF: ${fo.name}]`}); }
        else blocks.push({type:"text",text:`[File: ${fo.name}]`});
      }
      blocks.push({type:"text",text:`You are reviewing these electrical plans as a licensed PEE.

STEP 1 — READ: Scan every page. Note voltage system, load schedule, conductor sizes, breaker ratings, panel details.
STEP 2 — MISSING DATA: Identify every required schedule, calculation, or spec that is absent from the plans.
STEP 3 — CHECK: For each PEC article in your checklist, state PASS, FAIL, or CANNOT VERIFY with reason.
STEP 4 — EXTRACT: Populate the extracted field with all numerical data visible in the plans for use in calculators.
STEP 5 — OUTPUT: Return complete JSON per the schema. Include ALL violations. Do not truncate.

Return only valid JSON — no markdown, no preamble.`});
      setBusyMsg("🤖 AI is checking PEC 2017 compliance…"); await tick();
      const data = await callAI({ apiKey, system:PEC_SYSTEM_PROMPT, messages:[{role:"user",content:blocks}] });
      const raw = data.content?.map(b=>b.text||"").join("");
      const parsed = repairJSON(raw.replace(/```json|```/g,"").trim());
      if(!parsed) throw new Error("Could not parse AI response. Try uploading fewer pages or a smaller file.");
      setResult(parsed);
      if(onResultChange) onResultChange(parsed);
        if(onDataExtracted && parsed.extracted) onDataExtracted(parsed.extracted);
        setOpen({}); setTab("all"); setChecked({}); setCorrections(null);
      addHistoryEntry({ tool:"electrical", module:"electrical", projectName:parsed?.summary?.projectName||"Electrical Check", meta:{ status:parsed?.summary?.overallStatus, findings:(parsed?.findings?.length||0), summary:parsed?.summary?.analysisNotes||"" } });
      // Direct save — no React state, no callbacks, always works
      try { localStorage.setItem("buildify_session_electrical", JSON.stringify({ checkerResult: parsed, _savedAt: new Date().toISOString(), _module: "electrical", userId: "local" })); } catch(e) { console.warn("Session save failed", e); }
    } catch(e) { setError(e.message||"Analysis failed."); }
    finally { setBusy(false); setBusyMsg(""); }
  };

  const findings = result?.findings||[];
  const filtered = tab==="all" ? findings : findings.filter(f=>f.severity===tab);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const allChecked = findings.length > 0 && findings.every(f => checked[f.id]);

  const toggleAll = () => {
    if (allChecked) setChecked({});
    else { const all={}; findings.forEach(f=>all[f.id]=true); setChecked(all); }
  };

  const generateCorrections = async () => {
    const selected = findings.filter(f => checked[f.id]);
    if (!selected.length) return;
    setCorrecting(true); setCorrections(null);
    try {
      const hdrs = {"Content-Type":"application/json"};
      if(apiKey) hdrs["x-api-key"]=apiKey;
      const prompt = `You are a licensed PEE. For each finding below, generate specific drafting correction instructions for a CAD draftsman.

Findings to correct:
${selected.map((f,i)=>`${i+1}. [${f.severity}] ${f.title} — ${f.description} (${f.pecReference})`).join("\n")}

Respond ONLY as valid JSON array (no markdown):
[{"id":${selected[0]?.id},"title":"...","severity":"...","description":"...","pecReference":"...","recommendation":"...","correctedValues":"Specific corrected value e.g. Change wire from #12 AWG to #10 AWG, upgrade breaker from 20A to 30A","draftingInstruction":"Exact instruction for draftsman e.g. On Sheet E-2, Panel Schedule, revise circuit 3 wire size notation from #12 AWG THWN to #10 AWG THWN. Add revision cloud around affected area."}]

Be very specific with corrected values and drafting instructions. Reference typical drawing sheet names (E-1, E-2, etc.).`;

      const data = await callAI({ apiKey, messages:[{role:"user",content:prompt}], max_tokens:4000 });
      const raw = data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(raw);
      setCorrections(parsed);
    } catch(e) { alert("Could not generate corrections: "+e.message); }
    finally { setCorrecting(false); }
  };

  return (
    <div>
      <NoKeyBanner/>
      {/* Drop zone */}
      <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files)}}
        onClick={()=>ref.current?.click()}
        style={{ border:`2px dashed ${drag?T.accent:T.border}`, borderRadius:16, padding:"40px 24px", textAlign:"center", cursor:"pointer", background:drag?T.accentDim:"rgba(255,255,255,0.01)", transition:"all 0.2s", marginBottom:20 }}>
        <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.dwg,.dxf" onChange={e=>addFiles(e.target.files)} style={{display:"none"}}/>
        <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
        <div style={{ fontWeight:700, fontSize:16, color:T.text, marginBottom:6 }}>Drop your electrical plans here</div>
        <div style={{ color:T.muted, fontSize:13, marginBottom:16 }}>PDF drawings · JPG / PNG images · Excel load schedules</div>
        <div style={{ display:"inline-block", background:`linear-gradient(135deg,${T.accent},#f97316)`, color:"#000", fontWeight:700, padding:"9px 22px", borderRadius:10, fontSize:14 }}>Choose Files</div>
      </div>

      {/* File chips */}
      {files.length>0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
          {files.map(fo=>(
            <div key={fo.id} style={{ background:T.dim, border:`1px solid ${T.border}`, borderRadius:8, padding:"7px 10px", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:18 }}>{fo.type.startsWith("image")?"🖼️":fo.type==="application/pdf"?"📄":"📎"}</span>
              <div>
                <div style={{ fontSize:12, color:T.text, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{fo.name}</div>
                <div style={{ fontSize:10, color:T.muted }}>{fmtSize(fo.size)}</div>
              </div>
              <button onClick={()=>setFiles(p=>p.filter(f=>f.id!==fo.id))} style={{ background:"rgba(239,68,68,0.12)", border:"none", color:T.danger, width:22, height:22, borderRadius:5, cursor:"pointer", fontSize:12 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {files.length>0 && (
        <button onClick={run} disabled={busy} style={{ width:"100%", background:busy?"rgba(245,158,11,0.2)":`linear-gradient(135deg,${T.accent},#f97316)`, border:"none", color:busy?"#666":"#000", fontWeight:700, fontSize:15, padding:"14px", borderRadius:12, cursor:busy?"not-allowed":"pointer", marginBottom:20, boxShadow:busy?"none":"0 6px 24px rgba(245,158,11,0.25)", transition:"all 0.2s" }}>
          {busy ? (busyMsg || "⚙️ Analyzing…") : `⚡ Run Full Compliance Check  (${files.length} file${files.length>1?"s":""})`}
        </button>
      )}

      {error && <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"12px 16px", marginBottom:20, color:T.danger, fontSize:14 }}>⚠️ {error}</div>}

      {result?.summary && (
        <div style={{ animation:"fadeIn 0.35s ease" }}>
          {/* Summary card */}
          <Card style={{ marginBottom:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:20, alignItems:"start" }}>
              <div>
                <div style={{ fontSize:11, color:T.muted, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:6 }}>Compliance Assessment</div>
                <div style={{ fontSize:22, fontWeight:800, color:T.text, marginBottom:6 }}>{result.summary.projectName}</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                  {[result.summary.occupancyType, result.summary.fileType].filter(Boolean).map(t=>(
                    <span key={t} style={{ background:T.dim, padding:"2px 10px", borderRadius:20, fontSize:11, color:T.muted }}>{t}</span>
                  ))}
                </div>
                <div style={{ color:T.muted, fontSize:13, marginBottom:18, lineHeight:1.6 }}>{result.summary.analysisNotes}</div>
                <div style={{ display:"flex", gap:24 }}>
                  {[{l:"Critical",c:result.summary.criticalCount,col:"#ef4444"},{l:"Warnings",c:result.summary.warningCount,col:"#f59e0b"},{l:"Info",c:result.summary.infoCount,col:"#3b82f6"}].map(x=>(
                    <div key={x.l} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:28, fontWeight:800, color:x.col, lineHeight:1 }}>{x.c}</div>
                      <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{x.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"flex-end" }}>
                <div style={{ background:`${STATUS_COL[result.summary.overallStatus]}14`, border:`2px solid ${STATUS_COL[result.summary.overallStatus]}44`, borderRadius:12, padding:"10px 18px", textAlign:"center", minWidth:160 }}>
                  <div style={{ fontSize:10, color:T.muted, marginBottom:4, letterSpacing:"0.5px" }}>OVERALL STATUS</div>
                  <div style={{ fontSize:13, fontWeight:800, color:STATUS_COL[result.summary.overallStatus] }}>{result.summary.overallStatus}</div>
                </div>
                <button onClick={()=>exportPDF(result,findings)} style={{ background:`linear-gradient(135deg,${T.accent},#f97316)`, border:"none", color:"#000", fontWeight:700, padding:"8px 16px", borderRadius:10, cursor:"pointer", fontSize:13 }}>📄 Export PDF</button>
              </div>
            </div>
          </Card>

          {/* Checklist */}
          <Card style={{ marginBottom:16 }}>
            <Label>PEC Compliance Checklist</Label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(170px, 1fr))", gap:8, marginTop:10 }}>
              {Object.entries(CL_LABELS).map(([k,info])=>{
                const v=result.checklist?.[k];
                const col=v===null?T.muted:v?T.success:T.danger;
                const icon=v===null?"—":v?"✓":"✗";
                return (
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:10, background:T.dim, borderRadius:8, padding:"8px 12px" }}>
                    <span style={{ color:col, fontWeight:800, fontSize:16, width:18 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize:12, color:v===null?T.muted:T.text }}>{info.l}</div>
                      <div style={{ fontSize:10, color:T.muted }}>{info.a}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Findings */}
          {findings.length>0 && (
            <div>
              {/* Filter tabs + Select All */}
              <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {["all","CRITICAL","WARNING","INFO"].map(t=>{
                    const cnt=t==="all"?findings.length:findings.filter(f=>f.severity===t).length;
                    const active=tab===t;
                    return <button key={t} onClick={()=>setTab(t)} style={{ padding:"7px 16px", borderRadius:8, border:`1.5px solid ${active?T.accent:T.border}`, background:active?T.accentDim:"transparent", color:active?T.accent:T.muted, cursor:"pointer", fontSize:12, fontWeight:700, transition:"all 0.15s" }}>{t==="all"?"All":t} ({cnt})</button>;
                  })}
                </div>
                <button onClick={toggleAll} style={{ padding:"7px 14px", borderRadius:8, border:`1.5px solid ${T.border}`, background:"transparent", color:T.muted, cursor:"pointer", fontSize:12, fontWeight:600 }}>
                  {allChecked ? "☑ Deselect All" : "☐ Select All"}
                </button>
              </div>

              {/* Finding cards with checkboxes */}
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
                {filtered.map(f=>{
                  const cfg=SEV_CFG[f.severity]||SEV_CFG.INFO;
                  const isOpen=open[f.id];
                  const isChecked=!!checked[f.id];
                  return (
                    <div key={f.id} style={{ background:isChecked?`${cfg.bg}`:"rgba(255,255,255,0.01)", border:`1.5px solid ${isChecked?cfg.border:T.border}`, borderRadius:12, overflow:"hidden", transition:"all 0.15s" }}>
                      <div style={{ padding:"13px 18px", display:"flex", alignItems:"flex-start", gap:12 }}>
                        {/* Checkbox */}
                        <div
                          onClick={()=>setChecked(p=>({...p,[f.id]:!p[f.id]}))}
                          style={{ width:20, height:20, borderRadius:5, border:`2px solid ${isChecked?cfg.badge:T.muted}`, background:isChecked?cfg.badge:"transparent", cursor:"pointer", flexShrink:0, marginTop:2, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}
                        >
                          {isChecked && <span style={{ color:"#fff", fontSize:12, fontWeight:800, lineHeight:1 }}>✓</span>}
                        </div>
                        {/* Content — click to expand */}
                        <div style={{ flex:1, minWidth:0, cursor:"pointer" }} onClick={()=>setOpen(p=>({...p,[f.id]:!p[f.id]}))}>
                          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:4, alignItems:"center" }}>
                            <span style={{ background:cfg.badge, color:"#fff", fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:4 }}>{f.severity}</span>
                            {f.confidence && <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:4,
                              background:f.confidence==="HIGH"?"rgba(22,163,74,0.15)":f.confidence==="LOW"?"rgba(239,68,68,0.12)":"rgba(234,179,8,0.12)",
                              color:f.confidence==="HIGH"?"#16a34a":f.confidence==="LOW"?"#ef4444":"#ca8a04",
                              border:`1px solid ${f.confidence==="HIGH"?"rgba(22,163,74,0.3)":f.confidence==="LOW"?"rgba(239,68,68,0.3)":"rgba(234,179,8,0.3)"}`
                            }}>{f.confidence==="HIGH"?"● HIGH CONFIDENCE":f.confidence==="LOW"?"◌ LOW CONFIDENCE":"◑ MEDIUM CONF."}</span>}
                            <span style={{ fontSize:11, color:T.muted, fontFamily:"monospace" }}>{f.pecReference}</span>
                            <span style={{ fontSize:11, color:T.muted, background:"rgba(255,255,255,0.04)", padding:"1px 8px", borderRadius:4 }}>{f.category}</span>
                          </div>
                          <div style={{ fontWeight:700, fontSize:14, color:T.text }}>{f.title}</div>
                        </div>
                        <span style={{ color:T.muted, fontSize:12, marginTop:2, flexShrink:0, cursor:"pointer" }} onClick={()=>setOpen(p=>({...p,[f.id]:!p[f.id]}))}>{isOpen?"▲":"▼"}</span>
                      </div>
                      {isOpen && (
                        <div style={{ padding:"0 18px 16px 50px", borderTop:`1px solid ${cfg.border}` }}>
                          <div style={{ paddingTop:12, display:"flex", flexDirection:"column", gap:10 }}>
                            <div><Label>Finding</Label><div style={{ fontSize:13, color:T.muted, lineHeight:1.6 }}>{f.description}</div></div>
                            <div><Label>Recommendation</Label><div style={{ fontSize:13, color:T.success, lineHeight:1.6 }}>✓ {f.recommendation}</div></div>
                            {f.codeBasis && <div style={{ background:"rgba(0,0,0,0.2)", borderLeft:`3px solid ${cfg.border}`, padding:"10px 14px", borderRadius:"0 8px 8px 0", fontSize:12, color:T.muted, fontStyle:"italic", lineHeight:1.5 }}>{f.codeBasis}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Correction action bar */}
              {checkedCount > 0 && (
                <div style={{ background:T.accentDim, border:`1.5px solid rgba(245,158,11,0.3)`, borderRadius:12, padding:"16px 20px", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, animation:"fadeIn 0.2s ease" }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:T.accent }}>{checkedCount} error{checkedCount>1?"s":""} selected for correction</div>
                    <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>AI will generate specific drafting instructions for each selected item</div>
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <Label>Revision No.</Label>
                      <input type="number" value={revNum} min={1} max={99} onChange={e=>setRevNum(+e.target.value)} style={{ width:60, background:"#0f1117", border:`1.5px solid ${T.border}`, borderRadius:8, padding:"6px 10px", color:T.text, fontSize:14, fontWeight:700, outline:"none", textAlign:"center" }}/>
                    </div>
                    <button onClick={generateCorrections} disabled={correcting} style={{ background:correcting?"rgba(245,158,11,0.3)":`linear-gradient(135deg,${T.accent},#f97316)`, border:"none", color:correcting?"#666":"#000", fontWeight:700, padding:"10px 20px", borderRadius:10, cursor:correcting?"not-allowed":"pointer", fontSize:13, transition:"all 0.2s" }}>
                      {correcting ? "⚙️ Generating…" : "🤖 Generate Corrections"}
                    </button>
                  </div>
                </div>
              )}

              {/* Corrections result panel */}
              {corrections && (
                <div style={{ background:"rgba(16,185,129,0.05)", border:"1.5px solid rgba(16,185,129,0.25)", borderRadius:12, padding:20, marginBottom:16, animation:"fadeIn 0.3s ease" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:15, color:T.success }}>✅ Corrections Generated — Rev {revNum}</div>
                      <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{corrections.length} drafting instruction{corrections.length>1?"s":""} ready for your draftsman</div>
                    </div>
                    <button onClick={()=>exportRevisionPDF(result, corrections, revNum)} style={{ background:`linear-gradient(135deg,${T.success},#059669)`, border:"none", color:"#fff", fontWeight:700, padding:"10px 20px", borderRadius:10, cursor:"pointer", fontSize:13, boxShadow:"0 4px 14px rgba(16,185,129,0.3)" }}>
                      📄 Download Revision PDF
                    </button>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {corrections.map((c,i)=>(
                      <div key={c.id||i} style={{ background:T.dim, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
                          <span style={{ background:"#1f2937", color:T.accent, fontSize:11, fontWeight:800, padding:"2px 10px", borderRadius:4, letterSpacing:"0.5px" }}>REV-{String(i+1).padStart(2,"0")}</span>
                          <span style={{ fontSize:12, fontWeight:700, color:T.text }}>{c.title}</span>
                          <span style={{ fontSize:11, color:T.muted, fontFamily:"monospace" }}>{c.pecReference}</span>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                          <div style={{ background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:8, padding:"10px 12px" }}>
                            <div style={{ fontSize:10, fontWeight:700, color:T.accent, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>📐 Corrected Value</div>
                            <div style={{ fontSize:13, color:T.text, lineHeight:1.6 }}>{c.correctedValues||c.recommendation}</div>
                          </div>
                          <div style={{ background:"rgba(16,185,129,0.07)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:8, padding:"10px 12px" }}>
                            <div style={{ fontSize:10, fontWeight:700, color:T.success, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>✏️ Drafting Instruction</div>
                            <div style={{ fontSize:13, color:T.text, lineHeight:1.6 }}>{c.draftingInstruction||"Apply correction as indicated"}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div style={{ marginTop:20, padding:"10px 16px", background:T.dim, borderRadius:10, fontSize:12, color:T.muted, lineHeight:1.5 }}>
            ⚠️ AI-generated report for reference only. All plans must be reviewed and stamped by a licensed PEE before submission to MERALCO, LGU, or DPWH.
          </div>
        </div>
      )}

      {!files.length && !result && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10, marginTop:4 }}>
          {[{i:"🏠",t:"Residential",d:"House wiring, circuits, panels"},{i:"🏢",t:"Commercial",d:"Office, mall, GFCI/AFCI"},{i:"🔥",t:"FSIC / Fire Code",d:"Emergency lights, exit signs"},{i:"🌱",t:"Green Building",d:"LPD, sub-metering"}].map(x=>(
            <Card key={x.t} style={{ textAlign:"center", padding:18 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{x.i}</div>
              <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:4 }}>{x.t}</div>
              <div style={{ fontSize:11, color:T.muted, lineHeight:1.5 }}>{x.d}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STRUCTURAL CODE DATA ────────────────────────────────────────────────────

const NSCP_EXTRACTION_PROMPT = `You are a licensed Professional Civil/Structural Engineer (PSCE). Extract all computable engineering parameters from the uploaded structural plans.

Return ONLY valid JSON — no markdown, no preamble. Use null for any value not found in the plans.

{
  "building": {
    "name": "project name or null",
    "occupancy": "Residential|Commercial|Industrial|Institutional|null",
    "floors": null,
    "floorHeight": null,
    "totalHeight": null,
    "floorArea": null
  },
  "seismic": {
    "zone": "Zone 2|Zone 4|null",
    "soilType": "SA|SB|SC|SD|SE|SF|null",
    "soilTypeLabel": "e.g. SD - Stiff Soil or null",
    "occupancyCategory": "I - Standard|II - Essential|III - Hazardous|null",
    "seismicWeight": null,
    "naturalPeriod": null,
    "responseFactor": null
  },
  "materials": {
    "fc": null,
    "fy": null,
    "coverBeam": null,
    "coverColumn": null,
    "coverSlab": null
  },
  "beams": [
    { "id": "B1", "span": null, "width": null, "depth": null, "Mu": null, "Vu": null }
  ],
  "columns": [
    { "id": "C1", "width": null, "height": null, "Pu": null, "Mu": null, "type": "tied|spiral|null" }
  ],
  "footings": [
    { "id": "F1", "columnLoad": null, "soilBearing": null, "depth": null }
  ],
  "slabs": [
    { "id": "S1", "span": null, "thickness": null, "type": "one-way|two-way|null", "DL": null, "LL": null }
  ],
  "loads": {
    "floorDL": null,
    "floorLL": null,
    "roofDL": null,
    "roofLL": null
  }
}`;

const NSCP_SYSTEM_PROMPT = `You are a licensed Professional Civil/Structural Engineer (PSCE) with deep expertise in:
- NSCP 2015 7th Edition (primary reference)
- DPWH Blue Book (Design Guidelines, Criteria and Standards)
- ACI 318-14 (referenced by NSCP for concrete design)
- AISC 360 (referenced by NSCP for steel design)
- ASCE 7-10 (referenced by NSCP for load combinations)
- PHIVOLCS seismic hazard maps for Philippine seismic zones

REVIEW PROCESS — follow these steps before writing output:
1. Read ALL uploaded pages carefully. Note the project name, structure type, materials, dimensions.
2. Identify what IS shown and what is MISSING (missing specs are findings, not silence).
3. For each code section below, determine: PASS, FAIL, or CANNOT VERIFY (insufficient data shown).
4. A finding must cite the EXACT section number, describe the violation precisely, and state the required value.
5. Do not invent violations. Do not omit real ones. Flag CANNOT VERIFY items as INFO severity.

CHECK ALL OF THE FOLLOWING — no cap on findings:
LOAD COMBINATIONS
- NSCP Sec. 203.3: Verify U = 1.2D + 1.6L, 1.2D + 1.0E + 1.0L, 0.9D + 1.0W etc. are explicitly shown or noted
- NSCP Sec. 203.4: Serviceability checks (deflection limits L/240, L/360)

SEISMIC DESIGN
- NSCP Sec. 208.4: Seismic zone classification (Philippines: Zone 2 or Zone 4) — verify matches PHIVOLCS map for the project location
- NSCP Sec. 208.5: Design base shear V = (Cv×I / R×T) × W — check if Z, I, R, Cv, Ca values are explicitly stated
- NSCP Sec. 208.6: Seismic dead load W includes partitions, permanent equipment
- NSCP Sec. 208.7: Diaphragm design, irregularity checks for torsion
- NSCP Sec. 208.8: Drift limits (0.02h for Zone 4)

WIND LOAD
- NSCP Sec. 207.5: Wind speed map compliance — Metro Manila 200 kph, minimum
- NSCP Sec. 207.6: Exposure category, Kz, GCp, GCpi factors
- NSCP Sec. 207.9: Roof uplift calculations explicitly shown

CONCRETE DESIGN
- NSCP Sec. 403: f'c ≥ 21 MPa for structural elements; fy for main bars and ties
- NSCP Sec. 405: Minimum concrete cover per exposure class (exterior 50mm, interior 40mm)
- NSCP Sec. 406/407/408: Beam/column/slab minimum steel ratios (ρmin = 1.4/fy for beams)
- NSCP Sec. 408: Slab minimum thickness per span/20 (simply supported), span/24 (continuous)
- NSCP Sec. 409: Shear reinforcement — stirrups at d/2 max spacing in non-critical zones, d/4 in critical
- NSCP Sec. 410: Column ties spacing ≤ 16db, 48 tie diameters, or least column dimension
- NSCP Sec. 411: Lap splice lengths per NSCP Table 412.3

FOUNDATION
- NSCP Sec. 303: Allowable bearing capacity vs. soil investigation report
- NSCP Sec. 304: Minimum footing depth 600mm below natural grade
- NSCP Sec. 305: Pile design if soil report requires

STEEL (if applicable)
- NSCP Sec. 502: ASTM A36 or A572 Gr50 material specification
- NSCP Sec. 506: Connection design — bolt grades, weld types explicitly shown
- NSCP Sec. 508: Slenderness ratio limits (KL/r ≤ 200 for compression)

DETAILING QUALITY
- Are rebar schedules present and complete?
- Are all sections/details cross-referenced to plan locations?
- Is the title block complete with PRC license number of PSCE?

CONFIDENCE GUIDANCE:
- Use CRITICAL for clear code violations where the plan shows non-compliant values
- Use WARNING for likely violations where key data is missing (cannot verify compliance)
- Use INFO for best-practice recommendations or items requiring field verification
- Set confidence: "HIGH" if you can see the actual values in the plans, "MEDIUM" if inferred, "LOW" if assumed from project type

Respond ONLY as valid JSON (no markdown, no preamble):
{
  "summary": {
    "projectName": "string",
    "projectLocation": "city/province if shown or null",
    "structureType": "Residential|Commercial|Industrial|Bridge|Retaining Wall|Unknown",
    "numberOfStoreys": null,
    "fileType": "string",
    "overallStatus": "NON-COMPLIANT|COMPLIANT WITH WARNINGS|COMPLIANT",
    "criticalCount": 0,
    "warningCount": 0,
    "infoCount": 0,
    "analysisNotes": "2-3 sentence professional summary of the most critical issues",
    "cannotVerifyItems": ["list of items that could not be checked due to missing plan data"]
  },
  "findings": [
    {
      "id": 1,
      "severity": "CRITICAL|WARNING|INFO",
      "confidence": "HIGH|MEDIUM|LOW",
      "category": "Load Combination|Seismic|Wind|Concrete|Steel|Foundation|Beam/Column|Slab|Connection|Materials|Detailing|Other",
      "nscpReference": "NSCP 2015 Sec. X.X.X",
      "title": "concise title under 10 words",
      "description": "precise technical description — state the observed value, the required value, and the specific code requirement violated. Do not truncate.",
      "recommendation": "specific corrective action with target values",
      "codeBasis": "exact code language or formula referenced"
    }
  ],
  "checklist": {
    "loadCombinations": true,
    "seismicDesign": true,
    "windLoad": true,
    "concreteDesign": true,
    "steelDesign": null,
    "foundationDesign": true,
    "beamColumnDetailing": true,
    "slabDesign": true,
    "connectionDesign": null,
    "materialSpecs": true
  }
}`;

// Seismic zone data for Philippines (NSCP 2015 Section 208)
const PH_SEISMIC_ZONES = {
  "Zone 2": { Z: 0.20, desc: "Low seismicity — Palawan, parts of Mindanao" },
  "Zone 4": { Z: 0.40, desc: "High seismicity — most of Luzon, Visayas, Mindanao" },
};

const SOIL_TYPES = {
  "SA - Hard Rock":        { Fa: 0.8,  Fv: 0.8  },
  "SB - Rock":             { Fa: 1.0,  Fv: 1.0  },
  "SC - Very Dense Soil":  { Fa: 1.2,  Fv: 1.7  },
  "SD - Stiff Soil":       { Fa: 1.6,  Fv: 2.4  },
  "SE - Soft Clay":        { Fa: 2.5,  Fv: 3.5  },
};

const OCCUPANCY_I = {
  "I - Standard":  1.0,
  "II - Essential": 1.25,
  "III - Hazardous": 1.5,
};

// Concrete mix design (MPa)
const CONCRETE_GRADES = { "f'c 17.2 (2500 psi)":17.2, "f'c 20.7 (3000 psi)":20.7, "f'c 24.1 (3500 psi)":24.1, "f'c 27.6 (4000 psi)":27.6, "f'c 34.5 (5000 psi)":34.5 };
const REBAR_GRADES    = { "Grade 40 (276 MPa)":276, "Grade 60 (414 MPa)":414, "Grade 75 (517 MPa)":517 };

// Philippine standard deformed bar sizes (ASTM A615 / PNS 49)
const PH_BAR_SIZES = [
  { dia:10, area:78.54,  label:"10mm",  weight:0.617 },
  { dia:12, area:113.10, label:"12mm",  weight:0.888 },
  { dia:16, area:201.06, label:"16mm",  weight:1.578 },
  { dia:20, area:314.16, label:"20mm",  weight:2.466 },
  { dia:25, area:490.87, label:"25mm",  weight:3.853 },
  { dia:28, area:615.75, label:"28mm",  weight:4.834 },
  { dia:32, area:804.25, label:"32mm",  weight:6.313 },
  { dia:36, area:1017.9, label:"36mm",  weight:7.990 },
];

// Pick the optimal bar: fewest bars that meet As_req with standard sizes, min 2 bars
const selectBars = (As_req, sectionWidth) => {
  // Try each bar size, pick smallest dia where n_bars is practical
  for (const bar of PH_BAR_SIZES) {
    const n = Math.ceil(As_req / bar.area);
    if (n < 2) continue;
    // Check spacing: width - 2*cover(40) - 2*stirrup(10) - n*dia >= (n-1)*25mm min clear
    const clearSpace = (sectionWidth - 80 - 20 - n*bar.dia);
    if (n <= 2 || clearSpace >= (n-1)*25) {
      return { bar, n: Math.max(n,2), As_prov: Math.max(n,2)*bar.area };
    }
  }
  // Fallback: largest bar
  const bar = PH_BAR_SIZES[PH_BAR_SIZES.length-1];
  const n = Math.ceil(As_req/bar.area);
  return { bar, n: Math.max(n,2), As_prov: Math.max(n,2)*bar.area };
};

// For slabs/footings: select bar size for given As_req per meter width, return spacing
const selectSlabBars = (As_req_per_m) => {
  for (const bar of PH_BAR_SIZES) {
    const spacing = Math.floor((bar.area / As_req_per_m) * 1000 / 25) * 25; // round down to 25mm
    if (spacing >= 150 && spacing <= 300) {
      return { bar, spacing: Math.min(spacing, 300), As_prov: bar.area / spacing * 1000 };
    }
  }
  // Dense: use 10mm @ 150
  const bar = PH_BAR_SIZES[0];
  return { bar, spacing:150, As_prov: bar.area/0.150 };
};

// Stirrup recommendation based on Vs_req
const selectStirrups = (Vs_req, b, d, fy, fc) => {
  if (Vs_req <= 0) return { dia:10, spacing: Math.min(d/2, 300), note:"Min. stirrups (Av_min)" };
  const Av_req = Vs_req*1000 / (fy * d/1000 * 0.85); // mm² per mm length → for two legs
  const s_for_10 = 2*78.54 / Av_req;
  const s_for_12 = 2*113.1 / Av_req;
  if (s_for_10 >= 75)  return { dia:10, spacing: Math.max(Math.min(Math.floor(s_for_10/25)*25, Math.floor(d/2/25)*25, 300), 75), note:"" };
  if (s_for_12 >= 75)  return { dia:12, spacing: Math.max(Math.min(Math.floor(s_for_12/25)*25, Math.floor(d/2/25)*25, 300), 75), note:"" };
  return { dia:12, spacing:75, note:"High shear — verify with full design" };
};


// ─── STRUCTICODE: AI PLAN CHECKER ────────────────────────────────────────────
// ── "From Plans" badge shown on pre-filled fields ────────────────────────────
const FromPlansBadge = () => (
  <span title="Value extracted from uploaded plans" style={{fontSize:9,background:"rgba(34,197,94,0.15)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.3)",padding:"1px 6px",borderRadius:4,fontWeight:700,marginLeft:6,verticalAlign:"middle"}}>FROM PLANS ✓</span>
);

function StructuralChecker({ apiKey, onDataExtracted, externalResult, onResultChange, externalExtracted }) {
  const [files,setFiles]   = useState([]);
  const [result,setResult] = useState(externalResult||null);
  const [busy,setBusy]     = useState(false);
  const [error,setError]   = useState(null);
  const [drag,setDrag]     = useState(false);
  const [tab,setTab]       = useState("all");
  const [open,setOpen]     = useState({});
  const [checked,setChecked]   = useState({});
  const [corrections,setCorrections] = useState(null);
  const [correcting,setCorrecting]   = useState(false);
  const [revNum,setRevNum] = useState(1);
  const [extractedData, setExtractedData] = useState(externalExtracted||null);
  const ref = useRef(null);

  // ── Sync when parent restores OR clears session data ──────────────────
  useEffect(() => {
    setResult(externalResult || null);
    if (externalResult) { setTab("all"); setOpen({}); setChecked({}); setCorrections(null); }
  }, [externalResult]);
  useEffect(() => {
    setExtractedData(externalExtracted || null);
  }, [externalExtracted]);


  const addFiles = useCallback(fs=>{
    setFiles(p=>[...p,...Array.from(fs).map(f=>({file:f,id:Math.random().toString(36).slice(2),name:f.name,size:f.size,type:f.type||"application/octet-stream"}))]);
    setResult(null); setError(null);
  },[]);

  const [busyMsg, setBusyMsg] = useState("");
  const tick = () => new Promise(r => setTimeout(r, 0));

  const run = async () => {
    if(!files.length) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const blocks=[];
      for(let i=0;i<files.length;i++){
        const fo=files[i];
        setBusyMsg(`📂 Reading file ${i+1} of ${files.length}: ${fo.name}…`); await tick();
        const b64 = fo.type.startsWith("image/") ? (setBusyMsg(`🗜️ Compressing ${fo.name}…`), await tick(), await compressImage(fo.file)) : await toBase64(fo.file);
        if(fo.type.startsWith("image/")) { blocks.push({type:"image",source:{type:"base64",media_type:"image/jpeg",data:b64}}); blocks.push({type:"text",text:`[Image: ${fo.name}]`}); }
        else if(fo.type==="application/pdf") { blocks.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}}); blocks.push({type:"text",text:`[PDF: ${fo.name}]`}); }
        else blocks.push({type:"text",text:`[File: ${fo.name}]`});
      }
      blocks.push({type:"text",text:"Analyze uploaded structural plans for NSCP 2015 compliance. Return only JSON."});
      setBusyMsg("🤖 AI is checking NSCP 2015 compliance…"); await tick();

      // Run compliance check + data extraction in parallel
      const [complianceResp, extractionResp] = await Promise.all([
        callAI({ apiKey, system:NSCP_SYSTEM_PROMPT, messages:[{role:"user",content:blocks}] }),
        callAI({ apiKey, system:NSCP_EXTRACTION_PROMPT, messages:[{role:"user",content:[...blocks.slice(0,-1), {type:"text",text:"Extract all structural engineering parameters from these plans. Return only JSON."}]}] })
      ]);

      const raw = complianceResp.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      let parsed; try { parsed=JSON.parse(raw); } catch { throw new Error("Could not parse AI response."); }

      // Parse and store extracted data — hoist to outer scope for save
      let extracted = null;
      try {
        const rawExtract = extractionResp.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
        extracted = JSON.parse(rawExtract);
        if (onDataExtracted) onDataExtracted(extracted);
        setExtractedData(extracted);
      } catch { /* extraction failed silently - compliance result still shown */ }

      setResult(parsed);
      if(onResultChange) onResultChange(parsed);
      if(onDataExtracted && parsed.extracted) onDataExtracted(parsed.extracted);
      setOpen({}); setTab("all"); setChecked({}); setCorrections(null);
      addHistoryEntry({ tool:"structural", module:"structural", projectName:parsed?.summary?.projectName||"Structural Check", meta:{ status:parsed?.summary?.overallStatus, findings:(parsed?.findings?.length||0), summary:parsed?.summary?.analysisNotes||"" } });
      // Direct save — no React state, no callbacks, always works
      try { localStorage.setItem("buildify_session_structural", JSON.stringify({ checkerResult: parsed, checkerExtracted: extracted, _savedAt: new Date().toISOString(), _module: "structural", userId: "local" })); } catch(e) { console.warn("Session save failed", e); }
    } catch(e){ setError(e.message||"Analysis failed."); }
    finally { setBusy(false); setBusyMsg(""); }
  };

  const findings = result?.findings||[];
  const filtered = tab==="all"?findings:findings.filter(f=>f.severity===tab);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const allChecked = findings.length>0 && findings.every(f=>checked[f.id]);
  const toggleAll = ()=>{ if(allChecked) setChecked({}); else { const a={}; findings.forEach(f=>a[f.id]=true); setChecked(a); } };

  const generateCorrections = async () => {
    const selected = findings.filter(f=>checked[f.id]);
    if(!selected.length) return;
    setCorrecting(true); setCorrections(null);
    try {
      const hdrs={"Content-Type":"application/json"}; if(apiKey) hdrs["x-api-key"]=apiKey;
      const prompt=`You are a licensed PSCE. For each structural finding below, generate specific drafting correction instructions.

Findings:
${selected.map((f,i)=>`${i+1}. [${f.severity}] ${f.title} — ${f.description} (${f.nscpReference})`).join("\n")}

Respond ONLY as valid JSON array:
[{"id":1,"title":"...","severity":"...","description":"...","nscpReference":"...","recommendation":"...","correctedValues":"Specific corrected value e.g. Increase column size from 300x300 to 400x400mm, add 8-25mm dia. bars","draftingInstruction":"Exact instruction e.g. On Sheet S-3, Detail A, revise column reinforcement schedule. Add revision cloud."}]`;
      const data = await callAI({ apiKey, messages:[{role:"user",content:prompt}], max_tokens:4000 });
      const raw = data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      setCorrections(JSON.parse(raw));
    } catch(e){ alert("Could not generate corrections: "+e.message); }
    finally { setCorrecting(false); }
  };

  const S_STATUS = {"NON-COMPLIANT":"#dc2626","COMPLIANT WITH WARNINGS":"#d97706","COMPLIANT":"#16a34a"};

  return (
    <div>
      <NoKeyBanner/>
      <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files)}}
        onClick={()=>ref.current?.click()}
        style={{border:`2px dashed ${drag?"#3b82f6":T.border}`,borderRadius:16,padding:"40px 24px",textAlign:"center",cursor:"pointer",background:drag?"rgba(59,130,246,0.05)":"rgba(255,255,255,0.01)",transition:"all 0.2s",marginBottom:20}}>
        <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e=>addFiles(e.target.files)} style={{display:"none"}}/>
        <div style={{fontSize:40,marginBottom:12}}>📐</div>
        <div style={{fontWeight:700,fontSize:16,color:T.text,marginBottom:6}}>Drop structural plans here</div>
        <div style={{color:T.muted,fontSize:13,marginBottom:16}}>PDF drawings · JPG / PNG images</div>
        <div style={{display:"inline-block",background:"linear-gradient(135deg,#3b82f6,#6366f1)",color:"#fff",fontWeight:700,padding:"9px 22px",borderRadius:10,fontSize:14}}>Choose Files</div>
      </div>
      {files.length>0&&(<div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>{files.map(fo=>(<div key={fo.id} style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 10px",display:"flex",alignItems:"center",gap:8}}><span>{fo.type.startsWith("image")?"🖼️":"📄"}</span><div style={{fontSize:12,color:T.text,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fo.name}</div><button onClick={()=>setFiles(p=>p.filter(f=>f.id!==fo.id))} style={{background:"rgba(239,68,68,0.12)",border:"none",color:T.danger,width:22,height:22,borderRadius:5,cursor:"pointer",fontSize:12}}>✕</button></div>))}</div>)}
      {files.length>0&&(<button onClick={run} disabled={busy} style={{width:"100%",background:busy?"rgba(59,130,246,0.2)":"linear-gradient(135deg,#3b82f6,#6366f1)",border:"none",color:busy?"#666":"#fff",fontWeight:700,fontSize:15,padding:"14px",borderRadius:12,cursor:busy?"not-allowed":"pointer",marginBottom:20,transition:"all 0.2s"}}>{busy?(busyMsg||"⚙️ Analyzing…"):`🏗️ Run Structural Compliance Check (${files.length} file${files.length>1?"s":""})`}</button>)}
      {error&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"12px 16px",marginBottom:20,color:T.danger,fontSize:14}}>⚠️ {error}</div>}

      {result?.summary&&(
        <div style={{animation:"fadeIn 0.35s ease"}}>
          <Card style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:11,color:T.muted,marginBottom:4}}>PROJECT</div>
                <div style={{fontWeight:800,fontSize:18,color:T.text}}>{result.summary.projectName}</div>
                <div style={{fontSize:13,color:T.muted,marginTop:2}}>{result.summary.structureType} · {result.summary.fileType}</div>
                <div style={{marginTop:12,display:"flex",gap:24}}>
                  <div><div style={{fontSize:26,fontWeight:800,color:"#dc2626"}}>{result.summary.criticalCount}</div><div style={{fontSize:11,color:T.muted}}>CRITICAL</div></div>
                  <div><div style={{fontSize:26,fontWeight:800,color:"#d97706"}}>{result.summary.warningCount}</div><div style={{fontSize:11,color:T.muted}}>WARNINGS</div></div>
                  <div><div style={{fontSize:26,fontWeight:800,color:"#3b82f6"}}>{result.summary.infoCount}</div><div style={{fontSize:11,color:T.muted}}>INFO</div></div>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{background:`${S_STATUS[result.summary.overallStatus]}14`,border:`2px solid ${S_STATUS[result.summary.overallStatus]}44`,borderRadius:12,padding:"10px 18px",marginBottom:8}}>
                  <div style={{fontSize:10,color:T.muted,marginBottom:4}}>OVERALL STATUS</div>
                  <div style={{fontSize:13,fontWeight:800,color:S_STATUS[result.summary.overallStatus]}}>{result.summary.overallStatus}</div>
                </div>
              </div>
            </div>
            <div style={{marginTop:12,fontSize:13,color:T.muted,lineHeight:1.6,background:T.dim,borderRadius:8,padding:"10px 14px"}}>{result.summary.analysisNotes}</div>
          </Card>

          {findings.length>0&&(
            <div>
              <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["all","CRITICAL","WARNING","INFO"].map(t=>{
                    const cnt=t==="all"?findings.length:findings.filter(f=>f.severity===t).length;
                    const active=tab===t;
                    return <button key={t} onClick={()=>setTab(t)} style={{padding:"7px 16px",borderRadius:8,border:`1.5px solid ${active?"#3b82f6":T.border}`,background:active?"rgba(59,130,246,0.12)":"transparent",color:active?"#3b82f6":T.muted,cursor:"pointer",fontSize:12,fontWeight:700}}>{t==="all"?"All":t} ({cnt})</button>;
                  })}
                </div>
                <button onClick={toggleAll} style={{padding:"7px 14px",borderRadius:8,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>{allChecked?"☑ Deselect All":"☐ Select All"}</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                {filtered.map(f=>{
                  const col={CRITICAL:"#dc2626",WARNING:"#d97706",INFO:"#3b82f6"}[f.severity]||"#3b82f6";
                  const bg={CRITICAL:"rgba(220,38,38,0.06)",WARNING:"rgba(217,119,6,0.06)",INFO:"rgba(59,130,246,0.06)"}[f.severity]||"rgba(59,130,246,0.06)";
                  const isOpen=open[f.id]; const isChecked=!!checked[f.id];
                  return (
                    <div key={f.id} style={{background:isChecked?bg:"rgba(255,255,255,0.01)",border:`1.5px solid ${isChecked?col:T.border}`,borderRadius:12,overflow:"hidden",transition:"all 0.15s"}}>
                      <div style={{padding:"13px 18px",display:"flex",alignItems:"flex-start",gap:12}}>
                        <div onClick={()=>setChecked(p=>({...p,[f.id]:!p[f.id]}))} style={{width:20,height:20,borderRadius:5,border:`2px solid ${isChecked?col:T.muted}`,background:isChecked?col:"transparent",cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                          {isChecked&&<span style={{color:"#fff",fontSize:12,fontWeight:800,lineHeight:1}}>✓</span>}
                        </div>
                        <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setOpen(p=>({...p,[f.id]:!p[f.id]}))}>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:4,alignItems:"center"}}>
                            <span style={{background:col,color:"#fff",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:4}}>{f.severity}</span>
                            {f.confidence && <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:4,
                              background:f.confidence==="HIGH"?"rgba(22,163,74,0.15)":f.confidence==="LOW"?"rgba(239,68,68,0.12)":"rgba(234,179,8,0.12)",
                              color:f.confidence==="HIGH"?"#16a34a":f.confidence==="LOW"?"#ef4444":"#ca8a04",
                              border:`1px solid ${f.confidence==="HIGH"?"rgba(22,163,74,0.3)":f.confidence==="LOW"?"rgba(239,68,68,0.3)":"rgba(234,179,8,0.3)"}`
                            }}>{f.confidence==="HIGH"?"● HIGH CONFIDENCE":f.confidence==="LOW"?"◌ LOW CONFIDENCE":"◑ MEDIUM CONF."}</span>}
                            <span style={{fontSize:11,color:T.muted,fontFamily:"monospace"}}>{f.nscpReference}</span>
                            <span style={{fontSize:11,color:T.muted,background:"rgba(255,255,255,0.04)",padding:"1px 8px",borderRadius:4}}>{f.category}</span>
                          </div>
                          <div style={{fontWeight:700,fontSize:14,color:T.text}}>{f.title}</div>
                        </div>
                        <span style={{color:T.muted,fontSize:12,marginTop:2,cursor:"pointer"}} onClick={()=>setOpen(p=>({...p,[f.id]:!p[f.id]}))}>{isOpen?"▲":"▼"}</span>
                      </div>
                      {isOpen&&(<div style={{padding:"0 18px 16px 50px",borderTop:`1px solid ${col}33`}}>
                        <div style={{paddingTop:12,display:"flex",flexDirection:"column",gap:10}}>
                          <div><Label>Finding</Label><div style={{fontSize:13,color:T.muted,lineHeight:1.6}}>{f.description}</div></div>
                          <div><Label>Recommendation</Label><div style={{fontSize:13,color:T.success,lineHeight:1.6}}>✓ {f.recommendation}</div></div>
                          {f.codeBasis&&<div style={{background:"rgba(0,0,0,0.2)",borderLeft:`3px solid ${col}`,padding:"10px 14px",borderRadius:"0 8px 8px 0",fontSize:12,color:T.muted,fontStyle:"italic",lineHeight:1.5}}>{f.codeBasis}</div>}
                        </div>
                      </div>)}
                    </div>
                  );
                })}
              </div>

              {checkedCount>0&&(
                <div style={{background:"rgba(59,130,246,0.08)",border:"1.5px solid rgba(59,130,246,0.25)",borderRadius:12,padding:"16px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:"#3b82f6"}}>{checkedCount} item{checkedCount>1?"s":""} selected for correction</div>
                    <div style={{fontSize:12,color:T.muted,marginTop:2}}>AI will generate specific drafting instructions per NSCP 2015</div>
                  </div>
                  <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><Label>Rev No.</Label><input type="number" value={revNum} min={1} max={99} onChange={e=>setRevNum(+e.target.value)} style={{width:60,background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:8,padding:"6px 10px",color:T.text,fontSize:14,fontWeight:700,outline:"none",textAlign:"center"}}/></div>
                    <button onClick={generateCorrections} disabled={correcting} style={{background:correcting?"rgba(59,130,246,0.3)":"linear-gradient(135deg,#3b82f6,#6366f1)",border:"none",color:correcting?"#666":"#fff",fontWeight:700,padding:"10px 20px",borderRadius:10,cursor:correcting?"not-allowed":"pointer",fontSize:13}}>
                      {correcting?"⚙️ Generating…":"🤖 Generate Corrections"}
                    </button>
                  </div>
                </div>
              )}

              {corrections&&(
                <div style={{background:"rgba(16,185,129,0.05)",border:"1.5px solid rgba(16,185,129,0.25)",borderRadius:12,padding:20,marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
                    <div><div style={{fontWeight:800,fontSize:15,color:T.success}}>✅ Corrections Generated — Rev {revNum}</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>{corrections.length} drafting instruction{corrections.length>1?"s":""} ready</div></div>
                    <button onClick={()=>{
                      const w=window.open("","_blank");
                      const date=new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});
                      const rows=corrections.map((c,i)=>`<tr><td style="padding:10px 8px;border:1px solid #e5e7eb;font-weight:700;color:#6b7280;text-align:center">REV-${String(i+1).padStart(2,"0")}</td><td style="padding:10px 8px;border:1px solid #e5e7eb;color:${{CRITICAL:"#dc2626",WARNING:"#d97706",INFO:"#2563eb"}[c.severity]};font-weight:700">${c.severity}</td><td style="padding:10px 8px;border:1px solid #e5e7eb;font-weight:600">${c.title}</td><td style="padding:10px 8px;border:1px solid #e5e7eb;font-size:12px">${c.description}</td><td style="padding:10px 8px;border:1px solid #e5e7eb;background:#fefce8">${c.correctedValues||c.recommendation}</td><td style="padding:10px 8px;border:1px solid #e5e7eb;background:#f0fdf4;color:#15803d">${c.draftingInstruction||""}</td><td style="padding:10px 8px;border:1px solid #e5e7eb;font-size:11px;color:#6b7280">${c.nscpReference}</td></tr>`).join("");
                      w.document.write(`<!DOCTYPE html><html><head><title>Structural Revision Report Rev ${revNum}</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#111;font-size:13px}table{border-collapse:collapse;width:100%}th{background:#1f2937;color:#fff;padding:9px 8px;text-align:left;font-size:11px}h1{color:#1f2937}h2{border-bottom:2px solid #f3f4f6;padding-bottom:6px;margin-top:24px}@media print{button{display:none}}</style></head><body><h1>🏗️ Structural Revision Report — Rev ${revNum}</h1><p style="color:#6b7280">NSCP 2015 · ${date} · Developed by Jon Ureta</p><h2>Corrections (${corrections.length} items)</h2><table><tr><th>Rev No.</th><th>Severity</th><th>Issue</th><th>Finding</th><th style="background:#92400e">Corrected Value</th><th style="background:#166534">Drafting Instruction</th><th>NSCP Ref.</th></tr>${rows}</table><div style="margin-top:24px;background:#eff6ff;border:1px solid #3b82f6;border-radius:8px;padding:14px 18px"><strong>Instructions for Draftsman:</strong><ol style="margin:8px 0 0;padding-left:18px;line-height:2"><li>Apply all corrections to the drawing file</li><li>Update revision block: Rev ${revNum}, ${date}</li><li>Add revision clouds around modified areas</li><li>Tag each cloud with Rev No. (REV-01, REV-02, etc.)</li><li>Submit to Engineer-of-Record for review and signature</li></ol></div><p style="margin-top:24px;font-size:11px;color:#9ca3af">⚠️ AI-generated report. All corrections must be verified by a licensed PSCE before implementation.</p></body></html>`);
                      w.document.close(); setTimeout(()=>w.print(),400);
                    }} style={{background:"linear-gradient(135deg,#10b981,#059669)",border:"none",color:"#fff",fontWeight:700,padding:"10px 20px",borderRadius:10,cursor:"pointer",fontSize:13}}>📄 Download Revision PDF</button>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {corrections.map((c,i)=>(
                      <div key={c.id||i} style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
                        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                          <span style={{background:"#1f2937",color:"#3b82f6",fontSize:11,fontWeight:800,padding:"2px 10px",borderRadius:4}}>REV-{String(i+1).padStart(2,"0")}</span>
                          <span style={{fontSize:12,fontWeight:700,color:T.text}}>{c.title}</span>
                          <span style={{fontSize:11,color:T.muted,fontFamily:"monospace"}}>{c.nscpReference}</span>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                          <div style={{background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,color:T.accent,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>📐 Corrected Value</div><div style={{fontSize:13,color:T.text,lineHeight:1.6}}>{c.correctedValues||c.recommendation}</div></div>
                          <div style={{background:"rgba(16,185,129,0.07)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,color:T.success,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>✏️ Drafting Instruction</div><div style={{fontSize:13,color:T.text,lineHeight:1.6}}>{c.draftingInstruction||"Apply correction as indicated"}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Issue 3: Design Computation Capability Summary */}
          {extractedData && (
            <div style={{marginTop:16,background:"rgba(6,150,215,0.04)",border:"1.5px solid rgba(6,150,215,0.2)",borderRadius:12,padding:16}}>
              <div style={{fontSize:12,fontWeight:800,color:T.text,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                <Icon name="structural" size={14} color="#0696d7"/>
                Design Computation Readiness
                <span style={{fontSize:10,color:T.muted,fontWeight:400,marginLeft:4}}>— what was extracted for structural calcs</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8}}>
                {[
                  { key:"seismic", label:"Seismic Load",     ok:!!(extractedData.seismic?.zone||extractedData.seismic?.seismicWeight),     detail: extractedData.seismic?.zone ? `${extractedData.seismic.zone}` : null },
                  { key:"beam",    label:"Beam Design",       ok:!!(extractedData.beams?.length&&extractedData.materials?.fc),               detail: extractedData.beams?.length ? `${extractedData.beams.length} beam(s)` : null },
                  { key:"column",  label:"Column Design",     ok:!!(extractedData.columns?.length&&extractedData.materials?.fc),             detail: extractedData.columns?.length ? `${extractedData.columns.length} column(s)` : null },
                  { key:"footing", label:"Footing Design",    ok:!!(extractedData.footings?.length),                                         detail: extractedData.footings?.length ? `${extractedData.footings.length} footing(s)` : null },
                  { key:"slab",    label:"Slab Design",       ok:!!(extractedData.slabs?.length&&extractedData.materials?.fc),               detail: extractedData.slabs?.length ? `${extractedData.slabs.length} slab(s)` : null },
                  { key:"loads",   label:"Load Combinations", ok:!!(extractedData.loads?.floorDL&&extractedData.loads?.floorLL),            detail: extractedData.loads?.floorDL ? `DL=${extractedData.loads.floorDL}kPa` : null },
                ].map(item=>(
                  <div key={item.key} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",
                    background:item.ok?"rgba(34,197,94,0.06)":"rgba(255,255,255,0.02)",
                    border:`1px solid ${item.ok?"rgba(34,197,94,0.2)":T.border}`,borderRadius:9}}>
                    <div style={{width:22,height:22,borderRadius:"50%",
                      background:item.ok?"rgba(34,197,94,0.15)":"rgba(100,116,139,0.1)",
                      display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontSize:11,fontWeight:900,color:item.ok?"#22c55e":T.muted}}>{item.ok?"✓":"✗"}</span>
                    </div>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:700,color:item.ok?T.text:T.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.label}</div>
                      <div style={{fontSize:10,color:item.ok?"#22c55e":T.muted,marginTop:1}}>{item.ok?(item.detail||"Ready"):"Not in plans"}</div>
                    </div>
                  </div>
                ))}
              </div>
              {(extractedData.materials?.fc||extractedData.materials?.fy) && (
                <div style={{marginTop:10,padding:"7px 12px",background:"rgba(6,150,215,0.06)",borderRadius:8,fontSize:11,color:T.muted}}>
                  Materials: {extractedData.materials?.fc ? `f'c = ${extractedData.materials.fc} MPa` : "f'c not found"} · {extractedData.materials?.fy ? `fy = ${extractedData.materials.fy} MPa` : "fy not found"}
                </div>
              )}
              <div style={{marginTop:10,fontSize:11,color:"#0696d7",fontWeight:600}}>
                ↓ Use the Design Calcs toolbar above to open pre-filled calculators, or click "Run All Computations" in the Structural Intelligence Panel.
              </div>
            </div>
          )}

          <div style={{marginTop:20,padding:"10px 16px",background:T.dim,borderRadius:10,fontSize:12,color:T.muted,lineHeight:1.5}}>⚠️ AI-generated report for reference only. All plans must be reviewed and stamped by a licensed PSCE before submission to DPWH or LGU.</div>
        </div>
      )}
      {!files.length&&!result&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginTop:4}}>
          {[{i:"🏠",t:"Residential",d:"Beams, columns, slabs, footings"},{i:"🏢",t:"Commercial",d:"Multi-storey RC/Steel structures"},{i:"🌉",t:"Bridge/Infrastructure",d:"DPWH Blue Book compliance"},{i:"🌍",t:"Seismic Check",d:"NSCP 2015 Section 208"}].map(x=>(
            <Card key={x.t} style={{textAlign:"center",padding:18}}><div style={{fontSize:28,marginBottom:8}}>{x.i}</div><div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:4}}>{x.t}</div><div style={{fontSize:11,color:T.muted,lineHeight:1.5}}>{x.d}</div></Card>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── STRUCTICODE: SEISMIC LOAD CALC ──────────────────────────────────────────
function SeismicCalc({ structuralData }) {
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
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>V = Sa·I·W/R, bounded by Vmin=0.11·Ca·I·W and Vmax=2.5·Ca·I·W/R (NSCP 2015 Sec. 208.5.2)</div>
        </div>
      ) : (
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}>
          <Icon name="seismic" size={40} color={T.muted}/>
          <div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Fill parameters and click<br/>Calculate to see results</div>
        </Card>
      )}
    </div>
  );
}

// ─── STRUCTICODE: BEAM DESIGN ────────────────────────────────────────────────
function BeamDesign({ structuralData }) {
  const sd = structuralData;
  const b0 = sd?.beams?.[0];
  const [fc, setFc] = useState(sd?.materials?.fc ?? "");
  const [fy, setFy] = useState(sd?.materials?.fy ?? "");
  const [b,  setB]  = useState(b0?.width  ?? "");
  const [d,  setD]  = useState(b0?.depth  ?? "");
  const [Mu, setMu] = useState(b0?.Mu     ?? "");
  const [Vu, setVu] = useState(b0?.Vu     ?? "");
  const [result, setResult] = useState(null);
  const [fp, setFp] = useState({fc:!!sd?.materials?.fc,fy:!!sd?.materials?.fy,b:!!b0?.width,d:!!b0?.depth,Mu:!!b0?.Mu,Vu:!!b0?.Vu});

  useEffect(()=>{
    if(!sd) return;
    const b1=sd?.beams?.[0];
    if(sd.materials?.fc)  {setFc(sd.materials.fc);  setFp(p=>({...p,fc:true}));}
    if(sd.materials?.fy)  {setFy(sd.materials.fy);  setFp(p=>({...p,fy:true}));}
    if(b1?.width) {setB(b1.width);  setFp(p=>({...p,b:true}));}
    if(b1?.depth) {setD(b1.depth);  setFp(p=>({...p,d:true}));}
    if(b1?.Mu)    {setMu(b1.Mu);    setFp(p=>({...p,Mu:true}));}
    if(b1?.Vu)    {setVu(b1.Vu);    setFp(p=>({...p,Vu:true}));}
  },[sd]);

  const calc = () => {
    if([fc,fy,b,d,Mu,Vu].some(v=>v==="")) return;
    const bm=+b/1000, dm=+d/1000, phi_b=0.90, phi_v=0.85;
    const Rn = (+Mu*1e3)/(phi_b*bm*dm*dm*1e6);
    const beta1 = +fc>=28 ? Math.max(0.65, 0.85-0.05*(+fc-28)/7) : 0.85;
    const rho_req = (0.85*+fc/+fy)*(1-Math.sqrt(Math.max(0,1-(2*Rn)/(0.85*+fc))));
    const rho_min = Math.max(0.25*Math.sqrt(+fc)/+fy, 1.4/+fy);
    const rho_max = 0.75*0.85*beta1*(+fc/+fy)*(600/(600+(+fy)));
    const rho_use = Math.max(rho_req, rho_min);
    const As_req  = rho_use*(+b)*(+d);
    const Vc = (1/6)*Math.sqrt(+fc)*(+b)*(+d)/1000;
    const Vs_req = +Vu/phi_v - Vc;
    const status_flex  = rho_req<=rho_max ? "PASS ✓" : "FAIL — over-reinforced ✗";
    const status_shear = Vc*phi_v>=(+Vu) ? "Vc adequate ✓" : `Stirrups required (Vs=${Vs_req.toFixed(1)} kN)`;
    setResult({Rn,rho_req,rho_min,rho_max,rho_use,As_req,Vc,Vs_req,status_flex,status_shear});
  };

  const Hint = ({c}) => <div style={{fontSize:11,color:T.muted,marginBottom:12,fontStyle:"italic"}}>{c}</div>;
  const canCalc = [fc,fy,b,d,Mu,Vu].every(v=>v!=="");

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        {!sd && <div style={{padding:"10px 14px",background:"rgba(6,150,215,0.06)",border:"1px solid rgba(6,150,215,0.15)",borderRadius:8,marginBottom:16,fontSize:12,color:"#0696d7",lineHeight:1.6}}>💡 Upload structural plans in <strong>AI Plan Checker</strong> to auto-fill beam dimensions.</div>}
        <Label>Concrete Strength f'c (MPa) {fp.fc && <FromPlansBadge/>}</Label>
        <Select value={fc} onChange={e=>setFc(+e.target.value)} style={{marginBottom:4}}>
          <option value="">— Select grade —</option>
          {Object.entries(CONCRETE_GRADES).map(([k,v])=><option key={k} value={v}>{k} ({v} MPa)</option>)}
        </Select>
        <Hint c="Standard: 20.7 MPa (3000psi) residential, 27.6 MPa (4000psi) commercial."/>
        <Label>Steel Yield Strength fy (MPa) {fp.fy && <FromPlansBadge/>}</Label>
        <Select value={fy} onChange={e=>setFy(+e.target.value)} style={{marginBottom:16}}>
          <option value="">— Select grade —</option>
          {Object.entries(REBAR_GRADES).map(([k,v])=><option key={k} value={v}>{k} ({v} MPa)</option>)}
        </Select>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:4}}>
          <div><Label>Width b (mm) {fp.b && <FromPlansBadge/>}</Label><Input type="number" value={b} onChange={e=>setB(e.target.value)} placeholder="e.g. 300"/></div>
          <div><Label>Eff. Depth d (mm) {fp.d && <FromPlansBadge/>}</Label><Input type="number" value={d} onChange={e=>setD(e.target.value)} placeholder="e.g. 450"/></div>
        </div>
        <Hint c="Effective depth d = total depth − cover (40mm) − stirrup dia. − ½ main bar dia."/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:4}}>
          <div><Label>Mu (kN·m) {fp.Mu && <FromPlansBadge/>}</Label><Input type="number" value={Mu} onChange={e=>setMu(e.target.value)} placeholder="Factored moment"/></div>
          <div><Label>Vu (kN) {fp.Vu && <FromPlansBadge/>}</Label><Input type="number" value={Vu} onChange={e=>setVu(e.target.value)} placeholder="Factored shear"/></div>
        </div>
        <Hint c="Use factored loads per NSCP Sec. 203. Critical section for Vu at distance d from face of support."/>
        <button onClick={calc} disabled={!canCalc} style={{width:"100%",background:canCalc?"linear-gradient(135deg,#0696d7,#0569a8)":"rgba(255,255,255,0.05)",border:"none",color:canCalc?"#fff":T.muted,fontWeight:700,fontSize:14,padding:"13px",borderRadius:12,cursor:canCalc?"pointer":"not-allowed",marginTop:8,transition:"all 0.2s"}}>
          {canCalc ? "⚡ Design Beam (NSCP 2015 Sec. 406)" : "Fill all fields to calculate"}
        </button>
      </Card>
      {result ? (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Card style={{background:result.status_flex.includes("PASS")?"rgba(34,197,94,0.06)":"rgba(239,68,68,0.06)",border:`1.5px solid ${result.status_flex.includes("PASS")?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"}`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:2}}>FLEXURE STATUS</div>
            <div style={{fontSize:16,fontWeight:800,color:result.status_flex.includes("PASS")?"#22c55e":"#ef4444"}}>{result.status_flex}</div>
            <div style={{fontSize:22,fontWeight:900,color:T.text,marginTop:8}}>{result.As_req.toFixed(0)} <span style={{fontSize:13,fontWeight:400,color:T.muted}}>mm² required</span></div>
          </Card>
          {[
            {l:"Nominal Coeff. Rn",v:`${result.Rn.toFixed(4)} MPa`},
            {l:"Required ρ",v:`${(result.rho_req*100).toFixed(4)}%`},
            {l:"Minimum ρ",v:`${(result.rho_min*100).toFixed(4)}%`},
            {l:"Maximum ρ (0.75ρb)",v:`${(result.rho_max*100).toFixed(4)}%`},
            {l:"Design ρ used",v:`${(result.rho_use*100).toFixed(4)}%`,hi:true},
            {l:"Steel Area As",v:`${result.As_req.toFixed(0)} mm²`,hi:true},
            {l:"Concrete Shear Vc",v:`${result.Vc.toFixed(1)} kN`},
            {l:"Shear Status",v:result.status_shear,color:result.status_shear.includes("✓")?"#22c55e":"#f59e0b"},
          ].map(r=>(
            <div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 14px",background:r.hi?"rgba(6,150,215,0.08)":T.dim,borderRadius:7,border:r.hi?"1px solid rgba(6,150,215,0.2)":"none"}}>
              <span style={{fontSize:12,color:T.muted}}>{r.l}</span>
              <span style={{fontSize:13,fontWeight:700,color:r.color||(r.hi?"#0696d7":T.text),fontFamily:"monospace"}}>{r.v}</span>
            </div>
          ))}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>NSCP 2015 Sec. 406 — Singly reinforced. Verify bar selection and spacing per Sec. 406.4.</div>
        </div>
      ) : (
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}>
          <Icon name="beam" size={40} color={T.muted}/>
          <div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Fill parameters and click<br/>Calculate to see results</div>
        </Card>
      )}
    </div>
  );
}

// ─── STRUCTICODE: COLUMN DESIGN ──────────────────────────────────────────────
function ColumnDesign({ structuralData }) {
  const sd=structuralData, c0=sd?.columns?.[0];
  const [fc,setFc]=useState(sd?.materials?.fc??"");
  const [fy,setFy]=useState(sd?.materials?.fy??"");
  const [b,setB]=useState(c0?.width??"");
  const [h,setH]=useState(c0?.height??"");
  const [Pu,setPu]=useState(c0?.Pu??"");
  const [Mu,setMu]=useState(c0?.Mu??"");
  const [type,setType]=useState(c0?.type==="spiral"?"spiral":"tied");
  const [result,setResult]=useState(null);
  const [fp,setFp]=useState({fc:!!sd?.materials?.fc,fy:!!sd?.materials?.fy,b:!!c0?.width,h:!!c0?.height,Pu:!!c0?.Pu,Mu:!!c0?.Mu});

  useEffect(()=>{
    if(!sd) return; const c1=sd?.columns?.[0];
    if(sd.materials?.fc){setFc(sd.materials.fc);setFp(p=>({...p,fc:true}));}
    if(sd.materials?.fy){setFy(sd.materials.fy);setFp(p=>({...p,fy:true}));}
    if(c1?.width){setB(c1.width);setFp(p=>({...p,b:true}));}
    if(c1?.height){setH(c1.height);setFp(p=>({...p,h:true}));}
    if(c1?.Pu){setPu(c1.Pu);setFp(p=>({...p,Pu:true}));}
    if(c1?.Mu){setMu(c1.Mu);setFp(p=>({...p,Mu:true}));}
    if(c1?.type){setType(c1.type==="spiral"?"spiral":"tied");}
  },[sd]);

  const calc=()=>{
    if([fc,fy,b,h,Pu].some(v=>v==="")) return;
    const phi=type==="spiral"?0.75:0.65, Ag=(+b)*(+h);
    const Pn_req=(+Pu)*1000/phi;
    const Ast_req=Math.max((Pn_req/0.80-0.85*+fc*Ag)/(+fy-0.85*+fc),0.01*Ag);
    const rho_req=Ast_req/Ag, rho_min=0.01, rho_max=0.08;
    const phiPn=phi*0.80*(0.85*+fc*(Ag-Ast_req)+Ast_req*(+fy))/1000;
    const ecc=Mu&&Pu?(+Mu*1e3)/(+Pu):0;
    const status=(rho_req<=rho_max&&rho_req>=rho_min&&phiPn>=(+Pu))?"PASS ✓":"FAIL ✗";
    setResult({Ag,Ast_req,rho_req,rho_min,rho_max,phiPn,ecc,status,phi});
  };

  const Hint=({c})=><div style={{fontSize:11,color:T.muted,marginBottom:12,fontStyle:"italic"}}>{c}</div>;
  const canCalc=[fc,fy,b,h,Pu].every(v=>v!=="");

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        {!sd && <div style={{padding:"10px 14px",background:"rgba(6,150,215,0.06)",border:"1px solid rgba(6,150,215,0.15)",borderRadius:8,marginBottom:16,fontSize:12,color:"#0696d7",lineHeight:1.6}}>💡 Upload structural plans in <strong>AI Plan Checker</strong> to auto-fill column schedule data.</div>}
        <Label>f'c (MPa) {fp.fc&&<FromPlansBadge/>}</Label>
        <Select value={fc} onChange={e=>setFc(+e.target.value)} style={{marginBottom:16}}>
          <option value="">— Select grade —</option>
          {Object.entries(CONCRETE_GRADES).map(([k,v])=><option key={k} value={v}>{k} ({v} MPa)</option>)}
        </Select>
        <Label>fy (MPa) {fp.fy&&<FromPlansBadge/>}</Label>
        <Select value={fy} onChange={e=>setFy(+e.target.value)} style={{marginBottom:16}}>
          <option value="">— Select grade —</option>
          {Object.entries(REBAR_GRADES).map(([k,v])=><option key={k} value={v}>{k} ({v} MPa)</option>)}
        </Select>
        <Label>Column Type</Label>
        <Select value={type} onChange={e=>setType(e.target.value)} style={{marginBottom:4}}>
          <option value="tied">Tied Column (φ = 0.65)</option>
          <option value="spiral">Spiral Column (φ = 0.75)</option>
        </Select>
        <Hint c="Spiral columns preferred in high seismic zones for ductility."/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:4}}>
          <div><Label>Width b (mm) {fp.b&&<FromPlansBadge/>}</Label><Input type="number" value={b} onChange={e=>setB(e.target.value)} placeholder="e.g. 400"/></div>
          <div><Label>Height h (mm) {fp.h&&<FromPlansBadge/>}</Label><Input type="number" value={h} onChange={e=>setH(e.target.value)} placeholder="e.g. 400"/></div>
        </div>
        <Hint c="Min. 300mm per NSCP Sec. 421 for seismic zones. From column schedule on structural plans."/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:4}}>
          <div><Label>Pu (kN) {fp.Pu&&<FromPlansBadge/>}</Label><Input type="number" value={Pu} onChange={e=>setPu(e.target.value)} placeholder="e.g. 1500"/></div>
          <div><Label>Mu (kN·m) {fp.Mu&&<FromPlansBadge/>}</Label><Input type="number" value={Mu} onChange={e=>setMu(e.target.value)} placeholder="Optional"/></div>
        </div>
        <Hint c="Pu = 1.2D + 1.6L. Sum tributary loads per floor × number of floors above."/>
        <button onClick={calc} disabled={!canCalc} style={{width:"100%",background:canCalc?"linear-gradient(135deg,#0696d7,#0569a8)":"rgba(255,255,255,0.05)",border:"none",color:canCalc?"#fff":T.muted,fontWeight:700,fontSize:14,padding:"13px",borderRadius:12,cursor:canCalc?"pointer":"not-allowed",marginTop:8,transition:"all 0.2s"}}>
          {canCalc?"⚡ Design Column (NSCP 2015 Sec. 410)":"Fill required fields to calculate"}
        </button>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Card style={{background:result.status.includes("PASS")?"rgba(34,197,94,0.06)":"rgba(239,68,68,0.06)",border:`1.5px solid ${result.status.includes("PASS")?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"}`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:2}}>STATUS</div>
            <div style={{fontSize:16,fontWeight:800,color:result.status.includes("PASS")?"#22c55e":"#ef4444"}}>{result.status}</div>
            <div style={{fontSize:22,fontWeight:900,color:T.text,marginTop:8}}>{result.Ast_req.toFixed(0)} <span style={{fontSize:13,fontWeight:400,color:T.muted}}>mm² steel req'd</span></div>
          </Card>
          {[
            {l:"Gross Area Ag",v:`${result.Ag.toFixed(0)} mm²`},
            {l:"Required ρ",v:`${(result.rho_req*100).toFixed(2)}%`},
            {l:"Min ρ / Max ρ",v:`${(result.rho_min*100).toFixed(0)}% / ${(result.rho_max*100).toFixed(0)}%`},
            {l:"φPn capacity",v:`${result.phiPn.toFixed(1)} kN`,hi:true},
            {l:"Ast required",v:`${result.Ast_req.toFixed(0)} mm²`,hi:true},
            {l:"Eccentricity e",v:result.ecc?`${result.ecc.toFixed(1)} mm`:"—"},
            {l:"φ factor",v:`${result.phi}`},
          ].map(r=>(
            <div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 14px",background:r.hi?"rgba(6,150,215,0.08)":T.dim,borderRadius:7,border:r.hi?"1px solid rgba(6,150,215,0.2)":"none"}}>
              <span style={{fontSize:12,color:T.muted}}>{r.l}</span>
              <span style={{fontSize:13,fontWeight:700,color:r.hi?"#0696d7":T.text,fontFamily:"monospace"}}>{r.v}</span>
            </div>
          ))}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>NSCP 2015 Sec. 410 — Short column, concentric load. Apply magnification for slender columns per Sec. 410.12.</div>
        </div>
      ):(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}>
          <Icon name="column" size={40} color={T.muted}/>
          <div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Fill parameters and click<br/>Calculate to see results</div>
        </Card>
      )}
    </div>
  );
}

// ─── STRUCTICODE: FOOTING DESIGN ─────────────────────────────────────────────
function FootingDesign({ structuralData }) {
  const sd=structuralData, f0=sd?.footings?.[0];
  const [fc,setFc]=useState(sd?.materials?.fc??"");
  const [fy,setFy]=useState(sd?.materials?.fy??"");
  const [P,setP]=useState(f0?.columnLoad??"");
  const [qa,setQa]=useState(f0?.soilBearing??"");
  const [Df,setDf]=useState(f0?.depth??"");
  const [result,setResult]=useState(null);
  const [fp,setFp]=useState({fc:!!sd?.materials?.fc,fy:!!sd?.materials?.fy,P:!!f0?.columnLoad,qa:!!f0?.soilBearing,Df:!!f0?.depth});

  useEffect(()=>{
    if(!sd) return; const f1=sd?.footings?.[0];
    if(sd.materials?.fc){setFc(sd.materials.fc);setFp(p=>({...p,fc:true}));}
    if(sd.materials?.fy){setFy(sd.materials.fy);setFp(p=>({...p,fy:true}));}
    if(f1?.columnLoad){setP(f1.columnLoad);setFp(p=>({...p,P:true}));}
    if(f1?.soilBearing){setQa(f1.soilBearing);setFp(p=>({...p,qa:true}));}
    if(f1?.depth){setDf(f1.depth);setFp(p=>({...p,Df:true}));}
  },[sd]);

  const calc=()=>{
    if([fc,fy,P,qa,Df].some(v=>v==="")) return;
    const qnet=(+qa)-23.5*(+Df);
    if(qnet<=0){setResult({error:"Net bearing ≤ 0. Reduce Df or increase qa."});return;}
    const B=Math.ceil(Math.sqrt((+P)/qnet)*10)/10;
    const qu=1.2*(+P)/(B*B);
    const d=Math.max(B*1000/5,250);
    const c=(B-0.4)/2;
    const Mu_f=qu*B*c*c/2;
    const Rn=(Mu_f*1e6)/(0.90*(B*1000)*d*d);
    const rho=(0.85*+fc/+fy)*(1-Math.sqrt(Math.max(0,1-(2*Rn)/(0.85*+fc))));
    const rho_use=Math.max(rho,0.0018);
    const As=rho_use*(B*1000)*d;
    setResult({qnet,B,qu,d,Mu_f,As,rho_use});
  };

  const Hint=({c})=><div style={{fontSize:11,color:T.muted,marginBottom:12,fontStyle:"italic"}}>{c}</div>;
  const canCalc=[fc,fy,P,qa,Df].every(v=>v!=="");

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        {!sd && <div style={{padding:"10px 14px",background:"rgba(6,150,215,0.06)",border:"1px solid rgba(6,150,215,0.15)",borderRadius:8,marginBottom:16,fontSize:12,color:"#0696d7",lineHeight:1.6}}>💡 Upload structural plans in <strong>AI Plan Checker</strong> to auto-fill footing data.</div>}
        <Label>f'c (MPa) {fp.fc&&<FromPlansBadge/>}</Label>
        <Select value={fc} onChange={e=>setFc(+e.target.value)} style={{marginBottom:16}}>
          <option value="">— Select grade —</option>
          {Object.entries(CONCRETE_GRADES).map(([k,v])=><option key={k} value={v}>{k} ({v} MPa)</option>)}
        </Select>
        <Label>fy (MPa) {fp.fy&&<FromPlansBadge/>}</Label>
        <Select value={fy} onChange={e=>setFy(+e.target.value)} style={{marginBottom:16}}>
          <option value="">— Select grade —</option>
          {Object.entries(REBAR_GRADES).map(([k,v])=><option key={k} value={v}>{k} ({v} MPa)</option>)}
        </Select>
        <Label>Column Service Load P (kN) {fp.P&&<FromPlansBadge/>}</Label>
        <Input type="number" value={P} onChange={e=>setP(e.target.value)} placeholder="e.g. 800 — unfactored service load" style={{marginBottom:4}}/>
        <Hint c="Use unfactored (service) load. Sum all floor loads from tributary area × floors above."/>
        <Label>Allowable Bearing qa (kPa) {fp.qa&&<FromPlansBadge/>}</Label>
        <Input type="number" value={qa} onChange={e=>setQa(e.target.value)} placeholder="e.g. 150 — from geotechnical report" style={{marginBottom:4}}/>
        <Hint c="Must come from a geotechnical investigation (NSCP Sec. 304). Never assume."/>
        <Label>Foundation Depth Df (m) {fp.Df&&<FromPlansBadge/>}</Label>
        <Input type="number" value={Df} onChange={e=>setDf(e.target.value)} step="0.1" placeholder="e.g. 1.50" style={{marginBottom:4}}/>
        <Hint c="Depth from finished grade to bottom of footing. Min 0.60m for non-frost areas."/>
        <button onClick={calc} disabled={!canCalc} style={{width:"100%",background:canCalc?"linear-gradient(135deg,#0696d7,#0569a8)":"rgba(255,255,255,0.05)",border:"none",color:canCalc?"#fff":T.muted,fontWeight:700,fontSize:14,padding:"13px",borderRadius:12,cursor:canCalc?"pointer":"not-allowed",marginTop:8,transition:"all 0.2s"}}>
          {canCalc?"⚡ Design Footing (NSCP 2015 Sec. 415)":"Fill all fields to calculate"}
        </button>
      </Card>
      {result?(
        result.error?(
          <Card style={{background:"rgba(239,68,68,0.06)",border:"1.5px solid rgba(239,68,68,0.3)"}}>
            <div style={{fontSize:14,color:"#ef4444",fontWeight:700}}>⚠ {result.error}</div>
          </Card>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <Card style={{background:"rgba(34,197,94,0.06)",border:"1.5px solid rgba(34,197,94,0.3)"}}>
              <div style={{fontSize:11,color:T.muted,marginBottom:2}}>FOOTING SIZE</div>
              <div style={{fontSize:32,fontWeight:900,color:"#22c55e"}}>{result.B.toFixed(2)} m × {result.B.toFixed(2)} m</div>
              <div style={{fontSize:13,color:T.muted,marginTop:4}}>d = {result.d.toFixed(0)} mm</div>
            </Card>
            {[
              {l:"Net Bearing qnet",v:`${result.qnet.toFixed(1)} kPa`},
              {l:"Factored Pressure qu",v:`${result.qu.toFixed(2)} kPa`},
              {l:"Design Moment Mu",v:`${result.Mu_f.toFixed(1)} kN·m`},
              {l:"Design ρ",v:`${(result.rho_use*100).toFixed(4)}%`,hi:true},
              {l:"Steel Area As",v:`${result.As.toFixed(0)} mm²/m`,hi:true},
            ].map(r=>(
              <div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 14px",background:r.hi?"rgba(6,150,215,0.08)":T.dim,borderRadius:7,border:r.hi?"1px solid rgba(6,150,215,0.2)":"none"}}>
                <span style={{fontSize:12,color:T.muted}}>{r.l}</span>
                <span style={{fontSize:13,fontWeight:700,color:r.hi?"#0696d7":T.text,fontFamily:"monospace"}}>{r.v}</span>
              </div>
            ))}
            <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>NSCP 2015 Sec. 415 — Square isolated footing. Verify punching shear and wide-beam shear separately.</div>
          </div>
        )
      ):(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}>
          <Icon name="footing" size={40} color={T.muted}/>
          <div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Fill parameters and click<br/>Calculate to see results</div>
        </Card>
      )}
    </div>
  );
}

// ─── STRUCTICODE: SLAB DESIGN ────────────────────────────────────────────────
function SlabDesign({ structuralData }) {
  const sd=structuralData, s0=sd?.slabs?.[0];
  const [fc,setFc]=useState(sd?.materials?.fc??"");
  const [fy,setFy]=useState(sd?.materials?.fy??"");
  const [slabType,setSlabType]=useState(s0?.type||"one-way");
  const [L,setL]=useState(s0?.span??"");
  const [S,setS]=useState("");
  const [wDL,setWDL]=useState(s0?.DL??sd?.loads?.floorDL??"");
  const [wLL,setWLL]=useState(s0?.LL??sd?.loads?.floorLL??"");
  const [result,setResult]=useState(null);
  const [fp,setFp]=useState({fc:!!sd?.materials?.fc,fy:!!sd?.materials?.fy,L:!!s0?.span,wDL:!!(s0?.DL||sd?.loads?.floorDL),wLL:!!(s0?.LL||sd?.loads?.floorLL)});

  useEffect(()=>{
    if(!sd) return; const s1=sd?.slabs?.[0];
    if(sd.materials?.fc){setFc(sd.materials.fc);setFp(p=>({...p,fc:true}));}
    if(sd.materials?.fy){setFy(sd.materials.fy);setFp(p=>({...p,fy:true}));}
    if(s1?.span){setL(s1.span);setFp(p=>({...p,L:true}));}
    if(s1?.DL||sd.loads?.floorDL){setWDL(s1?.DL||sd.loads.floorDL);setFp(p=>({...p,wDL:true}));}
    if(s1?.LL||sd.loads?.floorLL){setWLL(s1?.LL||sd.loads.floorLL);setFp(p=>({...p,wLL:true}));}
  },[sd]);

  const calc=()=>{
    if([fc,fy,L,wDL,wLL].some(v=>v==="")||( slabType==="two-way"&&S==="")) return;
    const wu=1.2*(+wDL)+1.6*(+wLL);
    const h_min=slabType==="one-way"?(+L)*1000/20:(+S)*1000/33;
    const h=Math.max(Math.ceil(h_min/10)*10,100), d=h-25;
    let Ma=wu*(+L)*(+L)/8, Mb=null;
    if(slabType==="two-way"){
      const r=(+L)/(+S), Ca=Math.max(0.05,Math.min(0.5,0.0625+(r-1)*0.03));
      const Cb=Math.max(0.05,Math.min(0.5,0.0625-(r-1)*0.015));
      Ma=Ca*wu*(+S)*(+S); Mb=Cb*wu*(+L)*(+L);
    }
    const Mu_des=Mb!=null?Math.max(Ma,Mb):Ma;
    const Rn=(Mu_des*1e6)/(0.90*1000*d*d);
    const rho=(0.85*+fc/+fy)*(1-Math.sqrt(Math.max(0,1-(2*Rn)/(0.85*+fc))));
    const rho_use=Math.max(rho,0.0018);
    const As=rho_use*1000*d;
    setResult({wu,h,d,Ma,Mb,Mu_des,As,rho_use});
  };

  const Hint=({c})=><div style={{fontSize:11,color:T.muted,marginBottom:12,fontStyle:"italic"}}>{c}</div>;
  const canCalc=[fc,fy,L,wDL,wLL].every(v=>v!=="")&&(slabType==="one-way"||S!=="");

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        {!sd && <div style={{padding:"10px 14px",background:"rgba(6,150,215,0.06)",border:"1px solid rgba(6,150,215,0.15)",borderRadius:8,marginBottom:16,fontSize:12,color:"#0696d7",lineHeight:1.6}}>💡 Upload structural plans in <strong>AI Plan Checker</strong> to auto-fill slab data.</div>}
        <Label>Slab Type</Label>
        <Select value={slabType} onChange={e=>setSlabType(e.target.value)} style={{marginBottom:4}}>
          <option value="one-way">One-Way Slab (L/S &gt; 2)</option>
          <option value="two-way">Two-Way Slab (L/S ≤ 2)</option>
        </Select>
        <Hint c="One-way: strips span in one direction. Two-way: more efficient for near-square panels."/>
        <Label>f'c (MPa) {fp.fc&&<FromPlansBadge/>}</Label>
        <Select value={fc} onChange={e=>setFc(+e.target.value)} style={{marginBottom:16}}>
          <option value="">— Select grade —</option>
          {Object.entries(CONCRETE_GRADES).map(([k,v])=><option key={k} value={v}>{k} ({v} MPa)</option>)}
        </Select>
        <Label>fy (MPa) {fp.fy&&<FromPlansBadge/>}</Label>
        <Select value={fy} onChange={e=>setFy(+e.target.value)} style={{marginBottom:16}}>
          <option value="">— Select grade —</option>
          {Object.entries(REBAR_GRADES).map(([k,v])=><option key={k} value={v}>{k} ({v} MPa)</option>)}
        </Select>
        <div style={{display:"grid",gridTemplateColumns:slabType==="two-way"?"1fr 1fr":"1fr",gap:12,marginBottom:4}}>
          <div>
            <Label>{slabType==="two-way"?"Short Span S (m)":"Span L (m)"} {fp.L&&<FromPlansBadge/>}</Label>
            <Input type="number" value={slabType==="two-way"?S:L} onChange={e=>slabType==="two-way"?setS(e.target.value):setL(e.target.value)} step="0.1" placeholder={slabType==="two-way"?"e.g. 4.0":"e.g. 4.5"}/>
          </div>
          {slabType==="two-way"&&<div><Label>Long Span L (m) {fp.L&&<FromPlansBadge/>}</Label><Input type="number" value={L} onChange={e=>setL(e.target.value)} step="0.1" placeholder="e.g. 6.0"/></div>}
        </div>
        <Hint c="Clear span measured face-to-face of supporting beams or walls."/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:4}}>
          <div><Label>DL (kPa) {fp.wDL&&<FromPlansBadge/>}</Label><Input type="number" value={wDL} onChange={e=>setWDL(e.target.value)} step="0.1" placeholder="e.g. 3.0"/></div>
          <div><Label>LL (kPa) {fp.wLL&&<FromPlansBadge/>}</Label><Input type="number" value={wLL} onChange={e=>setWLL(e.target.value)} step="0.1" placeholder="e.g. 2.4"/></div>
        </div>
        <Hint c="LL per NSCP Table 205-1: Residential=2.0, Office=2.4, Corridor=4.8kPa."/>
        <button onClick={calc} disabled={!canCalc} style={{width:"100%",background:canCalc?"linear-gradient(135deg,#0696d7,#0569a8)":"rgba(255,255,255,0.05)",border:"none",color:canCalc?"#fff":T.muted,fontWeight:700,fontSize:14,padding:"13px",borderRadius:12,cursor:canCalc?"pointer":"not-allowed",marginTop:8,transition:"all 0.2s"}}>
          {canCalc?"⚡ Design Slab (NSCP 2015 Sec. 409)":"Fill all fields to calculate"}
        </button>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Card style={{background:"rgba(34,197,94,0.06)",border:"1.5px solid rgba(34,197,94,0.3)"}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:2}}>SLAB THICKNESS</div>
            <div style={{fontSize:36,fontWeight:900,color:"#22c55e"}}>{result.h} <span style={{fontSize:16,fontWeight:400}}>mm</span></div>
            <div style={{fontSize:13,color:T.muted,marginTop:4}}>d = {result.d} mm</div>
          </Card>
          {[
            {l:"wu (factored)",v:`${result.wu.toFixed(2)} kPa`},
            {l:result.Mb!=null?"Ma (short dir)":"Design Moment",v:`${result.Ma.toFixed(2)} kN·m/m`},
            ...(result.Mb!=null?[{l:"Mb (long dir)",v:`${result.Mb.toFixed(2)} kN·m/m`}]:[]),
            {l:"ρ used",v:`${(result.rho_use*100).toFixed(4)}%`,hi:true},
            {l:"As required",v:`${result.As.toFixed(0)} mm²/m`,hi:true},
          ].map(r=>(
            <div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 14px",background:r.hi?"rgba(6,150,215,0.08)":T.dim,borderRadius:7,border:r.hi?"1px solid rgba(6,150,215,0.2)":"none"}}>
              <span style={{fontSize:12,color:T.muted}}>{r.l}</span>
              <span style={{fontSize:13,fontWeight:700,color:r.hi?"#0696d7":T.text,fontFamily:"monospace"}}>{r.v}</span>
            </div>
          ))}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>NSCP 2015 Sec. 409 — Minimum h for deflection control. Bar spacing ≤ 3h or 450mm (Sec. 407.7.5).</div>
        </div>
      ):(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}>
          <Icon name="slab" size={40} color={T.muted}/>
          <div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Fill parameters and click<br/>Calculate to see results</div>
        </Card>
      )}
    </div>
  );
}

// ─── STRUCTICODE: LOAD COMBINATIONS ──────────────────────────────────────────
function LoadCombinations({ structuralData }) {
  const sd = structuralData;
  const [D, setD] = useState(sd?.loads?.floorDL ? sd.loads.floorDL*50 : "");
  const [L, setL] = useState(sd?.loads?.floorLL ? sd.loads.floorLL*50 : "");
  const [W, setW] = useState("");
  const [E, setE] = useState("");
  const [S, setS] = useState("");
  const [result, setResult] = useState(null);
  const [fp, setFp] = useState({D:!!sd?.loads?.floorDL, L:!!sd?.loads?.floorLL});

  useEffect(()=>{
    if (!sd?.loads) return;
    if (sd.loads.floorDL) { setD(sd.loads.floorDL*50); setFp(p=>({...p,D:true})); }
    if (sd.loads.floorLL) { setL(sd.loads.floorLL*50); setFp(p=>({...p,L:true})); }
  },[sd]);

  const calc = () => {
    if (D===""||L==="") return;
    const d=+D,l=+L,w=W?+W:0,e=E?+E:0,s=S?+S:0;
    const combos = [
      {name:"1.4D",              val:1.4*d,             formula:"1.4D"},
      {name:"1.2D + 1.6L",      val:1.2*d+1.6*l,       formula:"1.2D + 1.6L + 0.5Lr"},
      {name:"1.2D + 1.0W + L",  val:1.2*d+1.0*w+l,    formula:"1.2D + 1.0W + L"},
      {name:"0.9D + 1.0W",      val:0.9*d+1.0*w,       formula:"0.9D + 1.0W"},
      {name:"1.2D + 1.0E + L",  val:1.2*d+1.0*e+l,    formula:"1.2D + 1.0E + L"},
      {name:"0.9D + 1.0E",      val:0.9*d+1.0*e,       formula:"0.9D + 1.0E"},
    ];
    const maxVal = Math.max(...combos.map(c=>c.val));
    setResult(combos.map(c=>({...c,isMax:Math.abs(c.val-maxVal)<0.01})));
  };

  const Hint = ({c}) => <div style={{fontSize:11,color:T.muted,marginBottom:12,fontStyle:"italic"}}>{c}</div>;
  const canCalc = D!==""&&L!=="";

  const fields = [
    {l:"Dead Load D (kN)",     v:D,s:setD, fp:fp.D, ph:"e.g. 150 — total gravity dead load"},
    {l:"Live Load L (kN)",     v:L,s:setL, fp:fp.L, ph:"e.g. 120 — total floor live load"},
    {l:"Wind Load W (kN)",     v:W,s:setW, fp:false, ph:"e.g. 40 — from wind analysis (optional)"},
    {l:"Seismic Load E (kN)", v:E,s:setE, fp:false, ph:"From seismic base shear V (optional)"},
    {l:"Snow Load S (kN)",     v:S,s:setS, fp:false, ph:"0 for most PH locations (optional)"},
  ];

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        {!sd && (
          <div style={{padding:"10px 14px",background:"rgba(6,150,215,0.06)",border:"1px solid rgba(6,150,215,0.15)",borderRadius:8,marginBottom:16,fontSize:12,color:"#0696d7",lineHeight:1.6}}>
            💡 Upload plans in <strong>AI Plan Checker</strong> to auto-fill D and L, or run <strong>Seismic Load</strong> first to get E.
          </div>
        )}
        <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.5px"}}>NSCP 2015 Sec. 203 — Factored Load Combinations (LRFD)</div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
          {fields.map(f=>(
            <div key={f.l}>
              <Label>{f.l} {f.fp && <FromPlansBadge/>}</Label>
              <Input type="number" value={f.v} onChange={e=>f.s(e.target.value)} placeholder={f.ph}/>
            </div>
          ))}
        </div>
        <Hint c="D and L are required. W and E are optional — combos using zero values will show 0 contribution."/>
        <button onClick={calc} disabled={!canCalc} style={{width:"100%",background:canCalc?"linear-gradient(135deg,#0696d7,#0569a8)":"rgba(255,255,255,0.05)",border:"none",color:canCalc?"#fff":T.muted,fontWeight:700,fontSize:14,padding:"13px",borderRadius:12,cursor:canCalc?"pointer":"not-allowed",transition:"all 0.2s"}}>
          {canCalc ? "📊 Calculate Load Combinations" : "Enter D and L to calculate"}
        </button>
      </Card>

      {result ? (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{fontSize:12,color:T.muted,marginBottom:4}}>Factored load combinations — NSCP 2015 Sec. 203.3</div>
          {result.map(r=>(
            <div key={r.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:r.isMax?"rgba(239,68,68,0.08)":T.dim,borderRadius:10,border:r.isMax?"1.5px solid rgba(239,68,68,0.3)":"1px solid transparent",transition:"all 0.15s"}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:r.isMax?"#ef4444":T.text}}>{r.name}</div>
                <div style={{fontSize:10,color:T.muted,marginTop:2,fontFamily:"monospace"}}>{r.formula}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:18,fontWeight:900,color:r.isMax?"#ef4444":T.text,fontFamily:"monospace"}}>{r.val.toFixed(1)}</div>
                <div style={{fontSize:10,color:T.muted}}>kN</div>
              </div>
            </div>
          ))}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6,marginTop:4}}>
            Highlighted combination governs design. Use for member sizing and connection design.
          </div>
        </div>
      ) : (
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}>
          <Icon name="loads" size={40} color={T.muted}/>
          <div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter loads and click<br/>Calculate to see combinations</div>
        </Card>
      )}
    </div>
  );
}

// ─── BOM REVIEW DATA ─────────────────────────────────────────────────────────
const BOM_SYSTEM_PROMPT = `You are a licensed Civil Engineer and Quantity Surveyor with deep expertise in:
- DPWH Blue Book 2024 (Standard Specifications for Public Works and Highways)
- DPWH Cost Estimates Guidelines (latest edition)
- PhilGEPS and DPWH Unit Cost Reference (2024-2025)
- Philippine Construction Cost Guide (Construction Industry Authority of the Philippines — CIAP)
- PSA (Philippine Statistics Authority) construction cost indices
- Current NCR labor rates: mason ₱700-900/day, carpenter ₱700-900/day, electrician ₱900-1100/day
- Current NCR material benchmarks (2025): Ready-mix concrete ₱5,500-7,000/m³, steel rebar ₱55-65/kg, CHB ₱18-22/pc, cement ₱270-310/bag, sand ₱1,200-1,800/m³, gravel ₱1,500-2,200/m³

REVIEW PROCESS — follow ALL steps before writing output:
1. Read the plans completely. Note structure type, floor area, number of storeys, all dimensions.
2. Read the BOM line by line. Record every item, quantity, unit, and unit cost as submitted.
3. For each BOM line item: (a) verify quantity against visible plan dimensions, (b) compare unit cost to market benchmark, (c) flag status.
4. Identify items in the plans that are NOT in the BOM — these are missing items.
5. Identify BOM items with no corresponding plan basis — these are excess/unsupported items.
6. Compute your own adjusted estimate based on plan takeoff.
7. Assess overall BOM integrity: is it under-estimated (contractor risk), over-estimated (owner risk), or accurate?

QUANTITY VERIFICATION METHOD:
- Concrete volume: length × width × depth for each element
- Rebar weight: use 0.00617 × dia² × length (kg/m for common sizes: 10mm=0.617, 12mm=0.888, 16mm=1.578, 20mm=2.47 kg/m)
- Masonry: count CHB blocks from plan dimensions (wall area / 0.04m² per block standard)
- Formworks: compute exposed surfaces of concrete elements
- Floor finishes: net floor area after deducting walls

RATE VALIDATION:
- Compare each unit rate to DPWH Blue Book and NCR market benchmarks above
- Flag if unit rate is >20% below market (under-estimated — contractor loss risk)
- Flag if unit rate is >30% above market (over-estimated — value engineering opportunity)
- Mark rates as CANNOT VERIFY if no comparable reference exists

Respond ONLY as valid JSON (no markdown, no backticks, no preamble):
{
  "summary": {
    "projectName": "string",
    "projectLocation": "city/province if shown or null",
    "projectType": "Residential|Commercial|Industrial|Institutional|Mixed-Use",
    "projectScope": "1-sentence description of visible scope",
    "totalFloorArea": "m² if computable or null",
    "numberOfStoreys": null,
    "discipline": "Civil|Architectural|MEP|Full",
    "overallStatus": "ACCURATE|UNDER-ESTIMATED|OVER-ESTIMATED|INCOMPLETE",
    "contractorRiskReason": "1-sentence risk flag or null",
    "bomTotalEstimate": 0,
    "aiAdjustedEstimate": 0,
    "variance": 0,
    "variancePercent": 0,
    "criticalCount": 0,
    "warningCount": 0,
    "infoCount": 0,
    "notes": "3-4 sentence analysis: overall accuracy, biggest risks, and recommendation to owner/contractor"
  },
  "lineItems": [
    {
      "id": 1,
      "description": "exact item description from BOM",
      "trade": "Concrete|Rebar|Formworks|Masonry|Finishes|Doors & Windows|Electrical|Plumbing|Roofing|Earthworks|Others",
      "unit": "string",
      "qtyBom": 0,
      "qtyPlans": 0,
      "unitCostBom": 0,
      "unitCostMarket": 0,
      "totalBom": 0,
      "totalMarket": 0,
      "status": "OK|OVER|UNDER|MISSING|EXCESS",
      "confidence": "HIGH|MEDIUM|LOW",
      "remark": "specific note: observed vs required, or rate vs benchmark"
    }
  ],
  "missingItems": [
    {
      "id": 1,
      "description": "item clearly visible in plans but absent in BOM",
      "trade": "string",
      "estimatedQty": 0,
      "unit": "string",
      "estimatedUnitCost": 0,
      "estimatedTotal": 0,
      "planBasis": "where in the plans this item is visible"
    }
  ],
  "excessItems": [
    {
      "id": 1,
      "description": "BOM item with no clear plan basis",
      "trade": "string",
      "qtyBom": 0,
      "unit": "string",
      "totalBom": 0,
      "remark": "why this item appears unsupported"
    }
  ],
  "markupAssessment": {
    "laborRate": "fair|below market|above market|cannot verify",
    "materialRate": "fair|below market|above market|cannot verify",
    "overallMarkup": "percentage estimate or null",
    "contingency": "included|missing|cannot verify",
    "notes": "1-2 sentences on markup adequacy"
  },
  "tradeSummary": [
    { "trade": "Concrete", "bomTotal": 0, "marketTotal": 0, "variance": 0, "status": "OK|OVER|UNDER" }
  ]
}`;



function BOMReview({ apiKey }) {
  const [planFiles,     setPlanFiles]     = useState([]);
  const [bomFiles,      setBomFiles]      = useState([]);
  const [bomFiles2,     setBomFiles2]     = useState([]);
  const [result,        setResult]        = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [busy,          setBusy]          = useState(false);
  const [error,         setError]         = useState(null);
  const [dragPlan,      setDragPlan]      = useState(false);
  const [dragBom,       setDragBom]       = useState(false);
  const [dragBom2,      setDragBom2]      = useState(false);
  const [activeTab,     setActiveTab]     = useState("summary");
  const [mode,          setMode]          = useState("single");
  const [projectType,   setProjectType]   = useState("private");
  const [projectPreset, setProjectPreset] = useState("duplex_residential");
  const [marginsState,  setMarginsState]  = useState({
    materials:   { label:"Materials",   pct:0  },
    labor:       { label:"Labor",       pct:0  },
    overhead:    { label:"Overhead",    pct:10 },
    contingency: { label:"Contingency", pct:5  },
    profit:      { label:"Profit",      pct:10 },
  });
  const [showMargins, setShowMargins] = useState(false);
  const [busyMsg,     setBusyMsg]     = useState("");

  const planRef = useRef(null);
  const bomRef  = useRef(null);
  const bom2Ref = useRef(null);
  const STR = "#0696d7";
  const tick = () => new Promise(r => setTimeout(r, 0));

  // ── Restore last BOM session on mount ──
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("buildify_session_structural") || "null");
      if (!s?.bomResult?.summary) return;
      setResult(s.bomResult);
      if (s.compareResult) setCompareResult(s.compareResult);
    } catch {}
  }, []); // eslint-disable-line

  const PROJECT_PRESETS = [
    { value:"duplex_residential",  label:"Duplex / Townhouse Residence" },
    { value:"single_residential",  label:"Single Detached House" },
    { value:"condo",               label:"Condominium / Apartment Building" },
    { value:"commercial_small",    label:"Commercial Building (Small)" },
    { value:"commercial_large",    label:"Commercial Building (Large)" },
    { value:"school",              label:"School / Educational Facility" },
    { value:"barangay_hall",       label:"Barangay Hall / Gov't Building" },
    { value:"warehouse",           label:"Warehouse / Industrial" },
    { value:"road",                label:"Road / Pavement Works" },
  ];


  const STATUS_COL = { "NEEDS REVISION":"#ef4444","ACCEPTABLE WITH NOTES":"#f59e0b","VALIDATED":"#10b981" };
  const QTY_COL  = { OK:"#10b981",OVER:"#f59e0b",UNDER:"#ef4444",MISSING:"#8b5cf6",EXCESS:"#64748b" };
  const COST_COL = { OK:"#10b981",HIGH:"#f59e0b",LOW:"#ef4444",UNKNOWN:"#64748b" };
  const MISS_COL = { CRITICAL:"#ef4444",WARNING:"#f59e0b",INFO:"#3b82f6" };

  const addPlanFiles  = useCallback(fs => setPlanFiles(p => [...p, ...Array.from(fs).map(f => ({ file:f, id:Math.random().toString(36).slice(2), name:f.name, size:f.size, type:f.type||"application/octet-stream" }))]), []);
  const addBomFiles   = useCallback(fs => setBomFiles(p =>  [...p, ...Array.from(fs).map(f => ({ file:f, id:Math.random().toString(36).slice(2), name:f.name, size:f.size, type:f.type||"application/octet-stream" }))]), []);
  const addBomFiles2  = useCallback(fs => setBomFiles2(p => [...p, ...Array.from(fs).map(f => ({ file:f, id:Math.random().toString(36).slice(2), name:f.name, size:f.size, type:f.type||"application/octet-stream" }))]), []);

  const computeAdjusted = (base) => {
    return base
      * (1 + marginsState.materials.pct   / 100)
      * (1 + marginsState.labor.pct       / 100)
      * (1 + marginsState.overhead.pct    / 100)
      * (1 + marginsState.contingency.pct / 100)
      * (1 + marginsState.profit.pct      / 100);
  };

  const encodeFiles = async (fileList, role) => {
    const blocks = [];
    for (let i = 0; i < fileList.length; i++) {
      const fo = fileList[i];
      setBusyMsg(`Reading ${role} file ${i+1}/${fileList.length}: ${fo.name}…`); await tick();
      let b64;
      if (fo.type.startsWith("image/")) {
        setBusyMsg(`Compressing: ${fo.name}…`); await tick();
        b64 = await compressImage(fo.file);
        blocks.push({ type:"image", source:{ type:"base64", media_type:"image/jpeg", data:b64 } });
      } else {
        b64 = await toBase64(fo.file);
        blocks.push({ type:"document", source:{ type:"base64", media_type:"application/pdf", data:b64 } });
      }
      blocks.push({ type:"text", text:`[${role}: ${fo.name}]` });
    }
    return blocks;
  };

  const buildContext = (extra) => {
    const preset = PROJECT_PRESETS.find(p => p.value === projectPreset)?.label || projectPreset;
    return `PROJECT CONTEXT:
- Building Type: ${preset}
- Rate Benchmark: ${projectType === "government" ? "GOVERNMENT / DPWH Blue Book rates — flag items exceeding allowable DPWH unit costs" : "PRIVATE — current NCR market rates (2025)"}
${extra || ""}

Return ONLY the JSON structure specified. No markdown, no explanation.`;
  };

  const run = async () => {
    if (!planFiles.length) { setError("Please upload at least one plan file."); return; }
    const allBom = [...bomFiles, ...bomFiles2];
    const bad = allBom.find(f => !f.type.startsWith("image/") && f.type !== "application/pdf" && !f.name.match(/\.pdf$/i));
    if (bad) { setError(`"${bad.name}" must be a PDF. In Excel: File → Save As → PDF, then re-upload.`); return; }

    setBusy(true); setError(null); setResult(null); setCompareResult(null);
    try {
      const planBlocks = await encodeFiles(planFiles, "PLAN");

      // Primary BOM
      const bomBlocks1 = await encodeFiles(bomFiles, "BOM-PRIMARY");
      const msg1 = [...planBlocks, ...bomBlocks1, { type:"text", text:buildContext() }];
      setBusyMsg("AI reviewing BOM — quantities, costs, completeness…"); await tick();
      const data1 = await callAI({ apiKey, system:BOM_SYSTEM_PROMPT, messages:[{ role:"user", content:msg1 }], max_tokens:8000 });
      const text1 = data1.content?.map(b => b.text||"").join("").replace(/```json|```/g,"").trim();
      let parsed1;
      try { parsed1 = JSON.parse(text1); } catch { throw new Error("Could not parse AI response. Please try again."); }
      setResult(parsed1);
      addHistoryEntry({ tool:"bom", module:"structural", projectName:parsed1?.summary?.projectName||"BOM Review", meta:{ totalHigh:parsed1?.summary?.totalCost, findings:(parsed1?.lineItems?.length||0)+(parsed1?.missingItems?.length||0), summary:parsed1?.summary?.notes||"" } });
      // Direct save — merge with existing structural session
      try {
        const _cur = JSON.parse(localStorage.getItem("buildify_session_structural") || "{}");
        localStorage.setItem("buildify_session_structural", JSON.stringify({ ..._cur, bomResult: parsed1, _savedAt: new Date().toISOString(), _module: "structural", userId: "local" }));
      } catch(e) { console.warn("Session save failed", e); }

      // Comparison BOM
      if (mode === "compare" && bomFiles2.length) {
        setBusyMsg("AI reviewing Revised BOM for comparison…"); await tick();
        const bomBlocks2 = await encodeFiles(bomFiles2, "BOM-REVISED");
        const msg2 = [...planBlocks, ...bomBlocks2, { type:"text", text:buildContext("This is a REVISED BOM submitted after initial review. Identify what improved, what was gamed (e.g. qty reduced without basis), and whether overall risk improved.") }];
        const data2 = await callAI({ apiKey, system:BOM_SYSTEM_PROMPT, messages:[{ role:"user", content:msg2 }], max_tokens:8000 });
        const text2 = data2.content?.map(b => b.text||"").join("").replace(/```json|```/g,"").trim();
        let parsed2; try { parsed2 = JSON.parse(text2); } catch { parsed2 = null; }
        setCompareResult(parsed2);
      }

      setActiveTab("summary");
    } catch(e) {
      setError(e.message || "Analysis failed. Please try again.");
    } finally {
      setBusy(false); setBusyMsg("");
    }
  };

  const fmt  = n => `₱${(+n||0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const fmtN = n => (+n||0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2});

  const lineItems    = result?.lineItems     || [];
  const missingItems = result?.missingItems  || [];
  const excessItems  = result?.excessItems   || [];
  const markup       = result?.markupAssessment;
  const aiBase       = result?.summary?.aiAdjustedEstimate || 0;
  const adjustedTotal= computeAdjusted(aiBase);
  const bomTotal     = result?.summary?.bomTotalEstimate || 0;
  const tradeScores  = result?.costBreakdown || {};  // keyed by trade, value is PHP amount
  const risk         = result?.summary?.contractorRisk;

  const exportReport = () => {
    if (!result) return;
    const date = new Date().toLocaleDateString("en-PH", { year:"numeric", month:"long", day:"numeric" });
    const RISK_COL_MAP = { "ACCURATE":"#22c55e","UNDER-ESTIMATED":"#ef4444","OVER-ESTIMATED":"#f59e0b","INCOMPLETE":"#64748b" };
    const overallStatus = result.summary?.overallStatus || "INCOMPLETE";
    const riskColor = RISK_COL_MAP[overallStatus] || "#64748b";
    const ITEM_STATUS_COL = { "OK":"#22c55e","OVER":"#f59e0b","UNDER":"#ef4444","MISSING":"#ef4444","EXCESS":"#94a3b8" };
    const SEV_COL = { "CRITICAL":"#ef4444","WARNING":"#f59e0b" };
    const mRows = Object.entries(marginsState).map(([k,m]) =>
      `<tr><td>${m.label}</td><td style="text-align:right">${m.pct}%</td><td style="text-align:right">${fmt(aiBase*(m.pct/100))}</td></tr>`).join("");
    const liRows = lineItems.map(li => {
      const costStatus = (li.unitCostBom && li.unitCostMarket)
        ? (li.unitCostBom > li.unitCostMarket*1.1 ? "HIGH" : li.unitCostBom < li.unitCostMarket*0.9 ? "LOW" : "OK")
        : "—";
      const costColor = costStatus==="HIGH"?"#f59e0b":costStatus==="LOW"?"#ef4444":"#22c55e";
      return `<tr>
        <td>${li.description||"—"}</td>
        <td>${li.trade||"—"}</td>
        <td>${li.unit||"—"}</td>
        <td style="text-align:right">${fmtN(li.qtyBom)}</td>
        <td style="text-align:right">${fmtN(li.qtyPlans)}</td>
        <td style="color:${ITEM_STATUS_COL[li.status]||"#64748b"};font-weight:700;text-align:center">${li.status||"—"}</td>
        <td style="text-align:right">${fmt(li.unitCostBom)}</td>
        <td style="text-align:right">${fmt(li.unitCostMarket)}</td>
        <td style="color:${costColor};font-weight:700;text-align:center">${costStatus}</td>
        <td style="text-align:right">${fmt(li.totalBom)}</td>
        <td style="text-align:right">${fmt(li.totalMarket)}</td>
        <td style="font-size:11px">${li.remark||"—"}</td>
      </tr>`;
    }).join("");
    const missRows = missingItems.map(m =>
      `<tr><td><span style="color:${SEV_COL[m.severity||"WARNING"]||"#f59e0b"};font-weight:700">${m.severity||"WARNING"}</span></td><td>${m.description||"—"}</td><td>${m.trade||"—"}</td><td>${m.estimatedQty||"—"} ${m.unit||""}</td><td style="text-align:right">${fmt(m.estimatedCost)}</td></tr>`).join("");
    const costBk = result.costBreakdown || {};
    const tradeRows = Object.entries(costBk).filter(([,v])=>v>0).map(([t,v]) =>
      `<tr><td style="text-transform:capitalize">${t.replace(/_/g," ")}</td><td style="text-align:right;font-weight:700;color:#0696d7">${fmt(v)}</td></tr>`).join("");
    const w = window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>BOM Review — ${result.summary.projectName||"Project"}</title>
    <style>body{font-family:Arial,sans-serif;margin:40px;color:#111;font-size:12px}
    table{border-collapse:collapse;width:100%;margin-bottom:24px}
    th{background:#1e3a5f;color:#fff;padding:8px 6px;text-align:left;font-size:11px}
    td{padding:7px 6px;border-bottom:1px solid #e5e7eb;vertical-align:top}
    tr:nth-child(even) td{background:#f9fafb}
    h1{color:#1e3a5f;font-size:22px}
    h2{color:#1e3a5f;font-size:14px;margin:24px 0 8px;border-bottom:2px solid #e5e7eb;padding-bottom:4px}
    .badge{display:inline-block;padding:3px 10px;border-radius:4px;font-weight:700;font-size:11px}
    .total-row td{background:#1e3a5f!important;color:#fff!important;font-weight:700}
    @media print{button{display:none}}</style></head><body>
    <button onclick="window.print()" style="float:right;padding:8px 20px;background:#1e3a5f;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">🖨️ Print / PDF</button>
    <h1>📋 BOM Review Report</h1>
    <p style="color:#6b7280">Project: <strong>${result.summary.projectName||"—"}</strong> &nbsp;·&nbsp; ${result.summary.projectType||"—"} &nbsp;·&nbsp; ${date}</p>
    <p style="color:#6b7280;font-size:11px;margin-bottom:12px">${result.summary.projectScope||""}</p>
    <table style="width:auto"><tr><th>Overall Status</th><td><span class="badge" style="background:${riskColor}22;color:${riskColor};border:1px solid ${riskColor}">${overallStatus}</span></td></tr>
    <tr><th>Contractor Risk Note</th><td style="font-size:11px;color:#6b7280">${result.summary.contractorRiskReason||"—"}</td></tr>
    <tr><th>BOM Total</th><td><strong>${fmt(bomTotal)}</strong></td></tr>
    <tr><th>AI Adjusted Estimate</th><td><strong style="color:#0696d7">${fmt(aiBase)}</strong></td></tr>
    <tr><th>Variance</th><td>${fmt(result.summary.variance||0)} (${(result.summary.variancePercent||0).toFixed(1)}%)</td></tr></table>
    <p style="color:#6b7280;font-size:12px;margin:8px 0 16px">${result.summary.notes||""}</p>
    ${result.summary.bomDateWarning ? `<p style="color:#d97706;background:#fef3c7;padding:8px 12px;border-radius:4px;margin-bottom:8px">📅 ${result.summary.bomDateWarning}</p>` : ""}
    ${result.priceEscalationWarning ? `<p style="color:#dc2626;background:#fee2e2;padding:8px 12px;border-radius:4px;margin-bottom:8px">📈 ${result.priceEscalationWarning}</p>` : ""}
    <h2>Cost Summary with Margins</h2>
    <table style="width:360px"><tr><th>Item</th><th style="text-align:right">Amount</th></tr>
    <tr><td>BOM Submitted Total</td><td style="text-align:right">${fmt(bomTotal)}</td></tr>
    <tr><td>AI Validated Base</td><td style="text-align:right">${fmt(aiBase)}</td></tr>
    ${mRows}
    <tr class="total-row"><td>ADJUSTED TOTAL (with margins)</td><td style="text-align:right">${fmt(adjustedTotal)}</td></tr></table>
    ${tradeRows ? `<h2>Cost Breakdown by Trade</h2><table style="width:400px"><tr><th>Trade</th><th style="text-align:right">Amount (PHP)</th></tr>${tradeRows}</table>` : ""}
    <h2>Markup Assessment</h2>
    <p>Observed: <strong>${markup?.observedMarkup||"—"}%</strong> &nbsp;·&nbsp; Recommended: <strong>${markup?.recommendedMarkup||"—"}%</strong> &nbsp;·&nbsp; Flag: <strong>${markup?.flag||"—"}</strong></p>
    <p style="font-style:italic;color:#6b7280">${markup?.note||""}</p>
    <h2>Line Items (${lineItems.length})</h2>
    <table><tr><th>Description</th><th>Trade</th><th>Unit</th><th style="text-align:right">Qty BOM</th><th style="text-align:right">Qty Plans</th><th>Status</th><th style="text-align:right">UC BOM</th><th style="text-align:right">UC Market</th><th>Cost</th><th style="text-align:right">Total BOM</th><th style="text-align:right">Total Market</th><th>Remarks</th></tr>
    ${liRows}</table>
    ${missingItems.length ? `<h2>Missing Items (${missingItems.length})</h2><table><tr><th>Severity</th><th>Description</th><th>Trade</th><th>Est. Qty</th><th>Est. Cost</th></tr>${missRows}</table>` : ""}
    <p style="margin-top:28px;font-size:10px;color:#9ca3af">AI-assisted BOM review · All findings must be verified by a licensed QS or Engineer before submission · Buildify · Powered by Claude AI</p>
    </body></html>`);
    w.document.close(); setTimeout(()=>w.print(), 400);
  };

  const DropZone = ({ label, sublabel, files, onAdd, onRemove, dragState, setDrag, inputRef, icon, accent }) => {
    const c = accent || STR;
    return (
      <div>
        <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);onAdd(e.dataTransfer.files)}} onClick={()=>inputRef.current?.click()}
          style={{border:`2px dashed ${dragState?c:T.border}`,borderRadius:12,padding:"20px",textAlign:"center",cursor:"pointer",background:dragState?`${c}09`:"rgba(255,255,255,0.01)",transition:"all 0.2s",marginBottom:8}}>
          <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e=>onAdd(e.target.files)} style={{display:"none"}}/>
          <div style={{fontSize:22,marginBottom:5}}>{icon}</div>
          <div style={{fontWeight:700,fontSize:12,color:T.text,marginBottom:3}}>{label}</div>
          <div style={{color:T.muted,fontSize:10,marginBottom:9}}>{sublabel}</div>
          <div style={{display:"inline-block",background:c,color:"#fff",fontWeight:700,padding:"5px 14px",borderRadius:7,fontSize:11}}>Choose Files</div>
        </div>
        {files.length > 0 && (
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {files.map(fo => (
              <div key={fo.id} style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:7,padding:"4px 8px",display:"flex",alignItems:"center",gap:5,maxWidth:200}}>
                <span style={{fontSize:10}}>{fo.type?.startsWith("image/")?"🖼️":"📄"}</span>
                <span style={{fontSize:10,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{fo.name}</span>
                <button onClick={e=>{e.stopPropagation();onRemove(fo.id)}} style={{background:"rgba(239,68,68,0.12)",border:"none",color:T.danger,width:16,height:16,borderRadius:3,cursor:"pointer",fontSize:10,flexShrink:0}}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleNewBOM = () => {
    setResult(null); setCompareResult(null); setPlanFiles([]); setBomFiles([]); setBomFiles2([]);
    // Session stays in localStorage so history cards can reopen it
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <NoKeyBanner/>

      {/* ── New BOM Review button when result is loaded ── */}
      {result && (
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <button onClick={handleNewBOM}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:9,
              border:"1.5px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.07)",
              color:"#ef4444",cursor:"pointer",fontSize:12,fontWeight:700}}>
            <Icon name="plus" size={13} color="#ef4444"/> New BOM Review
          </button>
        </div>
      )}

      {/* ── Config + Upload Panel ── */}
      <Card>
        {/* Mode + Rate toggles */}
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{display:"flex",gap:5}}>
            {[{v:"single",l:"Single BOM"},{v:"compare",l:"🔄 Compare 2 BOMs"}].map(o=>(
              <button key={o.v} onClick={()=>setMode(o.v)} style={{padding:"6px 13px",borderRadius:8,border:`1.5px solid ${mode===o.v?STR:T.border}`,background:mode===o.v?"rgba(59,130,246,0.12)":"transparent",color:mode===o.v?STR:T.muted,cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.15s"}}>{o.l}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:5,marginLeft:"auto"}}>
            {[{v:"private",l:"🏠 Private / NCR Rates"},{v:"government",l:"🏛️ Gov't / DPWH Rates"}].map(o=>(
              <button key={o.v} onClick={()=>setProjectType(o.v)} style={{padding:"6px 13px",borderRadius:8,border:`1.5px solid ${projectType===o.v?"#f59e0b":T.border}`,background:projectType===o.v?"rgba(245,158,11,0.12)":"transparent",color:projectType===o.v?"#f59e0b":T.muted,cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.15s"}}>{o.l}</button>
            ))}
          </div>
        </div>

        {/* Project Preset */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.5px"}}>Project Type Preset</div>
          <select value={projectPreset} onChange={e=>setProjectPreset(e.target.value)}
            style={{background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:9,padding:"8px 14px",color:T.text,fontSize:13,outline:"none",width:"100%",cursor:"pointer"}}>
            {PROJECT_PRESETS.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        {/* Upload zones */}
        <div style={{display:"grid",gridTemplateColumns:`repeat(${mode==="compare"?3:2},1fr)`,gap:12,marginBottom:14}}>
          <div style={{display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",flexDirection:"column",gap:2,marginBottom:5,minHeight:34}}>
              <div style={{fontSize:10,fontWeight:700,color:STR}}>📐 Engineering Plans *</div>
              <div style={{fontSize:10,color:"transparent",userSelect:"none"}}>placeholder</div>
            </div>
            <DropZone label="Upload Plans" sublabel="PDF · JPG · PNG" files={planFiles} onAdd={addPlanFiles} onRemove={id=>setPlanFiles(p=>p.filter(f=>f.id!==id))} dragState={dragPlan} setDrag={setDragPlan} inputRef={planRef} icon="📐" accent={STR}/>
          </div>
          <div style={{display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",flexDirection:"column",gap:2,marginBottom:5,minHeight:34}}>
              <div style={{fontSize:10,fontWeight:700,color:"#ff6b2b"}}>{mode==="compare"?"📋 BOM #1 — Original":"📋 Draft BOM"} <span style={{color:T.muted,fontWeight:400}}>(optional)</span></div>
              <div style={{fontSize:10,color:T.muted}}>💡 Excel → Save As PDF before uploading</div>
            </div>
            <DropZone label={mode==="compare"?"Original BOM (PDF)":"Upload BOM (PDF)"} sublabel="PDF only" files={bomFiles} onAdd={addBomFiles} onRemove={id=>setBomFiles(p=>p.filter(f=>f.id!==id))} dragState={dragBom} setDrag={setDragBom} inputRef={bomRef} icon="📋" accent="#ff6b2b"/>
          </div>
          {mode==="compare" && (
            <div style={{display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",flexDirection:"column",gap:2,marginBottom:5,minHeight:34}}>
                <div style={{fontSize:10,fontWeight:700,color:"#10b981"}}>📋 BOM #2 — Revised <span style={{color:T.muted,fontWeight:400}}>(optional)</span></div>
                <div style={{fontSize:10,color:T.muted}}>💡 Contractor's revised / updated BOM</div>
              </div>
              <DropZone label="Revised BOM (PDF)" sublabel="PDF only" files={bomFiles2} onAdd={addBomFiles2} onRemove={id=>setBomFiles2(p=>p.filter(f=>f.id!==id))} dragState={dragBom2} setDrag={setDragBom2} inputRef={bom2Ref} icon="🔄" accent="#10b981"/>
            </div>
          )}
        </div>

        {/* Margin Controls */}
        <div style={{marginBottom:14}}>
          <button onClick={()=>setShowMargins(!showMargins)} style={{display:"flex",alignItems:"center",gap:8,background:showMargins?"rgba(59,130,246,0.1)":T.dim,border:`1.5px solid ${showMargins?STR:T.border}`,color:showMargins?STR:T.muted,borderRadius:10,padding:"8px 16px",cursor:"pointer",fontWeight:700,fontSize:12,transition:"all 0.15s",width:"100%"}}>
            <span>⚙️</span>
            <span>Margin Controls</span>
            <span style={{marginLeft:"auto",fontSize:11}}>{showMargins?"▲":"▼"}</span>
            <span style={{background:`${STR}22`,color:STR,fontSize:11,padding:"2px 10px",borderRadius:6,fontWeight:800}}>+{Object.values(marginsState).reduce((a,m)=>a+m.pct,0)}% total uplift</span>
          </button>
          {showMargins && (
            <div style={{marginTop:10,background:`rgba(59,130,246,0.04)`,border:`1.5px solid ${STR}33`,borderRadius:12,padding:14}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:9}}>
                {Object.entries(marginsState).map(([key,m])=>(
                  <div key={key} style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px"}}>
                    <div style={{fontSize:9,fontWeight:700,color:T.muted,marginBottom:5,textTransform:"uppercase"}}>{m.label}</div>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <input type="number" value={m.pct} min={0} max={100} step={0.5}
                        onChange={e=>setMarginsState(p=>({...p,[key]:{...p[key],pct:+e.target.value}}))}
                        style={{flex:1,background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:7,padding:"7px 8px",color:T.text,fontSize:14,fontWeight:800,outline:"none",textAlign:"center"}}
                        onFocus={e=>e.target.style.borderColor=STR} onBlur={e=>e.target.style.borderColor=T.border}/>
                      <span style={{fontSize:14,fontWeight:800,color:STR}}>%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:13,color:T.danger}}>⚠️ {error}</div>}

        <button onClick={run} disabled={busy||!planFiles.length} style={{width:"100%",background:busy||!planFiles.length?`rgba(59,130,246,0.2)`:`linear-gradient(135deg,${STR},#0369a1)`,border:"none",color:busy||!planFiles.length?"#555":"#fff",fontWeight:800,fontSize:15,padding:"13px",borderRadius:12,cursor:busy||!planFiles.length?"not-allowed":"pointer",transition:"all 0.2s"}}>
          {busy ? (busyMsg||"⚙️ Processing…") : mode==="compare" ? "📋 Run BOM Comparison Review" : "📋 Run BOM Review"}
        </button>
        {busy && (
          <div style={{marginTop:10,background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:10,padding:"10px 16px",fontSize:12,color:STR,display:"flex",alignItems:"center",gap:10}}>
            <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⏳</span>
            <span>{busyMsg||"Working…"}</span>
          </div>
        )}
        {!planFiles.length && !busy && <div style={{textAlign:"center",fontSize:11,color:T.muted,marginTop:7}}>Upload at least one plan file to begin</div>}
      </Card>

      {/* ── RESULTS ── */}
      {result && (
        <div style={{animation:"fadeIn 0.35s ease"}}>

          {/* Summary header card */}
          <Card style={{marginBottom:14,background:`${STATUS_COL[result.summary.overallStatus]}08`,border:`1.5px solid ${STATUS_COL[result.summary.overallStatus]}44`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:14}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontSize:10,color:T.muted,marginBottom:3}}>PROJECT</div>
                <div style={{fontWeight:800,fontSize:19,color:T.text,letterSpacing:"-0.5px"}}>{result.summary.projectName}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:2}}>{result.summary.projectType} · {result.summary.discipline}</div>
                {result.summary.projectScope && <div style={{fontSize:10,color:T.muted,marginTop:2,fontStyle:"italic"}}>{result.summary.projectScope}</div>}
                <div style={{marginTop:12,display:"flex",gap:16,flexWrap:"wrap"}}>
                  {[{n:result.summary.criticalCount,l:"CRITICAL",c:"#ef4444"},{n:result.summary.warningCount,l:"WARNINGS",c:"#f59e0b"},{n:missingItems.length,l:"MISSING",c:"#8b5cf6"},{n:excessItems.length,l:"EXCESS",c:"#64748b"}].map(s=>(
                    <div key={s.l}><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.n}</div><div style={{fontSize:9,color:T.muted}}>{s.l}</div></div>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,minWidth:240}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                  <div style={{background:T.dim,borderRadius:9,padding:"10px 12px",textAlign:"right"}}>
                    <div style={{fontSize:9,color:T.muted,marginBottom:2}}>BOM SUBMITTED</div>
                    <div style={{fontSize:14,fontWeight:800,color:"#f59e0b",fontFamily:"monospace"}}>{fmt(bomTotal)}</div>
                  </div>
                  <div style={{background:T.dim,borderRadius:9,padding:"10px 12px",textAlign:"right"}}>
                    <div style={{fontSize:9,color:T.muted,marginBottom:2}}>AI BASE</div>
                    <div style={{fontSize:14,fontWeight:800,color:STR,fontFamily:"monospace"}}>{fmt(aiBase)}</div>
                  </div>
                </div>
                <div style={{background:`${STR}12`,border:`1.5px solid ${STR}44`,borderRadius:9,padding:"11px 14px",textAlign:"right"}}>
                  <div style={{fontSize:9,color:T.muted,marginBottom:2}}>ADJUSTED TOTAL (with margins)</div>
                  <div style={{fontSize:20,fontWeight:900,color:STR,fontFamily:"monospace"}}>{fmt(adjustedTotal)}</div>
                  {bomTotal>0 && <div style={{fontSize:10,color:adjustedTotal>bomTotal?"#ef4444":"#10b981",marginTop:2}}>
                    {adjustedTotal>bomTotal?`▲ ${((adjustedTotal/bomTotal-1)*100).toFixed(1)}% vs submitted`:`▼ ${((1-adjustedTotal/bomTotal)*100).toFixed(1)}% vs submitted`}
                  </div>}
                </div>

                <div style={{background:`${STATUS_COL[result.summary.overallStatus]}14`,border:`1.5px solid ${STATUS_COL[result.summary.overallStatus]}44`,borderRadius:9,padding:"8px 14px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:T.muted,marginBottom:2}}>OVERALL STATUS</div>
                  <div style={{fontSize:12,fontWeight:800,color:STATUS_COL[result.summary.overallStatus]}}>{result.summary.overallStatus}</div>
                </div>
              </div>
            </div>
            {(result.summary.bomDateWarning || result.priceEscalationWarning) && (
              <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:6}}>
                {result.summary.bomDateWarning && <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#f59e0b"}}>📅 {result.summary.bomDateWarning}</div>}
                {result.priceEscalationWarning  && <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#ef4444"}}>📈 {result.priceEscalationWarning}</div>}
              </div>
            )}
            <div style={{marginTop:12,fontSize:12,color:T.muted,lineHeight:1.6,background:T.dim,borderRadius:8,padding:"10px 14px"}}>{result.summary.notes}</div>
          </Card>

          {/* Tab nav */}
          <div style={{display:"flex",gap:5,marginBottom:14,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {[
                {k:"summary",   l:"📊 Cost Breakdown"},
                {k:"scope",     l:"📈 Scope Scores"},
                {k:"lineitems", l:`📋 Line Items (${lineItems.length})`},
                {k:"missing",   l:`🔴 Missing (${missingItems.length})`},
                {k:"excess",    l:`🟡 Excess (${excessItems.length})`},
                {k:"markup",    l:"⚙️ Markup"},
                ...(compareResult ? [{k:"compare",l:"🔄 Compare"}] : []),
              ].map(t=>(
                <button key={t.k} onClick={()=>setActiveTab(t.k)} style={{padding:"6px 12px",borderRadius:8,border:`1.5px solid ${activeTab===t.k?STR:T.border}`,background:activeTab===t.k?"rgba(59,130,246,0.12)":"transparent",color:activeTab===t.k?STR:T.muted,cursor:"pointer",fontSize:11,fontWeight:700,transition:"all 0.15s"}}>{t.l}</button>
              ))}
            </div>
            <button onClick={exportReport} style={{background:`linear-gradient(135deg,${STR},#6366f1)`,border:"none",color:"#fff",fontWeight:700,padding:"7px 16px",borderRadius:9,cursor:"pointer",fontSize:11}}>📄 Export Report</button>
          </div>

          {/* COST BREAKDOWN */}
          {activeTab==="summary" && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <Card>
                <Label>Cost Components</Label>
                <div style={{display:"flex",flexDirection:"column",gap:7,marginTop:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"7px 12px",background:T.dim,borderRadius:8}}><span style={{fontSize:12,color:T.muted}}>BOM Submitted</span><span style={{fontSize:13,fontWeight:700,color:"#f59e0b",fontFamily:"monospace"}}>{fmt(bomTotal)}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"7px 12px",background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:8}}><span style={{fontSize:12,color:T.muted}}>AI Validated Base</span><span style={{fontSize:13,fontWeight:700,color:STR,fontFamily:"monospace"}}>{fmt(aiBase)}</span></div>
                  <div style={{height:1,background:T.border}}/>
                  {Object.entries(marginsState).map(([k,m])=>m.pct>0?(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 12px",background:T.dim,borderRadius:7}}><span style={{fontSize:12,color:T.muted}}>{m.label} +{m.pct}%</span><span style={{fontSize:12,fontWeight:600,color:T.text,fontFamily:"monospace"}}>+{fmt(aiBase*(m.pct/100))}</span></div>
                  ):null)}
                  <div style={{display:"flex",justifyContent:"space-between",padding:"11px 14px",background:`${STR}14`,border:`1.5px solid ${STR}44`,borderRadius:10}}><span style={{fontSize:14,fontWeight:800,color:T.text}}>ADJUSTED TOTAL</span><span style={{fontSize:16,fontWeight:900,color:STR,fontFamily:"monospace"}}>{fmt(adjustedTotal)}</span></div>
                </div>
              </Card>
              <Card>
                <Label>Variance Analysis</Label>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:12}}>
                  {[{l:"BOM vs AI Base",a:bomTotal,b:aiBase},{l:"BOM vs Adjusted",a:bomTotal,b:adjustedTotal},{l:"AI Base vs Adjusted",a:aiBase,b:adjustedTotal}].map(r=>{
                    const diff=r.b-r.a; const pct=r.a?(diff/r.a*100):0; const col=diff>0?"#ef4444":diff<0?"#10b981":"#64748b";
                    return (<div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:T.dim,borderRadius:9}}>
                      <span style={{fontSize:12,color:T.muted}}>{r.l}</span>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:14,fontWeight:800,color:col,fontFamily:"monospace"}}>{diff>=0?"+":""}{fmt(diff)}</div>
                        <div style={{fontSize:10,color:col}}>{pct>=0?"+":""}{pct.toFixed(1)}%</div>
                      </div>
                    </div>);
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* SCOPE COMPLETENESS */}
          {activeTab==="scope" && (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <Card>
                <Label>Cost Breakdown by Trade</Label>
                <div style={{fontSize:12,color:T.muted,marginTop:4,marginBottom:16,lineHeight:1.5}}>Estimated cost distribution across trades based on AI analysis of the BOM and plans.</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {Object.entries(tradeScores).map(([trade,score])=>{
                    const col = "#0696d7";
                    const lbl = fmt(score);
                    return (
                      <div key={trade} style={{background:T.dim,borderRadius:12,padding:"14px 16px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <span style={{fontWeight:700,fontSize:14,color:T.text,textTransform:"capitalize"}}>{trade}</span>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <span style={{fontSize:14,fontWeight:800,color:col,fontFamily:"monospace"}}>{lbl}</span>
                          </div>
                        </div>
                        <div style={{background:T.border,borderRadius:99,height:8,overflow:"hidden"}}>
                          <div style={{width:`${score}%`,height:"100%",background:`linear-gradient(90deg,${col}88,${col})`,borderRadius:99,transition:"width 0.6s ease"}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
              {missingItems.length>0 && (
                <Card>
                  <Label>Missing Items by Priority</Label>
                  <div style={{display:"flex",flexDirection:"column",gap:7,marginTop:12}}>
                    {["CRITICAL","WARNING","INFO"].map(pri=>{
                      const items = missingItems.filter(m=>(m.priority||"WARNING")===pri);
                      if(!items.length) return null;
                      return (<div key={pri}>
                        <div style={{fontSize:10,fontWeight:800,color:MISS_COL[pri],marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>{pri} — {items.length} item{items.length>1?"s":""}</div>
                        {items.map((m,i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 12px",background:T.dim,borderRadius:8,marginBottom:4}}>
                            <span style={{fontSize:12,color:T.text}}>{m.description} <span style={{color:T.muted}}>· {m.estimatedQty}</span></span>
                            <span style={{fontSize:12,fontWeight:700,color:MISS_COL[pri],fontFamily:"monospace"}}>{fmt(m.estimatedCost)}</span>
                          </div>
                        ))}
                      </div>);
                    })}
                    <div style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:9,marginTop:4}}>
                      <span style={{fontSize:13,fontWeight:700,color:"#8b5cf6"}}>Total missing value</span>
                      <span style={{fontSize:14,fontWeight:800,color:"#8b5cf6",fontFamily:"monospace"}}>{fmt(missingItems.reduce((s,m)=>s+(+m.estimatedCost||0),0))}</span>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* LINE ITEMS */}
          {activeTab==="lineitems" && (
            <Card style={{padding:0,overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}>
                  <thead><tr style={{background:"rgba(59,130,246,0.1)"}}>
                    {["Description","Category","Unit","Qty BOM","Qty Plans","Qty","Unit Cost BOM","Unit Cost Market","Cost","Total BOM","Total Market","Remarks"].map(h=>(
                      <th key={h} style={{padding:"9px 10px",textAlign:["Total BOM","Total Market","Unit Cost BOM","Unit Cost Market","Qty BOM","Qty Plans"].includes(h)?"right":"left",fontSize:10,color:T.muted,fontWeight:700,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {lineItems.map((li,i)=>(
                      <tr key={li.id||i} style={{borderBottom:`1px solid ${T.border}`,background:i%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
                        <td style={{padding:"8px 10px",fontSize:12,color:T.text,fontWeight:600,maxWidth:180}}>{li.description}</td>
                        <td style={{padding:"8px 10px",fontSize:11,color:T.muted}}>{li.trade}</td>
                        <td style={{padding:"8px 10px",fontSize:11,color:T.muted,textAlign:"center"}}>{li.unit}</td>
                        <td style={{padding:"8px 10px",fontSize:11,textAlign:"right",fontFamily:"monospace",color:T.text}}>{fmtN(li.qtyBom)}</td>
                        <td style={{padding:"8px 10px",fontSize:11,textAlign:"right",fontFamily:"monospace",color:T.text}}>{fmtN(li.qtyPlans)}</td>
                        <td style={{padding:"8px 10px",textAlign:"center"}}><span style={{background:`${QTY_COL[li.status]||"#64748b"}18`,color:QTY_COL[li.status]||"#64748b",fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:4}}>{li.status}</span></td>
                        <td style={{padding:"8px 10px",fontSize:11,textAlign:"right",fontFamily:"monospace",color:T.text}}>{fmt(li.unitCostBom)}</td>
                        <td style={{padding:"8px 10px",fontSize:11,textAlign:"right",fontFamily:"monospace",color:T.text}}>{fmt(li.unitCostMarket)}</td>
                        <td style={{padding:"8px 10px",textAlign:"center"}}><span style={{background:`${COST_COL[li.unitCostBom>li.unitCostMarket*1.1?"HIGH":li.unitCostBom<li.unitCostMarket*0.9?"LOW":"OK"]||"#64748b"}18`,color:COST_COL[li.unitCostBom>li.unitCostMarket*1.1?"HIGH":li.unitCostBom<li.unitCostMarket*0.9?"LOW":"OK"]||"#64748b",fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:4}}>{li.unitCostBom>li.unitCostMarket*1.1?"HIGH":li.unitCostBom<li.unitCostMarket*0.9?"LOW":"OK"}</span></td>
                        <td style={{padding:"8px 10px",fontSize:11,textAlign:"right",fontFamily:"monospace",color:"#f59e0b"}}>{fmt(li.totalBom)}</td>
                        <td style={{padding:"8px 10px",fontSize:11,textAlign:"right",fontFamily:"monospace",color:STR,fontWeight:700}}>{fmt(li.totalMarket)}</td>
                        <td style={{padding:"8px 10px",fontSize:10,color:T.muted,maxWidth:180,lineHeight:1.4}}>{li.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr style={{background:`rgba(59,130,246,0.08)`,borderTop:`2px solid ${STR}44`}}>
                    <td colSpan={9} style={{padding:"9px 10px",fontSize:12,fontWeight:800,color:T.text}}>TOTALS</td>
                    <td style={{padding:"9px 10px",fontSize:13,fontWeight:800,color:"#f59e0b",textAlign:"right",fontFamily:"monospace"}}>{fmt(lineItems.reduce((s,li)=>s+(+li.totalBom||0),0))}</td>
                    <td style={{padding:"9px 10px",fontSize:13,fontWeight:800,color:STR,textAlign:"right",fontFamily:"monospace"}}>{fmt(lineItems.reduce((s,li)=>s+(+li.totalMarket||0),0))}</td>
                    <td/>
                  </tr></tfoot>
                </table>
              </div>
            </Card>
          )}

          {/* MISSING ITEMS */}
          {activeTab==="missing" && (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {missingItems.length===0
                ? <Card style={{textAlign:"center",opacity:0.5,padding:40}}><div style={{fontSize:40,marginBottom:12}}>✅</div><div style={{color:T.muted}}>No missing items detected</div></Card>
                : missingItems.map((m,i)=>(
                  <div key={i} style={{background:`${MISS_COL[m.severity||"WARNING"]}09`,border:`1.5px solid ${MISS_COL[m.severity||"WARNING"]}33`,borderRadius:12,padding:"12px 16px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                      <div>
                        <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5}}>
                          <span style={{background:`${MISS_COL[m.severity||"WARNING"]}22`,color:MISS_COL[m.severity||"WARNING"],fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:4}}>{m.priority||"WARNING"}</span>
                          <span style={{fontSize:10,color:T.muted,background:T.dim,padding:"2px 7px",borderRadius:4}}>{m.category}</span>
                        </div>
                        <div style={{fontWeight:700,fontSize:14,color:T.text}}>{m.description}</div>
                        <div style={{fontSize:11,color:T.muted,marginTop:3}}>Est. qty: <strong style={{color:T.text}}>{m.estimatedQty}</strong> · Found in: {m.basis}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:9,color:T.muted,marginBottom:2}}>EST. COST</div>
                        <div style={{fontSize:16,fontWeight:800,color:MISS_COL[m.severity||"WARNING"],fontFamily:"monospace"}}>{fmt(m.estimatedCost)}</div>
                      </div>
                    </div>
                  </div>
                ))
              }
              {missingItems.length>0 && (
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:9}}>
                  <span style={{fontSize:13,fontWeight:700,color:"#8b5cf6"}}>{missingItems.length} missing item{missingItems.length>1?"s":""}</span>
                  <span style={{fontSize:14,fontWeight:800,color:"#8b5cf6",fontFamily:"monospace"}}>{fmt(missingItems.reduce((s,m)=>s+(+m.estimatedCost||0),0))}</span>
                </div>
              )}
            </div>
          )}

          {/* EXCESS ITEMS */}
          {activeTab==="excess" && (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {excessItems.length===0
                ? <Card style={{textAlign:"center",opacity:0.5,padding:40}}><div style={{fontSize:40,marginBottom:12}}>✅</div><div style={{color:T.muted}}>No excess items detected</div></Card>
                : excessItems.map((e,i)=>(
                  <div key={i} style={{background:"rgba(100,116,139,0.05)",border:"1.5px solid rgba(100,116,139,0.2)",borderRadius:12,padding:"12px 16px"}}>
                    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5}}>
                      <span style={{background:"rgba(100,116,139,0.2)",color:"#64748b",fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:4}}>EXCESS</span>
                      <span style={{fontSize:10,color:T.muted,background:T.dim,padding:"2px 7px",borderRadius:4}}>{e.category}</span>
                    </div>
                    <div style={{fontWeight:700,fontSize:14,color:T.text,marginBottom:3}}>{e.description}</div>
                    <div style={{fontSize:11,color:T.muted}}>BOM qty: <strong style={{color:"#64748b"}}>{fmtN(e.qtyBOM)} {e.unit}</strong></div>
                    <div style={{fontSize:11,color:T.muted,marginTop:3}}>{e.remarks}</div>
                  </div>
                ))
              }
            </div>
          )}

          {/* MARKUP */}
          {activeTab==="markup" && markup && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <Card>
                <Label>Markup in Submitted BOM</Label>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:12}}>
                  {[{l:"Contingency",found:markup.contingencyFound,pct:markup.contingencyPercent,std:"5–10%"},{l:"Overhead",found:markup.overheadFound,pct:markup.overheadPercent,std:"5–10%"},{l:"Profit",found:markup.profitFound,pct:markup.profitPercent,std:"8–15%"}].map(r=>(
                    <div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:r.found?"rgba(16,185,129,0.06)":"rgba(239,68,68,0.06)",border:`1px solid ${r.found?"rgba(16,185,129,0.25)":"rgba(239,68,68,0.2)"}`,borderRadius:9}}>
                      <div style={{display:"flex",alignItems:"center",gap:9}}>
                        <span style={{fontSize:15}}>{r.found?"✅":"❌"}</span>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:T.text}}>{r.l}</div>
                          <div style={{fontSize:10,color:T.muted}}>Standard: {r.std}</div>
                        </div>
                      </div>
                      <div style={{fontSize:15,fontWeight:800,color:r.found?"#10b981":"#ef4444"}}>{r.found?`${r.pct}%`:"Not found"}</div>
                    </div>
                  ))}
                  <div style={{padding:"7px 12px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted}}>VAT Status: <strong style={{color:T.text}}>{markup.vatStatus||"NOT STATED"}</strong></div>
                  <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:12,color:T.muted,lineHeight:1.6,fontStyle:"italic"}}>{markup.recommendation}</div>
                </div>
              </Card>
              <Card>
                <Label>Your Applied Margins</Label>
                <div style={{display:"flex",flexDirection:"column",gap:7,marginTop:12}}>
                  {Object.entries(marginsState).map(([k,m])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 12px",background:m.pct>0?"rgba(59,130,246,0.06)":T.dim,borderRadius:7}}>
                      <span style={{fontSize:12,color:T.muted}}>{m.label}</span>
                      <span style={{fontSize:13,fontWeight:800,color:m.pct>0?STR:"#64748b",fontFamily:"monospace"}}>{m.pct}%</span>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:`${STR}12`,border:`1px solid ${STR}33`,borderRadius:8,marginTop:4}}>
                    <span style={{fontSize:13,fontWeight:700,color:T.text}}>Combined uplift</span>
                    <span style={{fontSize:15,fontWeight:900,color:STR}}>+{((Object.values(marginsState).reduce((a,m)=>(a*(1+m.pct/100)),1)-1)*100).toFixed(1)}%</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* COMPARISON TAB */}
          {activeTab==="compare" && compareResult && (
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                {[{label:"BOM #1 — Original",r:result,c:"#f59e0b"},{label:"BOM #2 — Revised",r:compareResult,c:"#10b981"}].map(({label,r,c})=>(
                  <Card key={label} style={{border:`1.5px solid ${c}33`}}>
                    <div style={{fontSize:11,fontWeight:800,color:c,marginBottom:10,textTransform:"uppercase"}}>{label}</div>
                    <div style={{display:"flex",flexDirection:"column",gap:7}}>
                      {[
                        {l:"Status",     v:r.summary.overallStatus,    col:STATUS_COL[r.summary.overallStatus]},
                        {l:"Risk",       v:r.summary.contractorRisk,   col:RISK_COL[r.summary.contractorRisk]},
                        {l:"BOM Total",  v:fmt(r.summary.bomTotalEstimate), col:T.text},
                        {l:"AI Base",    v:fmt(r.summary.aiAdjustedEstimate), col:STR},
                        {l:"Missing",    v:`${(r.missingItems||[]).length} items`, col:"#8b5cf6"},
                        {l:"Critical",   v:`${r.summary.criticalCount} issues`, col:"#ef4444"},
                      ].map(s=>(
                        <div key={s.l} style={{display:"flex",justifyContent:"space-between",padding:"7px 12px",background:T.dim,borderRadius:8}}>
                          <span style={{fontSize:12,color:T.muted}}>{s.l}</span>
                          <span style={{fontSize:12,fontWeight:800,color:s.col}}>{s.v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop:10,fontSize:11,color:T.muted,lineHeight:1.5,background:T.dim,padding:"8px 10px",borderRadius:7}}>{r.summary.notes}</div>
                  </Card>
                ))}
              </div>
              <Card>
                <Label>Delta — What Changed Between BOMs</Label>
                <div style={{display:"flex",flexDirection:"column",gap:7,marginTop:12}}>
                  {[
                    {l:"BOM Total",     a:result.summary.bomTotalEstimate,        b:compareResult.summary.bomTotalEstimate,       isMoney:true},
                    {l:"AI Base",       a:result.summary.aiAdjustedEstimate,       b:compareResult.summary.aiAdjustedEstimate,    isMoney:true},
                    {l:"Missing Items", a:(result.missingItems||[]).length,         b:(compareResult.missingItems||[]).length,      isMoney:false},
                    {l:"Critical Issues",a:result.summary.criticalCount,           b:compareResult.summary.criticalCount,          isMoney:false},
                    {l:"Warnings",      a:result.summary.warningCount,             b:compareResult.summary.warningCount,           isMoney:false},
                  ].map(r=>{
                    const diff=r.b-r.a; const improved=diff<0; const neutral=diff===0;
                    const col=neutral?"#64748b":improved?"#10b981":"#ef4444";
                    return (<div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px",background:T.dim,borderRadius:9}}>
                      <span style={{fontSize:12,color:T.muted}}>{r.l}</span>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <span style={{fontSize:11,color:T.muted,fontFamily:"monospace"}}>{r.isMoney?fmt(r.a):r.a} → {r.isMoney?fmt(r.b):r.b}</span>
                        <span style={{fontSize:13,fontWeight:800,color:col}}>{diff>0?"+":""}{r.isMoney?fmt(diff):diff} {neutral?"–":improved?"✅":"⚠️"}</span>
                      </div>
                    </div>);
                  })}
                </div>
              </Card>
            </div>
          )}

          <div style={{marginTop:12,padding:"9px 14px",background:T.dim,borderRadius:9,fontSize:11,color:T.muted,lineHeight:1.5}}>
            ⚠️ AI-assisted review. All findings must be verified by a licensed QS or Engineer before submission. · PH Engineering Suite
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !busy && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
          {[
            {i:"🔢",t:"Quantity Validation",        d:"AI counts items in plan vs. BOM"},
            {i:"💰",t:"Unit Cost Check",             d:"vs. 2025 NCR or DPWH Blue Book rates"},
            {i:"📈",t:"Scope Completeness Scores",   d:"Score per trade: Structural, Electrical, Plumbing…"},
            {i:"📈",t:"Scope Completeness Score",     d:"Trade-by-trade completeness 0–100%"},
            {i:"🔄",t:"Compare 2 BOMs",              d:"Original vs. Revised — catch what was gamed"},
            {i:"📅",t:"Price Escalation Warning",    d:"Flags outdated BOM date + material cost drift"},
            {i:"🏛️",t:"DPWH / Private Toggle",       d:"Benchmark against the right rate table"},
            {i:"📄",t:"Full PDF Export",              d:"QS-grade report with all findings"},
          ].map(x=>(
            <Card key={x.t} style={{textAlign:"center",padding:18}}>
              <div style={{fontSize:24,marginBottom:7}}>{x.i}</div>
              <div style={{fontWeight:700,fontSize:12,color:T.text,marginBottom:3}}>{x.t}</div>
              <div style={{fontSize:10,color:T.muted,lineHeight:1.5}}>{x.d}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── STRUCTICODE: COST ESTIMATOR ──────────────────────────────────────────────
const COST_ESTIMATOR_PROMPT = `You are a senior Cost Estimator and Project Manager in the Philippines with deep expertise in:
- DPWH Blue Book 2024 (Standard Specifications for Public Works)
- DPWH Unit Cost Reference and PhilGEPS benchmark rates (2024–2025)
- CIAP (Construction Industry Authority of the Philippines) cost guides
- PSA construction cost indices — NCR and regional
- Current NCR labor rates: mason ₱700–900/day, carpenter ₱700–900/day, electrician ₱900–1,100/day, foreman ₱1,200–1,500/day
- Current NCR material benchmarks (Q1 2025): Ready-mix concrete ₱5,500–7,000/m³, steel rebar ₱55–65/kg, CHB ₱18–22/pc, cement ₱270–310/bag, sand ₱1,200–1,800/m³, gravel ₱1,500–2,200/m³, ceramic tiles ₱350–600/sqm, aluminum windows ₱2,500–4,000/sqm

Your output serves TWO audiences simultaneously:
1. ENGINEERS AND ARCHITECTS who need technical accuracy and code-compliant scope
2. REGULAR HOMEOWNERS AND CLIENTS who need plain-language explanations they can act on

REVIEW PROCESS — follow all steps:
1. Read ALL uploaded plan pages. Note title block, floor plans, sections, schedules, dimensions.
2. Estimate gross floor area from plans (measure or note if user-provided).
3. Identify EVERY work trade visible in the plans — structural, MEP, finishes, site work.
4. Compute quantities where possible (concrete volume, wall area, roof area, fixture count).
5. Apply trade rates from references above. Show your range (low = basic, high = better quality).
6. Identify what is NOT shown or excluded from scope — these are risks to flag.
7. Generate plain-language descriptions so a non-engineer client understands each trade.
8. Suggest 3–5 specific cost-saving options with realistic savings estimates and quality impact.
9. Add next steps a client should take after receiving this estimate.

RATE BENCHMARKS (2025 all-in, inclusive of labor + materials unless noted):
- Basic residential: ₱18,000–₱22,000/sqm
- Standard residential: ₱23,000–₱30,000/sqm
- High-end residential: ₱32,000–₱55,000/sqm
- Basic commercial: ₱22,000–₱28,000/sqm
- Standard commercial: ₱30,000–₱45,000/sqm
- High-end commercial: ₱48,000–₱70,000/sqm
- Warehouse/industrial: ₱14,000–₱20,000/sqm
- School/institutional: ₱20,000–₱30,000/sqm
- Renovation (light): 20–40% of new-build rate
- Renovation (moderate): 40–65% of new-build rate
- Renovation (heavy/gut): 65–85% of new-build rate

LOCATION ADJUSTMENTS (vs. NCR baseline):
- Antipolo / Rizal: +3–5% transport premium
- Cavite / Laguna: +2–4%
- Cebu City: -5–10% vs NCR
- Davao / Mindanao: -10–15% vs NCR
- Remote provinces: +10–20% vs NCR

TRADE CATEGORIES (always use these exact names):
1. Site Development & Earthworks
2. Concrete & Structural Works
3. Masonry & Blockworks
4. Roofing & Waterproofing
5. Doors, Windows & Glazing
6. Architectural Finishes
7. Plumbing & Sanitary Works
8. Electrical Works
9. HVAC & Mechanical
10. Landscaping & Outdoor Works
11. Contingency & Miscellaneous
12. Owner-Supplied Items / Allowances

Respond ONLY as valid JSON (no markdown, no backticks, no preamble):
{
  "project": {
    "name": "string from plan title block or null",
    "type": "New Construction|Renovation|Addition|Fit-out|Infrastructure|Ad-hoc",
    "subtype": "Residential|Commercial|Industrial|Institutional|Mixed",
    "location": "city/province string",
    "locationPremiumNote": "e.g. Antipolo: +3-5% transport premium applied or null",
    "finishLevel": "Basic|Standard|High-end",
    "estimatedGFA": 0,
    "gfaBreakdown": "e.g. Ground 259sqm + 2nd Floor 176sqm = 435sqm or null",
    "floors": 1,
    "scopeSummary": "2–3 sentence plain-language description of what is being built — write as if explaining to a homeowner",
    "scopeIncluded": ["plain-language list of what is included"],
    "scopeExcluded": ["plain-language list of what is not included"],
    "assumptions": ["key assumptions made in this estimate"],
    "clientNote": "1–2 sentence message to the client explaining what this estimate is and what to do next — warm, professional tone",
    "validityNote": "Rates valid as of Q1 2025. Escalate by 5–8% per year.",
    "accuracyNote": "Parametric estimate ±20–35%. A formal Bill of Quantities is needed for contractor tender."
  },
  "trades": [
    {
      "id": 1,
      "trade": "exact trade name from list above",
      "description": "technical scope description for engineers",
      "plainDescription": "plain-language explanation for homeowners — what this covers in simple terms",
      "icon": "emoji representing this trade e.g. 🏗 🧱 ⚡ 🔧 🎨 🚪 🏡 🌊",
      "unit": "sqm|lot|lump sum|m|set|pc",
      "qty": 0,
      "rateLow": 0,
      "rateHigh": 0,
      "totalLow": 0,
      "totalHigh": 0,
      "percentOfTotal": 0,
      "basis": "brief note on how this was computed — what dimensions or quantities from the plans",
      "included": true,
      "isMajor": true
    }
  ],
  "summary": {
    "constructionCostLow": 0,
    "constructionCostHigh": 0,
    "contingencyPct": 10,
    "contingencyLow": 0,
    "contingencyHigh": 0,
    "totalLow": 0,
    "totalHigh": 0,
    "costPerSqmLow": 0,
    "costPerSqmHigh": 0,
    "marketSqmRangeLow": 0,
    "marketSqmRangeHigh": 0,
    "marketSqmNote": "e.g. Standard residential in NCR: ₱23,000–₱30,000/sqm",
    "midpoint": 0,
    "professionalFeesPct": 8,
    "professionalFeesNote": "Based on PRC/PICE fee schedule. Covers Architect, Engineer, and project management.",
    "professionalFeesLow": 0,
    "professionalFeesHigh": 0,
    "vatNote": "VAT (12%) not included. Add ₱X–₱Y if contractor is VAT-registered.",
    "permitFeeNote": "Building permit fees: estimate ₱X–₱Y separately (based on project type and LGU).",
    "grandTotalLow": 0,
    "grandTotalHigh": 0
  },
  "valueEngineering": [
    {
      "suggestion": "specific actionable suggestion",
      "plainExplanation": "plain-language explanation of what this means and how to do it",
      "savingLow": 0,
      "savingHigh": 0,
      "qualityImpact": "None|Minimal|Moderate|Significant",
      "qualityNote": "brief note on what changes or stays the same"
    }
  ],
  "nextSteps": [
    {
      "step": 1,
      "action": "short action title",
      "detail": "plain-language explanation of what the client should do and why"
    }
  ],
  "marketWarnings": [
    {
      "level": "HIGH|MEDIUM|LOW",
      "item": "item name",
      "warning": "plain-language warning the client needs to know"
    }
  ]
}`;

function CostEstimator({ apiKey }) {
  const [files,       setFiles]       = useState([]);
  const [drag,        setDrag]        = useState(false);
  const [result,      setResult]      = useState(null);
  const [busy,        setBusy]        = useState(false);
  const [busyMsg,     setBusyMsg]     = useState("");
  const [error,       setError]       = useState(null);
  const [activeTab,   setActiveTab]   = useState("summary");

  // Project context
  const [scopeMode,     setScopeMode]     = useState("new");        // new | renovation | adhoc
  const [projectType,   setProjectType]   = useState("residential");
  const [finishLevel,   setFinishLevel]   = useState("standard");
  const [location,      setLocation]      = useState("ncr");
  const [gfaOverride,   setGfaOverride]   = useState("");
  const [clientName,    setClientName]    = useState("");
  const [projectName,   setProjectName]   = useState("");
  const [engineerName,  setEngineerName]  = useState("");
  const [specialNotes,  setSpecialNotes]  = useState("");
  const [inclProfFees,  setInclProfFees]  = useState(true);

  // Renovation / adhoc extras
  const [renovScope,    setRenovScope]    = useState("moderate");   // light | moderate | heavy
  const [adhocItems,    setAdhocItems]    = useState("");           // free text

  const fileRef = useRef(null);
  const STR = "#0696d7";
  const GOLD = "#f59e0b";
  const tick  = () => new Promise(r => setTimeout(r, 0));
  const fmt   = n => `₱${(+n||0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const fmtN  = n => (+n||0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2});
  const fmtR  = n => (+n||0).toLocaleString("en-PH",{maximumFractionDigits:0});

  // ── Restore last estimate session on mount ──
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("buildify_session_structural") || "null");
      if (!s?.estimateResult?.summary) return;
      setResult(s.estimateResult);
    } catch {}
  }, []); // eslint-disable-line

  const addFiles = useCallback(fs => setFiles(p => [...p, ...Array.from(fs).map(f => ({
    file:f, id:Math.random().toString(36).slice(2), name:f.name, size:f.size, type:f.type||"application/octet-stream"
  }))]), []);

  const SCOPE_MODES = [
    { v:"new",        l:"🏗️ New Construction" },
    { v:"renovation", l:"🔧 Renovation / Remodel" },
    { v:"addition",   l:"➕ Addition / Extension" },
    { v:"fitout",     l:"🪑 Fit-out / Interior" },
    { v:"adhoc",      l:"📝 Ad-hoc / Custom Scope" },
  ];
  const PROJECT_TYPES = [
    { v:"residential",    l:"Residential" },
    { v:"duplex",         l:"Duplex / Townhouse" },
    { v:"condo",          l:"Condominium" },
    { v:"commercial",     l:"Commercial" },
    { v:"office",         l:"Office" },
    { v:"retail",         l:"Retail / Store" },
    { v:"school",         l:"School / Institutional" },
    { v:"warehouse",      l:"Warehouse / Industrial" },
    { v:"mixed_use",      l:"Mixed-Use" },
    { v:"infrastructure", l:"Infrastructure / Civil" },
  ];
  const FINISH_LEVELS = [
    { v:"basic",    l:"Basic",     desc:"Standard CHB, plain tiles, basic fixtures" },
    { v:"standard", l:"Standard",  desc:"Good quality tiles, mid-range fixtures, painted" },
    { v:"highend",  l:"High-end",  desc:"Imported materials, designer fixtures, custom finishes" },
  ];
  const LOCATIONS = [
    { v:"ncr",      l:"Metro Manila (NCR)" },
    { v:"luzon",    l:"Luzon (outside NCR)" },
    { v:"visayas",  l:"Visayas" },
    { v:"mindanao", l:"Mindanao" },
  ];
  const RENOV_LEVELS = [
    { v:"light",    l:"Light",    desc:"Paint, flooring, minor fixtures — no structural" },
    { v:"moderate", l:"Moderate", desc:"Kitchen/bath remodel, partitions, MEP updates" },
    { v:"heavy",    l:"Heavy / Gut", desc:"Full interior strip, structural modifications" },
  ];

  const buildContext = () => {
    const scope   = SCOPE_MODES.find(s=>s.v===scopeMode)?.l || scopeMode;
    const type    = PROJECT_TYPES.find(t=>t.v===projectType)?.l || projectType;
    const finish  = FINISH_LEVELS.find(f=>f.v===finishLevel)?.l || finishLevel;
    const loc     = LOCATIONS.find(l=>l.v===location)?.l || location;
    const renov   = RENOV_LEVELS.find(r=>r.v===renovScope)?.l || renovScope;
    const locMod  = location==="ncr"?1.0:location==="luzon"?0.9:location==="visayas"?0.85:0.80;

    return `PROJECT CONTEXT FOR COST ESTIMATION:
- Scope Mode: ${scope}
- Project Type: ${type}
- Finish Level: ${finish}
- Location: ${loc} (apply ×${locMod} cost modifier vs NCR baseline)
${gfaOverride ? `- Gross Floor Area (user-provided): ${gfaOverride} sqm — use this GFA, do not override` : "- Gross Floor Area: Estimate from plan drawings"}
${scopeMode==="renovation"||scopeMode==="fitout" ? `- Renovation Level: ${renov}` : ""}
${scopeMode==="adhoc" && adhocItems ? `- Custom Scope Items:\n${adhocItems}` : ""}
${specialNotes ? `- Special Notes / Instructions: ${specialNotes}` : ""}
${inclProfFees ? "- Include professional fees estimate based on PRC/PICE fee schedule" : "- Exclude professional fees from estimate"}

INSTRUCTIONS:
1. Read the uploaded plans carefully. Identify all visible scope.
2. Generate a detailed parametric estimate broken down by trade.
3. Apply the location cost modifier to all rates.
4. For renovation/fitout: only estimate affected areas/trades, not the entire building.
5. For ad-hoc scope: estimate only the custom items listed above.
6. Provide a low and high range for each trade.
7. Include 3–5 value engineering suggestions.
8. Return ONLY the JSON structure. No markdown, no explanation.`;
  };

  const run = async () => {
    if (!files.length) { setError("Please upload at least one plan file."); return; }
    const bad = files.find(f => !f.type.startsWith("image/") && f.type !== "application/pdf" && !f.name.match(/\.pdf$/i));
    if (bad) { setError(`"${bad.name}" must be a PDF or image file.`); return; }

    setBusy(true); setError(null); setResult(null);
    try {
      const blocks = [];
      for (let i = 0; i < files.length; i++) {
        const fo = files[i];
        setBusyMsg(`Reading file ${i+1}/${files.length}: ${fo.name}…`); await tick();
        let b64;
        if (fo.type.startsWith("image/")) {
          setBusyMsg(`Compressing: ${fo.name}…`); await tick();
          b64 = await compressImage(fo.file);
          blocks.push({ type:"image", source:{ type:"base64", media_type:"image/jpeg", data:b64 } });
        } else {
          b64 = await toBase64(fo.file);
          blocks.push({ type:"document", source:{ type:"base64", media_type:"application/pdf", data:b64 } });
        }
        blocks.push({ type:"text", text:`[PLAN FILE: ${fo.name}]` });
      }
      blocks.push({ type:"text", text: buildContext() });

      setBusyMsg("AI is reading plans and generating cost estimate…"); await tick();
      const data = await callAI({ apiKey, system:COST_ESTIMATOR_PROMPT, messages:[{ role:"user", content:blocks }], max_tokens:8000 });
      const raw  = data.content?.map(b => b.text||"").join("").replace(/```json|```/g,"").trim();
      let parsed;
      try { parsed = JSON.parse(raw); } catch { throw new Error("Could not parse AI response. Please try again."); }
      setResult(parsed);
      if(onResultChange) onResultChange(parsed);
      setActiveTab("summary");
      // ── Save to history ──
      addHistoryEntry({
        tool: "estimate",
        module: "structural",
        projectName: parsed?.project?.name || projectName || "Cost Estimate",
        meta: {
          totalHigh: parsed?.summary?.totalHigh,
          summary: `${parsed?.project?.type||""} · ${parsed?.project?.finishLevel||""} · ${(parsed?.project?.estimatedGFA||0).toLocaleString()} sqm`,
        }
      });
      // Direct save — merge with existing structural session
      try {
        const _cur = JSON.parse(localStorage.getItem("buildify_session_structural") || "{}");
        localStorage.setItem("buildify_session_structural", JSON.stringify({ ..._cur, estimateResult: parsed, _savedAt: new Date().toISOString(), _module: "structural", userId: "local" }));
      } catch(e) { console.warn("Session save failed", e); }
    } catch(e) {
      setError(e.message || "Estimation failed. Please try again.");
    } finally {
      setBusy(false); setBusyMsg("");
    }
  };

  // ── Export client-facing document ──
const exportDocument = () => {
    if (!result) return;
    const p   = result.project  || {};
    const s   = result.summary  || {};
    const trades = result.trades || [];
    const ve  = result.valueEngineering || [];
    const mw  = result.marketWarnings   || [];
    const ns  = result.nextSteps        || [];
    const refId = `EST-${Date.now().toString().slice(-6)}`;
    const date  = new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});
    const fmt   = n => `₱${(+n||0).toLocaleString("en-PH",{minimumFractionDigits:0,maximumFractionDigits:0})}`;
    const fmtR  = n => `₱${(+n||0).toLocaleString("en-PH",{minimumFractionDigits:0,maximumFractionDigits:0})}`;
    const pct   = n => `${(+n||0).toFixed(1)}%`;

    const included  = (p.scopeIncluded  || []).map(i => `<li>✓ ${i}</li>`).join("");
    const excluded  = (p.scopeExcluded  || []).map(i => `<li>✗ ${i}</li>`).join("");
    const majorTrades = trades.filter(t => t.included !== false);

    const tradeRows = majorTrades.map((t,i) => `
      <tr class="${i%2===0?'even':'odd'}${t.isMajor?' major':''}">
        <td><span class="trade-icon">${t.icon||'🏗'}</span> <strong>${t.trade}</strong><br><span class="small">${t.plainDescription||t.description||''}</span></td>
        <td class="center">${t.qty||''} ${t.unit||''}</td>
        <td class="right">${fmtR(t.totalLow)}</td>
        <td class="right bold">${fmtR(t.totalHigh)}</td>
        <td class="center chip">${t.percentOfTotal?pct(t.percentOfTotal):''}</td>
      </tr>`).join("");

    const veRows = ve.map(v => `
      <tr>
        <td>${v.suggestion||v.item||''}<br><span class="small muted">${v.plainExplanation||''}</span></td>
        <td class="center impact-${(v.qualityImpact||'').toLowerCase()}">${v.qualityImpact||'—'}</td>
        <td class="right green bold">${fmtR(v.savingLow||0)} – ${fmtR(v.savingHigh||0)}</td>
      </tr>`).join("");

    const warnItems = mw.map(w => `
      <div class="warn-item warn-${(w.level||'').toLowerCase()}">
        <span class="warn-dot"></span>
        <div><strong>${w.item||''}</strong><br><span class="small">${w.warning||''}</span></div>
      </div>`).join("");

    const stepItems = ns.map(n => `
      <div class="step-item">
        <div class="step-num">${n.step||''}</div>
        <div><strong>${n.action||''}</strong><br><span class="small muted">${n.detail||''}</span></div>
      </div>`).join("");

    const totalVeSaveLow  = ve.reduce((a,v)=>a+(+v.savingLow||0),0);
    const totalVeSaveHigh = ve.reduce((a,v)=>a+(+v.savingHigh||0),0);

    const w = window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><title>Cost Estimate — ${p.name||projectName||"Project"}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:#f1f5f9;color:#0f172a;font-size:14px;line-height:1.5}
  .page{max-width:900px;margin:0 auto;background:#fff}
  @media print{body{background:#fff}.no-print{display:none!important}.page{max-width:100%}}

  /* HEADER */
  .header{background:#0f2444;padding:28px 36px;display:flex;justify-content:space-between;align-items:center}
  .header-left .brand{font-size:20px;font-weight:900;color:#0696d7;letter-spacing:-0.5px}
  .header-left .brand-sub{font-size:11px;color:#94a3b8;margin-top:2px}
  .header-right{text-align:right}
  .header-right .doc-label{font-size:11px;color:#94a3b8}
  .header-right .doc-ref{font-size:13px;color:#fff;font-weight:700;margin-top:2px}
  .header-right .doc-date{font-size:11px;color:#94a3b8;margin-top:2px}

  /* CONTENT PADDING */
  .content{padding:28px 36px}
  section{margin-bottom:28px}

  /* PROJECT TITLE */
  .project-title{font-size:26px;font-weight:900;color:#0f2444;letter-spacing:-0.5px;line-height:1.2;margin-bottom:6px}
  .project-sub{font-size:13px;color:#64748b}

  /* FACT CARDS */
  .facts{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0}
  .fact-card{background:#f8fafc;border-radius:10px;padding:14px;text-align:center}
  .fact-val{font-size:18px;font-weight:800;color:#0f2444}
  .fact-lbl{font-size:11px;color:#64748b;margin-top:4px;line-height:1.4}

  /* BIG NUMBER */
  .cost-hero{border:2px solid #e2e8f0;border-radius:12px;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;gap:20px;margin:16px 0}
  .cost-main .cost-label{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px}
  .cost-main .cost-range{font-size:30px;font-weight:900;color:#0f2444;line-height:1.1;margin:4px 0}
  .cost-main .cost-mid{font-size:13px;color:#64748b;margin-top:4px}
  .cost-sqm{background:#e8f4fc;border-radius:10px;padding:14px 20px;text-align:center;min-width:160px}
  .cost-sqm .sqm-val{font-size:18px;font-weight:800;color:#0696d7}
  .cost-sqm .sqm-lbl{font-size:11px;color:#64748b;margin-top:2px}
  .cost-sqm .sqm-mkt{font-size:10px;color:#94a3b8;margin-top:6px;line-height:1.4}

  /* SECTION HEADINGS */
  h2{font-size:15px;font-weight:800;color:#0f2444;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #e2e8f0}

  /* WHAT'S INCLUDED GRID */
  .includes-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .include-card{background:#f8fafc;border-radius:8px;padding:12px;border-left:3px solid #0696d7}
  .include-card .inc-title{font-size:12px;font-weight:700;color:#0f2444;margin-bottom:3px}
  .include-card .inc-desc{font-size:11.5px;color:#64748b;line-height:1.4}

  /* TRADE TABLE */
  table{width:100%;border-collapse:collapse;font-size:12.5px}
  thead th{background:#0f2444;color:#fff;padding:9px 10px;text-align:left;font-size:11px;font-weight:700}
  th.right,td.right{text-align:right}
  th.center,td.center{text-align:center}
  tr.even td{background:#fff}
  tr.odd td{background:#f8fafc}
  tr.major td{background:#f0f7ff}
  td{padding:9px 10px;vertical-align:middle;border-bottom:1px solid #f1f5f9}
  .trade-icon{font-size:14px;margin-right:4px}
  .small{font-size:11px;color:#94a3b8;line-height:1.4}
  .muted{color:#94a3b8}
  .bold{font-weight:700}
  .green{color:#16a34a}
  .chip{font-size:11px;font-weight:700;color:#0696d7}
  tr.subtotal td{background:#e8f0fb;font-weight:700;color:#0f2444;border-top:2px solid #0f2444}
  tr.contingency td{background:#f8fafc;color:#64748b}
  tr.grand-total td{background:#0f2444;color:#fff;font-weight:800;font-size:13px;padding:12px 10px}

  /* FEES BOX */
  .fees-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border-radius:10px;overflow:hidden}
  .fees-left{background:#fef3c7;padding:16px 18px}
  .fees-right{background:#fffbeb;padding:16px 18px;border-left:2px solid #d97706}
  .fees-lbl{font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px}
  .fees-val{font-size:20px;font-weight:900;color:#0f2444;margin:4px 0}
  .fees-sub{font-size:11.5px;color:#64748b;line-height:1.4}
  .fees-q{font-size:12px;font-weight:700;color:#d97706;margin-bottom:6px}
  .fees-a{font-size:11.5px;color:#64748b;line-height:1.5}

  /* INCLUDE/EXCLUDE */
  .ie-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border-radius:10px;overflow:hidden}
  .ie-incl{background:#dcfce7;padding:16px 18px}
  .ie-excl{background:#fee2e2;padding:16px 18px}
  .ie-hdr{font-size:11px;font-weight:800;padding:8px 12px;margin:-16px -18px 10px;display:block}
  .ie-incl .ie-hdr{background:#166534;color:#fff}
  .ie-excl .ie-hdr{background:#7f1d1d;color:#fff}
  .ie-incl ul,.ie-excl ul{list-style:none;padding:0}
  .ie-incl li{font-size:12px;color:#166534;padding:3px 0}
  .ie-excl li{font-size:12px;color:#991b1b;padding:3px 0}

  /* SAVINGS TABLE */
  .impact-none{color:#16a34a;font-weight:700;font-size:11px}
  .impact-minimal{color:#16a34a;font-weight:700;font-size:11px}
  .impact-moderate{color:#d97706;font-weight:700;font-size:11px}
  .impact-significant{color:#dc2626;font-weight:700;font-size:11px}

  /* WARNINGS */
  .warn-item{display:flex;gap:10px;align-items:flex-start;padding:10px 14px;border-radius:8px;margin-bottom:8px;background:#fef3c7}
  .warn-item.warn-high{background:#fee2e2}
  .warn-item.warn-low{background:#f0fdf4}
  .warn-dot{width:10px;height:10px;border-radius:50%;background:#d97706;margin-top:4px;flex-shrink:0}
  .warn-high .warn-dot{background:#dc2626}
  .warn-low .warn-dot{background:#16a34a}
  .warn-item strong{font-size:12.5px;color:#0f2444}

  /* NEXT STEPS */
  .step-item{display:flex;gap:14px;align-items:flex-start;padding:12px;background:#eff6ff;border-radius:8px;margin-bottom:8px}
  .step-num{width:28px;height:28px;border-radius:50%;background:#0696d7;color:#fff;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .step-item strong{font-size:13px;color:#0f2444}

  /* CLIENT NOTE */
  .client-note{background:#eff6ff;border-left:4px solid #0696d7;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:20px;font-size:13px;color:#0f2444;line-height:1.6}

  /* DISCLAIMER */
  .disclaimer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 36px;font-size:11px;color:#94a3b8;line-height:1.6}

  /* FOOTER */
  .footer{background:#0f2444;padding:14px 36px;display:flex;justify-content:space-between;font-size:11px;color:#64748b}
  .footer a{color:#0696d7;text-decoration:none}

  /* PRINT BUTTON */
  .print-btn{position:fixed;top:20px;right:20px;padding:10px 22px;background:#0696d7;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;box-shadow:0 2px 10px rgba(0,0,0,0.2);z-index:999}
  .print-btn:hover{background:#0578b5}
</style></head><body>

<button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save PDF</button>

<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      <div class="brand">BUILDIFY</div>
      <div class="brand-sub">by Jon Ureta · PH Engineering Suite</div>
    </div>
    <div class="header-right">
      <div class="doc-label">COST ESTIMATE</div>
      <div class="doc-ref">${refId}</div>
      <div class="doc-date">${date}</div>
    </div>
  </div>

  <div class="content">

    <!-- PROJECT TITLE -->
    <section>
      <div class="project-title">${p.name||projectName||"Project Cost Estimate"}</div>
      <div class="project-sub">${p.location||""} &nbsp;·&nbsp; ${p.type||""} &nbsp;·&nbsp; ${p.finishLevel||""} Finish</div>
      ${p.clientNote ? `<div class="client-note">${p.clientNote}</div>` : ""}
      <div class="facts">
        <div class="fact-card"><div class="fact-val">${(+p.estimatedGFA||0).toLocaleString()} sqm</div><div class="fact-lbl">${p.gfaBreakdown||"Total Floor Area"}</div></div>
        <div class="fact-card"><div class="fact-val">${p.floors||"—"} ${+p.floors===1?"Storey":"Storeys"}</div><div class="fact-lbl">${p.subtype||""}</div></div>
        <div class="fact-card"><div class="fact-val">${p.finishLevel||"Standard"}</div><div class="fact-lbl">Finish Level</div></div>
      </div>
    </section>

    <!-- BIG COST NUMBER -->
    <section>
      <div class="cost-hero">
        <div class="cost-main">
          <div class="cost-label">Estimated Construction Cost</div>
          <div class="cost-range">${fmt(s.totalLow)} – ${fmt(s.totalHigh)}</div>
          <div class="cost-mid">Midpoint: <strong>${fmt(s.midpoint)}</strong> &nbsp;·&nbsp; ±20–35% parametric accuracy</div>
        </div>
        <div class="cost-sqm">
          <div class="sqm-val">${fmt(s.costPerSqmLow)} – ${fmt(s.costPerSqmHigh)}</div>
          <div class="sqm-lbl">per square meter</div>
          ${s.marketSqmNote ? `<div class="sqm-mkt">${s.marketSqmNote}</div>` : ""}
        </div>
      </div>
    </section>

    <!-- WHAT'S INCLUDED IN PLAIN LANGUAGE -->
    <section>
      <h2>What's included in this estimate?</h2>
      <div class="includes-grid">
        ${majorTrades.filter(t=>t.icon).map(t=>`
          <div class="include-card">
            <div class="inc-title">${t.icon} ${t.trade}</div>
            <div class="inc-desc">${t.plainDescription||t.description||""}</div>
          </div>`).join("")}
      </div>
    </section>

    <!-- TRADE BREAKDOWN TABLE -->
    <section>
      <h2>Cost Breakdown by Work Category</h2>
      <p style="font-size:12px;color:#64748b;margin-bottom:12px">Each range shows low (basic materials) to high (better quality). Highlighted rows are your biggest cost items.</p>
      <table>
        <thead><tr>
          <th>Work Category</th>
          <th class="center">Scope</th>
          <th class="right">Low Estimate</th>
          <th class="right">High Estimate</th>
          <th class="center">% of Total</th>
        </tr></thead>
        <tbody>
          ${tradeRows}
          <tr class="subtotal">
            <td colspan="2">Construction Subtotal</td>
            <td class="right">${fmt(s.constructionCostLow)}</td>
            <td class="right">${fmt(s.constructionCostHigh)}</td>
            <td></td>
          </tr>
          <tr class="contingency">
            <td colspan="2">+ ${s.contingencyPct||10}% Contingency Fund <span class="small">(buffer for surprises)</span></td>
            <td class="right">${fmt(s.contingencyLow)}</td>
            <td class="right">${fmt(s.contingencyHigh)}</td>
            <td></td>
          </tr>
          <tr class="grand-total">
            <td colspan="2">TOTAL CONSTRUCTION COST</td>
            <td class="right">${fmt(s.totalLow)}</td>
            <td class="right">${fmt(s.totalHigh)}</td>
            <td class="center">100%</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- PROFESSIONAL FEES -->
    <section>
      <h2>Including Professional Fees</h2>
      <div class="fees-grid">
        <div class="fees-left">
          <div class="fees-lbl">Grand Total with Fees (${s.professionalFeesPct||8}%)</div>
          <div class="fees-val">${fmt(s.grandTotalLow)} – ${fmt(s.grandTotalHigh)}</div>
          <div class="fees-sub">${s.professionalFeesNote||"Professional fees cover your Architect and Engineer."}</div>
          ${s.permitFeeNote ? `<div class="fees-sub" style="margin-top:6px;font-size:11px">${s.permitFeeNote}</div>` : ""}
          ${s.vatNote ? `<div class="fees-sub" style="margin-top:4px;font-size:11px">${s.vatNote}</div>` : ""}
        </div>
        <div class="fees-right">
          <div class="fees-q">What are professional fees?</div>
          <div class="fees-a">These are fees paid to your licensed Architect and Engineer for designing the house, getting permits, and supervising construction. Think of it like a doctor's fee — it's separate from the cost of medicine (construction).</div>
        </div>
      </div>
    </section>

    <!-- INCLUDED / EXCLUDED -->
    <section>
      <h2>Included &amp; Not Included</h2>
      <div class="ie-grid">
        <div class="ie-incl"><span class="ie-hdr">INCLUDED IN THIS ESTIMATE</span><ul>${included}</ul></div>
        <div class="ie-excl"><span class="ie-hdr">NOT INCLUDED — add separately</span><ul>${excluded}</ul></div>
      </div>
    </section>

    ${ve.length ? `
    <!-- COST SAVING IDEAS -->
    <section>
      <h2>Ways to Reduce Cost</h2>
      <p style="font-size:12px;color:#64748b;margin-bottom:12px">Ask your contractor about these options before finalizing materials.</p>
      <table>
        <thead><tr><th>What to Change</th><th class="center">Quality Impact</th><th class="right">Potential Saving</th></tr></thead>
        <tbody>
          ${veRows}
          <tr class="subtotal">
            <td>Total Possible Savings (if all applied)</td>
            <td></td>
            <td class="right green">${fmtR(totalVeSaveLow)} – ${fmtR(totalVeSaveHigh)}</td>
          </tr>
        </tbody>
      </table>
    </section>` : ""}

    ${mw.length ? `
    <!-- MARKET WARNINGS -->
    <section>
      <h2>Market Conditions to Watch</h2>
      ${warnItems}
    </section>` : ""}

    ${ns.length ? `
    <!-- NEXT STEPS -->
    <section>
      <h2>Your Next Steps</h2>
      ${stepItems}
    </section>` : ""}

    <!-- ASSUMPTIONS -->
    ${p.assumptions && p.assumptions.length ? `
    <section>
      <h2>Assumptions &amp; Notes</h2>
      <ul style="font-size:12px;color:#64748b;padding-left:18px;line-height:1.8">
        ${p.assumptions.map(a=>`<li>${a}</li>`).join("")}
      </ul>
    </section>` : ""}

  </div><!-- /content -->

  <!-- DISCLAIMER -->
  <div class="disclaimer">
    <strong>IMPORTANT DISCLAIMER:</strong> This is a parametric pre-design cost estimate (±20–35% accuracy) for budgeting and client guidance purposes only.
    It is NOT a contract, Bill of Quantities, or formal tender document. Actual costs will vary based on final material choices, site conditions,
    contractor rates, and market prices at time of construction. ${p.validityNote||""} ${p.accuracyNote||""}
    A formal Bill of Quantities by a licensed Quantity Surveyor is required before awarding any contract. VAT (12%) is not included unless stated.
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <span>Prepared by <strong style="color:#0696d7">Buildify</strong> · PH Engineering Suite</span>
    <span>${refId} · Valid 90 days from date of issue</span>
  </div>

</div><!-- /page -->
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 600);
  };

  const trades   = result?.trades?.filter(t=>t.included!==false) || [];
  const summary  = result?.summary || {};
  const project  = result?.project || {};
  const veItems  = result?.valueEngineering || [];
  const warnings = result?.marketWarnings   || [];

  const TRADE_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4","#f97316","#84cc16","#ec4899","#6366f1","#14b8a6","#a78bfa"];

  const handleNewEstimate = () => {
    setResult(null); setFiles([]);
    // Session stays in localStorage so history cards can reopen it
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <NoKeyBanner/>

      {result && (
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <button onClick={handleNewEstimate}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:9,
              border:"1.5px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.07)",
              color:"#ef4444",cursor:"pointer",fontSize:12,fontWeight:700}}>
            <Icon name="plus" size={13} color="#ef4444"/> New Estimate
          </button>
        </div>
      )}

      {/* ── Config Panel ── */}
      <Card>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${GOLD},#f97316)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>💰</div>
          <div>
            <div style={{fontWeight:800,fontSize:16,color:T.text,letterSpacing:"-0.3px"}}>Project Cost Estimator</div>
            <div style={{fontSize:11,color:T.muted}}>Upload plans → AI reads scope → generates client-ready estimate</div>
          </div>
        </div>

        {/* Scope mode */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Scope Mode</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {SCOPE_MODES.map(o=>(
              <button key={o.v} onClick={()=>setScopeMode(o.v)} style={{padding:"7px 14px",borderRadius:9,border:`1.5px solid ${scopeMode===o.v?GOLD:T.border}`,background:scopeMode===o.v?"rgba(245,158,11,0.12)":"transparent",color:scopeMode===o.v?GOLD:T.muted,cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.15s"}}>{o.l}</button>
            ))}
          </div>
        </div>

        {/* Renovation level (conditional) */}
        {(scopeMode==="renovation"||scopeMode==="fitout") && (
          <div style={{marginBottom:14,background:"rgba(245,158,11,0.05)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:10,padding:14}}>
            <div style={{fontSize:10,fontWeight:700,color:GOLD,marginBottom:8,textTransform:"uppercase"}}>Renovation Extent</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {RENOV_LEVELS.map(o=>(
                <button key={o.v} onClick={()=>setRenovScope(o.v)} style={{flex:1,minWidth:140,padding:"10px 12px",borderRadius:9,border:`1.5px solid ${renovScope===o.v?GOLD:T.border}`,background:renovScope===o.v?"rgba(245,158,11,0.12)":"transparent",color:renovScope===o.v?GOLD:T.muted,cursor:"pointer",transition:"all 0.15s",textAlign:"left"}}>
                  <div style={{fontSize:12,fontWeight:800}}>{o.l}</div>
                  <div style={{fontSize:10,marginTop:2,lineHeight:1.4}}>{o.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ad-hoc custom scope */}
        {scopeMode==="adhoc" && (
          <div style={{marginBottom:14,background:"rgba(99,102,241,0.05)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:10,padding:14}}>
            <div style={{fontSize:10,fontWeight:700,color:"#6366f1",marginBottom:6,textTransform:"uppercase"}}>Custom Scope Description</div>
            <textarea value={adhocItems} onChange={e=>setAdhocItems(e.target.value)}
              placeholder={"Describe the specific works to be estimated. Examples:\n- Replace all windows (12 units, analok frame)\n- Install new 150A electrical panel + rewire 2nd floor\n- Construct perimeter fence 45 linear meters\n- Install ceramic tiles living/dining area ~80 sqm"}
              style={{width:"100%",background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:9,padding:"10px 12px",color:T.text,fontSize:12,outline:"none",resize:"vertical",minHeight:100,lineHeight:1.6,fontFamily:"inherit"}}
              onFocus={e=>e.target.style.borderColor="#6366f1"} onBlur={e=>e.target.style.borderColor=T.border}/>
          </div>
        )}

        {/* Project details grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5,textTransform:"uppercase"}}>Project Type</div>
            <select value={projectType} onChange={e=>setProjectType(e.target.value)}
              style={{width:"100%",background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:9,padding:"8px 12px",color:T.text,fontSize:12,outline:"none",cursor:"pointer"}}>
              {PROJECT_TYPES.map(p=><option key={p.v} value={p.v}>{p.l}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5,textTransform:"uppercase"}}>Finish Level</div>
            <select value={finishLevel} onChange={e=>setFinishLevel(e.target.value)}
              style={{width:"100%",background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:9,padding:"8px 12px",color:T.text,fontSize:12,outline:"none",cursor:"pointer"}}>
              {FINISH_LEVELS.map(f=><option key={f.v} value={f.v}>{f.l} — {f.desc}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5,textTransform:"uppercase"}}>Location</div>
            <select value={location} onChange={e=>setLocation(e.target.value)}
              style={{width:"100%",background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:9,padding:"8px 12px",color:T.text,fontSize:12,outline:"none",cursor:"pointer"}}>
              {LOCATIONS.map(l=><option key={l.v} value={l.v}>{l.l}</option>)}
            </select>
          </div>
        </div>

        {/* Client / Engineer fields + GFA override */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:14}}>
          {[
            {l:"Client Name",      v:clientName,     s:setClientName,     ph:"e.g. Mr. Juan Dela Cruz"},
            {l:"Project Name",     v:projectName,    s:setProjectName,    ph:"e.g. Dela Cruz Residence"},
            {l:"Prepared By",      v:engineerName,   s:setEngineerName,   ph:"Engr. / Arch. name"},
            {l:"GFA Override (sqm)",v:gfaOverride,   s:setGfaOverride,    ph:"Leave blank to auto-detect"},
          ].map(f=>(
            <div key={f.l}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5,textTransform:"uppercase"}}>{f.l}</div>
              <input value={f.v} onChange={e=>f.s(e.target.value)} placeholder={f.ph}
                style={{width:"100%",background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:9,padding:"8px 10px",color:T.text,fontSize:12,outline:"none"}}
                onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor=T.border}/>
            </div>
          ))}
        </div>

        {/* Special notes + pro fees toggle */}
        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,marginBottom:14,alignItems:"start"}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:5,textTransform:"uppercase"}}>Special Notes / Scope Clarifications</div>
            <input value={specialNotes} onChange={e=>setSpecialNotes(e.target.value)} placeholder="e.g. Exclude MEP works · Ground floor only · Existing slab to remain"
              style={{width:"100%",background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:9,padding:"8px 12px",color:T.text,fontSize:12,outline:"none"}}
              onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor=T.border}/>
          </div>
          <div style={{paddingTop:20}}>
            <button onClick={()=>setInclProfFees(!inclProfFees)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:9,border:`1.5px solid ${inclProfFees?"#10b981":T.border}`,background:inclProfFees?"rgba(16,185,129,0.1)":"transparent",color:inclProfFees?"#10b981":T.muted,cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>
              <span>{inclProfFees?"✓":"○"}</span> Include Prof. Fees
            </button>
          </div>
        </div>

        {/* File upload */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,color:GOLD,marginBottom:6,textTransform:"uppercase"}}>📐 Upload Plans * <span style={{color:T.muted,fontWeight:400,textTransform:"none"}}>(PDF, JPG, PNG — floor plans, elevations, site plans)</span></div>
          <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
            onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files)}} onClick={()=>fileRef.current?.click()}
            style={{border:`2px dashed ${drag?GOLD:T.border}`,borderRadius:12,padding:"20px",textAlign:"center",cursor:"pointer",background:drag?"rgba(245,158,11,0.06)":"rgba(255,255,255,0.01)",transition:"all 0.2s"}}>
            <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e=>addFiles(e.target.files)} style={{display:"none"}}/>
            <div style={{fontSize:28,marginBottom:6}}>📐</div>
            <div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:3}}>Drag & drop plans here</div>
            <div style={{color:T.muted,fontSize:11,marginBottom:10}}>More plans = more accurate estimate · floor plans · site plan · elevations</div>
            <div style={{display:"inline-block",background:GOLD,color:"#000",fontWeight:700,padding:"7px 18px",borderRadius:8,fontSize:12}}>Choose Files</div>
          </div>
          {files.length>0 && (
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>
              {files.map(fo=>(
                <div key={fo.id} style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:7,padding:"4px 8px",display:"flex",alignItems:"center",gap:5,maxWidth:200}}>
                  <span style={{fontSize:10}}>{fo.type?.startsWith("image/")?"🖼️":"📄"}</span>
                  <span style={{fontSize:10,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{fo.name}</span>
                  <button onClick={e=>{e.stopPropagation();setFiles(p=>p.filter(f=>f.id!==fo.id))}} style={{background:"rgba(239,68,68,0.12)",border:"none",color:T.danger,width:16,height:16,borderRadius:3,cursor:"pointer",fontSize:10,flexShrink:0}}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:13,color:T.danger}}>⚠️ {error}</div>}

        <button onClick={run} disabled={busy||!files.length} style={{width:"100%",background:busy||!files.length?`rgba(245,158,11,0.2)`:`linear-gradient(135deg,${GOLD},#f97316)`,border:"none",color:busy||!files.length?"#555":"#000",fontWeight:800,fontSize:15,padding:"13px",borderRadius:12,cursor:busy||!files.length?"not-allowed":"pointer",transition:"all 0.2s"}}>
          {busy ? (busyMsg||"⚙️ Generating estimate…") : "💰 Generate Cost Estimate"}
        </button>
        {busy && (
          <div style={{marginTop:10,background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:10,padding:"10px 16px",fontSize:12,color:GOLD,display:"flex",alignItems:"center",gap:10}}>
            <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⏳</span>
            <span>{busyMsg||"Working…"}</span>
          </div>
        )}
        {!files.length && !busy && <div style={{textAlign:"center",fontSize:11,color:T.muted,marginTop:7}}>Upload at least one plan file to begin</div>}
      </Card>

      {/* ── RESULTS ── */}
      {result && (
        <div style={{animation:"fadeIn 0.35s ease"}}>

          {/* Summary header */}
          <Card style={{marginBottom:14,background:"rgba(245,158,11,0.04)",border:"1.5px solid rgba(245,158,11,0.25)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:14}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontSize:10,color:T.muted,marginBottom:3}}>PROJECT</div>
                <div style={{fontWeight:800,fontSize:19,color:T.text,letterSpacing:"-0.5px"}}>{project.name||projectName||"Project"}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:2}}>{project.type} · {project.subtype} · {project.finishLevel} Finish</div>
                <div style={{fontSize:11,color:T.muted,marginTop:1}}>{project.location} · {fmtN(project.estimatedGFA)} sqm · {project.floors} floor{project.floors>1?"s":""}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:8,lineHeight:1.6,background:T.dim,borderRadius:8,padding:"8px 12px"}}>{project.scopeSummary}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,minWidth:240}}>
                <div style={{background:`rgba(245,158,11,0.12)`,border:"1.5px solid rgba(245,158,11,0.35)",borderRadius:12,padding:"16px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:T.muted,marginBottom:4}}>ESTIMATED CONSTRUCTION COST</div>
                  <div style={{fontSize:22,fontWeight:900,color:GOLD,fontFamily:"monospace",letterSpacing:"-0.5px"}}>₱{fmtR(summary.totalLow)}</div>
                  <div style={{fontSize:14,color:T.muted,margin:"4px 0"}}>to</div>
                  <div style={{fontSize:22,fontWeight:900,color:GOLD,fontFamily:"monospace",letterSpacing:"-0.5px"}}>₱{fmtR(summary.totalHigh)}</div>
                  <div style={{fontSize:11,color:T.muted,marginTop:6}}>Midpoint: <strong style={{color:T.text}}>₱{fmtR(summary.midpoint)}</strong></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                  <div style={{background:T.dim,borderRadius:9,padding:"10px 12px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:T.muted,marginBottom:2}}>COST / SQM</div>
                    <div style={{fontSize:12,fontWeight:800,color:T.text,fontFamily:"monospace"}}>₱{fmtR(summary.costPerSqmLow)}–₱{fmtR(summary.costPerSqmHigh)}</div>
                  </div>
                  <div style={{background:T.dim,borderRadius:9,padding:"10px 12px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:T.muted,marginBottom:2}}>GFA</div>
                    <div style={{fontSize:12,fontWeight:800,color:T.text}}>{fmtN(project.estimatedGFA)} sqm</div>
                  </div>
                </div>
                {inclProfFees && summary.grandTotalLow && (
                  <div style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:9,padding:"10px 12px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:T.muted,marginBottom:2}}>GRAND TOTAL (incl. Prof. Fees)</div>
                    <div style={{fontSize:14,fontWeight:800,color:"#10b981",fontFamily:"monospace"}}>₱{fmtR(summary.grandTotalLow)} – ₱{fmtR(summary.grandTotalHigh)}</div>
                  </div>
                )}
              </div>
            </div>
            {warnings.length>0 && (
              <div style={{marginTop:12,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:8,padding:"8px 12px",fontSize:12,color:GOLD}}>
                ⚠️ {warnings.join(" · ")}
              </div>
            )}
          </Card>

          {/* Tabs */}
          <div style={{display:"flex",gap:5,marginBottom:14,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {[
                {k:"summary",  l:"📊 Summary"},
                {k:"trades",   l:`🏗️ By Trade (${trades.length})`},
                {k:"scope",    l:"📋 Scope & Assumptions"},
                {k:"ve",       l:`💡 Value Engineering (${veItems.length})`},
              ].map(t=>(
                <button key={t.k} onClick={()=>setActiveTab(t.k)} style={{padding:"6px 13px",borderRadius:8,border:`1.5px solid ${activeTab===t.k?GOLD:T.border}`,background:activeTab===t.k?"rgba(245,158,11,0.12)":"transparent",color:activeTab===t.k?GOLD:T.muted,cursor:"pointer",fontSize:11,fontWeight:700,transition:"all 0.15s"}}>{t.l}</button>
              ))}
            </div>
            <button onClick={exportDocument} style={{background:`linear-gradient(135deg,${GOLD},#f97316)`,border:"none",color:"#000",fontWeight:700,padding:"8px 18px",borderRadius:9,cursor:"pointer",fontSize:11,fontWeight:800}}>📄 Export Client Document</button>
          </div>

          {/* SUMMARY TAB */}
          {activeTab==="summary" && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <Card>
                <Label>Cost Breakdown</Label>
                <div style={{display:"flex",flexDirection:"column",gap:7,marginTop:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"7px 12px",background:T.dim,borderRadius:8}}><span style={{fontSize:12,color:T.muted}}>Construction Subtotal</span><span style={{fontSize:12,fontWeight:700,color:T.text,fontFamily:"monospace"}}>₱{fmtR(summary.constructionCostLow)} – ₱{fmtR(summary.constructionCostHigh)}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"7px 12px",background:"rgba(245,158,11,0.06)",borderRadius:8}}><span style={{fontSize:12,color:T.muted}}>Contingency ({summary.contingencyPct}%)</span><span style={{fontSize:12,fontWeight:700,color:GOLD,fontFamily:"monospace"}}>+₱{fmtR(summary.contingencyLow)} – ₱{fmtR(summary.contingencyHigh)}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:`rgba(245,158,11,0.12)`,border:`1.5px solid rgba(245,158,11,0.3)`,borderRadius:10}}><span style={{fontSize:13,fontWeight:800,color:T.text}}>Total Construction</span><span style={{fontSize:14,fontWeight:900,color:GOLD,fontFamily:"monospace"}}>₱{fmtR(summary.totalLow)} – ₱{fmtR(summary.totalHigh)}</span></div>
                  {inclProfFees && summary.professionalFeesLow && <>
                    <div style={{display:"flex",justifyContent:"space-between",padding:"7px 12px",background:"rgba(16,185,129,0.06)",borderRadius:8}}><span style={{fontSize:12,color:T.muted}}>Professional Fees ({summary.professionalFeesPct}%)</span><span style={{fontSize:12,fontWeight:700,color:"#10b981",fontFamily:"monospace"}}>₱{fmtR(summary.professionalFeesLow)} – ₱{fmtR(summary.professionalFeesHigh)}</span></div>
                    <div style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:"rgba(16,185,129,0.1)",border:"1.5px solid rgba(16,185,129,0.3)",borderRadius:10}}><span style={{fontSize:13,fontWeight:800,color:T.text}}>Grand Total</span><span style={{fontSize:14,fontWeight:900,color:"#10b981",fontFamily:"monospace"}}>₱{fmtR(summary.grandTotalLow)} – ₱{fmtR(summary.grandTotalHigh)}</span></div>
                  </>}
                  <div style={{fontSize:10,color:T.muted,padding:"6px 10px",background:T.dim,borderRadius:6,lineHeight:1.5}}>{summary.vatNote}</div>
                </div>
              </Card>
              <Card>
                <Label>Trade Distribution</Label>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:12}}>
                  {trades.slice(0,8).map((t,i)=>{
                    const maxTotal = Math.max(...trades.map(x=>x.totalHigh||0));
                    const pct = maxTotal ? ((t.totalHigh||0)/maxTotal*100) : 0;
                    return (
                      <div key={t.id||i}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                          <span style={{fontSize:11,color:T.text,fontWeight:600}}>{t.trade}</span>
                          <span style={{fontSize:11,color:TRADE_COLORS[i%TRADE_COLORS.length],fontFamily:"monospace",fontWeight:700}}>₱{fmtR(t.totalHigh)}</span>
                        </div>
                        <div style={{background:T.border,borderRadius:99,height:5,overflow:"hidden"}}>
                          <div style={{width:`${pct}%`,height:"100%",background:TRADE_COLORS[i%TRADE_COLORS.length],borderRadius:99,transition:"width 0.5s ease"}}/>
                        </div>
                      </div>
                    );
                  })}
                  {trades.length>8 && <div style={{fontSize:11,color:T.muted,textAlign:"center",marginTop:4}}>+{trades.length-8} more trades</div>}
                </div>
              </Card>
            </div>
          )}

          {/* TRADES TAB */}
          {activeTab==="trades" && (
            <Card style={{padding:0,overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:800}}>
                  <thead><tr style={{background:"rgba(245,158,11,0.1)"}}>
                    {["Trade","Scope Description","Qty","Unit","Rate Low","Rate High","Total Low","Total High","Basis"].map(h=>(
                      <th key={h} style={{padding:"9px 10px",textAlign:["Rate Low","Rate High","Total Low","Total High"].includes(h)?"right":"left",fontSize:10,color:T.muted,fontWeight:700,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {trades.map((t,i)=>(
                      <tr key={t.id||i} style={{borderBottom:`1px solid ${T.border}`,background:i%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
                        <td style={{padding:"9px 10px",fontSize:12,fontWeight:700,color:TRADE_COLORS[i%TRADE_COLORS.length]}}>{t.trade}</td>
                        <td style={{padding:"9px 10px",fontSize:11,color:T.muted,maxWidth:200,lineHeight:1.4}}>{t.description}</td>
                        <td style={{padding:"9px 10px",fontSize:11,color:T.text,textAlign:"right",fontFamily:"monospace"}}>{fmtN(t.qty)}</td>
                        <td style={{padding:"9px 10px",fontSize:11,color:T.muted}}>{t.unit}</td>
                        <td style={{padding:"9px 10px",fontSize:11,textAlign:"right",fontFamily:"monospace",color:T.text}}>₱{fmtR(t.rateLow)}</td>
                        <td style={{padding:"9px 10px",fontSize:11,textAlign:"right",fontFamily:"monospace",color:T.text}}>₱{fmtR(t.rateHigh)}</td>
                        <td style={{padding:"9px 10px",fontSize:11,textAlign:"right",fontFamily:"monospace",color:T.muted}}>₱{fmtR(t.totalLow)}</td>
                        <td style={{padding:"9px 10px",fontSize:12,textAlign:"right",fontFamily:"monospace",color:GOLD,fontWeight:700}}>₱{fmtR(t.totalHigh)}</td>
                        <td style={{padding:"9px 10px",fontSize:10,color:T.muted,maxWidth:160,lineHeight:1.4}}>{t.basis}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr style={{background:"rgba(245,158,11,0.1)",borderTop:`2px solid rgba(245,158,11,0.3)`}}>
                    <td colSpan={6} style={{padding:"10px 10px",fontSize:13,fontWeight:800,color:T.text}}>CONSTRUCTION COST TOTAL</td>
                    <td style={{padding:"10px 10px",fontSize:13,fontWeight:800,color:T.muted,textAlign:"right",fontFamily:"monospace"}}>₱{fmtR(summary.constructionCostLow)}</td>
                    <td style={{padding:"10px 10px",fontSize:13,fontWeight:800,color:GOLD,textAlign:"right",fontFamily:"monospace"}}>₱{fmtR(summary.constructionCostHigh)}</td>
                    <td/>
                  </tr></tfoot>
                </table>
              </div>
            </Card>
          )}

          {/* SCOPE & ASSUMPTIONS TAB */}
          {activeTab==="scope" && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <Card>
                <Label>Scope Included</Label>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:12}}>
                  {(project.scopeIncluded||[]).map((s,i)=>(
                    <div key={i} style={{display:"flex",gap:8,padding:"7px 10px",background:T.dim,borderRadius:8}}>
                      <span style={{color:"#10b981",fontWeight:800,flexShrink:0}}>✓</span>
                      <span style={{fontSize:12,color:T.text}}>{s}</span>
                    </div>
                  ))}
                </div>
                <Label style={{marginTop:16}}>Scope Excluded</Label>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:10}}>
                  {(project.scopeExcluded||[]).map((s,i)=>(
                    <div key={i} style={{display:"flex",gap:8,padding:"7px 10px",background:T.dim,borderRadius:8}}>
                      <span style={{color:"#ef4444",fontWeight:800,flexShrink:0}}>✗</span>
                      <span style={{fontSize:12,color:T.muted}}>{s}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <Label>Key Assumptions</Label>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:12}}>
                  {(project.assumptions||[]).map((a,i)=>(
                    <div key={i} style={{display:"flex",gap:8,padding:"7px 10px",background:T.dim,borderRadius:8}}>
                      <span style={{color:GOLD,fontWeight:800,flexShrink:0,fontSize:12}}>•</span>
                      <span style={{fontSize:12,color:T.text,lineHeight:1.5}}>{a}</span>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:14,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:9,padding:"10px 12px"}}>
                  <div style={{fontSize:11,color:GOLD,fontWeight:700,marginBottom:4}}>⚠️ Accuracy Note</div>
                  <div style={{fontSize:11,color:T.muted,lineHeight:1.6}}>{project.accuracyNote}</div>
                </div>
                <div style={{marginTop:8,background:"rgba(100,116,139,0.08)",border:"1px solid rgba(100,116,139,0.15)",borderRadius:9,padding:"10px 12px"}}>
                  <div style={{fontSize:11,color:T.muted,lineHeight:1.6}}>{project.validityNote}</div>
                </div>
              </Card>
            </div>
          )}

          {/* VALUE ENGINEERING TAB */}
          {activeTab==="ve" && (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {veItems.length===0
                ? <Card style={{textAlign:"center",opacity:0.5,padding:40}}><div style={{fontSize:40,marginBottom:12}}>💡</div><div style={{color:T.muted}}>No value engineering suggestions generated</div></Card>
                : veItems.map((v,i)=>(
                  <div key={i} style={{background:"rgba(16,185,129,0.05)",border:"1.5px solid rgba(16,185,129,0.2)",borderRadius:12,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16}}>
                    <div style={{display:"flex",gap:12,alignItems:"flex-start",flex:1}}>
                      <span style={{fontSize:20,flexShrink:0}}>💡</span>
                      <span style={{fontSize:13,color:T.text,lineHeight:1.6}}>{v.item}</span>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:9,color:T.muted,marginBottom:2}}>POTENTIAL SAVING</div>
                      <div style={{fontSize:14,fontWeight:800,color:"#10b981"}}>{v.potentialSaving}</div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          <div style={{marginTop:12,padding:"9px 14px",background:T.dim,borderRadius:9,fontSize:11,color:T.muted,lineHeight:1.5}}>
            ⚠️ Parametric pre-design estimate ±20–35%. Not a contract document or bill of quantities. For contract award, commission a full QS. · PH Engineering Suite
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !busy && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
          {[
            {i:"📐",t:"Reads Your Plans",       d:"AI identifies GFA, scope, building type from drawings"},
            {i:"🏗️",t:"New Construction",        d:"Full parametric estimate by trade, NCR to Mindanao"},
            {i:"🔧",t:"Renovations & Fit-outs",  d:"Light, moderate, or heavy — only affected trades"},
            {i:"📝",t:"Ad-hoc / Custom Scope",   d:"Describe specific works, AI estimates line by line"},
            {i:"📊",t:"Detailed Breakdown",      d:"12 trade categories, low–high range per item"},
            {i:"💡",t:"Value Engineering",        d:"AI suggests where to save without compromising quality"},
            {i:"📄",t:"Client Document Export",   d:"Professional cost estimate letter, ready to send"},
            {i:"🏛️",t:"Covers All Locations",    d:"NCR, Luzon, Visayas, Mindanao cost modifiers"},
          ].map(x=>(
            <Card key={x.t} style={{textAlign:"center",padding:18}}>
              <div style={{fontSize:24,marginBottom:7}}>{x.i}</div>
              <div style={{fontWeight:700,fontSize:12,color:T.text,marginBottom:3}}>{x.t}</div>
              <div style={{fontSize:10,color:T.muted,lineHeight:1.5}}>{x.d}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STRUCTICODE: MAIN WRAPPER ────────────────────────────────────────────────

// ─── STRUCTURAL INTELLIGENCE: PURE COMPUTATION ENGINE ────────────────────────
// Runs all design calcs from structuralData without React state.
// Returns a structuralResults object consumable by the summary panel.

function runAllComputations(sd) {
  if (!sd) return null;
  const results = { timestamp: new Date().toISOString(), items: [], memberData: {} };

  const fc = sd.materials?.fc || 27.6;
  const fy = sd.materials?.fy || 414;

  // ── 1. SEISMIC ──
  try {
    const zone = sd.seismic?.zone || "Zone 4";
    const soil = sd.seismic?.soilTypeLabel || "SD - Stiff Soil";
    const occ  = sd.seismic?.occupancyCategory || "I - Standard";
    const W    = sd.seismic?.seismicWeight || 5000;
    const Tper = sd.seismic?.naturalPeriod || 0.3;
    const R    = sd.seismic?.responseFactor || 8.5;
    const Zv   = PH_SEISMIC_ZONES[zone]?.Z || 0.4;
    const soilKey = Object.keys(SOIL_TYPES).find(k=>k.startsWith(soil.split(" ")[0])) || "SD - Stiff Soil";
    const {Fa, Fv} = SOIL_TYPES[soilKey] || {Fa:1.2,Fv:1.7};
    const I    = OCCUPANCY_I[occ] || 1.0;
    const Ca   = 0.4*Fa*Zv;
    const Cv   = 0.4*Fv*Zv*1.5;
    const Ts   = Cv/(2.5*Ca);
    const Sa   = Tper <= 0.2*Ts ? Ca*(0.6*(Tper/(0.2*Ts))+0.4) : Tper <= Ts ? 2.5*Ca : Cv/Tper;
    const Vmin = 0.11*Ca*I*W;
    const Vmax = 2.5*Ca*I*W/R;
    const V    = Math.max(Vmin, Math.min(Sa*I*W/R, Vmax));
    results.seismic = { zone, soil, occ, W, V:+V.toFixed(1), Cs:+(V/W*100).toFixed(2), Ca, Cv, I, R, status:"COMPUTED" };
    results.items.push({ tool:"seismic", id:"Seismic Base Shear", value:`V = ${V.toFixed(1)} kN`, Cs:`${(V/W*100).toFixed(2)}%`, status:"COMPUTED" });
  } catch(e) { results.items.push({ tool:"seismic", id:"Seismic Base Shear", status:"ERROR", error:e.message }); }

  // ── 2. BEAMS ──
  const beams = (sd.beams?.length ? sd.beams : [{ id:"B1", span:5.5, width:300, depth:500, Mu:150, Vu:120 }]);
  results.memberData.beams = [];
  beams.forEach(bm => {
    try {
      const b=bm.width||300, d=bm.depth||500, span=bm.span||5.5;
      const Mu=bm.Mu||150, Vu=bm.Vu||120;
      const phi_b=0.90, phi_v=0.85;
      const beta1 = fc>=28 ? Math.max(0.65, 0.85-0.05*(fc-28)/7) : 0.85;
      const Rn  = (Mu*1e3)/(phi_b*(b/1000)*(d/1000)*(d/1000)*1e6);
      const rho_req = (0.85*fc/fy)*(1-Math.sqrt(Math.max(0,1-(2*Rn)/(0.85*fc))));
      const rho_min = Math.max(0.25*Math.sqrt(fc)/fy, 1.4/fy);
      const rho_max = 0.75*0.85*beta1*(fc/fy)*(600/(600+fy));
      const rho_use = Math.max(rho_req, rho_min);
      const As_req  = rho_use*b*d;
      const Vc = (1/6)*Math.sqrt(fc)*b*d/1000;
      const Vs_req = Math.max(0, Vu/phi_v - Vc);
      const status_flex  = rho_req<=rho_max ? "PASS" : "FAIL";
      const status_shear = Vc*phi_v>=Vu ? "Vc adequate" : "Stirrups required";
      const overallStatus = (status_flex==="PASS" && status_shear!=="FAIL") ? "PASS" : "FAIL";
      const memberRec = { id:bm.id||"B?", b, d, span, fc, fy, Mu, Vu, Rn, rho_req, rho_min, rho_max, rho_use, As_req, Vc, Vs_req, status_flex, status_shear, status:overallStatus };
      results.memberData.beams.push(memberRec);
      results.items.push({ tool:"beam", id:bm.id||"B?", value:`As=${As_req.toFixed(0)}mm²`, detail:`Flex:${status_flex} Shear:${status_shear}`, status:overallStatus, memberRec });
    } catch(e) { results.items.push({ tool:"beam", id:bm.id||"B?", status:"ERROR", error:e.message }); }
  });

  // ── 3. COLUMNS ──
  const cols = (sd.columns?.length ? sd.columns : [{ id:"C1", width:400, height:400, Pu:1500, Mu:80, type:"tied" }]);
  results.memberData.columns = [];
  cols.forEach(col => {
    try {
      const b=col.width||400, h=col.height||400;
      const Pu=col.Pu||1500, Mu=col.Mu||80;
      const phi=col.type==="spiral"?0.75:0.65, Ag=b*h;
      const Pn_req=Pu*1000/phi;
      const Ast_req=Math.max((Pn_req/0.80-0.85*fc*Ag)/(fy-0.85*fc),0.01*Ag);
      const rho_req=Ast_req/Ag;
      const phiPn=phi*0.80*(0.85*fc*(Ag-Ast_req)+fy*Ast_req)/1000;
      const status=(rho_req<=0.08&&rho_req>=0.01&&phiPn>=Pu)?"PASS":"FAIL";
      const memberRec = { id:col.id||"C?", b, h, fc, fy, Pu, Mu, Ag, Ast_req, rho_req, phiPn, phi, type:col.type||"tied", status };
      results.memberData.columns.push(memberRec);
      results.items.push({ tool:"column", id:col.id||"C?", value:`Ast=${Ast_req.toFixed(0)}mm²`, detail:`ρ=${(rho_req*100).toFixed(2)}% φPn=${phiPn.toFixed(0)}kN`, status, memberRec });
    } catch(e) { results.items.push({ tool:"column", id:col.id||"C?", status:"ERROR", error:e.message }); }
  });

  // ── 4. FOOTINGS ──
  const footings = (sd.footings?.length ? sd.footings : [{ id:"F1", columnLoad:800, soilBearing:150, depth:1.5 }]);
  results.memberData.footings = [];
  footings.forEach(ft => {
    try {
      const P=ft.columnLoad||800, qa=ft.soilBearing||150, Df=ft.depth||1.5;
      const qnet=qa-23.5*Df;
      if(qnet<=0){results.items.push({tool:"footing",id:ft.id||"F?",status:"FAIL",error:"Net bearing ≤ 0"});return;}
      const B=Math.ceil(Math.sqrt(P/qnet)*10)/10;
      const d=Math.max(B*1000/5,250);
      const c=(B-0.4)/2;
      const qu=1.2*P/(B*B);
      const Mu_ft=qu*B*c*c/2;
      const Rn=(Mu_ft*1e6)/(0.90*(B*1000)*d*d);
      const rho=(0.85*fc/fy)*(1-Math.sqrt(Math.max(0,1-(2*Rn)/(0.85*fc))));
      const rho_use=Math.max(rho,0.0018);
      const As=rho_use*B*1000*d;
      const memberRec = { id:ft.id||"F?", P, qa, Df, fc, fy, qnet, B, d, qu, Mu_ft, rho_use, As, status:"PASS" };
      results.memberData.footings.push(memberRec);
      results.items.push({ tool:"footing", id:ft.id||"F?", value:`B=${B.toFixed(2)}m×${B.toFixed(2)}m`, detail:`As=${As.toFixed(0)}mm²/m d=${d.toFixed(0)}mm`, status:"PASS", memberRec });
    } catch(e) { results.items.push({ tool:"footing", id:ft.id||"F?", status:"ERROR", error:e.message }); }
  });

  // ── 5. SLABS ──
  const slabs = (sd.slabs?.length ? sd.slabs : [{ id:"S1", span:4.0, type:"one-way", DL:3.0, LL:2.4 }]);
  results.memberData.slabs = [];
  slabs.forEach(sl => {
    try {
      const L=sl.span||4.0, wDL=sl.DL||sd.loads?.floorDL||3.0, wLL=sl.LL||sd.loads?.floorLL||2.4;
      const wu=1.2*wDL+1.6*wLL;
      const h_min=L*1000/20;
      const h=Math.max(Math.ceil(h_min/10)*10,100);
      const d=h-25;
      const Mu=wu*L*L/8;
      const Rn=(Mu*1e6)/(0.90*1000*d*d);
      const rho=(0.85*fc/fy)*(1-Math.sqrt(Math.max(0,1-(2*Rn)/(0.85*fc))));
      const rho_use=Math.max(rho,0.0018);
      const As=rho_use*1000*d;
      const memberRec = { id:sl.id||"S?", L, wDL, wLL, fc, fy, wu, h, d, Mu, rho_use, As, status:"PASS" };
      results.memberData.slabs.push(memberRec);
      results.items.push({ tool:"slab", id:sl.id||"S?", value:`h=${h}mm As=${As.toFixed(0)}mm²/m`, detail:`wu=${wu.toFixed(2)}kPa Mu=${Mu.toFixed(1)}kN·m/m`, status:"PASS", memberRec });
    } catch(e) { results.items.push({ tool:"slab", id:sl.id||"S?", status:"ERROR", error:e.message }); }
  });

  // ── 6. LOAD COMBINATIONS ──
  try {
    const flDL=sd.loads?.floorDL||3.0, flLL=sd.loads?.floorLL||2.4;
    const D=flDL*50, L=flLL*50, E=results.seismic?.V||60;
    const combos=[
      {name:"1.4D",             val:+(1.4*D).toFixed(1)},
      {name:"1.2D+1.6L",        val:+(1.2*D+1.6*L).toFixed(1)},
      {name:"1.2D+1.0E+1.0L",   val:+(1.2*D+E+L).toFixed(1)},
      {name:"0.9D+1.0E",        val:+(0.9*D+E).toFixed(1)},
    ];
    const maxCombo=combos.reduce((a,b)=>a.val>b.val?a:b);
    results.loadCombos=combos;
    results.items.push({ tool:"loads", id:"Load Combinations", value:`Max: ${maxCombo.name}`, detail:`${maxCombo.val} kN/m²`, status:"COMPUTED" });
  } catch(e) { results.items.push({ tool:"loads", id:"Load Combinations", status:"ERROR", error:e.message }); }

  results.summary = {
    total:    results.items.length,
    pass:     results.items.filter(i=>i.status==="PASS").length,
    fail:     results.items.filter(i=>i.status==="FAIL").length,
    computed: results.items.filter(i=>i.status==="COMPUTED").length,
    error:    results.items.filter(i=>i.status==="ERROR").length,
  };
  return results;
}


// ─── STRUCTURAL INTELLIGENCE PANEL (redesigned) ──────────────────────────────
function StructuralIntelligencePanel({ data, onUpdate, onRunAll, onClear, runState, structuralResults, onNavigate }) {
  const [expanded, setExpanded] = useState(false); // collapsed by default
  const [showMembers, setShowMembers] = useState(false);

  const bldg = data.building  || {};
  const mat  = data.materials || {};
  const sei  = data.seismic   || {};
  const lds  = data.loads     || {};
  const beams   = data.beams    || [];
  const cols    = data.columns  || [];
  const ftgs    = data.footings || [];
  const slbs    = data.slabs    || [];

  // Computation readiness — which calcs have enough data
  const readiness = [
    { key:"seismic", label:"Seismic",      ok: !!(sei.zone || sei.seismicWeight),            detail: sei.zone || "" },
    { key:"beam",    label:"Beam",          ok: !!(beams.length && mat.fc),                   detail: beams.length ? `${beams.length} member(s)` : "" },
    { key:"column",  label:"Column",        ok: !!(cols.length && mat.fc),                    detail: cols.length ? `${cols.length} member(s)` : "" },
    { key:"footing", label:"Footing",       ok: !!(ftgs.length),                              detail: ftgs.length ? `${ftgs.length} member(s)` : "" },
    { key:"slab",    label:"Slab",          ok: !!(slbs.length || (lds.floorDL && mat.fc)),   detail: slbs.length ? `${slbs.length} member(s)` : "" },
    { key:"loads",   label:"Load Combos",   ok: !!(lds.floorDL && lds.floorLL),               detail: lds.floorDL ? `DL=${lds.floorDL}` : "" },
  ];

  const readyCount = readiness.filter(r=>r.ok).length;

  // Computation results summary
  const getItemStatus = (key) => {
    if (!structuralResults) return null;
    const items = structuralResults.items.filter(i=>i.tool===key);
    if (!items.length) return null;
    return items.every(i=>i.status==="PASS"||i.status==="COMPUTED") ? "pass"
         : items.some(i=>i.status==="FAIL") ? "fail" : "computed";
  };

  const statusColor = { pass:"#22c55e", fail:"#ef4444", computed:"#0696d7" };
  const statusIcon  = { pass:"✓", fail:"✗", computed:"✓" };

  // Inline field editor (only shown when expanded)
  const Field = ({label, value, path, type="number", fp=false}) => {
    const parts = path.split(".");
    const handleChange = (v) => {
      const updated = JSON.parse(JSON.stringify(data));
      let ref = updated;
      for (let i=0;i<parts.length-1;i++) { if(!ref[parts[i]]) ref[parts[i]]={};  ref=ref[parts[i]]; }
      ref[parts[parts.length-1]] = type==="number" ? +v : v;
      onUpdate(updated);
    };
    return (
      <div>
        <div style={{fontSize:10,color:T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.3px",fontWeight:600}}>
          {label}{fp && <span style={{fontSize:8,background:"rgba(34,197,94,0.15)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.25)",padding:"0px 4px",borderRadius:3,fontWeight:700,marginLeft:5}}>PLANS</span>}
        </div>
        <input type={type} value={value??""} onChange={e=>handleChange(e.target.value)}
          style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${fp?"rgba(34,197,94,0.25)":T.border}`,
            borderRadius:6,padding:"5px 8px",color:T.text,fontSize:12,fontWeight:600,outline:"none",width:"100%"}}/>
      </div>
    );
  };

  return (
    <div style={{marginBottom:20}}>
      {/* ── Compact summary bar ── */}
      <div style={{background:"rgba(6,150,215,0.06)",border:"1.5px solid rgba(6,150,215,0.2)",borderRadius:12,padding:"12px 16px"}}>

        {/* Top row: project info + actions */}
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#0696d7,#0569a8)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Icon name="structural" size={16} color="#fff"/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:800,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {bldg.name || "Structural Plans Loaded"}
            </div>
            <div style={{fontSize:11,color:T.muted}}>
              {[bldg.floors&&`${bldg.floors}F`, sei.zone, mat.fc&&`f'c=${mat.fc}MPa`, mat.fy&&`fy=${mat.fy}MPa`].filter(Boolean).join(" · ")||"Ready for computation"}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
            <button onClick={()=>setExpanded(p=>!p)}
              style={{padding:"6px 12px",background:"transparent",border:`1px solid ${T.border}`,color:T.muted,borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600}}>
              {expanded ? "▲ Less" : "▼ Edit Data"}
            </button>
            <button onClick={onRunAll} disabled={runState?.running}
              style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",
                background:runState?.running?"rgba(6,150,215,0.2)":"linear-gradient(135deg,#0696d7,#0569a8)",
                border:"none",color:runState?.running?"#64748b":"#fff",borderRadius:8,
                cursor:runState?.running?"not-allowed":"pointer",fontWeight:800,fontSize:12,transition:"all 0.2s"}}>
              {runState?.running
                ? <><span style={{display:"inline-block",animation:"spin 1s linear infinite"}}>⚙</span> Running…</>
                : <><Icon name="loads" size={13} color="#fff"/> Run All</>}
            </button>
            <button onClick={onClear}
              style={{padding:"8px 10px",background:"transparent",border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,cursor:"pointer",fontSize:11}}>
              ✕
            </button>
          </div>
        </div>

        {/* ── Computation readiness checklist ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6,marginTop:12}}>
          {readiness.map(r => {
            const computed = getItemStatus(r.key);
            return (
              <button key={r.key} onClick={()=>onNavigate&&onNavigate(r.key)}
                style={{padding:"7px 8px",borderRadius:8,cursor:"pointer",textAlign:"center",border:"none",
                  background: computed ? (computed==="fail"?"rgba(239,68,68,0.08)":"rgba(34,197,94,0.08)") : r.ok ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                  transition:"all 0.15s"}}>
                <div style={{fontSize:14,fontWeight:900,marginBottom:2,
                  color: computed ? statusColor[computed] : r.ok ? "#0696d7" : T.muted}}>
                  {computed ? statusIcon[computed] : r.ok ? "●" : "○"}
                </div>
                <div style={{fontSize:10,fontWeight:700,color:computed?statusColor[computed]:r.ok?T.text:T.muted,lineHeight:1.2}}>{r.label}</div>
                {computed && (
                  <div style={{fontSize:9,color:statusColor[computed],fontWeight:700,marginTop:1,textTransform:"uppercase"}}>
                    {computed}
                  </div>
                )}
                {!computed && r.ok && r.detail && (
                  <div style={{fontSize:9,color:T.muted,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.detail}</div>
                )}
                {!computed && !r.ok && (
                  <div style={{fontSize:9,color:T.muted,marginTop:1}}>no data</div>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Run All result summary (shows after computation) ── */}
        {structuralResults && (
          <div style={{display:"flex",gap:10,marginTop:10,padding:"8px 12px",background:T.dim,borderRadius:8,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:T.muted,fontWeight:600}}>Computation result:</span>
            {[
              {label:`${structuralResults.summary.pass} PASS`,   color:"#22c55e", bg:"rgba(34,197,94,0.1)"},
              {label:`${structuralResults.summary.fail} FAIL`,   color:"#ef4444", bg:"rgba(239,68,68,0.1)"},
              {label:`${structuralResults.summary.computed} COMPUTED`, color:"#0696d7", bg:"rgba(6,150,215,0.1)"},
            ].map(s=>(
              <span key={s.label} style={{fontSize:11,fontWeight:700,color:s.color,background:s.bg,padding:"3px 10px",borderRadius:6}}>{s.label}</span>
            ))}
            <button onClick={()=>{ /* export handled by StructuralComputationSummary */
              const w=window.open("","_blank");
              const date=new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});
              const toolLabel={seismic:"Seismic",beam:"Beam",column:"Column",footing:"Footing",slab:"Slab",loads:"Load Combos"};
              const statusColor2={PASS:"#16a34a",FAIL:"#dc2626",COMPUTED:"#0284c7",ERROR:"#d97706"};
              const rows=structuralResults.items.map(item=>`<tr><td>${toolLabel[item.tool]||item.tool}</td><td><strong>${item.id}</strong></td><td>${item.value||"-"}</td><td>${item.detail||"-"}</td><td style="color:${statusColor2[item.status]};font-weight:700">${item.status}</td></tr>`).join("");
              w.document.write(`<!DOCTYPE html><html><head><title>Structural Computation Package</title><style>body{font-family:Arial,sans-serif;margin:40px;font-size:13px}table{border-collapse:collapse;width:100%}th{background:#1e293b;color:#fff;padding:9px}td{border:1px solid #e2e8f0;padding:8px 10px}h1{color:#0696d7}@media print{button{display:none}}</style></head><body><h1>Structural Computation Package</h1><p style="color:#64748b">NSCP 2015 · ${date} · Buildify</p><table><tr><th>Tool</th><th>Member ID</th><th>Result</th><th>Detail</th><th>Status</th></tr>${rows}</table><p style="margin-top:24px;font-size:11px;color:#9ca3af">⚠️ For preliminary design only. Verify with licensed PSCE.</p></body></html>`);
              w.document.close(); setTimeout(()=>w.print(),400);
            }} style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,padding:"5px 12px",background:"linear-gradient(135deg,#0696d7,#0569a8)",border:"none",color:"#fff",borderRadius:6,cursor:"pointer",fontWeight:700,fontSize:11}}>
              <Icon name="download" size={11} color="#fff"/> Export PDF
            </button>
          </div>
        )}

        {/* ── Expandable data editor ── */}
        {expanded && (
          <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${T.border}`}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>

              {/* Building + Seismic */}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{fontSize:10,fontWeight:800,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px"}}>Building Info</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div style={{gridColumn:"1/-1"}}><Field label="Project Name" value={bldg.name} path="building.name" type="text" fp={!!bldg.name}/></div>
                  <Field label="Floors" value={bldg.floors} path="building.floors" fp={!!bldg.floors}/>
                  <Field label="Floor Height (m)" value={bldg.floorHeight} path="building.floorHeight" fp={!!bldg.floorHeight}/>
                </div>
                <div style={{fontSize:10,fontWeight:800,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px",marginTop:4}}>Materials</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <Field label="f'c (MPa)" value={mat.fc} path="materials.fc" fp={!!mat.fc}/>
                  <Field label="fy (MPa)"  value={mat.fy} path="materials.fy" fp={!!mat.fy}/>
                </div>
                <div style={{fontSize:10,fontWeight:800,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px",marginTop:4}}>Floor Loads</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <Field label="DL (kPa)" value={lds.floorDL} path="loads.floorDL" fp={!!lds.floorDL}/>
                  <Field label="LL (kPa)" value={lds.floorLL} path="loads.floorLL" fp={!!lds.floorLL}/>
                </div>
              </div>

              {/* Seismic */}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{fontSize:10,fontWeight:800,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px"}}>Seismic Parameters</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <Field label="Zone" value={sei.zone} path="seismic.zone" type="text" fp={!!sei.zone}/>
                  <Field label="Soil Type" value={sei.soilTypeLabel} path="seismic.soilTypeLabel" type="text" fp={!!sei.soilTypeLabel}/>
                  <Field label="Weight W (kN)" value={sei.seismicWeight} path="seismic.seismicWeight" fp={sei.seismicWeight!=null}/>
                  <Field label="Period T (s)" value={sei.naturalPeriod} path="seismic.naturalPeriod" fp={sei.naturalPeriod!=null}/>
                  <Field label="Factor R" value={sei.responseFactor} path="seismic.responseFactor" fp={sei.responseFactor!=null}/>
                </div>
              </div>
            </div>

            {/* Members — collapsible */}
            {(beams.length+cols.length+ftgs.length+slbs.length) > 0 && (
              <div style={{marginTop:12}}>
                <button onClick={()=>setShowMembers(p=>!p)}
                  style={{background:"transparent",border:`1px solid ${T.border}`,color:T.muted,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:600}}>
                  {showMembers?"▲":"▼"} Member Schedule ({beams.length+cols.length+ftgs.length+slbs.length} extracted)
                </button>
                {showMembers && (
                  <div style={{marginTop:10,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10}}>
                    {beams.length>0&&(
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:"#0696d7",marginBottom:6,textTransform:"uppercase"}}>Beams ({beams.length})</div>
                        {beams.map((bm,i)=>(
                          <div key={i} style={{display:"flex",gap:8,padding:"6px 10px",background:"rgba(6,150,215,0.05)",borderRadius:7,marginBottom:5,fontSize:11,flexWrap:"wrap"}}>
                            <span style={{fontWeight:700,color:"#0696d7",minWidth:28}}>{bm.id||`B${i+1}`}</span>
                            {bm.width&&<span style={{color:T.muted}}>b={bm.width}</span>}
                            {bm.depth&&<span style={{color:T.muted}}>d={bm.depth}</span>}
                            {bm.Mu&&<span style={{color:T.muted}}>Mu={bm.Mu}</span>}
                            {bm.Vu&&<span style={{color:T.muted}}>Vu={bm.Vu}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {cols.length>0&&(
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:"#f59e0b",marginBottom:6,textTransform:"uppercase"}}>Columns ({cols.length})</div>
                        {cols.map((c,i)=>(
                          <div key={i} style={{display:"flex",gap:8,padding:"6px 10px",background:"rgba(245,158,11,0.05)",borderRadius:7,marginBottom:5,fontSize:11,flexWrap:"wrap"}}>
                            <span style={{fontWeight:700,color:"#f59e0b",minWidth:28}}>{c.id||`C${i+1}`}</span>
                            {c.width&&<span style={{color:T.muted}}>b={c.width}</span>}
                            {c.height&&<span style={{color:T.muted}}>h={c.height}</span>}
                            {c.Pu&&<span style={{color:T.muted}}>Pu={c.Pu}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {ftgs.length>0&&(
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:"#22c55e",marginBottom:6,textTransform:"uppercase"}}>Footings ({ftgs.length})</div>
                        {ftgs.map((f,i)=>(
                          <div key={i} style={{display:"flex",gap:8,padding:"6px 10px",background:"rgba(34,197,94,0.05)",borderRadius:7,marginBottom:5,fontSize:11,flexWrap:"wrap"}}>
                            <span style={{fontWeight:700,color:"#22c55e",minWidth:28}}>{f.id||`F${i+1}`}</span>
                            {f.columnLoad&&<span style={{color:T.muted}}>P={f.columnLoad}</span>}
                            {f.soilBearing&&<span style={{color:T.muted}}>qa={f.soilBearing}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{marginTop:10,fontSize:11,color:T.muted,fontStyle:"italic"}}>
              All fields editable above. Green label = extracted from plans. Changes feed into all design calculators.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── STRUCTURAL COMPUTATION SUMMARY ──────────────────────────────────────────
function StructuralComputationSummary({ results, data, onNavigate }) {
  if (!results) return null;

  const statusColor = { PASS:"#22c55e", FAIL:"#ef4444", COMPUTED:"#0696d7", ERROR:"#f59e0b" };
  const statusBg    = { PASS:"rgba(34,197,94,0.1)", FAIL:"rgba(239,68,68,0.1)", COMPUTED:"rgba(6,150,215,0.1)", ERROR:"rgba(245,158,11,0.1)" };
  const toolLabel   = { seismic:"Seismic", beam:"Beam", column:"Column", footing:"Footing", slab:"Slab", loads:"Load Combos" };

  const fc  = data?.materials?.fc || "—";
  const fy  = data?.materials?.fy || "—";
  const projName = data?.building?.name || "Structural Project";
  const md  = results.memberData || {};

  const exportFullReport = () => {
    const w    = window.open("","_blank");
    const date = new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});

    // ── member rows
    const memberRows = results.items.map(item=>`
      <tr>
        <td><b>${toolLabel[item.tool]||item.tool}</b></td>
        <td style="font-family:monospace;font-weight:700">${item.id}</td>
        <td style="font-family:monospace">${item.value||"—"}</td>
        <td style="font-size:11px;color:#64748b">${item.detail||"—"}</td>
        <td style="color:${statusColor[item.status]||"#64748b"};font-weight:800;text-align:center">${item.status}</td>
      </tr>`).join("");

    // ── load combos
    const combosHtml = (results.loadCombos||[]).map(c=>
      `<tr><td>${c.name}</td><td style="font-weight:700;font-family:monospace">${c.val} kN/m²</td></tr>`
    ).join("");

    // ── rebar schedule tables
    const beamRows = (md.beams||[]).map(bm=>{
      const mainBar = selectBars(bm.As_req, bm.b);
      const stirrup = selectStirrups(bm.Vs_req, bm.b, bm.d, Number(fy)||414, Number(fc)||27.6);
      return `<tr>
        <td><b>${bm.id}</b></td><td>${bm.b}×${bm.d}</td><td>${bm.span||"—"}</td>
        <td>${bm.As_req.toFixed(0)}</td>
        <td style="color:#0284c7;font-weight:700">${mainBar.n}-Ø${mainBar.bar.dia}</td>
        <td>${mainBar.As_prov.toFixed(0)}</td>
        <td>Ø${stirrup.dia}@${stirrup.spacing}mm</td>
        <td style="color:${bm.status==="PASS"?"#16a34a":"#dc2626"};font-weight:700">${bm.status}</td>
      </tr>`;
    }).join("");

    const colRows = (md.columns||[]).map(col=>{
      const mainBar = selectBars(col.Ast_req, Math.min(col.b,col.h));
      const tieSpacing = Math.floor(Math.min(16*mainBar.bar.dia, 480, Math.min(col.b,col.h))/25)*25;
      return `<tr>
        <td><b>${col.id}</b></td><td>${col.b}×${col.h}</td><td>${col.type==="spiral"?"Spiral":"Tied"}</td>
        <td>${col.Ast_req.toFixed(0)}</td>
        <td style="color:#0284c7;font-weight:700">${mainBar.n}-Ø${mainBar.bar.dia}</td>
        <td>${mainBar.As_prov.toFixed(0)}</td>
        <td>Ø10@${tieSpacing}mm</td>
        <td>${(col.rho_req*100).toFixed(2)}%</td>
        <td style="color:${col.status==="PASS"?"#16a34a":"#dc2626"};font-weight:700">${col.status}</td>
      </tr>`;
    }).join("");

    const ftRows = (md.footings||[]).map(ft=>{
      const bar = selectSlabBars(ft.As/ft.B);
      return `<tr>
        <td><b>${ft.id}</b></td><td>${ft.B.toFixed(2)}×${ft.B.toFixed(2)}m</td>
        <td>${ft.d.toFixed(0)}</td><td>${ft.qa}</td>
        <td>${(ft.As/ft.B).toFixed(0)}</td>
        <td style="color:#0284c7;font-weight:700">Ø${bar.bar.dia}@${bar.spacing}mm (EW)</td>
      </tr>`;
    }).join("");

    const slabRows = (md.slabs||[]).map(sl=>{
      const bar = selectSlabBars(sl.As);
      const tmp = selectSlabBars(sl.As*0.0018/(sl.rho_use||0.002));
      return `<tr>
        <td><b>${sl.id}</b></td><td>${sl.L}m</td><td>${sl.h}mm</td>
        <td>${sl.wu.toFixed(2)}</td><td>${sl.Mu.toFixed(1)}</td>
        <td>${sl.As.toFixed(0)}</td>
        <td style="color:#0284c7;font-weight:700">Ø${bar.bar.dia}@${bar.spacing}mm</td>
        <td>Ø${tmp.bar.dia}@${tmp.spacing}mm</td>
      </tr>`;
    }).join("");

    const seismic = results.seismic || {};

    w.document.write(`<!DOCTYPE html><html><head>
      <title>Structural Summary Report — ${projName}</title>
      <style>
        *{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;padding:0;font-size:12px;color:#1e293b}
        .cover{background:linear-gradient(135deg,#0f1624,#0a1628);color:#fff;padding:50px;min-height:200px;page-break-after:always}
        .cover h1{font-size:28px;font-weight:900;color:#0696d7;margin:0 0 8px;letter-spacing:-0.5px}
        .cover p{margin:4px 0;color:#94a3b8;font-size:12px}
        .badge{display:inline-block;background:rgba(6,150,215,0.25);color:#60c6f7;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;margin-top:8px}
        .content{padding:30px 50px}
        h2{font-size:15px;font-weight:800;color:#0f172a;border-bottom:3px solid #0696d7;padding-bottom:6px;margin:28px 0 12px}
        h3{font-size:12px;font-weight:700;color:#334155;margin:14px 0 6px;text-transform:uppercase;letter-spacing:.5px}
        table{border-collapse:collapse;width:100%;margin-bottom:12px;font-size:11px}
        th{background:#1e293b;color:#e2e8f0;padding:7px 9px;text-align:left;font-weight:700;font-size:11px}
        td{border:1px solid #e2e8f0;padding:6px 9px;vertical-align:middle}
        tr:nth-child(even) td{background:#f8fafc}
        .kpi{display:flex;gap:16px;margin:12px 0;flex-wrap:wrap}
        .kpi-card{background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px 18px;min-width:120px;text-align:center}
        .kpi-val{font-size:26px;font-weight:900;color:#0284c7}
        .kpi-lbl{font-size:10px;color:#64748b;margin-top:2px;text-transform:uppercase;letter-spacing:.5px}
        .kpi-pass .kpi-val{color:#16a34a}.kpi-fail .kpi-val{color:#dc2626}.kpi-comp .kpi-val{color:#0284c7}
        .nscp{background:#f0f9ff;border-left:3px solid #0696d7;padding:8px 12px;font-size:11px;color:#0369a1;margin:8px 0;border-radius:0 4px 4px 0}
        .warn{background:#fff7ed;border-left:3px solid #f59e0b;padding:8px 12px;font-size:11px;color:#92400e;margin:8px 0;border-radius:0 4px 4px 0}
        .footer{margin-top:40px;padding:18px 50px;background:#f1f5f9;border-top:2px solid #e2e8f0;font-size:10px;color:#94a3b8;line-height:1.6}
        .sig-block{display:flex;gap:40px;margin-top:30px}
        .sig{border-top:1px solid #94a3b8;padding-top:8px;min-width:200px;font-size:11px;color:#64748b}
        @media print{.no-print{display:none}@page{margin:15mm 20mm;size:A4 portrait}}
      </style>
    </head><body>

    <div class="cover">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:10px;color:#64748b;letter-spacing:2px;margin-bottom:10px">BUILDIFY · STRUCTURAL MODULE</div>
          <h1>Structural Summary Report</h1>
          <p style="font-size:15px;color:#e2e8f0;font-weight:600;margin:4px 0 16px">${projName}</p>
          <div>
            <span class="badge">NSCP 2015</span>
            <span class="badge">f'c = ${fc} MPa</span>
            <span class="badge">fy = ${fy} MPa</span>
            ${seismic.zone ? `<span class="badge">${seismic.zone}</span>` : ""}
            ${data?.building?.floors ? `<span class="badge">${data.building.floors} Floors</span>` : ""}
          </div>
        </div>
        <div style="text-align:right;color:#64748b;font-size:11px">
          <div style="font-size:12px;color:#94a3b8">${date}</div>
          <div style="margin-top:4px">Prepared by: Buildify</div>
          <div style="margin-top:16px;color:#ef4444;font-size:10px;font-weight:700;border:1px solid #ef4444;padding:4px 8px;border-radius:4px">PRELIMINARY — NOT FOR CONSTRUCTION</div>
        </div>
      </div>
    </div>

    <div class="content">

      <!-- SUMMARY SCORECARD -->
      <h2>1. Computation Summary</h2>
      <div class="kpi">
        <div class="kpi-card kpi-pass"><div class="kpi-val">${results.summary.pass}</div><div class="kpi-lbl">PASS</div></div>
        <div class="kpi-card kpi-fail"><div class="kpi-val">${results.summary.fail}</div><div class="kpi-lbl">FAIL</div></div>
        <div class="kpi-card kpi-comp"><div class="kpi-val">${results.summary.computed}</div><div class="kpi-lbl">COMPUTED</div></div>
        <div class="kpi-card"><div class="kpi-val">${results.summary.total}</div><div class="kpi-lbl">TOTAL CHECKS</div></div>
      </div>
      <table><thead><tr><th>Category</th><th>Member ID</th><th>Result</th><th>Detail</th><th style="text-align:center">Status</th></tr></thead><tbody>
        ${memberRows}
      </tbody></table>

      <!-- SEISMIC -->
      ${seismic.V ? `
      <h2>2. Seismic Design (NSCP 2015 Sec. 208)</h2>
      <div class="nscp">Method: Equivalent Static Force Procedure · NSCP 2015 Section 208</div>
      <table><thead><tr><th>Parameter</th><th>Value</th><th>Parameter</th><th>Value</th></tr></thead><tbody>
        <tr><td>Seismic Zone</td><td><b>${seismic.zone}</b></td><td>Seismic Weight W</td><td><b>${seismic.W} kN</b></td></tr>
        <tr><td>Soil Type</td><td>${seismic.soil||"—"}</td><td>Base Shear V</td><td><b style="color:#0284c7">${seismic.V} kN</b></td></tr>
        <tr><td>Occupancy Category</td><td>${seismic.occ||"—"}</td><td>Seismic Coefficient Cs</td><td>${seismic.Cs}%</td></tr>
        <tr><td>I (Importance Factor)</td><td>${seismic.I||"—"}</td><td>R (Response Factor)</td><td>${seismic.R||"—"}</td></tr>
        <tr><td>Ca</td><td>${seismic.Ca?.toFixed(4)||"—"}</td><td>Cv</td><td>${seismic.Cv?.toFixed(4)||"—"}</td></tr>
      </tbody></table>` : ""}

      <!-- LOAD COMBINATIONS -->
      ${combosHtml ? `
      <h2>3. Load Combinations (NSCP 2015 Sec. 203)</h2>
      <div class="nscp">Per NSCP 2015 Section 203 — factored load combinations for RC design</div>
      <table style="max-width:400px"><thead><tr><th>Combination</th><th>Value (kN/m²)</th></tr></thead><tbody>
        ${combosHtml}
      </tbody></table>` : ""}

      <!-- BEAM SCHEDULE -->
      ${beamRows ? `
      <h2>4. Beam Rebar Schedule (NSCP 2015 Sec. 406)</h2>
      <div class="nscp">Cover = 40mm · Stirrups: deformed bars · Spacing per NSCP Sec. 406.4</div>
      <table><thead><tr><th>Mark</th><th>b×d (mm)</th><th>Span (m)</th><th>As req (mm²)</th><th>Bottom Bars</th><th>As prov (mm²)</th><th>Stirrups</th><th style="text-align:center">Status</th></tr></thead><tbody>
        ${beamRows}
      </tbody></table>
      <div class="warn">Top bars: provide min. 2-Ø10 or as required by moment diagram. Verify development lengths per Sec. 412.</div>` : ""}

      <!-- COLUMN SCHEDULE -->
      ${colRows ? `
      <h2>5. Column Rebar Schedule (NSCP 2015 Sec. 410)</h2>
      <div class="nscp">Short column, axial + bending · φ = 0.65 tied, 0.75 spiral · ρ: 1% to 8%</div>
      <table><thead><tr><th>Mark</th><th>b×h (mm)</th><th>Type</th><th>Ast req (mm²)</th><th>Long. Bars</th><th>As prov (mm²)</th><th>Ties</th><th>ρ (%)</th><th style="text-align:center">Status</th></tr></thead><tbody>
        ${colRows}
      </tbody></table>` : ""}

      <!-- FOOTING SCHEDULE -->
      ${ftRows ? `
      <h2>6. Footing Schedule (NSCP 2015 Sec. 415)</h2>
      <div class="nscp">Square isolated footing · ρ_min = 0.0018 · Bars placed EW (bottom mat)</div>
      <table><thead><tr><th>Mark</th><th>Plan Size</th><th>d (mm)</th><th>qa (kPa)</th><th>As req (mm²/m)</th><th>Bottom Bars (EW)</th></tr></thead><tbody>
        ${ftRows}
      </tbody></table>
      <div class="warn">Verify punching shear (two-way action) and wide-beam shear at d from column face. Dowel bars: min. 4-Ø of column bars.</div>` : ""}

      <!-- SLAB SCHEDULE -->
      ${slabRows ? `
      <h2>7. Slab Schedule (NSCP 2015 Sec. 409)</h2>
      <div class="nscp">One-way slab · ρ_temp = 0.0018 · Temperature bars perpendicular to span</div>
      <table><thead><tr><th>Mark</th><th>Span (m)</th><th>h (mm)</th><th>wu (kPa)</th><th>Mu (kN·m/m)</th><th>As req (mm²/m)</th><th>Main Bars</th><th>Temp. Bars</th></tr></thead><tbody>
        ${slabRows}
      </tbody></table>` : ""}

      <!-- SIGNATURE BLOCK -->
      <h2>8. Engineer's Certification</h2>
      <div class="warn">This report is generated by Buildify AI-assisted structural tools using simplified NSCP 2015 procedures. It is a <strong>PRELIMINARY DESIGN</strong> only. All computations, bar sizes, and spacings must be independently verified and signed and sealed by a licensed Professional Civil/Structural Engineer (PSCE) registered with PRC before being used in permit applications, contract documents, or construction.</div>
      <div class="sig-block">
        <div class="sig"><div style="margin-bottom:40px">Reviewed by:</div><div>________________________</div><div>Professional Civil/Structural Engineer</div><div>PRC License No.: ____________</div><div>Date: ______________________</div></div>
        <div class="sig"><div style="margin-bottom:40px">Noted by:</div><div>________________________</div><div>Project Owner / Representative</div><div>Date: ______________________</div></div>
      </div>

    </div>
    <div class="footer">
      <strong>⚠ PRELIMINARY — NOT FOR CONSTRUCTION.</strong> Buildify Structural Module · NSCP 2015 · Generated: ${date}<br/>
      Bar sizes per ASTM A615 / PNS 49. Methods: Equivalent Static Force (Sec. 208), USD flexure &amp; shear (Sec. 406, 410, 415, 409). All values require PSCE verification.
    </div>
    </body></html>`);
    w.document.close();
    setTimeout(()=>w.print(),600);
  };

  return (
    <div style={{background:"rgba(6,150,215,0.04)",border:"1.5px solid rgba(6,150,215,0.2)",borderRadius:14,padding:20,marginBottom:20,animation:"fadeIn 0.35s ease"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontWeight:800,fontSize:15,color:T.text}}>Structural Computation Package</div>
          <div style={{fontSize:11,color:T.muted,marginTop:2}}>NSCP 2015 · {new Date().toLocaleDateString("en-PH")} · {(data?.materials?.fc ? `f'c=${data.materials.fc}MPa · fy=${data.materials.fy}MPa` : "")}</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {[
              {label:`${results.summary.pass} PASS`, color:"#22c55e", bg:"rgba(34,197,94,0.1)"},
              {label:`${results.summary.fail} FAIL`, color:"#ef4444", bg:"rgba(239,68,68,0.1)"},
              {label:`${results.summary.computed} COMPUTED`, color:"#0696d7", bg:"rgba(6,150,215,0.1)"},
            ].map(s=>(
              <span key={s.label} style={{fontSize:11,fontWeight:700,color:s.color,background:s.bg,padding:"4px 10px",borderRadius:6}}>{s.label}</span>
            ))}
          </div>
          <button onClick={exportFullReport}
            style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",background:"linear-gradient(135deg,#0696d7,#0569a8)",border:"none",color:"#fff",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12}}>
            <Icon name="download" size={13} color="#fff"/> Export Full Report
          </button>
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {results.items.map((item,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:statusBg[item.status]||T.dim,borderRadius:9,border:`1px solid ${statusColor[item.status]||T.border}33`}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:statusColor[item.status]||T.muted,flexShrink:0}}/>
            <div style={{width:80,flexShrink:0}}>
              <span style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase"}}>{toolLabel[item.tool]||item.tool}</span>
            </div>
            <div style={{width:70,flexShrink:0}}>
              <span style={{fontSize:12,fontWeight:700,color:T.text,fontFamily:"monospace"}}>{item.id}</span>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <span style={{fontSize:12,color:T.text,fontWeight:600}}>{item.value||"—"}</span>
              {item.detail && <span style={{fontSize:11,color:T.muted,marginLeft:8}}>{item.detail}</span>}
              {item.error  && <span style={{fontSize:11,color:"#f59e0b",marginLeft:8}}>⚠ {item.error}</span>}
            </div>
            <span style={{fontSize:11,fontWeight:800,color:statusColor[item.status],background:statusBg[item.status],padding:"3px 10px",borderRadius:5,flexShrink:0}}>{item.status}</span>
            {onNavigate && item.tool !== "loads" && (
              <button onClick={()=>onNavigate(item.tool)}
                style={{fontSize:10,color:"#0696d7",background:"rgba(6,150,215,0.1)",border:"1px solid rgba(6,150,215,0.25)",borderRadius:5,padding:"3px 10px",cursor:"pointer",fontWeight:700,flexShrink:0}}>Open →</button>
            )}
          </div>
        ))}
      </div>

      <div style={{marginTop:14,padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>
        ⚠️ All computations use simplified NSCP 2015 methods. Results are for preliminary design only. Full detailed analysis and stamping by a licensed PSCE is required before construction.
      </div>
    </div>
  );
}


function RebarSchedule({ structuralData, structuralResults }) {
  const sd  = structuralData;
  const res = structuralResults;
  const [view, setView] = useState("beams"); // beams|columns|footings|slabs

  if (!res || !sd) {
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:60,gap:16,textAlign:"center"}}>
        <Icon name="report" size={48} color={T.muted}/>
        <div style={{fontSize:15,fontWeight:700,color:T.text}}>No Computations Yet</div>
        <div style={{fontSize:13,color:T.muted,maxWidth:340,lineHeight:1.7}}>
          Run <strong style={{color:"#0696d7"}}>Run All Computations</strong> inside the AI Plan Checker first.<br/>
          The rebar schedule is generated from those results.
        </div>
      </div>
    );
  }

  const fc = sd.materials?.fc || 27.6;
  const fy = sd.materials?.fy || 414;
  const md = res.memberData || {};

  // ── BEAM SCHEDULE ──
  const beamRows = (md.beams||[]).map(bm => {
    const mainBar   = selectBars(bm.As_req, bm.b);
    const topBar    = selectBars(Math.max(bm.As_req*0.33, 2*PH_BAR_SIZES[1].area), bm.b);
    const stirrup   = selectStirrups(bm.Vs_req, bm.b, bm.d, fy, fc);
    const coverH    = bm.d + 25 + 10 + mainBar.bar.dia/2; // total depth approx
    return { ...bm, mainBar, topBar, stirrup, totalDepth: Math.round(coverH/10)*10 + 50 };
  });

  // ── COLUMN SCHEDULE ──
  const colRows = (md.columns||[]).map(col => {
    const mainBar = selectBars(col.Ast_req, Math.min(col.b, col.h));
    // Ties: NSCP 408.3 — s ≤ 16db, 48 tie-dia, least dim of section
    const tieBar  = { dia:10 };
    const tieSpacing = Math.min(16*mainBar.bar.dia, 48*tieBar.dia, Math.min(col.b,col.h));
    return { ...col, mainBar, tieBar, tieSpacing: Math.floor(tieSpacing/25)*25 };
  });

  // ── FOOTING SCHEDULE ──
  const ftRows = (md.footings||[]).map(ft => {
    const bar = selectSlabBars(ft.As / ft.B);
    return { ...ft, bar };
  });

  // ── SLAB SCHEDULE ──
  const slabRows = (md.slabs||[]).map(sl => {
    const bar = selectSlabBars(sl.As);
    const tempBar = selectSlabBars(sl.As * 0.0018 / (sl.rho_use || 0.0018));
    return { ...sl, bar, tempBar };
  });

  const TABS = [
    { key:"beams",    label:"Beams",    count:beamRows.length },
    { key:"columns",  label:"Columns",  count:colRows.length },
    { key:"footings", label:"Footings", count:ftRows.length },
    { key:"slabs",    label:"Slabs",    count:slabRows.length },
  ];

  const BarTag = ({dia, n, label}) => (
    <span style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:"#0696d7",background:"rgba(6,150,215,0.1)",padding:"2px 8px",borderRadius:4}}>
      {n ? `${n}-Ø${dia}` : `Ø${dia}`}{label?` @ ${label}mm`:""}
    </span>
  );

  const exportSchedule = () => {
    const w = window.open("","_blank");
    const date = new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});
    const projName = sd.building?.name || "Project";

    const beamTable = `<table><thead><tr>
      <th>Mark</th><th>b×d (mm)</th><th>Span (m)</th>
      <th>As req (mm²)</th><th>Top Bars</th><th>Bot. Bars</th><th>As prov (mm²)</th>
      <th>Stirrups</th><th>Remarks</th></tr></thead><tbody>
      ${beamRows.map(r=>`<tr>
        <td><b>${r.id}</b></td>
        <td>${r.b}×${r.d}</td>
        <td>${(r.span||"—")}</td>
        <td>${r.As_req.toFixed(0)}</td>
        <td>${r.topBar.n}-Ø${r.topBar.bar.dia}</td>
        <td>${r.mainBar.n}-Ø${r.mainBar.bar.dia}</td>
        <td style="color:#0284c7;font-weight:700">${r.mainBar.As_prov.toFixed(0)}</td>
        <td>Ø${r.stirrup.dia}@${r.stirrup.spacing}mm</td>
        <td style="font-size:11px;color:#64748b">${r.status_flex==="PASS"?"OK":"CHECK"} flex · ${r.status_shear}</td>
      </tr>`).join("")}
    </tbody></table>`;

    const colTable = `<table><thead><tr>
      <th>Mark</th><th>b×h (mm)</th><th>Type</th>
      <th>Ast req (mm²)</th><th>Main Bars</th><th>As prov (mm²)</th>
      <th>ρ (%)</th><th>Ties</th><th>φPn (kN)</th></tr></thead><tbody>
      ${colRows.map(r=>`<tr>
        <td><b>${r.id}</b></td>
        <td>${r.b}×${r.h}</td>
        <td>${r.type==="spiral"?"Spiral":"Tied"}</td>
        <td>${r.Ast_req.toFixed(0)}</td>
        <td>${r.mainBar.n}-Ø${r.mainBar.bar.dia}</td>
        <td style="color:#0284c7;font-weight:700">${r.mainBar.As_prov.toFixed(0)}</td>
        <td>${(r.rho_req*100).toFixed(2)}%</td>
        <td>Ø${r.tieBar.dia}@${r.tieSpacing}mm</td>
        <td>${r.phiPn.toFixed(0)}</td>
      </tr>`).join("")}
    </tbody></table>`;

    const ftTable = `<table><thead><tr>
      <th>Mark</th><th>Size (m)</th><th>Depth d (mm)</th>
      <th>As req (mm²/m)</th><th>Bars (Bot. EW)</th><th>Spacing</th><th>As prov (mm²/m)</th>
      <th>qa (kPa)</th></tr></thead><tbody>
      ${ftRows.map(r=>`<tr>
        <td><b>${r.id}</b></td>
        <td>${r.B.toFixed(2)}×${r.B.toFixed(2)}</td>
        <td>${r.d.toFixed(0)}</td>
        <td>${(r.As/r.B).toFixed(0)}</td>
        <td>Ø${r.bar.bar.dia}</td>
        <td>${r.bar.spacing}mm c/c</td>
        <td style="color:#0284c7;font-weight:700">${r.bar.As_prov.toFixed(0)}</td>
        <td>${r.qa}</td>
      </tr>`).join("")}
    </tbody></table>`;

    const slabTable = `<table><thead><tr>
      <th>Mark</th><th>Span (m)</th><th>h (mm)</th><th>d (mm)</th>
      <th>wu (kPa)</th><th>Mu (kN·m/m)</th>
      <th>As req (mm²/m)</th><th>Main Bars</th><th>Temp. Bars</th></tr></thead><tbody>
      ${slabRows.map(r=>`<tr>
        <td><b>${r.id}</b></td>
        <td>${r.L}</td>
        <td>${r.h}</td>
        <td>${r.d}</td>
        <td>${r.wu.toFixed(2)}</td>
        <td>${r.Mu.toFixed(1)}</td>
        <td>${r.As.toFixed(0)}</td>
        <td style="color:#0284c7;font-weight:700">Ø${r.bar.bar.dia}@${r.bar.spacing}mm</td>
        <td>Ø${r.tempBar.bar.dia}@${r.tempBar.spacing}mm</td>
      </tr>`).join("")}
    </tbody></table>`;

    w.document.write(`<!DOCTYPE html><html><head>
      <title>Rebar Schedule — ${projName}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;margin:0;padding:0;font-size:12px;color:#1e293b}
        .cover{background:#0f1624;color:#fff;padding:40px 50px;min-height:160px}
        .cover h1{font-size:24px;font-weight:900;color:#0696d7;margin:0 0 6px}
        .cover p{margin:4px 0;color:#94a3b8;font-size:12px}
        .badge{display:inline-block;background:rgba(6,150,215,0.2);color:#60c6f7;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;margin-right:8px}
        .content{padding:24px 40px}
        h2{font-size:15px;font-weight:800;color:#0f172a;border-bottom:2px solid #0696d7;padding-bottom:6px;margin-top:28px}
        h3{font-size:12px;font-weight:700;color:#475569;margin:14px 0 6px}
        table{border-collapse:collapse;width:100%;margin-bottom:12px;font-size:11px}
        th{background:#1e293b;color:#e2e8f0;padding:7px 8px;text-align:left;font-weight:700}
        td{border:1px solid #e2e8f0;padding:6px 8px;vertical-align:top}
        tr:nth-child(even) td{background:#f8fafc}
        .nscp{background:#f0f9ff;border-left:3px solid #0696d7;padding:8px 12px;font-size:11px;color:#0369a1;margin:8px 0}
        .warn{background:#fff7ed;border-left:3px solid #f59e0b;padding:8px 12px;font-size:11px;color:#92400e;margin:8px 0}
        .footer{margin-top:30px;padding:16px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8}
        @media print{.no-print{display:none}@page{margin:15mm 20mm}}
      </style>
    </head><body>
      <div class="cover">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:11px;color:#64748b;margin-bottom:6px;letter-spacing:1px">BUILDIFY · STRUCTURAL MODULE</div>
            <h1>Rebar Schedule</h1>
            <p>${projName}</p>
            <p style="margin-top:10px">
              <span class="badge">NSCP 2015</span>
              <span class="badge">f'c = ${fc} MPa</span>
              <span class="badge">fy = ${fy} MPa</span>
            </p>
          </div>
          <div style="text-align:right;color:#64748b;font-size:11px">
            <div>${date}</div>
            <div style="margin-top:4px">Prepared by: Buildify</div>
            <div style="margin-top:4px;color:#ef4444;font-size:10px">PRELIMINARY — NOT FOR CONSTRUCTION</div>
          </div>
        </div>
      </div>
      <div class="content">

        <h2>1. Beam Rebar Schedule</h2>
        <div class="nscp">NSCP 2015 Sec. 406 · ACI 318-14 · Cover: 40mm clear · Stirrups: Ø10 or Ø12 deformed</div>
        ${beamTable}
        <div class="warn">Top bars: min. 1/3 of bottom steel or as required by moment diagram. Provide development length per NSCP Sec. 412.</div>

        <h2>2. Column Rebar Schedule</h2>
        <div class="nscp">NSCP 2015 Sec. 410 · Tie spacing: min of 16db, 48 tie-dia, least column dim</div>
        ${colTable}

        <h2>3. Footing Rebar Schedule</h2>
        <div class="nscp">NSCP 2015 Sec. 415 · ρ_min = 0.0018 · Bars placed EW (both directions, bottom mat)</div>
        ${ftTable}
        <div class="warn">Development length of dowels from column into footing: ℓd ≥ 300mm per NSCP Sec. 412.</div>

        <h2>4. Slab Rebar Schedule</h2>
        <div class="nscp">NSCP 2015 Sec. 409 · ρ_temp = 0.0018 for temperature & shrinkage bars · Ø10 or Ø12 top bars perpendicular to span</div>
        ${slabTable}

      </div>
      <div class="footer">
        <strong>⚠ PRELIMINARY DESIGN — FOR REVIEW ONLY.</strong> This rebar schedule was generated by Buildify using simplified NSCP 2015 methods. Bar sizes, counts, and spacing must be verified and stamped by a licensed Professional Civil/Structural Engineer (PSCE) before use in contract documents or construction. Buildify and its developers accept no liability for the use of these outputs.
        <div style="margin-top:4px">Generated: ${date} · Buildify Structural Module · NSCP 2015</div>
      </div>
    </body></html>`);
    w.document.close();
    setTimeout(()=>w.print(),500);
  };

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:18,fontWeight:900,color:T.text,letterSpacing:"-0.5px"}}>Rebar Schedule</div>
          <div style={{fontSize:12,color:T.muted,marginTop:2}}>
            NSCP 2015 · f'c = {fc} MPa · fy = {fy} MPa · {sd.building?.name || "Project"}
          </div>
        </div>
        <button onClick={exportSchedule}
          style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",background:"linear-gradient(135deg,#0696d7,#0569a8)",border:"none",color:"#fff",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13}}>
          <Icon name="download" size={15} color="#fff"/> Export PDF Schedule
        </button>
      </div>

      {/* Scope note */}
      <div style={{padding:"10px 16px",background:"rgba(6,150,215,0.06)",border:"1px solid rgba(6,150,215,0.2)",borderRadius:8,marginBottom:20,fontSize:12,color:"#0696d7",lineHeight:1.7}}>
        Bar sizes selected per <strong>ASTM A615 / PNS 49</strong> standard PH deformed bars. Spacing governed by <strong>NSCP 2015</strong> min/max limits and practical constructability.
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:20,borderBottom:`1px solid ${T.border}`,paddingBottom:12}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setView(t.key)}
            style={{padding:"8px 16px",borderRadius:8,border:`1.5px solid ${view===t.key?"#0696d7":T.border}`,
              background:view===t.key?"rgba(6,150,215,0.12)":"transparent",
              color:view===t.key?"#0696d7":T.muted,cursor:"pointer",fontSize:13,fontWeight:700,transition:"all 0.15s"}}>
            {t.label} <span style={{fontSize:10,marginLeft:4,opacity:0.7}}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* ── BEAMS ── */}
      {view==="beams" && (
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px"}}>NSCP 2015 Sec. 406 — Singly Reinforced Beams</div>
          {beamRows.length === 0 ? (
            <div style={{padding:40,textAlign:"center",color:T.muted}}>No beam data. Run computations first.</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {beamRows.map((bm,i)=>(
                <div key={i} style={{background:T.card,border:`1px solid ${bm.status==="PASS"?"rgba(34,197,94,0.25)":"rgba(239,68,68,0.25)"}`,borderRadius:12,padding:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
                    <div style={{fontWeight:900,fontSize:16,color:T.text,minWidth:40}}>{bm.id}</div>
                    <span style={{fontSize:11,fontWeight:700,background:T.dim,color:T.muted,padding:"3px 8px",borderRadius:4}}>
                      {bm.b} × {bm.d} mm
                    </span>
                    {bm.span && <span style={{fontSize:11,color:T.muted}}>L = {bm.span}m</span>}
                    <span style={{fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:5,
                      background:bm.status==="PASS"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",
                      color:bm.status==="PASS"?"#22c55e":"#ef4444"}}>{bm.status}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
                    {/* Bottom bars */}
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Bottom (Tension) Bars</div>
                      <BarTag dia={bm.mainBar.bar.dia} n={bm.mainBar.n}/>
                      <div style={{fontSize:11,color:T.muted,marginTop:6}}>
                        As req: <strong style={{color:T.text}}>{bm.As_req.toFixed(0)}</strong> mm²<br/>
                        As prov: <strong style={{color:"#0696d7"}}>{bm.mainBar.As_prov.toFixed(0)}</strong> mm²
                        {bm.mainBar.As_prov >= bm.As_req
                          ? <span style={{color:"#22c55e",marginLeft:4}}>✓ OK</span>
                          : <span style={{color:"#ef4444",marginLeft:4}}>✗ Insufficient</span>}
                      </div>
                    </div>
                    {/* Top bars */}
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Top (Compression) Bars</div>
                      <BarTag dia={bm.topBar.bar.dia} n={bm.topBar.n}/>
                      <div style={{fontSize:11,color:T.muted,marginTop:6}}>Min. 1/3 of bottom steel<br/>per NSCP Sec. 412</div>
                    </div>
                    {/* Stirrups */}
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Stirrups (Shear)</div>
                      <BarTag dia={bm.stirrup.dia} label={bm.stirrup.spacing}/>
                      <div style={{fontSize:11,color:T.muted,marginTop:6}}>
                        Vc = {bm.Vc.toFixed(1)} kN · Vs = {bm.Vs_req.toFixed(1)} kN<br/>
                        {bm.status_shear}
                        {bm.stirrup.note && <div style={{color:"#f59e0b"}}>{bm.stirrup.note}</div>}
                      </div>
                    </div>
                    {/* Section summary */}
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Design Values</div>
                      <div style={{fontSize:11,color:T.muted,lineHeight:1.8}}>
                        ρ req: <strong style={{color:T.text}}>{(bm.rho_req*100).toFixed(4)}%</strong><br/>
                        ρ min: {(bm.rho_min*100).toFixed(4)}%<br/>
                        ρ max: {(bm.rho_max*100).toFixed(4)}%<br/>
                        Flexure: <strong style={{color:bm.status_flex==="PASS"?"#22c55e":"#ef4444"}}>{bm.status_flex}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── COLUMNS ── */}
      {view==="columns" && (
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px"}}>NSCP 2015 Sec. 410 — RC Columns</div>
          {colRows.length === 0 ? (
            <div style={{padding:40,textAlign:"center",color:T.muted}}>No column data. Run computations first.</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {colRows.map((col,i)=>(
                <div key={i} style={{background:T.card,border:`1px solid ${col.status==="PASS"?"rgba(34,197,94,0.25)":"rgba(239,68,68,0.25)"}`,borderRadius:12,padding:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
                    <div style={{fontWeight:900,fontSize:16,color:T.text,minWidth:40}}>{col.id}</div>
                    <span style={{fontSize:11,fontWeight:700,background:T.dim,color:T.muted,padding:"3px 8px",borderRadius:4}}>{col.b}×{col.h} mm</span>
                    <span style={{fontSize:11,color:T.muted}}>{col.type==="spiral"?"Spiral":"Tied"}</span>
                    <span style={{fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:5,
                      background:col.status==="PASS"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",
                      color:col.status==="PASS"?"#22c55e":"#ef4444"}}>{col.status}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Longitudinal Bars</div>
                      <BarTag dia={col.mainBar.bar.dia} n={col.mainBar.n}/>
                      <div style={{fontSize:11,color:T.muted,marginTop:6}}>
                        Ast req: <strong style={{color:T.text}}>{col.Ast_req.toFixed(0)}</strong> mm²<br/>
                        Ast prov: <strong style={{color:"#0696d7"}}>{col.mainBar.As_prov.toFixed(0)}</strong> mm²
                        {col.mainBar.As_prov >= col.Ast_req
                          ? <span style={{color:"#22c55e",marginLeft:4}}>✓</span>
                          : <span style={{color:"#ef4444",marginLeft:4}}>✗</span>}
                      </div>
                    </div>
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Lateral Ties</div>
                      <BarTag dia={col.tieBar.dia} label={col.tieSpacing}/>
                      <div style={{fontSize:11,color:T.muted,marginTop:6}}>
                        s ≤ min(16db, 48t, b_min)<br/>= min({16*col.mainBar.bar.dia}, {48*col.tieBar.dia}, {Math.min(col.b,col.h)}) = {col.tieSpacing}mm
                      </div>
                    </div>
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Capacity</div>
                      <div style={{fontSize:11,color:T.muted,lineHeight:1.8}}>
                        ρ: <strong style={{color:T.text}}>{(col.rho_req*100).toFixed(2)}%</strong> (min 1%, max 8%)<br/>
                        φPn: <strong style={{color:"#0696d7"}}>{col.phiPn.toFixed(0)} kN</strong><br/>
                        Pu: {col.Pu} kN · φ = {col.phi}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FOOTINGS ── */}
      {view==="footings" && (
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px"}}>NSCP 2015 Sec. 415 — Isolated Square Footings · ρ_min = 0.0018</div>
          {ftRows.length === 0 ? (
            <div style={{padding:40,textAlign:"center",color:T.muted}}>No footing data. Run computations first.</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {ftRows.map((ft,i)=>(
                <div key={i} style={{background:T.card,border:"1px solid rgba(34,197,94,0.25)",borderRadius:12,padding:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
                    <div style={{fontWeight:900,fontSize:16,color:T.text,minWidth:40}}>{ft.id}</div>
                    <span style={{fontSize:11,fontWeight:700,background:T.dim,color:T.muted,padding:"3px 8px",borderRadius:4}}>
                      {ft.B.toFixed(2)}m × {ft.B.toFixed(2)}m × d={ft.d.toFixed(0)}mm
                    </span>
                    <span style={{fontSize:11,color:T.muted}}>qa = {ft.qa} kPa</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Bottom Reinf. (Both Directions)</div>
                      <BarTag dia={ft.bar.bar.dia} label={ft.bar.spacing}/>
                      <div style={{fontSize:11,color:T.muted,marginTop:6}}>
                        As req: <strong style={{color:T.text}}>{(ft.As/ft.B).toFixed(0)}</strong> mm²/m<br/>
                        As prov: <strong style={{color:"#0696d7"}}>{ft.bar.As_prov.toFixed(0)}</strong> mm²/m
                      </div>
                    </div>
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Design Values</div>
                      <div style={{fontSize:11,color:T.muted,lineHeight:1.8}}>
                        qnet: {ft.qnet.toFixed(1)} kPa · qu: {ft.qu.toFixed(2)} kPa<br/>
                        Mu: {ft.Mu_ft.toFixed(1)} kN·m · ρ: {(ft.rho_use*100).toFixed(4)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SLABS ── */}
      {view==="slabs" && (
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px"}}>NSCP 2015 Sec. 409 — One-Way Slabs · ρ_temp = 0.0018</div>
          {slabRows.length === 0 ? (
            <div style={{padding:40,textAlign:"center",color:T.muted}}>No slab data. Run computations first.</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {slabRows.map((sl,i)=>(
                <div key={i} style={{background:T.card,border:"1px solid rgba(34,197,94,0.25)",borderRadius:12,padding:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
                    <div style={{fontWeight:900,fontSize:16,color:T.text,minWidth:40}}>{sl.id}</div>
                    <span style={{fontSize:11,fontWeight:700,background:T.dim,color:T.muted,padding:"3px 8px",borderRadius:4}}>
                      h={sl.h}mm · d={sl.d}mm · L={sl.L}m
                    </span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Main Bars (Along Span)</div>
                      <BarTag dia={sl.bar.bar.dia} label={sl.bar.spacing}/>
                      <div style={{fontSize:11,color:T.muted,marginTop:6}}>
                        As req: <strong style={{color:T.text}}>{sl.As.toFixed(0)}</strong> mm²/m<br/>
                        As prov: <strong style={{color:"#0696d7"}}>{sl.bar.As_prov.toFixed(0)}</strong> mm²/m
                      </div>
                    </div>
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Temp. & Shrinkage Bars</div>
                      <BarTag dia={sl.tempBar.bar.dia} label={sl.tempBar.spacing}/>
                      <div style={{fontSize:11,color:T.muted,marginTop:6}}>
                        Perpendicular to span<br/>ρ_temp = 0.0018
                      </div>
                    </div>
                    <div style={{background:T.dim,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Loading</div>
                      <div style={{fontSize:11,color:T.muted,lineHeight:1.8}}>
                        DL: {sl.wDL} kPa · LL: {sl.wLL} kPa<br/>
                        wu: {sl.wu.toFixed(2)} kPa · Mu: {sl.Mu.toFixed(1)} kN·m/m
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{marginTop:20,padding:"10px 16px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>
        ⚠️ Bar sizes selected per NSCP 2015 / ASTM A615 / PNS 49 standard PH deformed bars. Verify development lengths (Sec. 412), lap splices, hooks, and seismic detailing (Sec. 421) per full design. All schedules must be stamped by a licensed PSCE before construction.
      </div>
    </div>
  );
}


function StructiCode({ apiKey, initialTool, sessionTick=0 }) {
  // ── Top-level 3 tools ──
  const [tab, setTab] = useState("checker");
  useEffect(()=>{ if(initialTool==="bom") setTab("bom"); else if(initialTool==="estimate") setTab("estimate"); },[initialTool]);

  // ── Structural data (lives here, never lost on tool switch) ──
  const [structuralData, setStructuralData]       = useState(null);
  // ── Plan Checker results — lifted here so they survive sub-tool navigation ──
  const [checkerResult,     setCheckerResult]     = useState(null);
  const [checkerExtracted,  setCheckerExtracted]  = useState(null);
  const [structuralResults, setStructuralResults] = useState(null);
  const [runState,          setRunState]          = useState(null);
  const [bomResult,         setBomResult]         = useState(null);
  const [estimateResult,    setEstimateResult]    = useState(null);

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
      if (s.bomResult?.summary)         setBomResult(s.bomResult);
      if (s.estimateResult?.summary)    setEstimateResult(s.estimateResult);
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
      if (s.bomResult?.summary)         setBomResult(s.bomResult);
      if (s.estimateResult?.summary)    setEstimateResult(s.estimateResult);
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
    if (key==="beam")    return !!(structuralData.beams?.length&&structuralData.materials?.fc);
    if (key==="column")  return !!(structuralData.columns?.length&&structuralData.materials?.fc);
    if (key==="footing") return !!(structuralData.footings?.length);
    if (key==="slab")    return !!(structuralData.slabs?.length&&structuralData.materials?.fc);
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
    { key:"bom",      icon:"bom",      label:"BOM Review",      badge:"⭐" },
    { key:"checker",  icon:"checker",  label:"AI Plan Checker"             },
    { key:"estimate", icon:"estimate", label:"Cost Estimator",   badge:"NEW" },
  ];

  const SubToolStatus = ({ toolKey }) => {
    const items = getResult(toolKey);
    const hasDat = hasData(toolKey);
    if (items && items.length > 0) {
      const allPass  = items.every(i=>i.status==="PASS"||i.status==="COMPUTED");
      const anyFail  = items.some(i=>i.status==="FAIL");
      return (
        <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:8,
          background: anyFail?"rgba(239,68,68,0.12)":allPass?"rgba(34,197,94,0.12)":"rgba(6,150,215,0.12)",
          color:      anyFail?"#ef4444":allPass?"#22c55e":"#0696d7",
          border:`1px solid ${anyFail?"rgba(239,68,68,0.25)":allPass?"rgba(34,197,94,0.25)":"rgba(6,150,215,0.25)"}`
        }}>
          {anyFail?"✗ FAIL":allPass?"✓ PASS":"✓"}
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
    setBomResult(null);
    setEstimateResult(null);
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
        {(checkerResult || bomResult || estimateResult) && (
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

      {/* ── BOM Review ── */}
      {tab==="bom" && <BOMReview apiKey={apiKey}/>}

      {/* ── Cost Estimator ── */}
      {tab==="estimate" && <CostEstimator apiKey={apiKey}/>}

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
              onResultChange={setCheckerResult}
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

              {subTool==="seismic" && <SeismicCalc   structuralData={structuralData}/>}
              {subTool==="beam"    && <BeamDesign     structuralData={structuralData}/>}
              {subTool==="column"  && <ColumnDesign   structuralData={structuralData}/>}
              {subTool==="footing" && <FootingDesign  structuralData={structuralData}/>}
              {subTool==="slab"    && <SlabDesign     structuralData={structuralData}/>}
              {subTool==="loads"   && <LoadCombinations structuralData={structuralData}/>}
              {subTool==="rebar"   && <RebarSchedule  structuralData={structuralData} structuralResults={structuralResults}/>}
            </div>
          )}

          {/* Design calc launcher — visible on Plan Analysis view only, after analysis */}
          {subTool===null && checkerResult && (
            <div style={{marginTop:16,padding:"12px 16px",background:T.card,borderRadius:10,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px"}}>Open Design Calculator</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {SUB_TOOLS.map(t=>(
                  <button key={t.key} onClick={()=>setSubTool(t.key)}
                    style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:8,
                      border:`1.5px solid ${hasData(t.key)?"rgba(34,197,94,0.35)":T.border}`,
                      background:hasData(t.key)?"rgba(34,197,94,0.06)":"transparent",
                      color:hasData(t.key)?"#22c55e":T.muted,cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.15s"}}>
                    <Icon name={t.icon} size={13} color={hasData(t.key)?"#22c55e":T.muted}/>
                    <span>{t.label}</span>
                    {hasData(t.key) && <span style={{fontSize:9,background:"rgba(34,197,94,0.15)",color:"#22c55e",padding:"1px 5px",borderRadius:3,fontWeight:800}}>DATA</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Sub-tool breadcrumb header
function SubToolHeader({ tool, onBack, hasData }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,padding:"10px 16px",background:T.card,borderRadius:10,border:`1px solid ${T.border}`}}>
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,color:T.muted,cursor:"pointer",fontSize:12,fontWeight:600,transition:"all 0.15s"}}>
        ← Plan Analysis
      </button>
      <div style={{width:1,height:20,background:T.border}}/>
      <Icon name={tool.icon} size={16} color="#0696d7"/>
      <div>
        <div style={{fontSize:14,fontWeight:800,color:T.text}}>{tool.label}</div>
        <div style={{fontSize:11,color:T.muted}}>{tool.code}</div>
      </div>
      {hasData && (
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#22c55e",fontWeight:700}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>
          Pre-filled from plans
        </div>
      )}
    </div>
  );
}


// ─── SANICODE DATA ────────────────────────────────────────────────────────────
const SC = "#06b6d4";

const NPC_SYSTEM_PROMPT = `You are a licensed Sanitary Engineer with deep expertise in:
- National Plumbing Code of the Philippines (NPC 2000) — primary reference
- Sanitation Code of the Philippines (PD 856) — septic tank and waste disposal
- Philippine Green Building Code (PGBC) — water efficiency, rainwater harvesting
- DPWH Blue Book — material and installation standards
- DOH Administrative Orders on water supply and sanitation

REVIEW PROCESS — follow these steps before writing output:
1. Read ALL uploaded pages. Note building type, number of floors, fixture count, pipe sizes shown.
2. Identify what IS shown vs. what is MISSING — missing legends, pipe schedules, and riser diagrams are findings.
3. For each item below, check compliance or flag CANNOT VERIFY if data is insufficient.
4. Cite EXACT NPC section numbers. State observed vs. required values wherever possible.
5. Do not cap findings — report every real violation found.

CHECK ALL OF THE FOLLOWING:

FIXTURE UNIT LOADING (NPC Table 4-1)
- Count all plumbing fixtures shown; compute total Drainage Fixture Units (DFU)
- Verify fixture unit values match NPC Table 4-1 (e.g. water closet = 4 DFU, lavatory = 1 DFU)
- Minimum fixtures per occupancy per NPC Table 4-2 (1 WC per 15 persons male/female residential)

WATER SUPPLY PIPE SIZING (NPC Sec. 6)
- Supply pipe sizing per NPC Table 6-4: total fixture units vs. pipe diameter
- Minimum cold water supply: 12mm for individual fixtures, 19mm for branch, 25mm for main
- Water pressure at topmost fixture: minimum 70 kPa (10 psi) — check if booster pump is needed
- Maximum static pressure: 550 kPa (80 psi) — PRV required if exceeded
- Hot and cold water lines shown separately and labeled

DRAINAGE PIPE SIZING (NPC Sec. 7)
- Horizontal drain slope: minimum 2% (1:50) for pipes ≤75mm; 1% (1:100) for pipes >75mm
- Building drain sizing per NPC Table 7-3 (DFU vs. pipe diameter)
- Soil stack sizing: 100mm minimum for WC connections
- Cleanouts: at base of each stack, at each change of direction >45°, max 15m spacing on horizontal runs

VENTING SYSTEM (NPC Sec. 9)
- Individual vent for each water closet (NPC Sec. 9.7)
- Vent pipe sizing per NPC Table 9-1
- Vent termination: minimum 150mm above roof, 900mm from any opening (window/door)
- Wet venting permitted only per NPC Sec. 9.4 limitations
- Stack vent or vent stack shown on riser diagram

SEPTIC TANK (PD 856 / NPC Sec. 7.14)
- Capacity: minimum 1 day retention time; 0.1 m³ per person per day
- For residential: 1.5m × 1.0m × 1.5m minimum for up to 6 persons
- Two-compartment design for >6 persons
- Minimum 3.0m from any building, 6.0m from water source
- Overflow to subsurface absorption field or approved disposal

GREASE TRAP (NPC Sec. 10 / DENR standards)
- Required for all kitchen drains in commercial occupancy
- Grease trap sizing: minimum 30-minute retention time
- Accessible for cleaning: manhole cover shown

BACKFLOW PREVENTION (NPC Sec. 6.9)
- Air gap minimum 2× pipe diameter above flood rim of fixture
- Vacuum breakers on hose bibbs, irrigation lines, and submerged inlets
- Reduced pressure zone (RPZ) valve for high-hazard connections

STORM DRAINAGE (NPC Sec. 11)
- Roof drain sizing per rainfall intensity (Metro Manila: 75 mm/hr minimum design)
- Roof drain strainers shown
- Storm and sanitary drains kept separate (NPC Sec. 11.1)
- Secondary overflow drain for roofs >100m²

HOT WATER SYSTEM (NPC Sec. 8, if applicable)
- Hot water supply: 60°C at heater outlet, 49°C min at fixtures
- Thermal expansion relief valve shown on storage type heaters
- Circulation loop for runs >15m

GREEN BUILDING
- Low-flow fixtures: WC ≤6 LPF, lavatory faucets ≤8 LPM (PGBC)
- Rainwater harvesting system shown if floor area >5000m²
- Greywater reuse system noted if applicable

CONFIDENCE GUIDANCE:
- CRITICAL: clear code violation with visible non-compliant values
- WARNING: likely violation or missing data preventing compliance verification
- INFO: best-practice gap or item needing field verification
- confidence: HIGH (values visible), MEDIUM (inferred), LOW (assumed from building type)

Respond ONLY as valid JSON (no markdown, no preamble):
{
  "summary": {
    "projectName": "string",
    "projectLocation": "city/province if shown or null",
    "buildingType": "Residential|Commercial|Industrial|Institutional|Unknown",
    "numberOfStoreys": null,
    "totalFixtures": null,
    "fileType": "string",
    "overallStatus": "NON-COMPLIANT|COMPLIANT WITH WARNINGS|COMPLIANT",
    "criticalCount": 0,
    "warningCount": 0,
    "infoCount": 0,
    "analysisNotes": "2-3 sentence professional summary of most critical issues",
    "cannotVerifyItems": ["items that could not be checked due to missing plan data"]
  },
  "findings": [
    {
      "id": 1,
      "severity": "CRITICAL|WARNING|INFO",
      "confidence": "HIGH|MEDIUM|LOW",
      "category": "Fixture Units|Pipe Sizing|Water Supply|Drainage|Venting|Septic Tank|Grease Trap|Backflow|Hot Water|Storm Drainage|Green Building|Other",
      "npcReference": "NPC 2000 Sec. X.X or PD 856 Sec. X",
      "title": "concise title under 10 words",
      "description": "precise technical description — state observed value, required value, and code requirement. Do not truncate.",
      "recommendation": "specific corrective action with target pipe sizes or dimensions",
      "codeBasis": "exact code requirement or table reference"
    }
  ],
  "checklist": {
    "fixtureUnits": true,
    "pipeSizing": true,
    "waterSupply": true,
    "drainageSystem": true,
    "ventingSystem": true,
    "septicTank": null,
    "greaseTrap": null,
    "backflowPrevention": true,
    "hotWater": null,
    "stormDrainage": true,
    "greenBuilding": true
  }
}`;

const FIXTURES = [
  {name:"Water Closet (Tank)",        dfu:4, wsfu_priv:5, wsfu_pub:6},
  {name:"Water Closet (Flush Valve)", dfu:6, wsfu_priv:7, wsfu_pub:8},
  {name:"Lavatory / Washbasin",       dfu:1, wsfu_priv:1, wsfu_pub:2},
  {name:"Bathtub (with shower)",      dfu:2, wsfu_priv:2, wsfu_pub:4},
  {name:"Shower (individual)",        dfu:2, wsfu_priv:2, wsfu_pub:3},
  {name:"Kitchen Sink",               dfu:2, wsfu_priv:2, wsfu_pub:4},
  {name:"Laundry Sink",               dfu:2, wsfu_priv:2, wsfu_pub:4},
  {name:"Floor Drain 2in",            dfu:1, wsfu_priv:1, wsfu_pub:1},
  {name:"Floor Drain 3in",            dfu:3, wsfu_priv:2, wsfu_pub:3},
  {name:"Floor Drain 4in",            dfu:6, wsfu_priv:3, wsfu_pub:4},
  {name:"Urinal (flush valve)",       dfu:4, wsfu_priv:4, wsfu_pub:6},
  {name:"Drinking Fountain",          dfu:1, wsfu_priv:1, wsfu_pub:1},
  {name:"Dishwasher",                 dfu:2, wsfu_priv:1.5,wsfu_pub:2},
  {name:"Washing Machine",            dfu:2, wsfu_priv:2, wsfu_pub:3},
  {name:"Slop Sink",                  dfu:3, wsfu_priv:2, wsfu_pub:3},
  {name:"Bidet",                      dfu:1, wsfu_priv:1.5,wsfu_pub:2},
  {name:"Hose Bib",                   dfu:0, wsfu_priv:2.5,wsfu_pub:2.5},
];

const DFU_TO_PIPE = [
  {maxDfu:1,dia:32},{maxDfu:3,dia:40},{maxDfu:6,dia:50},
  {maxDfu:12,dia:65},{maxDfu:20,dia:75},{maxDfu:160,dia:100},
  {maxDfu:360,dia:125},{maxDfu:620,dia:150},{maxDfu:1400,dia:200},
];

const WSFU_TO_GPM = wsfu => wsfu<=6?wsfu*1.5:wsfu<=10?wsfu*1.2:wsfu<=20?wsfu*1.0:wsfu*0.9;

// ─── SANICODE: AI PLAN CHECKER ────────────────────────────────────────────────
function PlumbingChecker({ apiKey }) {
  const [files,setFiles]=useState([]);
  const [result,setResult]=useState(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState(null);
  const [drag,setDrag]=useState(false);
  const [tab,setTab]=useState("all");
  const [open,setOpen]=useState({});
  const [checked,setChecked]=useState({});
  const [corrections,setCorrections]=useState(null);
  const [correcting,setCorrecting]=useState(false);
  const [revNum,setRevNum]=useState(1);
  const ref=useRef(null);
  const addFiles=useCallback(fs=>{setFiles(p=>[...p,...Array.from(fs).map(f=>({file:f,id:Math.random().toString(36).slice(2),name:f.name,size:f.size,type:f.type||"application/octet-stream"}))]);setResult(null);setError(null);},[]);
  const [busyMsg,setBusyMsg]=useState("");
  const tick=()=>new Promise(r=>setTimeout(r,0));
  const run=async()=>{
    if(!files.length)return;
    setBusy(true);setError(null);setResult(null);
    try{
      const blocks=[];
      for(let i=0;i<files.length;i++){
        const fo=files[i];
        setBusyMsg(`📂 Reading ${i+1}/${files.length}: ${fo.name}…`);await tick();
        const b64=fo.type.startsWith("image/")?(setBusyMsg(`🗜️ Compressing ${fo.name}…`),await tick(),await compressImage(fo.file)):await toBase64(fo.file);
        if(fo.type.startsWith("image/")){blocks.push({type:"image",source:{type:"base64",media_type:"image/jpeg",data:b64}});blocks.push({type:"text",text:`[Image: ${fo.name}]`});}
        else if(fo.type==="application/pdf"){blocks.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}});blocks.push({type:"text",text:`[PDF: ${fo.name}]`});}
      }
      blocks.push({type:"text",text:`You are reviewing these sanitary/plumbing plans as a licensed Sanitary Engineer.

STEP 1 — READ: Scan every page. Note building type, fixture count, pipe sizes, riser diagrams, and isometric drawings.
STEP 2 — MISSING DATA: Identify every required schedule, riser diagram, or spec absent from the plans.
STEP 3 — CHECK: For each NPC section in your checklist, state PASS, FAIL, or CANNOT VERIFY with reason.
STEP 4 — OUTPUT: Return complete JSON per the schema. Include ALL violations. Do not truncate.

Return only valid JSON — no markdown, no preamble.`});
      setBusyMsg("🤖 AI is checking NPC 2000 compliance…");await tick();
      const data=await callAI({ apiKey, system:NPC_SYSTEM_PROMPT, messages:[{role:"user",content:blocks}] });
      const raw=data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      let parsed;try{parsed=JSON.parse(raw);}catch{throw new Error("Could not parse AI response.");}
      setResult(parsed);
      if(onResultChange) onResultChange(parsed);setOpen({});setTab("all");setChecked({});setCorrections(null);
      addHistoryEntry({ tool:"plumbing", module:"sanitary", projectName:parsed?.summary?.projectName||"Plumbing Check", meta:{ status:parsed?.summary?.overallStatus, findings:(parsed?.findings?.length||0), summary:parsed?.summary?.analysisNotes||"" } });
      // Direct save — no React state, no callbacks, always works
      try { localStorage.setItem("buildify_session_sanitary", JSON.stringify({ checkerResult: parsed, _savedAt: new Date().toISOString(), _module: "sanitary", userId: "local" })); } catch(e) { console.warn("Session save failed", e); }
    }catch(e){setError(e.message||"Analysis failed.");}finally{setBusy(false);setBusyMsg("");}
  };
  const findings=result?.findings||[];
  const filtered=tab==="all"?findings:findings.filter(f=>f.severity===tab);
  const checkedCount=Object.values(checked).filter(Boolean).length;
  const allChecked=findings.length>0&&findings.every(f=>checked[f.id]);
  const toggleAll=()=>{if(allChecked)setChecked({});else{const a={};findings.forEach(f=>a[f.id]=true);setChecked(a);}};
  const generateCorrections=async()=>{
    const selected=findings.filter(f=>checked[f.id]);if(!selected.length)return;
    setCorrecting(true);setCorrections(null);
    try{
      const hdrs={"Content-Type":"application/json"};if(apiKey)hdrs["x-api-key"]=apiKey;
      const prompt=`You are a licensed Sanitary Engineer. For each finding, generate specific NPC 2000 correction instructions.\nFindings:\n${selected.map((f,i)=>`${i+1}. [${f.severity}] ${f.title} — ${f.description} (${f.npcReference})`).join("\n")}\nRespond ONLY as valid JSON array: [{"id":1,"title":"...","severity":"...","description":"...","npcReference":"...","recommendation":"...","correctedValues":"specific corrected value e.g. Increase drain from 50mm to 75mm","draftingInstruction":"exact drafting instruction with sheet reference"}]`;
      const data=await callAI({ apiKey, messages:[{role:"user",content:prompt}], max_tokens:4000 });
      const raw=data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      setCorrections(JSON.parse(raw));
    }catch(e){alert("Could not generate corrections: "+e.message);}finally{setCorrecting(false);}
  };
  const STATUS_COL={"NON-COMPLIANT":"#dc2626","COMPLIANT WITH WARNINGS":"#d97706","COMPLIANT":"#16a34a"};
  return (
    <div>
      <NoKeyBanner/>
      <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files)}} onClick={()=>ref.current?.click()} style={{border:`2px dashed ${drag?SC:T.border}`,borderRadius:16,padding:"40px 24px",textAlign:"center",cursor:"pointer",background:drag?"rgba(16,185,129,0.05)":"rgba(255,255,255,0.01)",transition:"all 0.2s",marginBottom:20}}>
        <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e=>addFiles(e.target.files)} style={{display:"none"}}/>
        <div style={{fontSize:40,marginBottom:12}}>🚿</div>
        <div style={{fontWeight:700,fontSize:16,color:T.text,marginBottom:6}}>Drop plumbing/sanitary plans here</div>
        <div style={{color:T.muted,fontSize:13,marginBottom:16}}>PDF drawings · JPG / PNG images</div>
        <div style={{display:"inline-block",background:`linear-gradient(135deg,${SC},#059669)`,color:"#fff",fontWeight:700,padding:"9px 22px",borderRadius:10,fontSize:14}}>Choose Files</div>
      </div>
      {files.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>{files.map(fo=><div key={fo.id} style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 10px",display:"flex",alignItems:"center",gap:8}}><span>{fo.type.startsWith("image")?"🖼️":"📄"}</span><div style={{fontSize:12,color:T.text,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fo.name}</div><button onClick={()=>setFiles(p=>p.filter(f=>f.id!==fo.id))} style={{background:"rgba(239,68,68,0.12)",border:"none",color:T.danger,width:22,height:22,borderRadius:5,cursor:"pointer",fontSize:12}}>✕</button></div>)}</div>}
      {files.length>0&&<button onClick={run} disabled={busy} style={{width:"100%",background:busy?`rgba(16,185,129,0.2)`:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:busy?"#666":"#fff",fontWeight:700,fontSize:15,padding:"14px",borderRadius:12,cursor:busy?"not-allowed":"pointer",marginBottom:20,transition:"all 0.2s"}}>{busy?(busyMsg||"⚙️ Analyzing…"):`🚿 Run Plumbing Compliance Check (${files.length} file${files.length>1?"s":""})`}</button>}
      {error&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"12px 16px",marginBottom:20,color:T.danger,fontSize:14}}>⚠️ {error}</div>}
      {result&&(
        <div style={{animation:"fadeIn 0.35s ease"}}>
          <Card style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:11,color:T.muted,marginBottom:4}}>PROJECT</div>
                <div style={{fontWeight:800,fontSize:18,color:T.text}}>{result.summary.projectName}</div>
                <div style={{fontSize:13,color:T.muted,marginTop:2}}>{result.summary.buildingType}</div>
                <div style={{marginTop:12,display:"flex",gap:24}}>
                  <div><div style={{fontSize:26,fontWeight:800,color:"#dc2626"}}>{result.summary.criticalCount}</div><div style={{fontSize:11,color:T.muted}}>CRITICAL</div></div>
                  <div><div style={{fontSize:26,fontWeight:800,color:"#d97706"}}>{result.summary.warningCount}</div><div style={{fontSize:11,color:T.muted}}>WARNINGS</div></div>
                  <div><div style={{fontSize:26,fontWeight:800,color:SC}}>{result.summary.infoCount}</div><div style={{fontSize:11,color:T.muted}}>INFO</div></div>
                </div>
              </div>
              <div style={{background:`${STATUS_COL[result.summary.overallStatus]}14`,border:`2px solid ${STATUS_COL[result.summary.overallStatus]}44`,borderRadius:12,padding:"10px 18px",textAlign:"center"}}>
                <div style={{fontSize:10,color:T.muted,marginBottom:4}}>OVERALL STATUS</div>
                <div style={{fontSize:13,fontWeight:800,color:STATUS_COL[result.summary.overallStatus]}}>{result.summary.overallStatus}</div>
              </div>
            </div>
            <div style={{marginTop:12,fontSize:13,color:T.muted,lineHeight:1.6,background:T.dim,borderRadius:8,padding:"10px 14px"}}>{result.summary.analysisNotes}</div>
          </Card>
          {findings.length>0&&(
            <div>
              <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["all","CRITICAL","WARNING","INFO"].map(t=>{const cnt=t==="all"?findings.length:findings.filter(f=>f.severity===t).length;const active=tab===t;return <button key={t} onClick={()=>setTab(t)} style={{padding:"7px 16px",borderRadius:8,border:`1.5px solid ${active?SC:T.border}`,background:active?`rgba(16,185,129,0.12)`:"transparent",color:active?SC:T.muted,cursor:"pointer",fontSize:12,fontWeight:700}}>{t==="all"?"All":t} ({cnt})</button>;})}
                </div>
                <button onClick={toggleAll} style={{padding:"7px 14px",borderRadius:8,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>{allChecked?"☑ Deselect All":"☐ Select All"}</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                {filtered.map(f=>{
                  const col={CRITICAL:"#dc2626",WARNING:"#d97706",INFO:SC}[f.severity]||SC;
                  const bg={CRITICAL:"rgba(220,38,38,0.06)",WARNING:"rgba(217,119,6,0.06)",INFO:"rgba(16,185,129,0.06)"}[f.severity]||"rgba(16,185,129,0.06)";
                  const isOpen=open[f.id];const isChecked=!!checked[f.id];
                  return (
                    <div key={f.id} style={{background:isChecked?bg:"rgba(255,255,255,0.01)",border:`1.5px solid ${isChecked?col:T.border}`,borderRadius:12,overflow:"hidden",transition:"all 0.15s"}}>
                      <div style={{padding:"13px 18px",display:"flex",alignItems:"flex-start",gap:12}}>
                        <div onClick={()=>setChecked(p=>({...p,[f.id]:!p[f.id]}))} style={{width:20,height:20,borderRadius:5,border:`2px solid ${isChecked?col:T.muted}`,background:isChecked?col:"transparent",cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>{isChecked&&<span style={{color:"#fff",fontSize:12,fontWeight:800,lineHeight:1}}>✓</span>}</div>
                        <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setOpen(p=>({...p,[f.id]:!p[f.id]}))}>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:4,alignItems:"center"}}>
                            <span style={{background:col,color:"#fff",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:4}}>{f.severity}</span>
                            {f.confidence && <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:4,
                              background:f.confidence==="HIGH"?"rgba(22,163,74,0.15)":f.confidence==="LOW"?"rgba(239,68,68,0.12)":"rgba(234,179,8,0.12)",
                              color:f.confidence==="HIGH"?"#16a34a":f.confidence==="LOW"?"#ef4444":"#ca8a04",
                              border:`1px solid ${f.confidence==="HIGH"?"rgba(22,163,74,0.3)":f.confidence==="LOW"?"rgba(239,68,68,0.3)":"rgba(234,179,8,0.3)"}`
                            }}>{f.confidence==="HIGH"?"● HIGH CONFIDENCE":f.confidence==="LOW"?"◌ LOW CONFIDENCE":"◑ MEDIUM CONF."}</span>}
                            <span style={{fontSize:11,color:T.muted,fontFamily:"monospace"}}>{f.npcReference}</span>
                            <span style={{fontSize:11,color:T.muted,background:"rgba(255,255,255,0.04)",padding:"1px 8px",borderRadius:4}}>{f.category}</span>
                          </div>
                          <div style={{fontWeight:700,fontSize:14,color:T.text}}>{f.title}</div>
                        </div>
                        <span style={{color:T.muted,fontSize:12,marginTop:2,cursor:"pointer"}} onClick={()=>setOpen(p=>({...p,[f.id]:!p[f.id]}))}>{isOpen?"▲":"▼"}</span>
                      </div>
                      {isOpen&&<div style={{padding:"0 18px 16px 50px",borderTop:`1px solid ${col}33`}}><div style={{paddingTop:12,display:"flex",flexDirection:"column",gap:10}}><div><Label>Finding</Label><div style={{fontSize:13,color:T.muted,lineHeight:1.6}}>{f.description}</div></div><div><Label>Recommendation</Label><div style={{fontSize:13,color:T.success,lineHeight:1.6}}>✓ {f.recommendation}</div></div>{f.codeBasis&&<div style={{background:"rgba(0,0,0,0.2)",borderLeft:`3px solid ${col}`,padding:"10px 14px",borderRadius:"0 8px 8px 0",fontSize:12,color:T.muted,fontStyle:"italic",lineHeight:1.5}}>{f.codeBasis}</div>}</div></div>}
                    </div>
                  );
                })}
              </div>
              {checkedCount>0&&(
                <div style={{background:"rgba(16,185,129,0.08)",border:`1.5px solid rgba(16,185,129,0.25)`,borderRadius:12,padding:"16px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                  <div><div style={{fontWeight:700,fontSize:14,color:SC}}>{checkedCount} item{checkedCount>1?"s":""} selected</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>AI generates drafting instructions per NPC 2000</div></div>
                  <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><Label>Rev No.</Label><input type="number" value={revNum} min={1} max={99} onChange={e=>setRevNum(+e.target.value)} style={{width:60,background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:8,padding:"6px 10px",color:T.text,fontSize:14,fontWeight:700,outline:"none",textAlign:"center"}}/></div>
                    <button onClick={generateCorrections} disabled={correcting} style={{background:correcting?`rgba(16,185,129,0.3)`:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:correcting?"#666":"#fff",fontWeight:700,padding:"10px 20px",borderRadius:10,cursor:correcting?"not-allowed":"pointer",fontSize:13}}>{correcting?"⚙️ Generating…":"🤖 Generate Corrections"}</button>
                  </div>
                </div>
              )}
              {corrections&&(
                <div style={{background:"rgba(16,185,129,0.05)",border:`1.5px solid rgba(16,185,129,0.25)`,borderRadius:12,padding:20,marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
                    <div><div style={{fontWeight:800,fontSize:15,color:T.success}}>✅ Corrections Ready — Rev {revNum}</div><div style={{fontSize:12,color:T.muted,marginTop:2}}>{corrections.length} instruction{corrections.length>1?"s":""} ready</div></div>
                    <button onClick={()=>{const w=window.open("","_blank");const date=new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});const rows=corrections.map((c,i)=>`<tr><td style="padding:8px;border:1px solid #e5e7eb;text-align:center;font-weight:700">REV-${String(i+1).padStart(2,"0")}</td><td style="padding:8px;border:1px solid #e5e7eb;color:${{CRITICAL:"#dc2626",WARNING:"#d97706",INFO:"#059669"}[c.severity]};font-weight:700">${c.severity}</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">${c.title}</td><td style="padding:8px;border:1px solid #e5e7eb;font-size:12px">${c.description}</td><td style="padding:8px;border:1px solid #e5e7eb;background:#fefce8">${c.correctedValues||c.recommendation}</td><td style="padding:8px;border:1px solid #e5e7eb;background:#f0fdf4;color:#15803d">${c.draftingInstruction||""}</td><td style="padding:8px;border:1px solid #e5e7eb;font-size:11px">${c.npcReference}</td></tr>`).join("");w.document.write(`<!DOCTYPE html><html><head><title>Plumbing Revision Rev ${revNum}</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#111;font-size:13px}table{border-collapse:collapse;width:100%}th{background:#065f46;color:#fff;padding:9px 8px;text-align:left;font-size:11px}h1{color:#065f46}@media print{button{display:none}}</style></head><body><h1>🚿 Plumbing Revision Report — Rev ${revNum}</h1><p style="color:#6b7280">NPC 2000 · PD 856 · ${date} · Jon Ureta</p><table><tr><th>Rev No.</th><th>Severity</th><th>Issue</th><th>Finding</th><th>Corrected Value</th><th>Drafting Instruction</th><th>NPC Ref.</th></tr>${rows}</table><p style="margin-top:24px;font-size:11px;color:#9ca3af">AI-generated. Verify with licensed Sanitary Engineer before implementation.</p></body></html>`);w.document.close();setTimeout(()=>w.print(),400);}} style={{background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,padding:"10px 20px",borderRadius:10,cursor:"pointer",fontSize:13}}>📄 Download Revision PDF</button>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {corrections.map((c,i)=>(
                      <div key={c.id||i} style={{background:T.dim,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
                        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                          <span style={{background:"#064e3b",color:SC,fontSize:11,fontWeight:800,padding:"2px 10px",borderRadius:4}}>REV-{String(i+1).padStart(2,"0")}</span>
                          <span style={{fontSize:12,fontWeight:700,color:T.text}}>{c.title}</span>
                          <span style={{fontSize:11,color:T.muted,fontFamily:"monospace"}}>{c.npcReference}</span>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                          <div style={{background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,color:T.accent,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>📐 Corrected Value</div><div style={{fontSize:13,color:T.text,lineHeight:1.6}}>{c.correctedValues||c.recommendation}</div></div>
                          <div style={{background:"rgba(16,185,129,0.07)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,color:T.success,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>✏️ Drafting Instruction</div><div style={{fontSize:13,color:T.text,lineHeight:1.6}}>{c.draftingInstruction||"Apply correction as indicated"}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div style={{marginTop:20,padding:"10px 16px",background:T.dim,borderRadius:10,fontSize:12,color:T.muted,lineHeight:1.5}}>⚠️ AI-generated. Plans must be signed by a licensed Sanitary Engineer before LGU/DOH submission.</div>
        </div>
      )}
      {!files.length&&!result&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginTop:4}}>
          {[{i:"🏠",t:"Residential",d:"Water supply, drainage, septic"},{i:"🏢",t:"Commercial",d:"Fixture units, grease traps"},{i:"🏥",t:"Institutional",d:"Hospital, school plumbing"},{i:"🌊",t:"Storm Drainage",d:"NPC Sec. 11 compliance"}].map(x=>(
            <Card key={x.t} style={{textAlign:"center",padding:18}}><div style={{fontSize:28,marginBottom:8}}>{x.i}</div><div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:4}}>{x.t}</div><div style={{fontSize:11,color:T.muted,lineHeight:1.5}}>{x.d}</div></Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SANICODE: FIXTURE UNIT CALCULATOR ───────────────────────────────────────
function FixtureUnitCalc() {
  const [rows,setRows]=useState([{id:1,fixture:FIXTURES[0].name,qty:1}]);
  const [bldgType,setBldgType]=useState("private");
  const [result,setResult]=useState(null);
  const addRow=()=>setRows(p=>[...p,{id:Date.now(),fixture:FIXTURES[0].name,qty:1}]);
  const removeRow=id=>setRows(p=>p.filter(r=>r.id!==id));
  const updateRow=(id,k,v)=>setRows(p=>p.map(r=>r.id===id?{...r,[k]:v}:r));
  const calc=()=>{
    let totalDFU=0,totalWSFU=0;
    const detail=rows.map(r=>{const fx=FIXTURES.find(f=>f.name===r.fixture)||FIXTURES[0];const dfu=fx.dfu*r.qty;const wsfu=(bldgType==="private"?fx.wsfu_priv:fx.wsfu_pub)*r.qty;totalDFU+=dfu;totalWSFU+=wsfu;return {...r,dfu,wsfu,fx};});
    const drainPipe=DFU_TO_PIPE.find(p=>totalDFU<=p.maxDfu)||DFU_TO_PIPE[DFU_TO_PIPE.length-1];
    const gpm=WSFU_TO_GPM(totalWSFU);
    const supplyDia=gpm<=4?19:gpm<=8?25:gpm<=15?32:gpm<=30?38:gpm<=50?50:75;
    setResult({detail,totalDFU,totalWSFU,drainPipe,gpm,supplyDia});
  };
  return (
    <div>
      <Card style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
          <Label>Building Type</Label>
          <div style={{display:"flex",gap:8}}>
            {["private","public"].map(t=><button key={t} onClick={()=>setBldgType(t)} style={{padding:"6px 14px",borderRadius:8,border:`1.5px solid ${bldgType===t?SC:T.border}`,background:bldgType===t?`rgba(16,185,129,0.12)`:"transparent",color:bldgType===t?SC:T.muted,cursor:"pointer",fontSize:12,fontWeight:700}}>{t==="private"?"🏠 Private":"🏢 Public"}</button>)}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8}}><div style={{fontSize:11,fontWeight:700,color:T.muted}}>FIXTURE</div><div style={{fontSize:11,fontWeight:700,color:T.muted,textAlign:"center",width:70}}>QTY</div><div style={{width:36}}/></div>
          {rows.map(r=>(
            <div key={r.id} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8,alignItems:"center"}}>
              <Select value={r.fixture} onChange={e=>updateRow(r.id,"fixture",e.target.value)}>{FIXTURES.map(f=><option key={f.name} value={f.name}>{f.name}</option>)}</Select>
              <input type="number" value={r.qty} min={1} onChange={e=>updateRow(r.id,"qty",+e.target.value)} style={{width:70,background:"#0f1117",border:`1.5px solid ${T.border}`,borderRadius:10,padding:"10px 8px",color:T.text,fontSize:14,outline:"none",textAlign:"center"}}/>
              <button onClick={()=>removeRow(r.id)} style={{width:36,height:36,borderRadius:8,background:"rgba(239,68,68,0.12)",border:"none",color:T.danger,cursor:"pointer",fontSize:14}}>✕</button>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={addRow} style={{flex:1,background:T.dim,border:`1.5px dashed ${T.border}`,color:T.muted,fontWeight:700,padding:"10px",borderRadius:10,cursor:"pointer",fontSize:13}}>+ Add Fixture</button>
          <button onClick={calc} style={{flex:2,background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,padding:"10px 20px",borderRadius:10,cursor:"pointer",fontSize:13}}>🚰 Calculate Fixture Units</button>
        </div>
      </Card>
      {result&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Card style={{background:"rgba(16,185,129,0.06)",border:`1.5px solid rgba(16,185,129,0.3)`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>TOTAL DRAINAGE FIXTURE UNITS</div>
            <div style={{fontSize:40,fontWeight:900,color:SC}}>{result.totalDFU} <span style={{fontSize:16,fontWeight:400}}>DFU</span></div>
            <div style={{marginTop:8,fontSize:13,color:T.muted}}>Min drain pipe: <strong style={{color:T.text}}>{result.drainPipe.dia}mm</strong></div>
          </Card>
          <Card style={{background:"rgba(16,185,129,0.06)",border:`1.5px solid rgba(16,185,129,0.3)`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>WATER SUPPLY FIXTURE UNITS</div>
            <div style={{fontSize:40,fontWeight:900,color:SC}}>{result.totalWSFU.toFixed(1)} <span style={{fontSize:16,fontWeight:400}}>WSFU</span></div>
            <div style={{marginTop:8,fontSize:13,color:T.muted}}>{result.gpm.toFixed(1)} GPM → <strong style={{color:T.text}}>{result.supplyDia}mm supply</strong></div>
          </Card>
          <Card style={{gridColumn:"1/-1"}}>
            <Label>Fixture Breakdown (NPC 2000 Table 4-1)</Label>
            <table style={{width:"100%",borderCollapse:"collapse",marginTop:8}}>
              <thead><tr style={{background:T.dim}}>{["Fixture","Qty","DFU ea","Total DFU","WSFU ea","Total WSFU"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:11,color:T.muted,fontWeight:700}}>{h}</th>)}</tr></thead>
              <tbody>{result.detail.map((r,i)=><tr key={r.id} style={{borderTop:`1px solid ${T.border}`,background:i%2===0?"transparent":T.dim}}><td style={{padding:"8px 10px",fontSize:13,color:T.text}}>{r.fixture}</td><td style={{padding:"8px 10px",fontSize:13,color:T.text,textAlign:"center"}}>{r.qty}</td><td style={{padding:"8px 10px",fontSize:13,color:T.muted,textAlign:"center"}}>{r.fx.dfu}</td><td style={{padding:"8px 10px",fontSize:13,fontWeight:700,color:SC,textAlign:"center"}}>{r.dfu}</td><td style={{padding:"8px 10px",fontSize:13,color:T.muted,textAlign:"center"}}>{bldgType==="private"?r.fx.wsfu_priv:r.fx.wsfu_pub}</td><td style={{padding:"8px 10px",fontSize:13,fontWeight:700,color:SC,textAlign:"center"}}>{r.wsfu.toFixed(1)}</td></tr>)}</tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── SANICODE: PIPE SIZING ────────────────────────────────────────────────────
function PipeSizing() {
  const [pipeType,setPipeType]=useState("drain");
  const [dfu,setDfu]=useState(20);
  const [wsfu,setWsfu]=useState(15);
  const [slope,setSlope]=useState(0.02);
  const [result,setResult]=useState(null);
  const calc=()=>{
    if(pipeType==="drain"){
      const rec=DFU_TO_PIPE.find(p=>dfu<=p.maxDfu)||DFU_TO_PIPE[DFU_TO_PIPE.length-1];
      const d=rec.dia/1000,n=0.013,r=d/4;
      const vel=(1/n)*Math.pow(r,2/3)*Math.pow(slope,0.5);
      const status=vel>=0.6&&vel<=3.0?"PASS — Self-cleansing":"CHECK SLOPE";
      setResult({type:"drain",rec,vel,status,dfu});
    }else{
      const gpm=WSFU_TO_GPM(wsfu);
      const lps=gpm*0.06309;
      const dia=gpm<=4?19:gpm<=8?25:gpm<=15?32:gpm<=30?38:gpm<=50?50:75;
      setResult({type:"supply",gpm,lps,dia,wsfu});
    }
  };
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Pipe System Type</Label>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[{k:"drain",l:"🚽 Drainage / DWV"},{k:"supply",l:"💧 Water Supply"}].map(t=><button key={t.k} onClick={()=>setPipeType(t.k)} style={{flex:1,padding:"8px",borderRadius:8,border:`1.5px solid ${pipeType===t.k?SC:T.border}`,background:pipeType===t.k?`rgba(16,185,129,0.12)`:"transparent",color:pipeType===t.k?SC:T.muted,cursor:"pointer",fontSize:12,fontWeight:700}}>{t.l}</button>)}
        </div>
        {pipeType==="drain"?(
          <><Label>Total DFU</Label><Input type="number" value={dfu} onChange={e=>setDfu(+e.target.value)} style={{marginBottom:16}}/><Label>Drain Slope</Label><Select value={slope} onChange={e=>setSlope(+e.target.value)} style={{marginBottom:16}}><option value={0.01}>1% (1:100)</option><option value={0.02}>2% (1:50) recommended</option><option value={0.04}>4% (1:25)</option><option value={0.0625}>6.25% (1:16)</option></Select></>
        ):(
          <><Label>Total WSFU</Label><Input type="number" value={wsfu} onChange={e=>setWsfu(+e.target.value)} style={{marginBottom:16}}/></>
        )}
        <button onClick={calc} style={{width:"100%",background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>📏 Size the Pipe</button>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:"rgba(16,185,129,0.06)",border:`1.5px solid rgba(16,185,129,0.3)`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>RECOMMENDED PIPE DIAMETER</div>
            <div style={{fontSize:48,fontWeight:900,color:SC}}>{result.type==="drain"?result.rec.dia:result.dia} <span style={{fontSize:18,fontWeight:400}}>mm</span></div>
            {result.type==="drain"&&<div style={{fontSize:13,color:T.muted,marginTop:4}}>Velocity: {result.vel.toFixed(2)} m/s — {result.status}</div>}
            {result.type==="supply"&&<div style={{fontSize:13,color:T.muted,marginTop:4}}>{result.gpm.toFixed(1)} GPM · {result.lps.toFixed(2)} L/s</div>}
          </Card>
          {result.type==="drain"&&[{l:"DFU load",v:`${result.dfu}`},{l:"Min pipe dia",v:`${result.rec.dia}mm`,h:true},{l:"Flow velocity",v:`${result.vel.toFixed(2)} m/s`},{l:"Status",v:result.status,h:true}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.h?`rgba(16,185,129,0.08)`:T.dim,borderRadius:8,border:r.h?`1px solid rgba(16,185,129,0.2)`:"none"}}><span style={{fontSize:13,color:T.muted}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.h?SC:T.text,fontFamily:"monospace"}}>{r.v}</span></div>)}
          {result.type==="supply"&&[{l:"WSFU",v:`${result.wsfu}`},{l:"Flow",v:`${result.gpm.toFixed(1)} GPM`,h:true},{l:"Flow L/s",v:`${result.lps.toFixed(2)} L/s`},{l:"Supply pipe",v:`${result.dia}mm`,h:true}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.h?`rgba(16,185,129,0.08)`:T.dim,borderRadius:8,border:r.h?`1px solid rgba(16,185,129,0.2)`:"none"}}><span style={{fontSize:13,color:T.muted}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.h?SC:T.text,fontFamily:"monospace"}}>{r.v}</span></div>)}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>NPC 2000 Sec. 4 · Manning n=0.013 · Hunter method for supply</div>
        </div>
      ):(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}><div style={{fontSize:48}}>📏</div><div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter parameters and click<br/>Size the Pipe</div></Card>
      )}
    </div>
  );
}

// ─── SANICODE: SEPTIC TANK ────────────────────────────────────────────────────
function SepticTankSizing() {
  const [persons,setPersons]=useState(10);
  const [bldgUse,setBldgUse]=useState("residential");
  const [retDays,setRetDays]=useState(1);
  const [result,setResult]=useState(null);
  const GPCD={residential:80,commercial:25,school:15,office:20};
  const calc=()=>{
    const gpcd=GPCD[bldgUse];
    const flow_lpd=persons*gpcd*3.785;
    const liq_vol=flow_lpd*retDays;
    const total_vol=liq_vol*1.3;
    const width=Math.max(1.2,Math.pow(total_vol/1000/(1.5*2),0.5));
    const length=2*width;
    const liquid_depth=liq_vol/1000/(width*length);
    const total_depth=liquid_depth+0.3;
    setResult({flow_lpd,liq_vol,total_vol,width,length,liquid_depth,total_depth,freeboard:0.3,gpcd,persons});
  };
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Building Use</Label>
        <Select value={bldgUse} onChange={e=>setBldgUse(e.target.value)} style={{marginBottom:16}}>
          <option value="residential">Residential (80 GPCD)</option>
          <option value="commercial">Commercial (25 GPCD)</option>
          <option value="school">School (15 GPCD)</option>
          <option value="office">Office (20 GPCD)</option>
        </Select>
        <Label>Number of Persons</Label>
        <Input type="number" value={persons} onChange={e=>setPersons(+e.target.value)} style={{marginBottom:16}}/>
        <Label>Retention Period (days)</Label>
        <Select value={retDays} onChange={e=>setRetDays(+e.target.value)} style={{marginBottom:20}}>
          <option value={1}>1 day — Residential</option>
          <option value={2}>2 days — Commercial</option>
          <option value={3}>3 days — Industrial</option>
        </Select>
        <button onClick={calc} style={{width:"100%",background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>🪣 Size Septic Tank</button>
        <div style={{marginTop:12,padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted}}>Per PD 856 Sanitation Code · NPC 2000 Sec. 13</div>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:"rgba(16,185,129,0.06)",border:`1.5px solid rgba(16,185,129,0.3)`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>SEPTIC TANK SIZE</div>
            <div style={{fontSize:26,fontWeight:900,color:SC}}>{result.length.toFixed(2)}m × {result.width.toFixed(2)}m × {result.total_depth.toFixed(2)}m</div>
            <div style={{fontSize:13,color:T.muted,marginTop:4}}>L × W × D</div>
          </Card>
          {[{l:"Wastewater flow",v:`${result.flow_lpd.toFixed(0)} L/day`},{l:"Liquid capacity",v:`${result.liq_vol.toFixed(0)} L`,h:true},{l:"Total volume",v:`${result.total_vol.toFixed(0)} L`,h:true},{l:"Tank length",v:`${result.length.toFixed(2)} m`},{l:"Tank width",v:`${result.width.toFixed(2)} m`},{l:"Liquid depth",v:`${result.liquid_depth.toFixed(2)} m`},{l:"Freeboard",v:"0.30 m"},{l:"Total depth",v:`${result.total_depth.toFixed(2)} m`,h:true}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.h?`rgba(16,185,129,0.08)`:T.dim,borderRadius:8,border:r.h?`1px solid rgba(16,185,129,0.2)`:"none"}}><span style={{fontSize:13,color:T.muted}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.h?SC:T.text,fontFamily:"monospace"}}>{r.v}</span></div>)}
        </div>
      ):(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}><div style={{fontSize:48}}>🪣</div><div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter parameters and click<br/>Size Septic Tank</div></Card>
      )}
    </div>
  );
}

// ─── SANICODE: WATER DEMAND ───────────────────────────────────────────────────
function WaterDemandCalc() {
  const [bldgType,setBldgType]=useState("residential");
  const [units,setUnits]=useState(10);
  const [persons,setPersons]=useState(4);
  const [floors,setFloors]=useState(3);
  const [result,setResult]=useState(null);
  const DEMANDS={residential:{label:"Residential (per person)",gpd:80,unit:"persons"},apartment:{label:"Apartment (per unit)",gpd:250,unit:"units"},office:{label:"Office (per person)",gpd:20,unit:"persons"},school:{label:"School (per student)",gpd:15,unit:"persons"},hospital:{label:"Hospital (per bed)",gpd:300,unit:"units"},hotel:{label:"Hotel (per room)",gpd:200,unit:"units"},restaurant:{label:"Restaurant (per seat)",gpd:50,unit:"units"},mall:{label:"Mall (per 100sqm)",gpd:400,unit:"units"}};
  const calc=()=>{
    const dem=DEMANDS[bldgType];
    const count=dem.unit==="persons"?persons*units:units;
    const avg_lpd=count*dem.gpd*3.785;
    const avg_lps=avg_lpd/86400;
    const peak_lps=avg_lps*3.5;
    const storage_L=avg_lpd*0.5;
    const roof_L=avg_lpd*0.25;
    setResult({avg_lpd,avg_lps,peak_lps,storage_L,tank_m3:storage_L/1000,roof_L,count,dem});
  };
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Building Type</Label>
        <Select value={bldgType} onChange={e=>setBldgType(e.target.value)} style={{marginBottom:16}}>{Object.entries(DEMANDS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</Select>
        {DEMANDS[bldgType].unit==="persons"&&<><Label>Units / Floors</Label><Input type="number" value={units} onChange={e=>setUnits(+e.target.value)} style={{marginBottom:16}}/><Label>Persons per Unit</Label><Input type="number" value={persons} onChange={e=>setPersons(+e.target.value)} style={{marginBottom:16}}/></>}
        {DEMANDS[bldgType].unit==="units"&&<><Label>Units / Beds / Seats / Rooms</Label><Input type="number" value={units} onChange={e=>setUnits(+e.target.value)} style={{marginBottom:16}}/></>}
        <Label>Number of Floors</Label>
        <Input type="number" value={floors} onChange={e=>setFloors(+e.target.value)} style={{marginBottom:20}}/>
        <button onClick={calc} style={{width:"100%",background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>💧 Calculate Water Demand</button>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:"rgba(16,185,129,0.06)",border:`1.5px solid rgba(16,185,129,0.3)`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>AVERAGE DAILY DEMAND</div>
            <div style={{fontSize:36,fontWeight:900,color:SC}}>{result.avg_lpd.toFixed(0)} <span style={{fontSize:16,fontWeight:400}}>L/day</span></div>
          </Card>
          {[{l:"Total occupants",v:`${result.count}`},{l:"Average daily demand",v:`${result.avg_lpd.toFixed(0)} L/day`,h:true},{l:"Average flow",v:`${result.avg_lps.toFixed(3)} L/s`},{l:"Peak demand",v:`${result.peak_lps.toFixed(3)} L/s`,h:true},{l:"Ground storage (12hr)",v:`${result.storage_L.toFixed(0)} L`,h:true},{l:"Roof tank (6hr)",v:`${result.roof_L.toFixed(0)} L`},{l:"Pressure zones",v:`${Math.ceil(floors/5)}`}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.h?`rgba(16,185,129,0.08)`:T.dim,borderRadius:8,border:r.h?`1px solid rgba(16,185,129,0.2)`:"none"}}><span style={{fontSize:13,color:T.muted}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.h?SC:T.text,fontFamily:"monospace"}}>{r.v}</span></div>)}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>NPC 2000 Sec. 6 · LWUA standards · 1 pressure zone per 5 floors</div>
        </div>
      ):(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}><div style={{fontSize:48}}>💧</div><div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter building data<br/>and click Calculate</div></Card>
      )}
    </div>
  );
}

// ─── SANICODE: PRESSURE LOSS ──────────────────────────────────────────────────
function PressureLoss() {
  const [flow,setFlow]=useState(1.5);
  const [dia,setDia]=useState(50);
  const [len,setLen]=useState(20);
  const [fitK,setFitK]=useState(5);
  const [elev,setElev]=useState(5);
  const [result,setResult]=useState(null);
  const calc=()=>{
    const d=dia/1000,A=Math.PI*d*d/4,V=flow/1000/A;
    const Re=V*d/1e-6;
    const f=Re<2300?64/Re:0.3164/Math.pow(Re,0.25);
    const hf=f*(len/d)*(V*V/(2*9.81));
    const hm=fitK*(V*V/(2*9.81));
    const htotal=hf+hm+elev;
    const status=V>=0.6&&V<=3.0?"GOOD VELOCITY":"CHECK VELOCITY";
    setResult({V,Re,f,hf,hm,he:elev,htotal,status});
  };
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Flow Rate (L/s)</Label><Input type="number" value={flow} onChange={e=>setFlow(+e.target.value)} step="0.1" style={{marginBottom:16}}/>
        <Label>Pipe Diameter (mm)</Label>
        <Select value={dia} onChange={e=>setDia(+e.target.value)} style={{marginBottom:16}}>{[13,19,25,32,38,50,63,75,100,150,200].map(d=><option key={d} value={d}>{d}mm</option>)}</Select>
        <Label>Pipe Length (m)</Label><Input type="number" value={len} onChange={e=>setLen(+e.target.value)} style={{marginBottom:16}}/>
        <Label>Sum of Minor Loss Coefficients K</Label><Input type="number" value={fitK} onChange={e=>setFitK(+e.target.value)} step="0.5" style={{marginBottom:8}}/>
        <div style={{fontSize:11,color:T.muted,marginBottom:16}}>Elbow=1.5 · Tee=2.0 · Gate valve=0.2 · Check valve=3.0</div>
        <Label>Elevation Change (m, + upward)</Label><Input type="number" value={elev} onChange={e=>setElev(+e.target.value)} step="0.5" style={{marginBottom:20}}/>
        <button onClick={calc} style={{width:"100%",background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>⬆️ Calculate Pressure Loss</button>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:result.status==="GOOD VELOCITY"?"rgba(16,185,129,0.06)":"rgba(245,158,11,0.06)",border:`1.5px solid ${result.status==="GOOD VELOCITY"?"rgba(16,185,129,0.3)":"rgba(245,158,11,0.3)"}`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>TOTAL HEAD LOSS</div>
            <div style={{fontSize:42,fontWeight:900,color:result.status==="GOOD VELOCITY"?SC:T.warn}}>{result.htotal.toFixed(2)} <span style={{fontSize:18,fontWeight:400}}>m</span></div>
            <div style={{fontSize:13,color:T.muted,marginTop:4}}>{result.V.toFixed(2)} m/s — {result.status}</div>
          </Card>
          {[{l:"Flow velocity",v:`${result.V.toFixed(3)} m/s`,h:true},{l:"Reynolds number",v:result.Re.toFixed(0)},{l:"Friction factor",v:result.f.toFixed(5)},{l:"Friction loss hf",v:`${result.hf.toFixed(3)} m`},{l:"Minor losses hm",v:`${result.hm.toFixed(3)} m`},{l:"Elevation he",v:`${result.he.toFixed(2)} m`},{l:"Total head loss",v:`${result.htotal.toFixed(3)} m`,h:true}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.h?`rgba(16,185,129,0.08)`:T.dim,borderRadius:8,border:r.h?`1px solid rgba(16,185,129,0.2)`:"none"}}><span style={{fontSize:13,color:T.muted}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.h?SC:T.text,fontFamily:"monospace"}}>{r.v}</span></div>)}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>Darcy-Weisbach · Blasius friction factor · NPC 2000 Sec. 6</div>
        </div>
      ):(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}><div style={{fontSize:48}}>⬆️</div><div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter pipe parameters<br/>and click Calculate</div></Card>
      )}
    </div>
  );
}

// ─── SANICODE: STORM DRAINAGE ─────────────────────────────────────────────────
function StormDrainage() {
  const [area,setArea]=useState(500);
  const [runoff,setRunoff]=useState(0.85);
  const [intensity,setIntensity]=useState(100);
  const [slope,setSlope]=useState(0.005);
  const [result,setResult]=useState(null);
  const RUNOFF={"Roof / Concrete (0.90)":0.90,"Asphalt pavement (0.85)":0.85,"Gravel / compacted (0.60)":0.60,"Lawns / grass (0.35)":0.35,"Mixed residential (0.55)":0.55};
  const calc=()=>{
    const Q=runoff*intensity*area/3600000;
    const Q_lps=Q*1000;
    let dia_m=0.1;
    for(let i=0;i<50;i++){const r=dia_m/4,A=Math.PI*dia_m*dia_m/4,Qfull=(1/0.013)*A*Math.pow(r,2/3)*Math.pow(slope,0.5);if(Qfull>=Q)break;dia_m+=0.025;}
    const dia_mm=Math.ceil(dia_m*1000/25)*25;
    const r=dia_mm/4000,A=Math.PI*(dia_mm/1000)*(dia_mm/1000)/4;
    const V=(1/0.013)*Math.pow(r,2/3)*Math.pow(slope,0.5);
    const Qcap=A*V*1000;
    setResult({Q_lps,dia_mm,V,Qcap});
  };
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <Label>Drainage Area (m²)</Label><Input type="number" value={area} onChange={e=>setArea(+e.target.value)} style={{marginBottom:16}}/>
        <Label>Surface / Runoff Coefficient C</Label>
        <Select value={runoff} onChange={e=>setRunoff(+e.target.value)} style={{marginBottom:16}}>{Object.entries(RUNOFF).map(([k,v])=><option key={k} value={v}>{k}</option>)}</Select>
        <Label>Rainfall Intensity (mm/hr)</Label><Input type="number" value={intensity} onChange={e=>setIntensity(+e.target.value)} style={{marginBottom:8}}/>
        <div style={{fontSize:11,color:T.muted,marginBottom:16}}>Metro Manila ≈ 100mm/hr · Visayas/Mindanao ≈ 80-120mm/hr</div>
        <Label>Storm Drain Slope (m/m)</Label>
        <Select value={slope} onChange={e=>setSlope(+e.target.value)} style={{marginBottom:20}}>
          <option value={0.003}>0.3% minimum</option><option value={0.005}>0.5% recommended</option><option value={0.01}>1.0%</option><option value={0.02}>2.0%</option>
        </Select>
        <button onClick={calc} style={{width:"100%",background:`linear-gradient(135deg,${SC},#059669)`,border:"none",color:"#fff",fontWeight:700,fontSize:15,padding:"13px",borderRadius:12,cursor:"pointer"}}>🌊 Size Storm Drain</button>
      </Card>
      {result?(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:"rgba(16,185,129,0.06)",border:`1.5px solid rgba(16,185,129,0.3)`}}>
            <div style={{fontSize:11,color:T.muted,marginBottom:4}}>STORM DRAIN SIZE</div>
            <div style={{fontSize:48,fontWeight:900,color:SC}}>{result.dia_mm} <span style={{fontSize:18,fontWeight:400}}>mm dia.</span></div>
            <div style={{fontSize:13,color:T.muted,marginTop:4}}>Capacity: {result.Qcap.toFixed(1)} L/s @ {result.V.toFixed(2)} m/s</div>
          </Card>
          {[{l:"Design flow Q",v:`${result.Q_lps.toFixed(2)} L/s`,h:true},{l:"Required pipe dia.",v:`${result.dia_mm}mm`,h:true},{l:"Pipe capacity",v:`${result.Qcap.toFixed(1)} L/s`},{l:"Flow velocity",v:`${result.V.toFixed(2)} m/s`}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:r.h?`rgba(16,185,129,0.08)`:T.dim,borderRadius:8,border:r.h?`1px solid rgba(16,185,129,0.2)`:"none"}}><span style={{fontSize:13,color:T.muted}}>{r.l}</span><span style={{fontSize:14,fontWeight:700,color:r.h?SC:T.text,fontFamily:"monospace"}}>{r.v}</span></div>)}
          <div style={{padding:"10px 14px",background:T.dim,borderRadius:8,fontSize:11,color:T.muted,lineHeight:1.6}}>Rational Method Q=CiA · Manning n=0.013 · NPC 2000 Sec. 11</div>
        </div>
      ):(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,opacity:0.5}}><div style={{fontSize:48}}>🌊</div><div style={{fontSize:14,color:T.muted,textAlign:"center"}}>Enter catchment data<br/>and click Size Storm Drain</div></Card>
      )}
    </div>
  );
}

// ─── SANICODE: MAIN WRAPPER ───────────────────────────────────────────────────
// ─── ELECCODE: MAIN ELECTRICAL MODULE ───────────────────────────────────────

// ─── PANEL SCHEDULE BUILDER ──────────────────────────────────────────────────
function PanelScheduleBuilder({ electricalData, calcState, onStateChange }) {
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
  useEffect(() => {
    if (!ed || Object.keys(ed).length === 0) return;
    if (ed.panelName   != null) { setPanelName(ed.panelName);                   setFp(p=>({...p,panelName:true})); }
    if (ed.voltage     != null) { setPanelVolt(+ed.voltage);                    setFp(p=>({...p,voltage:true})); }
    if (ed.phases      != null) { setPanelPhase(ed.phases===3?"3":"1");         setFp(p=>({...p,phases:true})); }
    if (ed.mainBreaker != null) { setMainBreaker(+ed.mainBreaker);              setFp(p=>({...p,mainBreaker:true})); }
    if (ed.busRating   != null) { setBusRating(+ed.busRating);                  setFp(p=>({...p,busRating:true})); }
    if (ed.circuits?.length)    {
      setCircuits(ed.circuits.map((c,i)=>({
        id:i+1, num:i*2+1, phase:c.phase||PHASES[i%3]||"A",
        desc:c.desc||"", type:c.type||"Lighting",
        poles:c.poles||1, va:c.va||0, amps:(c.va||0)/(ed.voltage||230),
        breaker:20, wire:"12", notes:"",
      })));
      setFp(p=>({...p,circuits:true}));
    }
  }, [electricalData]);
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

  const [conduitType, setConduitType] = useState(init.conduitType ?? ed.conduitType ?? "RSC/IMC");
  const [conduitSize, setConduitSize] = useState(init.conduitSize ?? ed.conduitSize ?? "3/4\"");
  const [conductors,  setConductors]  = useState(() => {
    if (init.conductors) return init.conductors;
    if (ed.conductors?.length) return ed.conductors.map((c,i)=>({id:i+1, size:String(c.size||"12"), qty:+(c.qty||1), type:c.type||"THWN"}));
    return [{ id:1, size:"12", qty:3, type:"THWN" }];
  });
  const [fp, setFp] = useState({
    conduitType: !!ed.conduitType, conduitSize: !!ed.conduitSize, conductors: !!(ed.conductors?.length),
  });
  useEffect(() => {
    if (!ed || Object.keys(ed).length === 0) return;
    if (ed.conduitType != null) { setConduitType(ed.conduitType); setFp(p=>({...p,conduitType:true})); }
    if (ed.conduitSize != null) { setConduitSize(ed.conduitSize); setFp(p=>({...p,conduitSize:true})); }
    if (ed.conductors?.length)  {
      setConductors(ed.conductors.map((c,i)=>({id:i+1,size:String(c.size||"12"),qty:+(c.qty||1),type:c.type||"THWN"})));
      setFp(p=>({...p,conductors:true}));
    }
  }, [electricalData]);
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
function AmpacityDerating({ electricalData, calcState, onStateChange }) {
  const ACCENT = "#ff6b2b";
  const ed   = electricalData?.ampacity || {};
  const init = calcState || {};

  // Base ampacity tables per PEC 2017 Table 3.10 (THWN 75°C Cu in conduit)
  // Already in WIRE_DATA but we need separate insulation tables
  const BASE_AMPACITY = {
    // size: { TW_60: A, THWN_75: A, XHHW_90: A }
    14:    { TW_60:15,  THWN_75:20,  XHHW_90:25  },
    12:    { TW_60:20,  THWN_75:25,  XHHW_90:30  },
    10:    { TW_60:30,  THWN_75:35,  XHHW_90:40  },
    8:     { TW_60:40,  THWN_75:50,  XHHW_90:55  },
    6:     { TW_60:55,  THWN_75:65,  XHHW_90:75  },
    4:     { TW_60:70,  THWN_75:85,  XHHW_90:95  },
    3:     { TW_60:85,  THWN_75:100, XHHW_90:110 },
    2:     { TW_60:95,  THWN_75:115, XHHW_90:130 },
    1:     { TW_60:110, THWN_75:130, XHHW_90:145 },
    "1/0": { TW_60:125, THWN_75:150, XHHW_90:170 },
    "2/0": { TW_60:145, THWN_75:175, XHHW_90:195 },
    "3/0": { TW_60:165, THWN_75:200, XHHW_90:225 },
    "4/0": { TW_60:195, THWN_75:230, XHHW_90:260 },
    250:   { TW_60:215, THWN_75:255, XHHW_90:290 },
    300:   { TW_60:240, THWN_75:285, XHHW_90:320 },
    350:   { TW_60:260, THWN_75:310, XHHW_90:350 },
    400:   { TW_60:280, THWN_75:335, XHHW_90:380 },
    500:   { TW_60:320, THWN_75:380, XHHW_90:430 },
  };

  // Temperature correction factors (PEC Table 3.10 Notes)
  // For ambient temps above 30°C (base)
  const TEMP_FACTORS = {
    TW_60:   { 21:1.08,26:1.00,31:0.91,36:0.82,41:0.71,46:0.58,51:0.41 },
    THWN_75: { 21:1.05,26:1.00,31:0.94,36:0.88,41:0.82,46:0.75,51:0.67,56:0.58,61:0.33 },
    XHHW_90: { 21:1.04,26:1.00,31:0.96,36:0.91,41:0.87,46:0.82,51:0.76,56:0.71,61:0.65,66:0.58,71:0.50 },
  };

  // Conduit fill adjustment factors (PEC Table 3.13)
  const FILL_FACTORS = {
    1:1.00, 2:1.00, 3:1.00, 4:0.80, 5:0.80, 6:0.80,
    7:0.70, 8:0.70, 9:0.70, 10:0.70, 11:0.70, 12:0.70,
    13:0.70, 14:0.70, 15:0.70, 16:0.70, 17:0.70, 18:0.70,
    19:0.70, 20:0.50,
  };
  const getFillFactor = n => n >= 20 ? 0.50 : FILL_FACTORS[n] || 0.70;

  const INS_TYPES = [
    { key:"TW_60",   label:"TW (60°C)",   maxTemp:60  },
    { key:"THWN_75", label:"THWN (75°C)", maxTemp:75  },
    { key:"XHHW_90", label:"XHHW (90°C)", maxTemp:90  },
  ];

  const [wireSize,    setWireSize]    = useState(init.wireSize    ?? ed.wireSize    ?? 12);
  const [insulation,  setInsulation]  = useState(init.insulation  ?? ed.insulation  ?? "THWN_75");
  const [ambient,     setAmbient]     = useState(init.ambient     ?? ed.ambient     ?? 30);
  const [numWires,    setNumWires]    = useState(init.numWires    ?? ed.numWires    ?? 3);
  const [material,    setMaterial]    = useState(init.material    ?? ed.material    ?? "copper");
  const [loadCurrent, setLoadCurrent] = useState(init.loadCurrent ?? ed.loadCurrent ?? 20);
  const [fp, setFp] = useState({
    wireSize: !!ed.wireSize, insulation: !!ed.insulation, ambient: ed.ambient != null,
    numWires: ed.numWires != null, loadCurrent: ed.loadCurrent != null,
  });
  useEffect(() => {
    if (!ed || Object.keys(ed).length === 0) return;
    if (ed.wireSize    != null) { setWireSize(ed.wireSize);          setFp(p=>({...p,wireSize:true})); }
    if (ed.insulation  != null) { setInsulation(ed.insulation);      setFp(p=>({...p,insulation:true})); }
    if (ed.ambient     != null) { setAmbient(+ed.ambient);           setFp(p=>({...p,ambient:true})); }
    if (ed.numWires    != null) { setNumWires(+ed.numWires);         setFp(p=>({...p,numWires:true})); }
    if (ed.material    != null) { setMaterial(ed.material); }
    if (ed.loadCurrent != null) { setLoadCurrent(+ed.loadCurrent);   setFp(p=>({...p,loadCurrent:true})); }
  }, [electricalData]);
  useEffect(() => {
    if (onStateChange) onStateChange({ wireSize, insulation, ambient, numWires, material, loadCurrent });
  }, [wireSize, insulation, ambient, numWires, material, loadCurrent]);

  const insTempKey  = Object.keys(TEMP_FACTORS).find(k=>k===insulation) || "THWN_75";
  const tempFactors = TEMP_FACTORS[insTempKey] || {};

  // Get nearest temp factor key
  const getTF = (amb) => {
    const keys = Object.keys(tempFactors).map(Number).sort((a,b)=>a-b);
    let best = keys[0];
    for (const k of keys) { if (k <= amb) best = k; }
    return tempFactors[best] || 1.0;
  };

  const baseAmp     = (BASE_AMPACITY[wireSize]?.[insulation] || 0) * (material==="aluminum" ? 0.84 : 1);
  const tempFactor  = getTF(ambient);
  const fillFactor  = getFillFactor(numWires);
  const deratedAmp  = baseAmp * tempFactor * fillFactor;
  const ok          = deratedAmp >= loadCurrent;
  const utilPct     = deratedAmp > 0 ? (loadCurrent / deratedAmp * 100) : 0;

  // Recommend minimum wire size
  const recWire = () => {
    for (const size of AWG_SIZES) {
      const base = (BASE_AMPACITY[size]?.[insulation]||0) * (material==="aluminum"?0.84:1);
      const derated = base * tempFactor * fillFactor;
      if (derated >= loadCurrent) return { size, derated };
    }
    return null;
  };
  const rec = recWire();

  // Full table for all wire sizes
  const tableRows = AWG_SIZES.map(sz=>{
    const base    = (BASE_AMPACITY[sz]?.[insulation]||0) * (material==="aluminum"?0.84:1);
    const derated = base * tempFactor * fillFactor;
    const isCurrent = String(sz) === String(wireSize);
    return { sz, base, derated, isCurrent };
  });

  const ambientOptions = [21,26,30,31,36,41,46,51,56,61].filter(t=>{
    const ins = INS_TYPES.find(i=>i.key===insulation);
    return t <= (ins?.maxTemp || 90);
  });

  return (
    <div>
      <p style={{color:T.muted,fontSize:13,margin:"0 0 20px"}}>
        Apply temperature and conduit fill derating to conductor ampacity per <strong style={{color:T.text}}>PEC 2017 Table 3.10 & 3.13</strong>.
      </p>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14,marginBottom:24}}>
        <div><Label>Wire Size (AWG)</Label>
          <Select value={wireSize} onChange={e=>setWireSize(e.target.value)}>
            {AWG_SIZES.map(s=><option key={s} value={s}>{s} AWG</option>)}
          </Select></div>
        <div><Label>Insulation Type</Label>
          <Select value={insulation} onChange={e=>setInsulation(e.target.value)}>
            {INS_TYPES.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}
          </Select></div>
        <div><Label>Material</Label>
          <Select value={material} onChange={e=>setMaterial(e.target.value)}>
            <option value="copper">Copper (Cu)</option>
            <option value="aluminum">Aluminum (Al) −16%</option>
          </Select></div>
        <div><Label>Ambient Temperature (°C)</Label>
          <Select value={ambient} onChange={e=>setAmbient(+e.target.value)}>
            {ambientOptions.map(t=><option key={t} value={t}>{t}°C {t===30?"(Base)":t>35?"(Hot)":""}</option>)}
          </Select></div>
        <div><Label>Conductors in Conduit</Label>
          <Input type="number" value={numWires} min={1} max={30} onChange={e=>setNumWires(Math.min(30,+e.target.value))}/></div>
        <div><Label>Load Current (A)</Label>
          <Input type="number" value={loadCurrent} min={1} onChange={e=>setLoadCurrent(+e.target.value)}/></div>
      </div>

      {/* Main results */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24,alignItems:"start"}}>
        {/* Visual result card */}
        <Card style={{padding:22}}>
          <Label>Derated Ampacity Result</Label>
          <div style={{marginTop:12,display:"flex",alignItems:"flex-end",gap:8}}>
            <div style={{fontSize:48,fontWeight:900,color:ok?T.success:T.danger,lineHeight:1,fontFamily:"monospace"}}>
              {deratedAmp.toFixed(1)}
            </div>
            <div style={{fontSize:18,color:T.muted,paddingBottom:6}}>A</div>
          </div>
          <div style={{marginTop:6,fontSize:12,color:T.muted}}>Derated ampacity for #{wireSize} AWG {material}</div>

          {/* Utilization bar */}
          <div style={{marginTop:16}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.muted,marginBottom:4}}>
              <span>Load Utilization</span>
              <span style={{fontWeight:700,color:ok?T.success:T.danger}}>{utilPct.toFixed(1)}%</span>
            </div>
            <div style={{background:T.border,borderRadius:99,height:10,overflow:"hidden"}}>
              <div style={{width:`${Math.min(utilPct,100)}%`,height:"100%",
                background:`linear-gradient(90deg,${ok?"#22c55e":"#ef4444"},${ok?"#16a34a":"#dc2626"})`,
                borderRadius:99,transition:"width 0.5s ease"}}/>
            </div>
            <div style={{marginTop:8,fontSize:12,fontWeight:700,color:ok?T.success:T.danger,padding:"6px 12px",borderRadius:8,background:ok?"rgba(34,197,94,0.08)":"rgba(239,68,68,0.08)",border:`1px solid ${ok?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.2)"}`}}>
              {ok ? `✓ Wire adequate — ${(deratedAmp-loadCurrent).toFixed(1)}A margin` : `✗ Insufficient — ${(loadCurrent-deratedAmp).toFixed(1)}A short`}
            </div>
          </div>
        </Card>

        {/* Derating breakdown */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Stat label="Base Ampacity"          value={baseAmp.toFixed(1)+" A"}    sub={`${insulation.replace("_"," ")} in conduit`}/>
          <Stat label="Temp. Correction Factor" value={"× "+tempFactor.toFixed(2)} sub={`Ambient ${ambient}°C`} color={tempFactor<1?T.warn:T.success}/>
          <Stat label="Conduit Fill Factor"     value={"× "+fillFactor.toFixed(2)} sub={`${numWires} conductor${numWires!==1?"s":""} in conduit`} color={fillFactor<1?T.warn:T.success}/>
          <div style={{background:T.dim,border:`1.5px solid ${T.border}`,borderRadius:12,padding:"14px 16px"}}>
            <Label>Formula</Label>
            <div style={{fontSize:12,color:T.muted,fontFamily:"monospace",lineHeight:1.8,marginTop:6}}>
              Derated = Base × T.F. × C.F.<br/>
              = {baseAmp.toFixed(1)} × {tempFactor.toFixed(2)} × {fillFactor.toFixed(2)}<br/>
              = <strong style={{color:ok?T.success:T.danger}}>{deratedAmp.toFixed(1)} A</strong>
            </div>
          </div>
          {!ok && rec && (
            <div style={{background:"rgba(245,158,11,0.08)",border:"1.5px solid rgba(245,158,11,0.3)",borderRadius:12,padding:"14px 16px"}}>
              <div style={{fontSize:11,color:T.warn,fontWeight:700,marginBottom:4}}>MINIMUM WIRE SIZE REQUIRED</div>
              <div style={{fontSize:20,fontWeight:800,color:T.warn}}>#{rec.size} AWG</div>
              <div style={{fontSize:11,color:T.muted,marginTop:2}}>Derated ampacity: {rec.derated.toFixed(1)}A</div>
            </div>
          )}
        </div>
      </div>

      {/* Wire size comparison table */}
      <Label>Full Wire Size Derating Table — {insulation.replace("_"," ")}, {ambient}°C ambient, {numWires} wires</Label>
      <div style={{overflowX:"auto",marginTop:10}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{background:T.dim}}>
              {["Wire Size","Base Ampacity","Temp Factor","Fill Factor","Derated Ampacity","Adequate for Load",""].map(h=>(
                <th key={h} style={{padding:"9px 12px",color:T.muted,fontWeight:700,fontSize:11,textTransform:"uppercase",textAlign:"left",borderBottom:`1px solid ${T.border}`}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map(({sz,base,derated,isCurrent})=>{
              const adequate = derated >= loadCurrent;
              return (
                <tr key={sz} style={{background:isCurrent?"rgba(255,107,43,0.06)":"transparent",borderBottom:`1px solid ${T.border}`,cursor:"pointer"}}
                  onClick={()=>setWireSize(sz)}>
                  <td style={{padding:"9px 12px",fontWeight:isCurrent?800:400,color:isCurrent?ACCENT:T.text}}>
                    {isCurrent?"▶ ":""}{sz} AWG{sz>=250?" kcmil":""}
                  </td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",color:T.muted}}>{base.toFixed(1)} A</td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",color:T.muted}}>{tempFactor.toFixed(2)}</td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",color:T.muted}}>{fillFactor.toFixed(2)}</td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",fontWeight:700,color:adequate?T.success:T.danger}}>{derated.toFixed(1)} A</td>
                  <td style={{padding:"9px 12px"}}>
                    <span style={{fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20,
                      background:adequate?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",
                      color:adequate?T.success:T.danger}}>
                      {adequate?"✓ YES":"✗ NO"}
                    </span>
                  </td>
                  <td style={{padding:"9px 12px",width:36}}/>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:12,padding:"10px 14px",background:"rgba(59,130,246,0.07)",border:"1px solid rgba(59,130,246,0.18)",borderRadius:10,fontSize:12,color:T.muted}}>
        ⚠️ Derating factors per PEC 2017. Aluminum values use 84% of copper ampacity. Always verify with licensed PEE before final design.
      </div>
    </div>
  );
}



// ─── RUN ELECTRICAL COMPUTATIONS ─────────────────────────────────────────────
function runElecComputations(electricalData, calcStates) {
  const ed  = electricalData || {};
  const cs  = calcStates    || {};
  const items = [];
  const ACCENT = "#ff6b2b";

  // ── Voltage Drop check ──
  const vd = cs.vdrop || {};
  if (vd.voltage != null && vd.current != null && vd.length != null && vd.wireSize != null) {
    const R_base = WIRE_DATA[vd.wireSize]?.resistance || WIRE_DATA[12].resistance;
    const R = vd.material === "aluminum" ? R_base * 1.64 : R_base;
    const X = 0.0492;
    const pf = +(vd.pf || 0.9);
    const angle = Math.acos(pf);
    const mult  = vd.phase === "three" ? Math.sqrt(3) : 2;
    const drop  = mult * vd.current * vd.length * (R * pf + X * Math.sin(angle)) / 1000;
    const pct   = (drop / vd.voltage) * 100;
    items.push({ tool:"vdrop", id:"Voltage Drop", value:`${pct.toFixed(2)}%`,
      detail:`${drop.toFixed(2)}V drop on #${vd.wireSize} AWG, ${vd.current}A, ${vd.length}m`,
      status: pct <= 3 ? "PASS" : pct <= 5 ? "WARNING" : "FAIL",
      numeric: pct, limit: 3, unit:"%" });
  }

  // ── Short Circuit check ──
  const sc = cs.fault || {};
  if (sc.voltage != null && sc.xfmrKVA != null && sc.xfmrZ != null) {
    const Zxfmr  = (sc.xfmrZ / 100) * ((sc.voltage * sc.voltage) / (sc.xfmrKVA * 1000));
    const R_cab  = (sc.material === "aluminum"
      ? (WIRE_DATA[sc.cableSize]?.resistance || 0.002061) * 1.64
      : WIRE_DATA[sc.cableSize]?.resistance || 0.002061) * (sc.cableLen || 15) * 2;
    const Ztot   = Math.sqrt((Zxfmr * 0.05 + R_cab) ** 2 + (Zxfmr * 0.95) ** 2);
    const Isc    = sc.voltage / (Math.sqrt(sc.phases === 3 ? 3 : 1) * Ztot);
    const fla    = sc.existingFLA || 20;
    const ratio  = Isc / fla;
    items.push({ tool:"fault", id:"Short Circuit", value:`${(Isc/1000).toFixed(2)} kA`,
      detail:`Isc=${(Isc/1000).toFixed(2)}kA, ratio=${ratio.toFixed(1)}× FLA`,
      status: ratio > 1 ? "PASS" : "FAIL",
      numeric: Isc, limit: null });
  }

  // ── Load Calc check ──
  const lc = cs.load || {};
  if (lc.loads?.length && lc.voltage) {
    const totalW  = lc.loads.reduce((s,l)=>s+(+(l.watts)||0)*(+(l.pct||100)/100),0);
    const demandF = lc.occupancy === "residential"
      ? (totalW <= 3000 ? 1 : (3000 + (Math.min(totalW,120000)-3000)*0.35) / totalW)
      : (totalW <= 10000 ? 1 : (10000 + (totalW-10000)*0.5) / totalW);
    const demandW = totalW * demandF;
    const amps    = demandW / (+(lc.voltage) || 230);
    items.push({ tool:"load", id:"Load Calculation", value:`${(demandW/1000).toFixed(2)} kVA`,
      detail:`${lc.loads.length} loads, demand=${(demandW/1000).toFixed(2)}kW, ${amps.toFixed(1)}A`,
      status: "COMPUTED", numeric: demandW });
  }

  // ── Panel Schedule check ──
  const ps = cs.panel || {};
  if (ps.circuits?.length) {
    const totalVA   = ps.circuits.reduce((s,c)=>s+(+(c.va)||0),0);
    const demandVA  = ps.occupancy === "residential"
      ? (totalVA<=3000 ? totalVA : 3000 + (Math.min(totalVA,120000)-3000)*0.35 + Math.max(0,totalVA-120000)*0.25)
      : (totalVA<=10000 ? totalVA : 10000 + (totalVA-10000)*0.5);
    const amps   = demandVA / (+(ps.panelVolt) || 230);
    const reqMain = Math.ceil(amps * 1.25 / 5) * 5;
    const mb     = +(ps.mainBreaker) || 100;
    const ok     = reqMain <= mb;
    items.push({ tool:"panel", id:"Panel Schedule", value:`${(totalVA/1000).toFixed(2)} kVA`,
      detail:`${ps.circuits.length} circuits, main=${mb}A, required=${reqMain}A`,
      status: ok ? "PASS" : "FAIL", numeric: totalVA });
  }

  // ── Conduit Fill check ──
  const cf = cs.conduit || {};
  if (cf.conductors?.length) {
    const COND_AREAS = { 14:8.97,12:11.68,10:16.77,8:24.26,6:37.16,4:52.84,3:62.77,2:73.16,1:95.03,
      "1/0":113.10,"2/0":133.77,"3/0":158.06,"4/0":192.52,250:225.81,300:264.52,350:298.45,400:345.35,500:411.55 };
    const COND_TABLE = {
      "RSC/IMC":{"1/2\"":{a:122.71},"3/4\"":{a:201.06},"1\"":{a:338.16},"1-1/4\"":{a:573.76},"1-1/2\"":{a:747.13},"2\"":{a:1194.59},"2-1/2\"":{a:1937.09},"3\"":{a:2848.06},"4\"":{a:5013.27}},
      "EMT":{"1/2\"":{a:90.97},"3/4\"":{a:163.87},"1\"":{a:283.53},"1-1/4\"":{a:484.54},"1-1/2\"":{a:637.94},"2\"":{a:1017.87},"2-1/2\"":{a:1649.55},"3\"":{a:2430.19},"4\"":{a:4268.22}},
      "PVC (Schedule 40)":{"1/2\"":{a:122.71},"3/4\"":{a:201.06},"1\"":{a:338.16},"1-1/4\"":{a:573.76},"1-1/2\"":{a:747.13},"2\"":{a:1194.59},"3\"":{a:2848.06},"4\"":{a:5013.27}},
    };
    const totalWires = cf.conductors.reduce((s,c)=>s+(+(c.qty)||1),0);
    const totalArea  = cf.conductors.reduce((s,c)=>s+(COND_AREAS[c.size]||0)*(+(c.qty)||1),0);
    const condArea   = COND_TABLE[cf.conduitType]?.[cf.conduitSize]?.a || 0;
    const fillPct    = condArea > 0 ? (totalArea / condArea * 100) : 0;
    const limit      = totalWires === 1 ? 53 : totalWires === 2 ? 31 : 40;
    items.push({ tool:"conduit", id:"Conduit Fill", value:`${fillPct.toFixed(1)}%`,
      detail:`${totalWires} wires in ${cf.conduitSize} ${cf.conduitType}, limit ${limit}%`,
      status: fillPct <= limit ? "PASS" : "FAIL",
      numeric: fillPct, limit });
  }

  // ── Ampacity Derating check ──
  const amp = cs.ampacity || {};
  if (amp.wireSize != null && amp.insulation != null) {
    const BASE = {
      14:{TW_60:15,THWN_75:20,XHHW_90:25},12:{TW_60:20,THWN_75:25,XHHW_90:30},10:{TW_60:30,THWN_75:35,XHHW_90:40},
      8:{TW_60:40,THWN_75:50,XHHW_90:55},6:{TW_60:55,THWN_75:65,XHHW_90:75},4:{TW_60:70,THWN_75:85,XHHW_90:95},
      3:{TW_60:85,THWN_75:100,XHHW_90:110},2:{TW_60:95,THWN_75:115,XHHW_90:130},1:{TW_60:110,THWN_75:130,XHHW_90:145},
      "1/0":{TW_60:125,THWN_75:150,XHHW_90:170},"2/0":{TW_60:145,THWN_75:175,XHHW_90:195},
      "3/0":{TW_60:165,THWN_75:200,XHHW_90:225},"4/0":{TW_60:195,THWN_75:230,XHHW_90:260},
    };
    const TF = { TW_60:{21:1.08,26:1.00,31:0.91,36:0.82,41:0.71,46:0.58,51:0.41},
      THWN_75:{21:1.05,26:1.00,31:0.94,36:0.88,41:0.82,46:0.75,51:0.67,56:0.58,61:0.33},
      XHHW_90:{21:1.04,26:1.00,31:0.96,36:0.91,41:0.87,46:0.82,51:0.76,56:0.71,61:0.65,66:0.58,71:0.50} };
    const FF = {1:1,2:1,3:1,4:0.8,5:0.8,6:0.8,7:0.7,8:0.7,9:0.7};
    const ins = amp.insulation || "THWN_75";
    const tfs = TF[ins] || TF["THWN_75"];
    const keys = Object.keys(tfs).map(Number).sort((a,b)=>a-b);
    let best = keys[0]; for (const k of keys) { if (k <= (amp.ambient||30)) best = k; }
    const tf = tfs[best] || 1;
    const ff = (amp.numWires||3) >= 10 ? 0.7 : (amp.numWires||3) >= 7 ? 0.7 : (amp.numWires||3) >= 4 ? 0.8 : 1.0;
    const baseA  = (BASE[amp.wireSize]?.[ins] || 0) * (amp.material === "aluminum" ? 0.84 : 1);
    const derated = baseA * tf * ff;
    const loadA   = +(amp.loadCurrent) || 0;
    items.push({ tool:"ampacity", id:"Ampacity Derating", value:`${derated.toFixed(1)} A`,
      detail:`#${amp.wireSize} AWG ${ins}, derated=${derated.toFixed(1)}A, load=${loadA}A`,
      status: derated >= loadA && loadA > 0 ? "PASS" : derated >= loadA ? "COMPUTED" : "FAIL",
      numeric: derated });
  }

  const passCount = items.filter(i=>i.status==="PASS").length;
  const failCount = items.filter(i=>i.status==="FAIL").length;
  const warnCount = items.filter(i=>i.status==="WARNING").length;

  return { items, summary: { passCount, failCount, warnCount, totalRun: items.length } };
}

// ─── ELEC INTELLIGENCE PANEL ─────────────────────────────────────────────────
// ─── ELEC INTELLIGENCE PANEL ─────────────────────────────────────────────────
function ElecIntelligencePanel({ data, onClear, runState, elecResults, onRunAll, onNavigate }) {
  const ACCENT = "#ff6b2b";

  const sys = data?.system        || {};
  const vd  = data?.voltageDrop   || {};
  const sc  = data?.shortCircuit  || {};
  const lc  = data?.loadCalc      || {};
  const ps  = data?.panel         || {};
  const cf  = data?.conduit       || {};
  const amp = data?.ampacity      || {};

  const READINESS = [
    { key:"vdrop",    icon:"vdrop",    label:"Voltage Drop",      code:"PEC Art. 2.30",
      ok: !!(vd.voltage && vd.current && vd.wireSize),
      detail: vd.wireSize ? `#${vd.wireSize} AWG · ${vd.current}A · ${vd.length}m` : null,
      missing: !vd.voltage ? "No system voltage found" : !vd.current ? "No load current found" : "No wire size found" },
    { key:"fault",    icon:"fault",    label:"Short Circuit",     code:"PEC Art. 2.40",
      ok: !!(sc.voltage && sc.xfmrKVA),
      detail: sc.xfmrKVA ? `${sc.xfmrKVA}kVA xfmr · ${sc.xfmrZ||4}%Z` : null,
      missing: !sc.xfmrKVA ? "No transformer kVA found in plans" : "No system voltage" },
    { key:"load",     icon:"load",     label:"Load Calculator",   code:"PEC Art. 2.20",
      ok: !!(lc.loads?.length),
      detail: lc.loads?.length ? `${lc.loads.length} loads · ${lc.occupancy||"residential"}` : null,
      missing: "No load schedule found in plans" },
    { key:"panel",    icon:"panel",    label:"Panel Schedule",    code:"PEC Art. 2.20",
      ok: !!(ps.circuits?.length || ps.mainBreaker),
      detail: ps.circuits?.length ? `${ps.circuits.length} circuits · ${ps.mainBreaker||"?"}A main` : ps.mainBreaker ? `${ps.mainBreaker}A main breaker` : null,
      missing: "No panelboard schedule found in plans" },
    { key:"conduit",  icon:"conduit",  label:"Conduit Fill",      code:"PEC Art. 3.50",
      ok: !!(cf.conductors?.length),
      detail: cf.conductors?.length ? `${cf.conductors.reduce((s,c)=>s+(+c.qty||1),0)} conductors in ${cf.conduitSize||"?"} ${cf.conduitType||""}` : null,
      missing: "No conduit schedule found in plans" },
    { key:"ampacity", icon:"ampacity", label:"Ampacity Derating", code:"PEC Table 3.10",
      ok: !!(amp.wireSize && amp.loadCurrent),
      detail: amp.wireSize ? `#${amp.wireSize} AWG · ${amp.loadCurrent}A load · ${amp.ambient||30}°C` : null,
      missing: !amp.wireSize ? "No conductor size found" : "No load current found" },
  ];

  const readyCount = READINESS.filter(r=>r.ok).length;

  const getResult = (key) => elecResults?.items.find(i => i.tool === key);
  const statusCfg = {
    PASS:     { bg:"rgba(34,197,94,0.12)",  color:"#22c55e", border:"rgba(34,197,94,0.3)",  label:"✓ PASS"     },
    FAIL:     { bg:"rgba(239,68,68,0.12)",  color:"#ef4444", border:"rgba(239,68,68,0.3)",  label:"✗ FAIL"     },
    WARNING:  { bg:"rgba(245,158,11,0.12)", color:"#f59e0b", border:"rgba(245,158,11,0.3)", label:"⚠ WARNING"  },
    COMPUTED: { bg:"rgba(6,150,215,0.12)",  color:"#0696d7", border:"rgba(6,150,215,0.3)",  label:"✓ COMPUTED" },
  };

  return (
    <div style={{marginBottom:16,background:T.card,border:`1.5px solid rgba(255,107,43,0.25)`,borderRadius:14,overflow:"hidden"}}>

      {/* ── Header ── */}
      <div style={{padding:"14px 18px",background:"linear-gradient(135deg,rgba(255,107,43,0.07),rgba(255,107,43,0.03))",
        borderBottom:`1px solid rgba(255,107,43,0.15)`,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#ff6b2b,#e85520)",
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Icon name="electrical" size={17} color="#fff"/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:800,fontSize:14,color:T.text}}>{sys.projectName||"Electrical Project"}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:1}}>
            {[sys.voltage&&`${sys.voltage}V`, sys.phases===3?"3φ":"1φ", sys.occupancy].filter(Boolean).join(" · ")}
          </div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
          {elecResults && (
            <>
              {elecResults.summary.passCount>0 && <span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:8,background:"rgba(34,197,94,0.12)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.25)"}}>✓ {elecResults.summary.passCount} Pass</span>}
              {elecResults.summary.failCount>0 && <span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:8,background:"rgba(239,68,68,0.12)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.25)"}}>✗ {elecResults.summary.failCount} Fail</span>}
              {elecResults.summary.warnCount>0 && <span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:8,background:"rgba(245,158,11,0.12)",color:"#f59e0b",border:"1px solid rgba(245,158,11,0.25)"}}>⚠ {elecResults.summary.warnCount} Warn</span>}
            </>
          )}
          <button onClick={onRunAll} disabled={readyCount===0||runState?.running}
            style={{padding:"8px 16px",borderRadius:9,border:"none",
              background:readyCount>0?`linear-gradient(135deg,${ACCENT},#e85520)`:"rgba(100,116,139,0.2)",
              color:readyCount>0?"#fff":"#64748b",cursor:readyCount>0?"pointer":"not-allowed",
              fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
            {runState?.running
              ? <><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span> Running…</>
              : `▶ Run All Checks (${readyCount}/${READINESS.length})`}
          </button>
          <button onClick={onClear} title="Clear extracted data"
            style={{padding:"7px 10px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",
              color:T.muted,cursor:"pointer",fontSize:13}}>✕</button>
        </div>
      </div>

      {/* ── Calculator status grid — ALWAYS VISIBLE ── */}
      <div style={{padding:"14px 18px"}}>
        <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:12}}>
          Calculator Status — {readyCount} of {READINESS.length} populated from plans
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
          {READINESS.map(r => {
            const result = getResult(r.key);
            const hasSt  = !!result;
            const stCfg  = hasSt ? statusCfg[result.status] : null;
            const cardBorder = hasSt ? stCfg.border : r.ok ? "rgba(34,197,94,0.3)" : T.border;
            const cardBg     = hasSt ? stCfg.bg     : r.ok ? "rgba(34,197,94,0.04)" : "transparent";
            return (
              <button key={r.key} onClick={()=>onNavigate(r.key)}
                style={{background:cardBg,border:`1.5px solid ${cardBorder}`,borderRadius:10,
                  padding:"12px 14px",textAlign:"left",cursor:"pointer",transition:"all 0.15s",width:"100%"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=ACCENT;e.currentTarget.style.background="rgba(255,107,43,0.06)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=cardBorder;e.currentTarget.style.background=cardBg;}}>

                {/* Tool name row */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <Icon name={r.icon} size={13} color={hasSt?stCfg.color:r.ok?"#22c55e":T.muted}/>
                    <span style={{fontWeight:800,fontSize:12,color:T.text}}>{r.label}</span>
                  </div>
                  {/* Status badge */}
                  {hasSt ? (
                    <span style={{fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:6,
                      background:stCfg.bg,color:stCfg.color,border:`1px solid ${stCfg.border}`}}>
                      {stCfg.label}
                    </span>
                  ) : r.ok ? (
                    <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:6,
                      background:"rgba(34,197,94,0.1)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.2)"}}>
                      📥 DATA READY
                    </span>
                  ) : (
                    <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:6,
                      background:"rgba(100,116,139,0.1)",color:T.muted,border:`1px solid ${T.border}`}}>
                      ⊘ NO DATA
                    </span>
                  )}
                </div>

                {/* Result value (after run) */}
                {result?.value && (
                  <div style={{fontSize:22,fontWeight:900,color:stCfg?.color||T.text,fontFamily:"monospace",lineHeight:1,marginBottom:4}}>
                    {result.value}
                  </div>
                )}

                {/* Detail or missing reason */}
                <div style={{fontSize:11,color:r.ok?T.muted:"#ef444480",lineHeight:1.4}}>
                  {result?.detail || (r.ok ? r.detail : `⚠ ${r.missing}`)}
                </div>

                {/* PEC reference */}
                <div style={{fontSize:10,color:"rgba(255,107,43,0.5)",marginTop:5,fontWeight:600}}>{r.code}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ELEC COMPUTATION SUMMARY ─────────────────────────────────────────────────
function ElecComputationSummary({ results, data, onNavigate }) {
  if (!results) return null;
  const ACCENT = "#ff6b2b";

  const statusCfg = {
    PASS:     { bg:"rgba(34,197,94,0.1)",  color:"#22c55e", border:"rgba(34,197,94,0.25)",  label:"✓ PASS"     },
    FAIL:     { bg:"rgba(239,68,68,0.1)",  color:"#ef4444", border:"rgba(239,68,68,0.25)",  label:"✗ FAIL"     },
    WARNING:  { bg:"rgba(245,158,11,0.1)", color:"#f59e0b", border:"rgba(245,158,11,0.25)", label:"⚠ WARNING"  },
    COMPUTED: { bg:"rgba(6,150,215,0.1)",  color:"#0696d7", border:"rgba(6,150,215,0.25)",  label:"✓ COMPUTED" },
  };
  const toolLabel = { vdrop:"Voltage Drop", fault:"Short Circuit", load:"Load Calc", panel:"Panel Schedule", conduit:"Conduit Fill", ampacity:"Ampacity Derating" };
  const toolCode  = { vdrop:"PEC Art. 2.30", fault:"PEC Art. 2.40", load:"PEC Art. 2.20", panel:"PEC Art. 2.20", conduit:"PEC Art. 3.50", ampacity:"PEC Table 3.10" };
  const toolIcon  = { vdrop:"vdrop", fault:"fault", load:"load", panel:"panel", conduit:"conduit", ampacity:"ampacity" };

  const { passCount, failCount, warnCount, totalRun } = results.summary;
  const projName = data?.system?.projectName || "Electrical Project";
  const overallOk = failCount === 0;

  const exportReport = () => {
    const w    = window.open("","_blank");
    const date = new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"});
    const rows = results.items.map(item => {
      const cfg = statusCfg[item.status] || {};
      return `<tr>
        <td style="font-weight:700">${toolLabel[item.tool]||item.tool}</td>
        <td style="font-family:monospace;font-size:11px;color:#64748b">${toolCode[item.tool]||""}</td>
        <td style="font-family:monospace;font-weight:800;font-size:15px">${item.value||"—"}</td>
        <td style="font-size:11px;color:#475569">${item.detail||"—"}</td>
        <td style="text-align:center"><span style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:800;
          background:${item.status==="PASS"?"#dcfce7":item.status==="FAIL"?"#fee2e2":item.status==="WARNING"?"#fef3c7":"#dbeafe"};
          color:${item.status==="PASS"?"#16a34a":item.status==="FAIL"?"#dc2626":item.status==="WARNING"?"#d97706":"#1d4ed8"}">
          ${item.status}</span></td>
      </tr>`;
    }).join("");
    w.document.write(`<!DOCTYPE html><html><head><title>Electrical Report — ${projName}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:32px;color:#111;font-size:13px}
      h1{color:#c2410c;margin:0;font-size:22px}
      .subtitle{color:#64748b;font-size:12px;margin:4px 0 20px}
      .summary-bar{display:flex;gap:12px;margin-bottom:20px}
      .badge{display:inline-block;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700}
      .pass{background:#dcfce7;color:#16a34a}.fail{background:#fee2e2;color:#dc2626}
      .warn{background:#fef3c7;color:#d97706}.info{background:#dbeafe;color:#1d4ed8}
      table{border-collapse:collapse;width:100%}
      th{background:#7c2d12;color:#fff;padding:9px 12px;font-size:11px;text-align:left;letter-spacing:0.5px}
      td{padding:9px 12px;border-bottom:1px solid #e2e8f0;vertical-align:middle}
      tr:hover td{background:#fafafa}
      .overall{padding:10px 16px;border-radius:8px;margin-bottom:20px;font-weight:700;font-size:14px}
      .overall.ok{background:#dcfce7;color:#16a34a;border:1px solid #bbf7d0}
      .overall.fail{background:#fee2e2;color:#dc2626;border:1px solid #fecaca}
      @media print{button{display:none}}
    </style></head><body>
    <button onclick="window.print()" style="float:right;padding:7px 18px;background:#c2410c;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700">🖨️ Print / Save PDF</button>
    <h1>ELECTRICAL COMPUTATION REPORT</h1>
    <div class="subtitle">Project: <b>${projName}</b> · ${date} · PEC 2017 · Generated by Buildify</div>
    <div class="overall ${overallOk?"ok":"fail"}">
      ${overallOk?"✓ ALL CHECKS PASSED — No critical issues found":"✗ ISSUES FOUND — Review failed checks before finalizing design"}
    </div>
    <div class="summary-bar">
      <span class="badge pass">✓ ${passCount} Pass</span>
      <span class="badge fail">✗ ${failCount} Fail</span>
      ${warnCount>0?`<span class="badge warn">⚠ ${warnCount} Warnings</span>`:""}
      <span class="badge info">${totalRun} checks run</span>
    </div>
    <table>
      <thead><tr><th>Calculator</th><th>Code Reference</th><th>Result</th><th>Details</th><th style="text-align:center">Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:24px;font-size:10px;color:#9ca3af;border-top:1px solid #e2e8f0;padding-top:12px">
      PRELIMINARY DESIGN ONLY — Verify all results with a licensed Professional Electrical Engineer (PEE) before construction.
      PEC 2017 · Buildify Engineering Suite
    </p>
    </body></html>`);
    w.document.close();
    setTimeout(()=>w.print(), 300);
  };

  return (
    <div style={{marginBottom:16,background:T.card,border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"14px 18px",background:overallOk?"rgba(34,197,94,0.05)":"rgba(239,68,68,0.05)",
        borderBottom:`1px solid ${overallOk?"rgba(34,197,94,0.15)":"rgba(239,68,68,0.15)"}`,
        display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontWeight:800,fontSize:14,color:T.text,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>{overallOk?"✅":"❌"}</span>
            Computation Summary — {projName}
          </div>
          <div style={{fontSize:11,color:T.muted,marginTop:2}}>
            {totalRun} checks run · {passCount} passed · {failCount} failed{warnCount>0?` · ${warnCount} warnings`:""}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {passCount>0 && <span style={{fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:8,background:"rgba(34,197,94,0.1)",color:"#22c55e"}}>✓ {passCount} Pass</span>}
          {failCount>0 && <span style={{fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:8,background:"rgba(239,68,68,0.1)",color:"#ef4444"}}>✗ {failCount} Fail</span>}
          {warnCount>0 && <span style={{fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:8,background:"rgba(245,158,11,0.1)",color:"#f59e0b"}}>⚠ {warnCount} Warn</span>}
          <button onClick={exportReport}
            style={{padding:"7px 15px",borderRadius:8,border:"none",
              background:"linear-gradient(135deg,#ff6b2b,#e85520)",color:"#fff",
              cursor:"pointer",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
            <Icon name="download" size={13} color="#fff"/> Export Report
          </button>
        </div>
      </div>

      {/* Result cards */}
      <div style={{padding:"14px 18px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
        {results.items.map(item => {
          const cfg = statusCfg[item.status] || statusCfg.COMPUTED;
          return (
            <button key={item.tool} onClick={()=>onNavigate(item.tool)}
              style={{background:cfg.bg,border:`1.5px solid ${cfg.border}`,borderRadius:10,padding:"14px 16px",
                textAlign:"left",cursor:"pointer",transition:"all 0.15s",width:"100%"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=cfg.color;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=cfg.border;}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <Icon name={toolIcon[item.tool]||"loads"} size={14} color={cfg.color}/>
                  <span style={{fontWeight:800,fontSize:12,color:T.text}}>{toolLabel[item.tool]||item.tool}</span>
                </div>
                <span style={{fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:6,
                  background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`}}>{cfg.label}</span>
              </div>
              <div style={{fontSize:26,fontWeight:900,color:cfg.color,fontFamily:"monospace",lineHeight:1,marginBottom:6}}>
                {item.value||"—"}
              </div>
              <div style={{fontSize:11,color:T.muted,lineHeight:1.4}}>{item.detail}</div>
              <div style={{fontSize:10,color:"rgba(255,107,43,0.5)",marginTop:6,fontWeight:600}}>{toolCode[item.tool]} · Open calculator →</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}



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
      if (!s?.checkerResult?.summary?.projectName) return;
      setCheckerResult(s.checkerResult);
      if (s.electricalData) setElectricalData(s.electricalData);
      if (s.elecResults)    setElecResults(s.elecResults);
      if (s.runState)       setRunState(s.runState);
      if (s.calcStates)     setCalcStates(s.calcStates);
      if (s._mainTab)       setMainTab(s._mainTab);
    } catch {}
  };
  useEffect(() => { _loadElecSession(); }, []); // eslint-disable-line
  useEffect(() => { if (sessionTick > 0) _loadElecSession(); }, [sessionTick]); // eslint-disable-line
  const [calcTool, setCalcTool] = useState(null);

  const CALC_TOOLS = [
    { key:"vdrop",    icon:"vdrop",     label:"Voltage Drop",      code:"PEC Art. 2.30" },
    { key:"fault",    icon:"fault",     label:"Short Circuit",     code:"PEC Art. 2.40" },
    { key:"load",     icon:"load",      label:"Load Calculator",   code:"PEC Art. 2.20" },
    { key:"panel",    icon:"panel",     label:"Panel Schedule",    code:"PEC Art. 2.20" },
    { key:"conduit",  icon:"conduit",   label:"Conduit Fill",      code:"PEC Art. 3.50" },
    { key:"ampacity", icon:"ampacity",  label:"Ampacity Derating", code:"PEC Table 3.10" },
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

  const handleRunAll = async () => {
    setRunState({ running: true });
    setElecResults(null);
    await new Promise(r => setTimeout(r, 80));
    const results = runElecComputations(electricalData, calcStates);
    setElecResults(results);
    setRunState({ running: false });
    // Persist so session restore shows full computation package
    try {
      const cur = JSON.parse(localStorage.getItem("buildify_session_electrical") || "{}");
      localStorage.setItem("buildify_session_electrical", JSON.stringify({
        ...cur, elecResults: results, runState: { running: false }
      }));
    } catch {}
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
    return false;
  };

  const getCalcStatus = (key) => {
    if (!elecResults) return null;
    const item = elecResults.items.find(i => i.tool === key);
    if (!item) return null;
    if (item.status === "PASS" || item.status === "COMPUTED") return "pass";
    if (item.status === "FAIL") return "fail";
    if (item.status === "WARNING") return "warn";
    return null;
  };

  const SubToolStatus = ({ toolKey }) => {
    const st = getCalcStatus(toolKey);
    const hasDat = hasData(toolKey);
    if (st) {
      const cfg = {
        pass:["rgba(34,197,94,0.12)","#22c55e","rgba(34,197,94,0.25)","\u2713 PASS"],
        fail:["rgba(239,68,68,0.12)","#ef4444","rgba(239,68,68,0.25)","\u2717 FAIL"],
        warn:["rgba(245,158,11,0.12)","#f59e0b","rgba(245,158,11,0.25)","\u26a0 WARN"],
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
        ].map(t => {
          const active = mainTab === t.key;
          return (
            <button key={t.key} onClick={()=>setMainTab(t.key)}
              style={{display:"flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:10,
                border:`1.5px solid ${active?ACCENT:T.border}`,
                background:active?ACCENT_DIM:"transparent",
                color:active?ACCENT:T.muted,cursor:"pointer",fontSize:13,fontWeight:700,transition:"all 0.15s"}}>
              <Icon name={t.icon} size={14} color={active?ACCENT:T.muted}/>
              {t.label}
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
          {elecResults && (
            <ElecComputationSummary
              results={elecResults}
              data={electricalData}
              onNavigate={(key)=>{ setMainTab("tools"); setCalcTool(key); }}
            />
          )}
          <Card>
            <PlanChecker
              apiKey={apiKey}
              externalResult={checkerResult}
              onResultChange={setCheckerResult}
              onDataExtracted={handleDataExtracted}
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
                <div style={{display:calcTool==="vdrop"?"block":"none"}}>
                  <VoltageDropCalc    electricalData={electricalData} calcState={calcStates.vdrop}    onStateChange={s=>updateCalcState("vdrop",s)}/>
                </div>
                <div style={{display:calcTool==="fault"?"block":"none"}}>
                  <ShortCircuitCalc  electricalData={electricalData} calcState={calcStates.fault}    onStateChange={s=>updateCalcState("fault",s)}/>
                </div>
                <div style={{display:calcTool==="load"?"block":"none"}}>
                  <LoadCalc          electricalData={electricalData} calcState={calcStates.load}     onStateChange={s=>updateCalcState("load",s)}/>
                </div>
                <div style={{display:calcTool==="panel"?"block":"none"}}>
                  <PanelScheduleBuilder electricalData={electricalData} calcState={calcStates.panel} onStateChange={s=>updateCalcState("panel",s)}/>
                </div>
                <div style={{display:calcTool==="conduit"?"block":"none"}}>
                  <ConduitFillCalc   electricalData={electricalData} calcState={calcStates.conduit}  onStateChange={s=>updateCalcState("conduit",s)}/>
                </div>
                <div style={{display:calcTool==="ampacity"?"block":"none"}}>
                  <AmpacityDerating  electricalData={electricalData} calcState={calcStates.ampacity} onStateChange={s=>updateCalcState("ampacity",s)}/>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}




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
  structural: "buildify_session_structural",
  electrical: "buildify_session_electrical",
  sanitary:   "buildify_session_sanitary",
};

function _uuid() {
  // Simple UUID v4 — replaced by Supabase auto-id later
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const DB = {
  // ── History ──────────────────────────────────────────────────────────────
  loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
  },
  saveHistory(entries) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 200))); } catch {}
  },
  addHistoryEntry(entry) {
    const entries = DB.loadHistory();
    const id = _uuid();
    entries.unshift({
      ...entry,
      id,
      userId: "local",          // → replace with real user ID when Supabase lands
      timestamp: new Date().toISOString(),
    });
    DB.saveHistory(entries);
    window.dispatchEvent(new CustomEvent("buildify_history_update"));
    return id;
  },
  deleteHistoryEntry(id) {
    DB.saveHistory(DB.loadHistory().filter(e => e.id !== id));
    window.dispatchEvent(new CustomEvent("buildify_history_update"));
  },
  clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    // Also clear all module sessions
    Object.values(SESSION_KEYS).forEach(k => localStorage.removeItem(k));
    window.dispatchEvent(new CustomEvent("buildify_history_update"));
  },

  // ── Sessions ─────────────────────────────────────────────────────────────
  saveSession(module, payload) {
    try {
      const key = SESSION_KEYS[module];
      if (!key) return;
      localStorage.setItem(key, JSON.stringify({
        ...payload,
        _savedAt: new Date().toISOString(),
        _module:  module,
        userId:   "local",
      }));
    } catch(e) { console.warn("DB.saveSession failed", e); }
  },
  loadSession(module) {
    try {
      const key = SESSION_KEYS[module];
      if (!key) return null;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const s = JSON.parse(raw);
      // Validate — must have a real AI result, not a stale empty object
      if (!s?.checkerResult?.summary?.projectName && !s?.bomResult?.summary && !s?.estimateResult?.summary) {
        localStorage.removeItem(key); // purge corrupt session
        return null;
      }
      return s;
    } catch { return null; }
  },
  clearSession(module) {
    try {
      const key = SESSION_KEYS[module];
      if (key) localStorage.removeItem(key);
    } catch {}
  },
  hasSession(module) {
    try { return !!localStorage.getItem(SESSION_KEYS[module]); } catch { return false; }
  },
};

// ── Backwards-compat shims (so existing call sites don't break) ───────────
function loadHistory()             { return DB.loadHistory(); }
function saveHistory(e)            { return DB.saveHistory(e); }
function addHistoryEntry(entry)    { return DB.addHistoryEntry(entry); }
function deleteHistoryEntry(id)    { return DB.deleteHistoryEntry(id); }
function clearHistory()            { return DB.clearHistory(); }

// ─── DASHBOARD HOME ───────────────────────────────────────────────────────────
function DashboardHome({ onNavigate }) {
  const [history,          setHistory]          = useState(loadHistory());
  const [activeModule,     setActiveModule]     = useState("all");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const handler = () => setHistory(loadHistory());
    window.addEventListener("buildify_history_update", handler);
    return () => window.removeEventListener("buildify_history_update", handler);
  }, []);

  const GOLD = "#f59e0b";
  const fmtR    = n => (+n||0).toLocaleString("en-PH", { maximumFractionDigits:0 });
  const fmtDate = iso => {
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.floor((now - d) / 60000);
    if (diffMin < 1)   return "just now";
    if (diffMin < 60)  return `${diffMin}m ago`;
    if (diffMin < 1440)return `${Math.floor(diffMin/60)}h ago`;
    return d.toLocaleDateString("en-PH",{month:"short",day:"numeric"}) + " · " +
           d.toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"});
  };

  const MODULE_FILTERS = [
    { v:"all",        l:"All",        color:"#94a3b8" },
    { v:"structural", l:"Structural", color:"#0696d7" },
    { v:"electrical", l:"Electrical", color:"#ff6b2b" },
    { v:"sanitary",   l:"Sanitary",   color:"#06b6d4" },
  ];

  const TOOL_META = {
    bom:        { icon:"bom",      label:"BOM Review",        module:"structural", color:"#0696d7" },
    estimate:   { icon:"estimate", label:"Cost Estimator",    module:"structural", color:"#f59e0b" },
    structural: { icon:"checker",  label:"Structural Check",  module:"structural", color:"#0696d7" },
    seismic:    { icon:"seismic",  label:"Seismic Load",      module:"structural", color:"#0696d7" },
    beam:       { icon:"beam",     label:"Beam Design",       module:"structural", color:"#0696d7" },
    column:     { icon:"column",   label:"Column Design",     module:"structural", color:"#0696d7" },
    footing:    { icon:"footing",  label:"Footing Design",    module:"structural", color:"#0696d7" },
    slab:       { icon:"slab",     label:"Slab Design",       module:"structural", color:"#0696d7" },
    loads:      { icon:"loads",    label:"Load Combos",       module:"structural", color:"#0696d7" },
    electrical: { icon:"checker",  label:"Electrical Check",  module:"electrical", color:"#ff6b2b" },
    vdrop:      { icon:"vdrop",    label:"Voltage Drop",      module:"electrical", color:"#ff6b2b" },
    fault:      { icon:"fault",    label:"Short Circuit",     module:"electrical", color:"#ff6b2b" },
    load:       { icon:"loads",    label:"Load Calc",         module:"electrical", color:"#ff6b2b" },
    panel:      { icon:"panel",    label:"Panel Schedule",    module:"electrical", color:"#ff6b2b" },
    conduit:    { icon:"conduit",  label:"Conduit Fill",      module:"electrical", color:"#ff6b2b" },
    ampacity:   { icon:"ampacity", label:"Ampacity Derate",   module:"electrical", color:"#ff6b2b" },
    plumbing:   { icon:"checker",  label:"Plumbing Check",    module:"sanitary",   color:"#06b6d4" },
    fixture:    { icon:"fixture",  label:"Fixture Units",     module:"sanitary",   color:"#06b6d4" },
    pipe:       { icon:"pipe",     label:"Pipe Sizing",       module:"sanitary",   color:"#06b6d4" },
    septic:     { icon:"septic",   label:"Septic Tank",       module:"sanitary",   color:"#06b6d4" },
    water:      { icon:"water",    label:"Water Demand",      module:"sanitary",   color:"#06b6d4" },
    pressure:   { icon:"pressure", label:"Pressure Loss",     module:"sanitary",   color:"#06b6d4" },
    storm:      { icon:"storm",    label:"Storm Drainage",    module:"sanitary",   color:"#06b6d4" },
  };

  const filtered   = activeModule === "all" ? history : history.filter(e => e.module === activeModule);
  const recent3    = [...history].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)).slice(0,3);

  // Stats
  const totalRuns     = history.length;
  const bomReviews    = history.filter(e => e.tool === "bom").length;
  const estimates     = history.filter(e => e.tool === "estimate").length;
  const planChecks    = history.filter(e => ["electrical","structural","plumbing"].includes(e.tool)).length;
  const totalSavings  = history.filter(e=>e.tool==="bom"&&e.meta?.totalHigh).reduce((s,e)=>s+(e.meta.totalHigh||0),0);
  const totalEstimated= history.filter(e=>e.tool==="estimate"&&e.meta?.totalHigh).reduce((s,e)=>s+(e.meta.totalHigh||0),0);

  // Week-over-week trend
  const now   = Date.now();
  const week  = 7*24*60*60*1000;
  const thisW = history.filter(e=>now-new Date(e.timestamp)<week).length;
  const lastW = history.filter(e=>{ const a=now-new Date(e.timestamp); return a>=week&&a<2*week; }).length;
  const trend = thisW - lastW;

  const QUICK_LAUNCH = [
    { icon:"bom",      label:"BOM Review",       sub:"Upload plan + BOM",      module:"structural", tool:"bom",      color:"#0696d7", grad:"135deg,#0696d7,#0569a8", badge:"⭐ Flagship", hero:true },
    { icon:"estimate", label:"Cost Estimator",   sub:"Upload plan → estimate", module:"structural", tool:"estimate", color:"#f59e0b", grad:"135deg,#f59e0b,#f97316", badge:"AI" },
    { icon:"checker",  label:"Electrical Check", sub:"PEC 2017 compliance",    module:"electrical", tool:"checker",  color:"#ff6b2b", grad:"135deg,#ff6b2b,#e85520" },
    { icon:"checker",  label:"Structural Check", sub:"NSCP 2015 compliance",   module:"structural", tool:"checker",  color:"#0696d7", grad:"135deg,#0696d7,#0569a8" },
    { icon:"fixture",  label:"Plumbing Check",   sub:"NPC 2000 compliance",    module:"sanitary",   tool:"checker",  color:"#06b6d4", grad:"135deg,#06b6d4,#0891b2" },
    { icon:"vdrop",    label:"Voltage Drop",      sub:"PEC wire sizing",        module:"electrical", tool:"vdrop",    color:"#ff6b2b", grad:"135deg,#ff6b2b,#e85520" },
    { icon:"seismic",  label:"Seismic Load",      sub:"NSCP zone & base shear", module:"structural", tool:"seismic",  color:"#0696d7", grad:"135deg,#0696d7,#0569a8" },
    { icon:"water",    label:"Water Demand",      sub:"NPC fixture demand",     module:"sanitary",   tool:"water",    color:"#06b6d4", grad:"135deg,#06b6d4,#0891b2" },
  ];

  const STATUS_COLOR = { "COMPLIANT":"#10b981","COMPLIANT WITH WARNINGS":"#f59e0b","NON-COMPLIANT":"#ef4444" };

  const hero = QUICK_LAUNCH.find(q=>q.hero);
  const rest = QUICK_LAUNCH.filter(q=>!q.hero);

  return (
    <div style={{ animation:"fadeIn 0.3s ease" }}>

      {/* ── Greeting header ── */}
      {(() => {
        const hr = new Date().getHours();
        const greet = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
        return (
          <div style={{ marginBottom:24, display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontWeight:900, fontSize:24, color:T.text, letterSpacing:"-0.5px", marginBottom:3 }}>
                {greet} 👋
              </div>
              <div style={{ fontSize:13, color:T.muted }}>
                Your engineering workspace — {history.length > 0 ? `${history.length} run${history.length!==1?"s":""} logged` : "ready to go"}
              </div>
            </div>
            {history.length > 0 && (
              <div style={{ display:"flex", gap:8 }}>
                {[
                  { mod:"structural", color:"#0696d7", label:"Structural" },
                  { mod:"electrical", color:"#ff6b2b", label:"Electrical" },
                  { mod:"sanitary",   color:"#06b6d4", label:"Sanitary" },
                ].map(m => {
                  const cnt = history.filter(e=>e.module===m.mod).length;
                  if (!cnt) return null;
                  return (
                    <div key={m.mod} style={{ display:"flex", alignItems:"center", gap:5,
                      padding:"4px 10px", borderRadius:20,
                      background:`${m.color}12`, border:`1px solid ${m.color}30` }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:m.color, display:"inline-block" }}/>
                      <span style={{ fontSize:11, fontWeight:700, color:m.color }}>{cnt}</span>
                      <span style={{ fontSize:10, color:T.muted }}>{m.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Stats Row ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:10, marginBottom:24 }}>
        {[
          { icon:"loads",    label:"Total Runs",        value:totalRuns,               color:"#94a3b8", sub: trend>0?`↑${trend} this week`:trend<0?`↓${Math.abs(trend)} this week`:"—" },
          { icon:"bom",      label:"BOM Reviews",       value:bomReviews,              color:"#0696d7", sub:"structural" },
          { icon:"estimate", label:"Estimates Made",    value:estimates,               color:"#f59e0b", sub:"cost estimator" },
          { icon:"checker",  label:"Plan Checks",       value:planChecks,              color:"#8b5cf6", sub:"all modules" },
          { icon:"water",    label:"BOM Value Caught",  value:`₱${fmtR(totalSavings)}`,  color:"#22c55e", sub:"vs market rate" },
          { icon:"beam",     label:"Est. Project Value",value:`₱${fmtR(totalEstimated)}`, color:"#f97316", sub:"from estimator" },
        ].map(s => (
          <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px" }}>
            <div style={{ fontSize:9, color:T.muted, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:6, display:"flex", alignItems:"center", gap:5 }}>
              <Icon name={s.icon} size={11} color={s.color}/> {s.label}
            </div>
            <div style={{ fontSize:20, fontWeight:900, color:s.color, fontFamily:"monospace", letterSpacing:"-0.5px" }}>{s.value||0}</div>
            {s.sub && <div style={{ fontSize:10, color:trend>0&&s.label==="Total Runs"?"#22c55e":T.muted, marginTop:3, fontWeight:s.label==="Total Runs"&&trend!==0?700:400 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Recently Used ── */}
      {recent3.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:800, color:T.muted, textTransform:"uppercase", letterSpacing:"1px", marginBottom:12 }}>
            ⚡ Recently Used
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:10 }}>
            {recent3.map((entry, idx) => {
              const meta = TOOL_META[entry.tool] || { icon:"report", label:entry.tool, color:"#94a3b8" };
              return (
                <button key={entry.id} onClick={() => onNavigate(entry.module, entry.tool)}
                  style={{ background:T.card, border:`1.5px solid ${T.border}`, borderRadius:12,
                    padding:"14px 16px", cursor:"pointer", textAlign:"left", transition:"all 0.2s",
                    display:"flex", flexDirection:"column", gap:8, position:"relative", overflow:"hidden" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=meta.color;e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=`0 4px 20px ${meta.color}20`;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                  {/* Subtle color accent bar */}
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${meta.color},transparent)`, borderRadius:"12px 12px 0 0" }}/>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:30, height:30, borderRadius:8, background:`${meta.color}18`, border:`1.5px solid ${meta.color}35`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Icon name={meta.icon} size={15} color={meta.color}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:800, fontSize:12, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {entry.projectName || "Untitled Project"}
                      </div>
                      <div style={{ fontSize:10, color:T.muted }}>{meta.label}</div>
                    </div>
                    <span style={{ fontSize:10, color:T.muted, flexShrink:0 }}>{fmtDate(entry.timestamp)}</span>
                  </div>
                  {(entry.meta?.totalHigh || entry.meta?.findings || entry.meta?.status) && (
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {entry.meta?.status && <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:4, background:`${STATUS_COLOR[entry.meta.status]||"#94a3b8"}18`, color:STATUS_COLOR[entry.meta.status]||"#94a3b8" }}>{entry.meta.status}</span>}
                      {entry.meta?.totalHigh && <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:4, background:"rgba(16,185,129,0.1)", color:"#10b981", fontFamily:"monospace" }}>₱{fmtR(entry.meta.totalHigh)}</span>}
                      {entry.meta?.findings && <span style={{ fontSize:9, color:T.muted, padding:"2px 7px", borderRadius:4, background:`${T.border}` }}>{entry.meta.findings} findings</span>}
                    </div>
                  )}
                  <div style={{ fontSize:10, color:meta.color, fontWeight:700 }}>Resume →</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quick Launch ── */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:12, fontWeight:800, color:T.muted, textTransform:"uppercase", letterSpacing:"1px", marginBottom:12 }}>Quick Launch</div>

        {/* Hero card — BOM Review */}
        <button onClick={() => onNavigate(hero.module, hero.tool)}
          style={{ width:"100%", marginBottom:10, background:`linear-gradient(135deg,rgba(6,150,215,0.12),rgba(6,150,215,0.05))`,
            border:`1.5px solid rgba(6,150,215,0.35)`, borderRadius:14, padding:"20px 22px",
            cursor:"pointer", textAlign:"left", transition:"all 0.2s", display:"flex", alignItems:"center", gap:18 }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#0696d7";e.currentTarget.style.background="rgba(6,150,215,0.15)";e.currentTarget.style.transform="translateY(-1px)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(6,150,215,0.35)";e.currentTarget.style.background="linear-gradient(135deg,rgba(6,150,215,0.12),rgba(6,150,215,0.05))";e.currentTarget.style.transform="translateY(0)";}}>
          <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#0696d7,#0569a8)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 6px 20px rgba(6,150,215,0.35)" }}>
            <Icon name={hero.icon} size={26} color="#fff"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <div style={{ fontWeight:900, fontSize:17, color:T.text }}>{hero.label}</div>
              <span style={{ fontSize:9, background:"rgba(245,158,11,0.2)", color:GOLD, padding:"2px 7px", borderRadius:5, fontWeight:800 }}>{hero.badge}</span>
            </div>
            <div style={{ fontSize:12, color:T.muted }}>Cross-reference your bill of materials against AI market pricing. Catch under-estimations before they become losses.</div>
          </div>
          <div style={{ fontSize:13, color:"#0696d7", fontWeight:800, flexShrink:0 }}>Open →</div>
        </button>

        {/* Rest of tools — 4-column grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))", gap:10 }}>
          {rest.map(q => (
            <button key={q.label} onClick={() => onNavigate(q.module, q.tool)}
              style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px",
                cursor:"pointer", textAlign:"left", transition:"all 0.2s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=q.color;e.currentTarget.style.background=`${q.color}0d`;e.currentTarget.style.transform="translateY(-1px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.card;e.currentTarget.style.transform="translateY(0)";}}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(${q.grad})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 3px 10px ${q.color}30` }}>
                  <Icon name={q.icon} size={16} color="#fff"/>
                </div>
                <div style={{ fontWeight:800, fontSize:12, color:T.text }}>{q.label}</div>
                {q.badge && <span style={{ fontSize:8, background:"rgba(245,158,11,0.15)", color:GOLD, padding:"2px 5px", borderRadius:4, fontWeight:800, marginLeft:"auto" }}>{q.badge}</span>}
              </div>
              <div style={{ fontSize:10, color:T.muted, marginBottom:8 }}>{q.sub}</div>
              <div style={{ fontSize:10, color:q.color, fontWeight:700 }}>Open →</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── History ── */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:12, fontWeight:800, color:T.muted, textTransform:"uppercase", letterSpacing:"1px" }}>📂 History</div>
          <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
            {MODULE_FILTERS.map(f => (
              <button key={f.v} onClick={() => setActiveModule(f.v)}
                style={{ padding:"4px 10px", borderRadius:7, border:`1.5px solid ${activeModule===f.v?f.color:T.border}`,
                  background:activeModule===f.v?`${f.color}18`:"transparent",
                  color:activeModule===f.v?f.color:T.muted, cursor:"pointer", fontSize:10, fontWeight:700, transition:"all 0.15s" }}>
                {f.l}
              </button>
            ))}
            {history.length > 0 && (
              showClearConfirm
                ? <div style={{ display:"flex", gap:4 }}>
                    <button onClick={()=>{clearHistory();setShowClearConfirm(false);}} style={{ padding:"4px 10px", borderRadius:7, border:"1px solid #ef4444", background:"rgba(239,68,68,0.1)", color:"#ef4444", cursor:"pointer", fontSize:10, fontWeight:700 }}>Confirm Clear</button>
                    <button onClick={()=>setShowClearConfirm(false)} style={{ padding:"4px 10px", borderRadius:7, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, cursor:"pointer", fontSize:10 }}>Cancel</button>
                  </div>
                : <button onClick={()=>setShowClearConfirm(true)} style={{ padding:"4px 10px", borderRadius:7, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, cursor:"pointer", fontSize:10 }}>Clear All</button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"48px 24px", textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
            <div style={{ fontWeight:700, color:T.text, marginBottom:6, fontSize:15 }}>No history yet</div>
            <div style={{ fontSize:12, color:T.muted, marginBottom:20 }}>Run any tool and your results are saved automatically</div>
            <button onClick={()=>onNavigate("structural","bom")}
              style={{ padding:"9px 20px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#0696d7,#0569a8)", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700 }}>
              Start with BOM Review →
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {filtered.map(entry => {
              const meta = TOOL_META[entry.tool] || { icon:"report", label:entry.tool, color:"#94a3b8" };
              return (
                <div key={entry.id}
                  style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"12px 16px",
                    display:"flex", alignItems:"center", gap:12, transition:"all 0.15s" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=meta.color;e.currentTarget.style.background=`${meta.color}06`;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.card;}}>
                  <div style={{ width:34, height:34, borderRadius:9, background:`${meta.color}18`, border:`1.5px solid ${meta.color}40`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon name={meta.icon||"report"} size={16} color={meta.color}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                      <span style={{ fontWeight:800, fontSize:13, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{entry.projectName||"Untitled Project"}</span>
                      <span style={{ fontSize:9, background:`${meta.color}18`, color:meta.color, padding:"2px 6px", borderRadius:4, fontWeight:700, flexShrink:0 }}>{meta.label}</span>
                      {entry.meta?.status && <span style={{ fontSize:9, background:`${STATUS_COLOR[entry.meta.status]||"#94a3b8"}18`, color:STATUS_COLOR[entry.meta.status]||"#94a3b8", padding:"2px 6px", borderRadius:4, fontWeight:700, flexShrink:0 }}>{entry.meta.status}</span>}
                    </div>
                    <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
                      <span style={{ fontSize:10, color:T.muted }}>{fmtDate(entry.timestamp)}</span>
                      {entry.meta?.totalHigh && <span style={{ fontSize:10, color:"#10b981", fontWeight:700, fontFamily:"monospace" }}>₱{fmtR(entry.meta.totalHigh)}</span>}
                      {entry.meta?.findings  && <span style={{ fontSize:10, color:T.muted }}>{entry.meta.findings} findings</span>}
                      {entry.meta?.summary   && <span style={{ fontSize:10, color:T.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:280 }}>{entry.meta.summary}</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button onClick={()=>downloadHistoryReport(entry,meta)} title="Download Report"
                      style={{ padding:"5px 9px", borderRadius:7, border:`1px solid ${T.border}`, background:"rgba(6,150,215,0.08)", color:"#0696d7", cursor:"pointer", fontSize:10, display:"flex", alignItems:"center", gap:4, fontWeight:700 }}>
                      <Icon name="download" size={12} color="#0696d7"/> Report
                    </button>
                    <button onClick={()=>onNavigate(entry.module, entry.tool)} title="Open Tool"
                      style={{ padding:"5px 9px", borderRadius:7, border:`1px solid ${meta.color}40`, background:`${meta.color}10`, color:meta.color, cursor:"pointer", fontSize:10, fontWeight:700, display:"flex", alignItems:"center", gap:4 }}>
                      <Icon name="open" size={12} color={meta.color}/> Open
                    </button>
                    <button onClick={()=>deleteHistoryEntry(entry.id)} title="Delete"
                      style={{ padding:"5px 8px", borderRadius:7, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, cursor:"pointer", display:"flex", alignItems:"center" }}>
                      <Icon name="trash" size={12} color="#64748b"/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}




// ─── ROOT APP ────────────────────────────────────────────────────────────────
const TABS = [
  { key:"structural", icon:"structural", label:"Structural", color:"#0696d7" },
  { key:"electrical", icon:"electrical", label:"Electrical", color:"#ff6b2b" },
  { key:"sanitary",   icon:"sanitary",   label:"Sanitary",    color:"#06b6d4" },
];

// ─── AUTH CONFIG ─────────────────────────────────────────────────────────────
const ADMIN_USER = "admin";
const ADMIN_PASS = "PHEngSuite2025!";

// ─── LANDING PAGE ────────────────────────────────────────────────────────────
function LandingPage({ onLogin }) {
  const [showLogin, setShowLogin] = useState(false);
  const [scrollY,   setScrollY]   = useState(0);
  const [visible,   setVisible]   = useState({});

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive:true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) setVisible(v => ({ ...v, [e.target.dataset.reveal]: true }));
      });
    }, { threshold:0.1 });
    document.querySelectorAll("[data-reveal]").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const reveal = (key, delay=0) => ({
    "data-reveal": key,
    style: {
      opacity: visible[key] ? 1 : 0,
      transform: visible[key] ? "translateY(0)" : "translateY(40px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
    }
  });

  const BLUE   = "#0696d7";
  const ORANGE = "#ff6b2b";
  const CYAN   = "#06b6d4";
  const GREEN  = "#22c55e";
  const NAVY   = "#080d18";
  const navSolid = scrollY > 60;

  const STATS = [
    { num:"5 min",   label:"Full BOM Review",          sub:"vs. 6–16 hrs manually" },
    { num:"₱500K+",  label:"Avg. Annual Value Caught",  sub:"per firm, 20 projects/yr" },
    { num:"25×",     label:"ROI on Subscription",       sub:"₱42K/yr subscription" },
    { num:"100%",    label:"Philippine Codes",           sub:"NSCP · PEC · NPC · DPWH" },
  ];

  const PAIN_POINTS = [
    { icon:"😓", pain:"Estimating takes 2 days per project", fix:"AI reads your plans in 5 minutes and drafts your quantities" },
    { icon:"😬", pain:"You underbid and lose money mid-project", fix:"Market-rate validation against 2025 NCR/DPWH rates before you sign" },
    { icon:"📋", pain:"Missing items discovered during construction", fix:"AI cross-checks BOM vs. plan drawings — nothing slips through" },
    { icon:"📉", pain:"Low-margin bids that barely cover your costs", fix:"Markup analysis ensures OCM, contingency, and profit are protected" },
  ];

  const HOW_STEPS = [
    { n:"01", icon:"upload",   title:"Upload Your Plans",       desc:"Drop engineering plans in PDF, JPG, or PNG. Floor plans, elevations, site plan — any format." },
    { n:"02", icon:"bom",      title:"Add Your Draft BOM",      desc:"Upload your Bill of Materials PDF. Or run plans-only for a full scope and quantity estimate." },
    { n:"03", icon:"checker",  title:"AI Validates Everything", desc:"Quantities vs. plan. Unit costs vs. 2025 market rates. Missing items. Markup completeness." },
    { n:"04", icon:"report",   title:"Export Clean Report",     desc:"Download a professional estimate report. Ready to review, refine, and submit with confidence." },
  ];

  const MODULES = [
    {
      icon:"structural", color:BLUE, grad:`135deg,${BLUE},#0569a8`, name:"Structural", code:"NSCP 2015 · DPWH Blue Book",
      badge:"⭐ Flagship", live:true,
      tools:["📋 BOM Review — quantities, costs, missing items","💰 Cost Estimator — parametric from plan upload","🤖 AI Plan Checker (NSCP 2015)","🌍 Seismic Load · 📐 Beam · 🏛️ Column · 🪨 Footing · 🔩 Slab","📊 Load Combinations"]
    },
    {
      icon:"electrical", color:ORANGE, grad:`135deg,${ORANGE},#e85520`, name:"Electrical", code:"PEC 2017 · RA 9514 · Green Building",
      live:true,
      tools:["🔍 AI Plan Checker (PEC 2017 / FSIC)","📉 Voltage Drop Calculator","⚡ Short Circuit Analysis","📊 Load Schedule Calculator"]
    },
    {
      icon:"sanitary", color:CYAN, grad:`135deg,${CYAN},#0891b2`, name:"Sanitary", code:"NPC 2000 · PD 856 Sanitation Code",
      live:true,
      tools:["🔍 AI Plan Checker (NPC 2000)","🚿 Fixture Unit Calculator","📏 Pipe Sizing · 🪣 Septic Tank","💧 Water Demand · 🔢 Pressure Loss · 🌧️ Storm Drainage"]
    },
    {
      icon:"column", color:"#a78bfa", grad:"135deg,#a78bfa,#7c3aed", name:"ArchiCode", code:"NBC Philippines · BP 344 · Green Building",
      live:false,
      tools:["AI Plan Checker (NBC Philippines)","BP 344 Accessibility Compliance","Green Building Code Checker","Fire Code (RA 9514) Review","Parking & Setback Calculator"]
    },
    {
      icon:"settings", color:"#94a3b8", grad:"135deg,#94a3b8,#64748b", name:"MechaniCode", code:"PSME Code · ASHRAE · Mechanical PE",
      live:false,
      tools:["HVAC Load Calculator","Duct Sizing & Static Pressure","Chiller & AHU Selection","Mechanical Plan Checker","Ventilation Rate Calculator"]
    },
  ];

  const SAVINGS = [
    {
      icon:"pressure", color:BLUE,
      title:"Estimating Time Saved",
      amount:"₱36,000–₱150,000/yr",
      calc:"15 estimates/yr × 8–20 hrs × ₱300–500/hr → AI does first-pass in 5 min",
    },
    {
      icon:"checker", color:ORANGE,
      title:"Bid Accuracy Protection",
      amount:"₱250,000–₱500,000/yr",
      calc:"Catch one 5% underbid on a ₱5M project = ₱250K saved. One project/year pays the subscription 6×",
    },
    {
      icon:"beam", color:CYAN,
      title:"Procurement Rework Avoided",
      amount:"₱80,000–₱200,000/yr",
      calc:"Wrong quantities caught before purchase orders = 10–15% material cost savings per project",
    },
    {
      icon:"check", color:GREEN,
      title:"More Bids Won",
      amount:"₱300,000–₱1,000,000/yr",
      calc:"Faster estimates = more bids submitted. Even 1 additional project/year at 10% margin = significant upside",
    },
  ];

  const TESTIMONIALS = [
    { quote:"Nakita agad ng BOM Review yung kulang na waterproofing at mali sa rebar pricing. Nakatipid kami ng halos ₱300K sa isang project.", name:"R. Santos", role:"Project Manager, Antipolo" },
    { quote:"Before, 2 days ang estimate namin per project. Ngayon, 30 minutes — at mas accurate pa. Game changer.", name:"M. dela Cruz", role:"Senior Estimator, Metro Manila" },
    { quote:"As a sole contractor, this is like having a full estimating team on call 24/7. The cost per project has dropped significantly.", name:"A. Reyes", role:"General Contractor, Davao" },
  ];

  const PRICING = [
    { name:"Solo Contractor",   price:"₱499",    period:"/month", color:"#64748b",
      desc:"For freelance estimators and sole contractors",
      features:["Full suite — all 3 live modules","BOM Review + Cost Estimator","All calculators","PDF report export","1 user"] },
    { name:"Small Firm",        price:"₱3,500",  period:"/month", color:BLUE, best:true,
      desc:"For contracting firms and design-build teams",
      features:["Everything in Solo","Up to 10 users","Dashboard + project history","Priority support","Unlimited runs"] },
    { name:"Mid-Size Firm",     price:"₱12,000", period:"/month", color:ORANGE,
      desc:"For larger contractors and developers",
      features:["Everything in Small Firm","Unlimited users","Dedicated onboarding","Custom code references","Early access to new modules"] },
  ];

  return (
    <div style={{ background:NAVY, color:"#e8edf5", fontFamily:"'Sora','DM Sans','Segoe UI',sans-serif", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:rgba(6,150,215,0.25);border-radius:4px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes floatR{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes grid-scroll{0%{transform:translateY(0)}100%{transform:translateY(60px)}}
        @keyframes spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .stat-card:hover{border-color:var(--c)!important;background:rgba(6,150,215,0.06)!important}
        .stat-card{transition:all 0.2s}
        .mod-card:hover{transform:translateY(-6px)}
        .mod-card{transition:transform 0.25s ease,border-color 0.2s ease}
        .mod-card:hover .mod-top-bar{opacity:1!important}
        .mod-top-bar{transition:opacity 0.2s}
        .pain-card:hover{border-color:rgba(6,150,215,0.3)!important}
        .pain-card{transition:border-color 0.2s}
        .cta-btn{transition:all 0.2s ease}
        .cta-btn:hover{transform:translateY(-2px);filter:brightness(1.1)}
        .nav-link:hover{color:#e8edf5!important}
        .nav-link{transition:color 0.15s}
        .pricing-card:hover{transform:translateY(-4px)}
        .pricing-card{transition:transform 0.2s ease}
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position:"fixed",top:0,left:0,right:0,zIndex:1000,height:64,padding:"0 40px",display:"flex",alignItems:"center",justifyContent:"space-between",
        background:navSolid?"rgba(8,13,24,0.96)":"transparent",
        backdropFilter:navSolid?"blur(24px)":"none",
        borderBottom:navSolid?"1px solid rgba(6,150,215,0.12)":"none",
        transition:"all 0.3s ease" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${BLUE},#0569a8)`,display:"flex",alignItems:"center",justifyContent:"center" }}><BuildifyLogo size={30}/></div>
          <div>
            <div style={{ fontWeight:900,fontSize:16,color:"#e8edf5",letterSpacing:"-0.5px" }}>Buildify</div>
            <div style={{ fontSize:9,color:"#475569",letterSpacing:"0.8px",textTransform:"uppercase" }}>Engineering Suite · PH</div>
          </div>
        </div>
        <div style={{ display:"flex",gap:28,alignItems:"center" }}>
          {[["Why Buildify","#why"],["Modules","#modules"],["Pricing","#pricing"]].map(([l,h]) => (
            <a key={l} href={h} className="nav-link" style={{ fontSize:13,color:"#64748b",textDecoration:"none",fontWeight:600 }}>{l}</a>
          ))}
        </div>
        <button onClick={()=>setShowLogin(true)} className="cta-btn"
          style={{ background:`linear-gradient(135deg,${BLUE},#0569a8)`,border:"none",color:"#fff",fontWeight:700,fontSize:13,padding:"9px 22px",borderRadius:10,cursor:"pointer",boxShadow:`0 4px 20px rgba(6,150,215,0.35)` }}>
          Sign In →
        </button>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"120px 40px 80px",position:"relative",overflow:"hidden",textAlign:"center" }}>
        {/* Background */}
        <div style={{ position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none" }}>
          <svg width="100%" height="130%" style={{ position:"absolute",top:0,left:0,opacity:0.035,animation:"grid-scroll 25s linear infinite" }}>
            <defs><pattern id="eng-grid" width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M 64 0 L 0 0 0 64" fill="none" stroke={BLUE} strokeWidth="1"/>
              <circle cx="0" cy="0" r="1.5" fill={BLUE}/>
            </pattern></defs>
            <rect width="100%" height="200%" fill="url(#eng-grid)"/>
          </svg>
          <div style={{ position:"absolute",top:"15%",left:"8%",width:320,height:320,borderRadius:"50%",background:`radial-gradient(circle,rgba(6,150,215,0.1),transparent 65%)`,animation:"float 7s ease-in-out infinite" }}/>
          <div style={{ position:"absolute",bottom:"15%",right:"6%",width:260,height:260,borderRadius:"50%",background:`radial-gradient(circle,rgba(255,107,43,0.08),transparent 65%)`,animation:"floatR 9s ease-in-out infinite 1s" }}/>
          <div style={{ position:"absolute",top:"55%",right:"18%",width:200,height:200,borderRadius:"50%",background:`radial-gradient(circle,rgba(6,182,212,0.07),transparent 65%)`,animation:"float 8s ease-in-out infinite 3s" }}/>
          {/* Parallax lines */}
          <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.05,transform:`translateY(${scrollY*0.12}px)` }} preserveAspectRatio="none">
            <line x1="0" y1="35%" x2="100%" y2="35%" stroke={BLUE} strokeWidth="1" strokeDasharray="10 16"/>
            <line x1="0" y1="65%" x2="100%" y2="65%" stroke={ORANGE} strokeWidth="1" strokeDasharray="10 16"/>
            <line x1="22%" y1="0" x2="22%" y2="100%" stroke={CYAN} strokeWidth="1" strokeDasharray="10 16"/>
            <line x1="72%" y1="0" x2="72%" y2="100%" stroke={BLUE} strokeWidth="1" strokeDasharray="10 16"/>
          </svg>
        </div>

        <div style={{ position:"relative",maxWidth:900,width:"100%" }}>
          {/* Badge */}
          <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(6,150,215,0.08)",border:"1px solid rgba(6,150,215,0.25)",borderRadius:99,padding:"6px 16px",marginBottom:28,animation:"fadeUp 0.6s ease both" }}>
            <span style={{ width:7,height:7,borderRadius:"50%",background:BLUE,boxShadow:`0 0 10px ${BLUE}`,display:"inline-block",animation:"float 2s ease-in-out infinite" }}/>
            <span style={{ fontSize:11,color:BLUE,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase" }}>AI-Powered · Built for Filipino Contractors · 2025</span>
          </div>

          <h1 style={{ fontSize:"clamp(34px,5.5vw,68px)",fontWeight:900,letterSpacing:"-2px",lineHeight:1.05,marginBottom:20,animation:"fadeUp 0.7s ease 0.1s both" }}>
            Estimate Smarter.<br/>
            <span style={{ background:`linear-gradient(135deg,${BLUE},${CYAN})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>Win More. Build Profitably.</span>
          </h1>

          <p style={{ fontSize:"clamp(15px,1.8vw,19px)",color:"#94a3b8",maxWidth:640,margin:"0 auto 36px",lineHeight:1.75,animation:"fadeUp 0.7s ease 0.2s both" }}>
            Buildify helps Philippine contractors and estimators produce accurate BOMs, catch missing items, validate 2025 market rates, and generate professional estimates — in minutes, not days.
          </p>

          <div style={{ display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center",animation:"fadeUp 0.7s ease 0.3s both",marginBottom:64 }}>
            <button onClick={()=>setShowLogin(true)} className="cta-btn"
              style={{ background:`linear-gradient(135deg,${BLUE},#0569a8)`,border:"none",color:"#fff",fontWeight:800,fontSize:15,padding:"15px 38px",borderRadius:12,cursor:"pointer",boxShadow:`0 8px 32px rgba(6,150,215,0.45)`,letterSpacing:"-0.3px" }}>
              Start Free → Try BOM Review
            </button>
            <a href="#why" style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.1)",color:"#94a3b8",fontWeight:600,fontSize:14,padding:"14px 28px",borderRadius:12,textDecoration:"none",transition:"all 0.2s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=BLUE;e.currentTarget.style.color="#e8edf5"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";e.currentTarget.style.color="#94a3b8"}}>
              ▶ See How It Works
            </a>
          </div>

          {/* Stats */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:"rgba(255,255,255,0.04)",borderRadius:16,overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)" }}>
            {STATS.map((s,i) => (
              <div key={i} className="stat-card" style={{ "--c":BLUE,padding:"20px 16px",textAlign:"center",background:NAVY,borderRight:i<3?"1px solid rgba(255,255,255,0.05)":"none",animation:`fadeUp 0.8s ease ${0.2+i*0.12}s both` }}>
                <div style={{ fontSize:"clamp(18px,2.5vw,26px)",fontWeight:900,color:BLUE,fontFamily:"monospace",letterSpacing:"-0.5px" }}>{s.num}</div>
                <div style={{ fontSize:11,color:"#e8edf5",fontWeight:700,marginTop:4 }}>{s.label}</div>
                <div style={{ fontSize:9,color:"#475569",marginTop:2 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY BUILDIFY ── */}
      <section id="why" style={{ padding:"100px 40px",borderTop:"1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div {...reveal("why-h")} style={{ textAlign:"center",marginBottom:60 }}>
            <div style={{ fontSize:11,color:ORANGE,fontWeight:700,textTransform:"uppercase",letterSpacing:"2px",marginBottom:10 }}>WHY BUILDIFY</div>
            <h2 style={{ fontSize:"clamp(26px,4vw,44px)",fontWeight:900,letterSpacing:"-1px",lineHeight:1.1 }}>
              Every Estimator Knows<br/><span style={{color:ORANGE}}>These Exact Problems</span>
            </h2>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16 }}>
            {PAIN_POINTS.map((p,i) => (
              <div key={i} className="pain-card" {...reveal(`pain-${i}`, i*0.1)}
                style={{ background:"#0f1624",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"24px",position:"relative",overflow:"hidden" }}>
                <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${BLUE},transparent)` }}/>
                <div style={{ fontSize:28,marginBottom:14 }}>{p.icon}</div>
                <div style={{ fontSize:13,color:"#ef4444",fontWeight:700,marginBottom:10,lineHeight:1.4 }}>"{p.pain}"</div>
                <div style={{ height:1,background:"rgba(255,255,255,0.05)",marginBottom:10 }}/>
                <div style={{ fontSize:12,color:"#94a3b8",lineHeight:1.6 }}>
                  <span style={{ color:GREEN,fontWeight:700 }}>✓ </span>{p.fix}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding:"100px 40px",background:"rgba(6,150,215,0.02)",borderTop:"1px solid rgba(6,150,215,0.07)",borderBottom:"1px solid rgba(6,150,215,0.07)" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div {...reveal("how-h")} style={{ textAlign:"center",marginBottom:60 }}>
            <div style={{ fontSize:11,color:BLUE,fontWeight:700,textTransform:"uppercase",letterSpacing:"2px",marginBottom:10 }}>HOW IT WORKS</div>
            <h2 style={{ fontSize:"clamp(26px,4vw,44px)",fontWeight:900,letterSpacing:"-1px" }}>
              Plan to Estimate<br/><span style={{color:BLUE}}>in 4 Steps</span>
            </h2>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16 }}>
            {HOW_STEPS.map((s,i) => (
              <div key={i} {...reveal(`how-${i}`, i*0.1)}
                style={{ background:"#0f1624",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"28px 24px",position:"relative" }}>
                <div style={{ position:"absolute",top:14,right:16,fontSize:28,fontWeight:900,color:"rgba(6,150,215,0.08)",fontFamily:"monospace" }}>{s.n}</div>
                <div style={{ width:48,height:48,borderRadius:12,background:"rgba(6,150,215,0.1)",border:"1px solid rgba(6,150,215,0.2)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16 }}><Icon name={s.icon} size={22} color="#0696d7" strokeWidth={1.5}/></div>
                <div style={{ fontWeight:800,fontSize:15,color:"#e8edf5",marginBottom:8 }}>{s.title}</div>
                <div style={{ fontSize:12,color:"#64748b",lineHeight:1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULES ── */}
      <section id="modules" style={{ padding:"100px 40px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto" }}>
          <div {...reveal("mod-h")} style={{ textAlign:"center",marginBottom:60 }}>
            <div style={{ fontSize:11,color:CYAN,fontWeight:700,textTransform:"uppercase",letterSpacing:"2px",marginBottom:10 }}>THE SUITE</div>
            <h2 style={{ fontSize:"clamp(26px,4vw,44px)",fontWeight:900,letterSpacing:"-1px" }}>
              Every Engineering Discipline.<br/><span style={{color:CYAN}}>One Platform.</span>
            </h2>
            <p style={{ fontSize:13,color:"#64748b",marginTop:12 }}>3 modules live now · 2 coming soon · All built for Philippine codes</p>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:20 }}>
            {MODULES.map((m,i) => (
              <div key={i} className="mod-card" {...reveal(`mod-${i}`, i*0.1)}
                style={{ background:m.live?"#0f1624":"#0a1020",border:`1px solid ${m.live?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.04)"}`,borderRadius:20,padding:"28px",position:"relative",overflow:"hidden",opacity:m.live?1:0.75 }}>
                <div className="mod-top-bar" style={{ position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${m.color},transparent)`,opacity:0.5 }}/>
                {!m.live && (
                  <div style={{ position:"absolute",top:14,right:14,fontSize:9,background:"rgba(148,163,184,0.1)",color:"#94a3b8",padding:"3px 8px",borderRadius:5,fontWeight:800,letterSpacing:"0.5px",border:"1px solid rgba(148,163,184,0.15)" }}>COMING SOON</div>
                )}
                <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
                  <div style={{ width:44,height:44,borderRadius:11,background:`linear-gradient(${m.grad})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 6px 20px ${m.color}30`,flexShrink:0 }}><Icon name={m.icon} size={22} color="white" strokeWidth={1.5}/></div>
                  <div>
                    <div style={{ fontWeight:900,fontSize:16,color:m.live?"#e8edf5":"#64748b" }}>{m.name}</div>
                    <div style={{ fontSize:10,color:"#475569",marginTop:2 }}>{m.code}</div>
                  </div>
                  {m.badge && <span style={{ marginLeft:"auto",fontSize:9,background:`${m.color}18`,color:m.color,padding:"3px 8px",borderRadius:5,fontWeight:800,whiteSpace:"nowrap",border:`1px solid ${m.color}30` }}>{m.badge}</span>}
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:7,marginBottom:20 }}>
                  {m.tools.map((t,j) => (
                    <div key={j} style={{ fontSize:11,color:m.live?"#94a3b8":"#475569",display:"flex",alignItems:"flex-start",gap:6,lineHeight:1.4 }}>
                      <div style={{ width:4,height:4,borderRadius:"50%",background:m.color,flexShrink:0,marginTop:5 }}/>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
                {m.live && (
                  <button onClick={()=>setShowLogin(true)}
                    style={{ width:"100%",background:`${m.color}12`,border:`1.5px solid ${m.color}35`,color:m.color,fontWeight:700,fontSize:12,padding:"10px",borderRadius:10,cursor:"pointer",transition:"all 0.15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.background=`${m.color}22`}}
                    onMouseLeave={e=>{e.currentTarget.style.background=`${m.color}12`}}>
                    Open {m.name} →
                  </button>
                )}
                {!m.live && (
                  <div style={{ width:"100%",background:"rgba(148,163,184,0.05)",border:"1px solid rgba(148,163,184,0.1)",color:"#475569",fontWeight:700,fontSize:11,padding:"10px",borderRadius:10,textAlign:"center" }}>
                    🔔 Notify Me When Live
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAVINGS / ROI ── */}
      <section style={{ padding:"100px 40px",background:`linear-gradient(180deg,rgba(6,150,215,0.02),rgba(6,150,215,0.05))`,borderTop:"1px solid rgba(6,150,215,0.07)",borderBottom:"1px solid rgba(6,150,215,0.07)" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div {...reveal("roi-h")} style={{ textAlign:"center",marginBottom:60 }}>
            <div style={{ fontSize:11,color:GREEN,fontWeight:700,textTransform:"uppercase",letterSpacing:"2px",marginBottom:10 }}>ROI FOR CONTRACTORS</div>
            <h2 style={{ fontSize:"clamp(26px,4vw,44px)",fontWeight:900,letterSpacing:"-1px" }}>
              The Math Is Simple.<br/><span style={{color:GREEN}}>Buildify Pays for Itself.</span>
            </h2>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16,marginBottom:36 }}>
            {SAVINGS.map((s,i) => (
              <div key={i} {...reveal(`roi-${i}`, i*0.1)}
                style={{ background:"#0f1624",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"24px",position:"relative",overflow:"hidden" }}>
                <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${s.color},transparent)` }}/>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12 }}><Icon name={s.icon} size={26} color={s.color} strokeWidth={1.5}/></div>
                <div style={{ fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6 }}>{s.title}</div>
                <div style={{ fontSize:20,fontWeight:900,color:s.color,fontFamily:"monospace",letterSpacing:"-0.5px",marginBottom:10 }}>{s.amount}</div>
                <div style={{ fontSize:11,color:"#64748b",lineHeight:1.65,background:"rgba(255,255,255,0.02)",borderRadius:8,padding:"8px 10px",border:"1px solid rgba(255,255,255,0.04)" }}>{s.calc}</div>
              </div>
            ))}
          </div>
          <div {...reveal("roi-total")} style={{ background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:16,padding:"28px 32px",textAlign:"center" }}>
            <div style={{ fontSize:12,color:"#64748b",marginBottom:6 }}>Small firm · 15 estimates/yr · 2 projects improved/yr</div>
            <div style={{ fontSize:"clamp(28px,4vw,52px)",fontWeight:900,color:GREEN,fontFamily:"monospace",letterSpacing:"-1px" }}>₱666,000–₱1,850,000/yr</div>
            <div style={{ fontSize:13,color:"#64748b",marginTop:8 }}>estimated total value captured · subscription cost: <strong style={{color:"#e8edf5"}}>₱42,000/yr</strong> · ROI: <strong style={{color:GREEN}}>16–44×</strong></div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding:"100px 40px" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div {...reveal("test-h")} style={{ textAlign:"center",marginBottom:60 }}>
            <div style={{ fontSize:11,color:"#8b5cf6",fontWeight:700,textTransform:"uppercase",letterSpacing:"2px",marginBottom:10 }}>FROM THE FIELD</div>
            <h2 style={{ fontSize:"clamp(26px,4vw,40px)",fontWeight:900,letterSpacing:"-1px" }}>Contractors Already Using Buildify</h2>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20 }}>
            {TESTIMONIALS.map((t,i) => (
              <div key={i} {...reveal(`test-${i}`, i*0.15)}
                style={{ background:"#0f1624",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"28px" }}>
                <div style={{ fontSize:36,color:BLUE,lineHeight:1,marginBottom:12 }}>"</div>
                <div style={{ fontSize:13,color:"#94a3b8",lineHeight:1.8,marginBottom:20,fontStyle:"italic" }}>{t.quote}</div>
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:14,display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${BLUE},${CYAN})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff" }}>{t.name[0]}</div>
                  <div>
                    <div style={{ fontWeight:700,fontSize:13,color:"#e8edf5" }}>{t.name}</div>
                    <div style={{ fontSize:10,color:"#64748b",marginTop:1 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding:"100px 40px",background:"rgba(255,255,255,0.01)",borderTop:"1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth:1000,margin:"0 auto" }}>
          <div {...reveal("price-h")} style={{ textAlign:"center",marginBottom:60 }}>
            <div style={{ fontSize:11,color:ORANGE,fontWeight:700,textTransform:"uppercase",letterSpacing:"2px",marginBottom:10 }}>PRICING</div>
            <h2 style={{ fontSize:"clamp(26px,4vw,44px)",fontWeight:900,letterSpacing:"-1px" }}>
              Straightforward Pricing.<br/><span style={{color:ORANGE}}>Full Suite on Every Plan.</span>
            </h2>
            <p style={{ fontSize:13,color:"#64748b",marginTop:12 }}>Structural · Electrical · Sanitary included. ArchiCode & MechaniCode free when launched.</p>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:20,alignItems:"start" }}>
            {PRICING.map((p,i) => (
              <div key={i} className="pricing-card" {...reveal(`price-${i}`, i*0.12)}
                style={{ background:p.best?"rgba(6,150,215,0.05)":"#0f1624",border:`1.5px solid ${p.best?BLUE:"rgba(255,255,255,0.07)"}`,borderRadius:20,padding:"32px 28px",position:"relative",overflow:"hidden" }}>
                {p.best && <div style={{ position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${BLUE},${CYAN})` }}/>}
                {p.best && <div style={{ position:"absolute",top:16,right:14,fontSize:9,background:`rgba(6,150,215,0.15)`,color:BLUE,padding:"3px 8px",borderRadius:5,fontWeight:800,letterSpacing:"0.5px",border:`1px solid rgba(6,150,215,0.3)` }}>⭐ BEST VALUE</div>}
                <div style={{ fontWeight:800,fontSize:14,color:"#94a3b8",marginBottom:4 }}>{p.name}</div>
                <div style={{ fontSize:11,color:"#475569",marginBottom:14 }}>{p.desc}</div>
                <div style={{ display:"flex",alignItems:"baseline",gap:4,marginBottom:20 }}>
                  <span style={{ fontSize:38,fontWeight:900,color:p.color,fontFamily:"monospace",letterSpacing:"-1px" }}>{p.price}</span>
                  <span style={{ fontSize:13,color:"#475569" }}>{p.period}</span>
                </div>
                <div style={{ height:1,background:"rgba(255,255,255,0.06)",marginBottom:18 }}/>
                <div style={{ display:"flex",flexDirection:"column",gap:9,marginBottom:24 }}>
                  {p.features.map((f,j) => (
                    <div key={j} style={{ display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#94a3b8" }}>
                      <span style={{ color:GREEN,fontWeight:800,fontSize:13 }}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <button onClick={()=>setShowLogin(true)}
                  style={{ width:"100%",background:p.best?`linear-gradient(135deg,${BLUE},#0569a8)`:"transparent",border:`1.5px solid ${p.color}44`,color:p.best?"#fff":p.color,fontWeight:700,fontSize:13,padding:"12px",borderRadius:11,cursor:"pointer",transition:"all 0.15s" }}
                  onMouseEnter={e=>{if(!p.best)e.currentTarget.style.background=`${p.color}12`}}
                  onMouseLeave={e=>{if(!p.best)e.currentTarget.style.background="transparent"}}>
                  {p.best?"Get Started →":"Start Free Trial →"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding:"100px 40px",textAlign:"center",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,background:`radial-gradient(ellipse at 50% 50%,rgba(6,150,215,0.07),transparent 70%)`,pointerEvents:"none" }}/>
        <div {...reveal("cta-final")} style={{ position:"relative",maxWidth:660,margin:"0 auto" }}>
          <h2 style={{ fontSize:"clamp(26px,4vw,48px)",fontWeight:900,letterSpacing:"-1.5px",lineHeight:1.1,marginBottom:16 }}>
            Stop leaving money<br/><span style={{color:BLUE}}>on the table.</span>
          </h2>
          <p style={{ fontSize:15,color:"#64748b",marginBottom:36,lineHeight:1.75 }}>Join Filipino contractors and engineers using Buildify to estimate accurately, win more bids, and protect their margins — backed by 2025 PH market rates.</p>
          <button onClick={()=>setShowLogin(true)} className="cta-btn"
            style={{ background:`linear-gradient(135deg,${BLUE},#0569a8)`,border:"none",color:"#fff",fontWeight:800,fontSize:16,padding:"17px 48px",borderRadius:14,cursor:"pointer",boxShadow:`0 12px 48px rgba(6,150,215,0.45)`,letterSpacing:"-0.3px" }}>
            Start Free → Try BOM Review
          </button>
          <div style={{ marginTop:18,fontSize:11,color:"#475569" }}>No credit card required · Cancel anytime · NSCP · PEC · NPC · DPWH</div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:"1px solid rgba(255,255,255,0.05)",padding:"28px 40px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:26,height:26,borderRadius:7,background:`linear-gradient(135deg,${BLUE},#0569a8)`,display:"flex",alignItems:"center",justifyContent:"center" }}><BuildifyLogo size={22}/></div>
          <span style={{ fontWeight:800,fontSize:13,color:"#e8edf5" }}>Buildify</span>
          <span style={{ color:"#1e293b",fontSize:12 }}>·</span>
          <span style={{ fontSize:11,color:"#1e293b" }}>by Jon Ureta · Philippines · Powered by Claude AI</span>
        </div>
        <div style={{ fontSize:11,color:"#1e293b" }}>NSCP 2015 · PEC 2017 · NPC 2000 · DPWH Blue Book · NBC Philippines</div>
      </footer>

      {showLogin && <LoginModal onClose={()=>setShowLogin(false)} onSuccess={u=>{setShowLogin(false);onLogin(u);}}/>}
    </div>
  );
}

// ─── LOGIN MODAL ─────────────────────────────────────────────────────────────
function LoginModal({ onClose, onSuccess }) {
  const [user, setUser]   = useState("");
  const [pass, setPass]   = useState("");
  const [err,  setErr]    = useState("");
  const [busy, setBusy]   = useState(false);

  const submit = () => {
    if (!user || !pass) { setErr("Please enter username and password."); return; }
    setBusy(true); setErr("");
    setTimeout(() => {
      if (user === ADMIN_USER && pass === ADMIN_PASS) {
        onSuccess({ username: user, role: "admin" });
      } else {
        setErr("Invalid credentials. Please try again.");
        setBusy(false);
      }
    }, 600);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:999, background:"rgba(8,12,24,0.92)", backdropFilter:"blur(16px)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, animation:"fadeIn 0.25s ease" }}>
      <div style={{ background:T.card, border:"1px solid rgba(245,158,11,0.25)", borderRadius:24, padding:"44px 40px", maxWidth:420, width:"100%", boxShadow:"0 32px 80px rgba(0,0,0,0.6)", animation:"fadeUp 0.3s ease" }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:60, height:60, borderRadius:16, margin:"0 auto 14px", background:"linear-gradient(135deg,#0284c7,#0ea5e9)", display:"flex", alignItems:"center", justifyContent:"center", display:"flex",alignItems:"center",justifyContent:"center", boxShadow:"0 8px 28px rgba(6,150,215,0.4)" }}><BuildifyLogo size={28}/></div>
          <div style={{ fontWeight:800, fontSize:22, color:T.text, letterSpacing:"-0.5px" }}>Welcome back</div>
          <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>Buildify</div>
        </div>

        {/* Fields */}
        <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.muted, marginBottom:6, letterSpacing:"0.3px" }}>USERNAME</div>
            <input
              value={user} onChange={e => { setUser(e.target.value); setErr(""); }}
              onKeyDown={e => e.key==="Enter" && submit()}
              placeholder="Enter username"
              style={{ width:"100%", background:"#0f1117", border:`1.5px solid ${T.border}`, borderRadius:12, padding:"12px 16px", color:T.text, fontSize:14, outline:"none", transition:"border-color 0.15s" }}
              onFocus={e=>e.target.style.borderColor="#f59e0b"} onBlur={e=>e.target.style.borderColor=T.border}
            />
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.muted, marginBottom:6, letterSpacing:"0.3px" }}>PASSWORD</div>
            <input
              type="password" value={pass} onChange={e => { setPass(e.target.value); setErr(""); }}
              onKeyDown={e => e.key==="Enter" && submit()}
              placeholder="Enter password"
              style={{ width:"100%", background:"#0f1117", border:`1.5px solid ${T.border}`, borderRadius:12, padding:"12px 16px", color:T.text, fontSize:14, outline:"none", transition:"border-color 0.15s" }}
              onFocus={e=>e.target.style.borderColor="#f59e0b"} onBlur={e=>e.target.style.borderColor=T.border}
            />
          </div>
        </div>

        {err && <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:T.danger }}>⚠️ {err}</div>}

        <button onClick={submit} disabled={busy} style={{ width:"100%", background:busy?"rgba(2,132,199,0.3)":"linear-gradient(135deg,#0284c7,#0ea5e9)", border:"none", color:busy?"#555":"#fff", fontWeight:800, fontSize:15, padding:"14px", borderRadius:12, cursor:busy?"not-allowed":"pointer", transition:"all 0.2s", marginBottom:16 }}>
          {busy ? "Signing in…" : "Sign In →"}
        </button>

        <button onClick={onClose} style={{ width:"100%", background:"transparent", border:`1.5px solid ${T.border}`, color:T.muted, fontWeight:600, fontSize:14, padding:"11px", borderRadius:12, cursor:"pointer" }}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD (logged-in app) ────────────────────────────────────────────────
function Dashboard({ user, onLogout }) {
  const [module,         setModule]         = useState("home");
  const [structTool,     setStructTool]     = useState("bom");
  const [history,        setHistory]        = useState(loadHistory());
  const [sidebarOpen,    setSidebarOpen]    = useState(() => {
    try { return localStorage.getItem("buildify_sidebar") !== "collapsed"; } catch { return true; }
  });
  // sessionTick: incremented each time user navigates to a module (triggers session reload in child)
  const [sessionTick, setSessionTick] = useState({ structural:0, electrical:0, sanitary:0 });



  // Keep history live for sidebar pills
  useEffect(() => {
    const handler = () => setHistory(loadHistory());
    window.addEventListener("buildify_history_update", handler);
    return () => window.removeEventListener("buildify_history_update", handler);
  }, []);

  const toggleSidebar = () => setSidebarOpen(p => {
    const next = !p;
    try { localStorage.setItem("buildify_sidebar", next ? "open" : "collapsed"); } catch {}
    return next;
  });

  const navigateTo = (mod, tool) => {
    setModule(mod);
    if (mod === "structural" && tool) setStructTool(tool === "checker" ? "checker" : tool);
    // Increment tick to trigger session reload in the module
    if (mod !== "home") setSessionTick(p => ({ ...p, [mod]: (p[mod]||0) + 1 }));
  };

  const [apiKey, setApiKey] = useState(() => {
    const saved = localStorage.getItem("phen_key") || "";
    if (saved) { window.__PHEN_KEY__ = saved; }
    return saved;
  });

  // Per-module activity stats for sidebar pills
  const modStats = (mod) => {
    const entries = history.filter(e => e.module === mod);
    if (!entries.length) return null;
    const latest = entries.sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp))[0];
    const diffMin = Math.floor((Date.now() - new Date(latest.timestamp)) / 60000);
    const age = diffMin < 60 ? `${diffMin}m ago` : diffMin < 1440 ? `${Math.floor(diffMin/60)}h ago`
              : `${Math.floor(diffMin/1440)}d ago`;
    const hasSession = DB.hasSession(mod);
    return { count: entries.length, age, hasSession };
  };

  const SB = sidebarOpen ? 230 : 58;
  const NAV_ITEMS = [
    { key:"home",       icon:"home",       label:"Home",       color:"#0696d7", sub:null },
    { key:"structural", icon:"structural", label:"Structural", color:"#0696d7", sub:"NSCP 2015" },
    { key:"electrical", icon:"electrical", label:"Electrical", color:"#ff6b2b", sub:"PEC 2017" },
    { key:"sanitary",   icon:"sanitary",   label:"Sanitary",   color:"#06b6d4", sub:"NPC 2000" },
  ];

  // Module page titles & subtitles
  const PAGE_META = {
    home:       { title:"Dashboard",  sub:null },
    structural: { title:"Structural", sub:"NSCP 2015 7th Edition · DPWH Blue Book" },
    electrical: { title:"Electrical", sub:"PEC 2017 · RA 9514 (FSIC) · Green Building Code" },
    sanitary:   { title:"Sanitary",   sub:"National Plumbing Code 2000 · PD 856 Sanitation Code" },
  };



  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'Sora','DM Sans','Segoe UI',sans-serif", display:"flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{box-shadow:0 0 40px rgba(245,158,11,0.15)}50%{box-shadow:0 0 80px rgba(245,158,11,0.3)}}
        input::-webkit-inner-spin-button{-webkit-appearance:none}
        .sidebar-transition{transition:width 0.22s cubic-bezier(0.4,0,0.2,1)}
        .nav-item-label{transition:opacity 0.15s,width 0.22s;white-space:nowrap;overflow:hidden}
      `}</style>

      {/* ── SIDEBAR ── */}
      <div className="sidebar-transition" style={{ width:SB, flexShrink:0, background:"rgba(15,17,23,0.98)", borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, height:"100vh", zIndex:200, overflow:"hidden" }}>

        {/* Logo + toggle */}
        <div style={{ padding:"14px 12px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10, minHeight:58 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#0696d7,#0569a8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0, boxShadow:"0 4px 14px rgba(6,150,215,0.35)", cursor:"pointer" }} onClick={toggleSidebar}><BuildifyLogo size={26}/></div>
          {sidebarOpen && (
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:13, color:T.text, letterSpacing:"-0.3px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>Buildify</div>
              <div style={{ fontSize:9, color:T.muted, letterSpacing:"0.5px" }}>by Jon Ureta · PH</div>
            </div>
          )}
          {sidebarOpen && (
            <button onClick={toggleSidebar} style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.muted, borderRadius:6, width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:12, flexShrink:0 }}>◀</button>
          )}
        </div>

        {/* Nav items */}
        <div style={{ flex:1, padding:"10px 8px", display:"flex", flexDirection:"column", gap:3, overflowY:"auto" }}>
          {NAV_ITEMS.map(item => {
            const active = module === item.key;
            const stats  = item.key !== "home" ? modStats(item.key) : null;
            return (
              <button key={item.key} onClick={() => setModule(item.key)}
                title={!sidebarOpen ? item.label : undefined}
                style={{ display:"flex", alignItems:"center", gap:10,
                  padding: sidebarOpen ? "9px 12px" : "10px 0",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  borderRadius:10,
                  border:`1.5px solid ${active ? item.color+"55" : "transparent"}`,
                  background: active ? `${item.color}14` : "transparent",
                  color: active ? item.color : T.muted,
                  cursor:"pointer", fontSize:13, fontWeight:active?800:600,
                  transition:"all 0.15s", width:"100%", textAlign:"left",
                  position:"relative" }}
                onMouseEnter={e=>{ if(!active){ e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.color=T.text; }}}
                onMouseLeave={e=>{ if(!active){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color=T.muted; }}}>

                {/* Icon — with dot indicator when collapsed */}
                <span style={{ flexShrink:0, display:"flex", alignItems:"center", position:"relative" }}>
                  <Icon name={item.icon} size={18} color={active ? item.color : "#64748b"}/>
                  {/* Activity dot — only when sidebar collapsed & has runs or saved session */}
                  {!sidebarOpen && stats && (stats.count > 0 || stats.hasSession) && (
                    <span style={{ position:"absolute", top:-2, right:-2, width:7, height:7,
                      borderRadius:"50%", background: stats.hasSession ? item.color : "#64748b",
                      border:"1.5px solid #0f1118", display:"block" }}/>
                  )}
                </span>

                {/* Label + pills — only when sidebar open */}
                {sidebarOpen && (
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:6 }}>
                      <span style={{ fontSize:13, fontWeight:active?800:600, whiteSpace:"nowrap",
                        overflow:"hidden", textOverflow:"ellipsis" }}>
                        {item.label}
                      </span>
                      {/* Run count pill */}
                      {stats && (
                        <span style={{ fontSize:9, fontWeight:800, padding:"1px 6px", borderRadius:20,
                          background: active ? `${item.color}30` : "rgba(100,116,139,0.15)",
                          color: active ? item.color : T.muted,
                          flexShrink:0, whiteSpace:"nowrap" }}>
                          {stats.count} run{stats.count !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {/* Last used time + saved session indicator — only show when not active */}
                    {stats && !active && (
                      <div style={{ fontSize:9, color:"rgba(100,116,139,0.6)", marginTop:1, display:"flex", alignItems:"center", gap:5 }}>
                        <span>Last: {stats.age}</span>
                        {stats.hasSession && (
                          <span style={{ fontSize:8, fontWeight:800, padding:"1px 5px", borderRadius:3,
                            background:`${item.color}18`, color:item.color }}>
                            SAVED
                          </span>
                        )}
                      </div>
                    )}
                    {/* Sub-label when active */}
                    {active && item.sub && (
                      <div style={{ fontSize:9, color:`${item.color}80`, marginTop:1 }}>
                        {item.sub}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}

          {/* ── Coming Soon modules ── */}
          {sidebarOpen && (
            <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${T.border}` }}>
              <div style={{ fontSize:9, color:T.muted, fontWeight:700, textTransform:"uppercase",
                letterSpacing:"0.8px", padding:"0 12px", marginBottom:6 }}>Coming Soon</div>
              {[
                { label:"ArchiCode",   color:"#a78bfa", sub:"Architecture" },
                { label:"MechaniCode", color:"#94a3b8", sub:"Mechanical" },
              ].map(cs => (
                <div key={cs.label}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                    borderRadius:10, opacity:0.45, cursor:"default" }}>
                  <span style={{ width:18, height:18, borderRadius:5, background:`${cs.color}20`,
                    border:`1px dashed ${cs.color}50`, flexShrink:0, display:"flex",
                    alignItems:"center", justifyContent:"center", fontSize:9 }}>?</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.muted, whiteSpace:"nowrap" }}>{cs.label}</div>
                    <div style={{ fontSize:9, color:"rgba(100,116,139,0.5)" }}>{cs.sub}</div>
                  </div>
                  <span style={{ fontSize:8, fontWeight:800, padding:"1px 5px", borderRadius:3,
                    background:"rgba(100,116,139,0.1)", color:T.muted }}>SOON</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expand button when collapsed */}
        {!sidebarOpen && (
          <div style={{ padding:"6px 8px", borderTop:`1px solid ${T.border}` }}>
            <button onClick={toggleSidebar} title="Expand sidebar"
              style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.muted,
                borderRadius:8, width:"100%", height:28, display:"flex", alignItems:"center",
                justifyContent:"center", cursor:"pointer", fontSize:11 }}>▶</button>
          </div>
        )}

        {/* User badge at bottom */}
        <div style={{ padding:"10px 8px", borderTop:`1px solid ${T.border}` }}>
          {sidebarOpen ? (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.15)", borderRadius:10 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#f59e0b,#f97316)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#000", flexShrink:0 }}>{user.username[0].toUpperCase()}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.username}</div>
                <div style={{ fontSize:9, color:T.accent, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>{user.role}</div>
              </div>
              <button onClick={onLogout} title="Sign out" style={{ background:"transparent", border:"none", color:T.muted, cursor:"pointer", fontSize:14, padding:2 }}><Icon name="signout" size={16} color="#ef4444"/></button>
            </div>
          ) : (
            <button onClick={onLogout} title="Sign out" style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.muted, borderRadius:8, width:"100%", height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:14 }}><Icon name="signout" size={16} color="#ef4444"/></button>
          )}
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div style={{ marginLeft:SB, flex:1, display:"flex", flexDirection:"column", minWidth:0, transition:"margin-left 0.22s cubic-bezier(0.4,0,0.2,1)" }}>

        {/* Top bar */}
        <div style={{ background:"rgba(22,27,39,0.95)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${T.border}`, position:"sticky", top:0, zIndex:100 }}>
          <div style={{ padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:58 }}>
            {/* Page title */}
            <div style={{ display:"flex", flexDirection:"column", justifyContent:"center" }}>
              <div style={{ fontWeight:800, fontSize:15, color:T.text, lineHeight:1.2 }}>
                {PAGE_META[module]?.title || "Dashboard"}
              </div>
              {PAGE_META[module]?.sub && (
                <div style={{ fontSize:10, color:T.muted, marginTop:1 }}>
                  {PAGE_META[module].sub}
                </div>
              )}
            </div>
            {/* API key + user */}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(0,0,0,0.3)",border:`1.5px solid ${apiKey.startsWith("sk-")?"#22c55e":"rgba(6,150,215,0.5)"}`,borderRadius:9,padding:"4px 4px 4px 10px",minWidth:200}}>
                <span style={{fontSize:11,whiteSpace:"nowrap",color:apiKey.startsWith("sk-")?"#10b981":"#f59e0b",fontWeight:700}}>🔑</span>
                <input type="password" value={apiKey}
                  onChange={e => { const v=e.target.value; setApiKey(v); window.__PHEN_KEY__=v; if(v.startsWith("sk-")) localStorage.setItem("phen_key",v); }}
                  onKeyDown={e => { if(e.key==="Enter" && apiKey.startsWith("sk-")){ window.__PHEN_KEY__=apiKey; localStorage.setItem("phen_key",apiKey); }}}
                  placeholder={apiKey.startsWith("sk-") ? "API key saved ✓" : "Paste sk-ant-... key"}
                  style={{background:"transparent",border:"none",outline:"none",color:apiKey.startsWith("sk-")?"#10b981":T.text,fontSize:11,fontFamily:"monospace",width:140,padding:"2px 0"}}/>
                {apiKey.startsWith("sk-")
                  ? <span style={{fontSize:10,background:"rgba(16,185,129,0.15)",color:"#10b981",padding:"3px 7px",borderRadius:6,fontWeight:700}}>✓</span>
                  : <button onClick={()=>{if(apiKey.startsWith("sk-")){window.__PHEN_KEY__=apiKey;localStorage.setItem("phen_key",apiKey);}}} style={{background:"linear-gradient(135deg,#f59e0b,#f97316)",border:"none",color:"#000",fontWeight:700,padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:11}}>Save</button>}
              </div>
            </div>
          </div>
          {!apiKey.startsWith("sk-") && (
            <div style={{ borderTop:`1px solid rgba(245,158,11,0.3)`, background:"rgba(245,158,11,0.07)", padding:"8px 24px" }}>
              <div style={{ fontSize:12, color:"#f59e0b" }}>⚠️ <strong>API key required.</strong> Paste your Anthropic key above (starts with <code style={{background:"rgba(0,0,0,0.3)",padding:"1px 5px",borderRadius:3}}>sk-ant-</code>). Get yours at <strong>console.anthropic.com → API Keys</strong>.</div>
            </div>
          )}

        </div>

        {/* Page content */}
        <div style={{ flex:1, padding:"28px 24px", maxWidth:1060, width:"100%" }}>
          {module==="home" && <DashboardHome onNavigate={navigateTo}/>}
          {module==="electrical" && (
            <ElecCode apiKey={apiKey} sessionTick={sessionTick.electrical}/>
          )}
          {module==="structural" && (
            <>
              <div style={{ marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#0696d7,#0569a8)", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="structural" size={16} color="#0696d7"/></div>
                <div>
                  <div style={{ fontWeight:800, fontSize:18, color:T.text }}>Structural</div>
                  <div style={{ fontSize:11, color:T.muted }}>NSCP 2015 7th Edition · DPWH Blue Book</div>
                </div>
              </div>
              <Card>
                <StructiCode
                  apiKey={apiKey}
                  initialTool={structTool}
                  sessionTick={sessionTick.structural}
                />
              </Card>
            </>
          )}
          {module==="sanitary" && (
            <>
              <div style={{ marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#06b6d4,#0891b2)", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="sanitary" size={16} color="#06b6d4"/></div>
                <div>
                  <div style={{ fontWeight:800, fontSize:18, color:T.text }}>Sanitary</div>
                  <div style={{ fontSize:11, color:T.muted }}>National Plumbing Code 2000 · PD 856 Sanitation Code</div>
                </div>
              </div>
              <Card>
                <SaniCode apiKey={apiKey} sessionTick={sessionTick.sanitary}/>
              </Card>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop:`1px solid ${T.border}`, padding:"16px 24px", textAlign:"center" }}>
          <div style={{ fontSize:12, color:"rgba(100,116,139,0.4)" }}>
            Buildify · Developed by <strong style={{ color:T.muted }}>Jon Ureta</strong> · Philippines · Powered by Claude AI
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(null); // null = not logged in

  if (auth) return <Dashboard user={auth} onLogout={() => setAuth(null)} />;
  return <LandingPage onLogin={setAuth} />;
}
