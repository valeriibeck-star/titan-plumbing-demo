/**
 * Physics Engine Types
 *
 * Core data structures for paint formulation calculations.
 * All densities in g/mL, volumes in mL, weights in g unless noted.
 */

export interface Ingredient {
  materialId: string;
  name: string;
  category: "pigment" | "binder" | "solvent" | "additive" | "filler" | "thinner";
  amount: number;           // weight in grams (for a given batch)
  density: number;          // g/mL
  solidsByWeight: number;   // fraction 0–1
  solidsByVolume: number;   // fraction 0–1
  isVolatile: boolean;
  vocContent: number;       // g/L of material VOC
  isPigment: boolean;
  costPerKg: number;
}

export interface FormulaInput {
  ingredients: Ingredient[];
  batchSizeKg?: number;     // if set, amounts are scaled to this
  targetDftMils?: number;   // dry film thickness for yield calc
}

export interface IngredientResult {
  materialId: string;
  name: string;
  weight: number;           // g
  volume: number;           // mL
  weightFraction: number;
  volumeFraction: number;
  costContribution: number; // currency units
}

export interface FormulaResult {
  // Per-ingredient breakdown
  ingredients: IngredientResult[];

  // Totals
  totalWeight: number;      // g
  totalVolume: number;      // mL
  density: number;          // g/mL

  // Solids
  solidsByWeight: number;   // fraction
  solidsByVolume: number;   // fraction
  nonVolatileWeight: number;
  nonVolatileVolume: number;

  // PVC — Pigment Volume Concentration
  pvc: number;              // fraction (pigmentVolume / (pigmentVolume + binderSolidsVolume))
  cpvc?: number;            // critical PVC (if oil absorption data available)

  // VOC
  vocGramsPerLiter: number;
  vocLbsPerGallon: number;

  // Yield
  yieldSqFtPerGallon?: number;   // at given DFT
  yieldSqMPerLiter?: number;

  // Cost
  costPerKg: number;
  costPerLiter: number;
  costPerGallon: number;
  totalBatchCost: number;
}
