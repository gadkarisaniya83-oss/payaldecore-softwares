import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Search, Pencil, Trash2, X, RefreshCw, Eye,
} from "lucide-react";
import { AppShell } from "@/components/erp/AppShell";

export const Route = createFileRoute("/work-orders")({
  component: WorkOrdersPage,
});

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5001/api"
).replace(/\/+$/, "");

const STATUSES = [
  "Draft", "Approved", "In Production", "Completed", "Cancelled",
];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

interface WorkOrder {
  id: string;
  workOrderNo: string;
  salesOrderId?: string | null;
  customerId?: string | null;
  customerName: string;
  projectName: string;
  productWork: string;
  quantity: number;
  unit: string;
  dueDate?: string | null;
  assignedTeam?: string | null;
  priority: string;
  status: string;
  notes?: string | null;
}

interface SalesOrder {
  id: string;
  orderNo?: string;
  salesOrderNo?: string;
  customerId?: string | null;
  customerName?: string;
  projectName?: string;
  status?: string;
}

const blank = {
  salesOrderId: "",
  customerId: "",
  customerName: "",
  projectName: "",
  productWork: "",
  quantity: "1",
  unit: "Nos",
  dueDate: "",
  assignedTeam: "",
  priority: "Medium",
  status: "Draft",
  notes: "",
};

async function responseData(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || `Request failed (${response.status})`
    );
  }

  return data;
}

function arrayFrom<T>(data: any, keys: string[]): T[] {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function cleanWorkOrder(row: any): WorkOrder {
  return {
    ...row,
    id: String(row.id),
    workOrderNo: row.workOrderNo || "WO",
    salesOrderId: row.salesOrderId ?? null,
    customerId: row.customerId ?? row.customer?.id ?? null,
    customerName: row.customerName ?? row.customer?.name ?? "",
    projectName: row.projectName ?? "",
    productWork: row.productWork ?? "",
    quantity: Number(row.quantity ?? 1),
    unit: row.unit ?? "Nos",
    dueDate: row.dueDate
      ? String(row.dueDate).slice(0, 10)
      : "",
    assignedTeam: row.assignedTeam ?? "",
    priority: row.priority ?? "Medium",
    status: row.status ?? "Draft",
    notes: row.notes ?? "",
  };
}

function cleanSalesOrder(row: any): SalesOrder {
  return {
    ...row,
    id: String(row.id),
    orderNo: row.orderNo ?? row.salesOrderNo ?? "",
    customerId:
      row.customerId ?? row.customer?.id ?? null,
    customerName:
      row.customerName ?? row.customer?.name ?? "",
    projectName: row.projectName ?? "",
    status: row.status ?? "",
  };
}
function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [form, setForm] = useState({ ...blank });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<WorkOrder | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const input =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const loadOrders = useCallback(async () => {
    setLoading(true);

    try {
      const data = await responseData(
        await fetch(`${API}/work-orders`)
      );

      setOrders(
        arrayFrom<any>(data, ["workOrders", "data"])
          .map(cleanWorkOrder)
      );
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load Work Orders."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSalesOrders = useCallback(async () => {
    try {
      const data = await responseData(
        await fetch(`${API}/sales-orders`)
      );

      setSalesOrders(
        arrayFrom<any>(data, ["salesOrders", "data"])
          .map(cleanSalesOrder)
      );
    } catch (e) {
      setSalesOrders([]);
      setError(
        e instanceof Error
          ? `Sales Order dropdown: ${e.message}`
          : "Could not load Sales Orders."
      );
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadOrders(), loadSalesOrders()]);
  }, [loadOrders, loadSalesOrders]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((o) => {
      const textMatch = [
        o.workOrderNo,
        o.customerName,
        o.projectName,
        o.productWork,
        o.assignedTeam,
        o.status,
      ].some((v) => String(v ?? "").toLowerCase().includes(q));

      return (
        textMatch &&
        (statusFilter === "All" || o.status === statusFilter)
      );
    });
  }, [orders, search, statusFilter]);

  function field(name: keyof typeof blank, value: string) {
    setForm((old) => ({ ...old, [name]: value }));
  }

  function chooseOrder(id: string) {
    const so = salesOrders.find((x) => x.id === id);

    if (!id || !so) {
      setForm((old) => ({
        ...old,
        salesOrderId: "",
        customerId: "",
        customerName: "",
        projectName: "",
      }));
      return;
    }

    setForm((old) => ({
      ...old,
      salesOrderId: id,
      customerId: String(so.customerId ?? ""),
      customerName: so.customerName ?? "",
      projectName: so.projectName ?? "",
    }));

    setError("");
  }

  function createNew() {
    setEditingId(null);
    setViewing(null);
    setForm({ ...blank });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function edit(item: WorkOrder) {
    setEditingId(item.id);
    setViewing(null);

    setForm({
      salesOrderId: item.salesOrderId ?? "",
      customerId: item.customerId ?? "",
      customerName: item.customerName,
      projectName: item.projectName,
      productWork: item.productWork,
      quantity: String(item.quantity),
      unit: item.unit,
      dueDate: item.dueDate ?? "",
      assignedTeam: item.assignedTeam ?? "",
      priority: item.priority,
      status: item.status,
      notes: item.notes ?? "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const qty = Number(form.quantity);
      const customerId = form.customerId.trim();
      const customerName = form.customerName.trim();

      if (!form.salesOrderId) {
        throw new Error("Please select a Sales Order.");
      }

      if (!customerId) {
        throw new Error(
          "Customer ID is missing. Please check the selected Sales Order."
        );
      }

      if (!customerName) {
        throw new Error("Customer name is required.");
      }

      if (!form.projectName.trim()) {
        throw new Error("Project name is required.");
      }

      if (!form.productWork.trim()) {
        throw new Error("Product / Work is required.");
      }

      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error("Quantity must be greater than zero.");
      }

      const payload = {
        salesOrderId: form.salesOrderId,
        customerId,
        customerName,
        projectName: form.projectName.trim(),
        productWork: form.productWork.trim(),
        quantity: qty,
        unit: form.unit,
        dueDate: form.dueDate || null,
        assignedTeam: form.assignedTeam.trim() || null,
        priority: form.priority,
        status: form.status,
        notes: form.notes.trim() || null,
      };

      const url = editingId
        ? `${API}/work-orders/${encodeURIComponent(editingId)}`
        : `${API}/work-orders`;

      await responseData(
        await fetch(url, {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      );

      setSuccess(
        editingId
          ? "Work Order updated successfully."
          : "Work Order created successfully."
      );

      setShowForm(false);
      setEditingId(null);
      setForm({ ...blank });
      await loadOrders();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save Work Order."
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: WorkOrder) {
    if (!window.confirm(`Delete ${item.workOrderNo}?`)) return;

    setError("");
    setSuccess("");

    try {
      await responseData(
        await fetch(
          `${API}/work-orders/${encodeURIComponent(item.id)}`,
          { method: "DELETE" }
        )
      );

      setSuccess("Work Order deleted successfully.");
      await loadOrders();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not delete Work Order."
      );
    }
  }

  const count = (status: string) =>
    orders.filter((o) => o.status === status).length;

  return (
    <AppShell title="Work Orders">
      <main className="space-y-5 p-4 md:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-gray-500">
              Production execution control
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              Work Orders
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and track manufacturing work from confirmed sales.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              type="button"
              onClick={createNew}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create Work Order
            </button>
          </div>
        </header>

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

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            ["Draft", count("Draft")],
            ["Approved", count("Approved")],
            ["In Production", count("In Production")],
            ["Completed", count("Completed")],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border bg-white p-4">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
        {showForm && (
          <section className="rounded-xl border bg-white p-4 md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Work Order" : "Create Work Order"}
              </h2>
              <button
                type="button"
                aria-label="Close form"
                onClick={() => setShowForm(false)}
                className="rounded p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="space-y-1 text-sm">
                  <span>Sales Order *</span>
                  <select
                    required
                    className={input}
                    value={form.salesOrderId}
                    onChange={(e) => chooseOrder(e.target.value)}
                  >
                    <option value="">Select Sales Order</option>
                    {salesOrders.map((so) => (
                      <option key={so.id} value={so.id}>
                        {so.orderNo || `SO-${so.id}`} —{" "}
                        {so.customerName || "Customer"}
                        {so.status ? ` (${so.status})` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span>Customer Name *</span>
                  <input
                    required
                    readOnly
                    className={`${input} bg-gray-100`}
                    value={form.customerName}
                    placeholder="Select a Sales Order first"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Project Name *</span>
                  <input
                    required
                    className={input}
                    value={form.projectName}
                    onChange={(e) => field("projectName", e.target.value)}
                  />
                </label>

                <label className="space-y-1 text-sm md:col-span-2">
                  <span>Product / Work *</span>
                  <input
                    required
                    className={input}
                    placeholder="Modular kitchen, wardrobe, TV unit..."
                    value={form.productWork}
                    onChange={(e) => field("productWork", e.target.value)}
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Quantity *</span>
                  <input
                    required
                    type="number"
                    min="0.001"
                    step="any"
                    className={input}
                    value={form.quantity}
                    onChange={(e) => field("quantity", e.target.value)}
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Unit</span>
                  <select
                    className={input}
                    value={form.unit}
                    onChange={(e) => field("unit", e.target.value)}
                  >
                    {["Nos", "Set", "Sq.Ft", "Sq.M", "RFT", "Sheet"].map(
                      (unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      )
                    )}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span>Due Date</span>
                  <input
                    type="date"
                    className={input}
                    value={form.dueDate}
                    onChange={(e) => field("dueDate", e.target.value)}
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Assigned Team</span>
                  <input
                    className={input}
                    placeholder="Production team / employee"
                    value={form.assignedTeam}
                    onChange={(e) => field("assignedTeam", e.target.value)}
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Priority</span>
                  <select
                    className={input}
                    value={form.priority}
                    onChange={(e) => field("priority", e.target.value)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span>Status</span>
                  <select
                    className={input}
                    value={form.status}
                    onChange={(e) => field("status", e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-1 text-sm">
                <span>Notes / Production Instructions</span>
                <textarea
                  rows={3}
                  className={input}
                  value={form.notes}
                  onChange={(e) => field("notes", e.target.value)}
                  placeholder="Material, finish, dimensions, installation instructions..."
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
                      ? "Update Work Order"
                      : "Save Work Order"}
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
                Work Order Details: {viewing.workOrderNo}
              </h2>
              <button
                type="button"
                onClick={() => setViewing(null)}
                aria-label="Close details"
                className="rounded p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <p><strong>Customer:</strong> {viewing.customerName}</p>
              <p><strong>Project:</strong> {viewing.projectName}</p>
              <p><strong>Product / Work:</strong> {viewing.productWork}</p>
              <p><strong>Quantity:</strong> {viewing.quantity} {viewing.unit}</p>
              <p><strong>Due Date:</strong> {viewing.dueDate || "—"}</p>
              <p><strong>Assigned Team:</strong> {viewing.assignedTeam || "—"}</p>
              <p><strong>Priority:</strong> {viewing.priority}</p>
              <p><strong>Status:</strong> {viewing.status}</p>
              <p><strong>Sales Order ID:</strong> {viewing.salesOrderId || "—"}</p>
            </div>

            {viewing.notes && (
              <p className="text-sm">
                <strong>Notes:</strong> {viewing.notes}
              </p>
            )}
          </section>
        )}

        <section className="overflow-hidden rounded-xl border bg-white">
          <div className="flex flex-col gap-3 border-b p-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="font-semibold">Work Order Records</h2>
              <p className="text-xs text-gray-500">{filtered.length} record(s)</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  className={`${input} pl-9 sm:w-72`}
                  placeholder="Search order, customer, project..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className={input}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-gray-500">Loading Work Orders...</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No Work Orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    {[
                      "Work Order", "Customer / Project", "Product / Work",
                      "Qty", "Due Date", "Assigned Team", "Priority",
                      "Status", "Actions",
                    ].map((heading) => (
                      <th key={heading} className="p-3">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{item.workOrderNo}</td>
                      <td className="p-3">
                        <div>{item.customerName}</div>
                        <div className="text-xs text-gray-500">{item.projectName}</div>
                      </td>
                      <td className="p-3">{item.productWork}</td>
                      <td className="p-3">{item.quantity} {item.unit}</td>
                      <td className="p-3">{item.dueDate || "—"}</td>
                      <td className="p-3">{item.assignedTeam || "—"}</td>
                      <td className="p-3">{item.priority}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            title="View"
                            onClick={() => setViewing(item)}
                            className="rounded p-2 hover:bg-gray-100"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => edit(item)}
                            className="rounded p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => void remove(item)}
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
      </main>
    </AppShell>
  );
}