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

export const Route = createFileRoute("/lead-enquiry")({
  component: LeadEnquiryPage,
});

const API_BASE = (
  import.meta.env["VITE_API_URL"] || "http://localhost:5001/api"
).replace(/\/+$/, "");

type LeadStatus =
  | "New"
  | "Contacted"
  | "Follow-up"
  | "Converted"
  | "Lost";

interface CustomerOption {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
}

interface Lead {
  id: number;
  customerId?: string | null;
  customerName: string;
  companyName: string;
  phone: string;
  email: string;
  source: string;
  requirement: string;
  budget: string;
  followUpDate: string;
  priority: string;
  status: LeadStatus;
}

const emptyForm = {
  customerId: "",
  customerName: "",
  companyName: "",
  phone: "",
  email: "",
  source: "Direct",
  requirement: "",
  budget: "",
  followUpDate: "",
  priority: "Medium",
  status: "New" as LeadStatus,
};

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

function LeadEnquiryPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/lead-enquiries`);
      const data = await parseResponse(response);
      setLeads(Array.isArray(data) ? data : data.leads ?? data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Leads did not load.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/crm/customers`);
      const data = await parseResponse(response);
      setCustomers(Array.isArray(data) ? data : data.customers ?? data.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? `CRM customers did not load: ${err.message}`
          : "CRM customers did not load.",
      );
    }
  }, []);

  useEffect(() => {
    void loadLeads();
    void loadCustomers();
  }, [loadLeads, loadCustomers]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch =
        !query ||
        [
          lead.customerName,
          lead.companyName,
          lead.phone,
          lead.email,
          lead.requirement,
          lead.source,
        ].some((value) => String(value ?? "").toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "All" || lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

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
      companyName: customer?.company ?? previous.companyName,
      phone: customer?.phone ?? previous.phone,
      email: customer?.email ?? previous.email,
    }));
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEdit(lead: Lead) {
    setEditingId(lead.id);
    setForm({
      customerId: lead.customerId ?? "",
      customerName: lead.customerName ?? "",
      companyName: lead.companyName ?? "",
      phone: lead.phone ?? "",
      email: lead.email ?? "",
      source: lead.source ?? "Direct",
      requirement: lead.requirement ?? "",
      budget: lead.budget ?? "",
      followUpDate: lead.followUpDate
        ? String(lead.followUpDate).slice(0, 10)
        : "",
      priority: lead.priority ?? "Medium",
      status: lead.status ?? "New",
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
      const url = editingId
        ? `${API_BASE}/lead-enquiries/${editingId}`
        : `${API_BASE}/lead-enquiries`;

      const payload = {
        ...form,
        customerId: form.customerId || null,
        followUpDate: form.followUpDate || null,
      };

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await parseResponse(response);

      setSuccess(editingId ? "Lead is update ." : "Lead is save.");
      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });

      await loadLeads();
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lead did not save.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLead(lead: Lead) {
    if (!window.confirm(`${lead.customerName} should this lead be deleted?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE}/lead-enquiries/${lead.id}`,
        { method: "DELETE" },
      );
      await parseResponse(response);
      setSuccess("Lead is delete.");
      await loadLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lead did not delete.");
    }
  }

  return (
    <AppShell title="Lead / Enquiry">
      <div className="space-y-5 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lead / Enquiry</h1>
            <p className="mt-1 text-sm text-gray-500">
              Record the enquiries and link them to the CRM customers.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                void loadLeads();
                void loadCustomers();
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
              Add Enquiry
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
                {editingId ? "Edit Enquiry" : "Create Enquiry"}
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
                  <span>Link CRM Customer</span>
                  <select
                    className={inputClass}
                    value={form.customerId}
                    onChange={(e) => selectCustomer(e.target.value)}
                  >
                    <option value="">Select customer (optional)</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} — {customer.phone}
                      </option>
                    ))}
                  </select>
                  <span className="block text-xs text-gray-500">
                    Customer निवडल्यावर नाव, phone आणि email भरले जातील.
                  </span>
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
                  <span>Company Name</span>
                  <input
                    className={inputClass}
                    value={form.companyName}
                    onChange={(e) => setField("companyName", e.target.value)}
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Phone *</span>
                  <input
                    className={inputClass}
                    required
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Email</span>
                  <input
                    className={inputClass}
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Enquiry Source</span>
                  <select
                    className={inputClass}
                    value={form.source}
                    onChange={(e) => setField("source", e.target.value)}
                  >
                    <option>Direct</option>
                    <option>Website</option>
                    <option>Phone</option>
                    <option>Referral</option>
                    <option>Social Media</option>
                    <option>Other</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span>Budget</span>
                  <input
                    className={inputClass}
                    value={form.budget}
                    onChange={(e) => setField("budget", e.target.value)}
                    placeholder="e.g. 50000"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Follow-up Date</span>
                  <input
                    className={inputClass}
                    type="date"
                    value={form.followUpDate}
                    onChange={(e) => setField("followUpDate", e.target.value)}
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Priority</span>
                  <select
                    className={inputClass}
                    value={form.priority}
                    onChange={(e) => setField("priority", e.target.value)}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span>Status</span>
                  <select
                    className={inputClass}
                    value={form.status}
                    onChange={(e) =>
                      setField("status", e.target.value as LeadStatus)
                    }
                  >
                    <option>New</option>
                    <option>Contacted</option>
                    <option>Follow-up</option>
                    <option>Converted</option>
                    <option>Lost</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-1 text-sm">
                <span>Requirement *</span>
                <textarea
                  className={inputClass}
                  required
                  rows={3}
                  value={form.requirement}
                  onChange={(e) => setField("requirement", e.target.value)}
                  placeholder="Customer requirement / furniture details"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update Enquiry" : "Save Enquiry"}
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
          <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
            <h2 className="font-semibold">Enquiry Records</h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  className={`${inputClass} pl-9 sm:w-64`}
                  placeholder="Search enquiries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className={inputClass}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All</option>
                <option>New</option>
                <option>Contacted</option>
                <option>Follow-up</option>
                <option>Converted</option>
                <option>Lost</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-gray-500">Loading enquiries...</p>
          ) : filteredLeads.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No enquiries found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Requirement</th>
                    <th className="p-3">Budget</th>
                    <th className="p-3">Follow-up</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{lead.customerName}</div>
                        <div className="text-xs text-gray-500">
                          {lead.companyName || "No company"}
                          {lead.customerId ? " · CRM linked" : " · Not linked"}
                        </div>
                      </td>
                      <td className="p-3">{lead.phone}</td>
                      <td className="max-w-xs p-3">{lead.requirement}</td>
                      <td className="p-3">{lead.budget || "—"}</td>
                      <td className="p-3">
                        {lead.followUpDate
                          ? String(lead.followUpDate).slice(0, 10)
                          : "—"}
                      </td>
                      <td className="p-3">{lead.priority}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            aria-label="Edit lead"
                            onClick={() => openEdit(lead)}
                            className="rounded p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete lead"
                            onClick={() => void deleteLead(lead)}
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