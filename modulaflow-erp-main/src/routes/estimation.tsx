import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  RefreshCw,
  Save,
  Search,
  RotateCcw,
  Eye,
} from "lucide-react";

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
  component: Estimation,
});

const API_BASE = (
  import.meta.env["VITE_API_URL"] || "http://localhost:5001/api"
).replace(/\/+$/, "");

const UNITS: LengthUnit[] = ["mm", "cm", "inch", "ft", "m"];

type EdgeKey = "e1" | "e2" | "e3" | "e4";

interface Customer {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  address?: string;
  location?: string;
}

interface Lead {
  id: number;
  customerId?: string | null;
  customerName?: string;
  companyName?: string;
  requirement?: string;
  status?: string;
}

interface SiteVisit {
  id: string;
  visitId: string;
  customerId?: string | null;
  leadEnquiryId?: number | null;
  customerName?: string;
  projectName?: string;
  siteAddress?: string;
  visitDate?: string;
  roomType?: string;
  furnitureType?: string;
  lengthMm?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
  unit?: string;
  status?: string;
}

interface EstimationRecord {
  id: string;
  estimationNumber: string;
  customerId?: string;
  leadEnquiryId?: number | null;
  siteMeasurementId?: string | null;
  projectName?: string | null;
  notes?: string | null;
  totalSellingPrice?: number | string;
  sellingPricePerUnit?: number | string;
  status?: string;
  createdAt?: string;
  customer?: Customer;
  leadEnquiry?: Lead;
  siteMeasurement?: SiteVisit;
}

interface ApiResponse {
  success?: boolean;
  message?: string;
  customers?: Customer[];
  leads?: Lead[];
  measurements?: SiteVisit[];
  estimations?: EstimationRecord[];
  data?: unknown;
}

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0 space-y-1 text-sm">
      <span className="block text-gray-600">{label}</span>
      {children}
    </label>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="border-b border-gray-200 px-4 py-3">
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-2 text-sm last:border-0">
      <span className="text-gray-500">{label}</span>
      <span
        className={`text-right tabular-nums ${
          strong ? "font-semibold text-gray-900" : "text-gray-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || `API request failed (${response.status})`,
    );
  }

  return data as T;
}

function unwrapList<T>(
  response: unknown,
  keys: string[],
): T[] {
  if (Array.isArray(response)) return response as T[];

  if (!response || typeof response !== "object") return [];

  const object = response as Record<string, unknown>;

  for (const key of keys) {
    if (Array.isArray(object[key])) return object[key] as T[];
  }

  if (object.data && typeof object.data === "object") {
    return unwrapList<T>(object.data, keys);
  }

  return [];
}

function money(value: unknown) {
  const amount = Number(value ?? 0);
  return INR2.format(Number.isFinite(amount) ? amount : 0);
}

function Estimation() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [estimations, setEstimations] = useState<EstimationRecord[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [siteVisitId, setSiteVisitId] = useState("");
  const [estimationNumber, setEstimationNumber] = useState(
    () => `EST-${Date.now()}`,
  );
  const [projectName, setProjectName] = useState("");
  const [notes, setNotes] = useState("");

  const [length, setLength] = useState(1200);
  const [width, setWidth] = useState(600);
  const [unit, setUnit] = useState<LengthUnit>("mm");
  const [qty, setQty] = useState(20);
  const [wastage, setWastage] = useState(8);
  const [edges, setEdges] = useState<Record<EdgeKey, boolean>>({
    e1: true,
    e2: true,
    e3: true,
    e4: false,
  });
  const [rate, setRate] = useState(1450);
  const [cost, setCost] = useState(980);
  const [method, setMethod] = useState<PricingMethod>("markup");
  const [percent, setPercent] = useState(25);

  const [loadingLists, setLoadingLists] = useState(false);
  const [loadingEstimations, setLoadingEstimations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedRecord, setSelectedRecord] =
    useState<EstimationRecord | null>(null);

  const selectedCustomer = customers.find(
    (customer) => customer.id === customerId,
  );

  const filteredLeads = useMemo(
    () =>
      leads.filter(
        (lead) =>
          !lead.customerId || !customerId || lead.customerId === customerId,
      ),
    [leads, customerId],
  );

  const filteredVisits = useMemo(
    () =>
      visits.filter(
        (visit) =>
          (!visit.customerId ||
            !customerId ||
            visit.customerId === customerId) &&
          (!leadId ||
            visit.leadEnquiryId == null ||
            String(visit.leadEnquiryId) === leadId),
      ),
    [visits, customerId, leadId],
  );

  const calc = useMemo(() => {
    const L = toMm(Math.max(0, length), unit);
    const W = toMm(Math.max(0, width), unit);
    const unitSqft = areaSqft(L, W);
    const baseSqft = unitSqft * Math.max(0, qty);
    const procSqft = procurementQty(baseSqft, Math.max(0, wastage));
    const safeCost = Math.max(0, cost);
    const safePercent = Math.min(99.99, Math.max(0, percent));
    const sell = sellingPrice(safeCost, safePercent, method);
    const edgeRft = edgeBandRft(L, W, edges) * Math.max(0, qty);
    const totalSellingPrice = sell * Math.max(0, qty);

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
      edgeRft,
      amount: baseSqft * Math.max(0, rate),
      sell,
      profit: sell - safeCost,
      totalSellingPrice,
      safeCost,
      safePercent,
      baseAmount: baseSqft * Math.max(0, rate),
    };
  }, [
    length,
    width,
    unit,
    qty,
    wastage,
    edges,
    rate,
    cost,
    percent,
    method,
  ]);

  const loadCustomers = useCallback(async () => {
    const response = await apiRequest<unknown>("/crm/customers");
    setCustomers(unwrapList<Customer>(response, ["customers", "data"]));
  }, []);

  const loadLeads = useCallback(async () => {
    const response = await apiRequest<unknown>("/lead-enquiries");
    setLeads(unwrapList<Lead>(response, ["leads", "data"]));
  }, []);

  const loadVisits = useCallback(async () => {
    const response = await apiRequest<unknown>("/site-measurements");
    setVisits(
      unwrapList<SiteVisit>(response, [
        "measurements",
        "siteMeasurements",
        "data",
      ]),
    );
  }, []);

  const loadEstimations = useCallback(async () => {
    setLoadingEstimations(true);

    try {
      const response = await apiRequest<unknown>("/estimations");
      setEstimations(
        unwrapList<EstimationRecord>(response, ["estimations", "data"]),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? `Saved estimations could not load: ${err.message}`
          : "Saved estimations could not load.",
      );
    } finally {
      setLoadingEstimations(false);
    }
  }, []);

  const refreshLists = useCallback(async () => {
    setLoadingLists(true);
    setError("");

    try {
      await Promise.all([loadCustomers(), loadLeads(), loadVisits()]);
      await loadEstimations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Customer, lead or site visit lists could not load.",
      );
    } finally {
      setLoadingLists(false);
    }
  }, [loadCustomers, loadLeads, loadVisits, loadEstimations]);

  useEffect(() => {
    void refreshLists();
  }, [refreshLists]);

  function chooseCustomer(id: string) {
    setCustomerId(id);
    setLeadId("");
    setSiteVisitId("");

    const customer = customers.find((item) => item.id === id);

    if (customer) {
      setProjectName("");
    }
  }

  function chooseLead(id: string) {
    setLeadId(id);
    setSiteVisitId("");

    const lead = leads.find((item) => String(item.id) === id);

    if (lead?.requirement) {
      setProjectName((previous) => previous || lead.requirement || "");
    }
  }

  function chooseVisit(id: string) {
    setSiteVisitId(id);

    const visit = visits.find((item) => item.id === id);

    if (!visit) return;

    if (visit.lengthMm != null) {
      setLength(Number(visit.lengthMm));
      setUnit("mm");
    }

    if (visit.widthMm != null) {
      setWidth(Number(visit.widthMm));
      setUnit("mm");
    }

    if (visit.projectName) setProjectName(visit.projectName);
  }

  function clearForm() {
    setCustomerId("");
    setLeadId("");
    setSiteVisitId("");
    setEstimationNumber(`EST-${Date.now()}`);
    setProjectName("");
    setNotes("");
    setLength(1200);
    setWidth(600);
    setUnit("mm");
    setQty(20);
    setWastage(8);
    setEdges({ e1: true, e2: true, e3: true, e4: false });
    setRate(1450);
    setCost(980);
    setMethod("markup");
    setPercent(25);
    setError("");
    setSuccess("");
    setSelectedRecord(null);
  }

  async function submitEstimation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!customerId) {
      setError("Please select a CRM Customer.");
      return;
    }

    if (!leadId) {
      setError("Please select a Lead Enquiry.");
      return;
    }

    if (!siteVisitId) {
      setError("Please select a Site Visit / Measurement.");
      return;
    }

    if (length <= 0 || width <= 0 || qty <= 0) {
      setError("Length, width and quantity must be greater than zero.");
      return;
    }

    const visit = visits.find((item) => item.id === siteVisitId);
    const lead = leads.find((item) => String(item.id) === leadId);

    if (lead?.customerId && lead.customerId !== customerId) {
      setError("The selected lead is not linked to the selected customer.");
      return;
    }

    if (visit?.customerId && visit.customerId !== customerId) {
      setError("The selected site visit is not linked to this customer.");
      return;
    }

    if (
      visit?.leadEnquiryId != null &&
      String(visit.leadEnquiryId) !== leadId
    ) {
      setError("The selected site visit belongs to a different lead.");
      return;
    }

    setSaving(true);

    try {
      const bomItems = workstationBom.map((item) => ({
        component: item.component,
        quantityPerUnit: Number(item.qty),
        required: Number(item.qty) * qty,
        withWastage: Math.ceil(
          procurementQty(Number(item.qty) * qty, wastage),
        ),
        unit: item.unit,
      }));

      bomItems.push(
        {
          component: "Panel",
          quantityPerUnit: calc.unitSqft,
          required: calc.baseSqft,
          withWastage: calc.procSqft,
          unit: "sq.ft",
        },
        {
          component: "Edge Band",
          quantityPerUnit: edgeBandRft(calc.L, calc.W, edges),
          required: calc.edgeRft,
          withWastage: procurementQty(calc.edgeRft, wastage),
          unit: "RFT",
        },
      );

      const payload = {
        estimationNumber: estimationNumber.trim(),
        customerId,
        leadEnquiryId: Number(leadId),
        siteMeasurementId: siteVisitId,
        projectName: projectName.trim() || visit?.projectName || null,
        notes: notes.trim() || null,
        lengthMm: calc.L,
        widthMm: calc.W,
        unit,
        quantity: qty,
        wastagePercent: wastage,
        ratePerSqft: rate,
        costPerUnit: cost,
        pricingMethod: method,
        pricingPercent: percent,
        edges,
        bomItems,
        derivedQuantities: {
          lengthMm: calc.L,
          widthMm: calc.W,
          areaSqft: calc.unitSqft,
          areaSqm: calc.unitSqm,
          rftPerUnit: calc.unitRft,
          baseSqft: calc.baseSqft,
          wastageSqft: calc.procSqft - calc.baseSqft,
          procurementSqft: calc.procSqft,
          sheetsRaw: calc.sheetsRaw,
          sheetsRequired: calc.sheets,
          edgeRft: calc.edgeRft,
          lineAmount: calc.amount,
          sellingPricePerUnit: calc.sell,
          profitPerUnit: calc.profit,
          totalSellingPrice: calc.totalSellingPrice,
        },
        baseAmount: calc.baseAmount,
        sellingPricePerUnit: calc.sell,
        totalSellingPrice: calc.totalSellingPrice,
        status: "Draft",
      };

      await apiRequest("/estimations", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccess("Estimation & BOQ saved successfully.");
      setEstimationNumber(`EST-${Date.now()}`);

      await loadEstimations();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Estimation could not be saved: ${err.message}`
          : "Estimation could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredEstimations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return estimations;

    return estimations.filter((item) =>
      [
        item.estimationNumber,
        item.customer?.name,
        item.projectName,
        item.status,
        item.customerId,
      ].some((value) => String(value ?? "").toLowerCase().includes(query)),
    );
  }, [estimations, search]);

  return (
    <AppShell title="Estimation & BOQ">
      <div className="space-y-5 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Estimation & BOQ
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Select the CRM customer, linked lead and site measurement.
              Calculate quantities, wastage, costing and BOQ before saving.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refreshLists()}
            disabled={loadingLists}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loadingLists ? "animate-spin" : ""}`} />
            Refresh Lists
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={submitEstimation} className="space-y-5">
          <Panel title="1. Customer & Project Details">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="CRM Customer *">
                <select
                  required
                  className={inputClass}
                  value={customerId}
                  onChange={(event) => chooseCustomer(event.target.value)}
                >
                  <option value="">Select CRM Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.company ? ` — ${customer.company}` : ""}
                      {customer.phone ? ` (${customer.phone})` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Lead Enquiry *">
                <select
                  required
                  className={inputClass}
                  value={leadId}
                  onChange={(event) => chooseLead(event.target.value)}
                  disabled={!customerId}
                >
                  <option value="">
                    {customerId ? "Select Lead Enquiry" : "Select customer first"}
                  </option>
                  {filteredLeads.map((lead) => (
                    <option key={lead.id} value={String(lead.id)}>
                      #{lead.id} — {lead.customerName || lead.companyName || "Lead"}
                      {lead.status ? ` (${lead.status})` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Site Visit / Measurement *">
                <select
                  required
                  className={inputClass}
                  value={siteVisitId}
                  onChange={(event) => chooseVisit(event.target.value)}
                  disabled={!leadId}
                >
                  <option value="">
                    {leadId ? "Select Site Visit" : "Select lead first"}
                  </option>
                  {filteredVisits.map((visit) => (
                    <option key={visit.id} value={visit.id}>
                      {visit.visitId} — {visit.projectName || visit.roomType || "Site Visit"}
                      {visit.visitDate
                        ? ` (${String(visit.visitDate).slice(0, 10)})`
                        : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Estimation Number *">
                <input
                  required
                  className={inputClass}
                  value={estimationNumber}
                  onChange={(event) => setEstimationNumber(event.target.value)}
                />
              </Field>

              <Field label="Project Name">
                <input
                  className={inputClass}
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="Project / site name"
                />
              </Field>

              <Field label="Notes">
                <input
                  className={inputClass}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Additional instructions"
                />
              </Field>
            </div>

            {selectedCustomer && (
              <p className="mt-3 text-xs text-gray-500">
                Customer: {selectedCustomer.name}
                {selectedCustomer.phone ? ` · ${selectedCustomer.phone}` : ""}
                {selectedCustomer.address
                  ? ` · ${selectedCustomer.address}`
                  : ""}
              </p>
            )}
          </Panel>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Panel title="2. Panel Measurements">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Length">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className={inputClass}
                    value={length}
                    onChange={(event) => setLength(Number(event.target.value))}
                  />
                </Field>

                <Field label="Width">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className={inputClass}
                    value={width}
                    onChange={(event) => setWidth(Number(event.target.value))}
                  />
                </Field>

                <Field label="Entry Unit">
                  <select
                    className={inputClass}
                    value={unit}
                    onChange={(event) =>
                      setUnit(event.target.value as LengthUnit)
                    }
                  >
                    {UNITS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Quantity (Nos)">
                  <input
                    type="number"
                    min="1"
                    className={inputClass}
                    value={qty}
                    onChange={(event) => setQty(Number(event.target.value))}
                  />
                </Field>

                <Field label="Wastage %">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={inputClass}
                    value={wastage}
                    onChange={(event) => setWastage(Number(event.target.value))}
                  />
                </Field>

                <Field label="Rate / Sq.Ft (₹)">
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={rate}
                    onChange={(event) => setRate(Number(event.target.value))}
                  />
                </Field>
              </div>

              <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Edge Banding
              </p>

              <div className="flex flex-wrap gap-2">
                {(["e1", "e2", "e3", "e4"] as EdgeKey[]).map((key, index) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={edges[key]}
                      onChange={(event) =>
                        setEdges((previous) => ({
                          ...previous,
                          [key]: event.target.checked,
                        }))
                      }
                    />
                    Edge {index + 1}
                  </label>
                ))}
              </div>
            </Panel>

            <Panel title="3. Derived Quantities">
              <Row
                label="Length (master)"
                value={`${round(calc.L, ROUNDING.measurement)} mm`}
              />
              <Row
                label="Width (master)"
                value={`${round(calc.W, ROUNDING.measurement)} mm`}
              />
              <Row
                label="Area / unit"
                value={`${round(calc.unitSqft, ROUNDING.quantity)} sq.ft`}
              />
              <Row
                label="Area / unit (metric)"
                value={`${round(calc.unitSqm, ROUNDING.quantity)} sq.m`}
              />
              <Row
                label="RFT / unit"
                value={`${round(calc.unitRft, ROUNDING.quantity)} RFT`}
              />
              <Row
                label="Base requirement"
                value={`${round(calc.baseSqft, ROUNDING.quantity)} sq.ft`}
              />
              <Row
                label={`Wastage @ ${wastage}%`}
                value={`${round(calc.procSqft - calc.baseSqft, ROUNDING.quantity)} sq.ft`}
              />
              <Row
                label="Procurement quantity"
                value={`${round(calc.procSqft, ROUNDING.quantity)} sq.ft`}
                strong
              />
              <Row
                label="Sheets (8ft × 4ft)"
                value={`${round(calc.sheetsRaw, ROUNDING.quantity)} → ${calc.sheets} sheets`}
                strong
              />
              <Row
                label="Edge band total"
                value={`${round(calc.edgeRft, ROUNDING.quantity)} RFT`}
              />
              <Row label="Line amount" value={money(calc.amount)} strong />
            </Panel>

            <Panel title="4. Costing — Markup vs Margin">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cost / Unit (₹)">
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={cost}
                    onChange={(event) => setCost(Number(event.target.value))}
                  />
                </Field>

                <Field label="Percent">
                  <input
                    type="number"
                    min="0"
                    max="99.99"
                    className={inputClass}
                    value={percent}
                    onChange={(event) => setPercent(Number(event.target.value))}
                  />
                </Field>
              </div>

              <div className="mt-3">
                <Field label="Pricing Method">
                  <select
                    className={inputClass}
                    value={method}
                    onChange={(event) =>
                      setMethod(event.target.value as PricingMethod)
                    }
                  >
                    <option value="markup">Markup (cost × 1 + p)</option>
                    <option value="margin">Margin (cost ÷ 1 − p)</option>
                  </select>
                </Field>
              </div>

              <div className="mt-4">
                <Row label="Selling price / unit" value={money(calc.sell)} strong />
                <Row label="Profit / unit" value={money(calc.profit)} />
                <Row
                  label="Total selling price"
                  value={money(calc.totalSellingPrice)}
                  strong
                />
                <Row
                  label="Markup equivalent"
                  value={
                    calc.safeCost > 0
                      ? `${round((calc.profit / calc.safeCost) * 100, 2)}%`
                      : "—"
                  }
                />
                <Row
                  label="Margin equivalent"
                  value={
                    calc.sell > 0
                      ? `${round((calc.profit / calc.sell) * 100, 2)}%`
                      : "—"
                  }
                />
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Markup and margin are calculated differently.
              </p>
            </Panel>
          </div>

          <Panel title={`5. BOM Explosion — Workstation × ${qty}`}>
            <p className="mb-3 text-xs text-gray-500">
              Material requirement with wastage.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600">
                  <tr>
                    <th className="p-3">Component</th>
                    <th className="p-3 text-right">Qty / Unit</th>
                    <th className="p-3 text-right">Required</th>
                    <th className="p-3 text-right">With Wastage</th>
                    <th className="p-3">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {workstationBom.map((item) => (
                    <tr key={item.component}>
                      <td className="p-3">{item.component}</td>
                      <td className="p-3 text-right tabular-nums">{item.qty}</td>
                      <td className="p-3 text-right tabular-nums">
                        {round(Number(item.qty) * qty, 2)}
                      </td>
                      <td className="p-3 text-right font-medium tabular-nums">
                        {Math.ceil(
                          procurementQty(Number(item.qty) * qty, wastage),
                        )}
                      </td>
                      <td className="p-3 text-gray-500">{item.unit}</td>
                    </tr>
                  ))}

                  <tr>
                    <td className="p-3">Panel</td>
                    <td className="p-3 text-right">{round(calc.unitSqft, 2)}</td>
                    <td className="p-3 text-right">
                      {round(calc.baseSqft, 2)}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {round(calc.procSqft, 2)}
                    </td>
                    <td className="p-3 text-gray-500">sq.ft</td>
                  </tr>

                  <tr>
                    <td className="p-3">Edge Band</td>
                    <td className="p-3 text-right">
                      {round(edgeBandRft(calc.L, calc.W, edges), 2)}
                    </td>
                    <td className="p-3 text-right">
                      {round(calc.edgeRft, 2)}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {round(procurementQty(calc.edgeRft, wastage), 2)}
                    </td>
                    <td className="p-3 text-gray-500">RFT</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Base Amount</p>
                <p className="mt-1 text-lg font-semibold">{money(calc.baseAmount)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Selling Price / Unit</p>
                <p className="mt-1 text-lg font-semibold">{money(calc.sell)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Total Selling Price</p>
                <p className="mt-1 text-lg font-semibold">
                  {money(calc.totalSellingPrice)}
                </p>
              </div>
            </div>
          </Panel>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={clearForm}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" />
              Clear Form
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#8f2525] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#741d1d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Estimation & BOQ"}
            </button>
          </div>
        </form>

        <Panel title="6. Saved Estimations">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Saved records from the Estimation API.
            </p>

            <div className="flex gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  className={`${inputClass} pl-9`}
                  placeholder="Search estimation, customer..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={() => void loadEstimations()}
                disabled={loadingEstimations}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loadingEstimations ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {loadingEstimations ? (
            <p className="py-6 text-sm text-gray-500">
              Loading saved estimations...
            </p>
          ) : filteredEstimations.length === 0 ? (
            <p className="py-6 text-sm text-gray-500">
              No saved estimations found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600">
                  <tr>
                    <th className="p-3">Estimation Number</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Project</th>
                    <th className="p-3 text-right">Total Selling Price</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEstimations.map((item) => {
                    const customerName =
                      item.customer?.name ||
                      customers.find((customer) => customer.id === item.customerId)
                        ?.name ||
                      "—";

                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="p-3 font-medium">
                          {item.estimationNumber}
                        </td>
                        <td className="p-3">{customerName}</td>
                        <td className="p-3">{item.projectName || "—"}</td>
                        <td className="p-3 text-right font-medium">
                          {money(item.totalSellingPrice)}
                        </td>
                        <td className="p-3">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs">
                            {item.status || "Draft"}
                          </span>
                        </td>
                        <td className="p-3">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(item)}
                            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 text-xs text-gray-400">
            Records shown here are fetched from GET /api/estimations.
          </p>
        </Panel>

        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Estimation Details</h2>
                  <p className="text-sm text-gray-500">
                    {selectedRecord.estimationNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

              <Row
                label="Customer"
                value={
                  selectedRecord.customer?.name ||
                  customers.find(
                    (customer) => customer.id === selectedRecord.customerId,
                  )?.name ||
                  "—"
                }
              />
              <Row label="Project" value={selectedRecord.projectName || "—"} />
              <Row
                label="Total Selling Price"
                value={money(selectedRecord.totalSellingPrice)}
                strong
              />
              <Row label="Status" value={selectedRecord.status || "Draft"} />
              <Row label="Notes" value={selectedRecord.notes || "—"} />
              <Row
                label="Created"
                value={
                  selectedRecord.createdAt
                    ? new Date(selectedRecord.createdAt).toLocaleString()
                    : "—"
                }
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}