import React, { useState, useEffect, useRef, useCallback } from "react";

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
    // ── Engineering Tools
    wrench:      <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
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

export { Icon, BuildifyLogo };
