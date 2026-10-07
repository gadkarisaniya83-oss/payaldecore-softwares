import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/erp/AppShell";
import { productionStages } from "@/lib/erp/data";
import { documentNumber } from "@/lib/erp/units";

export const Route = createFileRoute("/production")({
  head: () => ({
    meta: [
      { title: "Production & Work Orders | Payal Decor ERP" },
      {
        name: "description",
        content:
          "Track modular furniture work orders across cutting, edge banding, CNC, assembly, finishing, QC and ready-for-dispatch stages.",
      },
      { property: "og:title", content: "Production & Work Orders | Payal Decor ERP" },
      {
        property: "og:description",
        content: "Stage-wise production tracking with quantities, rejections and deadlines.",
      },
    ],
  }),
  component: Production,
});

const WORK_ORDERS = [
  {
    no: documentNumber("WO", 26, 12),
    product: "4-Seater Linear Workstation",
    qty: 20,
    stage: "Assembly",
    dept: "Assembly Line 2",
    due: "12 Jun 2025",
  },
  {
    no: documentNumber("WO", 26, 13),
    product: "Mobile Pedestal 3-Drawer",
    qty: 40,
    stage: "Edge Banding",
    dept: "Panel Shop",
    due: "14 Jun 2025",
  },
  {
    no: documentNumber("WO", 26, 14),
    product: "Conference Table 3000×1200",
    qty: 3,
    stage: "CNC",
    dept: "CNC Cell",
    due: "16 Jun 2025",
  },
  {
    no: documentNumber("WO", 26, 15),
    product: "Acoustic Partition 1200mm",
    qty: 26,
    stage: "Cutting",
    dept: "Panel Shop",
    due: "18 Jun 2025",
  },
  {
    no: documentNumber("WO", 26, 16),
    product: "Reception Counter",
    qty: 1,
    stage: "QC",
    dept: "Finishing",
    due: "10 Jun 2025",
  },
];

function Production() {
  const total = productionStages.reduce((s, p) => s + p.count, 0);

  return (
    <AppShell title="Production">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {productionStages.map((s) => (
          <article
            key={s.stage}
            className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
          >
            <p className="text-xs text-muted-foreground">{s.stage}</p>
            <p className="tabular mt-1 text-2xl font-semibold">{s.count}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(s.count / total) * 100}%` }}
              />
            </div>
          </article>
        ))}
      </div>

      <section className="mt-4 overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <header className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Open Work Orders</h2>
        </header>
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-5 py-3 font-medium">Work Order</th>
              <th className="px-3 py-3 font-medium">Product</th>
              <th className="px-3 py-3 text-right font-medium">Qty</th>
              <th className="px-3 py-3 font-medium">Current Stage</th>
              <th className="px-3 py-3 font-medium">Department</th>
              <th className="px-5 py-3 font-medium">Deadline</th>
            </tr>
          </thead>
          <tbody>
            {WORK_ORDERS.map((w) => (
              <tr key={w.no} className="border-b border-border last:border-0">
                <td className="px-5 py-3 font-medium">{w.no}</td>
                <td className="px-3 py-3">{w.product}</td>
                <td className="tabular px-3 py-3 text-right">{w.qty}</td>
                <td className="px-3 py-3">
                  <span className="rounded-md bg-info/15 px-2 py-0.5 text-xs font-medium text-info">
                    {w.stage}
                  </span>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{w.dept}</td>
                <td className="px-5 py-3 text-muted-foreground">{w.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
