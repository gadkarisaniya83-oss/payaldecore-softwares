import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/erp/AppShell";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/vendors")({
  component: Vendors,
});

type Vendor = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gst: string;
  status: string;
};

const defaultVendors: Vendor[] = [
  {
    id: "VEN-001",
    name: "ABC Hardware",
    contactPerson: "Rahul Patil",
    phone: "9876543210",
    email: "abc@example.com",
    address: "Pune",
    gst: "27ABCDE1234F1Z5",
    status: "Active",
  },
  {
    id: "VEN-002",
    name: "XYZ Plywood",
    contactPerson: "Amit Shah",
    phone: "9876543211",
    email: "xyz@example.com",
    address: "Mumbai",
    gst: "27XYZDE5678G1Z2",
    status: "Active",
  },
];

function Vendors() {
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [gst, setGst] = useState("");
  const [status, setStatus] = useState("Active");

  const [editingVendorId, setEditingVendorId] = useState<string | null>(
    null
  );

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    if (typeof window === "undefined") {
      return defaultVendors;
    }

    const savedVendors = localStorage.getItem("vendors");

    if (!savedVendors) {
      return defaultVendors;
    }

    try {
      return JSON.parse(savedVendors);
    } catch {
      return defaultVendors;
    }
  });

  useEffect(() => {
    localStorage.setItem("vendors", JSON.stringify(vendors));
  }, [vendors]);

  const resetForm = () => {
    setName("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setAddress("");
    setGst("");
    setStatus("Active");
    setEditingVendorId(null);
    setShowForm(false);
  };

  const handleSaveVendor = () => {
    if (!name.trim() || !phone.trim()) {
      alert("Please fill Vendor Name and Phone Number.");
      return;
    }

    if (editingVendorId) {
      setVendors((prev) =>
        prev.map((vendor) =>
          vendor.id === editingVendorId
            ? {
                ...vendor,
                name: name.trim(),
                contactPerson: contactPerson.trim(),
                phone: phone.trim(),
                email: email.trim(),
                address: address.trim(),
                gst: gst.trim(),
                status,
              }
            : vendor
        )
      );

      alert("Vendor updated successfully!");
      resetForm();
      return;
    }

    const nextNumber =
      vendors.length > 0
        ? Math.max(
            ...vendors.map((vendor) =>
              Number(vendor.id.replace("VEN-", ""))
            )
          ) + 1
        : 1;

    const newVendor: Vendor = {
      id: `VEN-${String(nextNumber).padStart(3, "0")}`,
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      gst: gst.trim(),
      status,
    };

    setVendors((prev) => [...prev, newVendor]);

    alert("Vendor saved successfully!");

    resetForm();
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendorId(vendor.id);

    setName(vendor.name);
    setContactPerson(vendor.contactPerson);
    setPhone(vendor.phone);
    setEmail(vendor.email);
    setAddress(vendor.address);
    setGst(vendor.gst);
    setStatus(vendor.status);

    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this vendor?"
    );

    if (!confirmed) {
      return;
    }

    setVendors((prev) =>
      prev.filter((vendor) => vendor.id !== id)
    );

    alert("Vendor deleted successfully!");
  };

  const updateStatus = (id: string, newStatus: string) => {
    setVendors((prev) =>
      prev.map((vendor) =>
        vendor.id === id
          ? { ...vendor, status: newStatus }
          : vendor
      )
    );
  };

  return (
    <AppShell title="Vendors">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              Vendor Management
            </h2>

            <p className="text-sm text-muted-foreground">
              Manage your vendors and supplier information.
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            + New Vendor
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="rounded-lg border border-border bg-card p-6">

            <h3 className="mb-4 text-lg font-semibold">
              {editingVendorId
                ? "Edit Vendor"
                : "Create Vendor"}
            </h3>

            <div className="grid gap-4 md:grid-cols-2">

              {/* Vendor Name */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Vendor Name *
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter vendor name"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Contact Person
                </label>

                <input
                  value={contactPerson}
                  onChange={(e) =>
                    setContactPerson(e.target.value)
                  }
                  placeholder="Enter contact person"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Phone *
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </div>

              {/* GST */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  GST Number
                </label>

                <input
                  value={gst}
                  onChange={(e) => setGst(e.target.value)}
                  placeholder="Enter GST number"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm uppercase outline-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Address
                </label>

                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter vendor address"
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-5 flex gap-3">

              <button
                onClick={resetForm}
                className="rounded-md border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveVendor}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                {editingVendorId
                  ? "Update Vendor"
                  : "Save Vendor"}
              </button>

            </div>
          </div>
        )}

        {/* Vendor List */}
        <div className="rounded-lg border border-border bg-card p-6">

          <h3 className="mb-4 text-lg font-semibold">
            Vendors
          </h3>

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="border-b border-border text-left">

                  <th className="px-3 py-3">
                    Vendor ID
                  </th>

                  <th className="px-3 py-3">
                    Vendor Name
                  </th>

                  <th className="px-3 py-3">
                    Contact Person
                  </th>

                  <th className="px-3 py-3">
                    Phone
                  </th>

                  <th className="px-3 py-3">
                    GST
                  </th>

                  <th className="px-3 py-3">
                    Status
                  </th>

                  <th className="px-3 py-3">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {vendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="border-b border-border"
                  >

                    <td className="px-3 py-3">
                      {vendor.id}
                    </td>

                    <td className="px-3 py-3 font-medium">
                      {vendor.name}
                    </td>

                    <td className="px-3 py-3">
                      {vendor.contactPerson || "-"}
                    </td>

                    <td className="px-3 py-3">
                      {vendor.phone}
                    </td>

                    <td className="px-3 py-3">
                      {vendor.gst || "-"}
                    </td>

                    <td className="px-3 py-3">
                      <select
                        value={vendor.status}
                        onChange={(e) =>
                          updateStatus(
                            vendor.id,
                            e.target.value
                          )
                        }
                        className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      >
                        <option value="Active">
                          Active
                        </option>

                        <option value="Inactive">
                          Inactive
                        </option>
                      </select>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            handleEdit(vendor)
                          }
                          className="rounded-md border border-border px-3 py-1 text-sm"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(vendor.id)
                          }
                          className="rounded-md border border-destructive px-3 py-1 text-sm text-destructive"
                        >
                          Delete
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
}