import { createFileRoute } from "@tanstack/react-router";
import {
  ChartColumnIncreasing,
  FileSearch,
  FileText,
  ReceiptIndianRupee,
  IndianRupee,
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownRight,
  FolderPlus,
  Calculator,
  FilePlus2,
  ShoppingCart,
  ClipboardPlus,
  PackagePlus,
  UserPlus,
  TriangleAlert,
  Wallet,
  Factory,
  type LucideIcon,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/erp/AppShell";
import {
  activities,
  inventorySummary,
  kpis,
  outstandingInvoices,
  salesByCategory,
  salesTrend,
  topProjects,
  type Kpi,
} from "@/lib/erp/data";
import { INR, NUM } from "@/lib/erp/units";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Payal Decor Modular Furniture ERP" },
      {
        name: "description",
        content:
          "Real-time dashboard for measurement-driven modular furniture ERP: sales, quotations, production, inventory and GST invoicing at a glance.",
      },
      { property: "og:title", content: "Dashboard | Payal Decor Modular Furniture ERP" },
      {
        property: "og:description",
        content:
          "Track sales, BOQ, work orders, inventory and receivables across every modular furniture project.",
      },
    ],
  }),
  component: Dashboard,
});

const KPI_ICONS: Record<Kpi["icon"], LucideIcon> = {
  sales: ChartColumnIncreasing,
  orders: FileSearch,
  quotations: FileText,
  invoices: ReceiptIndianRupee,
  outstanding: IndianRupee,
  margin: PieIcon,
};

const TONE: Record<Kpi["tone"], string> = {
  primary: "bg-primary/10 text-primary",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  accent: "bg-accent/20 text-primary",
  chart: "bg-chart-6/20 text-chart-6",
};

const PIE_COLORS = [
  "var(--color-chart-4)",
  "var(--color-chart-1)",
  "var(--color-chart-5)",
  "var(--color-chart-2)",
  "var(--color-warning)",
  "var(--color-success)",
];

function Panel({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn("rounded-xl border border-border bg-card shadow-[var(--shadow-card)]", className)}
    >
      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </header>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}

function ViewAll() {
  return <button className="text-xs font-medium text-primary hover:underline">View All</button>;
}

const QUICK_LINKS: { label: string; icon: LucideIcon }[] = [
  { label: "New Project", icon: FolderPlus },
  { label: "New BOQ", icon: Calculator },
  { label: "New Quotation", icon: FilePlus2 },
  { label: "New Sales Order", icon: ShoppingCart },
  { label: "New Invoice", icon: ReceiptIndianRupee },
  { label: "New Work Order", icon: ClipboardPlus },
  { label: "Add Material", icon: PackagePlus },
  { label: "Add Vendor", icon: UserPlus },
];

const ACTIVITY_ICON = {
  quotation: FileText,
  production: Factory,
  invoice: ReceiptIndianRupee,
  payment: Wallet,
  alert: TriangleAlert,
} as const;

function Dashboard() {
  return (
    <AppShell title="Dashboard">
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          01 May 2025 – 31 May 2025
        </div>
        <button className="rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
          Customize
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {kpis.map((k) => {
          const Icon = KPI_ICONS[k.icon];
          const up = k.delta >= 0;
          return (
            <article
              key={k.label}
              className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start gap-3">
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", TONE[k.tone])}>
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="tabular mt-1 truncate text-xl font-semibold">{k.value}</p>
                  <p
                    className={cn(
                      "mt-1 flex items-center gap-1 text-xs font-medium",
                      up ? "text-success" : "text-destructive",
                    )}
                  >
                    {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                    {Math.abs(k.delta)}%
                  </p>
                  <p className="text-[11px] text-muted-foreground">{k.compare}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel
          title="Sales & Profit Overview"
          className="xl:col-span-5"
          action={
            <span className="rounded-lg border border-border px-3 py-1.5 text-xs">Monthly</span>
          }
        >
          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrend} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-border)" }}
                />
                <YAxis
                  tickFormatter={(v: number) => `${v}L`}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v: number, n) => [`₹ ${v} Lakh`, n === "sales" ? "Sales" : "Profit"]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                />
                <Legend
                  formatter={(v) => (v === "sales" ? "Sales (₹)" : "Profit (₹)")}
                  iconType="plainline"
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Line
                  type="linear"
                  dataKey="sales"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="linear"
                  dataKey="profit"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Sales by Category" className="xl:col-span-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative h-[220px] w-[220px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByCategory}
                    dataKey="value"
                    innerRadius={62}
                    outerRadius={100}
                    paddingAngle={1}
                    stroke="var(--color-card)"
                  >
                    {salesByCategory.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => `${v}%`}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="tabular text-sm font-semibold">₹ 1,24,80,350</p>
                </div>
              </div>
            </div>
            <ul className="w-full space-y-2 text-sm">
              {salesByCategory.map((c, i) => (
                <li key={c.name} className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="flex-1 text-muted-foreground">{c.name}</span>
                  <span className="tabular font-medium">{c.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel title="Recent Activities" className="xl:col-span-3" action={<ViewAll />}>
          <ul className="space-y-3">
            {activities.map((a) => {
              const Icon = ACTIVITY_ICON[a.kind];
              return (
                <li key={a.title} className="flex gap-3 border-b border-border pb-3 last:border-0">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-md",
                      a.kind === "alert" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{a.time}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <Panel title="Quick Links" className="mt-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {QUICK_LINKS.map((q) => (
            <button
              key={q.label}
              className="flex flex-col items-center gap-2 rounded-lg border border-border px-3 py-4 text-xs transition-colors hover:border-primary hover:bg-muted"
            >
              <q.icon className="size-5 text-primary" />
              {q.label}
            </button>
          ))}
        </div>
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel title="Top Projects" className="xl:col-span-5" action={<ViewAll />}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Project Name</th>
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Progress</th>
                <th className="pb-2 text-right font-medium">Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              {topProjects.map((p) => (
                <tr key={p.name} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-2">{p.name}</td>
                  <td className="py-2.5 pr-2 text-muted-foreground">{p.customer}</td>
                  <td className="py-2.5 pr-2">
                    <StatusChip status={p.status} />
                  </td>
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="tabular text-xs">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="tabular py-2.5 text-right">{NUM.format(p.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Inventory Summary" className="xl:col-span-3" action={<ViewAll />}>
          <ul className="space-y-3 text-sm">
            {inventorySummary.map((i) => (
              <li key={i.item} className="flex items-center gap-3 border-b border-border pb-3 last:border-0">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
                  <PackagePlus className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate">{i.item}</span>
                <span className="tabular shrink-0 text-xs text-muted-foreground">{i.qty}</span>
                <span
                  className={cn(
                    "shrink-0 text-xs font-medium",
                    i.status === "Low Stock" ? "text-destructive" : "text-success",
                  )}
                >
                  {i.status}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Outstanding Invoices" className="xl:col-span-4" action={<ViewAll />}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Invoice No.</th>
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">Due Date</th>
                <th className="pb-2 text-right font-medium">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {outstandingInvoices.map((inv) => (
                <tr key={inv.no} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-2">{inv.no}</td>
                  <td className="py-2.5 pr-2 text-muted-foreground">{inv.customer}</td>
                  <td className="py-2.5 pr-2 text-muted-foreground">{inv.due}</td>
                  <td className="tabular py-2.5 text-right font-medium text-destructive">
                    {NUM.format(inv.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">
            Total receivable {INR.format(outstandingInvoices.reduce((s, i) => s + i.amount, 0))}
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}

function StatusChip({ status }: { status: "In Progress" | "Completed" | "Pending" }) {
  const tone =
    status === "Completed"
      ? "bg-success/15 text-success"
      : status === "Pending"
        ? "bg-warning/25 text-warning-foreground"
        : "bg-info/15 text-info";
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", tone)}>{status}</span>
  );
}
