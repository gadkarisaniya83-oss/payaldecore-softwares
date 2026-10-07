import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/erp/AppShell";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/purchase")({
  component: Purchase,
});

type PurchaseOrder = {
  poNo: string;
  vendor: string;
  material: string;
  quantity: string;
  rate: string;
  gst: string;
  date: string;
  status: string;
};

const defaultPurchaseOrders: PurchaseOrder[] = [
  {
    poNo: "PO-001",
    vendor: "ABC Hardware",
    material: "MDF 18mm",
    quantity: "100 Sheets",
    rate: "2850",
    gst: "18",
    date: "",
    status: "Pending",
  },
  {
    poNo: "PO-002",
    vendor: "XYZ Plywood",
    material: "MDF 12mm",
    quantity: "50 Sheets",
    rate: "2500",
    gst: "18",
    date: "",
    status: "Approved",
  },
  {
    poNo: "PO-003",
    vendor: "Royal Hardware",
    material: "Hinges",
    quantity: "100 Nos",
    rate: "1500",
    gst: "18",
    date: "",
    status: "Received",
  },
];

function Purchase() {
  const [showForm, setShowForm] = useState(false);

  const [vendor, setVendor] = useState("");
  const [material, setMaterial] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [rate, setRate] = useState("");
  const [gst, setGst] = useState("");
  const [status, setStatus] = useState("Pending");

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    if (typeof window === "undefined") {
      return defaultPurchaseOrders;
    }

    const savedOrders = localStorage.getItem("purchaseOrders");

    if (!savedOrders) {
      return defaultPurchaseOrders;
    }

    try {
      return JSON.parse(savedOrders);
    } catch {
      return defaultPurchaseOrders;
    }
  });

  const [editingPoNo, setEditingPoNo] = useState<string | null>(null);

  // Save purchase orders in localStorage
  useEffect(() => {
    localStorage.setItem(
      "purchaseOrders",
      JSON.stringify(purchaseOrders)
    );
  }, [purchaseOrders]);

  // Reset form
  const resetForm = () => {
    setVendor("");
    setMaterial("");
    setPurchaseDate("");
    setQuantity("");
    setRate("");
    setGst("");
    setStatus("Pending");
    setEditingPoNo(null);
    setShowForm(false);
  };

  // Save / Update Purchase
  const handleSavePurchase = () => {
    if (
      !vendor.trim() ||
      !material.trim() ||
      !purchaseDate ||
      !quantity ||
      !rate
    ) {
      alert("Please fill all required fields.");
      return;
    }

    // EDIT existing purchase
    if (editingPoNo) {
      setPurchaseOrders((prev) =>
        prev.map((purchase) =>
          purchase.poNo === editingPoNo
            ? {
                ...purchase,
                vendor: vendor.trim(),
                material: material.trim(),
                quantity,
                rate,
                gst: gst || "0",
                date: purchaseDate,
                status,
              }
            : purchase
        )
      );

      alert("Purchase updated successfully!");
      resetForm();
      return;
    }

    // CREATE new purchase
    const nextNumber =
      purchaseOrders.length > 0
        ? Math.max(
            ...purchaseOrders.map((purchase) =>
              Number(purchase.poNo.replace("PO-", ""))
            )
          ) + 1
        : 1;

    const newPurchase: PurchaseOrder = {
      poNo: `PO-${String(nextNumber).padStart(3, "0")}`,
      vendor: vendor.trim(),
      material: material.trim(),
      quantity,
      rate,
      gst: gst || "0",
      date: purchaseDate,
      status,
    };

    setPurchaseOrders((prev) => [
      ...prev,
      newPurchase,
    ]);

    alert("Purchase saved successfully!");

    resetForm();
  };

  // Edit Purchase
  const handleEdit = (purchase: PurchaseOrder) => {
    setEditingPoNo(purchase.poNo);

    setVendor(purchase.vendor);
    setMaterial(purchase.material);
    setPurchaseDate(purchase.date);
    setQuantity(purchase.quantity);
    setRate(purchase.rate);
    setGst(purchase.gst);
    setStatus(purchase.status);

    setShowForm(true);
  };

  // Delete Purchase
  const handleDelete = (poNo: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this purchase?"
    );

    if (!confirmed) {
      return;
    }

    setPurchaseOrders((prev) =>
      prev.filter((purchase) => purchase.poNo !== poNo)
    );

    alert("Purchase deleted successfully!");
  };

  // Update Status
  const updateStatus = (
    poNo: string,
    newStatus: string
  ) => {
    setPurchaseOrders((prev) =>
      prev.map((purchase) =>
        purchase.poNo === poNo
          ? {
              ...purchase,
              status: newStatus,
            }
          : purchase
      )
    );
  };

  return (
    <AppShell title="Purchase">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              Purchase Management
            </h2>

            <p className="text-sm text-muted-foreground">
              Manage purchase orders and material purchases.
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            + New Purchase
          </button>
        </div>

        {/* Create / Edit Purchase Form */}
        {showForm && (
          <div className="rounded-lg border border-border bg-card p-6">

            <h3 className="mb-4 text-lg font-semibold">
              {editingPoNo
                ? "Edit Purchase"
                : "Create Purchase"}
            </h3>

            <div className="grid gap-4 md:grid-cols-2">

              {/* Vendor */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Vendor *
                </label>

                <input
                  value={vendor}
                  onChange={(e) =>
                    setVendor(e.target.value)
                  }
                  placeholder="Enter vendor name"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </div>

              {/* Purchase Date */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Purchase Date *
                </label>

                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) =>
                    setPurchaseDate(e.target.value)
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </div>

              {/* Material */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Material / Product *
                </label>

                <input
                  value={material}
                  onChange={(e) =>
                    setMaterial(e.target.value)
                  }
                  placeholder="Enter material name"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Quantity *
                </label>

                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(e.target.value)
                  }
                  placeholder="Enter quantity"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </div>

              {/* Rate */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Rate *
                </label>

                <input
                  type="number"
                  min="0"
                  value={rate}
                  onChange={(e) =>
                    setRate(e.target.value)
                  }
                  placeholder="Enter rate"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </div>

              {/* GST */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  GST %
                </label>

                <input
                  type="number"
                  min="0"
                  value={gst}
                  onChange={(e) =>
                    setGst(e.target.value)
                  }
                  placeholder="Enter GST"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value)
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                >
                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Approved">
                    Approved
                  </option>

                  <option value="Ordered">
                    Ordered
                  </option>

                  <option value="Received">
                    Received
                  </option>

                  <option value="Cancelled">
                    Cancelled
                  </option>
                </select>
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
                onClick={handleSavePurchase}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                {editingPoNo
                  ? "Update Purchase"
                  : "Save Purchase"}
              </button>

            </div>
          </div>
        )}

        {/* Purchase Orders */}
        <div className="rounded-lg border border-border bg-card p-6">

          <h3 className="mb-4 text-lg font-semibold">
            Purchase Orders
          </h3>

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="border-b border-border text-left">

                  <th className="px-3 py-3">
                    PO No.
                  </th>

                  <th className="px-3 py-3">
                    Vendor
                  </th>

                  <th className="px-3 py-3">
                    Material
                  </th>

                  <th className="px-3 py-3">
                    Quantity
                  </th>

                  <th className="px-3 py-3">
                    Rate
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

                {purchaseOrders.map((purchase) => (
                  <tr
                    key={purchase.poNo}
                    className="border-b border-border"
                  >

                    {/* PO No */}
                    <td className="px-3 py-3">
                      {purchase.poNo}
                    </td>

                    {/* Vendor */}
                    <td className="px-3 py-3">
                      {purchase.vendor}
                    </td>

                    {/* Material */}
                    <td className="px-3 py-3">
                      {purchase.material}
                    </td>

                    {/* Quantity */}
                    <td className="px-3 py-3">
                      {purchase.quantity}
                    </td>

                    {/* Rate */}
                    <td className="px-3 py-3">
                      ₹{purchase.rate}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <select
                        value={purchase.status}
                        onChange={(e) =>
                          updateStatus(
                            purchase.poNo,
                            e.target.value
                          )
                        }
                        className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      >
                        <option value="Pending">
                          Pending
                        </option>

                        <option value="Approved">
                          Approved
                        </option>

                        <option value="Ordered">
                          Ordered
                        </option>

                        <option value="Received">
                          Received
                        </option>

                        <option value="Cancelled">
                          Cancelled
                        </option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3">

                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            handleEdit(purchase)
                          }
                          className="rounded-md border border-border px-3 py-1 text-sm"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(
                              purchase.poNo
                            )
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