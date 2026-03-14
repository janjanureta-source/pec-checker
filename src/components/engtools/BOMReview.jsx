import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../../theme.jsx";
import { Icon } from "../shared/Icon.jsx";
import { callAI, toBase64, compressImage, getKey } from "../../utils/callAI.js";
import { Card, Label } from "../../theme.jsx";
import { repairBomJSON } from "../../utils/callAI.js";
import { addHistoryEntry } from "../../utils/history.js";
import { NoKeyBanner } from "../electrical/PlanChecker.jsx";

const BOM_GENERATE_PROMPT = `You are a licensed Civil Engineer and Quantity Surveyor in the Philippines generating a CONTRACTOR-READY Bill of Materials (BOQ) from engineering plans.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHILIPPINE CONSTRUCTION RATE REFERENCE TABLE
Rate Source: NCR Private Market (Q1 2026) | DPWH Blue Book 2024 | PSA CMWPI
Next review: July 2026
Note: NCR Private = materials + labor all-in unless marked (M) for materials only
      DPWH = DPWH Blue Book all-in unit cost (labor + materials + equipment)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[A] EARTHWORKS (NCR Private / DPWH)
Excavation common soil: ₱280-380/m3 / DPWH ₱320/m3
Excavation hard soil/rock: ₱580-750/m3 / DPWH ₱680/m3
Backfill & compaction: ₱180-250/m3 / DPWH ₱210/m3
Gravel bedding 100mm: ₱420-550/m3 / DPWH ₱480/m3
Soil poisoning (termite): ₱85-120/m2 / DPWH ₱95/m2

[B] CONCRETE — Materials only (M)
Ready-mix f'c=17.2MPa (2500psi): ₱4,800-5,500/m3 (M) / DPWH ₱5,200/m3 all-in
Ready-mix f'c=20.7MPa (3000psi): ₱5,500-6,500/m3 (M) / DPWH ₱6,100/m3 all-in
Ready-mix f'c=24.1MPa (3500psi): ₱6,000-7,000/m3 (M) / DPWH ₱6,700/m3 all-in
Ready-mix f'c=27.6MPa (4000psi): ₱6,800-7,800/m3 (M) / DPWH ₱7,400/m3 all-in
Site-mixed concrete (Class A): ₱7,500-9,000/m3 all-in / DPWH ₱8,200/m3 all-in
Concrete topping 50mm: ₱850-1,100/m2 all-in / DPWH ₱950/m2 all-in
Cement: ₱270-310/bag (M) | Sand: ₱1,200-1,800/m3 (M) | Gravel: ₱1,500-2,200/m3 (M)

[C] FORMWORKS
Column forms (plywood+lumber): ₱480-620/m2 / DPWH ₱540/m2
Beam forms (bottom+sides): ₱420-560/m2 / DPWH ₱490/m2
Slab forms (shoring+ply): ₱380-500/m2 / DPWH ₱440/m2
Wall forms (both faces): ₱360-480/m2 / DPWH ₱420/m2
Steel formwork rental: ₱180-280/m2/month

[D] REBAR — Materials only (M), use 0.00617×dia²×L for weight
10mmØ deformed bar (Grade 33): ₱52-58/kg (M) / DPWH ₱58/kg all-in
12mmØ deformed bar (Grade 40): ₱54-60/kg (M) / DPWH ₱62/kg all-in
16mmØ deformed bar (Grade 40): ₱56-62/kg (M) / DPWH ₱65/kg all-in
20mmØ deformed bar (Grade 40): ₱58-65/kg (M) / DPWH ₱68/kg all-in
25mmØ deformed bar (Grade 60): ₱60-68/kg (M) / DPWH ₱72/kg all-in
32mmØ deformed bar (Grade 60): ₱62-70/kg (M) / DPWH ₱75/kg all-in
Rebar tying wire (GI #16): ₱1,300-1,600/bundle (M)
Rebar labor only: ₱12-18/kg

[E] MASONRY & PLASTERING
CHB 4" (10cm): ₱13-16/pc (M) | laid: ₱380-480/m2 all-in / DPWH ₱420/m2 all-in
CHB 5" (15cm): ₱16-19/pc (M) | laid: ₱420-520/m2 all-in / DPWH ₱460/m2 all-in
CHB 6" (20cm): ₱18-22/pc (M) | laid: ₱450-560/m2 all-in / DPWH ₱500/m2 all-in
Solid concrete blocks: ₱28-35/pc (M)
Plastering (1 face): ₱220-280/m2 all-in / DPWH ₱250/m2 all-in
Plastering (both faces): ₱380-500/m2 all-in / DPWH ₱450/m2 all-in
Skim coat: ₱80-120/m2 all-in / DPWH ₱95/m2 all-in
Grouting tile joints: ₱45-65/m2 all-in

[F] STRUCTURAL STEEL — Materials only (M)
Wide flange W150x13: ₱850-980/m (M) | W200x27: ₱1,400-1,650/m (M)
Angle bar 50x50x5mm: ₱380-460/m (M) | 75x75x6mm: ₱580-680/m (M)
Tubular 2"x2"x2mm: ₱320-400/m (M) | 3"x3"x3mm: ₱680-800/m (M)
Flat bar 50x6mm: ₱180-220/m (M) | 100x6mm: ₱350-420/m (M)
C-channel 150x65mm: ₱680-820/m (M)
Steel fabrication labor: ₱85-120/kg
Steel erection labor: ₱45-65/kg
Structural steel paint (red oxide): ₱180-240/m2 all-in

[G] ROOFING & METAL WORKS
Long-span GA26 pre-painted: ₱320-420/lm (M) | installed: ₱480-600/lm
Long-span GA24 pre-painted: ₱420-520/lm (M) | installed: ₱580-700/lm
Corrugated GI sheet GA26: ₱260-340/lm (M) | installed: ₱380-480/lm
Steel roof truss (fabricated): ₱2,200-3,200/m2 of roof plan all-in / DPWH ₱2,800/m2
C-purlin 2"x4"x2mm: ₱420-520/pc 6m (M) | 2"x6"x2mm: ₱580-680/pc 6m (M)
Sag rod 12mmØ: ₱180-220/pc (M)
Box gutter GA26 16": ₱750-950/lm all-in
Ridge roll: ₱380-480/lm all-in
Flashing: ₱850-1,100/lm all-in
Insulation (polyiso 50mm): ₱1,800-2,200/roll covers 10m2 (M)
Fascia board (fiber cement): ₱320-420/lm all-in

[H] CEILING SYSTEM
Gypsum board 9mm 4'x8': ₱480-550/sheet (M) | installed: ₱620-720/sheet
Metal furring 19mm: ₱120-160/pc 4m (M)
Wall angle 25mm: ₱55-70/pc 4m (M)
Carrying channel: ₱130-160/pc 4m (M)
PVC spandrel (eaves): ₱140-165/pc 3m (M) | installed: ₱380-480/m2
Fiber cement board 6mm: ₱420-480/sheet (M)
Acoustic tile 600x600mm: ₱380-520/m2 installed
Ceiling labor only: ₱180-260/m2

[I] DOORS & WINDOWS
Flush door 0.9x2.1m (solid): ₱4,500-6,500/set complete / DPWH ₱5,800/set
Panel door 0.9x2.1m (mahogany): ₱8,500-12,000/set complete / DPWH ₱10,000/set
Steel door 0.9x2.1m: ₱9,500-14,000/set complete / DPWH ₱12,000/set
Hollow metal door 1.2x2.1m: ₱12,000-18,000/set complete
Aluminum sliding window (anodized): ₱2,800-4,200/m2 complete
Aluminum casement window: ₱3,200-4,800/m2 complete
UPVC window: ₱4,500-6,500/m2 complete
Fixed glass window (tempered 10mm): ₱4,800-7,000/m2 complete
Aluminum framed glass door: ₱12,000-18,000/set complete
Fire-rated door (1-hr): ₱22,000-35,000/set complete
Roller shutter (manual): ₱6,500-9,500/m2 complete
Door jamb (hardwood): ₱1,800-2,800/set (M)
Lockset (cylindrical): ₱1,200-2,200/set (M) | mortise: ₱2,800-4,500/set (M)
Hinges (pair): ₱280-480/pair (M)
Door closer (hydraulic): ₱1,800-3,200/pc (M)

[J] CARPENTRY & MILLWORK
Cabinet (modular, low): ₱4,800-7,500/lm all-in / high: ₱5,500-8,500/lm all-in
Kitchen counter (granite): ₱4,500-7,000/lm all-in (M only)
Kitchen counter (tiles): ₱2,800-4,200/lm all-in
Built-in wardrobe: ₱6,500-10,000/lm all-in
Wall paneling (PVC): ₱580-780/m2 all-in | wood: ₱1,800-3,200/m2 all-in
Shelving (particle board): ₱2,200-3,500/lm all-in
Stair (RC finished): ₱28,000-45,000/flight all-in
Stair railing (tubular): ₱3,200-4,800/lm all-in | SS: ₱8,500-14,000/lm all-in

[K] FLOORING & WATERPROOFING
Tiles 20x20cm: ₱280-360/m2 (M) | installed: ₱580-720/m2
Tiles 30x30cm: ₱300-400/m2 (M) | installed: ₱620-780/m2
Tiles 30x60cm: ₱420-560/m2 (M) | installed: ₱720-900/m2
Tiles 60x60cm: ₱500-700/m2 (M) | installed: ₱820-1,050/m2
Tile adhesive (25kg bag): ₱280-320/bag covers 4m2 (M)
Grout (2kg bag): ₱85-110/bag covers 8m2 (M)
Hardwood flooring (narra): ₱2,800-4,200/m2 all-in
Vinyl plank flooring: ₱850-1,400/m2 all-in
Epoxy floor coating: ₱480-720/m2 all-in
Waterproofing (cementitious): ₱380-520/m2 all-in / DPWH ₱450/m2 all-in
Waterproofing (membrane torch-applied): ₱800-1,200/m2 all-in / DPWH ₱950/m2 all-in
Waterproofing (crystalline): ₱650-900/m2 all-in

[L] PAINTING & COATINGS
Interior paint (2 coats): ₱85-130/m2 all-in / DPWH ₱110/m2 all-in
Exterior paint (2 coats weathershield): ₱120-180/m2 all-in / DPWH ₱155/m2 all-in
Ceiling paint (2 coats): ₱100-140/m2 all-in / DPWH ₱120/m2 all-in
Enamel paint (trim/doors): ₱180-240/m2 all-in
Epoxy paint (floor/wet areas): ₱320-480/m2 all-in
Paint labor only: ₱45-65/m2

[M] ELECTRICAL — Materials only (M) unless stated
THHN wire 2.0mm²: ₱22-28/m (M) | 3.5mm²: ₱38-48/m | 5.5mm²: ₱60-75/m
THHN wire 8mm²: ₱95-115/m | 14mm²: ₱130-160/m | 22mm²: ₱200-250/m
THHN wire 38mm²: ₱350-430/m | 60mm²: ₱520-650/m | 100mm²: ₱850-1,050/m | 125mm²: ₱1,100-1,300/m
PVC conduit 1/2" (RSC): ₱55-70/pc 10ft | 3/4": ₱75-95/pc | 1": ₱100-130/pc
PVC conduit fittings (elbow/coupling): ₱28-45/pc
Junction box 4"x4": ₱38-50/pc | Utility box 2"x4": ₱28-38/pc
MCB 1P 15-30A: ₱750-900/pc | 2P 30A: ₱1,200-1,500/pc
MCB 2P 60A: ₱2,200-2,800/pc | MCB 3P 100A: ₱4,500-5,500/pc
MCCB 100A: ₱5,500-7,000/pc | 200A: ₱12,000-14,000/pc | 400A: ₱22,000-28,000/pc
Panelboard (18-branch): ₱8,500-11,000/pc | 24-branch: ₱11,000-14,000/pc
Convenience outlet (duplex): ₱280-380/pc (M) | installed: ₱680-850/pc
Switch 1-gang: ₱180-250/pc (M) | 2-gang: ₱280-380/pc | 3-way: ₱380-480/pc
Downlight 6W LED: ₱380-520/pc (M) | installed: ₱680-850/pc
Fluorescent 2x36W: ₱850-1,200/set installed
ACU outlet (dedicated): ₱850-1,200/set installed
Exhaust fan (ceiling): ₱1,800-2,800/pc installed
Service entrance labor: ₱180,000-220,000/unit lot

[N] PLUMBING — Materials only (M) unless stated
PPR pipe 1/2" (12mm): ₱180-220/6m (M) | 3/4" (18mm): ₱280-350/6m
PPR pipe 1" (25mm): ₱420-520/6m (M) | 1.5" (40mm): ₱680-820/6m
PPR fittings (elbow/tee/coupling): ₱90-160/pc (M)
Gate valve 1/2": ₱750-900/set | 3/4": ₱950-1,200/set | 1": ₱1,200-1,500/set
Check valve: ₱750-900/set | Float valve: ₱380-520/pc
PVC pipe 4" (sewer): ₱420-520/6m (M) | 3": ₱280-360/6m | 2": ₱180-230/6m
PVC pipe fittings 4": ₱110-140/pc | 3": ₱90-120/pc | 2": ₱90-110/pc
G.I. pipe 1/2": ₱380-460/6m (M) | 3/4": ₱520-640/6m
Water closet (standard): ₱12,000-18,000/set complete / DPWH ₱15,000/set
Lavatory (wall hung): ₱7,000-10,000/set complete / DPWH ₱8,500/set
Kitchen sink (SS single): ₱6,000-9,000/set complete
Shower (standard): ₱6,000-9,000/set complete
Bathtub (acrylic): ₱18,000-28,000/set complete
Floor drain (chrome): ₱450-600/pc | Roof drain: ₱850-1,200/pc
Angle valve: ₱320-420/pc | Flexible hose: ₱320-400/pc
Faucet (lavatory): ₱1,200-2,800/pc | Shower mixer: ₱2,500-6,500/pc
Water heater (instant electric): ₱4,500-7,500/pc installed
Grease trap (300x600mm): ₱900-1,200/pc | Septic vault: ₱45,000-80,000/unit all-in
Catch basin: ₱3,500-5,500/pc all-in

[O] HVAC & AIR CONDITIONING
Split-type ACU 1HP: ₱28,000-38,000/set installed | 1.5HP: ₱35,000-48,000/set
Split-type ACU 2HP: ₱45,000-62,000/set installed | 2.5HP: ₱55,000-75,000/set
Cassette-type ACU 2HP: ₱65,000-90,000/set installed | 3HP: ₱85,000-120,000/set
Window-type ACU 1HP: ₱18,000-25,000/set installed
Inverter split-type 1HP premium: ₱42,000-58,000/set installed
ACU lineset (per meter): ₱850-1,200/m installed
ACU drain line: ₱280-420/m installed
Exhaust fan wall 12": ₱3,800-5,500/pc installed | 18": ₱6,500-9,500/pc

[P] FIRE PROTECTION (RA 9514 — 3 storeys and above)
Wet pipe sprinkler system: ₱1,200-2,000/m2 all-in (pipes + heads + valves)
Sprinkler head (pendant): ₱1,200-1,800/pc installed
BI seamless pipe 25mm: ₱480-620/m (M) | 50mm: ₱850-1,100/m
Alarm valve assembly: ₱85,000-120,000/set
Fire pump set (40HP): ₱550,000-850,000/set | 60HP: ₱750,000-1,100,000/set
Jockey pump: ₱85,000-130,000/unit
Fire hose cabinet with reel: ₱35,000-65,000/unit installed
Fire extinguisher 10lbs dry chem: ₱3,500-6,000/pc
Fire detection & alarm system: ₱450-850/m2 all-in (detectors + panel + wiring)
Heat/smoke detector: ₱2,800-4,500/pc installed
Fire alarm pull station: ₱3,500-5,500/pc installed
FDAS control panel: ₱85,000-150,000/set

[Q] GENERATOR & EMERGENCY POWER
Genset 25KVA: ₱320,000-480,000/set | 50KVA: ₱520,000-750,000/set
Genset 100KVA: ₱850,000-1,200,000/set | 200KVA: ₱1,400,000-1,900,000/set
Genset 400KVA: ₱2,200,000-3,200,000/set | 500KVA: ₱2,800,000-3,800,000/set
ATS 100A: ₱45,000-65,000/set | 200A: ₱85,000-120,000/set | 400A: ₱150,000-220,000/set
Transfer switch wiring: ₱35,000-65,000/lot
Genset concrete pad: ₱18,000-28,000/lot
Day tank (200L): ₱28,000-42,000/set installed

[R] ELEVATORS & VERTICAL TRANSPORT
Passenger elevator 630kg 4-stop: ₱3,500,000-5,500,000/unit installed
Passenger elevator 800kg 6-stop: ₱4,500,000-7,000,000/unit installed
Service/freight elevator 1000kg: ₱5,000,000-8,000,000/unit installed
Escalator (3.5m rise): ₱4,500,000-7,500,000/unit installed
Elevator machine room works: ₱250,000-450,000/lot
Elevator pit works: ₱180,000-320,000/lot

[S] LABOR RATES (NCR — per day, 8 hours)
Project foreman: ₱1,100-1,400/day | General foreman: ₱1,400-1,800/day
Mason (licensed): ₱700-900/day / DPWH ₱800/day
Carpenter: ₱700-900/day / DPWH ₱800/day
Steel man (rebar): ₱700-850/day / DPWH ₱780/day
Electrician (licensed): ₱900-1,100/day / DPWH ₱1,000/day
Plumber (licensed): ₱850-1,050/day / DPWH ₱950/day
Painter: ₱620-800/day / DPWH ₱700/day
Laborer (unskilled): ₱500-620/day / DPWH ₱570/day
Equipment operator: ₱950-1,200/day / DPWH ₱1,050/day

[T] EQUIPMENT & MISC
Scaffolding (facade): ₱280-380/m2 of facade area all-in
Backhoe rental: ₱3,500-5,000/hour | Dump truck: ₱2,800-4,000/trip
Concrete vibrator rental: ₱850-1,200/day | Plate compactor: ₱750-1,000/day
Concrete mixer (1 bagger): ₱650-850/day | Transit mixer delivery: ₱1,200-1,800/m3
Tower crane: ₱180,000-280,000/month | Mobile crane 50T: ₱28,000-42,000/day
GI tie wire: ₱1,300-1,600/bundle | Common wire nail: ₱90-110/kg
Concrete nails: ₱180-220/kg | Plywood 1/4" 4x8: ₱480-560/sheet
Plywood 1/2" 4x8: ₱680-780/sheet | Coco lumber 2x3: ₱75-95/pc 10ft
Goodluck lumber 2x4: ₱95-120/pc 10ft | Hardwood 2x6: ₱280-360/pc 10ft

[U] DPWH BLUE BOOK 2024 — ALL-IN UNIT COSTS (labor + materials + equipment)
Source: DPWH Standard Specifications for Public Works & Highways Vol. II, 2024 edition
Use these for government projects and DPWH-funded works:
Concrete Class A (f'c=20.7MPa): ₱6,100/m3 | Class B (f'c=17.2MPa): ₱5,200/m3
Reinforced concrete (installed): ₱8,500-12,000/m3 (concrete + rebar + forms)
Rebar supply & install Grade 40: ₱65/kg | Grade 60: ₱72/kg
Masonry CHB 4" laid: ₱420/m2 | CHB 6" laid: ₱500/m2
Plastering (1 face): ₱250/m2 | Both faces: ₱450/m2
Waterproofing (cementitious): ₱450/m2 | Membrane: ₱950/m2
Painting (2 coats): ₱110/m2 interior | ₱155/m2 exterior
Structural steel (fabricated+installed): ₱180/kg
Formworks (ply+lumber): ₱490/m2 slab | ₱540/m2 column | ₱490/m2 beam
Steel roof truss: ₱2,800/m2 of roof plan
Electrical rough-in (conduit+wire): ₱850-1,200/m2 of floor area
Plumbing rough-in: ₱650-950/m2 of floor area
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MANDATORY TAKEOFF STEPS — follow every one:

STEP 1 — CONCRETE (always break by element):
a) Footings: count from foundation plan, compute L x W x D per type
b) Footing Tie Beam: from FTB details, L x W x D
c) Columns GF to 2F: count per schedule, size x height (floor-to-floor)
d) Columns 2F to RF: same
e) Slab on Grade: GF floor area x slab thickness (typically 0.10m) PLUS carport, walkways, lanai
f) 2F Slab: 2F floor area x thickness
g) Roof Slab (if any): roof slab area x thickness
h) Beams 2F: from beam schedule, sum all L x W x D per type
i) Roof Beams: same
j) Stairs: from stair detail, estimate volume per flight
k) Wall footing/lintel: from wall footing details

STEP 2 — REBAR (per element, per diameter, in both pcs AND kg):
For EVERY concrete element above, list rebar by diameter:
- 16mm main bars: count pcs from schedule x length + 40-dia lap = kg (0.00617 x 256 x total_length)
- 10mm ties/stirrups: count pcs from schedule x length = kg (0.00617 x 100 x total_length)
- 10mm slab bars: area / spacing x length = kg
- 10mm CHB wall bars: 1 vertical bar per 0.80m o.c., horizontal every 3 courses
ALWAYS include rebar for: FTB, Slab on Grade, columns (ties), beams (stirrups), walls (vertical+horizontal in cells)

STEP 3 — MASONRY (critical — most commonly undercounted):
FORMULA: wall_area_m2 / 0.08 x 1.05 = number of 4" CHB (0.20x0.40 face = 0.08m2 each)
FORMULA: wall_area_m2 / 0.10 x 1.05 = number of 5" or 6" CHB (same face, thicker)
- Exterior walls: measure all perimeter walls both floors, subtract openings (doors+windows)
  Typical 2-storey building: exterior area = (building perimeter x total wall height) - door+window openings
  For a 20x20m building 2 storeys high: perimeter=80m x 6.5m height = 520m2 less ~35% openings = ~338m2
- Interior partition walls: from floor plans
- Fence/perimeter walls: from site plan
- PLASTERING (always follows masonry): wall_area x 2 faces x ₱380-500/m2 (both sides of every wall)
  Include: exterior plaster, interior plaster, fence plaster — each as its own line

STEP 4 — FORMWORKS & SCAFFOLDING:
- Column formworks: perimeter x height x number of columns (m2)
- Beam formworks: (beam width + 2 x beam depth) x total beam length (m2)
- Slab formworks: slab area (m2)
- SCAFFOLDING: always include as separate item — estimate facade area x ₱280-380/m2
  For typical 2-storey building, scaffolding ≈ ₱250,000-₱400,000

STEP 5 — ROOFING:
- Roofing sheets: roof plan area x 1.10 waste factor, in linear meters
- Steel trusses: count from truss layout plan
- C-purlins: count from framing plan
- Sag rods: count from framing plan
- Box gutter: measure gutter length
- Flashings: count ridge, eave, valley flashings
- Insulation: roof area

STEP 6 — CEILING SYSTEM (all components required):
a) Double furring: ceiling area x 2 pcs/m2
b) Wall angle: ceiling perimeter in linear meters, convert to pcs
c) Carrying channel: ceiling area / 1.2m spacing
d) Gypsum board 9mm: ceiling area / 2.88m2 per sheet (1.2x2.4m)
e) PVC spandrel (for eaves/exterior soffits): measure from plans

STEP 7 — FLOORING:
- Identify tile zones from floor plan: main living (60x60), T&B (30x60), balcony/ext (20x20)
- Tile adhesive: total tiled area / 4m2 per bag (standard coverage)
- Grout: 1 bag per 8-10m2
- Waterproofing: all wet areas (T&B floors + balconies)
- Stair treads: count from stair detail

STEP 8 — PAINTING (3 separate lines minimum):
a) Exterior walls: exterior wall area after openings x rate
b) Interior walls: interior wall area x rate
c) Ceiling: ceiling area x rate
d) Skim coat: for EACH painted surface (interior walls, exterior walls, ceiling) as separate lines
   Note: skim coat area = same as paint area

STEP 9 — ELECTRICAL (all components individually):
a) Service entrance: main feeder wire size from load schedule x run length (usually 200m for duplex)
   CRITICAL: 125mm2 THHN costs ₱1,100-1,300/m — always include this
b) Panel boards: from electrical plans, one per unit
c) MCB breakers: list by amperage from panel schedule
d) PVC conduit: count from layout, typically 250-350 pcs for 2-storey duplex
e) Junction boxes 4x4: count from layout
f) Utility boxes 2x4: count from layout
g) THHN wire by gauge: from load schedule — minimum 3 gauges (2mm2, 3.5mm2, 5.5mm2)
h) Switches: 1-gang, 2-gang, 3-gang, 3-way — count from lighting layout
i) Convenience outlets: count from power layout
j) Special outlets: ACU, ref, range, water heater — count from layout
k) Lighting fixtures: downlights, wall lights, exhaust fans — count from lighting layout
l) Service entrance labor: always include as lot item ₱180,000-₱220,000 per unit

STEP 10 — PLUMBING (all components individually):
a) PPR pipe 3/4" (18mm): cold water lines GF+2F in linear meters
b) PPR pipe 1/2" (12mm): branch lines in linear meters
c) Gate valves: count from water line layout
d) Check valves: count from water line layout
e) PPR accessories (tees, elbows, couplings): estimate 2-3x pipe count
f) PVC 4" sewer: measure from sewer layout
g) PVC 3" drain: measure from drain layout
h) PVC 2" vent: measure from vent layout
i) PVC accessories per size
j) Catch basins: count from storm drain layout
k) Each fixture type separately: WC x count, lavatory x count, kitchen sink x count, shower x count, bathtub x count, floor drain x count
l) Angle valves, flexible pipes: count per fixture
m) Grease trap: count from plans
n) Septic tank: one per unit as shown

STEP 11 — SECONDARY STRUCTURES (always check):
- Perimeter fence: from site plan — CHB area + plastering + rebar + concrete
- Gate: tubular steel + hardware
- Carport slab: area x thickness + rebar
- Canopy: pre-cast or RC as shown
- Stair railings: tubular, glass, hardware
- Balcony railings: from plans

STEP 12 — GENERAL REQUIREMENTS:
- Mobilization/demobilization: always include
- Temporary facilities: always include

STEP 13 — FIRE PROTECTION (RA 9514):
⚠️ STRICT RULE: SKIP THIS ENTIRE STEP (include ZERO fire protection line items) if:
   - Building is 1 or 2 storeys AND occupancy is residential (house, duplex, townhouse, apartment ≤2F)
   - A 2-storey duplex residence = SKIP. Do not include sprinklers, fire pump, or FDAS.
   
ONLY include if building is 3 storeys or more, OR occupancy is commercial/institutional/industrial:
a) Wet pipe sprinkler system: total_floor_area x ₱1,200–₱2,000/sqm
b) Fire pump set: ₱850,000–₱1,500,000/set
c) Fire hose cabinet with reel: ₱35,000–₱65,000/set per floor per stairwell
d) Fire extinguisher 10lbs dry chemical: 1 per 200 sqm — ₱3,500–₱6,000/pc
e) Fire detection & alarm system: total_floor_area x ₱450–₱850/sqm
Note: Fire extinguishers (item d only) are recommended for all buildings but not legally required for 1-2 storey residential. Include only if client requests.

STEP 14 — GENERATOR SET + ATS:
⚠️ STRICT RULE: SKIP THIS ENTIRE STEP (include ZERO generator line items) if:
   - Building is residential (house, duplex, townhouse, apartment) of ANY storey count, UNLESS plans explicitly show a generator room or generator in the electrical layout
   - A 2-storey duplex residence = SKIP. Do not include generator or ATS.

ONLY include if:
   - Plans explicitly show a generator room or generator symbol in electrical plans, OR
   - Occupancy is commercial, office, hotel, hospital, school, or other institutional, OR
   - Building is 4+ storeys non-residential

When included:
a) Generator set: KVA = (total floor area x 50VA/sqm) / 0.8 PF, minimum 25KVA
   - Rate: 25KVA ₱320,000–₱480,000 | 50KVA ₱520,000–₱750,000 | 100KVA ₱850,000–₱1,200,000 | 200KVA ₱1,400,000–₱1,900,000
   - Include: acoustic enclosure, exhaust system, fuel tank, concrete pad
b) Automatic Transfer Switch (ATS): 1 unit matched to generator KVA
   - Rate: 100A ATS ₱45,000–₱65,000 | 200A ₱85,000–₱120,000 | 400A ₱150,000–₱220,000

STEP 15 — EXHAUST FANS / VENTILATION FANS:
Count from plans or estimate by use:
a) Toilet exhaust fans: 1 per toilet group (ceiling cassette centrifugal type)
   - Estimate: total WC count / 3 fans per group (round up)
   - Rate: ₱4,500–₱8,500/unit installed
b) Genset room ventilation fans: ONLY if generator was included in Step 14 above
   2 units per generator room (supply + exhaust) — ₱18,000–₱35,000/unit
c) Kitchen exhaust fan: 1 per kitchen area if shown
   - Rate: ₱8,000–₱15,000/unit
Include this step for all buildings with toilet facilities.

STEP 16 — PUMPS (include for multi-storey buildings with cistern/water storage):
a) Sump pump: 1 unit for any building with basement or lower ground floor
   - Rate: ₱18,000–₱35,000/unit (3HP submersible, complete with controls)
b) Transfer pump: 1 unit if building has underground cistern feeding rooftop tank
   - Rate: ₱25,000–₱45,000/unit (2HP centrifugal, complete)
c) Booster pump set: 1 set if building is 4+ storeys (to maintain pressure upper floors)
   - Rate: ₱85,000–₱150,000/set (duplex booster pump system)
d) Rooftop water tanks: 1,000-gal GRP tank per ~50 occupants or 1 per water zone
   - Rate: ₱45,000–₱75,000/unit (1,000-gal GRP tank installed)
Include only items applicable to the building type and storey count.

STEP 17 — ELEVATOR POWER SUPPLY PANEL (PP1):
For buildings with elevator(s):
a) Elevator power panel (PP1): 1 unit per elevator — 100AT 3P panelboard with dedicated feeder
   - Rate: ₱45,000–₱85,000/unit (panel + feeder wire + conduit to MDP)
b) Feeder wire: from MDP to elevator machine room — estimate 1.5x floor-to-floor height x number_of_floors
   - Wire size: 30mm² THHN 3-phase + ground
Include only if elevator is shown or implied by building height (5+ storeys).

STEP 18 — INDIRECT COSTS (always the final line items):
Apply to ALL projects. Use Philippine commercial construction standard rates:
a) Transportation / hauling: 2% of direct cost subtotal — lot item
b) Overhead and supervision: 12% of direct cost subtotal — lot item
c) Contractor's profit: 7% of direct cost subtotal — lot item
TOTAL indirect = 21% of direct cost subtotal (not compounded — each applied to the same base)
Include these as 3 separate line items under trade="Indirect Costs" at the end of lineItems.
qtyBasis for each: "X% of direct cost subtotal ₱[amount]"

OWNER-SUPPLIED ITEMS: list with qty=0, totalLow=0, totalHigh=0, isOwnerSupply=true (still include — do not omit)

OUTPUT RULES:
- Return ONLY valid JSON. No markdown, no backticks, no text before or after.
- String values max 90 chars. Be concise everywhere.
- qtyBasis required for ALL concrete, rebar, CHB, tile, and paint items.
- NEVER stop early. ALL 18 steps must be evaluated. However, Steps 13 (Fire Protection) and 14 (Generator) have STRICT SKIP rules above — a 2-storey residential building must have ZERO fire protection and ZERO generator line items unless explicitly shown in plans.
- Steps 17 (Indirect Costs) and 18 (General Requirements) are always included regardless of building type.
- To stay within token limits, keep descriptions SHORT (≤60 chars) and omit qtyBasis for non-structural items. Do NOT omit entire categories.
- SELF-CHECK before closing JSON: confirm lineItems includes at least one entry each for Fire Protection, Generator Set, and Indirect Costs. If any are missing, add them before closing.
- The summary.notes field must state which of Steps 13–18 were included and why any were omitted.

JSON format:
{
  "summary": {
    "projectName": "string",
    "projectType": "string",
    "projectLocation": "string or null",
    "totalFloorArea": 0,
    "floorAreaBreakdown": "string",
    "numberOfStoreys": 0,
    "numberOfUnits": 1,
    "scopeNote": "e.g. Quantities cover BOTH units of a duplex.",
    "structuralSystem": "string",
    "finishLevel": "Basic|Standard|High-end",
    "overallStatus": "COMPLETE|PARTIAL",
    "totalCostLow": 0,
    "totalCostHigh": 0,
    "totalCostMid": 0,
    "costPerSqmLow": 0,
    "costPerSqmHigh": 0,
    "notes": "string",
    "limitations": ["string"]
  },
  "lineItems": [
    {
      "id": 1,
      "trade": "string",
      "subCategory": "string",
      "description": "string",
      "specification": "string or null",
      "unit": "m3|m2|kg|pcs|ln.m|set|lot|bag|sheet|roll|m",
      "qty": 0,
      "qtyBasis": "computation string or null",
      "unitRateLow": 0,
      "unitRateHigh": 0,
      "totalLow": 0,
      "totalHigh": 0,
      "isOwnerSupply": false,
      "confidence": "HIGH|MEDIUM|LOW",
      "confidenceNote": "string or null"
    }
  ],
  "tradeSummary": [
    { "trade": "string", "itemCount": 0, "totalLow": 0, "totalHigh": 0, "percentOfTotal": 0 }
  ]
}`;

const BOM_SYSTEM_PROMPT = `You are a licensed Civil Engineer and Quantity Surveyor with deep expertise in:
- DPWH Blue Book 2024 (Standard Specifications for Public Works and Highways)
- DPWH Cost Estimates Guidelines (latest edition)
- PhilGEPS and DPWH Unit Cost Reference (2024-2025)
- Philippine Construction Cost Guide (CIAP)
- PSA (Philippine Statistics Authority) CMWPI construction cost indices
- Rate reference: Q1 2026 NCR market | DPWH Blue Book 2024 all-in unit costs

NCR PRIVATE MARKET BENCHMARKS (Q1 2026 — materials only unless stated):
Concrete f'c=20.7MPa ready-mix: ₱5,500-6,500/m3 | f'c=24MPa: ₱6,000-7,000/m3
Rebar 10mm: ₱52-58/kg | 12mm: ₱54-60/kg | 16mm: ₱56-62/kg | 20mm: ₱58-65/kg
CHB 4": ₱13-16/pc | CHB 6": ₱18-22/pc | Cement: ₱270-310/bag
Sand: ₱1,200-1,800/m3 | Gravel: ₱1,500-2,200/m3
Formworks: ₱380-540/m2 | Plastering (both faces): ₱380-500/m2
Tiles 60x60: ₱500-700/m2 materials | installed: ₱820-1,050/m2
Paint interior: ₱85-130/m2 | exterior: ₱120-180/m2
Doors (flush): ₱4,500-6,500/set | Windows (aluminum): ₱2,800-4,200/m2
Split ACU 1HP: ₱28,000-38,000/set installed | 2HP: ₱45,000-62,000/set
Labor — mason: ₱700-900/day | carpenter: ₱700-900/day | electrician: ₱900-1,100/day | laborer: ₱500-620/day

DPWH BLUE BOOK 2024 ALL-IN BENCHMARKS (for government/DPWH-funded projects):
Concrete Class A all-in: ₱6,100/m3 | Class B: ₱5,200/m3
Rebar Grade 40 supply+install: ₱65/kg | Grade 60: ₱72/kg
Masonry CHB 4" all-in: ₱420/m2 | CHB 6": ₱500/m2
Plastering 1 face: ₱250/m2 | both faces: ₱450/m2
Formworks slab: ₱440/m2 | column: ₱540/m2 | beam: ₱490/m2
Structural steel fabricated+installed: ₱180/kg
Painting 2 coats interior: ₱110/m2 | exterior: ₱155/m2
Waterproofing cementitious: ₱450/m2 | membrane: ₱950/m2
Electrical rough-in: ₱850-1,200/m2 of floor area
Plumbing rough-in: ₱650-950/m2 of floor area

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
      "trade": "Concrete|Rebar|Formworks|Masonry|Structural Steel|Roofing|Ceiling|Doors & Windows|Carpentry & Millwork|Flooring|Painting|Electrical|Plumbing|HVAC|Fire Protection|Generator|Elevator|Earthworks|Indirect Costs|Others",
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



function BOMReview({ apiKey, sessionTick=0 }) {
  // ── Props ───────────────────────────────────────────────────────────────────
  // apiKey     {string}  Anthropic API key
  // sessionTick {number} Increments when user navigates back via history — triggers session restore

  // ── Modes ───────────────────────────────────────────────────────────────────
  // "single"   Review an existing BOM against plans (default)
  // "generate" Generate a new BOM from plans using AI

  const [planFiles,     setPlanFiles]     = useState([]);
  const [bomFiles,      setBomFiles]      = useState([]);
  const [result,        setResult]        = useState(null);
  const [generateResult,setGenerateResult]= useState(null);
  const [busy,          setBusy]          = useState(false);
  const [error,         setError]         = useState(null);
  const [dragPlan,      setDragPlan]      = useState(false);
  const [dragBom,       setDragBom]       = useState(false);
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
  const [busyMsg,     setBusyMsg]     = useState("");
  const [debugInfo,   setDebugInfo]   = useState("");
  const [bomMarkup,   setBomMarkup]   = useState({ materials: 0, labor: 0, overhead: 10, contingency: 5 });
  const [showMarkup,  setShowMarkup]  = useState(false);

  const planRef = useRef(null);
  const bomRef  = useRef(null);
  const STR = "#0696d7";
  const tick = () => new Promise(r => setTimeout(r, 0));

  // ── Session restore helper ──
  const _loadBomSession = () => {
    try {
      const s = JSON.parse(localStorage.getItem("buildify_session_engtools") || "null");
      if (!s?.bomResult?.summary) return;
      // Detect whether saved result is a generated BOM or a review BOM
      const isGenerated = !!(s.bomResult.lineItems && !s.bomResult.overallStatus);
      if (isGenerated) {
        setGenerateResult(s.bomResult);
        setMode("generate");
      } else {
        setResult(s.bomResult);
        setMode(s._bomMode === "generate" ? "generate" : "single");
      }
    } catch {}
  };

  // ── Restore on mount ──
  useEffect(() => { _loadBomSession(); }, []); // eslint-disable-line

  // ── Restore when navigating back (sessionTick) ──
  useEffect(() => {
    if (sessionTick === 0) return;
    _loadBomSession();
  }, [sessionTick]); // eslint-disable-line

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

  const applyMarkup = (base) => {
    const m = bomMarkup;
    return base
      * (1 + (m.materials   || 0) / 100)
      * (1 + (m.labor       || 0) / 100)
      * (1 + (m.overhead    || 0) / 100)
      * (1 + (m.contingency || 0) / 100);
  };

  const bomMfn = n => {
    const m = bomMarkup;
    return (+n||0)*(1+(m.materials||0)/100)*(1+(m.labor||0)/100)*(1+(m.overhead||0)/100)*(1+(m.contingency||0)/100);
  };
  const bomMf = n => "₱" + bomMfn(n).toLocaleString("en-PH", {maximumFractionDigits:0});
  const bomTotalMarkupPct = ((1+(bomMarkup.materials||0)/100)*(1+(bomMarkup.labor||0)/100)*(1+(bomMarkup.overhead||0)/100)*(1+(bomMarkup.contingency||0)/100)-1)*100;

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

    // ── GENERATE MODE ────────────────────────────────────────────────────────
    if (mode === "generate") {
      setBusy(true); setError(null); setGenerateResult(null); setDebugInfo("");
      try {
        const planBlocks = await encodeFiles(planFiles, "PLAN");
        const userMsg = [...planBlocks, { type:"text", text:`Generate a complete Bill of Materials and Quantities from these engineering plans.
Project type: ${projectPreset.replace(/_/g," ")}
Rate basis: ${projectType === "government" ? "DPWH Blue Book / Government rates" : "Private NCR market rates (2025)"}

CRITICAL OUTPUT RULES:
- Return ONLY valid JSON. No explanations, no markdown, no text before or after.
- Keep all string values SHORT (under 80 chars). Use qtyBasis for computation details.
- Do NOT pad or repeat information. Be concise in every field.
- If you cannot fit all line items, prioritize: structural elements first, then MEP, then finishes.
- Every lineItem MUST have: trade, description, unit, qty, unitRateLow, unitRateHigh, totalLow, totalHigh.
- qtyBasis is required for all concrete and rebar items. Optional for others.` }];
        setBusyMsg("📐 AI is reading plans and computing quantities…"); await tick();
        setBusyMsg("🤖 Generating BOM — this takes 30–60 seconds for detailed plans…"); await tick();
        const data = await callAI({ apiKey, system:BOM_GENERATE_PROMPT, messages:[{ role:"user", content:userMsg }], max_tokens:16000 });
        // Debug: log raw API response to console
        console.log("[BOM Generate] stop_reason:", data.stop_reason);
        console.log("[BOM Generate] content blocks:", data.content?.length);
        console.log("[BOM Generate] error:", data.error);
        if (data.error) {
          setDebugInfo(`API error: ${JSON.stringify(data.error)}`);
          throw new Error(`API error: ${data.error.message || JSON.stringify(data.error)}`);
        }
        if (!data.content?.length) throw new Error(`No content returned from API. Response: ${JSON.stringify(data).slice(0,200)}`);
        const raw  = data.content.map(b => b.text||"").join("").replace(/^```json\s*/,"").replace(/\s*```$/,"").trim();
        console.log("[BOM Generate] raw length:", raw.length, "| first 200:", raw.slice(0,200));
        const stopReason = data.stop_reason;
        let parsed;
        try { parsed = JSON.parse(raw); }
        catch(parseErr) {
          console.warn("[BOM Generate] JSON.parse failed:", parseErr.message);
          console.log("[BOM Generate] Attempting repair...");
          parsed = repairBomJSON(raw);
          if (!parsed) {
            const hint = stopReason === "max_tokens"
              ? "Output too long — try uploading fewer plan sheets (2–3 pages max). Detailed multi-page plans may exceed the token limit."
              : `Parse failed. stop_reason=${stopReason}. First 200 chars: ${raw.slice(0,200)}`;
            console.error("[BOM Generate] Unrecoverable:", hint);
            setDebugInfo(`stop_reason: ${stopReason} | raw[0:300]: ${raw.slice(0,300)}`);
            throw new Error(hint);
          }
          console.log("[BOM Generate] JSON repaired successfully");
        }
        setGenerateResult(parsed);
        addHistoryEntry({ tool:"bom", module:"engtools", projectName:parsed?.summary?.projectName||"BOM Generated", meta:{ totalHigh:parsed?.summary?.totalCostHigh, findings:parsed?.lineItems?.length||0, summary:parsed?.summary?.notes||"" } });
        try {
          const _cur = JSON.parse(localStorage.getItem("buildify_session_engtools") || "{}");
          localStorage.setItem("buildify_session_engtools", JSON.stringify({ ..._cur, bomResult:parsed, _bomMode:"generate", _savedAt:new Date().toISOString(), _module:"engtools", userId:"local" }));
        } catch {}
      } catch(e) { setError(e.message || "Generation failed. Please try again."); }
      finally { setBusy(false); setBusyMsg(""); }
      return;
    }

    const allBom = [...bomFiles];
    const bad = allBom.find(f => !f.type.startsWith("image/") && f.type !== "application/pdf" && !f.name.match(/\.pdf$/i));
    if (bad) { setError(`"${bad.name}" must be a PDF. In Excel: File → Save As → PDF, then re-upload.`); return; }

    setBusy(true); setError(null); setResult(null);
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
      addHistoryEntry({ tool:"bom", module:"engtools", projectName:parsed1?.summary?.projectName||"BOM Review", meta:{ totalHigh:parsed1?.summary?.totalCost, findings:(parsed1?.lineItems?.length||0)+(parsed1?.missingItems?.length||0), summary:parsed1?.summary?.notes||"" } });
      // Direct save — merge with existing structural session
      try {
        const _cur = JSON.parse(localStorage.getItem("buildify_session_engtools") || "{}");
        localStorage.setItem("buildify_session_engtools", JSON.stringify({ ..._cur, bomResult: parsed1, _bomMode: mode, _savedAt: new Date().toISOString(), _module: "structural", userId: "local" }));
      } catch(e) { console.warn("Session save failed", e); }

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
  const adjustedTotal= bomMfn(aiBase);
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
    const _bomAdj = bomMfn(aiBase);
    const mRows = [
      ["Materials / Escalation", bomMarkup.materials],
      ["Labor Markup",           bomMarkup.labor],
      ["Overhead & Profit",      bomMarkup.overhead],
      ["Contingency",            bomMarkup.contingency],
    ].filter(([,pct]) => pct > 0)
    .map(([label,pct]) =>
      `<tr><td>${label}</td><td style="text-align:right;font-family:monospace;width:130px">${fmt(aiBase*(pct/100))}</td><td style="text-align:right;width:50px;color:#6b7280">${pct}%</td></tr>`
    ).join("");
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
    <table style="width:480px;border-collapse:collapse"><tr><th style="text-align:left">Item</th><th style="text-align:right;width:140px">Amount</th><th style="text-align:right;width:50px">%</th></tr>
    <tr><td>BOM Submitted Total</td><td style="text-align:right;font-family:monospace">${fmt(bomTotal)}</td><td></td></tr>
    <tr><td>AI Validated Base</td><td style="text-align:right;font-family:monospace">${fmt(aiBase)}</td><td></td></tr>
    ${mRows}
    <tr class="total-row"><td>ADJUSTED TOTAL (with margins)</td><td style="text-align:right;font-family:monospace">${fmt(_bomAdj)}</td><td></td></tr></table>
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
    setResult(null); setGenerateResult(null);
    setPlanFiles([]); setBomFiles([]);
    setError(null); setDebugInfo("");
    // Session stays in localStorage so history cards can reopen it
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <NoKeyBanner/>

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
          <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
            {[{v:"single",l:"Review BOM"},{v:"generate",l:"Generate BOM ✨",premium:true}].map(o=>(
              <button key={o.v} onClick={()=>setMode(o.v)} style={{padding:"6px 13px",borderRadius:8,border:`1.5px solid ${mode===o.v?(o.premium?"#a78bfa":STR):T.border}`,background:mode===o.v?(o.premium?"rgba(167,139,250,0.13)":"rgba(59,130,246,0.12)"):"transparent",color:mode===o.v?(o.premium?"#a78bfa":STR):T.muted,cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.15s",display:"flex",alignItems:"center",gap:6}}>
                {o.l}
                {o.premium && <span style={{fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:20,background:"linear-gradient(135deg,#7c3aed,#a78bfa)",color:"#fff",letterSpacing:"0.5px",boxShadow:"0 1px 6px rgba(124,58,237,0.4)"}}>PREMIUM</span>}
              </button>
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

        {/* Premium banner for generate mode */}
        {mode==="generate" && (
          <div style={{background:"linear-gradient(135deg,rgba(124,58,237,0.12),rgba(167,139,250,0.06))",border:"1.5px solid rgba(167,139,250,0.3)",borderRadius:12,padding:"14px 18px",marginBottom:14,display:"flex",alignItems:"center",gap:14}}>
            <div style={{fontSize:28,lineHeight:1}}>✨</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <span style={{fontWeight:800,fontSize:14,color:"#a78bfa"}}>AI BOM Generator</span>
                <span style={{fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:20,background:"linear-gradient(135deg,#7c3aed,#a78bfa)",color:"#fff",letterSpacing:"0.5px",boxShadow:"0 1px 8px rgba(124,58,237,0.5)"}}>PREMIUM</span>
              </div>
              <div style={{fontSize:12,color:T.muted,lineHeight:1.6}}>Upload your engineering plans and let AI generate a complete contractor-ready Bill of Materials — concrete, rebar, masonry, MEP, electrical, finishes, and more. No manual counting needed.</div>
            </div>
            <div style={{textAlign:"right",minWidth:90}}>
              <div style={{fontSize:10,color:"#a78bfa",fontWeight:700,marginBottom:2}}>ACCURACY</div>
              <div style={{fontSize:18,fontWeight:900,color:"#a78bfa"}}>±20–35%</div>
              <div style={{fontSize:9,color:T.muted}}>parametric</div>
            </div>
          </div>
        )}

        {/* Upload zones */}
        <div style={{display:"grid",gridTemplateColumns:`repeat(${mode==="generate"?1:2},1fr)`,gap:12,marginBottom:14}}>
          <div style={{display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",flexDirection:"column",gap:2,marginBottom:5,minHeight:34}}>
              <div style={{fontSize:10,fontWeight:700,color:STR}}>📐 Engineering Plans *</div>
              <div style={{fontSize:10,color:"transparent",userSelect:"none"}}>placeholder</div>
            </div>
            <DropZone label="Upload Plans" sublabel="PDF · JPG · PNG" files={planFiles} onAdd={addPlanFiles} onRemove={id=>setPlanFiles(p=>p.filter(f=>f.id!==id))} dragState={dragPlan} setDrag={setDragPlan} inputRef={planRef} icon="📐" accent={STR}/>
          </div>
          {mode !== "generate" && (<div style={{display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",flexDirection:"column",gap:2,marginBottom:5,minHeight:34}}>
              <div style={{fontSize:10,fontWeight:700,color:"#ff6b2b"}}>"📋 Draft BOM" <span style={{color:T.muted,fontWeight:400}}>(optional)</span></div>
              <div style={{fontSize:10,color:T.muted}}>💡 Excel → Save As PDF before uploading</div>
            </div>
            <DropZone label="Upload BOM (PDF)" sublabel="PDF only" files={bomFiles} onAdd={addBomFiles} onRemove={id=>setBomFiles(p=>p.filter(f=>f.id!==id))} dragState={dragBom} setDrag={setDragBom} inputRef={bomRef} icon="📋" accent="#ff6b2b"/>
          </div>)}

        </div>

        
        {error && <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:13,color:T.danger}}>⚠️ {error}</div>}
        {error && debugInfo && (
          <div style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"10px 14px",marginBottom:12,fontFamily:"monospace",fontSize:11,color:"#94a3b8",lineHeight:1.6,wordBreak:"break-all"}}>
            <div style={{color:"#f59e0b",fontWeight:700,marginBottom:4}}>🔍 Debug info (share with support):</div>
            {debugInfo}
          </div>
        )}
        {mode === "generate" && !generateResult && !busy && (
          <div style={{background:"rgba(6,150,215,0.07)",border:"1px solid rgba(6,150,215,0.2)",borderRadius:10,padding:"12px 16px",marginBottom:12,fontSize:12.5,color:T.muted,lineHeight:1.6}}>
            <span style={{fontWeight:700,color:STR}}>✨ BOM Generator</span> — Upload your engineering plans and the AI will compute all quantities and produce a complete Bill of Materials from scratch. No existing BOM needed.
            <div style={{fontSize:11,color:T.muted,marginTop:4}}>Works best with complete floor plans + structural plans + schedules. The more detail in the plans, the more accurate the takeoff.</div>
          </div>
        )}

        {/* ── Markup & Contingency — set before running ── */}
        {mode !== "generate" && (
          <div style={{background:"rgba(255,255,255,0.03)",border:`1.5px solid ${T.border}`,borderRadius:12,marginBottom:14,overflow:"hidden"}}>
            <div onClick={()=>setShowMarkup(p=>!p)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",cursor:"pointer",userSelect:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,fontWeight:700,color:T.text}}>⚙️ Markup &amp; Contingency</span>
                <span style={{fontSize:10,color:T.muted}}>(applied to Adjusted Total in report)</span>
                {bomTotalMarkupPct > 0.1 && <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:20,background:"rgba(6,150,215,0.12)",color:STR}}>+{bomTotalMarkupPct.toFixed(1)}%</span>}
              </div>
              <span style={{color:T.muted,fontSize:12}}>{showMarkup ? "▲" : "▼"}</span>
            </div>
            {showMarkup && (
              <div style={{padding:"0 14px 14px",borderTop:`1px solid ${T.border}`}}>
                <div style={{fontSize:10,color:T.muted,marginBottom:10,marginTop:8}}>Set before running the review. Applies to the Adjusted Total only — BOM Submitted and AI Base are never changed.</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                  {[["materials","Materials",STR],["labor","Labor","#06b6d4"],["overhead","Overhead & Profit","#ff6b2b"],["contingency","Contingency","#a78bfa"]].map(([key,label,color])=>(
                    <div key={key} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px"}}>
                      <div style={{fontSize:9,fontWeight:700,color,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:6}}>{label}</div>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <input type="number" min="0" max="100" step="0.5" value={bomMarkup[key]}
                          onChange={e=>setBomMarkup(p=>({...p,[key]:parseFloat(e.target.value)||0}))}
                          style={{width:"100%",background:"rgba(0,0,0,0.3)",border:`1.5px solid ${color}44`,borderRadius:6,padding:"5px 7px",color:T.text,fontSize:14,fontWeight:700,textAlign:"right",outline:"none"}}/>
                        <span style={{fontSize:12,color:T.muted,fontWeight:700}}>%</span>
                      </div>
                      <input type="range" min="0" max="50" step="0.5" value={bomMarkup[key]}
                        onChange={e=>setBomMarkup(p=>({...p,[key]:parseFloat(e.target.value)||0}))}
                        style={{width:"100%",marginTop:5,accentColor:color}}/>
                    </div>
                  ))}
                </div>
                {bomTotalMarkupPct > 0.1 && (
                  <div style={{marginTop:10,background:"rgba(6,150,215,0.05)",border:`1px solid ${STR}22`,borderRadius:7,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:11,color:T.muted}}>Combined multiplier on base estimate</span>
                    <span style={{fontSize:13,fontWeight:800,color:STR}}>×{(1+bomTotalMarkupPct/100).toFixed(3)} (+{bomTotalMarkupPct.toFixed(1)}%)</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button onClick={run} disabled={busy||!planFiles.length} style={{width:"100%",background:busy||!planFiles.length?`rgba(59,130,246,0.2)`:`linear-gradient(135deg,${STR},#0369a1)`,border:"none",color:busy||!planFiles.length?"#555":"#fff",fontWeight:800,fontSize:15,padding:"13px",borderRadius:12,cursor:busy||!planFiles.length?"not-allowed":"pointer",transition:"all 0.2s"}}>
          {busy ? (busyMsg||"⚙️ Processing…") : mode==="generate" ? "✨ Generate BOM from Plans" : "📋 Run BOM Review"}
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
                  <div style={{fontSize:20,fontWeight:900,color:STR,fontFamily:"monospace"}}>{bomMf(adjustedTotal)}</div>
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
                  {[["Materials / Escalation",bomMarkup.materials,STR],["Labor Markup",bomMarkup.labor,"#06b6d4"],["Overhead & Profit",bomMarkup.overhead,"#ff6b2b"],["Contingency",bomMarkup.contingency,"#a78bfa"]].filter(([,pct])=>pct>0).map(([label,pct,col])=>(
                    <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 12px",background:T.dim,borderRadius:7}}>
                      <span style={{fontSize:12,color:T.muted}}>{label}</span>
                      <span style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:12,fontWeight:600,color:T.text,fontFamily:"monospace"}}>+{fmt(aiBase*(pct/100))}</span>
                        <span style={{fontSize:10,fontWeight:700,color:col,minWidth:32,textAlign:"right"}}>{pct}%</span>
                      </span>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",padding:"11px 14px",background:`${STR}14`,border:`1.5px solid ${STR}44`,borderRadius:10}}><span style={{fontSize:14,fontWeight:800,color:T.text}}>ADJUSTED TOTAL</span><span style={{fontSize:16,fontWeight:900,color:STR,fontFamily:"monospace"}}>{bomMf(adjustedTotal)}</span></div>
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

      {/* ── GENERATE BOM RESULTS ── */}
      {mode==="generate" && generateResult && (() => {
        const g = generateResult;
        const s = g.summary || {};
        const fmt = n => "\u20b1" + (+n||0).toLocaleString("en-PH");
        const mfn = n => bomMfn(n);
        const mf  = n => bomMf(n);
        const totalMarkupPct = bomTotalMarkupPct;
        const confColor = c => c==="HIGH" ? "#16a34a" : c==="LOW" ? "#ef4444" : "#d97706";
        return (
          <div style={{marginTop:20}}>

            {/* Header row */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,gap:12,flexWrap:"wrap"}}>
              <div>
                <div style={{fontWeight:800,fontSize:16,color:T.text}}>Generated Bill of Materials</div>
                <div style={{fontSize:12,color:T.muted,marginTop:2}}>
                  {s.projectName||"Project"} &nbsp;&middot;&nbsp; {g.lineItems?.length||0} line items &nbsp;&middot;&nbsp; {g.tradeSummary?.length||0} work categories
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{
                  const rows = (g.lineItems||[]).map((item,i) => {
                    const bg = i%2===0 ? "#fff" : "#f8fafc";
                    const cc = confColor(item.confidence);
                    return "<tr style=\"background:"+bg+"\">" +
                      "<td style=\"padding:7px 10px;font-size:10px;color:#94a3b8;border-bottom:1px solid #f1f5f9\">"+item.trade+"</td>" +
                      "<td style=\"padding:7px 10px;border-bottom:1px solid #f1f5f9\"><strong style=\"font-size:12px;color:#0f2444\">"+item.description+"</strong>" +
                        (item.specification ? "<br><span style=\"font-size:10px;color:#94a3b8\">"+item.specification+"</span>" : "") +
                        (item.qtyBasis ? "<br><span style=\"font-size:10px;color:#0696d7\">"+item.qtyBasis+"</span>" : "") +
                      "</td>" +
                      "<td style=\"padding:7px 10px;text-align:center;font-size:11px;border-bottom:1px solid #f1f5f9\">"+item.unit+"</td>" +
                      "<td style=\"padding:7px 10px;text-align:right;font-weight:700;border-bottom:1px solid #f1f5f9\">"+((+item.qty||0).toLocaleString("en-PH",{maximumFractionDigits:2}))+"</td>" +
                      "<td style=\"padding:7px 10px;text-align:right;font-size:11px;color:#64748b;border-bottom:1px solid #f1f5f9\">"+fmt(item.unitRateLow)+"&ndash;"+fmt(item.unitRateHigh)+"</td>" +
                      "<td style=\"padding:7px 10px;text-align:right;font-size:11px;border-bottom:1px solid #f1f5f9\">"+mf(item.totalLow)+"</td>" +
                      "<td style=\"padding:7px 10px;text-align:right;font-weight:700;border-bottom:1px solid #f1f5f9\">"+mf(item.totalHigh)+"</td>" +
                      "<td style=\"padding:7px 10px;text-align:center;border-bottom:1px solid #f1f5f9\"><span style=\"font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;background:"+cc+"22;color:"+cc+";border:1px solid "+cc+"44\">"+item.confidence+"</span></td>" +
                    "</tr>";
                  }).join("");
                  const trRows = (g.tradeSummary||[]).map(t =>
                    "<tr><td style=\"padding:8px 10px;font-weight:600;color:#0f2444\">"+t.trade+"</td>" +
                    "<td style=\"padding:8px 10px;text-align:center;color:#64748b\">"+t.itemCount+"</td>" +
                    "<td style=\"padding:8px 10px;text-align:right\">"+mf(t.totalLow)+"</td>" +
                    "<td style=\"padding:8px 10px;text-align:right;font-weight:700;color:#0f2444\">"+mf(t.totalHigh)+"</td>" +
                    "<td style=\"padding:8px 10px;text-align:center;font-weight:700;color:#0696d7\">"+((+t.percentOfTotal||0).toFixed(1))+"%</td></tr>"
                  ).join("");
                  const limitHtml = (s.limitations||[]).map(l => "<div style=\"font-size:11.5px;color:#64748b;padding:3px 0 3px 12px\">&bull; "+l+"</div>").join("");
                  const w = window.open("","_blank");
                  w.document.write(
                    "<!DOCTYPE html><html><head><title>BOM &mdash; "+(s.projectName||"Project")+"</title>" +
                    "<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,sans-serif;background:#f1f5f9;color:#0f172a;font-size:13px}" +
                    ".page{max-width:1100px;margin:0 auto;background:#fff}" +
                    ".hdr{background:#0f2444;padding:20px 30px;display:flex;justify-content:space-between;align-items:center}" +
                    ".brand{font-size:18px;font-weight:900;color:#0696d7}.brand-sub{font-size:11px;color:#94a3b8;margin-top:2px}" +
                    ".hdr-r{text-align:right;font-size:11px;color:#94a3b8}.hdr-val{font-size:13px;color:#fff;font-weight:700;margin-top:2px}" +
                    ".content{padding:24px 30px}.title{font-size:20px;font-weight:900;color:#0f2444;margin-bottom:4px}" +
                    ".sub{font-size:12px;color:#64748b;margin-bottom:18px}" +
                    ".stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}" +
                    ".stat{background:#f8fafc;border-radius:8px;padding:11px;text-align:center}" +
                    ".sv{font-size:17px;font-weight:800;color:#0f2444}.sl{font-size:10px;color:#64748b;margin-top:3px}" +
                    ".hero{border:2px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center}" +
                    ".cr{font-size:24px;font-weight:900;color:#0f2444}.cm{font-size:11px;color:#64748b;margin-top:3px}" +
                    ".csqm{background:#e8f4fc;border-radius:8px;padding:11px 16px;text-align:center}.csv{font-size:15px;font-weight:800;color:#0696d7}.csl{font-size:10px;color:#64748b}" +
                    "h2{font-size:13px;font-weight:800;color:#0f2444;margin:18px 0 8px;padding-bottom:5px;border-bottom:2px solid #e2e8f0}" +
                    "table{width:100%;border-collapse:collapse}thead th{background:#0f2444;color:#fff;padding:8px 10px;font-size:10px;font-weight:700;text-align:left}" +
                    ".r{text-align:right}.c{text-align:center}" +
                    ".nb{background:#fef3c7;border-left:3px solid #d97706;padding:10px 14px;border-radius:0 8px 8px 0;margin-top:12px;font-size:11.5px;color:#92400e;line-height:1.6}" +
                    ".footer{background:#0f2444;padding:11px 30px;display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-top:20px}" +
                    "@media print{body{background:#fff}.np{display:none!important}}</style></head><body>" +
                    "<button class=\"np\" onclick=\"window.print()\" style=\"position:fixed;top:16px;right:16px;padding:9px 18px;background:#0696d7;color:#fff;border:none;border-radius:7px;cursor:pointer;font-size:13px;font-weight:700;z-index:999\">\uD83D\uDDA8 Print / Save PDF</button>" +
                    "<div class=\"page\">" +
                    "<div class=\"hdr\"><div><div class=\"brand\">BUILDIFY</div><div class=\"brand-sub\">Generated Bill of Materials &middot; PH Engineering Suite</div></div>" +
                    "<div class=\"hdr-r\"><div>BOM-GEN &middot; "+(new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"}))+"</div><div class=\"hdr-val\">"+(s.projectName||"Project")+"</div></div></div>" +
                    "<div class=\"content\">" +
                    "<div class=\"title\">"+(s.projectName||"Bill of Materials")+"</div>" +
                    "<div class=\"sub\">"+(s.projectType||"")+" &middot; "+(s.projectLocation||"")+" &middot; "+(s.finishLevel||"Standard")+" Finish &middot; "+(s.structuralSystem||"")+"</div>" +
                    "<div class=\"stats\">" +
                      "<div class=\"stat\"><div class=\"sv\">"+(+s.totalFloorArea||0).toLocaleString()+" sqm</div><div class=\"sl\">"+(s.floorAreaBreakdown||"Floor Area")+"</div></div>" +
                      "<div class=\"stat\"><div class=\"sv\">"+(s.numberOfStoreys||"&mdash;")+"</div><div class=\"sl\">Storeys</div></div>" +
                      "<div class=\"stat\"><div class=\"sv\">"+(g.lineItems?.length||0)+"</div><div class=\"sl\">Line Items</div></div>" +
                      "<div class=\"stat\"><div class=\"sv\">"+(g.tradeSummary?.length||0)+"</div><div class=\"sl\">Work Categories</div></div>" +
                    "</div>" +
                    "<div class=\"hero\">" +
                      "<div><div style=\"font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px\">Total Estimated Cost</div>" +
                      "<div class=\"cr\">"+mf(s.totalCostLow)+" &ndash; "+mf(s.totalCostHigh)+"</div>" +
                      "<div class=\"cm\">Midpoint: <strong>"+mf(s.totalCostMid)+"</strong> &middot; &plusmn;20&ndash;35% parametric accuracy</div></div>" +
                      "<div class=\"csqm\"><div class=\"csv\">"+fmt(s.costPerSqmLow)+" &ndash; "+fmt(s.costPerSqmHigh)+"</div><div class=\"csl\">per square meter</div></div>" +
                    "</div>" +
                    "<h2>Trade Summary</h2>" +
                    "<table><thead><tr><th>Work Category</th><th class=\"c\">Items</th><th class=\"r\">Low Total</th><th class=\"r\">High Total</th><th class=\"c\">% of Total</th></tr></thead><tbody>"+trRows+"</tbody></table>" +
                    "<h2>Complete Bill of Materials</h2>" +
                    "<table><thead><tr><th>Trade</th><th>Description</th><th class=\"c\">Unit</th><th class=\"r\">Qty</th><th class=\"r\">Unit Rate</th><th class=\"r\">Total Low</th><th class=\"r\">Total High</th><th class=\"c\">Conf.</th></tr></thead><tbody>"+rows+
                    "<tr style=\"background:#0f2444\"><td colspan=\"5\" style=\"padding:10px;color:#fff;font-weight:800;font-size:13px\">TOTAL ESTIMATED COST</td>" +
                    "<td style=\"padding:10px;color:#fff;font-weight:700;text-align:right\">"+mf(s.totalCostLow)+"</td>" +
                    "<td style=\"padding:10px;color:#fff;font-weight:800;font-size:14px;text-align:right\">"+fmt(s.totalCostHigh)+"</td><td></td></tr>" +
                    "</tbody></table>" +
                    (s.notes ? "<div class=\"nb\"><strong>Notes:</strong> "+s.notes+"</div>" : "") +
                    (s.limitations?.length ? "<h2>Items Requiring Field Verification</h2>"+limitHtml : "") +
                    "</div>" +
                    "<div class=\"footer\"><span>Generated by Buildify &middot; PH Engineering Suite</span><span>Parametric estimate &plusmn;20&ndash;35% &middot; Not a contract document"+(totalMarkupPct>0.1?" &middot; Markup "+totalMarkupPct.toFixed(1)+"% applied":"")+"</span></div>" +
                    "</div></body></html>"
                  );
                  w.document.close(); setTimeout(()=>w.print(),600);
                }} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:9,border:`1.5px solid ${STR}44`,background:`${STR}12`,color:STR,cursor:"pointer",fontSize:12,fontWeight:700}}>
                  <Icon name="download" size={13}/> Export PDF
                </button>
                <button onClick={()=>{
                  // Export clean CSV — base costs only (no markup columns; engineer hides nothing)
                  const items = g.lineItems||[];
                  const esc = v => '"'+(String(v||"").replace(/"/g,'""'))+'"';
                  const rows = [
                    ["BUILDIFY — Bill of Materials","","","","","","","","","","",""],
                    [s.projectName||"Project","","","","","","","","","","",""],
                    [s.projectLocation||"","","","","","","","","","","",""],
                    ["Floor Area:",s.totalFloorArea+" sqm","Storeys:",s.numberOfStoreys,"Units:",s.numberOfUnits||1,"Finish:",s.finishLevel||"Standard","","","",""],
                    ["","","","","","","","","","","",""],
                    ["ID","Trade","Sub-Category","Description","Specification","Unit","Qty","Qty Basis","Unit Rate Low","Unit Rate High","Total Low","Total High","Confidence","Owner Supply"],
                    ...items.map((it,i)=>[
                      i+1, it.trade||"", it.subCategory||"", it.description||"", it.specification||"",
                      it.unit||"", it.qty||0, it.qtyBasis||"",
                      it.unitRateLow||0, it.unitRateHigh||0,
                      it.totalLow||0, it.totalHigh||0,
                      it.confidence||"", it.isOwnerSupply?"Yes":"No"
                    ]),
                    ["","","","","","","","","","","","","",""],
                    ["","","","","","","","","","TOTAL LOW:",s.totalCostLow,"","",""],
                    ["","","","","","","","","","TOTAL HIGH:","",s.totalCostHigh,"",""],
                    ["","","","","","","","","","","","","",""],
                    ["Generated by Buildify · PH Engineering Suite","","","","","","","Not a contract document","","","","","",""],
                  ];
                  const csv = rows.map(r=>r.map(esc).join(",")).join("\r\n");
                  const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = (s.projectName||"BOM").replace(/[^a-z0-9]/gi,"_")+"_BOM.csv";
                  a.click();
                }} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:9,border:"1.5px solid rgba(6,180,212,0.4)",background:"rgba(6,180,212,0.08)",color:"#06b6d4",cursor:"pointer",fontSize:12,fontWeight:700}}>
                  <Icon name="table" size={13}/> Export Excel
                </button>
                <button onClick={handleNewBOM} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:9,border:"1.5px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.07)",color:"#ef4444",cursor:"pointer",fontSize:12,fontWeight:700}}>
                  <Icon name="plus" size={13}/> New BOM
                </button>
              </div>
            </div>

            


          {/* ── Markup & Contingency panel ── */}
          {(result || (mode==="generate" && generateResult)) && (
            <div style={{background:"rgba(255,255,255,0.03)",border:`1.5px solid ${T.border}`,borderRadius:12,marginBottom:14,overflow:"hidden"}}>
              <div onClick={()=>setShowMarkup(p=>!p)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 16px",cursor:"pointer",userSelect:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:13,fontWeight:700,color:T.text}}>⚙️ Markup &amp; Contingency</span>
                  {bomTotalMarkupPct > 0.1 && <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:"rgba(6,150,215,0.15)",color:STR}}>+{bomTotalMarkupPct.toFixed(1)}% applied</span>}
                </div>
                <span style={{color:T.muted,fontSize:13}}>{showMarkup ? "▲" : "▼"}</span>
              </div>
              {showMarkup && (
                <div style={{padding:"0 16px 16px",borderTop:`1px solid ${T.border}`}}>
                  <div style={{fontSize:11,color:T.muted,marginBottom:12,marginTop:10}}>Compounds on the base estimate. Use to account for price escalation, contractor margin, contingency, and VAT.</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                    {[["materials","Materials / Escalation",STR],["labor","Labor Markup","#06b6d4"],["overhead","Overhead & Profit","#ff6b2b"],["contingency","Contingency","#a78bfa"]].map(([key,label,color])=>(
                      <div key={key} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:9,padding:"12px 14px"}}>
                        <div style={{fontSize:10,fontWeight:700,color,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:8}}>{label}</div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <input type="number" min="0" max="100" step="0.5" value={bomMarkup[key]}
                            onChange={e=>setBomMarkup(p=>({...p,[key]:parseFloat(e.target.value)||0}))}
                            style={{width:"100%",background:"rgba(0,0,0,0.3)",border:`1.5px solid ${color}44`,borderRadius:6,padding:"6px 8px",color:T.text,fontSize:15,fontWeight:700,textAlign:"right",outline:"none"}}/>
                          <span style={{fontSize:14,color:T.muted,fontWeight:700}}>%</span>
                        </div>
                        <input type="range" min="0" max="50" step="0.5" value={bomMarkup[key]}
                          onChange={e=>setBomMarkup(p=>({...p,[key]:parseFloat(e.target.value)||0}))}
                          style={{width:"100%",marginTop:6,accentColor:color}}/>
                      </div>
                    ))}
                  </div>
                  {bomTotalMarkupPct > 0.1 && (
                    <div style={{marginTop:12,background:"rgba(6,150,215,0.06)",border:`1px solid ${STR}22`,borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:12,color:T.muted}}>Combined multiplier on base estimate</span>
                      <span style={{fontSize:15,fontWeight:800,color:STR}}>×{(1+bomTotalMarkupPct/100).toFixed(3)} &nbsp;(+{bomTotalMarkupPct.toFixed(1)}%)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

            {/* Cost summary cards */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div style={{background:`${STR}10`,border:`1.5px solid ${STR}33`,borderRadius:12,padding:"16px 20px"}}>
                <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>Total Estimated Cost {totalMarkupPct>0.1 && <span style={{color:STR}}>(with markup)</span>}</div>
                <div style={{fontSize:22,fontWeight:900,color:T.text}}>{mf(s.totalCostLow)} &ndash; {mf(s.totalCostHigh)}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:4}}>Midpoint: <strong style={{color:STR}}>{mf(s.totalCostMid)}</strong> &nbsp;&middot;&nbsp; {(+s.totalFloorArea||0).toLocaleString()} sqm total</div>
                {totalMarkupPct>0.1 && <div style={{fontSize:10,color:T.muted,marginTop:4}}>Base (no markup): {fmt(s.totalCostLow)} – {fmt(s.totalCostHigh)}</div>}
              </div>
              <div style={{background:"rgba(255,255,255,0.03)",border:`1.5px solid ${T.border}`,borderRadius:12,padding:"16px 20px"}}>
                <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>Per Square Meter {totalMarkupPct>0.1 && <span style={{color:STR}}>(with markup)</span>}</div>
                <div style={{fontSize:22,fontWeight:900,color:STR}}>{mf(s.costPerSqmLow)} &ndash; {mf(s.costPerSqmHigh)}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:4}}>{s.structuralSystem||""} &nbsp;&middot;&nbsp; {s.finishLevel||"Standard"} Finish</div>
              </div>
            </div>

            {s.scopeNote && (
              <div style={{background:"rgba(217,119,6,0.08)",border:"1px solid rgba(217,119,6,0.2)",borderRadius:10,padding:"10px 16px",marginBottom:10,fontSize:12.5,fontWeight:600,color:"#d97706"}}>
                ⚠️ {s.scopeNote}
              </div>
            )}
            {s.notes && (
              <div style={{background:`${STR}08`,border:`1px solid ${STR}22`,borderRadius:10,padding:"11px 16px",marginBottom:14,fontSize:12.5,color:T.muted,lineHeight:1.6}}>{s.notes}</div>
            )}

            {/* Trade summary bars */}
            {g.tradeSummary?.length > 0 && (
              <div style={{marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Cost by Work Category</div>
                {g.tradeSummary.map((t,i) => (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.02)",border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 14px",marginBottom:4}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:12,fontWeight:600,color:T.text}}>{t.trade}</span>
                        <span style={{fontSize:11,color:T.muted}}>{t.itemCount} items</span>
                      </div>
                      <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.max(2,+t.percentOfTotal||0)}%`,background:STR,borderRadius:2}}/>
                      </div>
                    </div>
                    <div style={{textAlign:"right",minWidth:130}}>
                      <div style={{fontWeight:700,color:T.text,fontSize:12}}>{mf(t.totalHigh)}</div>
                      <div style={{fontSize:11,color:T.muted}}>{(+t.percentOfTotal||0).toFixed(1)}% of total</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Full line items */}
            <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>
              Complete Bill of Materials &mdash; {g.lineItems?.length||0} Items
            </div>
            <div style={{border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{background:"rgba(6,150,215,0.1)"}}>
                      {["Trade","Description","Unit","Qty","Unit Rate","Low Total","High Total","Conf."].map(h => (
                        <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:"0.3px",borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(g.lineItems||[]).map((item,i) => (
                      <tr key={i} style={{background:i%2===0?"rgba(255,255,255,0.01)":"rgba(255,255,255,0.03)",borderBottom:`1px solid ${T.border}`}}>
                        <td style={{padding:"8px 10px",fontSize:10,color:T.muted,maxWidth:90,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.trade}</td>
                        <td style={{padding:"8px 10px"}}>
                          <div style={{fontWeight:600,color:T.text}}>{item.isOwnerSupply && <span style={{fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:4,background:"rgba(100,116,139,0.15)",color:"#94a3b8",marginLeft:6}}>OWNER SUPPLY</span>}{item.description}</div>
                          {item.subCategory && <div style={{fontSize:10,fontWeight:600,color:`${STR}99`,marginTop:1}}>{item.subCategory}</div>}
                          {item.specification && <div style={{fontSize:10,color:T.muted,marginTop:1}}>{item.specification}</div>}
                          {item.qtyBasis && <div style={{fontSize:10,color:`${STR}99`,marginTop:1}}>{item.qtyBasis}</div>}
                        </td>
                        <td style={{padding:"8px 10px",textAlign:"center",color:T.muted,fontSize:11}}>{item.unit}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:T.text}}>{(+item.qty||0).toLocaleString("en-PH",{maximumFractionDigits:2})}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color:T.muted,fontSize:11,whiteSpace:"nowrap"}}>{fmt(item.unitRateLow)}&ndash;{fmt(item.unitRateHigh)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",color:T.muted,fontSize:11}}>{mf(item.totalLow)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:T.text}}>{mf(item.totalHigh)}</td>
                        <td style={{padding:"8px 10px",textAlign:"center"}}>
                          <span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,
                            background:`${confColor(item.confidence)}18`,color:confColor(item.confidence),
                            border:`1px solid ${confColor(item.confidence)}40`}}>{item.confidence||"—"}</span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{background:`${STR}15`,borderTop:`2px solid ${STR}`}}>
                      <td colSpan={5} style={{padding:"10px 12px",fontWeight:800,color:T.text,fontSize:13}}>TOTAL ESTIMATED COST</td>
                      <td style={{padding:"10px 12px",textAlign:"right",fontWeight:700,color:T.muted}}>{fmt(s.totalCostLow)}</td>
                      <td style={{padding:"10px 12px",textAlign:"right",fontWeight:800,color:STR,fontSize:14}}>{fmt(s.totalCostHigh)}</td>
                      <td/>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Limitations */}
            {s.limitations?.length > 0 && (
              <div style={{marginTop:12,background:"rgba(217,119,6,0.07)",border:"1px solid rgba(217,119,6,0.2)",borderRadius:10,padding:"12px 16px"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#d97706",marginBottom:8}}>&starf; Items Requiring Field Verification</div>
                {s.limitations.map((l,i) => (
                  <div key={i} style={{fontSize:12,color:T.muted,paddingLeft:12,marginBottom:4,lineHeight:1.5}}>&bull; {l}</div>
                ))}
              </div>
            )}

          </div>
        );
      })()}

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COST ESTIMATOR MODULE
// Components: CostEstimator
// Prompts:    COST_ESTIMATOR_PROMPT
// Session:    buildify_session_engtools
// Standalone: No plan extraction dependency — all inputs are manual
// ═══════════════════════════════════════════════════════════════════════════════
const COST_ESTIMATOR_PROMPT = `You are a licensed Philippine Quantity Surveyor (PQS) and Cost Estimator with 20+ years of experience on Philippine government and private construction projects. You produce parametric cost estimates that practicing engineers and project owners trust for budget planning and bid preparation.

═══════════════════════════════════════════
PHILIPPINE CONSTRUCTION RATE REFERENCE TABLE
(NCR baseline, Q1 2026 market rates — contractor all-in rates including labor, materials, equipment)
NOTE: These are TOTAL CONTRACTOR RATES per sqm of FLOOR AREA for complete works.
Adjust by location modifier provided in context.
═══════════════════════════════════════════

TOTAL PROJECT COST BENCHMARKS (all-in, contractor rate per sqm GFA):
- Economy Residential (bare, basic fixtures):             ₱20,000–₱25,000/sqm GFA
- Standard Residential (move-in ready, mid-range):        ₱28,000–₱38,000/sqm GFA
- High-End Residential (premium finishes):                ₱40,000–₱65,000/sqm GFA
- Standard Commercial/Office:                             ₱32,000–₱48,000/sqm GFA
- School/Institutional (DPWH standard):                   ₱28,000–₱42,000/sqm GFA
- Warehouse/Industrial:                                   ₱16,000–₱26,000/sqm GFA
- Hospital/Medical:                                       ₱55,000–₱90,000/sqm GFA

USE THESE BENCHMARKS as your sanity check. If your trade-by-trade total falls outside
the benchmark range for the project type, recheck your quantities and rates.

STRUCTURAL WORKS (trade rate, per sqm of floor area):
- RC Frame (columns, beams, slabs) — Residential 1–3F:   ₱9,000–₱13,500/sqm
- RC Frame — Multi-storey Residential 4–10F:              ₱12,000–₱18,000/sqm
- RC Frame — Commercial/Office 4–10F:                    ₱13,500–₱20,000/sqm
- RC Frame — Government/Institutional:                    ₱15,000–₱22,000/sqm
- Structural Steel Frame (industrial/warehouse):           ₱8,000–₱12,000/sqm
- Masonry load-bearing (single storey only):              ₱5,500–₱8,000/sqm
- Mat Foundation (per sqm of mat area):                   ₱10,000–₱17,000/sqm
- Isolated Footing (per footing, 1.2m×1.2m typical):     ₱15,000–₱28,000/pc
- Pile Foundation (precast RC 300mm, per lm):             ₱5,500–₱9,000/lm
- Shear Walls (200–300mm RC, per sqm of wall):            ₱7,000–₱11,000/sqm
NOTE: RC Frame should be 30–38% of total project cost for standard residential.

ARCHITECTURAL WORKS:
- CHB Masonry Walls 150mm, plastered both sides (sqm):    ₱1,800–₱2,800/sqm
- CHB Masonry Walls 100mm, plastered both sides (sqm):    ₱1,400–₱2,200/sqm
- Ceramic tile flooring, basic 30×30–40×40 (sqm):        ₱1,200–₱1,900/sqm
- Ceramic tile flooring, mid-range 60×60 (sqm):          ₱2,000–₱3,500/sqm
- Granite/marble tile flooring (sqm):                     ₱5,500–₱12,000/sqm
- Painted concrete floor (sqm):                           ₱350–₱600/sqm
- Ceiling — cement board, painted (sqm):                  ₱900–₱1,400/sqm
- Ceiling — gypsum board, painted (sqm):                  ₱1,100–₱1,800/sqm
- Ceiling — T-bar suspended, acoustic tile (sqm):         ₱1,400–₱2,200/sqm
- Doors — hollow-core flush (per set incl frame):         ₱10,000–₱18,000/set
- Doors — laminated solid wood panel (per set):           ₱22,000–₱42,000/set
- Doors — aluminum glass door (per set):                  ₱28,000–₱55,000/set
- Windows — aluminum awning/sliding (sqm of window):      ₱5,000–₱8,500/sqm
- Windows — frameless glass (sqm):                        ₱9,000–₱18,000/sqm
- Roof — pre-painted long-span G.I. (sqm of roof):       ₱1,100–₱1,800/sqm
- Roof — concrete slab + waterproofing (sqm):             ₱4,500–₱7,500/sqm
- Roof — clay/concrete tiles on framing (sqm):            ₱3,500–₱6,000/sqm
- Exterior paint — elastomeric, 2 coats (sqm):            ₱380–₱580/sqm
- Interior paint — 2 coats (sqm):                         ₱280–₱420/sqm

PLUMBING WORKS:
- Residential plumbing, complete (per fixture):           ₱22,000–₱38,000/fixture
- Commercial plumbing (per fixture):                      ₱32,000–₱55,000/fixture
- Sanitary/drain lines, PVC (per lm):                     ₱800–₱1,400/lm
- Water supply lines, PPR (per lm):                       ₱600–₱950/lm
- Septic tank, 2-chamber RC (per unit):                   ₱45,000–₱80,000/unit
- Sewage treatment plant (per unit, varies by capacity):  ₱180,000–₱850,000/unit

ELECTRICAL WORKS:
- Residential electrical, complete (per sqm of GFA):      ₱1,200–₱1,900/sqm
- Commercial electrical, complete (per sqm of GFA):       ₱2,500–₱4,500/sqm
- Industrial/3-phase electrical (per sqm of GFA):         ₱3,500–₱6,500/sqm
- Emergency generator set, 50kVA (per unit):              ₱350,000–₱550,000/unit
- Emergency generator set, 100kVA (per unit):             ₱850,000–₱1,200,000/unit
- Emergency generator set, 200kVA (per unit):             ₱1,400,000–₱1,900,000/unit
- Emergency generator set, 400kVA (per unit):             ₱2,200,000–₱3,200,000/unit
- Automatic transfer switch, 100kVA (per unit):           ₱120,000–₱180,000/unit
- Automatic transfer switch, 400kVA (per unit):           ₱280,000–₱420,000/unit
- Solar PV system, 5kWp (per unit):                       ₱280,000–₱420,000/unit

FIRE PROTECTION:
- Wet pipe sprinkler system (per sqm of floor):           ₱1,200–₱2,000/sqm
- Fire detection and alarm system (per sqm):              ₱450–₱850/sqm
- Fire standpipe and hose cabinet (per floor):            ₱35,000–₱65,000/floor
- Fire extinguishers (per unit):                          ₱3,500–₱6,000/unit

HVAC / AIRCONDITIONING:
- Window-type AC unit, 1HP (supply + install):            ₱22,000–₱35,000/unit
- Split-type AC, 1.5HP (supply + install):                ₱38,000–₱58,000/unit
- Cassette-type AC, 2HP (supply + install):               ₱65,000–₱95,000/unit
- VRF/VRV system (per TR of cooling):                     ₱95,000–₱145,000/TR
- Ventilation exhaust fan (per unit):                     ₱4,500–₱8,500/unit

SPECIAL SYSTEMS (as applicable):
- CCTV system (per camera, complete):                     ₱15,000–₱28,000/camera
- Access control (per door):                              ₱25,000–₱55,000/door
- Data/communications cabling (per port):                 ₱4,500–₱8,500/port
- Elevator, 6-stop (supply + install):                    ₱5,500,000–₱9,000,000/unit
- Elevator, 10-stop (supply + install):                   ₱8,500,000–₱14,000,000/unit

SITE WORKS:
- Site clearing and grubbing (per sqm):                   ₱85–₱180/sqm
- Earthfill and compaction (per cu.m):                    ₱550–₱950/cu.m
- Perimeter fence, CHB 1.8m (per lm):                     ₱4,500–₱7,500/lm
- Perimeter fence, precast concrete (per lm):             ₱8,500–₱14,000/lm
- Concrete paving, 150mm (per sqm):                       ₱1,100–₱1,800/sqm
- Asphalt paving, 50mm (per sqm):                         ₱850–₱1,400/sqm
- Landscaping, basic (per sqm):                           ₱350–₱750/sqm
- Drainage canal (per lm):                                ₱2,500–₱4,500/lm

GOVERNMENT / DPWH-SPECIFIC ITEMS:
- Anti-corrosion paint on rebar (per sqm of structure):   ₱120–₱220/sqm
- Epoxy floor coating (per sqm):                          ₱850–₱1,600/sqm
- Security grille (steel bar, per sqm):                   ₱2,800–₱4,500/sqm
- Detention cell doors (heavy steel, per set):            ₱85,000–₱145,000/set
- Bullet-resistant glazing (per sqm):                     ₱28,000–₱55,000/sqm
- CCTV with recording (per camera, high-security):        ₱25,000–₱45,000/camera

PROFESSIONAL FEES (PRC/AAIF schedule, based on project cost):
- Architectural services: 6–8% of construction cost
- Civil/Structural engineering: 3–5% of construction cost
- Mechanical/Electrical/Plumbing: 2–4% of construction cost
- Full design team (Arch + CE + MEP): 10–15% combined
- Construction management: 3–5% of construction cost
- Government projects (DPWH): fees per RA 9184 and agency-specific rates

OVERHEAD, PROFIT & CONTINGENCY:
- Contractor's O&P (typically included in unit rates above): 15–25%
- Contingency for schematic plans: add 20–25%
- Contingency for design development plans: add 10–15%
- Contingency for construction documents (complete): add 5–10%
- Government projects: include 12% VAT on contract price + 1% withholding tax

═══════════════════════════════════════════
PROJECT-TYPE TRADE BREAKDOWN GUIDE
═══════════════════════════════════════════
Always customize the trade list to match the actual project type:

RESIDENTIAL (house, duplex, townhouse):
Required trades: Site Works, Foundation, RC Structure, Masonry/Walls, Roofing, Waterproofing, Doors/Windows, Tile Works, Painting, Plumbing, Electrical, Kitchen Cabinetry, Landscaping
Optional: CCTV, Solar, Airconditioning, Carport/Garage

CONDOMINIUM / MID–HIGH-RISE:
Required trades: Site Works, Deep Foundation (piles), RC Frame (multistorey), Curtain Wall/Glazing, Waterproofing, Interior Fit-out per floor, Elevators, Fire Protection, Building Automation, HVAC, Electrical (HV/LV), Plumbing, Generator, Podium/Parking
Add: Common areas, lobby, amenities floor separately

COMMERCIAL / RETAIL / OFFICE:
Required trades: Site Works, Foundation, RC/Steel Frame, Architectural Shell, MEP rough-in, Partitions, Raised Floor/Ceiling, HVAC, Fire Protection, Electrical (commercial), Data/Comms, Signage, Parking, Landscape
Add: Tenant fit-out allowance if applicable

SCHOOL / INSTITUTIONAL:
Required trades: Site Works, Foundation, RC Frame (typically 3–5 storeys), Classrooms fit-out, Covered walk/canopy, Comfort rooms (per DepEd standards), Electrical, Plumbing, Fire exits/safety, Site paving, Perimeter fence, Flag ceremony area
Rates: Apply DPWH Blue Book school building costs (₱18,000–₱25,000/sqm typical)

GOVERNMENT / JAIL / DETENTION:
Required trades: Site Works (extensive perimeter), Deep Foundation, Heavy RC Frame with shear walls, Security fencing (reinforced), Security grilles on all openings, Heavy-duty detention doors, CCTV (high-density), Access control, Separate plumbing per cell block, Fire protection, Generator (mandatory), Staff quarters
Security premium: add 25–40% to standard construction cost
Apply DPWH Blue Book government building rates

WAREHOUSE / INDUSTRIAL:
Required trades: Site Works, Raft/Strip Foundation, Steel Frame or Tilt-up, Metal roofing (long-span), Concrete floor slab (heavy duty), Loading docks, Industrial electrical (3-phase), Fire protection (ESFR sprinklers for storage), Perimeter fence
Rates: ₱8,500–₱14,000/sqm typical for industrial

HOSPITAL / MEDICAL:
Required trades: RC Frame (seismically isolated preferred), Medical gas system, HVAC (HEPA filtration), Specialized plumbing, Electrical (UPS, emergency), Clean rooms, Radiation shielding (radiology), Pneumatic tube, Nurse call system, Elevators (bed-sized)
Medical premium: add 40–60% to standard institutional cost

RENOVATION / REMODEL:
Light: Estimate affected area only — paint, flooring, fixtures — NO structural
Moderate: Include new partitions, plumbing rough-in, electrical panel upgrade
Heavy/Gut: Include full demolition costs (₱850–₱1,800/sqm), structural modifications, complete MEP replacement
Always include demolition/hauling as a separate trade

FIT-OUT / INTERIOR ONLY:
Estimate interior works only: partition walls, ceiling, flooring, electrical outlets, data points, lighting, HVAC, painting, built-in furniture
Typical fit-out cost: ₱8,000–₱35,000/sqm depending on finish level (economy to luxury)

═══════════════════════════════════════════
MATERIAL COMPOSITION REFERENCE (per sqm of built area)
These are typical material quantities embedded in the parametric rates above.
Use these to cross-check if individual material quantities are known.
═══════════════════════════════════════════

RC FRAME (per sqm of floor area, standard residential):
- Concrete (27.5 MPa): 0.25–0.35 cu.m/sqm (columns + beams + slab combined)
- Reinforcing steel: 25–40 kg/sqm (residential), 40–65 kg/sqm (commercial), 60–90 kg/sqm (government/high-rise)
- Formwork: 1.5–2.2 sqm formwork per sqm of floor
- Cement: ~9.5 bags per cu.m of concrete (1:2:4 mix), ~8 bags for 1:1.5:3

CHB WALLS (per sqm of wall face):
- CHB 150mm: 12.5 pcs/sqm + mortar (cement: ~0.4 bag/sqm)
- CHB 100mm: 12.5 pcs/sqm + mortar (cement: ~0.3 bag/sqm)
- Current market prices (NCR, 2024–2025):
  - 40kg Portland cement bag (40kg): ₱295–₱345/bag
  - Deformed steel bar (12mm): ₱62–₱78/kg
  - Deformed steel bar (16mm): ₱62–₱78/kg
  - River sand (per cu.m): ₱1,400–₱2,200/cu.m
  - Crushed gravel (per cu.m): ₱1,600–₱2,400/cu.m
  - CHB 150mm: ₱17–₱22/pc
  - CHB 100mm: ₱13–₱17/pc
  - Ceramic tiles 60×60 (sqm supply only): ₱850–₱1,800/sqm
  - Plywood 1/2" ordinary: ₱750–₱1,100/sheet

SOIL CONDITION IMPACT ON FOUNDATION COST:
- Rock / very stiff: use LOW end of foundation rates (minimal excavation, shallow footing OK)
- Good (dense sand/gravel, SBC ≥120 kPa): use LOW-MID rates, standard isolated footings
- Average (medium stiff clay, SBC 75–120 kPa): use MID rates, possibly need larger footings
- Soft (loose fill, SBC <75 kPa): use HIGH rates, likely needs piles or mat footing, add 20–40% to foundation cost
- Unknown: use MID-HIGH rates and flag in marketWarnings

ESCALATION / PRICE INFLATION:
- Philippine construction inflation: ~6–10% per year (2023–2025 trend)
- Steel and cement most volatile: can move ±15–25% in 12 months
- If construction start is 6+ months away, add escalation to estimate:
  - 6 months: +3–5% to material-heavy trades (structural, MEP)
  - 12 months: +6–10%
  - 18 months: +9–15%
  - 24 months: +12–20%

═══════════════════════════════════════════
PRECISION RULES — READ CAREFULLY
═══════════════════════════════════════════

1. PLAN READING FIRST: Before estimating, extract from the plans:
   - Actual GFA per floor (count visible grid dimensions if possible)
   - Number and type of structural members visible (columns, beams, shear walls)
   - Foundation type shown on foundation plan
   - Number of toilets/fixtures visible
   - Roof type and area
   - Any special features visible (elevator pit, generator room, security features, etc.)

2. LOCATION-ADJUSTED RATES: Apply the exact location modifier given in the project context to EVERY trade rate. Do not use NCR rates for provincial projects.

3. FINISH-LEVEL RATES: 
   - Basic/Economy: use the LOW end of architectural rates above
   - Standard: use the MID point of rates above
   - High-end/Premium: use the HIGH end of architectural rates above, or higher for imported materials
   - Luxury: multiply high-end rates by 1.3–1.8×

4. PROJECT-TYPE RATES: Use the project-type trade breakdown guide above. Do not use a residential trade list for a government project, or a warehouse list for a school.

5. QUANTITY TAKEOFF: For each trade, provide realistic quantities taken from the plans:
   - Structural works: use actual floor area per floor × number of floors
   - Walls: estimate perimeter × floor height × 0.85 (deduct openings)
   - Roofing: use roof plan area if visible, or GFA × 1.1 for sloped roofs
   - MEP: use GFA-based parametric rates with project-type multiplier

6. CONTINGENCY: Set contingency based on plan completeness shown:
   - Complete CDs (all details visible): 8–10%
   - Design development (floor plans + elevations only): 12–18%
   - Schematic/conceptual only: 20–25%

7. GOVERNMENT PROJECTS: Always add:
   - 12% VAT on all contract items
   - DPWH standard 10% mobilization and demobilization
   - Bond premium estimate (2–3% of contract price)
   - Project billboard and safety signage (₱45,000–₱85,000 lump sum)

8. MATH CHECK: Verify that sum of all trade totalMid values equals summary.totalMid before outputting. percentOfTotal for each trade must sum to approximately 100%.

9. CONFIDENCE RATING:
   - HIGH: Complete plans with dimensions, schedules, and specifications visible
   - MEDIUM: Floor plans and elevations available but details/specs missing
   - LOW: Schematic or conceptual plans only, significant assumptions made

STRICT OUTPUT RULES:
- Return ONLY valid JSON — no markdown, no explanation, no preamble, no trailing text.
- All monetary values must be plain numbers (no ₱ symbol, no commas, no text).
- Every trade must have qty, unit, rateLow, rateHigh, totalLow, totalHigh, percentOfTotal.
- Do not truncate. Complete the full JSON including all trades, VE items, warnings, and next steps.
- max_tokens is set to 12000 — use as much as needed to be complete and precise.

Return this exact JSON structure:
{
  "project": {
    "name": "string",
    "type": "Residential|Duplex|Condominium|Commercial|Office|Retail|School|Warehouse|Government|Hospital|Mixed-Use|Infrastructure",
    "location": "string — specific city/province if visible in plans, otherwise region",
    "finishLevel": "Basic|Standard|High-end|Luxury",
    "scopeMode": "new-construction|renovation|fitout|addition|adhoc",
    "numberOfFloors": 0,
    "estimatedGFA": 0,
    "gfaSource": "user-provided|measured-from-plans|estimated",
    "gfaPerFloor": [{"floor": "Ground", "area": 0}],
    "structuralSystem": "string",
    "foundationType": "string",
    "roofType": "string",
    "numberOfFixtures": 0,
    "hasElevator": false,
    "hasGenerator": false,
    "hasFireProtection": false,
    "specialFeatures": ["list any visible special features from plans"],
    "scopeIncluded": ["detailed list of all scope items included"],
    "scopeExcluded": ["list of items explicitly excluded — be specific"],
    "estimationBasis": "string — describe exactly how quantities were derived from plans",
    "planQuality": "Complete|Design-Development|Schematic",
    "planQualityNote": "string — what was and wasn't visible in the plans"
  },
  "summary": {
    "totalLow": 0,
    "totalHigh": 0,
    "totalMid": 0,
    "midpoint": 0,
    "costPerSqmLow": 0,
    "costPerSqmHigh": 0,
    "costPerSqmMid": 0,
    "contingencyLow": 0,
    "contingencyHigh": 0,
    "contingencyPct": 0,
    "professionalFeesLow": 0,
    "professionalFeesHigh": 0,
    "professionalFeesPct": 0,
    "grandTotalLow": 0,
    "grandTotalHigh": 0,
    "marketBenchmarkLow": 0,
    "marketBenchmarkHigh": 0,
    "benchmarkSource": "string — cite the specific rate source, e.g. DPWH Blue Book 2024 School Building, NCR residential parametric",
    "vatAmount": 0,
    "vatIncluded": false,
    "vatNote": "string or null",
    "profFeeIncluded": false,
    "profFeeAmount": 0,
    "profFeeBasis": "string or null",
    "overallConfidence": "High|Medium|Low",
    "confidenceNote": "string — specific reason for this confidence level based on plan quality"
  },
  "trades": [
    {
      "trade": "string",
      "icon": "emoji",
      "description": "string — technical scope",
      "plainDescription": "string — plain language for client",
      "qty": 0,
      "unit": "sqm|cu.m|lm|pc|set|unit|lot|floor",
      "rateLow": 0,
      "rateHigh": 0,
      "totalLow": 0,
      "totalHigh": 0,
      "totalMid": 0,
      "percentOfTotal": 0,
      "isMajor": true,
      "included": true,
      "assumptions": "string — key assumptions made for this trade",
      "notes": "string — any risks, notes, or alternatives",
      "dpwhReference": "string or null"
    }
  ],
  "valueEngineering": [
    {
      "suggestion": "string — specific, actionable recommendation",
      "plainExplanation": "string — explain to a non-engineer client",
      "affectedTrade": "string — which trade this applies to",
      "savingLow": 0,
      "savingHigh": 0,
      "qualityImpact": "None|Minor|Moderate|Significant",
      "feasibility": "Easy|Moderate|Difficult",
      "recommendation": "Recommended|Consider|Last Resort"
    }
  ],
  "marketWarnings": [
    {
      "item": "string",
      "warning": "string — specific risk with Philippine market context",
      "level": "High|Medium|Low",
      "mitigation": "string — how to mitigate this risk"
    }
  ],
  "nextSteps": [
    {
      "step": 1,
      "action": "string",
      "detail": "string",
      "priority": "Urgent|High|Medium|Low"
    }
  ]
}`;

export default BOMReview;
