import { Router, type Request, type Response } from "express";
import pool from "../../config/database.js";

export const materialsRouter = Router();

/** GET /api/materials — list all active raw materials */
materialsRouter.get("/", async (_req: Request, res: Response) => {
  const { rows } = await pool.query(
    `SELECT id, name, code, category, density, solids_by_weight, solids_by_volume,
            is_volatile, voc_content, is_pigment, oil_absorption, cost_per_kg,
            stock_qty, stock_unit, is_active
     FROM raw_materials
     WHERE is_active = true
     ORDER BY category, name`
  );
  res.json(rows);
});

/** GET /api/materials/:id */
materialsRouter.get("/:id", async (req: Request, res: Response) => {
  const { rows } = await pool.query(
    "SELECT * FROM raw_materials WHERE id = $1",
    [req.params.id]
  );
  if (rows.length === 0) {
    res.status(404).json({ error: "Material not found" });
    return;
  }
  res.json(rows[0]);
});
