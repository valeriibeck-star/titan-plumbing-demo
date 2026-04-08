import { useState } from "react";
import { apiFetch } from "../lib/api";

interface IngredientRow {
  name: string;
  category: string;
  amount: number;
  density: number;
  solidsByWeight: number;
  solidsByVolume: number;
  isVolatile: boolean;
  vocContent: number;
  isPigment: boolean;
  costPerKg: number;
}

interface CalcResult {
  density: number;
  pvc: number;
  solidsByWeight: number;
  solidsByVolume: number;
  vocGramsPerLiter: number;
  vocLbsPerGallon: number;
  yieldSqFtPerGallon?: number;
  costPerKg: number;
  costPerLiter: number;
  costPerGallon: number;
  totalBatchCost: number;
  totalWeight: number;
  totalVolume: number;
}

const EMPTY_ROW: IngredientRow = {
  name: "",
  category: "pigment",
  amount: 0,
  density: 1,
  solidsByWeight: 1,
  solidsByVolume: 1,
  isVolatile: false,
  vocContent: 0,
  isPigment: false,
  costPerKg: 0,
};

// Preset: a simple interior latex flat paint
const PRESET_ROWS: IngredientRow[] = [
  { name: "Water (grind)", category: "solvent", amount: 200, density: 1.0, solidsByWeight: 0, solidsByVolume: 0, isVolatile: true, vocContent: 0, isPigment: false, costPerKg: 0.01 },
  { name: "Dispersant", category: "additive", amount: 8, density: 1.05, solidsByWeight: 0.25, solidsByVolume: 0.23, isVolatile: false, vocContent: 0, isPigment: false, costPerKg: 8.5 },
  { name: "Defoamer", category: "additive", amount: 3, density: 0.98, solidsByWeight: 1, solidsByVolume: 1, isVolatile: false, vocContent: 0, isPigment: false, costPerKg: 12 },
  { name: "TiO2", category: "pigment", amount: 200, density: 4.1, solidsByWeight: 1, solidsByVolume: 1, isVolatile: false, vocContent: 0, isPigment: true, costPerKg: 3.5 },
  { name: "CaCO3 Filler", category: "filler", amount: 150, density: 2.71, solidsByWeight: 1, solidsByVolume: 1, isVolatile: false, vocContent: 0, isPigment: true, costPerKg: 0.25 },
  { name: "Acrylic Latex", category: "binder", amount: 300, density: 1.05, solidsByWeight: 0.5, solidsByVolume: 0.46, isVolatile: false, vocContent: 0, isPigment: false, costPerKg: 2.1 },
  { name: "Water (letdown)", category: "solvent", amount: 100, density: 1.0, solidsByWeight: 0, solidsByVolume: 0, isVolatile: true, vocContent: 0, isPigment: false, costPerKg: 0.01 },
  { name: "Thickener", category: "additive", amount: 5, density: 1.0, solidsByWeight: 1, solidsByVolume: 1, isVolatile: false, vocContent: 0, isPigment: false, costPerKg: 6 },
];

export default function PhysicsCalculator() {
  const [rows, setRows] = useState<IngredientRow[]>(PRESET_ROWS);
  const [dft, setDft] = useState(1.5);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function calculate() {
    setError("");
    setLoading(true);
    try {
      const ingredients = rows
        .filter((r) => r.amount > 0)
        .map((r, i) => ({
          materialId: `row-${i}`,
          ...r,
        }));

      const res = await apiFetch<CalcResult>("/physics/calculate", {
        method: "POST",
        body: JSON.stringify({ ingredients, targetDftMils: dft }),
      });
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function addRow() {
    setRows([...rows, { ...EMPTY_ROW }]);
  }

  function updateRow(i: number, patch: Partial<IngredientRow>) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function removeRow(i: number) {
    setRows(rows.filter((_, idx) => idx !== i));
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    padding: "1.25rem",
    marginBottom: "1rem",
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: 4,
    color: "var(--color-text)",
    padding: "0.35rem 0.5rem",
    fontSize: "0.8rem",
    width: "100%",
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      <h2 style={{ fontSize: "1.4rem", marginBottom: "0.25rem" }}>
        Physics Engine
      </h2>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
        PVC, density, VOC, yield, and cost calculations for paint formulas
      </p>

      {/* Ingredient Table */}
      <div style={{ ...cardStyle, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              {["Name", "Category", "Amount (g)", "Density", "Solids wt%", "Solids vol%", "VOC g/L", "Pigment?", "$/kg", ""].map(
                (h) => (
                  <th key={h} style={{ padding: "0.5rem 0.35rem", textAlign: "left", color: "var(--color-text-muted)", fontWeight: 500 }}>
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "0.35rem" }}>
                  <input style={inputStyle} value={row.name} onChange={(e) => updateRow(i, { name: e.target.value })} />
                </td>
                <td style={{ padding: "0.35rem" }}>
                  <select
                    style={inputStyle}
                    value={row.category}
                    onChange={(e) => updateRow(i, { category: e.target.value })}
                  >
                    {["pigment", "binder", "solvent", "additive", "filler", "thinner"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: "0.35rem" }}>
                  <input style={inputStyle} type="number" value={row.amount} onChange={(e) => updateRow(i, { amount: +e.target.value })} />
                </td>
                <td style={{ padding: "0.35rem" }}>
                  <input style={inputStyle} type="number" step="0.01" value={row.density} onChange={(e) => updateRow(i, { density: +e.target.value })} />
                </td>
                <td style={{ padding: "0.35rem" }}>
                  <input style={inputStyle} type="number" step="0.01" value={row.solidsByWeight} onChange={(e) => updateRow(i, { solidsByWeight: +e.target.value })} />
                </td>
                <td style={{ padding: "0.35rem" }}>
                  <input style={inputStyle} type="number" step="0.01" value={row.solidsByVolume} onChange={(e) => updateRow(i, { solidsByVolume: +e.target.value })} />
                </td>
                <td style={{ padding: "0.35rem" }}>
                  <input style={inputStyle} type="number" value={row.vocContent} onChange={(e) => updateRow(i, { vocContent: +e.target.value })} />
                </td>
                <td style={{ padding: "0.35rem", textAlign: "center" }}>
                  <input type="checkbox" checked={row.isPigment} onChange={(e) => updateRow(i, { isPigment: e.target.checked })} />
                </td>
                <td style={{ padding: "0.35rem" }}>
                  <input style={inputStyle} type="number" step="0.01" value={row.costPerKg} onChange={(e) => updateRow(i, { costPerKg: +e.target.value })} />
                </td>
                <td style={{ padding: "0.35rem" }}>
                  <button
                    onClick={() => removeRow(i)}
                    style={{ background: "none", border: "none", color: "var(--color-danger)", fontSize: "1rem" }}
                  >
                    x
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", alignItems: "center" }}>
          <button
            onClick={addRow}
            style={{
              background: "var(--color-border)",
              color: "var(--color-text)",
              border: "none",
              borderRadius: 4,
              padding: "0.4rem 0.75rem",
              fontSize: "0.8rem",
            }}
          >
            + Add Row
          </button>

          <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Target DFT (mils):
            <input
              type="number"
              step="0.1"
              value={dft}
              onChange={(e) => setDft(+e.target.value)}
              style={{ ...inputStyle, width: 70, marginLeft: 6 }}
            />
          </label>

          <button
            onClick={calculate}
            disabled={loading}
            style={{
              background: "var(--color-primary)",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "0.5rem 1.25rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginLeft: "auto",
            }}
          >
            {loading ? "Calculating..." : "Calculate"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ ...cardStyle, borderColor: "var(--color-danger)", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <ResultCard title="Physical Properties">
            <Stat label="Density" value={`${result.density.toFixed(3)} g/mL`} />
            <Stat label="PVC" value={`${(result.pvc * 100).toFixed(1)}%`} />
            <Stat label="Solids (wt)" value={`${(result.solidsByWeight * 100).toFixed(1)}%`} />
            <Stat label="Solids (vol)" value={`${(result.solidsByVolume * 100).toFixed(1)}%`} />
          </ResultCard>

          <ResultCard title="VOC & Yield">
            <Stat label="VOC" value={`${result.vocGramsPerLiter.toFixed(1)} g/L`} />
            <Stat label="VOC" value={`${result.vocLbsPerGallon.toFixed(2)} lbs/gal`} />
            {result.yieldSqFtPerGallon != null && (
              <Stat label="Yield" value={`${result.yieldSqFtPerGallon.toFixed(0)} ft²/gal`} />
            )}
          </ResultCard>

          <ResultCard title="Cost">
            <Stat label="Per kg" value={`$${result.costPerKg.toFixed(2)}`} />
            <Stat label="Per liter" value={`$${result.costPerLiter.toFixed(2)}`} />
            <Stat label="Per gallon" value={`$${result.costPerGallon.toFixed(2)}`} />
            <Stat label="Batch total" value={`$${result.totalBatchCost.toFixed(2)}`} />
          </ResultCard>
        </div>
      )}
    </div>
  );
}

function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        padding: "1rem",
      }}
    >
      <h3 style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
        {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
      <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
