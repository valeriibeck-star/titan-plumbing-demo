# Kompozit LLC — Factory Management System: Implementation Plan

## Context

Kompozit LLC is a paint/coatings manufacturer that needs a custom ERP because off-the-shelf systems are unit-based, not weight-based. The previous attempt (Mar-Kovesque v3) was partially built but never completed to production. This plan defines the complete system scope and build order for a greenfield implementation.

**Key constraints:**
- Small team (1-5 concurrent users) — simple auth, no complex real-time sync
- Manufacturing + inventory + finance only — sales/CRM stays in Notion
- Container sizes: 32 oz, 1 gallon, 3.5 gallon, 5 gallon
- Product lines: EKO, NEO, PRO, ONE, Other

**Tech stack:** Node.js/TypeScript backend, React/Vite frontend, PostgreSQL, Docker

---

## System Architecture: 10 Modules

### MODULE 1: Raw Material Inventory (Weight-Based)
**Why:** Paint manufacturing runs on chemicals measured in lbs, not units. You need to know there's 452.8 lbs of TiO2 left in that drum, not "0.9 drums."

**Features:**
- Material master list — name, category (pigment/resin/solvent/additive/filler), CAS number, density (lbs/gal), VOC content (g/L), cost per lb, SDS link
- Drum-level tracking — each physical drum is a record: material, lot number, supplier lot, received date, initial weight, current weight, warehouse location, expiration date, status (quarantined/available/in-use/empty)
- Real-time weight deduction — production pulls decrement drum weights automatically
- FIFO enforcement — system suggests oldest available drum first
- Reorder alerts — per-material minimum stock (lbs) + reorder quantity; "days of supply" calculation based on consumption rate
- Multi-unit display — stored in lbs, viewable in kg, gallons (via density), or drum count
- Barcode (Code128) — each drum gets a barcode label on receipt

**Key tables:** `materials`, `material_drums`

---

### MODULE 2: Packaging Inventory (Unit-Based)
**Why:** Containers, lids, labels, boxes are counted in units, not weight. A batch of paint is useless if you don't have cans to put it in.

**Features:**
- SKU management — every packaging item: name, category (container/lid/label/box/pallet/shrink-wrap), size (32oz/1gal/3.5gal/5gal), cost per unit
- Label variants — labels are product-line + product + color specific; containers/lids are size-specific only
- Unit tracking — current quantity, reorder point, reorder quantity
- Consumption tracking — packaging consumed during fill/pack stage, rates calculated
- Reorder alerts — same logic as raw materials but in units

**Key tables:** `packaging_items`, `packaging_receipts`

---

### MODULE 3: Formula / Recipe Management
**Why:** Paint formulas are proprietary chemistry — precise mass ratios that define the product. This is the company's IP.

**Features:**
- Formula storage — each formula: code (e.g. "PRO-INT-FLAT-001"), product line, color, sheen (flat/eggshell/satin/semi-gloss/gloss), interior/exterior, category (latex/alkyd/primer/stain/specialty)
- Ingredients as mass ratios — each ingredient stored as weight percentage (all sum to 100%), with add-order and mixing instructions
- Auto-scaling — enter batch size in lbs or target gallons → system calculates exact weight of each material
- Version control — formula changes create new version, old preserved, batches reference specific version used
- Cost preview — current cost per lb and per gallon using live material prices
- VOC calculation — sum of (ingredient VOC content × weight fraction) = finished product VOC in g/L; red flag if over regulatory limit
- Expected density (lbs/gal) — enables weight-to-gallon conversion for yield calculation
- Clone/duplicate — common when creating color variants

**Key tables:** `formulas`, `formula_ingredients`, `formula_versions`

---

### MODULE 4: Production / Batch Management
**Why:** This is the operational heart. Every batch is an immutable record linking operator → materials → quantities → QC → finished product.

**Batch Creation Workflow:**
1. Select formula + enter batch size (lbs or target gallons)
2. System calculates exact weight per raw material (from formula ratios)
3. System checks inventory — green/yellow/red per ingredient
4. Operator confirms → batch created as "Scheduled"
5. Assigned to production line + date

**Material Consumption:**
- Batch moves to "Mixing" → operator records actual weights pulled from specific drums
- System suggests drums in FIFO order; operator scans barcode, enters weight
- Records both target and actual weight per ingredient (variance tracking)
- Drum weights decrement in real time; supports pulling from multiple drums

**Fill/Pack Stage:**
- After QC release, batch moves to "Filling"
- Operator selects fill size (32oz/1gal/3.5gal/5gal), enters planned quantity
- System checks packaging inventory (containers + lids + labels), warns if short
- Records actual units filled; deducts packaging inventory
- Yield tracking: filled weight vs. batch weight → waste/scrap

**Waste Tracking:**
- `waste_lbs = batch_weight - (units_filled × density × size_gal)`
- Categorized: tank residual, line flush, spills, off-spec, QC samples
- Tracked over time per formula, per line

**Batch Status Lifecycle:**
```
Scheduled → Mixing → Mixed (QC Hold) → QC Released → Filling → Filled → Released to FG
                                      → QC Failed → Rework / Disposed
```

**Immutability:** Batch records are append-only. Once created, fields cannot be edited — only new entries appended. This is the audit trail.

**Key tables:** `batches`, `batch_ingredients`, `batch_fills`

---

### MODULE 5: Quality Control
**Why:** A bad batch of paint damages the brand and creates liability. QC gates ensure nothing ships without lab approval.

**Features:**
- QC specs per formula — each formula defines expected test parameters with min/max ranges
- Lab testing — viscosity (KU), pH, density (lbs/gal), color match (delta-E), gloss (GU@60°), opacity, fineness of grind (Hegman), drying time, adhesion
- Auto pass/fail — actual result compared against spec range
- Hold/release workflow — batch auto-enters QC Hold after mixing; lab manager releases or rejects
- Adjustments — if tests fail, can add corrective materials (tracked as additional batch ingredients with reason codes)
- Retain samples — sample ID, storage location, quantity, collection date, expiration (2-5 years)
- Complaint tracking — linked to batch number from can label; categories: color mismatch, poor coverage, adhesion failure, viscosity issue, contamination, packaging damage

**Key tables:** `qc_specifications`, `qc_tests`, `retain_samples`, `complaints`

---

### MODULE 6: Finished Goods Inventory
**Why:** Track what's produced and available. When a batch is filled and released, those units need to be tracked as sellable inventory.

**Features:**
- SKU-based — product line + product + color + size = SKU (e.g. "PRO-INT-FLAT-WHT-1G")
- Batch linkage — every FG unit traces back to its batch number
- Quantity tracking — current stock per SKU, per warehouse location
- FIFO for outbound — oldest batches ship first
- Shelf life management — manufacture date per batch, flags product approaching expiration
- Min stock alerts — suggests production runs based on FG levels

**Key tables:** `finished_goods`, `fg_inventory_entries`

---

### MODULE 7: Purchasing / Supplier Management
**Why:** You need to know what to buy, from whom, at what price, and track what you've received.

**Features:**
- Supplier master — name, contact, payment terms, lead time, rating; multiple suppliers per material
- Purchase orders — line items (material or packaging + quantity + unit price), status (draft/submitted/confirmed/partially-received/received/closed)
- Receiving workflow — select PO, record received items: creates drum records (with lot/weight/expiration) for materials, adds stock for packaging
- Partial receipts — receive 8 of 10 drums, backorder remainder
- COA upload — Certificate of Analysis linked to received drums
- Incoming quarantine — option to hold received materials pending QC inspection
- Price history — historical cost per lb/unit per material per supplier

**Key tables:** `suppliers`, `purchase_orders`, `po_line_items`

---

### MODULE 8: Financial / Cost Engine
**Why:** You need to know what each batch costs, what your inventory is worth, and where your margins are.

**Features:**
- **Batch costing:**
  - Material cost = Σ(actual_weight × cost_per_lb from drum)
  - Packaging cost = Σ(units_filled × cost_per_unit for container + lid + label)
  - Labor cost = configurable rate × hours (manual entry)
  - Overhead = configurable rate per batch or per gallon
  - **Total batch cost** and **cost per gallon** auto-calculated

- **Inventory valuation:**
  - Raw materials: Σ(current_weight × cost_per_lb) for all drums
  - Packaging: Σ(current_qty × cost_per_unit)
  - Finished goods: Σ(quantity × cost_per_unit from batch costing)
  - **Total warehouse value** = RM + packaging + FG

- **Margin analysis:** cost per unit vs. selling price per SKU; margin by product line

- **Cost trending:** historical cost per lb per material charted over time; batch cost variance (actual vs. expected)

- **AP basics:** outstanding POs = what's owed to suppliers; payment tracking; aging report

**Key tables:** `batch_costs`, `material_price_history`, `labor_rates`, `overhead_rates`

---

### MODULE 9: Compliance & Traceability
**Why:** EPA requires VOC tracking. Regulators require lot traceability. If there's a recall, you need to trace from finished product → batch → raw material drums → supplier lots in seconds.

**Features:**
- **Full lot traceability:**
  - Forward trace: raw material lot → which batches → which FG → which customers
  - Backward trace: finished product → batch → formula version → drums → supplier lots
- **VOC compliance:**
  - Per-formula VOC calculation (from ingredient VOC × weight fraction)
  - Per-batch VOC verification (from actual weights)
  - Threshold warnings (federal + state jurisdictions)
  - VOC reporting by time period for EPA annual reports
- **Document management:** SDS, TDS, COAs, batch record exports
- **Audit-ready batch record export:** one-click PDF with formula, ingredients/lots, QC results, fill data, operator names, timestamps
- **Audit log:** every create/update/status-change across all modules logged with user, timestamp, old/new values

**Key tables:** `audit_log`, `documents`

---

### MODULE 10: Dashboard & Reporting
**Why:** The owner/operator needs a single screen showing factory status, and the ability to generate reports.

**Features:**
- **Dashboard widgets:**
  - Today's production schedule (batches in progress, upcoming)
  - Inventory alerts (materials below reorder point)
  - QC holds (batches awaiting lab release)
  - Recent batch completions with yield %
  - Warehouse value summary (RM + packaging + FG)
- **Reports:**
  - Production: batches per day/week/month, yield rates, waste %
  - Inventory: current stock, consumption rates, days-of-supply
  - Cost: batch cost trending, material cost trending, variance
  - Compliance: VOC history, audit-ready batch records
  - Reorder: what needs to be ordered, suggested quantities, projected stockout dates

---

## Build Phases

### Phase 1 — Foundation + Core Loop (MVP)
The minimum to run production digitally.

1. **Database schema + API scaffolding** (PostgreSQL + Node.js/Express/TypeScript)
2. **Auth** — simple JWT auth with role-based access (admin + operator for now)
3. **Materials module** — material master, drum tracking, weight deduction
4. **Packaging module** — item master, unit tracking
5. **Formula module** — formula CRUD, ingredient ratios, auto-scaling, version control
6. **Batch module** — full lifecycle: create → mix (pull materials) → fill (consume packaging) → release to FG
7. **Finished goods module** — basic SKU inventory from batch output
8. **Dashboard** — simple overview: today's batches, inventory alerts

**Outcome:** Can create formulas, run batches, track inventory deductions, and see what's in the warehouse.

### Phase 2 — Quality + Compliance
Make it audit-ready.

1. **QC module** — specs per formula, test entry, hold/release workflow
2. **VOC engine** — per-formula and per-batch VOC calculation with threshold alerts
3. **Batch record export** — one-click audit-ready PDF
4. **Audit log** — system-wide change tracking
5. **Retain sample tracking**

**Outcome:** Full regulatory compliance. Batches can't ship without QC. VOC calculated in real-time. Audit trail complete.

### Phase 3 — Purchasing + Financial
Close the money loop.

1. **Supplier management** — supplier master, price lists
2. **Purchase orders** — create, submit, receive (creates drums/adds packaging)
3. **Batch costing** — auto-calculate material + packaging + labor + overhead costs
4. **Inventory valuation** — total warehouse value in dollars
5. **Cost trending + margin analysis**
6. **Reorder intelligence** — consumption-based reorder suggestions with projected stockout

**Outcome:** Know what everything costs. Know when to buy. Know your margins.

### Phase 4 — Polish + Scale
Operational efficiency.

1. **Barcode scanning** — Code128 for drum receiving and finished goods
2. **Advanced reporting** — production analytics, waste trending, supplier comparison
3. **Complaint management** — linked to batch traceability
4. **Equipment tracking** — maintenance schedules, calibration due dates
5. **Document management** — SDS, TDS, COA storage and linking

**Outcome:** Full-featured factory management system.

---

## Verification / Testing Strategy

- **Unit tests** for the Physics Engine (formula scaling, VOC calculations, mass-balance validation)
- **Integration tests** for the core loop: create formula → create batch → pull materials → verify drum weights decremented → fill → verify packaging decremented → verify FG inventory created
- **Batch costing test:** verify material cost + packaging cost + labor + overhead = expected total
- **Inventory valuation test:** verify sum across all drums/packaging/FG matches expected
- **Reorder alert test:** deplete material below threshold, verify alert fires
- **QC workflow test:** create batch, enter failing QC result, verify batch is blocked from filling
- **VOC test:** create formula exceeding VOC threshold, verify system flags it
- **Audit log test:** perform operations, verify all changes logged with user/timestamp
- **Docker:** full system runs via `docker-compose up` with PostgreSQL + API + React frontend
