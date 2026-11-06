import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
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
  Check,
  type LucideIcon,
} from "lucide-react";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import "@/i18n";

import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/UserMenu";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface NavItem {
  label: string;
  icon: LucideIcon;
  to?: string;
}

const NAV: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  { label: "CRM", icon: Users, to: "/crm" },
  { label: "Projects", icon: FolderKanban, to: "/projects" },
  { label: "Estimation & BOQ", icon: Calculator, to: "/estimation" },
  { label: "Quotations", icon: FileText, to: "/quotations" },
  { label: "Sales Orders", icon: ShoppingCart, to: "/sales-orders" },
  { label: "Work Orders", icon: ClipboardList, to: "/work-orders" },
  { label: "Production", icon: Factory, to: "/production" },
  { label: "Inventory", icon: Boxes, to: "/inventory" },
  { label: "Purchase", icon: ShoppingBag, to: "/purchase" },
  { label: "Vendors", icon: Users, to: "/vendors" },
  { label: "Dispatch & Delivery", icon: Truck, to: "/dispatch" },
  { label: "Installation", to: "/installation", icon: Wrench },
  { label: "Invoicing", icon: ReceiptIndianRupee, to: "/invoicing" },
  { label: "Payments", icon: Wallet },
  { label: "Accounts", icon: BookOpen },
  { label: "Reports", icon: BarChart3 },
  { label: "Masters", icon: Boxes },
  { label: "Admin", icon: Settings },
];

function Sidebar({ open }: { open: boolean }) {
  const { t } = useTranslation();
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-sidebar text-sidebar-foreground transition-transform",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <div className="flex h-20 items-center border-b border-sidebar-border px-4 py-2">
          <img
            src="/logo.png"
            alt="Payal Decor Logo"
            className="h-16 w-full object-contain"
            onError={() => {
              console.error("Payal Decor logo failed to load");
            }}
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <p className="px-3 pb-2 pt-3 text-[10px] font-semibold tracking-[0.16em] text-sidebar-foreground/45">
          {t("modules", { defaultValue: "MODULES" })}
        </p>

        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active = item.to === pathname;

            const content = (
              <>
                <item.icon className="size-[18px] shrink-0" />

                <span className="flex-1 truncate">
                  {t(`nav.${item.label}`, { defaultValue: item.label })}
                </span>

                {!item.to && (
                  <span className="rounded-full bg-sidebar-accent px-2 py-0.5 text-[9px] uppercase tracking-wide text-sidebar-foreground/50">
                    {t("soon", { defaultValue: "soon" })}
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Search state
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // मोठ्या स्क्रीनवर सुरुवातीला साइडबार उघडा ठेवा
    if (window.innerWidth >= 1024) setOpen(true);
  }, []);

  // Ctrl + K दाबल्यावर सर्च बॉक्समध्ये कर्सर जाईल
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // सर्च रिझल्ट: फक्त ज्या मॉड्युलला पेज आहे तेच
  const q = query.trim().toLowerCase();
  const results = q
    ? NAV.filter((item) => {
        if (!item.to) return false;
        const translated = t(`nav.${item.label}`, {
          defaultValue: item.label,
        }).toLowerCase();
        return (
          item.label.toLowerCase().includes(q) || translated.includes(q)
        );
      })
    : [];

  const goTo = (to: string) => {
    navigate({ to });
    setQuery("");
    setSearchOpen(false);
    searchRef.current?.blur();
  };

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

      <div className={cn("transition-[padding] duration-200", open && "lg:pl-60")}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted"
          >
            <Menu className="size-5" />
          </button>

          <h1 className="text-base font-semibold">
            {t(`nav.${title}`, { defaultValue: title })}
          </h1>

          <div className="relative mx-auto hidden w-full max-w-md md:block">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
              <Search className="size-4" />

              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setSearchOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && results[0]?.to) {
                    goTo(results[0].to);
                  }
                  if (e.key === "Escape") {
                    setQuery("");
                    setSearchOpen(false);
                    searchRef.current?.blur();
                  }
                }}
                placeholder={t("search", {
                  defaultValue: "Search anything...",
                })}
                className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
              />

              <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px]">
                Ctrl + K
              </kbd>
            </div>

            {searchOpen && q && (
              <div
                // क्लिक करताना input चा blur होऊ नये म्हणून
                onMouseDown={(e) => e.preventDefault()}
                className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg"
              >
                {results.length > 0 ? (
                  results.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => item.to && goTo(item.to)}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                    >
                      <item.icon className="size-4 shrink-0 text-muted-foreground" />
                      {t(`nav.${item.label}`, { defaultValue: item.label })}
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    {t("noResults", { defaultValue: "No results found" })}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1">
            <IconBadge
              icon={Bell}
              title="Notifications"
              items={[
                "New quotation created",
                "Payment received",
                "Dispatch scheduled for tomorrow",
                "Installation completed",
                "Low stock alert in Inventory",
              ]}
            />
            <IconBadge
              icon={Calendar}
              title="Calendar"
              footer={`Today: ${new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })} — No events scheduled`}
            />
            <IconBadge
              icon={MessageSquare}
              title="Messages"
              items={[
                "Site visit reminder",
                "Customer asked for revised estimate",
                "Vendor sent new price list",
              ]}
            />

            <LanguageSwitcher />

            <CompanySwitcher />

            <UserMenu />
          </div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

function IconBadge({
  icon: Icon,
  title,
  items,
  footer,
}: {
  icon: LucideIcon;
  title: string;
  items?: string[];
  footer?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = items?.length ?? 0;

  // बाहेर क्लिक केल्यावर पॅनेल बंद होईल
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={title}
        className="relative rounded-md p-2 text-muted-foreground hover:bg-muted"
      >
        <Icon className="size-5" />

        {count ? (
          <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-semibold text-destructive-foreground">
            {count}
          </span>
        ) : null}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-border bg-card shadow-lg">
          <p className="border-b border-border px-4 py-2 text-sm font-semibold text-foreground">
            {title}
          </p>

          {items && items.length > 0 ? (
            <ul className="max-h-72 overflow-y-auto p-1">
              {items.map((text) => (
                <li
                  key={text}
                  className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
                >
                  {text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              {footer ?? "Nothing new"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const COMPANIES = ["Payal Decor Pvt. Ltd."];

function CompanySwitcher() {
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState(COMPANIES[0]);
  const ref = useRef<HTMLDivElement>(null);

  // बाहेर क्लिक केल्यावर पॅनेल बंद होईल
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={ref} className="relative mx-2 hidden lg:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
      >
        {company}
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-border bg-card shadow-lg">
          <p className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Company
          </p>

          <ul className="p-1">
            {COMPANIES.map((name) => (
              <li key={name}>
                <button
                  onClick={() => {
                    setCompany(name);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                >
                  {name}
                  {name === company && (
                    <Check className="size-4 text-muted-foreground" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}