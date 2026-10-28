import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, LogOut } from "lucide-react";
import { logout } from "@/lib/auth";

export function UserMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Baher click kela ki menu band hoto
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate({ to: "/login", replace: true });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-muted"
      >
        <div className="grid size-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          RP
        </div>
        <div className="hidden leading-tight sm:block">
          <p className="text-sm font-medium">Rahul Pawar</p>
          <p className="text-xs text-muted-foreground">Admin</p>
        </div>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive transition hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}