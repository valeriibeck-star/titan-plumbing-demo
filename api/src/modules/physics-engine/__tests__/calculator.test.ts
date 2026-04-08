import { describe, it, expect } from "vitest";
import {
  calculateFormula,
  estimateCPVC,
  lambdaRatio,
} from "../calculator.js";
import type { Ingredient } from "../types.js";

// ── Helpers ─────────────────────────────────────────────────────────

function makeIngredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    materialId: "test-01",
    name: "Test Material",
    category: "additive",
    amount: 100,
    density: 1.0,
    solidsByWeight: 1.0,
    solidsByVolume: 1.0,
    isVolatile: false,
    vocContent: 0,
    isPigment: false,
    costPerKg: 1.0,
    ...overrides,
  };
}

const TIO2: Ingredient = {
  materialId: "tio2",
  name: "Titanium Dioxide",
  category: "pigment",
  amount: 200,
  density: 4.1,
  solidsByWeight: 1.0,
  solidsByVolume: 1.0,
  isVolatile: false,
  vocContent: 0,
  isPigment: true,
  costPerKg: 3.5,
};

const ACRYLIC_LATEX: Ingredient = {
  materialId: "latex",
  name: "Acrylic Latex",
  category: "binder",
  amount: 300,
  density: 1.05,
  solidsByWeight: 0.5,
  solidsByVolume: 0.46,
  isVolatile: false,
  vocContent: 0,
  isPigment: false,
  costPerKg: 2.1,
};

const WATER: Ingredient = {
  materialId: "water",
  name: "Water",
  category: "solvent",
  amount: 300,
  density: 1.0,
  solidsByWeight: 0,
  solidsByVolume: 0,
  isVolatile: true,
  vocContent: 0,
  isPigment: false,
  costPerKg: 0.01,
};

const MINERAL_SPIRITS: Ingredient = {
  materialId: "min-spirits",
  name: "Mineral Spirits",
  category: "solvent",
  amount: 100,
  density: 0.77,
  solidsByWeight: 0,
  solidsByVolume: 0,
  isVolatile: true,
  vocContent: 770,
  isPigment: false,
  costPerKg: 0.9,
};

// ── Tests ───────────────────────────────────────────────────────────

describe("calculateFormula", () => {
  it("throws on empty ingredients", () => {
    expect(() => calculateFormula({ ingredients: [] })).toThrow(
      "at least one ingredient"
    );
  });

  it("throws on zero density", () => {
    expect(() =>
      calculateFormula({
        ingredients: [makeIngredient({ density: 0 })],
      })
    ).toThrow("Density must be positive");
  });

  it("calculates density correctly for a single material", () => {
    const result = calculateFormula({
      ingredients: [makeIngredient({ amount: 100, density: 2.5 })],
    });
    // 100g / (100/2.5 mL) = 2.5 g/mL
    expect(result.density).toBeCloseTo(2.5, 3);
    expect(result.totalWeight).toBe(100);
    expect(result.totalVolume).toBeCloseTo(40, 3);
  });

  it("calculates density for a mixture", () => {
    // 200g TiO2 (4.1 g/mL) + 300g water (1.0 g/mL)
    // totalW = 500g, totalV = 200/4.1 + 300/1.0 = 48.78 + 300 = 348.78 mL
    // density = 500 / 348.78 ≈ 1.4337
    const result = calculateFormula({
      ingredients: [TIO2, WATER],
    });
    expect(result.totalWeight).toBe(500);
    expect(result.density).toBeCloseTo(1.4337, 2);
  });

  it("calculates PVC correctly", () => {
    // TiO2: 200g / 4.1 = 48.78 mL pigment volume (100% solids by vol)
    // Latex: 300g / 1.05 = 285.71 mL, solids by vol = 0.46 → 131.43 mL binder solids
    // PVC = 48.78 / (48.78 + 131.43) = 48.78 / 180.21 ≈ 0.2707
    const result = calculateFormula({
      ingredients: [TIO2, ACRYLIC_LATEX, WATER],
    });
    expect(result.pvc).toBeCloseTo(0.2707, 2);
  });

  it("returns PVC = 0 when no pigments or binders", () => {
    const result = calculateFormula({ ingredients: [WATER] });
    expect(result.pvc).toBe(0);
  });

  it("calculates solids by weight and volume", () => {
    // TiO2: 200g solids wt / 800g total = 0.25
    // Latex: 150g solids wt; Water: 0g
    // Total solids wt = 200 + 150 = 350, total wt = 800
    // solidsByWeight = 350/800 = 0.4375
    const result = calculateFormula({
      ingredients: [TIO2, ACRYLIC_LATEX, WATER],
    });
    expect(result.solidsByWeight).toBeCloseTo(0.4375, 3);
    expect(result.solidsByVolume).toBeGreaterThan(0);
    expect(result.solidsByVolume).toBeLessThan(1);
  });

  it("calculates VOC for solvent-based formula", () => {
    // Mineral spirits: 100g, density 0.77 → volume = 129.87 mL
    // vocContent = 770 g/L → vocWeight = 770 * 0.12987 = 100.0 g
    // Total vol = 200/4.1 + 129.87 = 48.78 + 129.87 = 178.65 mL = 0.17865 L
    // VOC g/L = 100.0 / 0.17865 ≈ 559.8
    const result = calculateFormula({
      ingredients: [TIO2, MINERAL_SPIRITS],
    });
    expect(result.vocGramsPerLiter).toBeGreaterThan(0);
    expect(result.vocLbsPerGallon).toBeGreaterThan(0);
  });

  it("calculates zero VOC for water-based formula", () => {
    const result = calculateFormula({
      ingredients: [TIO2, ACRYLIC_LATEX, WATER],
    });
    expect(result.vocGramsPerLiter).toBe(0);
  });

  it("calculates yield at given DFT", () => {
    const result = calculateFormula({
      ingredients: [TIO2, ACRYLIC_LATEX, WATER],
      targetDftMils: 1.5,
    });
    expect(result.yieldSqFtPerGallon).toBeDefined();
    expect(result.yieldSqFtPerGallon!).toBeGreaterThan(0);
    // solidsByVolume * 1604.17 / 1.5
    const expected = result.solidsByVolume * 1604.17 / 1.5;
    expect(result.yieldSqFtPerGallon).toBeCloseTo(expected, 0);
  });

  it("omits yield when no DFT provided", () => {
    const result = calculateFormula({
      ingredients: [TIO2, WATER],
    });
    expect(result.yieldSqFtPerGallon).toBeUndefined();
  });

  it("calculates cost correctly", () => {
    // TiO2: (200/1000) * 3.5 = $0.70
    // Latex: (300/1000) * 2.1 = $0.63
    // Water: (300/1000) * 0.01 = $0.003
    // Total = $1.333
    const result = calculateFormula({
      ingredients: [TIO2, ACRYLIC_LATEX, WATER],
    });
    expect(result.totalBatchCost).toBeCloseTo(1.333, 2);
    expect(result.costPerKg).toBeCloseTo(1.333 / 0.8, 2); // 800g = 0.8 kg
  });

  it("returns per-ingredient breakdown", () => {
    const result = calculateFormula({
      ingredients: [TIO2, ACRYLIC_LATEX],
    });
    expect(result.ingredients).toHaveLength(2);

    const tio2Result = result.ingredients[0];
    expect(tio2Result.materialId).toBe("tio2");
    expect(tio2Result.weight).toBe(200);
    expect(tio2Result.volume).toBeCloseTo(200 / 4.1, 2);

    // Weight fractions sum to 1
    const wfSum = result.ingredients.reduce((s, i) => s + i.weightFraction, 0);
    expect(wfSum).toBeCloseTo(1.0, 6);

    // Volume fractions sum to 1
    const vfSum = result.ingredients.reduce((s, i) => s + i.volumeFraction, 0);
    expect(vfSum).toBeCloseTo(1.0, 6);
  });

  it("handles a realistic interior latex flat formula", () => {
    const result = calculateFormula({
      ingredients: [
        { ...WATER, amount: 200, materialId: "water-grind" },
        makeIngredient({ materialId: "disp", name: "Dispersant", category: "additive", amount: 8, density: 1.05, solidsByWeight: 0.25, solidsByVolume: 0.23, costPerKg: 8.5 }),
        makeIngredient({ materialId: "defoam", name: "Defoamer", category: "additive", amount: 3, density: 0.98, costPerKg: 12 }),
        TIO2,
        makeIngredient({ materialId: "caco3", name: "CaCO3", category: "filler", amount: 150, density: 2.71, isPigment: true, costPerKg: 0.25 }),
        ACRYLIC_LATEX,
        { ...WATER, amount: 100, materialId: "water-letdown" },
        makeIngredient({ materialId: "thick", name: "Thickener", category: "additive", amount: 5, density: 1.0, costPerKg: 6 }),
      ],
      targetDftMils: 1.5,
    });

    // Sanity checks for a typical interior flat
    expect(result.pvc).toBeGreaterThan(0.3);
    expect(result.pvc).toBeLessThan(0.7);
    expect(result.density).toBeGreaterThan(1.1);
    expect(result.density).toBeLessThan(1.6);
    expect(result.solidsByWeight).toBeGreaterThan(0.3);
    expect(result.solidsByWeight).toBeLessThan(0.7);
    expect(result.vocGramsPerLiter).toBe(0); // latex = zero VOC
    expect(result.yieldSqFtPerGallon!).toBeGreaterThan(100);
    expect(result.costPerKg).toBeGreaterThan(0);
  });
});

describe("estimateCPVC", () => {
  it("calculates CPVC for TiO2", () => {
    // TiO2: OA=21, density=4.1
    // CPVC = 1 / (1 + 21*4.1 / (93.5*0.93)) = 1 / (1 + 86.1/86.955) = 1 / 1.990 ≈ 0.503
    const cpvc = estimateCPVC(21, 4.1);
    expect(cpvc).toBeCloseTo(0.503, 2);
  });

  it("calculates CPVC for carbon black (high OA)", () => {
    // Carbon black: OA=120, density=1.8
    // CPVC should be much lower due to high oil absorption
    const cpvc = estimateCPVC(120, 1.8);
    expect(cpvc).toBeGreaterThan(0);
    expect(cpvc).toBeLessThan(0.35);
  });

  it("returns 0 for invalid inputs", () => {
    expect(estimateCPVC(0, 4.1)).toBe(0);
    expect(estimateCPVC(21, 0)).toBe(0);
    expect(estimateCPVC(-5, 4.1)).toBe(0);
  });
});

describe("lambdaRatio", () => {
  it("calculates ratio correctly", () => {
    expect(lambdaRatio(0.4, 0.5)).toBeCloseTo(0.8, 4);
  });

  it("returns > 1 when PVC > CPVC (above CPVC)", () => {
    expect(lambdaRatio(0.6, 0.5)).toBeGreaterThan(1);
  });

  it("returns 0 when CPVC is 0", () => {
    expect(lambdaRatio(0.4, 0)).toBe(0);
  });
});
