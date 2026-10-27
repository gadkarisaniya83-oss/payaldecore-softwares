import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  UserRoundPlus,
  FolderKanban,
  Calculator,
  FileText,
  ShoppingCart,
  ClipboardList,
  Factory,
  Boxes,
  ShoppingBag,
  Truck,
  Wrench,
  ReceiptIndianRupee,
  Wallet,
  BookOpen,
  BarChart3,
  Settings,
  Bell,
  Calendar,
  MessageSquare,
  Search,
  ChevronDown,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: LucideIcon;
  to?: string;
}

const NAV: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  { label: "CRM", icon: Users, to: "/crm" },
  { label: "Lead / Enquiry", icon: UserRoundPlus, to: "/lead-enquiry" },
  { label: "Site Visit / Measurement", icon: UserRoundPlus, to: "/site-visit-measurement" },
  { label: "Estimation & BOQ", icon: Calculator, to: "/estimation" },
  { label: "Quotations", icon: FileText, to: "/quotations" },
  { label: "Sales Orders", icon: ShoppingCart, to: "/sales-orders" },
  { label: "Work Orders", icon: ClipboardList ,to:"/work-orders"},
  { label: "BOM & Material Requirement", icon: Boxes, to: "/bom-material-requirement"},
  { label: "Production", icon: Factory, to: "/production" },
  { label: "Inventory", icon: Boxes, to: "/inventory" },
  { label: "Purchase", icon: ShoppingBag, to: "/purchase" },
  { label: "Vendors", icon: Users, to:"/vendors" },
  { label: "Dispatch & Delivery", icon: Truck, to:"/dispatch" },
  { label: "Installation", icon: Wrench, to:"/installation" },
  { label: "Invoicing", icon: ReceiptIndianRupee, to: "/invoicing" },
  { label: "Payments", icon: Wallet, to: "/payments" },
  { label: "Accounts", icon: BookOpen, to:"/accounts" },
  { label: "Reports", icon: BarChart3, to: "/reports" },
  { label: "Masters", icon: Boxes, to: "/masters" },
  { label: "Admin", icon: Settings, to: "/admin" },
  { label: "Projects", icon: FolderKanban, to: "/projects" },
];
function Sidebar({ open }: { open: boolean }) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <div className="flex h-16 w-full items-center border-b border-sidebar-border px-4 py-2">
  <img
    src="/payal-decor-logo.png"
    alt="Payal Decor Logo"
    className="h-14 w-full object-contain object-left"
  />
</div>
</div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <p className="px-3 pb-2 pt-3 text-[10px] font-semibold tracking-[0.16em] text-sidebar-foreground/45">
          MODULES
        </p>

        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active = item.to === pathname;

            const content = (
              <>
                <item.icon className="size-[18px] shrink-0" />

                <span className="flex-1 truncate">
                  {item.label}
                </span>

                {!item.to && (
                  <span className="rounded-full bg-sidebar-accent px-2 py-0.5 text-[9px] uppercase tracking-wide text-sidebar-foreground/50">
                    soon
                  </span>
                )}
              </>
            );

            const base =
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors";

            return (
              <li key={item.label}>
                {item.to ? (
                  <Link
                    to={item.to}
                    className={cn(
                      base,
                      active
                        ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/85 hover:bg-sidebar-accent",
                    )}
                  >
                    {content}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      base,
                      "cursor-not-allowed text-sidebar-foreground/45",
                    )}
                  >
                    {content}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4 text-xs text-sidebar-foreground/60">
        <p className="font-semibold tracking-wide text-sidebar-foreground/80">
          PAYAL DECOR ERP
        </p>
        <p>v1.0.0</p>
      </div>
    </aside>
  );
}

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={open} />

      {open && (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-foreground/30 lg:hidden"
        />
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted"
          >
            <Menu className="size-5" />
          </button>

          <h1 className="text-base font-semibold">{title}</h1>

          <div className="mx-auto hidden w-full max-w-md items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2 text-sm text-muted-foreground md:flex">
            <Search className="size-4" />

            <input
              placeholder="Search anything..."
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />

            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px]">
              Ctrl + K
            </kbd>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <IconBadge icon={Bell} count={5} />
            <IconBadge icon={Calendar} />
            <IconBadge icon={MessageSquare} count={3} />

            <div className="mx-2 hidden items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm lg:flex">
              Payal Decor Pvt. Ltd.
              <ChevronDown className="size-4 text-muted-foreground" />
            </div>

            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                RP
              </div>

              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-medium">Rahul Pawar</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function IconBadge({
  icon: Icon,
  count,
}: {
  icon: LucideIcon;
  count?: number;
}) {
  return (
    <button className="relative rounded-md p-2 text-muted-foreground hover:bg-muted">
      <Icon className="size-5" />

      {count ? (
        <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-semibold text-destructive-foreground">
          {count}
        </span>
      ) : null}
    </button>
  );
}
