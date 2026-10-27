import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/erp/AppShell";

export const Route = createFileRoute("/site-visit-measurement")({
  component: SiteVisitMeasurementPage,
});

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5001/api"
).replace(/\/+$/, "");

interface CustomerOption {
  id: string;
  name: string;
  company?: string;
  phone: string;
  address?: string;
  location?: string;
}

interface LeadOption {
  id: number;
  customerId?: string | null;
  customerName: string;
  companyName?: string;
  phone: string;
  requirement: string;
  status: string;
}

interface Measurement {
  id: string;
  visitId: string;
  customerId?: string | null;
  leadEnquiryId?: number | null;
  leadId?: string | null;
  customerName: string;
  projectName: string;
  siteAddress: string;
  visitDate: string;
  assignedTo: string;
  roomType: string;
  furnitureType: string;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  unit: string;
  customerNotes: string;
  remarks: string;
  status: string;
}

const emptyForm = {
  customerId: "",
  leadEnquiryId: "",
  customerName: "",
  projectName: "",
  siteAddress: "",
  visitDate: new Date().toISOString().slice(0, 10),
  assignedTo: "",
  roomType: "",
  furnitureType: "",
  lengthMm: "",
  widthMm: "",
  heightMm: "",
  unit: "mm",
  customerNotes: "",
  remarks: "",
  status: "Scheduled",
};

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

function SiteVisitMeasurementPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const loadMeasurements = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/site-measurements`);
      const data = await parseResponse(response);

      setMeasurements(
        Array.isArray(data) ? data : data.measurements ?? data.data ?? [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Site measurements did not load.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    const response = await fetch(`${API_BASE}/crm/customers`);
    const data = await parseResponse(response);
    setCustomers(
      Array.isArray(data) ? data : data.customers ?? data.data ?? [],
    );
  }, []);

  const loadLeads = useCallback(async () => {
    const response = await fetch(`${API_BASE}/lead-enquiries`);
    const data = await parseResponse(response);
    setLeads(Array.isArray(data) ? data : data.leads ?? data.data ?? []);
  }, []);

  const loadDropdowns = useCallback(async () => {
    try {
      await Promise.all([loadCustomers(), loadLeads()]);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Customer/Lead list did not load: ${err.message}`
          : "Customer/Lead list did not load.",
      );
    }
  }, [loadCustomers, loadLeads]);

  useEffect(() => {
    void loadMeasurements();
    void loadDropdowns();
  }, [loadMeasurements, loadDropdowns]);

  const filteredMeasurements = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return measurements;

    return measurements.filter((item) =>
      [
        item.visitId,
        item.customerName,
        item.projectName,
        item.siteAddress,
        item.roomType,
        item.furnitureType,
        item.assignedTo,
        item.status,
      ].some((value) => String(value ?? "").toLowerCase().includes(query)),
    );
  }, [measurements, search]);

  function setField<K extends keyof typeof emptyForm>(
    field: K,
    value: (typeof emptyForm)[K],
  ) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function selectCustomer(customerId: string) {
    const customer = customers.find((item) => item.id === customerId);

    setForm((previous) => ({
      ...previous,
      customerId,
      customerName: customer?.name ?? previous.customerName,
      siteAddress:
        customer?.address ||
        customer?.location ||
        previous.siteAddress,
      // Clear an existing lead if it belongs to a different customer.
      leadEnquiryId: (() => {
        if (!previous.leadEnquiryId) return "";
        const selectedLead = leads.find(
          (lead) => String(lead.id) === previous.leadEnquiryId,
        );
        if (
          selectedLead?.customerId &&
          selectedLead.customerId !== customerId
        ) {
          return "";
        }
        return previous.leadEnquiryId;
      })(),
    }));
  }

  function selectLead(leadIdValue: string) {
    const lead = leads.find(
      (item) => String(item.id) === leadIdValue,
    );

    if (!lead) {
      setForm((previous) => ({ ...previous, leadEnquiryId: "" }));
      return;
    }

    const linkedCustomer = lead.customerId
      ? customers.find((item) => item.id === lead.customerId)
      : undefined;

    setForm((previous) => ({
      ...previous,
      leadEnquiryId: String(lead.id),
      customerId: lead.customerId ?? previous.customerId,
      customerName: linkedCustomer?.name || lead.customerName,
      siteAddress:
        linkedCustomer?.address ||
        linkedCustomer?.location ||
        previous.siteAddress,
      projectName: previous.projectName || lead.requirement || "",
    }));
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEdit(item: Measurement) {
    setEditingId(item.id);
    setForm({
      customerId: item.customerId ?? "",
      leadEnquiryId:
        item.leadEnquiryId != null ? String(item.leadEnquiryId) : "",
      customerName: item.customerName ?? "",
      projectName: item.projectName ?? "",
      siteAddress: item.siteAddress ?? "",
      visitDate: item.visitDate ? String(item.visitDate).slice(0, 10) : "",
      assignedTo: item.assignedTo ?? "",
      roomType: item.roomType ?? "",
      furnitureType: item.furnitureType ?? "",
      lengthMm: item.lengthMm != null ? String(item.lengthMm) : "",
      widthMm: item.widthMm != null ? String(item.widthMm) : "",
      heightMm: item.heightMm != null ? String(item.heightMm) : "",
      unit: item.unit ?? "mm",
      customerNotes: item.customerNotes ?? "",
      remarks: item.remarks ?? "",
      status: item.status ?? "Scheduled",
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const selectedLead = leads.find(
        (lead) => String(lead.id) === form.leadEnquiryId,
      );

      if (
        selectedLead?.customerId &&
        form.customerId &&
        selectedLead.customerId !== form.customerId
      ) {
        throw new Error(
          "The selected Lead and Customer are not linked to each other. Please select the correct Customer.",
        );
      }

      const payload = {
        visitId:
          editingId
            ? measurements.find((item) => item.id === editingId)?.visitId
            : `SV-${Date.now()}`,
        customerId: form.customerId || null,
        leadEnquiryId: form.leadEnquiryId
          ? Number(form.leadEnquiryId)
          : null,
        // Kept for compatibility with the existing schema/UI.
        leadId: form.leadEnquiryId || null,
        customerName: form.customerName.trim(),
        projectName: form.projectName.trim() || null,
        siteAddress: form.siteAddress.trim(),
        visitDate: form.visitDate,
        assignedTo: form.assignedTo.trim() || null,
        roomType: form.roomType,
        furnitureType: form.furnitureType.trim() || null,
        lengthMm: form.lengthMm === "" ? null : Number(form.lengthMm),
        widthMm: form.widthMm === "" ? null : Number(form.widthMm),
        heightMm: form.heightMm === "" ? null : Number(form.heightMm),
        unit: form.unit,
        customerNotes: form.customerNotes.trim() || null,
        remarks: form.remarks.trim() || null,
        status: form.status,
      };

      const url = editingId
        ? `${API_BASE}/site-measurements/${encodeURIComponent(editingId)}`
        : `${API_BASE}/site-measurements`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await parseResponse(response);

      setSuccess(
        editingId
          ? "Site visit / measurement module has been completed and update."
          : "Site visit / measurement has been save.",
      );
      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });

      await loadMeasurements();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Site measurement did not save.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteMeasurement(item: Measurement) {
    if (!window.confirm(`${item.visitId} should i delete it?`)) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE}/site-measurements/${encodeURIComponent(item.id)}`,
        { method: "DELETE" },
      );

      await parseResponse(response);
      setSuccess("Site measurement has been deleted.");
      await loadMeasurements();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Site measurement data has not been deleted.",
      );
    }
  }

  return (
    <AppShell title="Site Visit / Measurement">
      <div className="space-y-5 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Site Visit / Measurement
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              CRM Customer and Lead / Enquiry site is linked.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                void loadMeasurements();
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
              Add Site Visit
            </button>
          </div>
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

        {showForm && (
          <section className="rounded-xl border bg-white p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Site Visit" : "Create Site Visit"}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
                className="rounded p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="space-y-1 text-sm">
                  <span>CRM Customer *</span>
                  <select
                    className={inputClass}
                    required
                    value={form.customerId}
                    onChange={(e) => selectCustomer(e.target.value)}
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} — {customer.phone}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span>Linked Lead / Enquiry</span>
                  <select
                    className={inputClass}
                    value={form.leadEnquiryId}
                    onChange={(e) => selectLead(e.target.value)}
                  >
                    <option value="">No linked lead</option>
                    {leads
                      .filter(
                        (lead) =>
                          !lead.customerId ||
                          !form.customerId ||
                          lead.customerId === form.customerId,
                      )
                      .map((lead) => (
                        <option key={lead.id} value={String(lead.id)}>
                          #{lead.id} — {lead.customerName} ({lead.status})
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
                    onChange={(e) => setField("customerName", e.target.value)}
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Project Name / Requirement</span>
                  <input
                    className={inputClass}
                    value={form.projectName}
                    onChange={(e) => setField("projectName", e.target.value)}
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Site Address *</span>
                  <input
                    className={inputClass}
                    required
                    value={form.siteAddress}
                    onChange={(e) => setField("siteAddress", e.target.value)}
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Visit Date *</span>
                  <input
                    className={inputClass}
                    type="date"
                    required
                    value={form.visitDate}
                    onChange={(e) => setField("visitDate", e.target.value)}
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Assigned To</span>
                  <input
                    className={inputClass}
                    value={form.assignedTo}
                    onChange={(e) => setField("assignedTo", e.target.value)}
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Room Type *</span>
                  <select
                    className={inputClass}
                    required
                    value={form.roomType}
                    onChange={(e) => setField("roomType", e.target.value)}
                  >
                    <option value="">Select Room Type</option>
                    <option>Kitchen</option>
                    <option>Bedroom</option>
                    <option>Living Room</option>
                    <option>Bathroom</option>
                    <option>Office</option>
                    <option>Full Home</option>
                    <option>Other</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span>Furniture Type</span>
                  <input
                    className={inputClass}
                    value={form.furnitureType}
                    onChange={(e) => setField("furnitureType", e.target.value)}
                    placeholder="Wardrobe, modular kitchen..."
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Length</span>
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="any"
                    value={form.lengthMm}
                    onChange={(e) => setField("lengthMm", e.target.value)}
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Width</span>
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="any"
                    value={form.widthMm}
                    onChange={(e) => setField("widthMm", e.target.value)}
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Height</span>
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="any"
                    value={form.heightMm}
                    onChange={(e) => setField("heightMm", e.target.value)}
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Measurement Unit</span>
                  <select
                    className={inputClass}
                    value={form.unit}
                    onChange={(e) => setField("unit", e.target.value)}
                  >
                    <option value="mm">Millimetres (mm)</option>
                    <option value="cm">Centimetres (cm)</option>
                    <option value="ft">Feet (ft)</option>
                    <option value="inch">Inches</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span>Status</span>
                  <select
                    className={inputClass}
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value)}
                  >
                    <option>Scheduled</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Rescheduled</option>
                    <option>Cancelled</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-1 text-sm">
                <span>Customer Notes</span>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={form.customerNotes}
                  onChange={(e) => setField("customerNotes", e.target.value)}
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span>Remarks</span>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={form.remarks}
                  onChange={(e) => setField("remarks", e.target.value)}
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
                      ? "Update Measurement"
                      : "Save Measurement"}
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

        <section className="overflow-hidden rounded-xl border bg-white">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold">Site Visit Records</h2>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                className={`${inputClass} pl-9`}
                placeholder="Search site visits..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-gray-500">Loading site visits...</p>
          ) : filteredMeasurements.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              No site visit records found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3">Visit ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Project / Requirement</th>
                    <th className="p-3">Site Address</th>
                    <th className="p-3">Visit Date</th>
                    <th className="p-3">Room</th>
                    <th className="p-3">Dimensions</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMeasurements.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{item.visitId}</td>
                      <td className="p-3">
                        <div>{item.customerName}</div>
                        <div className="text-xs text-gray-500">
                          {item.leadEnquiryId != null
                            ? `Lead #${item.leadEnquiryId}`
                            : item.customerId
                              ? "CRM linked"
                              : "Not linked"}
                        </div>
                      </td>
                      <td className="p-3">{item.projectName || "—"}</td>
                      <td className="max-w-xs p-3">{item.siteAddress}</td>
                      <td className="p-3">
                        {item.visitDate
                          ? String(item.visitDate).slice(0, 10)
                          : "—"}
                      </td>
                      <td className="p-3">{item.roomType}</td>
                      <td className="p-3">
                        {item.lengthMm ?? "—"} × {item.widthMm ?? "—"} ×{" "}
                        {item.heightMm ?? "—"} {item.unit}
                      </td>
                      <td className="p-3">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            aria-label="Edit measurement"
                            onClick={() => openEdit(item)}
                            className="rounded p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete measurement"
                            onClick={() => void deleteMeasurement(item)}
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