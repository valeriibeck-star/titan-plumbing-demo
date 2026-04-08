import { useState } from "react";
import PhysicsCalculator from "./pages/PhysicsCalculator";

export default function App() {
  const [page] = useState<"physics" | "formulas" | "materials">("physics");

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <nav
        style={{
          width: 220,
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
          padding: "1.5rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            marginBottom: "1.5rem",
            color: "var(--color-primary)",
          }}
        >
          Kompozit ERP
        </h1>
        <NavItem label="Physics Engine" active={page === "physics"} />
        <NavItem label="Formulas" active={page === "formulas"} />
        <NavItem label="Materials" active={page === "materials"} />
      </nav>

      {/* Main */}
      <main style={{ flex: 1, padding: "2rem" }}>
        {page === "physics" && <PhysicsCalculator />}
      </main>
    </div>
  );
}

function NavItem({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      style={{
        padding: "0.5rem 0.75rem",
        borderRadius: 6,
        fontSize: "0.875rem",
        background: active ? "var(--color-primary)" : "transparent",
        color: active ? "#fff" : "var(--color-text-muted)",
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </div>
  );
}
