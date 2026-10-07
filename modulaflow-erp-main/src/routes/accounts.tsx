import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/erp/AppShell";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/accounts")({
  component: Accounts,
});

type Account = {
  id: number;
  accountName: string;
  accountType: string;
  openingBalance: string;
  transactionType: string;
  status: string;
  remarks: string;
};

const emptyForm = {
  accountName: "",
  accountType: "Customer",
  openingBalance: "",
  transactionType: "Debit",
  status: "Active",
  remarks: "",
};

function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const savedAccounts = localStorage.getItem("accounts");

    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
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
    if (!form.accountName || !form.openingBalance) {
      alert("Please fill Account Name and Opening Balance.");
      return;
    }

    let updatedAccounts: Account[];

    if (editingId !== null) {
      updatedAccounts = accounts.map((account) =>
        account.id === editingId
          ? {
              ...account,
              ...form,
            }
          : account,
      );

      alert("Account updated successfully!");
    } else {
      const newAccount: Account = {
        id: Date.now(),
        ...form,
      };

      updatedAccounts = [...accounts, newAccount];

      alert("Account saved successfully!");
    }

    setAccounts(updatedAccounts);

    localStorage.setItem(
      "accounts",
      JSON.stringify(updatedAccounts),
    );

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (account: Account) => {
    setForm({
      accountName: account.accountName,
      accountType: account.accountType,
      openingBalance: account.openingBalance,
      transactionType: account.transactionType,
      status: account.status,
      remarks: account.remarks,
    });

    setEditingId(account.id);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this account?",
    );

    if (!confirmed) return;

    const updatedAccounts = accounts.filter(
      (account) => account.id !== id,
    );

    setAccounts(updatedAccounts);

    localStorage.setItem(
      "accounts",
      JSON.stringify(updatedAccounts),
    );

    alert("Account deleted successfully!");
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <AppShell title="Accounts">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Accounts
            </h2>

            <p className="text-sm text-muted-foreground">
              Manage customer, vendor and business accounts
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
            + Create Account
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-semibold">
              {editingId !== null
                ? "Edit Account"
                : "Create Account"}
            </h3>

            <div className="grid gap-4 md:grid-cols-2">

              {/* Account Name */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Account Name
                </label>

                <input
                  name="accountName"
                  value={form.accountName}
                  onChange={handleChange}
                  placeholder="Enter account name"
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              {/* Account Type */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Account Type
                </label>

                <select
                  name="accountType"
                  value={form.accountType}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2"
                >
                  <option>Customer</option>
                  <option>Vendor</option>
                  <option>Bank</option>
                  <option>Cash</option>
                  <option>Expense</option>
                  <option>Income</option>
                  <option>Asset</option>
                  <option>Liability</option>
                </select>
              </div>

              {/* Opening Balance */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Opening Balance
                </label>

                <input
                  name="openingBalance"
                  value={form.openingBalance}
                  onChange={handleChange}
                  type="number"
                  placeholder="Enter opening balance"
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              {/* Debit Credit */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Balance Type
                </label>

                <select
                  name="transactionType"
                  value={form.transactionType}
                  onChange={handleChange}
                  className="w-full rounded-md border px-3 py-2"
                >
                  <option>Debit</option>
                  <option>Credit</option>
                </select>
              </div>

              {/* Status */}
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
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>

            {/* Remarks */}
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

            {/* Buttons */}
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
                  ? "Update Account"
                  : "Save Account"}
              </button>
            </div>
          </div>
        )}

        {/* Records */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">
            Account Records
          </h3>

          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No account records available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3">Account Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Opening Balance</th>
                    <th className="p-3">Debit/Credit</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {accounts.map((account) => (
                    <tr
                      key={account.id}
                      className="border-b"
                    >
                      <td className="p-3 font-medium">
                        {account.accountName}
                      </td>

                      <td className="p-3">
                        {account.accountType}
                      </td>

                      <td className="p-3">
                        ₹ {account.openingBalance}
                      </td>

                      <td className="p-3">
                        {account.transactionType}
                      </td>

                      <td className="p-3">
                        {account.status}
                      </td>

                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleEdit(account)
                            }
                            className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(account.id)
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