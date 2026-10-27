// sales-orders.tsx
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
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppShell } from "@/components/erp/AppShell";

export const Route = createFileRoute("/sales-orders")({
  component: SalesOrdersPage,
});

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5001/api"
).replace(/\/+$/, "");

interface CustomerOption {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  address?: string;
}

interface QuotationItem {
  id?: string;
  itemName?: string;
  name?: string;
  description?: string;
  quantity: number;
  unit?: string;
  rate?: number;
  amount?: number;
}

interface QuotationOption {
  id: string | number;
  quotationNo?: string;
  quotationNumber?: string;
  customerId?: string | null;
  customerName?: string;
  projectName?: string;
  quotationDate?: string;
  status?: string;
  grandTotal?: number;
  totalAmount?: number;
  subtotal?: number;
  gstAmount?: number;
  gstRate?: number;
  notes?: string;
  items?: QuotationItem[];
}

interface SalesOrderItem {
  id?: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  rate: number;
  amount?: number;
}

interface SalesOrder {
  id: string;
  salesOrderNo: string;
  customerId?: string | null;
  quotationId?: string | number | null;
  customerName: string;
  projectName: string;
  orderDate: string;
  deliveryDate: string;
  status: string;
  totalAmount: number;
  notes: string;
  items: SalesOrderItem[];
  createdAt?: string;
}

const STATUS_OPTIONS = [
  "Draft",
  "Approved",
  "Material Reserved",
  "In Production",
  "Ready to Dispatch",
  "Partially Dispatched",
  "Completed",
  "Cancelled",
];

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const today = () => new Date().toISOString().slice(0, 10);

function createOrderNumber() {
  return `SO-${Date.now().toString().slice(-8)}`;
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

async function parseResponse(response: Response) {
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

function normalizeQuotation(item: any): QuotationOption {
  return {
    ...item,
    id: item.id,
    quotationNo:
      item.quotationNo || item.quotationNumber || "QT-PENDING",
    customerId: item.customerId ?? item.customer?.id ?? null,
    customerName:
      item.customerName ?? item.customer?.name ?? "",
    projectName: item.projectName ?? "",
    status: item.status ?? "Draft",
    grandTotal: Number(
      item.grandTotal ??
        item.totalAmount ??
        (
          Number(item.subtotal ?? 0) +
          Number(item.gstAmount ?? 0)
        ),
    ),
    items: Array.isArray(item.items) ? item.items : [],
  };
}

function normalizeSalesOrder(item: any): SalesOrder {
  return {
    ...item,
    id: String(item.id),
    salesOrderNo:
      item.salesOrderNo ||
      item.orderNo ||
      item.orderNumber ||
      "SO-PENDING",
    customerId: item.customerId ?? item.customer?.id ?? null,
    quotationId: item.quotationId ?? item.quotation?.id ?? null,
    customerName:
      item.customerName ?? item.customer?.name ?? "",
    projectName: item.projectName ?? "",
    orderDate: item.orderDate
      ? String(item.orderDate).slice(0, 10)
      : "",
    deliveryDate: item.deliveryDate
      ? String(item.deliveryDate).slice(0, 10)
      : "",
    status: item.status ?? "Draft",
    totalAmount: Number(
      item.totalAmount ?? item.grandTotal ?? 0,
    ),
    notes: item.notes ?? "",
    items: Array.isArray(item.items)
      ? item.items.map((row: any) => ({
          id: row.id ? String(row.id) : undefined,
          itemName: row.itemName ?? row.name ?? "",
          description: row.description ?? "",
          quantity: Number(row.quantity ?? 1),
          unit: row.unit ?? "NOS",
          rate: Number(row.rate ?? row.unitPrice ?? 0),
          amount: Number(
            row.amount ??
              Number(row.quantity ?? 1) *
                Number(row.rate ?? row.unitPrice ?? 0),
          ),
        }))
      : [],
  };
}

const emptyForm = {
  customerId: "",
  quotationId: "",
  customerName: "",
  projectName: "",
  orderDate: today(),
  deliveryDate: "",
  status: "Draft",
  totalAmount: "0",
  notes: "",
};

function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [quotations, setQuotations] = useState<QuotationOption[]>([]);

  const [form, setForm] = useState({ ...emptyForm });
  const [formItems, setFormItems] = useState<SalesOrderItem[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<SalesOrder | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/sales-orders`);
      const data = await parseResponse(response);

      setOrders(
        getList<any>(data, ["salesOrders", "orders", "data"])
          .map(normalizeSalesOrder),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sales Orders could not be loaded.",
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

  const loadQuotations = useCallback(async () => {
    const response = await fetch(`${API_BASE}/quotations`);
    const data = await parseResponse(response);

    setQuotations(
      getList<any>(data, ["quotations", "data"])
        .map(normalizeQuotation),
    );
  }, []);

  const loadDropdowns = useCallback(async () => {
    const results = await Promise.allSettled([
      loadCustomers(),
      loadQuotations(),
    ]);

    const failed = results.find(
      (result) => result.status === "rejected",
    );

    if (failed?.status === "rejected") {
      setError(
        failed.reason instanceof Error
          ? `Customer/Quotation list could not load: ${failed.reason.message}`
          : "Customer/Quotation list could not load.",
      );
    }
  }, [loadCustomers, loadQuotations]);

  useEffect(() => {
    void loadOrders();
    void loadDropdowns();
  }, [loadOrders, loadDropdowns]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch = [
        order.salesOrderNo,
        order.customerName,
        order.projectName,
        order.status,
        order.notes,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query),
      );

      const matchesStatus =
        statusFilter === "All" ||
        order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      approved: orders.filter(
        (order) => order.status === "Approved",
      ).length,
      production: orders.filter(
        (order) => order.status === "In Production",
      ).length,
      ready: orders.filter(
        (order) => order.status === "Ready to Dispatch",
      ).length,
    }),
    [orders],
  );

  function setField<K extends keyof typeof emptyForm>(
    field: K,
    value: (typeof emptyForm)[K],
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
      customerName: customer?.name ?? "",
      quotationId: "",
      projectName: "",
      totalAmount: "0",
    }));

    setFormItems([]);
  }

  function selectQuotation(quotationId: string) {
    const quotation = quotations.find(
      (item) => String(item.id) === quotationId,
    );

    if (!quotation) {
      setForm((previous) => ({
        ...previous,
        quotationId: "",
      }));
      return;
    }

    if (
      quotation.customerId &&
      form.customerId &&
      quotation.customerId !== form.customerId
    ) {
      setError(
        "This quotation belongs to another customer. Select the matching customer first.",
      );
      return;
    }

    const linkedCustomer = customers.find(
      (item) => item.id === quotation.customerId,
    );

    setForm((previous) => ({
      ...previous,
      quotationId,
      customerId:
        quotation.customerId ?? previous.customerId,
      customerName:
        linkedCustomer?.name ??
        quotation.customerName ??
        previous.customerName,
      projectName:
        quotation.projectName ?? previous.projectName,
      totalAmount: String(quotation.grandTotal ?? 0),
    }));

    setFormItems(
      (quotation.items ?? []).map((item) => ({
        itemName: item.itemName ?? item.name ?? "Item",
        description: item.description ?? "",
        quantity: Number(item.quantity ?? 1),
        unit: item.unit ?? "NOS",
        rate: Number(item.rate ?? 0),
        amount:
          Number(item.quantity ?? 1) * Number(item.rate ?? 0),
      })),
    );

    setError("");
  }
  function openCreate() {
    setEditingId(null);
    setViewing(null);
    setForm({ ...emptyForm, orderDate: today() });
    setFormItems([]);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEdit(order: SalesOrder) {
    setEditingId(order.id);
    setViewing(null);

    setForm({
      customerId: order.customerId ?? "",
      quotationId:
        order.quotationId != null
          ? String(order.quotationId)
          : "",
      customerName: order.customerName ?? "",
      projectName: order.projectName ?? "",
      orderDate: order.orderDate || today(),
      deliveryDate: order.deliveryDate || "",
      status: order.status || "Draft",
      totalAmount: String(order.totalAmount ?? 0),
      notes: order.notes ?? "",
    });

    setFormItems(order.items.map((item) => ({ ...item })));
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function validateForm() {
    if (!form.customerId) {
      setError("Please select a CRM customer.");
      return false;
    }

    if (!form.customerName.trim()) {
      setError("Customer name is required.");
      return false;
    }

    if (!form.projectName.trim()) {
      setError("Project name is required.");
      return false;
    }

    if (!form.orderDate) {
      setError("Please select the sales order date.");
      return false;
    }

    if (
      form.deliveryDate &&
      form.deliveryDate < form.orderDate
    ) {
      setError(
        "Delivery date cannot be before the order date.",
      );
      return false;
    }

    if (
      form.quotationId &&
      !quotations.some(
        (quotation) =>
          String(quotation.id) === form.quotationId,
      )
    ) {
      setError("The selected quotation could not be found.");
      return false;
    }

    const quotation = quotations.find(
      (item) => String(item.id) === form.quotationId,
    );

    if (
      quotation?.customerId &&
      quotation.customerId !== form.customerId
    ) {
      setError(
        "The selected quotation and customer do not match.",
      );
      return false;
    }

    const total = Number(form.totalAmount);

    if (!Number.isFinite(total) || total < 0) {
      setError("Please enter a valid order amount.");
      return false;
    }

    return true;
  }

  async function submitForm(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setSaving(true);

    try {
      const selectedCustomer = customers.find(
        (item) => item.id === form.customerId,
      );

      const existing = editingId
        ? orders.find((item) => item.id === editingId)
        : undefined;

      const payload = {
        salesOrderNo:
          existing?.salesOrderNo ?? createOrderNumber(),
        customerId: form.customerId,
        quotationId: form.quotationId || null,
        customerName:
          selectedCustomer?.name ?? form.customerName.trim(),
        projectName: form.projectName.trim(),
        orderDate: form.orderDate,
        deliveryDate: form.deliveryDate || null,
        status: form.status,
        totalAmount: Number(form.totalAmount),
        notes: form.notes.trim() || null,
        items: formItems.map((item) => ({
          itemName: item.itemName.trim(),
          description: item.description?.trim() || null,
          quantity: Number(item.quantity),
          unit: item.unit || "NOS",
          rate: Number(item.rate),
          amount:
            Number(item.quantity) * Number(item.rate),
        })),
      };

      const url = editingId
        ? `${API_BASE}/sales-orders/${encodeURIComponent(editingId)}`
        : `${API_BASE}/sales-orders`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      await parseResponse(response);

      setSuccess(
        editingId
          ? "Sales Order updated successfully."
          : "Sales Order saved successfully.",
      );

      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      setFormItems([]);

      await loadOrders();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sales Order could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteOrder(order: SalesOrder) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${order.salesOrderNo}?`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE}/sales-orders/${encodeURIComponent(order.id)}`,
        { method: "DELETE" },
      );

      await parseResponse(response);

      setSuccess("Sales Order deleted successfully.");
      await loadOrders();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sales Order could not be deleted.",
      );
    }
  }

  function viewOrder(order: SalesOrder) {
    setViewing(order);
    setShowForm(false);
    setError("");
  }

  return (
    <AppShell title="Sales Orders">
      <div className="space-y-5 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Commercial Control
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              Sales Orders
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage customer orders, approved quotations,
              delivery dates and order progress.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void loadOrders();
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
              New Sales Order
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
            { label: "Total Sales Orders", value: stats.total },
            { label: "Approved", value: stats.approved },
            { label: "In Production", value: stats.production },
            { label: "Ready to Dispatch", value: stats.ready },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border bg-white p-5"
            >
              <p className="text-sm text-gray-500">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {showForm && (
          <section className="rounded-xl border bg-white p-4 md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingId
                    ? "Edit Sales Order"
                    : "Create Sales Order"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Select the customer and, if available, link an
                  approved quotation.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close sales order form"
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
                    onChange={(event) =>
                      selectCustomer(event.target.value)
                    }
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.name}
                        {customer.company
                          ? ` — ${customer.company}`
                          : ""}
                        {customer.phone
                          ? ` (${customer.phone})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span>Approved Quotation</span>
                  <select
                    className={inputClass}
                    value={form.quotationId}
                    onChange={(event) =>
                      selectQuotation(event.target.value)
                    }
                  >
                    <option value="">
                      Select Quotation (Optional)
                    </option>
                    {quotations
                      .filter(
                        (quotation) =>
                          ["Accepted", "Approved"].includes(
                            (quotation.status ?? "").trim()
                            ) &&
                          (
                            !quotation.customerId ||
                            !form.customerId ||
                            quotation.customerId ===
                              form.customerId
                          ),
                      )
                      .map((quotation) => (
                        <option
                          key={quotation.id}
                          value={String(quotation.id)}
                        >
                          {quotation.quotationNo}
                          {quotation.projectName
                            ? ` — ${quotation.projectName}`
                            : ""}
                          {" — "}
                          {money(quotation.grandTotal ?? 0)}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span>Sales Order Number</span>
                  <input
                    className={inputClass}
                    readOnly
                    value={
                      editingId
                        ? orders.find(
                            (order) => order.id === editingId,
                          )?.salesOrderNo ?? ""
                        : "Generated on save"
                    }
                  />
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
                    placeholder="Modular Kitchen, Wardrobe..."
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Order Date *</span>
                  <input
                    className={inputClass}
                    type="date"
                    required
                    value={form.orderDate}
                    onChange={(event) =>
                      setField("orderDate", event.target.value)
                    }
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Expected Delivery Date</span>
                  <input
                    className={inputClass}
                    type="date"
                    min={form.orderDate}
                    value={form.deliveryDate}
                    onChange={(event) =>
                      setField("deliveryDate", event.target.value)
                    }
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Order Status</span>
                  <select
                    className={inputClass}
                    value={form.status}
                    onChange={(event) =>
                      setField("status", event.target.value)
                    }
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span>Total Order Value (₹) *</span>
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.totalAmount}
                    onChange={(event) =>
                      setField("totalAmount", event.target.value)
                    }
                  />
                </label>
              </div>

              <label className="block space-y-1 text-sm">
                <span>Notes / Delivery Instructions</span>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setField("notes", event.target.value)
                  }
                  placeholder="Delivery, installation, material or customer instructions..."
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
                      ? "Update Sales Order"
                      : "Save Sales Order"}
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  Sales Order Details
                </h2>
                <p className="text-sm text-gray-500">
                  {viewing.salesOrderNo}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewing(null)}
                aria-label="Close order details"
                className="rounded p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">Customer</p>
                <p className="font-medium">
                  {viewing.customerName || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Project</p>
                <p className="font-medium">
                  {viewing.projectName || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Order Date</p>
                <p className="font-medium">
                  {viewing.orderDate || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  Expected Delivery
                </p>
                <p className="font-medium">
                  {viewing.deliveryDate || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-medium">{viewing.status}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  Order Value
                </p>
                <p className="font-semibold">
                  {money(viewing.totalAmount)}
                </p>
              </div>
            </div>

            {viewing.items.length > 0 && (
              <div className="overflow-x-auto">
                <h3 className="mb-3 font-semibold">
                  Order Items
                </h3>
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-3">Item</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3">Rate</th>
                      <th className="p-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {viewing.items.map((item, index) => (
                      <tr key={item.id ?? `${item.itemName}-${index}`}>
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
                          {money(
                            item.amount ??
                              item.quantity * item.rate,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {viewing.notes && (
              <p className="text-sm">
                <strong>Notes:</strong> {viewing.notes}
              </p>
            )}

            <button
              type="button"
              onClick={() => openEdit(viewing)}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              <Pencil className="h-4 w-4" />
              Edit Sales Order
            </button>
          </section>
        )}

        <section className="overflow-hidden rounded-xl border bg-white">
          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold">Sales Order Records</h2>
              <p className="mt-1 text-xs text-gray-500">
                {filteredOrders.length} record(s)
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  className={`${inputClass} pl-9 sm:w-64`}
                  placeholder="Search order, customer, project..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>

              <select
                className={inputClass}
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                aria-label="Filter sales orders by status"
              >
                <option value="All">All Statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-gray-500">
              Loading Sales Orders...
            </p>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-medium text-gray-700">
                No Sales Orders found.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Create a new order or refresh the list.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
              >
                <Plus className="h-4 w-4" />
                New Sales Order
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3">Sales Order</th>
                    <th className="p-3">Customer / Project</th>
                    <th className="p-3">Order Date</th>
                    <th className="p-3">Delivery Date</th>
                    <th className="p-3">Order Value</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="p-3">
                        <div className="font-semibold">
                          {order.salesOrderNo}
                        </div>
                        {order.quotationId != null && (
                          <div className="text-xs text-gray-500">
                            Quotation linked
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="font-medium">
                          {order.customerName || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.projectName || "—"}
                        </div>
                      </td>

                      <td className="p-3">
                        {order.orderDate || "—"}
                      </td>

                      <td className="p-3">
                        {order.deliveryDate || "—"}
                      </td>

                      <td className="p-3 font-medium">
                        {money(order.totalAmount)}
                      </td>

                      <td className="p-3">
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          {order.status}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            aria-label={`View ${order.salesOrderNo}`}
                            title="View"
                            onClick={() => viewOrder(order)}
                            className="rounded p-2 text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            aria-label={`Edit ${order.salesOrderNo}`}
                            title="Edit"
                            onClick={() => openEdit(order)}
                            className="rounded p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            aria-label={`Delete ${order.salesOrderNo}`}
                            title="Delete"
                            onClick={() => void deleteOrder(order)}
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