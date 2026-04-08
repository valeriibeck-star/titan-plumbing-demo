import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { physicsRouter } from "./modules/physics-engine/routes.js";
import { formulasRouter } from "./modules/formulas/routes.js";
import { materialsRouter } from "./modules/materials/routes.js";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "kompozit-erp" });
});

// Module routes
app.use("/api/physics", physicsRouter);
app.use("/api/formulas", formulasRouter);
app.use("/api/materials", materialsRouter);

app.use(errorHandler);

export default app;
