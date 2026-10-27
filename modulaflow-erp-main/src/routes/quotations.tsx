import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Eye,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/erp/AppShell";

export const Route = createFileRoute("/quotations")({
  component: QuotationsPage,
});

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5001/api"
).replace(/\/+$/, "");

interface CustomerOption {
  id: string;
  name: string;
  company?: string;
  phone?: string;
}

interface EstimateOption {
  id: string | number;
  estimateNo?: string;
  estimationNumber?: string;
  quotationNo?: string;
  customerId?: string | null;
  customerName?: string;
  projectName?: string;
  totalAmount?: number | string;
  totalSellingPrice?: number | string;
  grandTotal?: number | string;
  status?: string;
}

interface QuotationItem {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
}

interface Quotation {
  id: string;
  quotationNo: string;
  customerId: string | null;
  customerName: string;
  projectName: string;
  estimateId: string | number | null;
  quotationDate: string;
  validUntil: string;
  status: string;
  gstRate: number;
  notes: string;
  items: QuotationItem[];
  createdAt?: string;
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
}

type QuotationForm = {
  customerId: string;
  customerName: string;
  projectName: string;
  estimateId: string;
  quotationDate: string;
  validUntil: string;
  status: string;
  gstRate: string;
  notes: string;
  items: QuotationItem[];
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const emptyItem = (): QuotationItem => ({
  id: crypto.randomUUID(),
  itemName: "",
  description: "",
  quantity: 1,
  unit: "NOS",
  rate: 0,
});

const createEmptyForm = (): QuotationForm => ({
  customerId: "",
  customerName: "",
  projectName: "",
  estimateId: "",
  quotationDate: new Date().toISOString().slice(0, 10),
  validUntil: "",
  status: "Draft",
  gstRate: "18",
  notes: "",
  items: [emptyItem()],
});

async function parseResponse(response: Response): Promise<any> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || `Request failed (${response.status})`,
    );
  }

  return data;
}

function getList<T>(data: any, keys: string[]): T[] {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key] as T[];
    }
  }

  return [];
}

function money(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function getSubtotal(items: QuotationItem[]) {
  return items.reduce(
    (sum, item) =>
      sum +
      Math.max(0, Number(item.quantity) || 0) *
        Math.max(0, Number(item.rate) || 0),
    0,
  );
}

function getTotals(items: QuotationItem[], gstRate: number) {
  const subtotal = getSubtotal(items);
  const gstAmount = subtotal * (gstRate / 100);

  return {
    subtotal,
    gstAmount,
    grandTotal: subtotal + gstAmount,
  };
}

function createQuotationNumber() {
  return `QT-${Date.now()}`;
}

function normalizeQuotationItem(row: any): QuotationItem {
  return {
    id: String(row.id ?? crypto.randomUUID()),
    itemName: row.itemName ?? row.name ?? "",
    description: row.description ?? "",
    quantity: Number(row.quantity ?? 1),
    unit: row.unit ?? "NOS",
    rate: Number(row.rate ?? row.unitPrice ?? 0),
  };
}

function normalizeQuotation(row: any): Quotation {
  const items = Array.isArray(row.items)
    ? row.items.map(normalizeQuotationItem)
    : [];

  const gstRate = Number(row.gstRate ?? 18);
  const totals = getTotals(items, gstRate);

  return {
    ...row,
    id: String(row.id),
    quotationNo:
      row.quotationNo || row.quotationNumber || "QT-PENDING",
    customerId: row.customerId != null ? String(row.customerId) : null,
    customerName: row.customerName ?? row.customer?.name ?? "",
    projectName: row.projectName ?? "",
    estimateId: row.estimateId ?? row.estimationId ?? null,
    quotationDate: row.quotationDate
      ? String(row.quotationDate).slice(0, 10)
      : "",
    validUntil: row.validUntil
      ? String(row.validUntil).slice(0, 10)
      : "",
    status: row.status ?? "Draft",
    gstRate,
    notes: row.notes ?? "",
    items,
    subtotal: Number(row.subtotal ?? totals.subtotal),
    gstAmount: Number(row.gstAmount ?? totals.gstAmount),
    grandTotal: Number(row.grandTotal ?? totals.grandTotal),
  };
}

function normalizeEstimate(row: any): EstimateOption {
  return {
    ...row,
    id: String(row.id),
    estimateNo: row.estimateNo ?? row.estimationNumber,
    estimationNumber: row.estimationNumber ?? row.estimateNo,
    customerId: row.customerId != null ? String(row.customerId) : null,
    customerName: row.customerName ?? row.customer?.name ?? "",
    projectName: row.projectName ?? "",
    totalSellingPrice: row.totalSellingPrice ?? row.grandTotal,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [estimates, setEstimates] = useState<EstimateOption[]>([]);

  const [form, setForm] = useState<QuotationForm>(createEmptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Quotation | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadQuotations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/quotations`);
      const data = await parseResponse(response);

      setQuotations(
        getList<any>(data, ["quotations", "data"]).map(
          normalizeQuotation,
        ),
      );
    } catch (err) {
      setError(
        getErrorMessage(err, "Quotations could not be loaded."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    const response = await fetch(`${API_BASE}/crm/customers`);
    const data = await parseResponse(response);

    setCustomers(
      getList<CustomerOption>(data, ["customers", "data"]),
    );
  }, []);

  const loadEstimates = useCallback(async () => {
    const response = await fetch(`${API_BASE}/estimations`);
    const data = await parseResponse(response);

    setEstimates(
      getList<any>(data, ["estimations", "estimates", "data"]).map(
        normalizeEstimate,
      ),
    );
  }, []);

  const loadDropdowns = useCallback(async () => {
    const results = await Promise.allSettled([
      loadCustomers(),
      loadEstimates(),
    ]);

    const failed = results.find(
      (result) => result.status === "rejected",
    );

    if (failed?.status === "rejected") {
      setError(
        failed.reason instanceof Error
          ? `Customer/Estimation list could not load: ${failed.reason.message}`
          : "Customer/Estimation list could not load.",
      );
    }
  }, [loadCustomers, loadEstimates]);

  useEffect(() => {
    void loadQuotations();
    void loadDropdowns();
  }, [loadQuotations, loadDropdowns]);

  const filteredQuotations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return quotations.filter((item) => {
      const matchesSearch = [
        item.quotationNo,
        item.customerName,
        item.projectName,
        item.status,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query),
      );

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotations, search, statusFilter]);

  const totals = useMemo(
    () => getTotals(form.items, Number(form.gstRate) || 0),
    [form.items, form.gstRate],
  );

  function setField<K extends keyof QuotationForm>(
    field: K,
    value: QuotationForm[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function selectCustomer(customerId: string) {
    const customer = customers.find(
      (item) => item.id === customerId,
    );

    setForm((previous) => ({
      ...previous,
      customerId,
      customerName: customer?.name ?? previous.customerName,
    }));
  }

  function selectEstimate(estimateId: string) {
    const estimate = estimates.find(
      (item) => String(item.id) === estimateId,
    );

    if (!estimate) {
      setForm((previous) => ({
        ...previous,
        estimateId: "",
      }));
      return;
    }

    const customerId = estimate.customerId ?? "";
    const linkedCustomer = customers.find(
      (customer) => customer.id === customerId,
    );

    setForm((previous) => ({
      ...previous,
      estimateId,
      customerId: customerId || previous.customerId,
      customerName:
        linkedCustomer?.name ??
        estimate.customerName ??
        previous.customerName,
      projectName: estimate.projectName || previous.projectName,
    }));
  }

  function openCreate() {
    setEditingId(null);
    setViewing(null);
    setForm(createEmptyForm());
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEdit(item: Quotation) {
    setEditingId(item.id);
    setViewing(null);

    setForm({
      customerId: item.customerId ?? "",
      customerName: item.customerName ?? "",
      projectName: item.projectName ?? "",
      estimateId:
        item.estimateId != null ? String(item.estimateId) : "",
      quotationDate: item.quotationDate || "",
      validUntil: item.validUntil || "",
      status: item.status || "Draft",
      gstRate: String(item.gstRate ?? 18),
      notes: item.notes || "",
      items: item.items.length
        ? item.items.map((row) => ({ ...row }))
        : [emptyItem()],
    });

    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function addItem() {
    setForm((previous) => ({
      ...previous,
      items: [...previous.items, emptyItem()],
    }));
  }

  function removeItem(itemId: string) {
    setForm((previous) => ({
      ...previous,
      items:
        previous.items.length <= 1
          ? previous.items
          : previous.items.filter((item) => item.id !== itemId),
    }));
  }

  function updateItem(
    itemId: string,
    field: keyof QuotationItem,
    value: string | number,
  ) {
    setForm((previous) => ({
      ...previous,
      items: previous.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function validateForm() {
    if (!form.customerId) {
      setError("Please select a CRM customer.");
      return false;
    }

    if (!form.customerName.trim()) {
      setError("Please enter the customer name.");
      return false;
    }

    if (!form.projectName.trim()) {
      setError("Please enter the project name.");
      return false;
    }

    if (!form.quotationDate) {
      setError("Please select the quotation date.");
      return false;
    }

    if (form.validUntil && form.validUntil < form.quotationDate) {
      setError("Validity date cannot be before the quotation date.");
      return false;
    }

    if (form.items.length === 0) {
      setError("Please add at least one quotation item.");
      return false;
    }

    for (const item of form.items) {
      if (!item.itemName.trim()) {
        setError("Please enter an item name for every item.");
        return false;
      }

      if (!Number.isFinite(Number(item.quantity)) || item.quantity <= 0) {
        setError("Quantity must be greater than zero.");
        return false;
      }

      if (!Number.isFinite(Number(item.rate)) || item.rate < 0) {
        setError("Rate cannot be negative.");
        return false;
      }
    }

    const gstRate = Number(form.gstRate);

    if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 100) {
      setError("Please enter a valid GST percentage.");
      return false;
    }

    const selectedEstimate = estimates.find(
      (item) => String(item.id) === form.estimateId,
    );

    if (
      selectedEstimate?.customerId &&
      selectedEstimate.customerId !== form.customerId
    ) {
      setError(
        "The selected estimation belongs to a different customer. Please select the correct customer.",
      );
      return false;
    }

    return true;
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setSaving(true);

    try {
      const selectedCustomer = customers.find(
        (customer) => customer.id === form.customerId,
      );

      const existing = editingId
        ? quotations.find((item) => item.id === editingId)
        : undefined;

      const quotationTotals = getTotals(
        form.items,
        Number(form.gstRate) || 0,
      );

      const payload = {
        quotationNo: existing?.quotationNo ?? createQuotationNumber(),
        customerId: form.customerId,
        customerName:
          selectedCustomer?.name ?? form.customerName.trim(),
        projectName: form.projectName.trim(),
        estimateId: form.estimateId || null,
        quotationDate: form.quotationDate,
        validUntil: form.validUntil || null,
        status: form.status,
        gstRate: Number(form.gstRate),
        notes: form.notes.trim() || null,
        items: form.items.map((item) => ({
          itemName: item.itemName.trim(),
          description: item.description.trim() || null,
          quantity: Number(item.quantity),
          unit: item.unit,
          rate: Number(item.rate),
          amount: Number(
            (Number(item.quantity) * Number(item.rate)).toFixed(2),
          ),
        })),
        ...quotationTotals,
      };

      const url = editingId
        ? `${API_BASE}/quotations/${encodeURIComponent(editingId)}`
        : `${API_BASE}/quotations`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await parseResponse(response);

      setSuccess(
        editingId
          ? "Quotation updated successfully."
          : "Quotation saved successfully.",
      );

      setShowForm(false);
      setEditingId(null);
      setForm(createEmptyForm());

      await loadQuotations();
      await loadDropdowns();
    } catch (err) {
      setError(
        getErrorMessage(err, "Quotation could not be saved."),
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuotation(item: Quotation) {
    if (
      !window.confirm(
        `Are you sure you want to delete ${item.quotationNo}?`,
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE}/quotations/${encodeURIComponent(item.id)}`,
        { method: "DELETE" },
      );

      await parseResponse(response);

      setSuccess("Quotation deleted successfully.");

      if (viewing?.id === item.id) {
        setViewing(null);
      }

      if (editingId === item.id) {
        setEditingId(null);
        setShowForm(false);
      }

      await loadQuotations();
    } catch (err) {
      setError(
        getErrorMessage(err, "Quotation could not be deleted."),
      );
    }
  }

  return (
    <AppShell title="Quotation Management">
      <div className="space-y-5 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quotation Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage customer quotations from Estimation / BOQ.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void loadQuotations();
                void loadDropdowns();
              }}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create Quotation
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Quotations", value: quotations.length },
            {
              label: "Draft Quotations",
              value: quotations.filter((q) => q.status === "Draft").length,
            },
            {
              label: "Sent Quotations",
              value: quotations.filter((q) => q.status === "Sent").length,
            },
            {
              label: "Accepted Quotations",
              value: quotations.filter((q) => q.status === "Accepted").length,
            },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border bg-white p-5">
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {showForm && (
          <section className="rounded-xl border bg-white p-4 md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Quotation" : "Create Quotation"}
              </h2>

              <button
                type="button"
                aria-label="Close quotation form"
                onClick={() => setShowForm(false)}
                className="rounded p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="space-y-1 text-sm">
                  <span>CRM Customer *</span>
                  <select
                    className={inputClass}
                    required
                    value={form.customerId}
                    onChange={(event) => selectCustomer(event.target.value)}
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.company ? ` — ${customer.company}` : ""}
                        {customer.phone ? ` (${customer.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span>Estimation / BOQ</span>
                  <select
                    className={inputClass}
                    value={form.estimateId}
                    onChange={(event) => selectEstimate(event.target.value)}
                  >
                    <option value="">Select Estimation (Optional)</option>
                    {estimates.map((estimate) => (
                      <option key={estimate.id} value={String(estimate.id)}>
                        {estimate.estimationNumber ||
                          estimate.estimateNo ||
                          estimate.quotationNo ||
                          `Estimate #${estimate.id}`}
                        {estimate.projectName ? ` — ${estimate.projectName}` : ""}
                        {estimate.totalSellingPrice != null
                          ? ` — ${money(estimate.totalSellingPrice)}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span>Customer Name *</span>
                  <input
                    className={inputClass}
                    required
                    value={form.customerName}
                    onChange={(event) =>
                      setField("customerName", event.target.value)
                    }
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Project Name *</span>
                  <input
                    className={inputClass}
                    required
                    value={form.projectName}
                    onChange={(event) =>
                      setField("projectName", event.target.value)
                    }
                    placeholder="Kitchen, wardrobe, workstation..."
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Quotation Date *</span>
                  <input
                    className={inputClass}
                    type="date"
                    required
                    value={form.quotationDate}
                    onChange={(event) =>
                      setField("quotationDate", event.target.value)
                    }
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Valid Until</span>
                  <input
                    className={inputClass}
                    type="date"
                    min={form.quotationDate}
                    value={form.validUntil}
                    onChange={(event) =>
                      setField("validUntil", event.target.value)
                    }
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Status</span>
                  <select
                    className={inputClass}
                    value={form.status}
                    onChange={(event) =>
                      setField("status", event.target.value)
                    }
                  >
                    <option>Draft</option>
                    <option>Sent</option>
                    <option>Accepted</option>
                    <option>Rejected</option>
                    <option>Expired</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span>GST Percentage (%)</span>
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={form.gstRate}
                    onChange={(event) =>
                      setField("gstRate", event.target.value)
                    }
                  />
                </label>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">Quotation Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {form.items.map((item, index) => (
                    <div key={item.id} className="rounded-lg border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold">
                          Item {index + 1}
                        </h4>

                        <button
                          type="button"
                          disabled={form.items.length === 1}
                          onClick={() => removeItem(item.id)}
                          className="rounded p-2 text-red-600 hover:bg-red-50 disabled:opacity-40"
                          aria-label={`Remove item ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
                        <label className="space-y-1 text-sm xl:col-span-2">
                          <span>Item Name *</span>
                          <input
                            className={inputClass}
                            required
                            value={item.itemName}
                            onChange={(event) =>
                              updateItem(item.id, "itemName", event.target.value)
                            }
                            placeholder="Wardrobe, workstation..."
                          />
                        </label>

                        <label className="space-y-1 text-sm xl:col-span-2">
                          <span>Description</span>
                          <input
                            className={inputClass}
                            value={item.description}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                "description",
                                event.target.value,
                              )
                            }
                          />
                        </label>

                        <label className="space-y-1 text-sm">
                          <span>Quantity *</span>
                          <input
                            className={inputClass}
                            type="number"
                            min="0.001"
                            step="any"
                            required
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                "quantity",
                                Number(event.target.value),
                              )
                            }
                          />
                        </label>

                        <label className="space-y-1 text-sm">
                          <span>Unit</span>
                          <select
                            className={inputClass}
                            value={item.unit}
                            onChange={(event) =>
                              updateItem(item.id, "unit", event.target.value)
                            }
                          >
                            {[
                              "NOS",
                              "SQFT",
                              "SQM",
                              "RFT",
                              "RMT",
                              "SHEET",
                              "KG",
                              "SET",
                            ].map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-1 text-sm">
                          <span>Rate (₹) *</span>
                          <input
                            className={inputClass}
                            type="number"
                            min="0"
                            step="any"
                            required
                            value={item.rate}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                "rate",
                                Number(event.target.value),
                              )
                            }
                          />
                        </label>

                        <div className="space-y-1 text-sm">
                          <span className="block">Amount</span>
                          <div className="rounded-lg bg-gray-50 px-3 py-2 font-semibold">
                            {money(item.quantity * item.rate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ml-auto max-w-sm space-y-3 rounded-xl border bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <strong>{money(totals.subtotal)}</strong>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST ({Number(form.gstRate) || 0}%)</span>
                  <strong>{money(totals.gstAmount)}</strong>
                </div>
                <div className="flex justify-between border-t pt-3 text-lg">
                  <strong>Grand Total</strong>
                  <strong>{money(totals.grandTotal)}</strong>
                </div>
              </div>

              <label className="block space-y-1 text-sm">
                <span>Notes / Terms and Conditions</span>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={form.notes}
                  onChange={(event) => setField("notes", event.target.value)}
                  placeholder="Payment terms, delivery schedule, warranty..."
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Quotation"
                      : "Save Quotation"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border px-5 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {viewing && (
          <section className="space-y-4 rounded-xl border bg-white p-4 md:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Quotation Details: {viewing.quotationNo}
              </h2>

              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded p-2 hover:bg-gray-100"
                aria-label="Close quotation details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <p><strong>Customer:</strong> {viewing.customerName}</p>
              <p><strong>Project:</strong> {viewing.projectName}</p>
              <p><strong>Quotation No:</strong> {viewing.quotationNo}</p>
              <p><strong>Date:</strong> {viewing.quotationDate || "—"}</p>
              <p><strong>Valid Until:</strong> {viewing.validUntil || "—"}</p>
              <p><strong>Status:</strong> {viewing.status}</p>
              <p><strong>GST:</strong> {viewing.gstRate}%</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3">Item</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Rate</th>
                    <th className="p-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {viewing.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3">
                        <div>{item.itemName}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3">{item.unit}</td>
                      <td className="p-3">{money(item.rate)}</td>
                      <td className="p-3">
                        {money(item.quantity * item.rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ml-auto max-w-sm space-y-2 rounded-lg bg-gray-50 p-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <strong>{money(viewing.subtotal)}</strong>
              </div>
              <div className="flex justify-between">
                <span>GST ({viewing.gstRate}%)</span>
                <strong>{money(viewing.gstAmount)}</strong>
              </div>
              <div className="flex justify-between border-t pt-2 text-lg">
                <strong>Grand Total</strong>
                <strong>{money(viewing.grandTotal)}</strong>
              </div>
            </div>

            {viewing.notes && (
              <p className="text-sm">
                <strong>Notes:</strong> {viewing.notes}
              </p>
            )}
          </section>
        )}

        <section className="overflow-hidden rounded-xl border bg-white">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold">Quotation Records</h2>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  className={`${inputClass} pl-9 sm:w-64`}
                  placeholder="Search quotations..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <select
                className={inputClass}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-gray-500">
              Loading quotations...
            </p>
          ) : filteredQuotations.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              No quotations found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3">Quotation No.</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Project</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Grand Total</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredQuotations.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{item.quotationNo}</td>
                      <td className="p-3">{item.customerName}</td>
                      <td className="p-3">{item.projectName || "—"}</td>
                      <td className="p-3">{item.quotationDate || "—"}</td>
                      <td className="p-3 font-medium">
                        {money(item.grandTotal)}
                      </td>
                      <td className="p-3">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            aria-label="View quotation"
                            onClick={() => setViewing(item)}
                            className="rounded p-2 text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            aria-label="Edit quotation"
                            onClick={() => openEdit(item)}
                            className="rounded p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            aria-label="Delete quotation"
                            onClick={() => void deleteQuotation(item)}
                            className="rounded p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}