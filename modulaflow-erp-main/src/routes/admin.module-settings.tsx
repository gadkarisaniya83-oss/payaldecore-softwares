import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/admin/module-settings")({
  component: ModuleSettingsPage,
});

const modules = [
  {
    name: "CRM",
    description: "Manage leads, enquiries and customer information.",
  },
  {
    name: "Projects",
    description: "Manage projects and track progress.",
  },
  {
    name: "Estimation & BOQ",
    description: "Create estimates and manage BOQ.",
  },
  {
    name: "Sales Orders",
    description: "Manage sales orders and confirmations.",
  },
  {
    name: "Work Orders",
    description: "Create and track work orders.",
  },
  {
    name: "Production",
    description: "Manage production planning and manufacturing.",
  },
  {
    name: "Inventory",
    description: "Track stock, materials and inventory movements.",
  },
  {
    name: "Purchase",
    description: "Manage purchase orders and procurement.",
  },
  {
    name: "Vendors",
    description: "Maintain vendor and supplier details.",
  },
  {
    name: "Dispatch & Delivery",
    description: "Manage dispatch and delivery process.",
  },
  {
    name: "Installation",
    description: "Track installation activities.",
  },
  {
    name: "Invoicing",
    description: "Generate invoices and manage payments.",
  },
];

function ModuleSettingsPage() {
  const [enabled, setEnabled] = useState(
    Object.fromEntries(modules.map((module) => [module.name, true]))
  );

  const toggleModule = (name: string) => {
    setEnabled((current) => ({
      ...current,
      [name]: !current[name],
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 text-sm text-muted-foreground">
          Admin &nbsp;›&nbsp; Module Settings
        </div>

        <h1 className="text-2xl font-semibold">
          Module Settings
        </h1>

        <p className="text-muted-foreground">
          Configure and manage ERP modules. Enable or disable modules as per your business needs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <div
            key={module.name}
            className="rounded-lg border p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold">
                  {module.name}
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  {module.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleModule(module.name)}
                className={`relative h-6 w-11 rounded-full transition ${
                  enabled[module.name]
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    enabled[module.name]
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              className="mt-4 rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              Configure →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}