import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/admin/system-settings")({
  component: SystemSettingsPage,
});

function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState("General");

  const tabs = [
    "General",
    "Company",
    "Notifications",
    "Security",
    "Audit",
    "Integrations",
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 text-sm text-muted-foreground">
          Admin &nbsp;›&nbsp; System Settings
        </div>

        <h1 className="text-2xl font-semibold">
          System Settings
        </h1>

        <p className="text-muted-foreground">
          Manage application settings and configurations.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-1 pb-3 text-sm font-medium ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "General" && (
        <GeneralSettings />
      )}

      {activeTab === "Company" && (
        <SimpleSettings title="Company Settings" />
      )}

      {activeTab === "Notifications" && (
        <SimpleSettings title="Notification Settings" />
      )}

      {activeTab === "Security" && (
        <SimpleSettings title="Security Settings" />
      )}

      {activeTab === "Audit" && (
        <SimpleSettings title="Audit Settings" />
      )}

      {activeTab === "Integrations" && (
        <SimpleSettings title="Integration Settings" />
      )}
    </div>
  );
}

function GeneralSettings() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Company Profile */}
      <div className="rounded-lg border p-5">
        <h2 className="font-semibold">
          Company Profile
        </h2>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">
              Company Name
            </span>

            <input
              defaultValue="Payal Decor Pvt. Ltd."
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">
              Address
            </span>

            <textarea
              defaultValue={
                "Gat No. 123, Hinjewadi Road,\nPune - 411057, Maharashtra, India"
              }
              rows={3}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">
              Phone
            </span>

            <input
              defaultValue="+91 20 1234 5678"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">
              Email
            </span>

            <input
              defaultValue="info@payaldecor.com"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">
              Website
            </span>

            <input
              defaultValue="www.payaldecor.com"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>
        </div>
      </div>

      {/* Application Settings */}
      <div className="rounded-lg border p-5">
        <h2 className="font-semibold">
          Application Settings
        </h2>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">
              Timezone
            </span>

            <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
              <option>
                (GMT+05:30) India Standard Time
              </option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">
              Date Format
            </span>

            <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
              <option>DD-MM-YYYY</option>
              <option>MM-DD-YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">
              Currency
            </span>

            <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
              <option>INR - Indian Rupee (₹)</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">
              Session Timeout
            </span>

            <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
              <option>30 minutes</option>
              <option>60 minutes</option>
              <option>120 minutes</option>
            </select>
          </label>

          <div className="pt-3">
            <h3 className="font-medium">
              Notifications
            </h3>

            <SettingToggle
              title="Email notifications"
              description="Send email notifications for important events."
              enabled
            />

            <SettingToggle
              title="In-app notifications"
              description="Show in-app notifications."
              enabled
            />

            <SettingToggle
              title="Weekly system report"
              description="Send weekly summary to admin."
              enabled={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({
  title,
  description,
  enabled,
}: {
  title: string;
  description: string;
  enabled: boolean;
}) {
  const [active, setActive] = useState(enabled);

  return (
    <div className="flex items-center justify-between border-b py-4 last:border-0">
      <div>
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setActive(!active)}
        className={`relative h-6 w-11 rounded-full ${
          active ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white ${
            active ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function SimpleSettings({ title }: { title: string }) {
  return (
    <div className="rounded-lg border p-6">
      <h2 className="text-lg font-semibold">
        {title}
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        Configure {title.toLowerCase()} here.
      </p>

      <button
        type="button"
        className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Save Changes
      </button>
    </div>
  );
}