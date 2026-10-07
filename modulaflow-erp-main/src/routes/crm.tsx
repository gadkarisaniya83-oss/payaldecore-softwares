import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  UserPlus,
  Users,
  Pencil,
  Trash2,
  Eye,
  X,
  RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/erp/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crm")({
  head: () => ({
    meta: [
      {
        title: "CRM | Payal Decor ERP",
      },
      {
        name: "description",
        content:
          "Manage leads, customers, contacts and follow-ups for Payal Decor ERP.",
      },
    ],
  }),
  component: CRM,
});

// ======================================================
// TYPES
// ======================================================

type CustomerStatus = "Lead" | "Active" | "Inactive";

type Customer = {
  id: string;

  name: string;
  company: string;
  phone: string;
  email: string;
  location: string;

  status: CustomerStatus;

  projects: number;
  businessValue: string;

  gstin: string;
  address: string;
  state: string;
  pincode: string;
  contactPerson: string;
  notes: string;

  createdAt?: string;
  updatedAt?: string;
};

type CustomerForm = {
  name: string;
  company: string;
  phone: string;
  email: string;
  location: string;
  status: CustomerStatus;

  gstin: string;
  address: string;
  state: string;
  pincode: string;
  contactPerson: string;
  notes: string;

  businessValue: string;
};

// ======================================================
// API
// ======================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

// ======================================================
// EMPTY FORM
// ======================================================

const emptyForm: CustomerForm = {
  name: "",
  company: "",
  phone: "",
  email: "",
  location: "",
  status: "Active",

  gstin: "",
  address: "",
  state: "",
  pincode: "",
  contactPerson: "",
  notes: "",

  businessValue: "",
};

// ======================================================
// CRM COMPONENT
// ======================================================

function CRM() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [status, setStatus] =
    useState<CustomerStatus | "All">("All");

  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  // ----------------------------------------------------
  // MODALS
  // ----------------------------------------------------

  const [showForm, setShowForm] = useState(false);

  const [showView, setShowView] = useState(false);

  const [showDelete, setShowDelete] = useState(false);

  // ----------------------------------------------------
  // SELECTED RECORDS
  // ----------------------------------------------------

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [viewingCustomer, setViewingCustomer] =
    useState<Customer | null>(null);

  const [deletingCustomer, setDeletingCustomer] =
    useState<Customer | null>(null);

  // ----------------------------------------------------
  // FORM
  // ----------------------------------------------------

  const [form, setForm] =
    useState<CustomerForm>(emptyForm);

  // ====================================================
  // LOAD CUSTOMERS
  // ====================================================

  async function loadCustomers() {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/crm/customers`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load customers",
        );
      }

      setCustomers(data.customers || []);

    } catch (error) {
      console.error(
        "❌ Error loading CRM customers:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load customers from database.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    loadCustomers();
  }, []);

  // ====================================================
  // FILTER CUSTOMERS
  // ====================================================

  const filtered = useMemo(() => {
    const search = query
      .trim()
      .toLowerCase();

    return customers.filter((customer) => {
      const matchesStatus =
        status === "All" ||
        customer.status === status;

      const searchText = `
        ${customer.name}
        ${customer.company}
        ${customer.phone}
        ${customer.email}
        ${customer.location}
        ${customer.contactPerson}
      `.toLowerCase();

      const matchesSearch =
        !search ||
        searchText.includes(search);

      return (
        matchesStatus &&
        matchesSearch
      );
    });
  }, [customers, query, status]);

  // ====================================================
  // SUMMARY
  // ====================================================

  const totalCustomers =
    customers.length;

  const activeLeads =
    customers.filter(
      (customer) =>
        customer.status === "Lead",
    ).length;

  const activeAccounts =
    customers.filter(
      (customer) =>
        customer.status === "Active",
    ).length;

  // ====================================================
  // ADD CUSTOMER
  // ====================================================

  function openAddCustomer() {
    setEditingCustomer(null);

    setForm({
      ...emptyForm,
      status: "Active",
    });

    setShowForm(true);
  }

  // ====================================================
  // ADD LEAD
  // ====================================================

  function openAddLead() {
    setEditingCustomer(null);

    setForm({
      ...emptyForm,
      status: "Lead",
    });

    setShowForm(true);
  }

  // ====================================================
  // EDIT
  // ====================================================

  function openEdit(customer: Customer) {
    setEditingCustomer(customer);

    setForm({
      name: customer.name || "",
      company: customer.company || "",
      phone: customer.phone || "",
      email: customer.email || "",
      location: customer.location || "",

      status: customer.status,

      gstin: customer.gstin || "",
      address: customer.address || "",
      state: customer.state || "",
      pincode: customer.pincode || "",
      contactPerson:
        customer.contactPerson || "",
      notes: customer.notes || "",

      businessValue:
        customer.businessValue || "",
    });

    setShowForm(true);
  }

  // ====================================================
  // SAVE CUSTOMER
  // ====================================================

  async function saveCustomer() {
    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!form.name.trim()) {
      alert("Please enter customer name.");
      return;
    }

    if (!form.company.trim()) {
      alert("Please enter company name.");
      return;
    }

    if (!form.phone.trim()) {
      alert("Please enter phone number.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        company: form.company.trim(),
        phone: form.phone.trim(),

        email: form.email.trim(),
        location: form.location.trim(),

        status: form.status,

        gstin: form.gstin.trim(),
        address: form.address.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),

        contactPerson:
          form.contactPerson.trim(),

        notes: form.notes.trim(),

        projects: 0,

        businessValue:
          Number(form.businessValue) || 0,
      };

      // ------------------------------------------------
      // CREATE OR UPDATE
      // ------------------------------------------------

      const url = editingCustomer
        ? `${API_URL}/crm/customers/${editingCustomer.id}`
        : `${API_URL}/crm/customers`;

      const method = editingCustomer
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(payload),
      });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save customer",
        );
      }

      alert(
        editingCustomer
          ? "Customer updated successfully!"
          : form.status === "Lead"
            ? "Lead added successfully!"
            : "Customer added successfully!",
      );

      // ------------------------------------------------
      // CLOSE MODAL
      // ------------------------------------------------

      setShowForm(false);

      setEditingCustomer(null);

      setForm({
        ...emptyForm,
      });

      // ------------------------------------------------
      // REFRESH DATABASE DATA
      // ------------------------------------------------

      await loadCustomers();

    } catch (error) {
      console.error(
        "❌ Error saving customer:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save customer.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ====================================================
  // DELETE
  // ====================================================

  async function deleteCustomer() {
    if (!deletingCustomer) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `${API_URL}/crm/customers/${deletingCustomer.id}`,
        {
          method: "DELETE",
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete customer",
        );
      }

      alert(
        "Customer deleted successfully!",
      );

      setShowDelete(false);

      setDeletingCustomer(null);

      await loadCustomers();

    } catch (error) {
      console.error(
        "❌ Error deleting customer:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete customer.",
      );
    } finally {
      setDeleting(false);
    }
  }

  // ====================================================
  // CLOSE FORM
  // ====================================================

  function closeForm() {
    if (saving) return;

    setShowForm(false);

    setEditingCustomer(null);

    setForm({
      ...emptyForm,
    });
  }

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <AppShell title="CRM">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">

        <div>
          <p className="text-sm text-muted-foreground">
            Customer relationship management
          </p>

          <h2 className="text-2xl font-semibold">
            Customers & Leads
          </h2>
        </div>

        <div className="flex gap-2">

          <Button
            variant="outline"
            onClick={openAddLead}
          >
            <UserPlus />
            Add Lead
          </Button>

          <Button
            onClick={openAddCustomer}
          >
            <Plus />
            Add Customer
          </Button>

        </div>
      </div>

      {/* ==================================================
          SUMMARY CARDS
      ================================================== */}

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">

        <Summary
          icon={Users}
          label="Total Customers"
          value={String(totalCustomers)}
        />

        <Summary
          icon={UserPlus}
          label="Active Leads"
          value={String(activeLeads)}
        />

        <Summary
          icon={Building2}
          label="Active Accounts"
          value={String(activeAccounts)}
        />

      </div>

      {/* ==================================================
          SEARCH + FILTER
      ================================================== */}

      <div className="mb-4 flex flex-wrap gap-2">

        <div className="flex min-w-64 flex-1 items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm">

          <Search className="size-4 text-muted-foreground" />

          <input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="Search customers, companies or contacts..."
            className="w-full bg-transparent outline-none"
          />

        </div>

        {(
          [
            "All",
            "Lead",
            "Active",
            "Inactive",
          ] as const
        ).map((item) => (

          <button
            key={item}
            onClick={() =>
              setStatus(item)
            }
            className={cn(
              "rounded-lg border px-3 py-2 text-sm",

              status === item
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-muted",
            )}
          >
            {item}
          </button>

        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={loadCustomers}
          disabled={loading}
        >
          <RefreshCw
            className={cn(
              loading && "animate-spin",
            )}
          />
          Refresh
        </Button>

      </div>

      {/* ==================================================
          LOADING
      ================================================== */}

      {loading && (
        <div className="rounded-xl border border-dashed p-10 text-center">

          <RefreshCw className="mx-auto size-6 animate-spin text-primary" />

          <p className="mt-3 font-medium">
            Loading customers...
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Fetching CRM data from PostgreSQL.
          </p>

        </div>
      )}

      {/* ==================================================
          CUSTOMER LIST
      ================================================== */}

      {!loading && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

          {filtered.map((customer) => (

            <article
              key={customer.id}
              className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            >

              {/* ------------------------------------------
                  CARD HEADER
              ------------------------------------------ */}

              <div className="flex items-start justify-between gap-3">

                <div>

                  <p className="text-xs text-muted-foreground">
                    {customer.company}
                  </p>

                  <h3 className="mt-1 text-base font-semibold">
                    {customer.name}
                  </h3>

                </div>

                <Status
                  status={customer.status}
                />

              </div>

              {/* ------------------------------------------
                  CUSTOMER INFORMATION
              ------------------------------------------ */}

              <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">

                <Info
                  icon={Phone}
                  label="Phone"
                  value={
                    customer.phone ||
                    "—"
                  }
                />

                <Info
                  icon={Mail}
                  label="Email"
                  value={
                    customer.email ||
                    "—"
                  }
                />

                <Info
                  icon={MapPin}
                  label="Location"
                  value={
                    customer.location ||
                    "—"
                  }
                />

                <Info
                  icon={Building2}
                  label="Projects"
                  value={`${customer.projects || 0} projects`}
                />

              </div>

              {/* ------------------------------------------
                  BUSINESS VALUE + ACTIONS
              ------------------------------------------ */}

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">

                <div>

                  <p className="text-[11px] text-muted-foreground">
                    Business value
                  </p>

                  <p className="text-sm font-semibold">
                    ₹
                    {Number(
                      customer.businessValue ||
                        0,
                    ).toLocaleString(
                      "en-IN",
                    )}
                  </p>

                </div>

                <div className="flex flex-wrap gap-2">

                  {/* VIEW */}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewingCustomer(
                        customer,
                      );

                      setShowView(true);
                    }}
                  >
                    <Eye />
                    View
                  </Button>

                  {/* EDIT */}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      openEdit(customer)
                    }
                  >
                    <Pencil />
                    Edit
                  </Button>

                  {/* DELETE */}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeletingCustomer(
                        customer,
                      );

                      setShowDelete(true);
                    }}
                  >
                    <Trash2 />
                    Delete
                  </Button>

                </div>

              </div>

            </article>

          ))}

        </div>
      )}

      {/* ==================================================
          NO RECORDS
      ================================================== */}

      {!loading &&
        filtered.length === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center">

            <Users className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-3 font-medium">
              No customers found
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {customers.length === 0
                ? "No CRM customers are available yet. Add a customer or lead to get started."
                : "Try changing the search or filter."}
            </p>

            {customers.length === 0 && (
              <div className="mt-4 flex justify-center gap-2">

                <Button
                  variant="outline"
                  onClick={openAddLead}
                >
                  <UserPlus />
                  Add Lead
                </Button>

                <Button
                  onClick={openAddCustomer}
                >
                  <Plus />
                  Add Customer
                </Button>

              </div>
            )}

          </div>
        )}

      {/* ==================================================
          ADD / EDIT CUSTOMER DIALOG
      ================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border bg-background shadow-xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-5">

              <div>

                <h3 className="text-lg font-semibold">

                  {editingCustomer
                    ? "Edit Customer"
                    : form.status === "Lead"
                      ? "Add Lead"
                      : "Add Customer"}

                </h3>

                <p className="text-sm text-muted-foreground">
                  Enter customer and contact information.
                </p>

              </div>

              <button
                onClick={closeForm}
                disabled={saving}
                className="rounded-md p-2 hover:bg-muted disabled:opacity-50"
              >
                <X className="size-5" />
              </button>

            </div>

            {/* FORM */}

            <div className="grid gap-4 p-5 md:grid-cols-2">

              <Field
                label="Customer Name *"
                value={form.name}
                onChange={(value) =>
                  setForm({
                    ...form,
                    name: value,
                  })
                }
              />

              <Field
                label="Company Name *"
                value={form.company}
                onChange={(value) =>
                  setForm({
                    ...form,
                    company: value,
                  })
                }
              />

              <Field
                label="Phone *"
                value={form.phone}
                onChange={(value) =>
                  setForm({
                    ...form,
                    phone: value,
                  })
                }
              />

              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) =>
                  setForm({
                    ...form,
                    email: value,
                  })
                }
              />

              <Field
                label="Contact Person"
                value={form.contactPerson}
                onChange={(value) =>
                  setForm({
                    ...form,
                    contactPerson: value,
                  })
                }
              />

              <Field
                label="GSTIN"
                value={form.gstin}
                onChange={(value) =>
                  setForm({
                    ...form,
                    gstin: value,
                  })
                }
              />

              <Field
                label="Business Value"
                type="number"
                value={
                  form.businessValue
                }
                onChange={(value) =>
                  setForm({
                    ...form,
                    businessValue: value,
                  })
                }
              />

              <Field
                label="City"
                value={form.location}
                onChange={(value) =>
                  setForm({
                    ...form,
                    location: value,
                  })
                }
              />

              <Field
                label="State"
                value={form.state}
                onChange={(value) =>
                  setForm({
                    ...form,
                    state: value,
                  })
                }
              />

              <Field
                label="Pincode"
                value={form.pincode}
                onChange={(value) =>
                  setForm({
                    ...form,
                    pincode: value,
                  })
                }
              />

              {/* STATUS */}

              <div>

                <label className="mb-1.5 block text-sm font-medium">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status:
                        e.target.value as CustomerStatus,
                    })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="Lead">
                    Lead
                  </option>

                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
                </select>

              </div>

              {/* ADDRESS */}

              <div className="md:col-span-2">

                <label className="mb-1.5 block text-sm font-medium">
                  Address
                </label>

                <textarea
                  value={form.address}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address:
                        e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Enter full address"
                />

              </div>

              {/* NOTES */}

              <div className="md:col-span-2">

                <label className="mb-1.5 block text-sm font-medium">
                  Notes
                </label>

                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes:
                        e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Additional notes"
                />

              </div>

            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-2 border-t p-5">

              <Button
                variant="outline"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                onClick={saveCustomer}
                disabled={saving}
              >

                {saving && (
                  <RefreshCw className="animate-spin" />
                )}

                {saving
                  ? "Saving..."
                  : editingCustomer
                    ? "Update Customer"
                    : form.status === "Lead"
                      ? "Save Lead"
                      : "Save Customer"}

              </Button>

            </div>

          </div>

        </div>
      )}

      {/* ==================================================
          VIEW CUSTOMER
      ================================================== */}

      {showView &&
        viewingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-background shadow-xl">

              {/* HEADER */}

              <div className="flex items-center justify-between border-b p-5">

                <div>

                  <h3 className="text-lg font-semibold">
                    Customer Details
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    {
                      viewingCustomer.company
                    }
                  </p>

                </div>

                <button
                  onClick={() =>
                    setShowView(false)
                  }
                  className="rounded-md p-2 hover:bg-muted"
                >
                  <X className="size-5" />
                </button>

              </div>

              {/* DETAILS */}

              <div className="grid gap-4 p-5 md:grid-cols-2">

                <Detail
                  label="Customer Name"
                  value={
                    viewingCustomer.name
                  }
                />

                <Detail
                  label="Company"
                  value={
                    viewingCustomer.company
                  }
                />

                <Detail
                  label="Phone"
                  value={
                    viewingCustomer.phone ||
                    "—"
                  }
                />

                <Detail
                  label="Email"
                  value={
                    viewingCustomer.email ||
                    "—"
                  }
                />

                <Detail
                  label="Contact Person"
                  value={
                    viewingCustomer.contactPerson ||
                    "—"
                  }
                />

                <Detail
                  label="GSTIN"
                  value={
                    viewingCustomer.gstin ||
                    "—"
                  }
                />

                <Detail
                  label="Business Value"
                  value={`₹${Number(
                    viewingCustomer.businessValue ||
                      0,
                  ).toLocaleString(
                    "en-IN",
                  )}`}
                />

                <Detail
                  label="Projects"
                  value={`${viewingCustomer.projects || 0}`}
                />

                <Detail
                  label="City"
                  value={
                    viewingCustomer.location ||
                    "—"
                  }
                />

                <Detail
                  label="State"
                  value={
                    viewingCustomer.state ||
                    "—"
                  }
                />

                <Detail
                  label="Pincode"
                  value={
                    viewingCustomer.pincode ||
                    "—"
                  }
                />

                <Detail
                  label="Status"
                  value={
                    viewingCustomer.status
                  }
                />

                <div className="md:col-span-2">

                  <Detail
                    label="Address"
                    value={
                      viewingCustomer.address ||
                      "—"
                    }
                  />

                </div>

                <div className="md:col-span-2">

                  <Detail
                    label="Notes"
                    value={
                      viewingCustomer.notes ||
                      "—"
                    }
                  />

                </div>

              </div>

              {/* FOOTER */}

              <div className="flex justify-end border-t p-5">

                <Button
                  onClick={() =>
                    setShowView(false)
                  }
                >
                  Close
                </Button>

              </div>

            </div>

          </div>
        )}

      {/* ==================================================
          DELETE CONFIRMATION
      ================================================== */}

      {showDelete &&
        deletingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">

              <h3 className="text-lg font-semibold">
                Delete Customer?
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">

                Are you sure you want to delete{" "}

                <strong>
                  {deletingCustomer.name}
                </strong>

                ?

                <br />

                This action cannot be undone.

              </p>

              <div className="mt-6 flex justify-end gap-2">

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDelete(false);
                    setDeletingCustomer(null);
                  }}
                  disabled={deleting}
                >
                  Cancel
                </Button>

                <Button
                  variant="destructive"
                  onClick={
                    deleteCustomer
                  }
                  disabled={deleting}
                >

                  {deleting && (
                    <RefreshCw className="animate-spin" />
                  )}

                  {deleting
                    ? "Deleting..."
                    : "Delete"}

                </Button>

              </div>

            </div>

          </div>
        )}

    </AppShell>
  );
}

// ======================================================
// FIELD COMPONENT
// ======================================================

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>

      <label className="mb-1.5 block text-sm font-medium">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />

    </div>
  );
}

// ======================================================
// DETAIL COMPONENT
// ======================================================

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium">
        {value}
      </p>

    </div>
  );
}

// ======================================================
// SUMMARY COMPONENT
// ======================================================

function Summary({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">

      <div className="flex items-center gap-3">

        <div className="rounded-lg bg-primary/10 p-2">

          <Icon className="size-5 text-primary" />

        </div>

        <div>

          <p className="text-xs text-muted-foreground">
            {label}
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}

// ======================================================
// INFO COMPONENT
// ======================================================

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-2">

      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />

      <div className="min-w-0">

        <p className="text-[11px] text-muted-foreground">
          {label}
        </p>

        <p className="truncate text-sm">
          {value}
        </p>

      </div>

    </div>
  );
}

// ======================================================
// STATUS COMPONENT
// ======================================================

function Status({
  status,
}: {
  status: CustomerStatus;
}) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-1 text-xs font-medium",

        status === "Active"
          ? "bg-success/15 text-success"

          : status === "Lead"
            ? "bg-info/15 text-info"

            : "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}