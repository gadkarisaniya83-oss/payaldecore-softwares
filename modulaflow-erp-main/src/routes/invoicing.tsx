import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/erp/AppShell";
import { computeTaxLine, documentNumber, INR2, round } from "@/lib/erp/units";

export const Route = createFileRoute("/invoicing")({
  head: () => ({
    meta: [
      { title: "GST Invoice Engine | Payal Decor ERP" },
      {
        name: "description",
        content:
          "Line-level GST invoice engine: taxable value after item discount, CGST/SGST/IGST split, invoice-level charges, round-off and e-invoice readiness checks.",
      },
      { property: "og:title", content: "GST Invoice Engine | Payal Decor ERP" },
      {
        property: "og:description",
        content:
          "Configurable tax master driven invoicing with e-invoice validation mirrored before IRP submission.",
      },
    ],
  }),
  component: Invoicing,
});

interface Line {
  id: number;
  description: string;
  hsn: string;
  qty: number;
  uom: string;
  rate: number;
  discount: number;
  gstRate: number;
}

const INITIAL: Line[] = [
  {
    id: 1,
    description: "4-Seater Linear Workstation (1200×600mm)",
    hsn: "9403",
    qty: 20,
    uom: "NOS",
    rate: 42500,
    discount: 25000,
    gstRate: 18,
  },
  {
    id: 2,
    description: "Mobile Pedestal 3-Drawer",
    hsn: "9403",
    qty: 40,
    uom: "NOS",
    rate: 6800,
    discount: 0,
    gstRate: 18,
  },
  {
    id: 3,
    description: "Installation & Site Work",
    hsn: "9954",
    qty: 1,
    uom: "LOT",
    rate: 85000,
    discount: 0,
    gstRate: 18,
  },
];

const inputCls =
  "w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm outline-none focus:border-ring";

function Invoicing() {
  const [lines, setLines] = useState(INITIAL);
  const [interState, setInterState] = useState(false);
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [freight, setFreight] = useState(12000);
  const [advance, setAdvance] = useState(500000);

  const computed = useMemo(() => {
    const rows = lines.map((l) => ({
      line: l,
      tax: computeTaxLine({
        qty: l.qty,
        rate: l.rate,
        discountAmount: l.discount,
        gstRate: l.gstRate,
        interState,
      }),
    }));
    const taxable = rows.reduce((s, r) => s + r.tax.taxableValue, 0);
    const cgst = rows.reduce((s, r) => s + r.tax.cgst, 0);
    const sgst = rows.reduce((s, r) => s + r.tax.sgst, 0);
    const igst = rows.reduce((s, r) => s + r.tax.igst, 0);
    const beforeRound = taxable - invoiceDiscount + freight + cgst + sgst + igst;
    const grand = Math.round(beforeRound);
    return {
      rows,
      taxable,
      cgst,
      sgst,
      igst,
      roundOff: round(grand - beforeRound, 2),
      grand,
      balance: grand - advance,
    };
  }, [lines, interState, invoiceDiscount, freight, advance]);

  const update = (id: number, patch: Partial<Line>) =>
    setLines((p) => p.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <AppShell title="Invoicing">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Invoice number</p>
          <p className="text-lg font-semibold">{documentNumber("INV", 26, 1)}</p>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={interState}
            onChange={(e) => setInterState(e.target.checked)}
          />
          Inter-state supply (IGST)
        </label>
      </div>

      <section className="overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-2 py-3 font-medium">HSN/SAC</th>
              <th className="px-2 py-3 font-medium">Qty</th>
              <th className="px-2 py-3 font-medium">UOM</th>
              <th className="px-2 py-3 font-medium">Rate</th>
              <th className="px-2 py-3 font-medium">Discount</th>
              <th className="px-2 py-3 font-medium">GST %</th>
              <th className="px-2 py-3 text-right font-medium">Taxable</th>
              <th className="px-4 py-3 text-right font-medium">Tax</th>
            </tr>
          </thead>
          <tbody>
            {computed.rows.map(({ line, tax }) => (
              <tr key={line.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2">
                  <input
                    className={inputCls}
                    value={line.description}
                    onChange={(e) => update(line.id, { description: e.target.value })}
                  />
                </td>
                <td className="px-2 py-2 w-24">
                  <input
                    className={inputCls}
                    value={line.hsn}
                    onChange={(e) => update(line.id, { hsn: e.target.value })}
                  />
                </td>
                <td className="px-2 py-2 w-20">
                  <input
                    type="number"
                    className={inputCls}
                    value={line.qty}
                    onChange={(e) => update(line.id, { qty: Number(e.target.value) })}
                  />
                </td>
                <td className="px-2 py-2 text-muted-foreground">{line.uom}</td>
                <td className="px-2 py-2 w-28">
                  <input
                    type="number"
                    className={inputCls}
                    value={line.rate}
                    onChange={(e) => update(line.id, { rate: Number(e.target.value) })}
                  />
                </td>
                <td className="px-2 py-2 w-28">
                  <input
                    type="number"
                    className={inputCls}
                    value={line.discount}
                    onChange={(e) => update(line.id, { discount: Number(e.target.value) })}
                  />
                </td>
                <td className="px-2 py-2 w-20">
                  <input
                    type="number"
                    className={inputCls}
                    value={line.gstRate}
                    onChange={(e) => update(line.id, { gstRate: Number(e.target.value) })}
                  />
                </td>
                <td className="tabular px-2 py-2 text-right">{INR2.format(tax.taxableValue)}</td>
                <td className="tabular px-4 py-2 text-right">
                  {INR2.format(tax.cgst + tax.sgst + tax.igst)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 text-sm font-semibold">Invoice-level adjustments</h2>
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Invoice discount</span>
              <input
                type="number"
                className={inputCls}
                value={invoiceDiscount}
                onChange={(e) => setInvoiceDiscount(Number(e.target.value))}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Freight / other</span>
              <input
                type="number"
                className={inputCls}
                value={freight}
                onChange={(e) => setFreight(Number(e.target.value))}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Advance adjusted</span>
              <input
                type="number"
                className={inputCls}
                value={advance}
                onChange={(e) => setAdvance(Number(e.target.value))}
              />
            </label>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Item discounts reduce taxable value before tax; invoice-level discount, freight and
            round-off are kept as separate buckets so e-invoice validations reconcile.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 text-sm font-semibold">Summary</h2>
          <Row label="Total taxable value" value={INR2.format(computed.taxable)} />
          {interState ? (
            <Row label="IGST" value={INR2.format(computed.igst)} />
          ) : (
            <>
              <Row label="CGST" value={INR2.format(computed.cgst)} />
              <Row label="SGST" value={INR2.format(computed.sgst)} />
            </>
          )}
          <Row label="Invoice discount" value={`− ${INR2.format(invoiceDiscount)}`} />
          <Row label="Freight / other charges" value={INR2.format(freight)} />
          <Row label="Round off" value={INR2.format(computed.roundOff)} />
          <Row label="Grand total" value={INR2.format(computed.grand)} strong />
          <Row label="Advance adjusted" value={`− ${INR2.format(advance)}`} />
          <Row label="Balance due" value={INR2.format(computed.balance)} strong />
        </section>
      </div>
    </AppShell>
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
