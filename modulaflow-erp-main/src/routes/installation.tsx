import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/erp/AppShell";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Plus, Pencil, Trash2, Wrench, X } from "lucide-react";

export const Route = createFileRoute("/installation")({
  component: Installation,
});

type InstallationStatus = "Pending" | "In Progress" | "Completed" | "Cancelled";

type InstallationRecord = {
  id: number;
  installationId: string;
  workOrder: string;
  customerName: string;
  siteName: string;
  installer: string;
  installationDate: string;
  status: InstallationStatus;
  remarks: string;
};

const emptyForm = {
  workOrder: "",
  customerName: "",
  siteName: "",
  installer: "",
  installationDate: "",
  status: "Pending" as InstallationStatus,
  remarks: "",
};

function Installation() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [records, setRecords] = useState<InstallationRecord[]>(() => {
    try {
      const saved = localStorage.getItem("installationRecords");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    localStorage.setItem("installationRecords", JSON.stringify(records));
  }, [records]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (record: InstallationRecord) => {
    setEditingId(record.id);

    setForm({
      workOrder: record.workOrder,
      customerName: record.customerName,
      siteName: record.siteName,
      installer: record.installer,
      installationDate: record.installationDate,
      status: record.status,
      remarks: record.remarks,
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (
      !form.workOrder ||
      !form.customerName ||
      !form.installationDate
    ) {
      alert(
        "Please fill Work Order, Customer Name and Installation Date.",
      );
      return;
    }

    // UPDATE
    if (editingId !== null) {
      setRecords((prev) =>
        prev.map((record) =>
          record.id === editingId
            ? {
                ...record,
                ...form,
              }
            : record,
        ),
      );

      closeForm();
      return;
    }

    // CREATE
    const nextNumber =
      records.length > 0
        ? Math.max(
            ...records.map((record) => {
              const number = Number(
                record.installationId?.replace("INS-", ""),
              );

              return Number.isNaN(number) ? 0 : number;
            }),
          ) + 1
        : 1;

    const newRecord: InstallationRecord = {
      id: Date.now(),
      installationId: `INS-${String(nextNumber).padStart(3, "0")}`,
      ...form,
    };

    setRecords((prev) => [newRecord, ...prev]);

    closeForm();
  };

  const handleDelete = (id: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this installation record?",
      )
    ) {
      setRecords((prev) =>
        prev.filter((record) => record.id !== id),
      );
    }
  };

  const getStatusClass = (status: InstallationStatus) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";

      case "In Progress":
        return "bg-blue-100 text-blue-700";

      case "Cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <AppShell title="Installation">
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="h-6 w-6" />
              <h1 className="text-2xl font-semibold">
                Installation
              </h1>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage installation schedules, teams and site completion.
            </p>
          </div>

          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Create Installation
          </button>
        </div>

        {/* FORM */}
        {showForm && (
          <div className="rounded-xl border bg-card p-6 shadow-sm">

            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId !== null
                  ? "Edit Installation"
                  : "Create Installation"}
              </h2>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-md p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="text-sm font-medium">
                    Work Order *
                  </label>

                  <input
                    name="workOrder"
                    value={form.workOrder}
                    onChange={handleChange}
                    placeholder="WO-001"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Customer Name *
                  </label>

                  <input
                    name="customerName"
                    value={form.customerName}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Site Name
                  </label>

                  <input
                    name="siteName"
                    value={form.siteName}
                    onChange={handleChange}
                    placeholder="Enter site / project name"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Installer / Team
                  </label>

                  <input
                    name="installer"
                    value={form.installer}
                    onChange={handleChange}
                    placeholder="Enter installer or team"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Installation Date *
                  </label>

                  <input
                    type="date"
                    name="installationDate"
                    value={form.installationDate}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

              </div>

              <div>
                <label className="text-sm font-medium">
                  Remarks
                </label>

                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  placeholder="Enter installation remarks"
                  rows={3}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3">

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
                >
                  {editingId !== null
                    ? "Update Installation"
                    : "Save Installation"}
                </button>

              </div>
            </form>
          </div>
        )}

        {/* RECORDS */}
        <div className="rounded-xl border bg-card shadow-sm">

          <div className="border-b p-5">
            <h2 className="text-lg font-semibold">
              Installation Records
            </h2>

            <p className="text-sm text-muted-foreground">
              Track all scheduled and completed installations.
            </p>
          </div>

          {records.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No installation records found.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>
                  <tr className="border-b bg-muted/40">

                    <th className="px-4 py-3 text-left">
                      Installation ID
                    </th>

                    <th className="px-4 py-3 text-left">
                      Work Order
                    </th>

                    <th className="px-4 py-3 text-left">
                      Customer
                    </th>

                    <th className="px-4 py-3 text-left">
                      Site
                    </th>

                    <th className="px-4 py-3 text-left">
                      Installer
                    </th>

                    <th className="px-4 py-3 text-left">
                      Date
                    </th>

                    <th className="px-4 py-3 text-left">
                      Status
                    </th>

                    <th className="px-4 py-3 text-left">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {records.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b"
                    >

                      <td className="px-4 py-3 font-medium">
                        {record.installationId}
                      </td>

                      <td className="px-4 py-3">
                        {record.workOrder}
                      </td>

                      <td className="px-4 py-3">
                        {record.customerName}
                      </td>

                      <td className="px-4 py-3">
                        {record.siteName || "-"}
                      </td>

                      <td className="px-4 py-3">
                        {record.installer || "-"}
                      </td>

                      <td className="px-4 py-3">
                        {record.installationDate}
                      </td>

                      <td className="px-4 py-3">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                            record.status,
                          )}`}
                        >
                          {record.status}
                        </span>

                      </td>

                      {/* ACTION */}
                      <td className="px-4 py-3">

                        <div className="flex items-center gap-2">

                          <button
                            onClick={() => openEditForm(record)}
                            className="rounded-md p-2 text-blue-600 hover:bg-blue-50"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(record.id)}
                            className="rounded-md p-2 text-red-600 hover:bg-red-50"
                            title="Delete"
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

        </div>

      </div>
    </AppShell>
  );
}

export default Installation;