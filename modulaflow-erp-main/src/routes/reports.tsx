import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/erp/AppShell";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/reports")({
  component: Reports,
});

type Report = {
  id: string | number;
  date: string;
  type: string;
  customer: string;
  description: string;
  amount: number;
  status: string;
};

function getStorageData(key: string): any[] {
  try {
    const data = localStorage.getItem(key);

    if (!data) return [];

    const parsed = JSON.parse(data);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getValue(
  item: any,
  keys: string[],
  fallback: string | number = "-",
) {
  for (const key of keys) {
    if (
      item?.[key] !== undefined &&
      item?.[key] !== null &&
      item?.[key] !== ""
    ) {
      return item[key];
    }
  }

  return fallback;
}

function getAmount(item: any): number {
  const value = getValue(
    item,
    [
      "amount",
      "totalAmount",
      "grandTotal",
      "netAmount",
      "paymentAmount",
      "total",
      "price",
    ],
    0,
  );

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function getDate(item: any): string {
  const value = getValue(
    item,
    [
      "date",
      "paymentDate",
      "purchaseDate",
      "dispatchDate",
      "installationDate",
      "orderDate",
      "createdAt",
    ],
    "",
  );

  if (!value) return "-";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function loadReports(): Report[] {
  const reports: Report[] = [];

  // CRM
  getStorageData("payal-decor-crm-customers").forEach(
    (item, index) => {
      reports.push({
        id: getValue(
          item,
          ["id", "customerId"],
          `CRM-${index + 1}`,
        ),
        date: getDate(item),
        type: "CRM",
        customer: String(
          getValue(
            item,
            [
              "name",
              "customerName",
              "companyName",
              "customer",
            ],
            "-",
          ),
        ),
        description: String(
          getValue(
            item,
            [
              "project",
              "projectName",
              "requirement",
              "description",
            ],
            "-",
          ),
        ),
        amount: getAmount(item),
        status: String(
          getValue(
            item,
            ["status", "stage"],
            "Active",
          ),
        ),
      });
    },
  );

  // Work Orders
  getStorageData("payal-work-orders").forEach(
    (item, index) => {
      reports.push({
        id: getValue(
          item,
          ["id", "workOrderNo", "orderNo"],
          `WO-${index + 1}`,
        ),
        date: getDate(item),
        type: "Work Order",
        customer: String(
          getValue(
            item,
            [
              "customer",
              "customerName",
              "client",
              "clientName",
            ],
            "-",
          ),
        ),
        description: String(
          getValue(
            item,
            [
              "project",
              "projectName",
              "title",
              "workOrder",
            ],
            "Work Order",
          ),
        ),
        amount: getAmount(item),
        status: String(
          getValue(item, ["status"], "Pending"),
        ),
      });
    },
  );

  // Purchase
  getStorageData("purchaseOrders").forEach(
    (item, index) => {
      reports.push({
        id: getValue(
          item,
          [
            "id",
            "purchaseOrderNo",
            "poNumber",
            "orderNo",
          ],
          `PO-${index + 1}`,
        ),
        date: getDate(item),
        type: "Purchase",
        customer: String(
          getValue(
            item,
            [
              "vendor",
              "vendorName",
              "supplier",
              "supplierName",
            ],
            "-",
          ),
        ),
        description: String(
          getValue(
            item,
            [
              "material",
              "materialName",
              "description",
            ],
            "Material Purchase",
          ),
        ),
        amount: getAmount(item),
        status: String(
          getValue(item, ["status"], "Pending"),
        ),
      });
    },
  );

  // Vendors
  getStorageData("vendors").forEach(
    (item, index) => {
      reports.push({
        id: getValue(
          item,
          ["id", "vendorId"],
          `V-${index + 1}`,
        ),
        date: getDate(item),
        type: "Vendor",
        customer: String(
          getValue(
            item,
            [
              "name",
              "vendorName",
              "companyName",
            ],
            "Vendor",
          ),
        ),
        description: String(
          getValue(
            item,
            [
              "category",
              "material",
              "type",
            ],
            "-",
          ),
        ),
        amount: getAmount(item),
        status: String(
          getValue(item, ["status"], "Active"),
        ),
      });
    },
  );

  // Dispatch
  getStorageData("dispatchRecords").forEach(
    (item, index) => {
      reports.push({
        id: getValue(
          item,
          [
            "id",
            "dispatchNo",
            "dispatchNumber",
          ],
          `D-${index + 1}`,
        ),
        date: getDate(item),
        type: "Dispatch",
        customer: String(
          getValue(
            item,
            [
              "customer",
              "customerName",
              "client",
              "clientName",
            ],
            "-",
          ),
        ),
        description: String(
          getValue(
            item,
            [
              "project",
              "projectName",
              "orderNo",
              "workOrderNo",
            ],
            "Dispatch",
          ),
        ),
        amount: getAmount(item),
        status: String(
          getValue(item, ["status"], "Pending"),
        ),
      });
    },
  );

  // Installation
  getStorageData("installationRecords").forEach(
    (item, index) => {
      reports.push({
        id: getValue(
          item,
          [
            "id",
            "installationNo",
            "installationNumber",
          ],
          `I-${index + 1}`,
        ),
        date: getDate(item),
        type: "Installation",
        customer: String(
          getValue(
            item,
            [
              "customer",
              "customerName",
              "client",
              "clientName",
            ],
            "-",
          ),
        ),
        description: String(
          getValue(
            item,
            [
              "project",
              "projectName",
              "workOrderNo",
              "orderNo",
            ],
            "Installation",
          ),
        ),
        amount: getAmount(item),
        status: String(
          getValue(item, ["status"], "Pending"),
        ),
      });
    },
  );

  // Payments
  getStorageData("payments").forEach(
    (item, index) => {
      reports.push({
        id: getValue(
          item,
          [
            "id",
            "paymentNo",
            "paymentNumber",
          ],
          `P-${index + 1}`,
        ),
        date: getDate(item),
        type: "Payment",
        customer: String(
          getValue(
            item,
            [
              "party",
              "customer",
              "customerName",
              "client",
              "partyName",
            ],
            "-",
          ),
        ),
        description: String(
          getValue(
            item,
            [
              "referenceNo",
              "invoiceNo",
              "project",
              "description",
            ],
            "Payment",
          ),
        ),
        amount: getAmount(item),
        status: String(
          getValue(item, ["status"], "Paid"),
        ),
      });
    },
  );

  // Accounts
  getStorageData("accounts").forEach(
    (item, index) => {
      reports.push({
        id: getValue(
          item,
          ["id", "accountId"],
          `A-${index + 1}`,
        ),
        date: getDate(item),
        type: "Account",
        customer: String(
          getValue(
            item,
            [
              "name",
              "accountName",
              "party",
              "customer",
            ],
            "-",
          ),
        ),
        description: String(
          getValue(
            item,
            [
              "description",
              "category",
              "type",
            ],
            "Account Entry",
          ),
        ),
        amount: getAmount(item),
        status: String(
          getValue(
            item,
            ["status"],
            "Recorded",
          ),
        ),
      });
    },
  );

  return reports;
}

function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");

  useEffect(() => {
    setReports(loadReports());
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        String(report.id)
          .toLowerCase()
          .includes(searchText) ||
        String(report.type)
          .toLowerCase()
          .includes(searchText) ||
        String(report.customer)
          .toLowerCase()
          .includes(searchText) ||
        String(report.description)
          .toLowerCase()
          .includes(searchText);

      const matchesType =
        type === "All" || report.type === type;

      const matchesStatus =
        status === "All" ||
        String(report.status).toLowerCase() ===
          status.toLowerCase();

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });
  }, [reports, search, type, status]);

  const refreshReports = () => {
    setReports(loadReports());
  };

  const exportCSV = () => {
    if (filteredReports.length === 0) {
      alert("No report data available");
      return;
    }

    const headers = [
      "ID",
      "Date",
      "Type",
      "Customer/Vendor",
      "Description",
      "Amount",
      "Status",
    ];

    const rows = filteredReports.map((report) => [
      report.id,
      report.date,
      report.type,
      report.customer,
      report.description,
      report.amount,
      report.status,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replace(/"/g, '""')}"`,
          )
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "reports.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <AppShell title="Reports">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Reports
            </h2>

            <p className="text-sm text-muted-foreground">
              View and analyze your business reports
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={refreshReports}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Refresh
            </button>

            <button
              onClick={exportCSV}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Export Report
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Report Filters
            </h3>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-md border px-3 py-1 text-sm hover:bg-muted"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>

          {showFilters && (
            <div className="grid gap-4 md:grid-cols-3">

              {/* Search */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Search
                </label>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search reports..."
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              {/* Report Type */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Report Type
                </label>

                <select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value)
                  }
                  className="w-full rounded-md border px-3 py-2"
                >
                  <option>All</option>
                  <option>CRM</option>
                  <option>Work Order</option>
                  <option>Purchase</option>
                  <option>Vendor</option>
                  <option>Dispatch</option>
                  <option>Installation</option>
                  <option>Payment</option>
                  <option>Account</option>
                  <option>Invoice</option>
                </select>
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
                  className="w-full rounded-md border px-3 py-2"
                >
                  <option>All</option>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Completed</option>
                  <option>Paid</option>
                  <option>Recorded</option>
                  <option>Cancelled</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Records */}
        <div className="rounded-lg border bg-card p-6">

          <div className="mb-4">
            <h3 className="text-lg font-semibold">
              Report Records
            </h3>

            <p className="text-sm text-muted-foreground">
              {filteredReports.length} records found.
            </p>
          </div>

          {filteredReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No report records available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">

                <thead>
                  <tr className="border-b text-left">

                    <th className="p-3">
                      ID
                    </th>

                    <th className="p-3">
                      Date
                    </th>

                    <th className="p-3">
                      Type
                    </th>

                    <th className="p-3">
                      Customer / Vendor
                    </th>

                    <th className="p-3">
                      Description
                    </th>

                    <th className="p-3">
                      Amount
                    </th>

                    <th className="p-3">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {filteredReports.map(
                    (report, index) => (
                      <tr
                        key={`${report.type}-${report.id}-${index}`}
                        className="border-b hover:bg-muted/50"
                      >

                        <td className="p-3 font-medium">
                          {report.id}
                        </td>

                        <td className="p-3">
                          {report.date}
                        </td>

                        <td className="p-3">
                          {report.type}
                        </td>

                        <td className="p-3">
                          {report.customer}
                        </td>

                        <td className="p-3">
                          {report.description}
                        </td>

                        <td className="p-3">
                          ₹{" "}
                          {report.amount.toLocaleString(
                            "en-IN",
                          )}
                        </td>

                        <td className="p-3">
                          {report.status}
                        </td>

                      </tr>
                    ),
                  )}
                </tbody>

              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}