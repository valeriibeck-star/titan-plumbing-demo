import { Router, type Request, type Response } from "express";
import pool from "../../config/database.js";

export const formulasRouter = Router();

/** GET /api/formulas — list all formulas */
formulasRouter.get("/", async (_req: Request, res: Response) => {
  const { rows } = await pool.query(
    `SELECT id, name, code, version, status, description,
            calc_pvc, calc_density, calc_voc, calc_cost_per_liter,
            batch_size_kg, created_at, updated_at
     FROM formulas
     ORDER BY updated_at DESC`
  );
  res.json(rows);
});

/** GET /api/formulas/:id — formula with ingredients */
formulasRouter.get("/:id", async (req: Request, res: Response) => {
  const formulaRes = await pool.query(
    "SELECT * FROM formulas WHERE id = $1",
    [req.params.id]
  );
  if (formulaRes.rows.length === 0) {
    res.status(404).json({ error: "Formula not found" });
    return;
  }

  const ingredientsRes = await pool.query(
    `SELECT fi.*, rm.name AS material_name, rm.code AS material_code,
            rm.category, rm.density, rm.solids_by_weight, rm.solids_by_volume,
            rm.is_volatile, rm.voc_content, rm.is_pigment, rm.cost_per_kg
     FROM formula_ingredients fi
     JOIN raw_materials rm ON rm.id = fi.material_id
     WHERE fi.formula_id = $1
     ORDER BY fi.sort_order`,
    [req.params.id]
  );

  res.json({
    ...formulaRes.rows[0],
    ingredients: ingredientsRes.rows,
  });
});
