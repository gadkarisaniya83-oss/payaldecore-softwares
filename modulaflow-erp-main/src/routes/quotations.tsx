import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronRight, Clock3, FileText, Filter, MoreHorizontal, Plus, Search, Send, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/erp/AppShell";
import { Button } from "@/components/ui/button";
import { INR, documentNumber } from "@/lib/erp/units";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quotations")({ head: () => ({ meta: [
  { title: "Quotations & Approvals | Payal Decor ERP" },
  { name: "description", content: "Review, send, negotiate and approve measurement-driven modular furniture quotations linked to BOQ and projects." },
  { property: "og:title", content: "Quotations & Approvals | Payal Decor ERP" },
  { property: "og:description", content: "Move project quotations through review, negotiation, approval and rejection." },
] }), component: Quotations });

type QuoteStatus = "All" | "Draft" | "Internal Review" | "Sent" | "Negotiation" | "Approved" | "Rejected";
interface Quote { no: string; client: string; project: string; value: number; date: string; validity: string; status: Exclude<QuoteStatus, "All">; owner: string; }
const seed: Quote[] = [
 { no: documentNumber("QT", 26, 45), client: "Skyline Developers", project: "IT Park - Bengaluru", value: 2875000, date: "28 May 2025", validity: "27 Jun 2025", status: "Sent", owner: "Neha Kulkarni" },
 { no: documentNumber("QT", 26, 44), client: "TechNova Pvt. Ltd.", project: "Corporate Office - Mumbai", value: 3245000, date: "26 May 2025", validity: "25 Jun 2025", status: "Negotiation", owner: "Aarav Mehta" },
 { no: documentNumber("QT", 26, 43), client: "Design Hub Pvt. Ltd.", project: "Head Office - Pune", value: 2210000, date: "24 May 2025", validity: "23 Jun 2025", status: "Approved", owner: "Rohan Desai" },
 { no: documentNumber("QT", 26, 42), client: "Urban Spaces", project: "Co-working Space - Delhi", value: 1560000, date: "20 May 2025", validity: "19 Jun 2025", status: "Internal Review", owner: "Simran Kaur" },
 { no: documentNumber("QT", 26, 41), client: "Creative Solutions", project: "Studio Fitout - Noida", value: 980000, date: "18 May 2025", validity: "17 Jun 2025", status: "Draft", owner: "Rahul Pawar" },
];
const statuses: QuoteStatus[] = ["All", "Draft", "Internal Review", "Sent", "Negotiation", "Approved", "Rejected"];
function Quotations() {
 const [rows, setRows] = useState(seed); const [filter, setFilter] = useState<QuoteStatus>("All"); const [query, setQuery] = useState("");
 const shown = useMemo(() => rows.filter((q) => (filter === "All" || q.status === filter) && `${q.no} ${q.client} ${q.project}`.toLowerCase().includes(query.toLowerCase())), [filter, query, rows]);
 const advance = (no: string, next: Quote["status"]) => setRows((p) => p.map((q) => q.no === no ? { ...q, status: next } : q));
 return <AppShell title="Quotations"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-muted-foreground">Sales pipeline</p><h2 className="text-2xl font-semibold">Quotations</h2></div><Button><Plus /> New quotation</Button></div>
  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Total pipeline" value={INR.format(rows.reduce((s, q) => s + q.value, 0))} /><Metric label="Awaiting review" value={String(rows.filter(q => q.status === "Internal Review").length)} /><Metric label="In negotiation" value={String(rows.filter(q => q.status === "Negotiation").length)} /><Metric label="Approved this month" value={String(rows.filter(q => q.status === "Approved").length)} /></div>
  <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]"><div className="flex flex-wrap gap-2 border-b border-border p-4"><div className="flex min-w-60 flex-1 items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm"><Search className="size-4 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search quotation, client or project..." className="w-full bg-transparent outline-none" /></div><span className="grid place-items-center rounded-lg border border-border px-3 text-sm text-muted-foreground"><Filter className="mr-2 size-4" /> Status</span>{statuses.map(s => <button key={s} onClick={() => setFilter(s)} className={cn("rounded-lg border px-3 py-2 text-xs", filter === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted")}>{s}</button>)}</div>
   <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="px-5 py-3 font-medium">Quotation</th><th className="py-3 font-medium">Client / Project</th><th className="py-3 font-medium">Owner</th><th className="py-3 font-medium">Created</th><th className="py-3 text-right font-medium">Value</th><th className="py-3 font-medium">Status</th><th className="px-5 py-3" /></tr></thead><tbody>{shown.map(q => <tr key={q.no} className="border-b border-border last:border-0"><td className="px-5 py-3"><div className="flex items-center gap-2 font-medium"><span className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary"><FileText className="size-4" /></span>{q.no}</div><p className="ml-10 text-xs text-muted-foreground">Valid till {q.validity}</p></td><td className="py-3"><p>{q.client}</p><p className="text-xs text-muted-foreground">{q.project}</p></td><td className="py-3 text-muted-foreground">{q.owner}</td><td className="py-3 text-muted-foreground">{q.date}</td><td className="tabular py-3 text-right font-medium">{INR.format(q.value)}</td><td className="py-3"><QuoteChip status={q.status} /></td><td className="px-5 py-3 text-right">{q.status === "Internal Review" ? <div className="flex justify-end gap-1"><Button size="sm" variant="outline" onClick={() => advance(q.no, "Approved")}><Check /> Approve</Button><Button size="sm" variant="ghost" onClick={() => advance(q.no, "Rejected")}><X /></Button></div> : q.status === "Draft" ? <Button size="sm" variant="outline" onClick={() => advance(q.no, "Internal Review")}><Send /> Submit</Button> : <button className="rounded-md p-2 text-muted-foreground hover:bg-muted"><MoreHorizontal className="size-4" /></button>}</td></tr>)}</tbody></table></div></div>
 </AppShell>;
}
function Metric({ label, value }: { label: string; value: string }) { return <article className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"><p className="text-xs text-muted-foreground">{label}</p><p className="tabular mt-1 text-xl font-semibold">{value}</p></article>; }
function QuoteChip({ status }: { status: Quote["status"] }) { const Icon = status === "Approved" ? Check : status === "Rejected" ? X : status === "Sent" ? Send : status === "Negotiation" ? ChevronRight : status === "Internal Review" ? Clock3 : FileText; return <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium", status === "Approved" ? "bg-success/15 text-success" : status === "Rejected" ? "bg-destructive/10 text-destructive" : status === "Negotiation" ? "bg-warning/25 text-warning-foreground" : "bg-info/15 text-info")}><Icon className="size-3" />{status}</span>; }
