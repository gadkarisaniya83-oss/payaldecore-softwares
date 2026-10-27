import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  Factory,
  ClipboardList,
  Boxes,
  AlertTriangle,
  Save,
  Search,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/erp/AppShell";

export const Route = createFileRoute("/production")({
  component: ProductionPage,
});

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5001/api"
).replace(/\/$/, "");

const STAGES = [
  "Pending",
  "Cutting",
  "Edge Banding",
  "CNC",
  "Assembly",
  "Finishing",
  "QC",
  "Ready",
];

type AnyRecord = Record<string, any>;

type WorkOrder = {
  id: string;
  workOrderNo: string;
  projectName?: string;
  productWork?: string;
  customerName?: string;
  quantity?: number;
  status?: string;
};

type Bom = {
  id: string;
  bomNo?: string;
  bomName?: string;
  project?: string;
  workOrderNo?: string;
  materials?: AnyRecord[];
};

type ProductionJob = {
  id: string;
  workOrderNo: string;
  productName: string;
  quantity: number;
  currentStage: string;
  department?: string;
  deadline?: string | null;
  notes?: string | null;
  bomId?: string | null;
  bom?: Bom | null;
  createdAt?: string;
};

async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message ||
        result.error ||
        `Request failed (${response.status})`
    );
  }

  return result as T;
}

function asArray<T>(result: any): T[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.workOrders)) return result.workOrders;
  if (Array.isArray(result?.boms)) return result.boms;
  if (Array.isArray(result?.jobs)) return result.jobs;
  if (Array.isArray(result?.productions)) return result.productions;
  return [];
}

function getId(item: AnyRecord): string {
  return String(item?.id ?? item?._id ?? "");
}

function getWorkOrderLabel(order: WorkOrder): string {
  return [
    order.workOrderNo,
    order.projectName || order.productWork || "",
    order.customerName || "",
  ]
    .filter(Boolean)
    .join(" — ");
}

function getBomLabel(bom: Bom): string {
  return [
    bom.bomNo || "",
    bom.bomName || "Unnamed BOM",
    bom.workOrderNo || "",
  ]
    .filter(Boolean)
    .join(" — ");
}

function ProductionPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [jobs, setJobs] = useState<ProductionJob[]>([]);

  const [workOrderNo, setWorkOrderNo] = useState("");
  const [bomId, setBomId] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [currentStage, setCurrentStage] = useState("Pending");
  const [department, setDepartment] = useState("Production");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");

  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedWorkOrder = useMemo(
    () => workOrders.find(
      (item) => item.workOrderNo === workOrderNo
    ),
    [workOrders, workOrderNo]
  );

  const selectedBom = useMemo(
    () => boms.find((item) => getId(item) === bomId),
    [boms, bomId]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        apiRequest("/work-orders"),
        apiRequest("/production/boms"),
        apiRequest("/production"),
      ]);

      if (results[0].status === "fulfilled") {
        setWorkOrders(asArray<WorkOrder>(results[0].value));
      }

      if (results[1].status === "fulfilled") {
        setBoms(asArray<Bom>(results[1].value));
      } else {
        try {
          const result = await apiRequest("/bom");
          setBoms(asArray<Bom>(result));
        } catch (e) {
          console.error("BOM load failed:", e);
        }
      }

      if (results[2].status === "fulfilled") {
        setJobs(asArray<ProductionJob>(results[2].value));
      } else {
        throw results[2].reason;
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to load Production data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);
  const resetForm = () => {
    setWorkOrderNo("");
    setBomId("");
    setProductName("");
    setQuantity("1");
    setCurrentStage("Pending");
    setDepartment("Production");
    setDeadline("");
    setNotes("");
    setEditingId("");
  };

  const handleWorkOrderChange = (value: string) => {
    setWorkOrderNo(value);
    setError("");
    setSuccess("");

    const order = workOrders.find(
      (item) => item.workOrderNo === value
    );

    if (order) {
      setProductName(
        order.productWork || order.projectName || ""
      );
      setQuantity(String(order.quantity || 1));

      const matchingBom = boms.find(
        (item) => item.workOrderNo === value
      );

      setBomId(matchingBom ? getId(matchingBom) : "");
    }
  };

  const handleBomChange = (value: string) => {
    setBomId(value);
    setError("");
    setSuccess("");

    const bom = boms.find((item) => getId(item) === value);

    if (bom?.workOrderNo) {
      setWorkOrderNo(bom.workOrderNo);

      const order = workOrders.find(
        (item) => item.workOrderNo === bom.workOrderNo
      );

      if (order && !productName.trim()) {
        setProductName(
          order.productWork || order.projectName || ""
        );
      }
    }
  };

  const handleEdit = (job: ProductionJob) => {
    setEditingId(job.id);
    setWorkOrderNo(job.workOrderNo || "");
    setBomId(job.bomId || "");
    setProductName(job.productName || "");
    setQuantity(String(job.quantity || 1));
    setCurrentStage(job.currentStage || "Pending");
    setDepartment(job.department || "Production");
    setDeadline(
      job.deadline ? job.deadline.slice(0, 10) : ""
    );
    setNotes(job.notes || "");
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!workOrderNo.trim()) {
      setError("Please select a Work Order.");
      return;
    }

    if (!productName.trim()) {
      setError("Please enter the Product Name.");
      return;
    }

    if (!quantity || Number(quantity) < 1) {
      setError("Production Quantity must be at least 1.");
      return;
    }

    const payload = {
      workOrderNo: workOrderNo.trim(),
      productName: productName.trim(),
      quantity: Number(quantity),
      currentStage,
      department: department.trim() || "Production",
      deadline: deadline || null,
      notes: notes.trim() || null,
      bomId: bomId || null,
    };

    setSaving(true);

    try {
      if (editingId) {
        await apiRequest(`/production/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setSuccess("Production job updated successfully.");
      } else {
        await apiRequest("/production", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setSuccess("Production job saved successfully.");
      }

      resetForm();
      await loadData();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to save Production job."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (job: ProductionJob) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete production job ${job.workOrderNo}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await apiRequest(`/production/${job.id}`, {
        method: "DELETE",
      });

      if (editingId === job.id) resetForm();

      setSuccess("Production job deleted successfully.");
      await loadData();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to delete Production job."
      );
    }
  };

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return jobs;

    return jobs.filter((job) =>
      [
        job.workOrderNo,
        job.productName,
        job.currentStage,
        job.department,
        job.bom?.bomName,
        job.bom?.bomNo,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(term)
        )
    );
  }, [jobs, search]);

  const pendingJobs = jobs.filter(
    (job) => !job.currentStage || job.currentStage === "Pending"
  ).length;

  const activeJobs = jobs.filter(
    (job) =>
      job.currentStage &&
      !["Pending", "Ready"].includes(job.currentStage)
  ).length;

  const readyJobs = jobs.filter(
    (job) => job.currentStage === "Ready"
  ).length;

  return (
    <AppShell>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Production
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage work orders, BOM materials and production stages.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Jobs</p>
            <p className="mt-2 text-2xl font-bold">{jobs.length}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="mt-2 text-2xl font-bold">{pendingJobs}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="mt-2 text-2xl font-bold">{activeJobs}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Ready</p>
            <p className="mt-2 text-2xl font-bold">{readyJobs}</p>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="space-y-5 rounded-xl border bg-white p-4 shadow-sm md:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              {editingId ? "Edit Production Job" : "Create Production Job"}
            </h2>

            {editingId && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setError("");
                  setSuccess("");
                }}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"
              >
                <X size={16} />
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Work Order Number *
              </label>
              <select
                value={workOrderNo}
                onChange={(e) => handleWorkOrderChange(e.target.value)}
                required
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="">Select Work Order</option>
                {workOrders.map((order) => (
                  <option
                    key={order.id || order.workOrderNo}
                    value={order.workOrderNo}
                  >
                    {getWorkOrderLabel(order)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                BOM Name
              </label>
              <select
                value={bomId}
                onChange={(e) => handleBomChange(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="">Select BOM</option>
                {boms.map((bom) => (
                  <option key={getId(bom)} value={getId(bom)}>
                    {getBomLabel(bom)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Product Name *
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Modular Kitchen"
                required
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Production Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Production Stage
              </label>
              <select
                value={currentStage}
                onChange={(e) => setCurrentStage(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              >
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Department
              </label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Notes
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
          </div>

          {selectedWorkOrder && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p>
                <strong>Work Order:</strong>{" "}
                {selectedWorkOrder.workOrderNo}
              </p>
              <p>
                <strong>Project:</strong>{" "}
                {selectedWorkOrder.projectName || "-"}
              </p>
              <p>
                <strong>Customer:</strong>{" "}
                {selectedWorkOrder.customerName || "-"}
              </p>
            </div>
          )}
          {selectedBom && (
            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="font-semibold">
                BOM Materials & Stock Usage
              </h3>

              {selectedBom.materials?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3">Material Code</th>
                        <th className="p-3">Material Name</th>
                        <th className="p-3">Required Qty</th>
                        <th className="p-3">Available Stock</th>
                        <th className="p-3">Unit</th>
                        <th className="p-3">Stock Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBom.materials.map((material, index) => {
                        const required = Number(material.requiredQty ?? 0);
                        const available = Number(material.availableQty ?? 0);
                        const sufficient = available >= required;

                        return (
                          <tr
                            key={material.id || `${material.materialCode}-${index}`}
                            className="border-t"
                          >
                            <td className="p-3">{material.materialCode || "-"}</td>
                            <td className="p-3">{material.materialName || "-"}</td>
                            <td className="p-3">{required}</td>
                            <td className="p-3">{available}</td>
                            <td className="p-3">{material.unit || "Pieces"}</td>
                            <td className="p-3">
                              <span
                                className={`rounded-full px-2 py-1 text-xs ${
                                  sufficient
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {sufficient ? "Sufficient" : "Insufficient"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No materials linked to this BOM.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={16} />
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Production"
                  : "Save Production"}
            </button>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setError("");
                setSuccess("");
              }}
              className="rounded-lg border px-5 py-2.5 text-sm hover:bg-gray-50"
            >
              Clear Form
            </button>
          </div>
        </form>

        <section className="space-y-4 rounded-xl border bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Production Jobs</h2>

            <div className="relative w-full sm:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search production jobs..."
                className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Loading production data...
            </p>
          ) : filteredJobs.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No production jobs found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3">Work Order</th>
                    <th className="p-3">BOM Name</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Stage</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Deadline</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredJobs.map((job) => (
                    <tr
                      key={job.id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-3 font-medium">
                        {job.workOrderNo || "-"}
                      </td>
                      <td className="p-3">
                        {job.bom?.bomName ||
                          boms.find((bom) => getId(bom) === job.bomId)?.bomName ||
                          "-"}
                      </td>
                      <td className="p-3 font-medium">
                        {job.productName || "-"}
                      </td>
                      <td className="p-3">{job.quantity ?? 0}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                          {job.currentStage || "Pending"}
                        </span>
                      </td>
                      <td className="p-3">
                        {job.department || "Production"}
                      </td>
                      <td className="p-3">
                        {job.deadline
                          ? new Date(job.deadline).toLocaleDateString()
                          : "-"}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(job)}
                            title="Edit Production Job"
                            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(job)}
                            title="Delete Production Job"
                            className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                          >
                            <Trash2 size={14} />
                            Delete
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