/**
 * Physics Engine — Core Calculator
 *
 * Computes paint formulation physical properties:
 *   - PVC (Pigment Volume Concentration)
 *   - Density (weight / volume)
 *   - VOC (Volatile Organic Compounds in g/L)
 *   - Yield (coverage at a given dry film thickness)
 *   - Cost (per kg, per liter, per gallon, per batch)
 *
 * All calculations follow ASTM D 2697 / D 3960 / D 5201 methodology.
 */

import type { FormulaInput, FormulaResult, IngredientResult } from "./types.js";

const ML_PER_GALLON = 3785.41;
const GRAMS_PER_LB = 453.592;
const SQ_FT_PER_SQ_M = 10.7639;
const MILS_TO_CM = 0.00254;

export function calculateFormula(input: FormulaInput): FormulaResult {
  const { ingredients, targetDftMils } = input;

  if (ingredients.length === 0) {
    throw new Error("Formula must have at least one ingredient");
  }

  // ── Step 1: Per-ingredient weight & volume ────────────────────────
  let totalWeight = 0;
  let totalVolume = 0;
  let totalCost = 0;

  const rows: Array<{
    weight: number;
    volume: number;
    cost: number;
    nonVolWeight: number;
    nonVolVolume: number;
    pigmentVolume: number;
    binderSolidsVolume: number;
    vocWeight: number;
  }> = [];

  for (const ing of ingredients) {
    if (ing.density <= 0) {
      throw new Error(`Density must be positive for ${ing.name}`);
    }

    const weight = ing.amount;                    // grams
    const volume = weight / ing.density;          // mL
    const cost = (weight / 1000) * ing.costPerKg; // currency

    // Non-volatile (solids) contributions
    const nonVolWeight = weight * ing.solidsByWeight;
    const nonVolVolume = volume * ing.solidsByVolume;

    // Pigment volume for PVC
    const pigmentVolume = ing.isPigment ? nonVolVolume : 0;

    // Binder solids volume for PVC denominator
    const binderSolidsVolume =
      ing.category === "binder" ? nonVolVolume : 0;

    // VOC weight: for volatile materials, VOC = vocContent (g/L) × volume (L)
    // vocContent is already in g/L of the raw material
    const vocWeight = ing.vocContent * (volume / 1000);

    totalWeight += weight;
    totalVolume += volume;
    totalCost += cost;

    rows.push({
      weight,
      volume,
      cost,
      nonVolWeight,
      nonVolVolume,
      pigmentVolume,
      binderSolidsVolume,
      vocWeight,
    });
  }

  // ── Step 2: Aggregate solids ──────────────────────────────────────
  let nonVolatileWeight = 0;
  let nonVolatileVolume = 0;
  let pigmentVolumeTotal = 0;
  let binderSolidsVolumeTotal = 0;
  let vocWeightTotal = 0;

  for (const r of rows) {
    nonVolatileWeight += r.nonVolWeight;
    nonVolatileVolume += r.nonVolVolume;
    pigmentVolumeTotal += r.pigmentVolume;
    binderSolidsVolumeTotal += r.binderSolidsVolume;
    vocWeightTotal += r.vocWeight;
  }

  // ── Step 3: Key properties ────────────────────────────────────────
  const density = totalWeight / totalVolume; // g/mL

  const solidsByWeight = totalWeight > 0 ? nonVolatileWeight / totalWeight : 0;
  const solidsByVolume = totalVolume > 0 ? nonVolatileVolume / totalVolume : 0;

  // PVC = pigment volume / (pigment volume + binder solids volume)
  const pvcDenominator = pigmentVolumeTotal + binderSolidsVolumeTotal;
  const pvc = pvcDenominator > 0 ? pigmentVolumeTotal / pvcDenominator : 0;

  // VOC in g/L of coating (total VOC weight / total volume in liters)
  // Per ASTM D 3960: VOC = (Wv - Ww) / (Vm - Vw)
  // Simplified: total VOC grams / total volume in liters
  const totalVolumeLiters = totalVolume / 1000;
  const vocGramsPerLiter =
    totalVolumeLiters > 0 ? vocWeightTotal / totalVolumeLiters : 0;
  const vocLbsPerGallon =
    (vocGramsPerLiter * ML_PER_GALLON) / (1000 * GRAMS_PER_LB);

  // ── Step 4: Yield (coverage) ──────────────────────────────────────
  // Theoretical yield = (solidsByVolume × 1 gallon) / DFT
  // sq ft/gal = (solidsByVolume × 1604.2) / DFT(mils)
  // 1604.2 = 231 in³/gal × (144 in²/ft²) / (1000 mils/in) × (1/231) ... = 1604.2
  let yieldSqFtPerGallon: number | undefined;
  let yieldSqMPerLiter: number | undefined;

  if (targetDftMils && targetDftMils > 0) {
    // 1 gallon = 231 in³; DFT in mils = DFT/1000 in
    // coverage = volume_solids_fraction × 231 in³ / (DFT/1000 in) / 144 in²/ft²
    // = solidsByVolume × 231 × 1000 / (DFT × 144)
    // = solidsByVolume × 1604.17 / DFT
    yieldSqFtPerGallon = (solidsByVolume * 1604.17) / targetDftMils;

    // metric: 1 L = 1000 mL = 1000 cm³
    // coverage m²/L = solidsByVolume × 1000 cm³ / (DFT_cm × 10000 cm²/m²)
    const dftCm = targetDftMils * MILS_TO_CM;
    yieldSqMPerLiter =
      dftCm > 0 ? (solidsByVolume * 1000) / (dftCm * 10000) : undefined;
  }

  // ── Step 5: Cost ──────────────────────────────────────────────────
  const costPerKg = totalWeight > 0 ? totalCost / (totalWeight / 1000) : 0;
  const costPerLiter = totalVolumeLiters > 0 ? totalCost / totalVolumeLiters : 0;
  const costPerGallon = costPerLiter * (ML_PER_GALLON / 1000);

  // ── Step 6: Per-ingredient breakdown ──────────────────────────────
  const ingredientResults: IngredientResult[] = ingredients.map((ing, i) => ({
    materialId: ing.materialId,
    name: ing.name,
    weight: rows[i].weight,
    volume: rows[i].volume,
    weightFraction: totalWeight > 0 ? rows[i].weight / totalWeight : 0,
    volumeFraction: totalVolume > 0 ? rows[i].volume / totalVolume : 0,
    costContribution: rows[i].cost,
  }));

  return {
    ingredients: ingredientResults,
    totalWeight,
    totalVolume,
    density,
    solidsByWeight,
    solidsByVolume,
    nonVolatileWeight,
    nonVolatileVolume,
    pvc,
    vocGramsPerLiter,
    vocLbsPerGallon,
    yieldSqFtPerGallon,
    yieldSqMPerLiter,
    costPerKg,
    costPerLiter,
    costPerGallon,
    totalBatchCost: totalCost,
  };
}

/**
 * Estimate Critical PVC (CPVC) from oil absorption values.
 * CPVC = 1 / (1 + OA × ρ_pigment / (93.5 × ρ_oil))
 *
 * Where OA = oil absorption (g oil / 100g pigment)
 * ρ_oil ≈ 0.93 g/mL (linseed oil standard)
 */
export function estimateCPVC(
  oilAbsorption: number,
  pigmentDensity: number,
  oilDensity = 0.93
): number {
  if (oilAbsorption <= 0 || pigmentDensity <= 0) return 0;
  return 1 / (1 + (oilAbsorption * pigmentDensity) / (93.5 * oilDensity));
}

/**
 * Lambda (Λ) ratio = PVC / CPVC
 * Λ < 1 → above CPVC (porous film, flat finish)
 * Λ = 1 → at CPVC
 * Λ > 1 → below CPVC (continuous binder film, glossy)
 *
 * Note: convention varies; here Λ = PVC/CPVC so Λ > 1 means above CPVC.
 */
export function lambdaRatio(pvc: number, cpvc: number): number {
  if (cpvc <= 0) return 0;
  return pvc / cpvc;
}
