export interface Kpi {
  label: string;
  value: string;
  delta: number;
  compare: string;
  icon: "sales" | "orders" | "quotations" | "invoices" | "outstanding" | "margin";
  tone: "primary" | "info" | "success" | "warning" | "accent" | "chart";
}

export const kpis: Kpi[] = [
  {
    label: "Total Sales",
    value: "₹ 1,24,80,350",
    delta: 18.6,
    compare: "vs Apr 2025",
    icon: "sales",
    tone: "primary",
  },
  {
    label: "Total Orders",
    value: "28",
    delta: 12.5,
    compare: "vs Apr 2025",
    icon: "orders",
    tone: "info",
  },
  {
    label: "Total Quotations",
    value: "45",
    delta: 15.2,
    compare: "vs Apr 2025",
    icon: "quotations",
    tone: "chart",
  },
  {
    label: "Total Invoices",
    value: "32",
    delta: 10.8,
    compare: "vs Apr 2025",
    icon: "invoices",
    tone: "warning",
  },
  {
    label: "Outstanding",
    value: "₹ 32,45,670",
    delta: -8.3,
    compare: "vs Apr 2025",
    icon: "outstanding",
    tone: "accent",
  },
  {
    label: "Profit Margin",
    value: "24.6%",
    delta: 3.6,
    compare: "vs Apr 2025",
    icon: "margin",
    tone: "success",
  },
];

export const salesTrend = [
  { month: "Dec 2024", sales: 68, profit: 15 },
  { month: "Jan 2025", sales: 84, profit: 19 },
  { month: "Feb 2025", sales: 121, profit: 32 },
  { month: "Mar 2025", sales: 92, profit: 26 },
  { month: "Apr 2025", sales: 107, profit: 33 },
  { month: "May 2025", sales: 128, profit: 41 },
];

export const salesByCategory = [
  { name: "Workstations", value: 42.5 },
  { name: "Benching", value: 18.7 },
  { name: "Storage", value: 12.4 },
  { name: "Partitions", value: 10.3 },
  { name: "Tables", value: 8.6 },
  { name: "Other Accessories", value: 7.5 },
];

export const activities = [
  {
    title: "New Quotation created",
    detail: "QT-25-26-0045 for Skyline Corp",
    time: "2 mins ago",
    kind: "quotation" as const,
  },
  {
    title: "Work Order WO-25-26-0012",
    detail: "status updated to In Production",
    time: "15 mins ago",
    kind: "production" as const,
  },
  {
    title: "Invoice INV-25-26-0031",
    detail: "generated for Urban Spaces",
    time: "1 hour ago",
    kind: "invoice" as const,
  },
  {
    title: "Payment of ₹ 2,45,000 received",
    detail: "from Design Hub Pvt. Ltd.",
    time: "2 hours ago",
    kind: "payment" as const,
  },
  {
    title: "Material Low Stock Alert",
    detail: "18mm Pre-laminated Board",
    time: "3 hours ago",
    kind: "alert" as const,
  },
];

export const topProjects = [
  {
    name: "Corporate Office - Mumbai",
    customer: "TechNova Pvt. Ltd.",
    status: "In Progress" as const,
    progress: 75,
    value: 3245000,
  },
  {
    name: "IT Park - Bengaluru",
    customer: "Skyline Developers",
    status: "In Progress" as const,
    progress: 60,
    value: 2875000,
  },
  {
    name: "Head Office - Pune",
    customer: "Design Hub Pvt. Ltd.",
    status: "Completed" as const,
    progress: 100,
    value: 2210000,
  },
  {
    name: "Factory - Chakan",
    customer: "AutoMech Industries",
    status: "In Progress" as const,
    progress: 40,
    value: 1890000,
  },
  {
    name: "Co-working Space - Delhi",
    customer: "Urban Spaces",
    status: "Pending" as const,
    progress: 20,
    value: 1560000,
  },
];

export const inventorySummary = [
  { item: "18mm Pre-laminated Board", qty: "120 Sheets", status: "Low Stock" as const },
  { item: "Edge Band 1mm (White)", qty: "250 RFT", status: "In Stock" as const },
  { item: "Hinges (Soft Close)", qty: "980 Nos.", status: "In Stock" as const },
  { item: "Modular Socket Box", qty: "65 Nos.", status: "Low Stock" as const },
  { item: "Fabric - Grey", qty: "35 Mtrs", status: "In Stock" as const },
];

export const outstandingInvoices = [
  {
    no: "INV-25-26-0028",
    customer: "Skyline Developers",
    due: "05 Jun 2025",
    amount: 475000,
  },
  { no: "INV-25-26-0030", customer: "TechNova Pvt. Ltd.", due: "08 Jun 2025", amount: 680000 },
  { no: "INV-25-26-0029", customer: "Urban Spaces", due: "10 Jun 2025", amount: 345000 },
  { no: "INV-25-26-0025", customer: "Design Hub Pvt. Ltd.", due: "12 Jun 2025", amount: 295000 },
  { no: "INV-25-26-0022", customer: "Creative Solutions", due: "15 Jun 2025", amount: 520000 },
];

export const productionStages = [
  { stage: "Pending", count: 6 },
  { stage: "Cutting", count: 4 },
  { stage: "Edge Banding", count: 3 },
  { stage: "CNC", count: 2 },
  { stage: "Assembly", count: 5 },
  { stage: "Finishing", count: 3 },
  { stage: "QC", count: 2 },
  { stage: "Ready", count: 7 },
];

/** BOM for a 4-seater workstation, exploded per order quantity. */
export const workstationBom = [
  { component: "Worktop", qty: 4, unit: "Nos" },
  { component: "Modesty Panel", qty: 4, unit: "Nos" },
  { component: "Side Panel", qty: 8, unit: "Nos" },
  { component: "Partition", qty: 4, unit: "Nos" },
  { component: "Cable Tray", qty: 4, unit: "Nos" },
  { component: "Grommet", qty: 4, unit: "Nos" },
  { component: "Hardware", qty: 1, unit: "Set" },
  { component: "Electrical Module", qty: 4, unit: "Nos" },
];
