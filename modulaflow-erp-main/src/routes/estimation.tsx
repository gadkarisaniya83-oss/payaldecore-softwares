import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/erp/AppShell";
import { workstationBom } from "@/lib/erp/data";
import {
  areaSqft,
  areaSqm,
  edgeBandRft,
  INR2,
  procurementQty,
  rft,
  round,
  ROUNDING,
  sellingPrice,
  sheetsRequired,
  toMm,
  type LengthUnit,
  type PricingMethod,
} from "@/lib/erp/units";

export const Route = createFileRoute("/estimation")({
  head: () => ({
    meta: [
      { title: "Estimation & BOQ Engine | Payal Decor ERP" },
      {
        name: "description",
        content:
          "Measurement-driven BOQ engine: mm-master unit conversion, sq.ft / RFT / sheet and edge-band calculation, wastage, costing and markup vs margin pricing.",
      },
      { property: "og:title", content: "Estimation & BOQ Engine | Payal Decor ERP" },
      {
        property: "og:description",
        content:
          "Convert site dimensions to mm and auto-generate BOQ quantities, material requirements and selling price.",
      },
    ],
  }),
  component: Estimation,
});

const UNITS: LengthUnit[] = ["mm", "cm", "inch", "ft", "m"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <header className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "tabular font-semibold" : "tabular"}>{value}</span>
    </div>
  );
}

function Estimation() {
  const [length, setLength] = useState(1200);
  const [width, setWidth] = useState(600);
  const [unit, setUnit] = useState<LengthUnit>("mm");
  const [qty, setQty] = useState(20);
  const [wastage, setWastage] = useState(8);
  const [edges, setEdges] = useState({ e1: true, e2: true, e3: true, e4: false });
  const [rate, setRate] = useState(1450);
  const [cost, setCost] = useState(980);
  const [method, setMethod] = useState<PricingMethod>("markup");
  const [percent, setPercent] = useState(25);

  const calc = useMemo(() => {
    const L = toMm(length, unit);
    const W = toMm(width, unit);
    const unitSqft = areaSqft(L, W);
    const baseSqft = unitSqft * qty;
    const procSqft = procurementQty(baseSqft, wastage);
    return {
      L,
      W,
      unitSqft,
      unitSqm: areaSqm(L, W),
      unitRft: rft(L),
      baseSqft,
      procSqft,
      sheets: sheetsRequired(procSqft, 8, 4),
      sheetsRaw: sheetsRequired(procSqft, 8, 4, false),
      edgeRft: edgeBandRft(L, W, edges) * qty,
      amount: baseSqft * rate,
      sell: sellingPrice(cost, percent, method),
    };
  }, [length, width, unit, qty, wastage, edges, rate, cost, percent, method]);

  return (
    <AppShell title="Estimation & BOQ">
      <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
        Every dimension is stored internally in millimetres. Enter site measurements in any unit —
        the engine derives sq.ft, sq.m, RFT, sheet counts, edge banding and costing from the same
        master value.
      </p>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Panel Input">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Length">
              <input
                type="number"
                className={inputCls}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
              />
            </Field>
            <Field label="Width">
              <input
                type="number"
                className={inputCls}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
            </Field>
            <Field label="Entry Unit">
              <select
                className={inputCls}
                value={unit}
                onChange={(e) => setUnit(e.target.value as LengthUnit)}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantity (Nos)">
              <input
                type="number"
                className={inputCls}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
            </Field>
            <Field label="Wastage %">
              <input
                type="number"
                className={inputCls}
                value={wastage}
                onChange={(e) => setWastage(Number(e.target.value))}
              />
            </Field>
            <Field label="Rate / Sq.Ft">
              <input
                type="number"
                className={inputCls}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
              />
            </Field>
          </div>

          <p className="mb-2 mt-4 text-xs font-medium text-muted-foreground">Edge banding</p>
          <div className="flex flex-wrap gap-3 text-sm">
            {(["e1", "e2", "e3", "e4"] as const).map((k, i) => (
              <label key={k} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5">
                <input
                  type="checkbox"
                  checked={edges[k]}
                  onChange={(e) => setEdges((p) => ({ ...p, [k]: e.target.checked }))}
                />
                Edge {i + 1}
              </label>
            ))}
          </div>
        </Panel>

        <Panel title="Derived Quantities">
          <Row label="Length (master)" value={`${round(calc.L, ROUNDING.measurement)} mm`} />
          <Row label="Width (master)" value={`${round(calc.W, ROUNDING.measurement)} mm`} />
          <Row label="Area / unit" value={`${round(calc.unitSqft, ROUNDING.quantity)} sq.ft`} />
          <Row label="Area / unit (metric)" value={`${round(calc.unitSqm, ROUNDING.quantity)} sq.m`} />
          <Row label="RFT / unit" value={`${round(calc.unitRft, ROUNDING.quantity)} RFT`} />
          <Row label="Base requirement" value={`${round(calc.baseSqft, ROUNDING.quantity)} sq.ft`} />
          <Row
            label={`Wastage @ ${wastage}%`}
            value={`${round(calc.procSqft - calc.baseSqft, ROUNDING.quantity)} sq.ft`}
          />
          <Row
            label="Procurement qty"
            value={`${round(calc.procSqft, ROUNDING.quantity)} sq.ft`}
            strong
          />
          <Row
            label="Sheets (8ft × 4ft)"
            value={`${round(calc.sheetsRaw, ROUNDING.quantity)} → ${calc.sheets} sheets`}
            strong
          />
          <Row label="Edge band total" value={`${round(calc.edgeRft, ROUNDING.quantity)} RFT`} />
          <Row label="Line amount" value={INR2.format(calc.amount)} strong />
        </Panel>

        <Panel title="Costing — Markup vs Margin">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total cost / unit">
              <input
                type="number"
                className={inputCls}
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
              />
            </Field>
            <Field label="Percent">
              <input
                type="number"
                className={inputCls}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
              />
            </Field>
            <Field label="Pricing method">
              <select
                className={inputCls}
                value={method}
                onChange={(e) => setMethod(e.target.value as PricingMethod)}
              >
                <option value="markup">Markup (cost × 1+p)</option>
                <option value="margin">Margin (cost ÷ 1−p)</option>
              </select>
            </Field>
          </div>
          <div className="mt-4">
            <Row label="Selling price" value={INR2.format(calc.sell)} strong />
            <Row label="Profit / unit" value={INR2.format(calc.sell - cost)} />
            <Row
              label="Markup equivalent"
              value={`${round(((calc.sell - cost) / cost) * 100, 2)}%`}
            />
            <Row
              label="Margin equivalent"
              value={`${round(((calc.sell - cost) / calc.sell) * 100, 2)}%`}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            25% markup and 25% margin are not the same number — the engine keeps them separate.
          </p>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title={`BOM Explosion — 4-Seater Workstation × ${qty}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Component</th>
                <th className="pb-2 text-right font-medium">Qty / Unit</th>
                <th className="pb-2 text-right font-medium">Required</th>
                <th className="pb-2 text-right font-medium">With Wastage</th>
                <th className="pb-2 pl-4 font-medium">Unit</th>
              </tr>
            </thead>
            <tbody>
              {workstationBom.map((b) => (
                <tr key={b.component} className="border-b border-border last:border-0">
                  <td className="py-2">{b.component}</td>
                  <td className="tabular py-2 text-right">{b.qty}</td>
                  <td className="tabular py-2 text-right">{b.qty * qty}</td>
                  <td className="tabular py-2 text-right font-medium">
                    {Math.ceil(procurementQty(b.qty * qty, wastage))}
                  </td>
                  <td className="py-2 pl-4 text-muted-foreground">{b.unit}</td>
                </tr>
              ))}
              <tr>
                <td className="py-2">Edge Band</td>
                <td className="py-2 text-right text-muted-foreground">calculated</td>
                <td className="tabular py-2 text-right">{round(calc.edgeRft, 2)}</td>
                <td className="tabular py-2 text-right font-medium">
                  {round(procurementQty(calc.edgeRft, wastage), 2)}
                </td>
                <td className="py-2 pl-4 text-muted-foreground">RFT</td>
              </tr>
            </tbody>
          </table>
        </Panel>
      </div>
    </AppShell>
  );
}
