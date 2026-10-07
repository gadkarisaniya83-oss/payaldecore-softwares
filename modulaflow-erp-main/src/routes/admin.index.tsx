import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-muted-foreground">
          Manage system settings, users, roles and module configuration.
        </p>
      </div>

      {/* Admin Tabs / Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        {/* Users */}
        <button
          type="button"
          onClick={() => navigate({ to: "/admin/users" })}
          className="group rounded-lg border p-5 text-left transition hover:bg-muted/50"
        >
          <div className="flex items-start justify-between">
            <h2 className="font-semibold">Users</h2>
            <span className="text-muted-foreground transition group-hover:translate-x-1">
              →
            </span>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Manage system users.
          </p>

          <p className="mt-5 text-sm">
            Users & access
          </p>
        </button>

        {/* Roles & Permissions */}
        <button
          type="button"
          onClick={() => navigate({ to: "/admin/roles-permissions" })}
          className="group rounded-lg border p-5 text-left transition hover:bg-muted/50"
        >
          <div className="flex items-start justify-between">
            <h2 className="font-semibold">Roles & Permissions</h2>
            <span className="text-muted-foreground transition group-hover:translate-x-1">
              →
            </span>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Manage roles and permissions.
          </p>

          <p className="mt-5 text-sm">
            Access control
          </p>
        </button>

        {/* Module Settings */}
        <button
          type="button"
          onClick={() => navigate({ to: "/admin/module-settings" })}
          className="group rounded-lg border p-5 text-left transition hover:bg-muted/50"
        >
          <div className="flex items-start justify-between">
            <h2 className="font-semibold">Module Settings</h2>
            <span className="text-muted-foreground transition group-hover:translate-x-1">
              →
            </span>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Configure ERP module settings.
          </p>

          <p className="mt-5 text-sm">
            12 modules
          </p>
        </button>

        {/* System Settings */}
        <button
          type="button"
          onClick={() => navigate({ to: "/admin/system-settings" })}
          className="group rounded-lg border p-5 text-left transition hover:bg-muted/50"
        >
          <div className="flex items-start justify-between">
            <h2 className="font-semibold">System Settings</h2>
            <span className="text-muted-foreground transition group-hover:translate-x-1">
              →
            </span>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Manage system configuration.
          </p>

          <p className="mt-5 text-sm">
            Global settings
          </p>
        </button>

      </div>
    </div>
  );
}