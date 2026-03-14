// ─── HISTORY & SESSION DATABASE ─────────────────────────────────────────────

const HISTORY_KEY  = "buildify_history";
const SESSION_KEYS = {
  structural:  "buildify_session_structural",
  electrical:  "buildify_session_electrical",
  sanitary:    "buildify_session_sanitary",
  engtools:    "buildify_session_engtools",
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

export { HISTORY_KEY, SESSION_KEYS, DB, loadHistory, saveHistory, addHistoryEntry, deleteHistoryEntry, clearHistory, downloadHistoryReport };

