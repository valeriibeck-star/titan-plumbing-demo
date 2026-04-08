-- kompozit-erp database schema
-- Paint formulation ERP with Physics Engine support

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE material_category AS ENUM (
  'pigment',
  'binder',
  'solvent',
  'additive',
  'filler',
  'thinner'
);

CREATE TYPE formula_status AS ENUM (
  'draft',
  'testing',
  'approved',
  'production',
  'archived'
);

CREATE TYPE batch_status AS ENUM (
  'planned',
  'in_progress',
  'qc_pending',
  'qc_passed',
  'qc_failed',
  'completed',
  'scrapped'
);

CREATE TYPE unit_type AS ENUM (
  'kg',
  'g',
  'lb',
  'gal',
  'l',
  'ml'
);

-- ============================================================
-- CORE TABLES
-- ============================================================

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE raw_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  category material_category NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),

  -- Physical properties (critical for Physics Engine)
  density NUMERIC(10, 4) NOT NULL,          -- g/mL (or g/cm³)
  solids_by_weight NUMERIC(6, 4),           -- fraction 0-1 (non-volatile weight %)
  solids_by_volume NUMERIC(6, 4),           -- fraction 0-1 (non-volatile volume %)
  is_volatile BOOLEAN DEFAULT false,        -- true for solvents/water
  voc_content NUMERIC(8, 4) DEFAULT 0,      -- g/L of VOC

  -- Pigment-specific
  oil_absorption NUMERIC(8, 2),             -- g oil / 100g pigment
  refractive_index NUMERIC(6, 4),
  tinting_strength NUMERIC(8, 2),
  is_pigment BOOLEAN DEFAULT false,

  -- Cost
  cost_per_kg NUMERIC(12, 4) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Inventory
  stock_qty NUMERIC(12, 4) DEFAULT 0,
  stock_unit unit_type DEFAULT 'kg',
  reorder_point NUMERIC(12, 4) DEFAULT 0,

  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE formulas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  version INTEGER DEFAULT 1,
  status formula_status DEFAULT 'draft',
  description TEXT,

  -- Target properties (what the formula aims for)
  target_pvc NUMERIC(8, 4),                 -- Pigment Volume Concentration (fraction)
  target_density NUMERIC(10, 4),            -- g/mL
  target_voc NUMERIC(8, 2),                 -- g/L
  target_viscosity NUMERIC(8, 2),           -- KU or cP
  target_gloss NUMERIC(6, 2),              -- GU at 60°

  -- Calculated properties (filled by Physics Engine)
  calc_pvc NUMERIC(8, 4),
  calc_density NUMERIC(10, 4),
  calc_voc NUMERIC(8, 2),
  calc_solids_by_weight NUMERIC(6, 4),
  calc_solids_by_volume NUMERIC(6, 4),
  calc_yield_per_gallon NUMERIC(10, 4),     -- sq ft / gallon at given DFT
  calc_cost_per_kg NUMERIC(12, 4),
  calc_cost_per_liter NUMERIC(12, 4),
  calc_cost_per_gallon NUMERIC(12, 4),

  -- Application
  target_dft NUMERIC(8, 2),                 -- Dry Film Thickness in mils
  recommended_dft_min NUMERIC(8, 2),
  recommended_dft_max NUMERIC(8, 2),

  batch_size_kg NUMERIC(12, 4) DEFAULT 100,
  parent_formula_id UUID REFERENCES formulas(id),

  created_by VARCHAR(255),
  approved_by VARCHAR(255),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE formula_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formula_id UUID NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES raw_materials(id),
  sort_order INTEGER DEFAULT 0,

  -- Quantity per batch
  amount NUMERIC(12, 4) NOT NULL,           -- in amount_unit
  amount_unit unit_type DEFAULT 'kg',

  -- Calculated by Physics Engine per ingredient
  weight_fraction NUMERIC(8, 6),            -- fraction of total weight
  volume_fraction NUMERIC(8, 6),            -- fraction of total volume
  cost_contribution NUMERIC(12, 4),         -- cost of this ingredient in batch

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(formula_id, material_id)
);

-- ============================================================
-- PRODUCTION
-- ============================================================

CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_number VARCHAR(50) UNIQUE NOT NULL,
  formula_id UUID NOT NULL REFERENCES formulas(id),
  status batch_status DEFAULT 'planned',

  target_size_kg NUMERIC(12, 4) NOT NULL,
  actual_size_kg NUMERIC(12, 4),

  -- QC measured values
  measured_density NUMERIC(10, 4),
  measured_viscosity NUMERIC(8, 2),
  measured_ph NUMERIC(4, 2),
  measured_gloss NUMERIC(6, 2),
  measured_fineness NUMERIC(8, 2),          -- Hegman gauge

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  operator VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE batch_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES raw_materials(id),
  sort_order INTEGER DEFAULT 0,

  target_amount NUMERIC(12, 4) NOT NULL,
  actual_amount NUMERIC(12, 4),
  amount_unit unit_type DEFAULT 'kg',

  added_at TIMESTAMPTZ,
  added_by VARCHAR(255),

  UNIQUE(batch_id, material_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_raw_materials_category ON raw_materials(category);
CREATE INDEX idx_raw_materials_supplier ON raw_materials(supplier_id);
CREATE INDEX idx_formulas_status ON formulas(status);
CREATE INDEX idx_formulas_code ON formulas(code);
CREATE INDEX idx_formula_ingredients_formula ON formula_ingredients(formula_id);
CREATE INDEX idx_formula_ingredients_material ON formula_ingredients(material_id);
CREATE INDEX idx_batches_formula ON batches(formula_id);
CREATE INDEX idx_batches_status ON batches(status);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_raw_materials_updated_at
  BEFORE UPDATE ON raw_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_formulas_updated_at
  BEFORE UPDATE ON formulas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_formula_ingredients_updated_at
  BEFORE UPDATE ON formula_ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_batches_updated_at
  BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED DATA: Sample raw materials for paint formulation
-- ============================================================

INSERT INTO suppliers (name, code, contact_name, email) VALUES
  ('ChemCorp International', 'SUP-CHEM01', 'John Miller', 'john@chemcorp.example'),
  ('PigmentWorks Ltd', 'SUP-PIG01', 'Sarah Chen', 'sarah@pigmentworks.example'),
  ('ResinTech Solutions', 'SUP-RES01', 'Mike Davis', 'mike@resintech.example');

INSERT INTO raw_materials (name, code, category, density, solids_by_weight, solids_by_volume, is_volatile, voc_content, is_pigment, oil_absorption, cost_per_kg) VALUES
  -- Pigments
  ('Titanium Dioxide R-902', 'RM-TIO2-01', 'pigment', 4.1000, 1.0000, 1.0000, false, 0, true, 21.00, 3.50),
  ('Iron Oxide Red 130', 'RM-FEOX-01', 'pigment', 5.1000, 1.0000, 1.0000, false, 0, true, 25.00, 1.80),
  ('Carbon Black N330', 'RM-CB-01', 'pigment', 1.8000, 1.0000, 1.0000, false, 0, true, 120.00, 2.20),
  ('Calcium Carbonate GCC', 'RM-CACO3-01', 'filler', 2.7100, 1.0000, 1.0000, false, 0, false, 15.00, 0.25),
  ('Talc Microtalc', 'RM-TALC-01', 'filler', 2.7800, 1.0000, 1.0000, false, 0, false, 30.00, 0.40),

  -- Binders
  ('Acrylic Latex AC-261', 'RM-ACLX-01', 'binder', 1.0500, 0.5000, 0.4600, false, 0, false, NULL, 2.10),
  ('Alkyd Resin Long Oil', 'RM-ALKY-01', 'binder', 0.9800, 0.7000, 0.6500, false, 280, false, NULL, 2.80),

  -- Solvents
  ('Water', 'RM-H2O-01', 'solvent', 1.0000, 0.0000, 0.0000, true, 0, false, NULL, 0.01),
  ('Mineral Spirits', 'RM-MNSP-01', 'solvent', 0.7700, 0.0000, 0.0000, true, 770, false, NULL, 0.90),
  ('Propylene Glycol', 'RM-PGLY-01', 'solvent', 1.0360, 0.0000, 0.0000, true, 0, false, NULL, 1.50),

  -- Additives
  ('Dispersant Tego 752W', 'RM-DISP-01', 'additive', 1.0500, 0.2500, 0.2300, false, 0, false, NULL, 8.50),
  ('Defoamer BYK-024', 'RM-DFAM-01', 'additive', 0.9800, 1.0000, 1.0000, false, 0, false, NULL, 12.00),
  ('Thickener HEC', 'RM-THCK-01', 'additive', 1.0000, 1.0000, 1.0000, false, 0, false, NULL, 6.00),
  ('Biocide Acticide MBS', 'RM-BIOC-01', 'additive', 1.1000, 1.0000, 1.0000, false, 0, false, NULL, 15.00);
