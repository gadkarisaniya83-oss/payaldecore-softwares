import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/components/erp/AppShell";

export const Route = createFileRoute("/bom-material-requirement")({
  component: BOMPage,
});

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5001/api"}`;

type WorkOrder = {
  id: string;
  workOrderNo?: string;
  workOrderNumber?: string;
  orderNo?: string;
  projectName?: string;
  customerName?: string;
};

type Material = {
  id: string;
  materialCode?: string;
  materialName: string;
  requiredQty: number;
  availableQty: number;
  unit: string;
  unitCost: number;
};

type BOM = {
  id: string;
  bomNo: string;
  bomName: string;
  project?: string | null;
  workOrderNo: string;
  status: string;
  notes?: string | null;
  materials: Material[];
};

const emptyForm = {
  bomNo: "",
  bomName: "",
  project: "",
  workOrderNo: "",
  status: "Draft",
  notes: "",
};

function BOMPage() {
  const [boms, setBoms] = useState<BOM[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [materialForm, setMaterialForm] = useState({
    materialCode: "",
    materialName: "",
    requiredQty: "1",
    availableQty: "0",
    unit: "Pieces",
    unitCost: "0",
  });

  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);
  const [showMaterialForm, setShowMaterialForm] = useState(false);

  const request = async (path: string, options?: RequestInit) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || result.message || "Request failed");
    }

    return result;
  };

  const loadBOMs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await request("/bom");
      setBoms(Array.isArray(data) ? data : data.boms || data.data || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "BOM load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWorkOrders = useCallback(async () => {
    try {
      const data = await request("/work-orders");
      const rows = Array.isArray(data)
        ? data
        : data.workOrders || data.data || [];
      setWorkOrders(rows);
    } catch (err) {
      console.error("Work Orders load error:", err);
      setError("Work Orders load झाले नाहीत. GET /api/work-orders तपासा.");
    }
  }, []);

  useEffect(() => {
    void loadBOMs();
    void loadWorkOrders();
  }, [loadBOMs, loadWorkOrders]);

  const getWorkOrderNumber = (wo: WorkOrder) =>
    wo.workOrderNo || wo.workOrderNumber || wo.orderNo || "";

  const openNewForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      bomNo: `BOM-${Date.now().toString().slice(-8)}`,
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const openEditForm = (bom: BOM) => {
    setEditingId(bom.id);
    setForm({
      bomNo: bom.bomNo,
      bomName: bom.bomName,
      project: bom.project || "",
      workOrderNo: bom.workOrderNo,
      status: bom.status || "Draft",
      notes: bom.notes || "",
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  };
  const saveBOM = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.workOrderNo) {
      setError("Please select a Work Order.");
      return;
    }

    try {
      await request(editingId ? `/bom/${editingId}` : "/bom", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form),
      });

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setSuccess("BOM saved successfully.");
      await loadBOMs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "BOM save failed");
    }
  };

  const deleteBOM = async (bom: BOM) => {
    if (!window.confirm(`Delete BOM ${bom.bomNo}?`)) return;

    try {
      await request(`/bom/${bom.id}`, { method: "DELETE" });
      setSuccess("BOM deleted successfully.");
      await loadBOMs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "BOM delete failed");
    }
  };

  const openMaterialForm = (bom: BOM) => {
    setSelectedBOM(bom);
    setMaterialForm({
      materialCode: "",
      materialName: "",
      requiredQty: "1",
      availableQty: "0",
      unit: "Pieces",
      unitCost: "0",
    });
    setShowMaterialForm(true);
    setError("");
  };

  const saveMaterial = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedBOM) return;

    const requiredQty = Number(materialForm.requiredQty);
    const availableQty = Number(materialForm.availableQty);
    const unitCost = Number(materialForm.unitCost);

    if (
      !materialForm.materialName.trim() ||
      !Number.isFinite(requiredQty) ||
      !Number.isFinite(availableQty) ||
      !Number.isFinite(unitCost) ||
      requiredQty < 0 ||
      availableQty < 0 ||
      unitCost < 0
    ) {
      setError("Please enter valid material details and quantities.");
      return;
    }

    try {
      await request("/material-requirements", {
        method: "POST",
        body: JSON.stringify({
          bomId: selectedBOM.id,
          ...materialForm,
          requiredQty,
          availableQty,
          unitCost,
        }),
      });

      setShowMaterialForm(false);
      setSelectedBOM(null);
      setSuccess("Material added successfully.");
      await loadBOMs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Material save failed");
    }
  };

  const deleteMaterial = async (material: Material) => {
    if (!window.confirm(`Delete ${material.materialName}?`)) return;

    try {
      await request(`/material-requirements/${material.id}`, {
        method: "DELETE",
      });
      setSuccess("Material deleted successfully.");
      await loadBOMs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Material delete failed");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Bill of Materials (BOM)</h1>
            <p className="text-sm text-gray-500">
              Manage Work Orders and required materials.
            </p>
          </div>

          <button
            type="button"
            onClick={openNewForm}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            + Create BOM
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-green-700">
            {success}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={saveBOM}
            className="space-y-4 rounded-xl border bg-white p-5"
          >
            <h2 className="text-lg font-semibold">
              {editingId ? "Edit BOM" : "Create BOM"}
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  BOM Number *
                </label>
                <input
                  required
                  value={form.bomNo}
                  onChange={(e) =>
                    setForm({ ...form, bomNo: e.target.value })
                  }
                  className="w-full rounded-lg border p-2"
                  placeholder="BOM-001"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  BOM Name *
                </label>
                <input
                  required
                  value={form.bomName}
                  onChange={(e) =>
                    setForm({ ...form, bomName: e.target.value })
                  }
                  className="w-full rounded-lg border p-2"
                  placeholder="Office Workstation BOM"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Work Order *
                </label>
                <select
                  required
                  value={form.workOrderNo}
                  onChange={(e) => {
                    const selected = workOrders.find(
                      (wo) => getWorkOrderNumber(wo) === e.target.value
                    );

                    setForm({
                      ...form,
                      workOrderNo: e.target.value,
                      project:
                        selected?.projectName ||
                        form.project,
                    });
                  }}
                  className="w-full rounded-lg border bg-white p-2"
                >
                  <option value="">-- Select Work Order --</option>
                  {workOrders.map((wo) => {
                    const number = getWorkOrderNumber(wo);
                    if (!number) return null;

                    return (
                      <option key={wo.id} value={number}>
                        {number}
                        {wo.projectName ? ` - ${wo.projectName}` : ""}
                        {wo.customerName ? ` (${wo.customerName})` : ""}
                      </option>
                    );
                  })}
                </select>

                {workOrders.length === 0 && (
                  <p className="mt-1 text-xs text-amber-700">
                    Work Orders दिसत नसतील तर backend API तपासा.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Project Name
                </label>
                <input
                  value={form.project}
                  onChange={(e) =>
                    setForm({ ...form, project: e.target.value })
                  }
                  className="w-full rounded-lg border p-2"
                  placeholder="Project name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                  className="w-full rounded-lg border bg-white p-2"
                >
                  <option value="Draft">Draft</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Notes
                </label>
                <input
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  className="w-full rounded-lg border p-2"
                  placeholder="Notes"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-white"
              >
                {editingId ? "Update BOM" : "Save BOM"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        {showMaterialForm && selectedBOM && (
          <form
            onSubmit={saveMaterial}
            className="space-y-4 rounded-xl border bg-white p-5"
          >
            <h2 className="text-lg font-semibold">
              Add Material — {selectedBOM.bomNo}
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                value={materialForm.materialCode}
                onChange={(e) =>
                  setMaterialForm({
                    ...materialForm,
                    materialCode: e.target.value,
                  })
                }
                className="rounded-lg border p-2"
                placeholder="Material Code"
              />

              <input
                required
                value={materialForm.materialName}
                onChange={(e) =>
                  setMaterialForm({
                    ...materialForm,
                    materialName: e.target.value,
                  })
                }
                className="rounded-lg border p-2"
                placeholder="Material Name *"
              />

              <input
                required
                type="number"
                min="0"
                step="any"
                value={materialForm.requiredQty}
                onChange={(e) =>
                  setMaterialForm({
                    ...materialForm,
                    requiredQty: e.target.value,
                  })
                }
                className="rounded-lg border p-2"
                placeholder="Required Quantity"
              />

              <input
                required
                type="number"
                min="0"
                step="any"
                value={materialForm.availableQty}
                onChange={(e) =>
                  setMaterialForm({
                    ...materialForm,
                    availableQty: e.target.value,
                  })
                }
                className="rounded-lg border p-2"
                placeholder="Available Quantity"
              />

              <select
                value={materialForm.unit}
                onChange={(e) =>
                  setMaterialForm({
                    ...materialForm,
                    unit: e.target.value,
                  })
                }
                className="rounded-lg border bg-white p-2"
              >
                <option value="Pieces">Pieces</option>
                <option value="NOS">NOS</option>
                <option value="SQFT">SQFT</option>
                <option value="SQM">SQM</option>
                <option value="RFT">RFT</option>
                <option value="RMT">RMT</option>
                <option value="SHEET">SHEET</option>
                <option value="KG">KG</option>
                <option value="SET">SET</option>
              </select>

              <input
                required
                type="number"
                min="0"
                step="any"
                value={materialForm.unitCost}
                onChange={(e) =>
                  setMaterialForm({
                    ...materialForm,
                    unitCost: e.target.value,
                  })
                }
                className="rounded-lg border p-2"
                placeholder="Unit Cost"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-white"
              >
                Save Material
              </button>
              <button
                type="button"
                onClick={() => setShowMaterialForm(false)}
                className="rounded-lg border px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">BOM No.</th>
                <th className="p-3">BOM Name</th>
                <th className="p-3">Work Order</th>
                <th className="p-3">Project</th>
                <th className="p-3">Status</th>
                <th className="p-3">Materials</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-5 text-center">
                    Loading...
                  </td>
                </tr>
              ) : boms.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-5 text-center text-gray-500"
                  >
                    No BOM records found.
                  </td>
                </tr>
              ) : (
                boms.map((bom) => (
                  <tr key={bom.id} className="border-t align-top">
                    <td className="p-3 font-medium">{bom.bomNo}</td>
                    <td className="p-3">{bom.bomName}</td>
                    <td className="p-3">{bom.workOrderNo}</td>
                    <td className="p-3">{bom.project || "-"}</td>
                    <td className="p-3">{bom.status}</td>

                    <td className="p-3">
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => openMaterialForm(bom)}
                          className="rounded border px-2 py-1 text-blue-700"
                        >
                          + Add Material
                        </button>

                        {(bom.materials || []).map((material) => {
                          const shortage = Math.max(
                            0,
                            material.requiredQty - material.availableQty
                          );

                          return (
                            <div
                              key={material.id}
                              className="rounded border p-2"
                            >
                              <div className="font-medium">
                                {material.materialName}
                              </div>
                              <div className="text-xs text-gray-600">
                                Required: {material.requiredQty}{" "}
                                {material.unit} | Available:{" "}
                                {material.availableQty} | Shortage:{" "}
                                {shortage}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  void deleteMaterial(material)
                                }
                                className="mt-1 text-xs text-red-600"
                              >
                                Delete Material
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    <td className="space-x-2 whitespace-nowrap p-3">
                      <button
                        type="button"
                        onClick={() => openEditForm(bom)}
                        className="rounded border px-2 py-1"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteBOM(bom)}
                        className="rounded border border-red-300 px-2 py-1 text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}