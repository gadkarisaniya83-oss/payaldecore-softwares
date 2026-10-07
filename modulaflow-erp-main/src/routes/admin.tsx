/* import { createFileRoute, useNavigate, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/erp/AppShell";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();

  const adminSections = [
    {
      title: "Users",
      description: "Manage system users.",
      meta: "Users & access",
      path: "/admin/users" as const,
      enabled: true,
    },
    {
      title: "Roles & Permissions",
      description: "Manage roles and permissions.",
      meta: "Access control",
      path: "/admin/roles" as const,
      enabled: true,
    },
    {
      title: "Module Settings",
      description: "Configure ERP module settings.",
      meta: "12 modules",
      path: "/admin/modules" as const,
      enabled: true,
    },
    {
      title: "System Settings",
      description: "Manage system configuration.",
      meta: "Global settings",
      path: "/admin/settings" as const,
      enabled: true,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage system settings, users, roles and module configuration.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {adminSections.map((section) => (
            <button
              key={section.title}
              type="button"
              onClick={() => navigate({ to: section.path })}
              className="group rounded-xl border bg-background p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/30 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">
                    {section.title}
                  </h2>

                  <p className="mt-2 text-sm leading-5 text-muted-foreground">
                    {section.description}
                  </p>
                </div>

                <span className="text-lg text-muted-foreground transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>

              <div className="mt-5 text-xs font-medium text-muted-foreground">
                {section.meta}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Outlet />
    </AppShell>
  );
} */

  import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/erp/AppShell";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}