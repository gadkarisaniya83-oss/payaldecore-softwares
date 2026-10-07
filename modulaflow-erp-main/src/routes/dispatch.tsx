import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/erp/AppShell";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Plus, Pencil, Trash2, Truck, X } from "lucide-react";

export const Route = createFileRoute("/dispatch")({
  component: Dispatch,
});

type DispatchStatus = "Pending" | "Dispatched" | "Delivered" | "Cancelled";

type DispatchRecord = {
  id: number;
  dispatchId: string;
  workOrder: string;
  customerName: string;
  deliveryAddress: string;
  vehicleNumber: string;
  driverName: string;
  dispatchDate: string;
  deliveryDate: string;
  status: DispatchStatus;
  remarks: string;
};

const emptyForm = {
  workOrder: "",
  customerName: "",
  deliveryAddress: "",
  vehicleNumber: "",
  driverName: "",
  dispatchDate: "",
  deliveryDate: "",
  status: "Pending" as DispatchStatus,
  remarks: "",
};

function Dispatch() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [records, setRecords] = useState<DispatchRecord[]>(() => {
    try {
      const saved = localStorage.getItem("dispatchRecords");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    localStorage.setItem("dispatchRecords", JSON.stringify(records));
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

  const openEditForm = (record: DispatchRecord) => {
    setEditingId(record.id);

    setForm({
      workOrder: record.workOrder,
      customerName: record.customerName,
      deliveryAddress: record.deliveryAddress,
      vehicleNumber: record.vehicleNumber,
      driverName: record.driverName,
      dispatchDate: record.dispatchDate,
      deliveryDate: record.deliveryDate,
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
      !form.deliveryAddress ||
      !form.dispatchDate
    ) {
      alert(
        "Please fill Work Order, Customer Name, Delivery Address and Dispatch Date.",
      );
      return;
    }

    // EDIT
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
              const number = Number(record.dispatchId.replace("DSP-", ""));
              return Number.isNaN(number) ? 0 : number;
            }),
          ) + 1
        : 1;

    const newRecord: DispatchRecord = {
      id: Date.now(),
      dispatchId: `DSP-${String(nextNumber).padStart(3, "0")}`,
      ...form,
    };

    setRecords((prev) => [newRecord, ...prev]);

    closeForm();
  };

  const handleDelete = (id: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this dispatch record?",
    );

    if (!confirmDelete) return;

    setRecords((prev) => prev.filter((record) => record.id !== id));
  };

  const getStatusClass = (status: DispatchStatus) => {
    switch (status) {
      case "Dispatched":
        return "bg-blue-100 text-blue-700";

      case "Delivered":
        return "bg-green-100 text-green-700";

      case "Cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <AppShell title="Dispatch & Delivery">
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="h-6 w-6" />
              <h1 className="text-2xl font-semibold">
                Dispatch & Delivery
              </h1>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage dispatches, deliveries, vehicles and delivery status.
            </p>
          </div>

          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Create Dispatch
          </button>
        </div>

        {/* FORM */}
        {showForm && (
          <div className="rounded-xl border bg-card p-6 shadow-sm">

            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId !== null
                  ? "Edit Dispatch"
                  : "Create Dispatch"}
              </h2>

              <button
                onClick={closeForm}
                className="rounded-md p-2 hover:bg-muted"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="grid gap-5 md:grid-cols-2">

                {/* WORK ORDER */}
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

                {/* CUSTOMER */}
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

                {/* ADDRESS */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">
                    Delivery Address *
                  </label>

                  <textarea
                    name="deliveryAddress"
                    value={form.deliveryAddress}
                    onChange={handleChange}
                    placeholder="Enter complete delivery address"
                    rows={3}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>

                {/* VEHICLE */}
                <div>
                  <label className="text-sm font-medium">
                    Vehicle Number
                  </label>

                  <input
                    name="vehicleNumber"
                    value={form.vehicleNumber}
                    onChange={handleChange}
                    placeholder="MH-12-AB-1234"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>

                {/* DRIVER */}
                <div>
                  <label className="text-sm font-medium">
                    Driver Name
                  </label>

                  <input
                    name="driverName"
                    value={form.driverName}
                    onChange={handleChange}
                    placeholder="Enter driver name"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>

                {/* DISPATCH DATE */}
                <div>
                  <label className="text-sm font-medium">
                    Dispatch Date *
                  </label>

                  <input
                    type="date"
                    name="dispatchDate"
                    value={form.dispatchDate}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>

                {/* DELIVERY DATE */}
                <div>
                  <label className="text-sm font-medium">
                    Expected Delivery Date
                  </label>

                  <input
                    type="date"
                    name="deliveryDate"
                    value={form.deliveryDate}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>

                {/* STATUS */}
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
                    <option value="Dispatched">Dispatched</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

              </div>

              {/* REMARKS */}
              <div>
                <label className="text-sm font-medium">
                  Remarks
                </label>

                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  placeholder="Enter dispatch remarks"
                  rows={3}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </div>

              {/* BUTTONS */}
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
                    ? "Update Dispatch"
                    : "Save Dispatch"}
                </button>

              </div>

            </form>
          </div>
        )}

        {/* RECORDS */}
        <div className="rounded-xl border bg-card shadow-sm">

          <div className="border-b p-5">
            <h2 className="text-lg font-semibold">
              Dispatch Records
            </h2>

            <p className="text-sm text-muted-foreground">
              Track all dispatch and delivery records.
            </p>
          </div>

          {records.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No dispatch records found.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>
                  <tr className="border-b bg-muted/40">

                    <th className="px-4 py-3 text-left">
                      Dispatch ID
                    </th>

                    <th className="px-4 py-3 text-left">
                      Work Order
                    </th>

                    <th className="px-4 py-3 text-left">
                      Customer
                    </th>

                    <th className="px-4 py-3 text-left">
                      Address
                    </th>

                    <th className="px-4 py-3 text-left">
                      Vehicle
                    </th>

                    <th className="px-4 py-3 text-left">
                      Dispatch Date
                    </th>

                    <th className="px-4 py-3 text-left">
                      Delivery Date
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
                        {record.dispatchId}
                      </td>

                      <td className="px-4 py-3">
                        {record.workOrder}
                      </td>

                      <td className="px-4 py-3">
                        {record.customerName}
                      </td>

                      <td className="max-w-[220px] px-4 py-3">
                        {record.deliveryAddress}
                      </td>

                      <td className="px-4 py-3">
                        {record.vehicleNumber || "-"}
                      </td>

                      <td className="px-4 py-3">
                        {record.dispatchDate}
                      </td>

                      <td className="px-4 py-3">
                        {record.deliveryDate || "-"}
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

                          {/* EDIT */}
                          <button
                            onClick={() => openEditForm(record)}
                            className="rounded-md p-2 text-blue-600 hover:bg-blue-50"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {/* DELETE */}
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

export default Dispatch;