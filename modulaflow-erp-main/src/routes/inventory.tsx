import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/erp/AppShell";
import { NUM } from "@/lib/erp/units";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory & Material Shortage | Payal Decor ERP" },
      {
        name: "description",
        content:
          "Raw material and finished goods stock with opening, purchase, consumption, dispatch and closing balances plus automatic shortage-to-purchase requirements.",
      },
      { property: "og:title", content: "Inventory & Material Shortage | Payal Decor ERP" },
      {
        property: "og:description",
        content: "Live stock ledger and material reservation for approved sales orders.",
      },
    ],
  }),
  component: Inventory,
});

const STOCK = [
  {
    item: "18mm Pre-laminated Board",
    uom: "Sheets",
    opening: 180,
    purchase: 60,
    production: 0,
    consumption: 108,
    dispatch: 12,
    min: 150,
  },
  {
    item: "Edge Band 1mm (White)",
    uom: "RFT",
    opening: 400,
    purchase: 200,
    production: 0,
    consumption: 350,
    dispatch: 0,
    min: 200,
  },
  {
    item: "Hinges (Soft Close)",
    uom: "Nos",
    opening: 1200,
    purchase: 400,
    production: 0,
    consumption: 620,
    dispatch: 0,
    min: 500,
  },
  {
    item: "Modular Socket Box",
    uom: "Nos",
    opening: 150,
    purchase: 0,
    production: 0,
    consumption: 85,
    dispatch: 0,
    min: 100,
  },
  {
    item: "Fabric - Grey",
    uom: "Mtrs",
    opening: 90,
    purchase: 20,
    production: 0,
    consumption: 75,
    dispatch: 0,
    min: 30,
  },
];

const SHORTAGE = [
  { material: "MDF 18mm", required: 800, available: 620, uom: "sq.ft" },
  { material: "Laminate 1mm", required: 460, available: 460, uom: "sq.ft" },
  { material: "Modular Socket Box", required: 96, available: 65, uom: "Nos" },
];

function Inventory() {
  return (
    <AppShell title="Inventory">
      <section className="overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <header className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Raw Material Stock Ledger</h2>
        </header>
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-5 py-3 font-medium">Material</th>
              <th className="px-3 py-3 font-medium">UOM</th>
              <th className="px-3 py-3 text-right font-medium">Opening</th>
              <th className="px-3 py-3 text-right font-medium">Purchase</th>
              <th className="px-3 py-3 text-right font-medium">Consumption</th>
              <th className="px-3 py-3 text-right font-medium">Dispatch</th>
              <th className="px-3 py-3 text-right font-medium">Closing</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {STOCK.map((s) => {
              const closing = s.opening + s.purchase + s.production - s.consumption - s.dispatch;
              const low = closing < s.min;
              return (
                <tr key={s.item} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">{s.item}</td>
                  <td className="px-3 py-3 text-muted-foreground">{s.uom}</td>
                  <td className="tabular px-3 py-3 text-right">{NUM.format(s.opening)}</td>
                  <td className="tabular px-3 py-3 text-right">{NUM.format(s.purchase)}</td>
                  <td className="tabular px-3 py-3 text-right">{NUM.format(s.consumption)}</td>
                  <td className="tabular px-3 py-3 text-right">{NUM.format(s.dispatch)}</td>
                  <td className="tabular px-3 py-3 text-right font-semibold">
                    {NUM.format(closing)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs font-medium",
                        low ? "bg-destructive/10 text-destructive" : "bg-success/15 text-success",
                      )}
                    >
                      {low ? "Low Stock" : "In Stock"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="mt-4 rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <header className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Material Reservation & Shortage</h2>
        </header>
        <div className="p-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Material</th>
                <th className="pb-2 text-right font-medium">Required</th>
                <th className="pb-2 text-right font-medium">Available</th>
                <th className="pb-2 text-right font-medium">Shortage</th>
                <th className="pb-2 pl-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {SHORTAGE.map((s) => {
                const short = Math.max(0, s.required - s.available);
                return (
                  <tr key={s.material} className="border-b border-border last:border-0">
                    <td className="py-2.5">{s.material}</td>
                    <td className="tabular py-2.5 text-right">
                      {NUM.format(s.required)} {s.uom}
                    </td>
                    <td className="tabular py-2.5 text-right">
                      {NUM.format(s.available)} {s.uom}
                    </td>
                    <td
                      className={cn(
                        "tabular py-2.5 text-right font-semibold",
                        short ? "text-destructive" : "text-success",
                      )}
                    >
                      {NUM.format(short)} {s.uom}
                    </td>
                    <td className="py-2.5 pl-4 text-xs text-muted-foreground">
                      {short ? "Purchase requirement raised" : "Fully reserved"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
