// ─── ELECTRICAL COMPUTATIONS ─────────────────────────────────────────────────
import { WIRE_DATA, AWG_SIZES } from "./constants.jsx";

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
    const faultNoInput = Isc < 1;
    items.push({ tool:"fault", id:"Short Circuit", value:`${(Isc/1000).toFixed(2)} kA`,
      detail: faultNoInput
        ? `⚠ Isc result is near zero. Likely cause: Cable Length default (${sc.cableLen||15}m) is too long. Open the Short Circuit calculator and set Cable Length to the actual service drop distance (typically 3–10m for MERALCO connections). Also confirm transformer kVA and %Z match your MERALCO service data.`
        : `Isc=${(Isc/1000).toFixed(2)}kA, ratio=${ratio.toFixed(1)}× FLA`,
      status: faultNoInput ? "NO INPUT" : ratio > 1 ? "PASS" : "FAIL",
      noInput: faultNoInput,
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
    const ampNoInput = derated === 0 || baseA === 0;
    items.push({ tool:"ampacity", id:"Ampacity Derating", value:`${derated.toFixed(1)} A`,
      detail: ampNoInput
        ? `⚠ Derated ampacity is 0A because wire size or conductor count is missing. Open the Ampacity Derating calculator and enter: Wire Size (from your plan's schedule), Number of conductors sharing the conduit, and Ambient Temperature (35°C is standard for Philippine locations).`
        : `#${amp.wireSize} AWG ${ins}, derated=${derated.toFixed(1)}A, load=${loadA}A`,
      status: ampNoInput ? "NO INPUT" : derated >= loadA && loadA > 0 ? "PASS" : derated >= loadA ? "COMPUTED" : "FAIL",
      noInput: ampNoInput,
      numeric: derated });
  }

  // ── P2 Chain ─────────────────────────────────────────────────────────────
  const AWG_LIST=[14,12,10,8,6,4,3,2,1,"1/0","2/0","3/0","4/0",250,300,350,400,500];
  const loadItem=items.find(i=>i.tool==="load"),panelItem=items.find(i=>i.tool==="panel"),faultItem=items.find(i=>i.tool==="fault");
  const rawDemandVA=panelItem?.numeric??loadItem?.numeric??null;
  const sysVolt=+(cs.panel?.panelVolt||cs.load?.voltage||ed?.system?.voltage||230);
  if(rawDemandVA!=null&&rawDemandVA>0){
    const demandA=rawDemandVA/sysVolt,reqMainA=Math.ceil(demandA*1.25/5)*5;
    const reqWire=AWG_LIST.find(s=>(WIRE_DATA[s]?.ampacity||0)>=reqMainA)||"500+";
    const Isc_kA=faultItem?faultItem.numeric/1000:null;
    const STD_AIC=[5,10,14,18,22,25,35,42,65,100,200];
    const reqAIC=Isc_kA?STD_AIC.find(r=>r>=Isc_kA)||200:null;
    items.push({tool:"service",id:"Service Entrance",value:`${(rawDemandVA/1000).toFixed(2)} kVA`,
      detail:`${demandA.toFixed(1)}A demand → Main ≥${reqMainA}A · Wire ≥#${reqWire}${reqAIC?` · AIC ≥${reqAIC}kA`:""}`,
      status:"COMPUTED",numeric:rawDemandVA,chain:{demandA,reqMainA,reqWire,reqAIC_kA:reqAIC,voltage:sysVolt}});
    const mb=+(cs.panel?.mainBreaker||0);
    if(mb>0&&mb<reqMainA)items.push({tool:"panel_warn",id:"Main Breaker Undersized",
      value:`${mb}A < ${reqMainA}A`,detail:`Plans: ${mb}AT. Need ≥${reqMainA}A (125%×${demandA.toFixed(1)}A) PEC 2.20`,status:"FAIL",numeric:mb});
    if(Isc_kA&&Isc_kA>10)items.push({tool:"aic_warn",id:"AIC Insufficient",
      value:`${Isc_kA.toFixed(1)}kA > 10kAIC`,detail:`Fault ${Isc_kA.toFixed(1)}kA exceeds standard 10kAIC. Upgrade to ≥${reqAIC}kAIC. PEC 2.40`,status:"FAIL",numeric:Isc_kA});
  }
  // ── P3 Compliance ─────────────────────────────────────────────────────────
  const panCircuits=cs.panel?.circuits||[];
  const b80f=[];
  panCircuits.forEach(x=>{const va=+(x.va||0),bkr=+(x.breaker||20);if(va>0&&bkr>0&&(va/sysVolt)>bkr*0.8)b80f.push(`"${x.desc||"?"}" ${(va/sysVolt).toFixed(1)}A on ${bkr}A`);});
  if(panCircuits.length>0)items.push({tool:"branch80",id:"Branch 80% Rule",
    value:b80f.length===0?`All ${panCircuits.length} PASS`:`${b80f.length} violation${b80f.length>1?"s":""}`,
    detail:b80f.length===0?`All circuits within 80% continuous limit (PEC 2.20.3.2)`:b80f.slice(0,3).join(" | "),
    status:b80f.length===0?"PASS":"FAIL",numeric:b80f.length});
  const mCkts=panCircuits.filter(x=>x.type==="Motor"||/motor|pump|acpu/i.test(x.desc||""));
  const mF=[];
  mCkts.forEach(x=>{const va=+(x.va||0),bkr=+(x.breaker||20);if(va>0){const fla=va/sysVolt,req=Math.ceil(fla*2.5/5)*5;if(bkr<req)mF.push(`"${x.desc}" FLA ${fla.toFixed(1)}A → need ${req}A`);}});
  if(mCkts.length>0)items.push({tool:"motor",id:"Motor Circuit Rules",
    value:mF.length===0?`${mCkts.length} OK`:`${mF.length} fail`,
    detail:mF.length===0?`${mCkts.length} motor circuits comply PEC 4.30`:mF.slice(0,2).join(" | "),
    status:mF.length===0?"PASS":"FAIL",numeric:mF.length});
  const GEC_TBL={14:14,12:12,10:10,8:10,6:10,4:8,3:8,2:8,1:6,"1/0":6,"2/0":4,"3/0":4,"4/0":2,250:2,300:2,350:2,400:2,500:1};
  const svcWire=rawDemandVA!=null?AWG_LIST.find(s=>(WIRE_DATA[s]?.ampacity||0)>=Math.ceil((rawDemandVA/sysVolt)*1.25/5)*5)||null:null;
  if(svcWire!=null){const rg=GEC_TBL[svcWire];items.push({tool:"grounding",id:"Grounding (GEC)",
    value:rg?`#${rg} AWG`:"—",detail:`Service #${svcWire} AWG → GEC min #${rg||"?"} AWG Cu (PEC Table 2.50.12)`,status:"COMPUTED",numeric:rg||0});}
  // ── P4 Multi-circuit VD ───────────────────────────────────────────────────
  const vdCkts=panCircuits.filter(x=>+(x.va||0)>0);
  if(vdCkts.length>0){
    const vpf=0.9,sinP=Math.sin(Math.acos(vpf));
    const FL={1:15,2:25,3:35,4:45,5:55,6:65};
    const gLen=d=>{const m=String(d||"").match(/[Ff](\d)/);return m?FL[+m[1]]||30:30;};
    const vdR=vdCkts.map(x=>{
      const va=+(x.va||0),bkr=+(x.breaker||20);
      const ws=x.wire||AWG_SIZES.find(s=>(WIRE_DATA[s]?.ampacity||0)>=bkr)||12;
      const R=WIRE_DATA[ws]?.resistance||WIRE_DATA[12].resistance;
      const loadA=va/sysVolt,len=x.length||gLen(x.desc);
      const vd=2*loadA*len*(R*vpf+0.0492*sinP)/1000,vdPct=sysVolt>0?vd/sysVolt*100:0;
      const minWire=AWG_SIZES.find(s=>{const Rr=WIRE_DATA[s]?.resistance||0;return Rr>0&&2*loadA*len*(Rr*vpf+0.0492*sinP)/1000/sysVolt*100<=3;})||"500+";
      return{...x,ws,loadA,len,vd,vdPct,minWire,pass:vdPct<=3};
    });
    const vdF=vdR.filter(r=>!r.pass),worst=vdR.reduce((a,b)=>b.vdPct>a.vdPct?b:a,{vdPct:0,desc:""});
    items.push({tool:"vdrop_table",id:"Multi-Circuit VD",
      value:vdF.length===0?`All ${vdR.length} PASS`:`${vdF.length} exceed 3%`,
      detail:vdF.length===0?`All OK. Worst: ${worst.vdPct.toFixed(2)}% (${worst.desc||"?"})`:vdF.slice(0,2).map(r=>`"${r.desc||""}" ${r.vdPct.toFixed(2)}%`).join(", "),
      status:vdF.length===0?"PASS":"FAIL",numeric:vdF.length,vdRows:vdR});
  }
  const passCount    = items.filter(i=>i.status==="PASS").length;
  const failCount    = items.filter(i=>i.status==="FAIL").length;
  const warnCount    = items.filter(i=>i.status==="WARNING").length;
  const noInputCount = items.filter(i=>i.status==="NO INPUT").length;
  return { items, summary: { passCount, failCount, warnCount, noInputCount, totalRun: items.length } };
}

// ─── ELEC INTELLIGENCE PANEL ─────────────────────────────────────────────────
// ─── ELEC INTELLIGENCE PANEL ─────────────────────────────────────────────────

export default runElecComputations;
