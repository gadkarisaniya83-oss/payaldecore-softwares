import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/erp/AppShell";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/payments")({
  component: Payments,
});

type Payment = {
  id: number;
  paymentNo: string;
  paymentDate: string;
  party: string;
  paymentType: string;
  amount: string;
  paymentMode: string;
  referenceNo: string;
  status: string;
  remarks: string;
};

const emptyForm = {
  paymentNo: "",
  paymentDate: "",
  party: "",
  paymentType: "Received",
  amount: "",
  paymentMode: "Cash",
  referenceNo: "",
  status: "Pending",
  remarks: "",
};

function Payments() {
  const [showForm, setShowForm] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const savedPayments = localStorage.getItem("payments");

    if (savedPayments) {
      setPayments(JSON.parse(savedPayments));
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    if (!form.paymentNo || !form.party || !form.amount) {
      alert("Please fill Payment No., Customer/Vendor and Amount.");
      return;
    }

    let updatedPayments: Payment[];

    if (editingId !== null) {
      updatedPayments = payments.map((payment) =>
        payment.id === editingId
          ? {
              ...payment,
              ...form,
            }
          : payment,
      );

      alert("Payment updated successfully!");
    } else {
      const newPayment: Payment = {
        id: Date.now(),
        ...form,
      };

      updatedPayments = [...payments, newPayment];

      alert("Payment saved successfully!");
    }

    setPayments(updatedPayments);

    localStorage.setItem(
      "payments",
      JSON.stringify(updatedPayments),
    );

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (payment: Payment) => {
    setForm({
      paymentNo: payment.paymentNo,
      paymentDate: payment.paymentDate,
      party: payment.party,
      paymentType: payment.paymentType,
      amount: payment.amount,
      paymentMode: payment.paymentMode,
      referenceNo: payment.referenceNo,
      status: payment.status,
      remarks: payment.remarks,
    });

    setEditingId(payment.id);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this payment?",
    );

    if (!confirmed) return;

    const updatedPayments = payments.filter(
      (payment) => payment.id !== id,
    );

    setPayments(updatedPayments);

    localStorage.setItem(
      "payments",
      JSON.stringify(updatedPayments),
    );

    alert("Payment deleted successfully!");
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <AppShell title="Payments">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Payments</h2>
            <p className="text-sm text-muted-foreground">
              Manage customer and vendor payments
            </p>
          </div>

          <button
            onClick={() => {
              setForm(emptyForm);
              setEditingId(null);
              setShowForm(true);
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            + Create Payment
          </button>
        </div>

        {showForm && (
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-semibold">
              {editingId !== null
                ? "Edit Payment"
                : "Create Payment"}
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Payment No.
                </label>

                <input
                  name="paymentNo"
                  value={form.paymentNo}
                  onChange={handleChange}
                  placeholder="PAY-001"
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Payment Date
                </label>

                <input
                  name="paymentDate"
                  value={form.paymentDate}
                  onChange={handleChange}
                  type="date"
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Customer / Vendor
                </label>

                <input
                  name="party"
                  value={form.party}
                  onChange={handleChange}
                  placeholder="Enter name"
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Payment Type
                </label>

                <select
                  name="paymentType"
                  value={form.paymentType}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2"
                >
                  <option>Received</option>
                  <option>Paid</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Amount
                </label>

                <input
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  type="number"
                  placeholder="Enter amount"
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Payment Mode
                </label>

                <select
                  name="paymentMode"
                  value={form.paymentMode}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2"
                >
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>UPI</option>
                  <option>Cheque</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Reference No.
                </label>

                <input
                  name="referenceNo"
                  value={form.referenceNo}
                  onChange={handleChange}
                  placeholder="Transaction / Cheque number"
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2"
                >
                  <option>Pending</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium">
                Remarks
              </label>

              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                placeholder="Enter remarks"
                rows={3}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCancel}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                {editingId !== null
                  ? "Update Payment"
                  : "Save Payment"}
              </button>
            </div>
          </div>
        )}

        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">
            Payment Records
          </h3>

          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payment records available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3">Payment No.</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer / Vendor</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b"
                    >
                      <td className="p-3">
                        {payment.paymentNo}
                      </td>

                      <td className="p-3">
                        {payment.paymentDate || "-"}
                      </td>

                      <td className="p-3">
                        {payment.party}
                      </td>

                      <td className="p-3">
                        {payment.paymentType}
                      </td>

                      <td className="p-3">
                        ₹ {payment.amount}
                      </td>

                      <td className="p-3">
                        {payment.paymentMode}
                      </td>

                      <td className="p-3">
                        {payment.status}
                      </td>

                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(payment)}
                            className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(payment.id)
                            }
                            className="rounded-md border px-3 py-1 text-xs font-medium text-destructive hover:bg-muted"
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
          )}
        </div>
      </div>
    </AppShell>
  );
}