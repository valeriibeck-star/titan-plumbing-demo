import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { calculateFormula, estimateCPVC, lambdaRatio } from "./calculator.js";
import type { Ingredient } from "./types.js";

export const physicsRouter = Router();

const ingredientSchema = z.object({
  materialId: z.string(),
  name: z.string(),
  category: z.enum(["pigment", "binder", "solvent", "additive", "filler", "thinner"]),
  amount: z.number().positive(),
  density: z.number().positive(),
  solidsByWeight: z.number().min(0).max(1),
  solidsByVolume: z.number().min(0).max(1),
  isVolatile: z.boolean(),
  vocContent: z.number().min(0),
  isPigment: z.boolean(),
  costPerKg: z.number().min(0),
});

const calculateSchema = z.object({
  ingredients: z.array(ingredientSchema).min(1),
  batchSizeKg: z.number().positive().optional(),
  targetDftMils: z.number().positive().optional(),
});

/**
 * POST /api/physics/calculate
 * Full formula calculation — PVC, density, VOC, yield, cost
 */
physicsRouter.post("/calculate", (req: Request, res: Response) => {
  const parsed = calculateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const result = calculateFormula(parsed.data);
  res.json(result);
});

const cpvcSchema = z.object({
  oilAbsorption: z.number().positive(),
  pigmentDensity: z.number().positive(),
  oilDensity: z.number().positive().optional(),
});

/**
 * POST /api/physics/cpvc
 * Estimate Critical PVC from oil absorption
 */
physicsRouter.post("/cpvc", (req: Request, res: Response) => {
  const parsed = cpvcSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { oilAbsorption, pigmentDensity, oilDensity } = parsed.data;
  const cpvc = estimateCPVC(oilAbsorption, pigmentDensity, oilDensity);
  res.json({ cpvc });
});

const lambdaSchema = z.object({
  pvc: z.number().min(0).max(1),
  cpvc: z.number().min(0).max(1),
});

/**
 * POST /api/physics/lambda
 * PVC / CPVC ratio
 */
physicsRouter.post("/lambda", (req: Request, res: Response) => {
  const parsed = lambdaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const ratio = lambdaRatio(parsed.data.pvc, parsed.data.cpvc);
  res.json({
    lambda: ratio,
    status:
      ratio < 1 ? "below_cpvc" : ratio === 1 ? "at_cpvc" : "above_cpvc",
  });
});
