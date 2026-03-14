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

const callAI = async ({ apiKey, system, messages, max_tokens = 8000, retries = 4 }) => {
  const key = (typeof apiKey === "string" && apiKey.startsWith("sk-")) ? apiKey : getKey();
  if (!key) throw new Error("No API key. Paste your Anthropic key using the 🔑 button in the top menu.");

  const payload = { model: "claude-sonnet-4-20250514", max_tokens, temperature: 0, messages };
  if (system) payload.system = system;

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 2500 * attempt));

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

      if (res.status === 529 || res.status === 503 || res.status === 429) {
        lastError = new Error(`API overloaded (${res.status}). Retrying...`);
        continue;
      }

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        const preview = rawText.slice(0, 120).replace(/<[^>]+>/g, "").trim();
        throw new Error(`Server error: ${preview || `HTTP ${res.status}`}`);
      }

      if (data.error) {
        const msg = data.error.message || data.error || "Anthropic API error";
        if ((data.error.type === "overloaded_error" || res.status === 529) && attempt < retries) {
          lastError = new Error(msg); continue;
        }
        throw new Error(msg);
      }
      return data;
    } catch (e) {
      lastError = e;
      if (attempt >= retries) throw e;
    }
  }
  throw lastError || new Error("API call failed after retries");
};

const repairBomJSON = str => {
  // Try direct parse first
  try { return JSON.parse(str); } catch {}
  // Strip any trailing incomplete array/object
  let s = str.trimEnd();
  // Find last complete lineItem entry
  const tryClose = (suffix) => { try { return JSON.parse(s + suffix); } catch { return null; } };
  // Try closing at various truncation points
  const attempts = [
    s + ']}',                           // truncated inside tradeSummary
    s + '}]}',                          // truncated inside last lineItem
    s + '"]}',                          // truncated mid-string in lineItem
    s + ',"tradeSummary":[]}',          // truncated before tradeSummary
    s.replace(/,\s*$/, '') + ']}',      // trailing comma then close
    s.replace(/,\s*$/, '') + '}]}',
  ];
  for (const attempt of attempts) {
    const r = tryClose('');
    if (r) return r;
    try { const p = JSON.parse(attempt); if (p?.summary && p?.lineItems) return p; } catch {}
  }
  // Last resort: find last complete lineItem and close there
  const lastComplete = s.lastIndexOf(',"confidenceNote"');
  if (lastComplete > 0) {
    const end = s.indexOf('}', lastComplete);
    if (end > 0) {
      const truncated = s.substring(0, end+1) + '],"tradeSummary":[]}';
      try { const p = JSON.parse(truncated); if (p?.summary && p?.lineItems) return p; } catch {}
    }
  }
  return null;
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

export { toBase64, fmtSize, compressImage, getKey, callAI, repairBomJSON, repairJSON };
