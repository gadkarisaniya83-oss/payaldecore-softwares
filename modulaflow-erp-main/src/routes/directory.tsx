import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Users,
  Handshake,
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  ArrowRight,
  LayoutGrid,
  List,
  RefreshCw,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  UserPlus,
  Contact as ContactIcon,
  Download,
  History,
  Tags,
  BarChart3,
  CalendarPlus,
  MessageCircle,
  RefreshCcw,
} from "lucide-react";
import { AppShell } from "@/components/erp/AppShell";

export const Route = createFileRoute("/directory")({
  head: () => ({
    meta: [
      { title: "Directory | Payal Decor ERP" },
      {
        name: "description",
        content: "Clients, vendors and partners in one place.",
      },
    ],
  }),
  component: DirectoryPage,
});

const API_BASE = (
  import.meta.env["VITE_API_URL"] || "http://localhost:5001/api"
).replace(/\/+$/, "");

/* ------------------------------------------------------------------
   Directory = 3 tables ekatra:
   Clients  -> Customer table  (/api/crm/customers)
   Vendors  -> Vendor table    (/api/vendors)
   Partners -> Partner table   (/api/partners)
------------------------------------------------------------------- */

type Kind = "CLIENT" | "VENDOR" | "PARTNER";
type TabId = "ALL" | Kind;
type SortBy = "name" | "company" | "newest";
type Tool = "activity" | "reports" | "meeting" | null;
type FormState = Record<string, string>;

interface Contact {
  uid: string;
  kind: Kind;
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  status: string;
  sub: string;
  createdAt: string;
  updatedAt: string;
  raw: Record<string, unknown>;
}

const KIND_LABEL: Record<Kind, string> = {
  CLIENT: "Client",
  VENDOR: "Vendor",
  PARTNER: "Partner",
};

const KIND_ENDPOINT: Record<Kind, string> = {
  CLIENT: "/crm/customers",
  VENDOR: "/vendors",
  PARTNER: "/partners",
};

const KIND_BADGE: Record<Kind, string> = {
  CLIENT: "bg-amber-100 text-amber-900",
  VENDOR: "bg-blue-100 text-blue-800",
  PARTNER: "bg-emerald-100 text-emerald-800",
};

const STATUS_BADGE: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-600",
  Lead: "bg-sky-100 text-sky-700",
};

const STATUS_OPTIONS: Record<Kind, string[]> = {
  CLIENT: ["Active", "Inactive", "Lead"],
  VENDOR: ["Active", "Inactive"],
  PARTNER: ["Active", "Inactive"],
};

const VENDOR_CATEGORIES = [
  "Plywood",
  "Laminates",
  "Hardware",
  "Edge Band",
  "Glass",
  "Fabric",
  "Other",
];

const FIELD_LABEL: Record<string, string> = {
  name: "Name",
  company: "Company",
  phone: "Phone",
  email: "Email",
  status: "Status",
  location: "Location",
  category: "Category",
  city: "City",
  contactPerson: "Contact Person",
  gstin: "GSTIN",
  state: "State",
  pincode: "Pincode",
  address: "Address",
  notes: "Notes",
};

const FORM_FIELDS: Record<Kind, string[]> = {
  CLIENT: [
    "name", "company", "phone", "email", "status", "location",
    "contactPerson", "gstin", "state", "pincode", "address", "notes",
  ],
  VENDOR: [
    "name", "company", "phone", "email", "status", "category", "city",
    "contactPerson", "gstin", "state", "pincode", "address", "notes",
  ],
  PARTNER: ["name", "company", "phone", "email", "status", "address", "notes"],
};

const REQUIRED_FIELDS: Record<Kind, string[]> = {
  CLIENT: ["name", "company", "phone"],
  VENDOR: ["name", "company", "phone"],
  PARTNER: ["name"],
};

const LONG_FIELDS = ["address", "notes"];

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100";

/* ---------------- helpers ---------------- */

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const pad = (n: number) => String(n).padStart(2, "0");

async function readResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toContact(kind: Kind, r: Record<string, unknown>): Contact {
  let sub = "";
  if (kind === "CLIENT") sub = str(r.location);
  if (kind === "VENDOR") {
    sub = [str(r.category), str(r.city)].filter(Boolean).join(", ");
  }

  return {
    uid: `${kind}-${str(r.id)}`,
    kind,
    id: str(r.id),
    name: str(r.name),
    company: str(r.company),
    phone: str(r.phone),
    email: str(r.email),
    status: str(r.status) || "Active",
    sub,
    createdAt: str(r.createdAt),
    updatedAt: str(r.updatedAt),
    raw: r,
  };
}

function emptyForm(kind: Kind): FormState {
  const f: FormState = {};
  for (const key of FORM_FIELDS[kind]) f[key] = "";
  f.status = "Active";
  return f;
}

function formFromContact(c: Contact): FormState {
  const f: FormState = {};
  for (const key of FORM_FIELDS[c.kind]) f[key] = str(c.raw[key]);
  if (!f.status) f.status = "Active";
  return f;
}

function whatsappLink(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits ? `https://wa.me/${digits}` : "";
}

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-IN");
}

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;

/* ---------------- small UI pieces ---------------- */

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-amber-100 font-semibold text-amber-900 ${
        size === "lg" ? "h-16 w-16 text-xl" : "h-12 w-12 text-base"
      }`}
    >
      {initialsOf(name)}
    </div>
  );
}

function Badge({ text, className }: { text: string; className: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {text}
    </span>
  );
}

function ContactActions({
  contact,
  onView,
}: {
  contact: Contact;
  onView: (c: Contact) => void;
}) {
  const link =
    "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100";
  const off = "pointer-events-none opacity-40";

  return (
    <div className="flex items-center justify-between border-t pt-3">
      <a
        href={contact.phone ? `tel:${contact.phone}` : undefined}
        aria-disabled={!contact.phone}
        className={`${link} ${contact.phone ? "" : off}`}
      >
        <Phone className="h-4 w-4" />
        Call
      </a>
      <a
        href={contact.email ? `mailto:${contact.email}` : undefined}
        aria-disabled={!contact.email}
        className={`${link} ${contact.email ? "" : off}`}
      >
        <Mail className="h-4 w-4" />
        Email
      </a>
      <button
        type="button"
        onClick={() => onView(contact)}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-50"
      >
        View
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function ContactCard({
  contact,
  onView,
}: {
  contact: Contact;
  onView: (c: Contact) => void;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar name={contact.name} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-gray-900">{contact.name}</h3>
          <p className="text-sm text-gray-500">{KIND_LABEL[contact.kind]}</p>
          <p className="truncate text-sm text-gray-700">{contact.company || "-"}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          text={contact.status}
          className={STATUS_BADGE[contact.status] ?? STATUS_BADGE.Inactive}
        />
        {contact.sub && (
          <span className="truncate text-xs text-gray-500">{contact.sub}</span>
        )}
      </div>

      <ContactActions contact={contact} onView={onView} />
    </article>
  );
}

function ContactRow({
  contact,
  onView,
}: {
  contact: Contact;
  onView: (c: Contact) => void;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="p-3">
        <div className="flex items-center gap-3">
          <Avatar name={contact.name} />
          <span className="font-medium text-gray-900">{contact.name}</span>
        </div>
      </td>
      <td className="p-3">
        <Badge text={KIND_LABEL[contact.kind]} className={KIND_BADGE[contact.kind]} />
      </td>
      <td className="p-3">{contact.company || "-"}</td>
      <td className="p-3">{contact.phone || "-"}</td>
      <td className="p-3">{contact.email || "-"}</td>
      <td className="p-3">
        <Badge
          text={contact.status}
          className={STATUS_BADGE[contact.status] ?? STATUS_BADGE.Inactive}
        />
      </td>
      <td className="p-3">
        <button
          type="button"
          onClick={() => onView(contact)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-900 hover:underline"
        >
          View
          <ArrowRight className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

function Modal({
  title,
  onClose,
  children,
  maxWidth = "max-w-3xl",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`my-6 w-full ${maxWidth} rounded-xl bg-white p-5 shadow-xl md:p-6`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */

function DirectoryPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [success, setSuccess] = useState("");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const [tab, setTab] = useState<TabId>("ALL");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [view, setView] = useState<"grid" | "list">("grid");

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [viewing, setViewing] = useState<Contact | null>(null);
  const [formKind, setFormKind] = useState<Kind | null>(null);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [tool, setTool] = useState<Tool>(null);
  const [meeting, setMeeting] = useState({
    contactUid: "",
    date: todayLocal(),
    time: "11:00",
    duration: "30",
    note: "",
  });
  const [meetingError, setMeetingError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setWarning("");

    const kinds: Kind[] = ["CLIENT", "VENDOR", "PARTNER"];
    const results = await Promise.allSettled(
      kinds.map(async (kind) => {
        const res = await fetch(`${API_BASE}${KIND_ENDPOINT[kind]}`);
        const data = await readResponse(res);
        const rows: Record<string, unknown>[] = Array.isArray(data)
          ? data
          : (data.customers ?? data.data ?? data.partners ?? data.vendors ?? []);
        return rows.map((r) => toContact(kind, r));
      }),
    );

    const all: Contact[] = [];
    const failed: string[] = [];

    results.forEach((r, i) => {
      if (r.status === "fulfilled") all.push(...r.value);
      else failed.push(`${KIND_LABEL[kinds[i]]}s`);
    });

    setContacts(all);
    if (failed.length === kinds.length) {
      setError("Directory load jhale nahi. Server chalu aahe ka te tapasa.");
    } else {
      setLastSynced(new Date());
      if (failed.length > 0) {
        setWarning(`${failed.join(", ")} load jhale nahit. Baki contacts dakhavle aahet.`);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Add Contact menu baher click kela ki band
  useEffect(() => {
    if (!addMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!addMenuRef.current?.contains(e.target as Node)) setAddMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [addMenuOpen]);

  const counts = useMemo(
    () => ({
      ALL: contacts.length,
      CLIENT: contacts.filter((c) => c.kind === "CLIENT").length,
      VENDOR: contacts.filter((c) => c.kind === "VENDOR").length,
      PARTNER: contacts.filter((c) => c.kind === "PARTNER").length,
    }),
    [contacts],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    const rows = contacts.filter((c) => {
      if (tab !== "ALL" && c.kind !== tab) return false;
      if (statusFilter !== "All" && c.status !== statusFilter) return false;
      if (!q) return true;
      return [c.name, c.company, c.phone, c.email, c.sub, c.status, KIND_LABEL[c.kind]]
        .some((v) => v.toLowerCase().includes(q));
    });

    return rows.sort((a, b) => {
      if (sortBy === "company") return a.company.localeCompare(b.company);
      if (sortBy === "newest") return b.createdAt.localeCompare(a.createdAt);
      return a.name.localeCompare(b.name);
    });
  }, [contacts, tab, search, statusFilter, sortBy]);

  /* ---- Activity (recent adds / updates, tinhi tables madhun) ---- */

  const activity = useMemo(() => {
    return contacts
      .map((c) => {
        const created = new Date(c.createdAt).getTime();
        const updated = new Date(c.updatedAt || c.createdAt).getTime();
        const changed = updated - created > 60_000;
        return {
          contact: c,
          when: changed ? c.updatedAt : c.createdAt,
          action: changed ? "Updated" : "Added",
        };
      })
      .filter((a) => a.when)
      .sort((a, b) => b.when.localeCompare(a.when))
      .slice(0, 15);
  }, [contacts]);

  /* ---- Reports ---- */

  const report = useMemo(() => {
    const kinds: Kind[] = ["CLIENT", "VENDOR", "PARTNER"];

    const matrix = kinds.map((k) => {
      const rows = contacts.filter((c) => c.kind === k);
      return {
        kind: k,
        total: rows.length,
        active: rows.filter((c) => c.status === "Active").length,
        inactive: rows.filter((c) => c.status === "Inactive").length,
        lead: rows.filter((c) => c.status === "Lead").length,
      };
    });

    const vendorCats = new Map<string, number>();
    for (const c of contacts.filter((x) => x.kind === "VENDOR")) {
      const cat = str(c.raw.category) || "Uncategorised";
      vendorCats.set(cat, (vendorCats.get(cat) ?? 0) + 1);
    }

    const clients = contacts.filter((c) => c.kind === "CLIENT");

    return {
      matrix,
      vendorCats: [...vendorCats.entries()].sort((a, b) => b[1] - a[1]),
      projects: clients.reduce((s, c) => s + (Number(c.raw.projects) || 0), 0),
      value: clients.reduce((s, c) => s + (Number(c.raw.businessValue) || 0), 0),
    };
  }, [contacts]);

  /* ---- CSV export (jya list ahe tich) ---- */

  function exportCsv() {
    if (visible.length === 0) {
      setError("Export karayla contacts nahit.");
      return;
    }

    const header = ["Type", "Name", "Company", "Phone", "Email", "Status", "Details"];
    const lines = visible.map((c) =>
      [KIND_LABEL[c.kind], c.name, c.company, c.phone, c.email, c.status, c.sub]
        .map(csvCell)
        .join(","),
    );

    // BOM mule Excel madhe Marathi / Hindi nit disate
    const csv = `\uFEFF${[header.map(csvCell).join(","), ...lines].join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Directory_Contacts.csv";
    a.click();
    URL.revokeObjectURL(url);

    setError("");
    setSuccess(`${visible.length} contacts CSV madhe export jhale.`);
  }

  /* ---- Schedule meeting (Google Calendar link) ---- */

  function openMeeting(prefill?: Contact) {
    setViewing(null);
    setMeetingError("");
    setMeeting((m) => ({
      ...m,
      contactUid: prefill?.uid ?? m.contactUid,
    }));
    setTool("meeting");
  }

  function submitMeeting(e: React.FormEvent) {
    e.preventDefault();

    const contact = contacts.find((c) => c.uid === meeting.contactUid);
    if (!contact) {
      setMeetingError("Contact nivda.");
      return;
    }
    if (!meeting.date || !meeting.time) {
      setMeetingError("Tarkh ani vel bhara.");
      return;
    }

    const start = new Date(`${meeting.date}T${meeting.time}:00`);
    const end = new Date(start.getTime() + Number(meeting.duration) * 60_000);
    const fmt = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

    const title = `Meeting with ${contact.name}${contact.company ? ` (${contact.company})` : ""}`;
    const details = [
      meeting.note.trim(),
      contact.phone ? `Phone: ${contact.phone}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${fmt(start)}/${fmt(end)}`,
      details,
    });
    if (contact.email) params.set("add", contact.email);

    window.open(
      `https://calendar.google.com/calendar/render?${params.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
    setTool(null);
  }

  /* ---- form open / close ---- */

  function openAdd(kind: Kind) {
    setAddMenuOpen(false);
    setEditing(null);
    setFormKind(kind);
    setForm(emptyForm(kind));
    setFormError("");
    setSuccess("");
  }

  function openEdit(c: Contact) {
    setViewing(null);
    setEditing(c);
    setFormKind(c.kind);
    setForm(formFromContact(c));
    setFormError("");
    setSuccess("");
  }

  const closeForm = useCallback(() => {
    setFormKind(null);
    setEditing(null);
    setFormError("");
  }, []);

  const closeTool = useCallback(() => setTool(null), []);

  /* ---- save / delete ---- */

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formKind) return;

    for (const key of REQUIRED_FIELDS[formKind]) {
      if (!form[key]?.trim()) {
        setFormError(`${FIELD_LABEL[key]} bharne garjeche aahe.`);
        return;
      }
    }

    setSaving(true);
    setFormError("");

    try {
      const payload: Record<string, unknown> = {};
      for (const key of FORM_FIELDS[formKind]) payload[key] = form[key]?.trim() ?? "";

      // CRM customer PUT madhe projects / businessValue reset hot nahit
      // mhanun edit karatana junech values pathavto.
      if (formKind === "CLIENT" && editing) {
        payload.projects = Number(editing.raw.projects) || 0;
        payload.businessValue = Number(editing.raw.businessValue) || 0;
      }

      const url = editing
        ? `${API_BASE}${KIND_ENDPOINT[formKind]}/${encodeURIComponent(editing.id)}`
        : `${API_BASE}${KIND_ENDPOINT[formKind]}`;

      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await readResponse(res);

      setSuccess(`${KIND_LABEL[formKind]} ${editing ? "update" : "save"} jhala.`);
      closeForm();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save jhale nahi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Contact) {
    if (!window.confirm(`${c.name} (${KIND_LABEL[c.kind]}) delete karaycha aahe ka?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `${API_BASE}${KIND_ENDPOINT[c.kind]}/${encodeURIComponent(c.id)}`,
        { method: "DELETE" },
      );
      await readResponse(res);
      setViewing(null);
      setSuccess(`${KIND_LABEL[c.kind]} delete jhala.`);
      await load();
    } catch (err) {
      setViewing(null);
      setError(err instanceof Error ? err.message : "Delete jhale nahi.");
    }
  }

  /* ---- render ---- */

  const tabs: { id: TabId; label: string }[] = [
    { id: "ALL", label: "All Contacts" },
    { id: "CLIENT", label: "Clients" },
    { id: "VENDOR", label: "Vendors" },
    { id: "PARTNER", label: "Partners" },
  ];

  const stats = [
    { label: "Total Contacts", value: counts.ALL, icon: Users },
    { label: "Clients", value: counts.CLIENT, icon: Users },
    { label: "Vendors", value: counts.VENDOR, icon: Truck },
    { label: "Partners", value: counts.PARTNER, icon: Handshake },
  ];

  const focusSearch = () => {
    searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    searchRef.current?.focus();
  };

  const features: {
    icon: typeof Users;
    title: string;
    text: string;
    onClick?: () => void;
    soon?: boolean;
  }[] = [
    {
      icon: UserPlus,
      title: "Quick Add Contact",
      text: "Add clients, vendors or partners easily.",
      onClick: () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setAddMenuOpen(true);
      },
    },
    {
      icon: Search,
      title: "Advanced Search & Filter",
      text: "Find contacts by name, company, type, status.",
      onClick: focusSearch,
    },
    {
      icon: ContactIcon,
      title: "Contact Profile Card",
      text: "View full details of any contact.",
      onClick: () => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    {
      icon: Download,
      title: "Import/Export",
      text: "Export contacts to CSV. Import is coming.",
      onClick: exportCsv,
    },
    {
      icon: Phone,
      title: "Communication Actions",
      text: "Call, Email, WhatsApp directly from directory.",
      onClick: () => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    {
      icon: History,
      title: "Activity Timeline",
      text: "Track recent additions and changes.",
      onClick: () => setTool("activity"),
    },
    {
      icon: Tags,
      title: "Tags & Categories",
      text: "Organize contacts with tags.",
      soon: true,
    },
    {
      icon: BarChart3,
      title: "Reports",
      text: "Get insights on your network.",
      onClick: () => setTool("reports"),
    },
  ];

  const actionCards = [
    {
      icon: CalendarPlus,
      title: "Schedule Meeting",
      text: "Book meetings with clients or vendors.",
      button: "Book Now",
      onClick: () => openMeeting(),
    },
    {
      icon: History,
      title: "View Activity",
      text: "Check recent additions and updates.",
      button: "View Activity",
      onClick: () => setTool("activity"),
    },
    {
      icon: BarChart3,
      title: "Directory Reports",
      text: "Get reports on clients, vendors and partners.",
      button: "View Reports",
      onClick: () => setTool("reports"),
    },
    {
      icon: RefreshCcw,
      title: "Sync with CRM",
      text: lastSynced
        ? `Last synced at ${lastSynced.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.`
        : "Keep your directory data in sync.",
      button: loading ? "Syncing..." : "Sync Now",
      onClick: () => void load(),
    },
  ];

  const meetingContacts = [...contacts].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <AppShell title="Directory">
      <div className="grid gap-5 p-4 md:p-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          {/* header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Directory</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your contacts, vendors, and partners in one place.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>

              <div className="relative" ref={addMenuRef}>
                <button
                  type="button"
                  onClick={() => setAddMenuOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={addMenuOpen}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-800 px-4 py-2 text-sm font-medium text-white hover:bg-amber-900"
                >
                  <Plus className="h-4 w-4" />
                  Add Contact
                  <ChevronDown className="h-4 w-4" />
                </button>

                {addMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border bg-white shadow-lg"
                  >
                    {(["CLIENT", "VENDOR", "PARTNER"] as Kind[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        role="menuitem"
                        onClick={() => openAdd(k)}
                        className="block w-full px-4 py-2.5 text-left text-sm hover:bg-amber-50"
                      >
                        New {KIND_LABEL[k]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {warning && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {warning}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* tabs */}
          <div className="flex flex-wrap gap-2" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                  tab === t.id
                    ? "border-amber-800 bg-amber-800 text-white"
                    : "bg-white text-gray-700 hover:bg-amber-50"
                }`}
              >
                {t.label} ({counts[t.id]})
              </button>
            ))}
          </div>

          {/* stat cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 rounded-xl border bg-white p-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-900">
                  <s.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* toolbar */}
          <div className="flex flex-col gap-3 rounded-xl border bg-white p-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, company, phone..."
                aria-label="Search contacts"
                className={`${inputClass} pl-9`}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className={`${inputClass} md:w-40`}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Lead">Lead</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              aria-label="Sort contacts"
              className={`${inputClass} md:w-44`}
            >
              <option value="name">Sort by: Name</option>
              <option value="company">Sort by: Company</option>
              <option value="newest">Sort by: Newest</option>
            </select>

            <div className="flex overflow-hidden rounded-lg border">
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                className={`p-2.5 ${view === "grid" ? "bg-amber-800 text-white" : "hover:bg-gray-50"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                aria-label="List view"
                aria-pressed={view === "list"}
                className={`p-2.5 ${view === "list" ? "bg-amber-800 text-white" : "hover:bg-gray-50"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* contacts */}
          <div ref={listRef} className="scroll-mt-20">
            {loading && contacts.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">Loading contacts...</p>
            ) : visible.length === 0 ? (
              <div className="rounded-xl border bg-white p-10 text-center text-sm text-gray-500">
                {contacts.length === 0
                  ? "No contacts yet. Use Add Contact to create the first one."
                  : "No contacts match this search or filter."}
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {visible.map((c) => (
                  <ContactCard key={c.uid} contact={c} onView={setViewing} />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Company</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {visible.map((c) => (
                      <ContactRow key={c.uid} contact={c} onView={setViewing} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* quick action cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {actionCards.map((card) => (
              <div
                key={card.title}
                className="flex flex-col gap-3 rounded-xl border border-amber-100 bg-amber-50/60 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-amber-800">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">{card.title}</h3>
                    <p className="text-sm text-gray-600">{card.text}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={card.onClick}
                  className="inline-flex w-fit items-center gap-1.5 rounded-md bg-amber-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-900"
                >
                  {card.button}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* KEY FEATURES panel */}
        <aside className="min-w-0 xl:sticky xl:top-20 xl:self-start">
          <div className="overflow-hidden rounded-xl border bg-white">
            <h2 className="bg-amber-50 px-4 py-3 text-lg font-semibold text-gray-900">
              Key Features
            </h2>

            <ul className="divide-y">
              {features.map((f) => {
                const body = (
                  <>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        {f.title}
                        {f.soon && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                            Soon
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{f.text}</p>
                    </div>
                  </>
                );

                return (
                  <li key={f.title}>
                    {f.onClick ? (
                      <button
                        type="button"
                        onClick={f.onClick}
                        className="flex w-full items-start gap-3 px-4 py-3 hover:bg-amber-50/60"
                      >
                        {body}
                      </button>
                    ) : (
                      <div className="flex items-start gap-3 px-4 py-3 opacity-70">
                        {body}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>

      {/* VIEW MODAL */}
      {viewing && (
        <Modal title="Contact details" onClose={() => setViewing(null)}>
          <div className="mb-5 flex items-center gap-4">
            <Avatar name={viewing.name} size="lg" />
            <div className="min-w-0">
              <h3 className="truncate text-xl font-semibold">{viewing.name}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge text={KIND_LABEL[viewing.kind]} className={KIND_BADGE[viewing.kind]} />
                <Badge
                  text={viewing.status}
                  className={STATUS_BADGE[viewing.status] ?? STATUS_BADGE.Inactive}
                />
              </div>
            </div>
          </div>

          {/* communication actions */}
          <div className="mb-5 flex flex-wrap gap-2">
            {viewing.phone && (
              <a
                href={`tel:${viewing.phone}`}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
            )}
            {viewing.email && (
              <a
                href={`mailto:${viewing.email}`}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
            )}
            {viewing.phone && whatsappLink(viewing.phone) && (
              <a
                href={whatsappLink(viewing.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
            <button
              type="button"
              onClick={() => openMeeting(viewing)}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              <CalendarPlus className="h-4 w-4" />
              Schedule meeting
            </button>
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {FORM_FIELDS[viewing.kind]
              .filter((k) => k !== "name" && k !== "status")
              .map((k) => (
                <div key={k} className={LONG_FIELDS.includes(k) ? "sm:col-span-2" : ""}>
                  <dt className="text-gray-500">{FIELD_LABEL[k]}</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-gray-900">
                    {str(viewing.raw[k]) || "-"}
                  </dd>
                </div>
              ))}
          </dl>

          {viewing.kind === "CLIENT" && (
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-gray-500">Projects</p>
                <p className="mt-0.5 text-lg font-semibold">
                  {Number(viewing.raw.projects) || 0}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-gray-500">Business Value</p>
                <p className="mt-0.5 text-lg font-semibold">
                  {"\u20B9"}
                  {(Number(viewing.raw.businessValue) || 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-gray-500">
            Added {timeAgo(viewing.createdAt) || "-"}
            {viewing.updatedAt && viewing.updatedAt !== viewing.createdAt
              ? `, last updated ${timeAgo(viewing.updatedAt)}`
              : ""}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openEdit(viewing)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => void handleDelete(viewing)}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            <button
              type="button"
              onClick={() => setViewing(null)}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* ADD / EDIT MODAL */}
      {formKind && (
        <Modal
          title={`${editing ? "Edit" : "Add"} ${KIND_LABEL[formKind]}`}
          onClose={closeForm}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {FORM_FIELDS[formKind]
                .filter((k) => !LONG_FIELDS.includes(k))
                .map((k) => {
                  const required = REQUIRED_FIELDS[formKind].includes(k);
                  return (
                    <label key={k} className="space-y-1 text-sm">
                      <span>
                        {FIELD_LABEL[k]}
                        {required ? " *" : ""}
                      </span>

                      {k === "status" ? (
                        <select
                          className={inputClass}
                          value={form.status}
                          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                        >
                          {STATUS_OPTIONS[formKind].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : k === "category" ? (
                        <select
                          className={inputClass}
                          value={form.category}
                          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                        >
                          <option value="">Select category</option>
                          {VENDOR_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className={inputClass}
                          type={k === "email" ? "email" : "text"}
                          required={required}
                          value={form[k] ?? ""}
                          onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                        />
                      )}
                    </label>
                  );
                })}
            </div>

            {FORM_FIELDS[formKind]
              .filter((k) => LONG_FIELDS.includes(k))
              .map((k) => (
                <label key={k} className="block space-y-1 text-sm">
                  <span>{FIELD_LABEL[k]}</span>
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={form[k] ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  />
                </label>
              ))}

            {formError && (
              <p className="text-sm font-medium text-red-600">{formError}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-amber-800 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editing
                    ? `Update ${KIND_LABEL[formKind]}`
                    : `Save ${KIND_LABEL[formKind]}`}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border px-5 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ACTIVITY MODAL */}
      {tool === "activity" && (
        <Modal title="Recent activity" onClose={closeTool} maxWidth="max-w-xl">
          {activity.length === 0 ? (
            <p className="text-sm text-gray-500">No activity yet.</p>
          ) : (
            <ul className="divide-y">
              {activity.map((a) => (
                <li key={a.contact.uid}>
                  <button
                    type="button"
                    onClick={() => {
                      closeTool();
                      setViewing(a.contact);
                    }}
                    className="flex w-full items-center gap-3 py-3 text-left hover:bg-gray-50"
                  >
                    <Avatar name={a.contact.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {a.contact.name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {KIND_LABEL[a.contact.kind]} {a.action.toLowerCase()}
                        {a.contact.company ? ` - ${a.contact.company}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-500">
                      {timeAgo(a.when)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-gray-500">
            Shows the latest contacts added or edited across Clients, Vendors and Partners.
          </p>
        </Modal>
      )}

      {/* REPORTS MODAL */}
      {tool === "reports" && (
        <Modal title="Directory reports" onClose={closeTool} maxWidth="max-w-2xl">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Active</th>
                  <th className="p-3 text-right">Inactive</th>
                  <th className="p-3 text-right">Lead</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {report.matrix.map((row) => (
                  <tr key={row.kind}>
                    <td className="p-3 font-medium">{KIND_LABEL[row.kind]}s</td>
                    <td className="p-3 text-right">{row.total}</td>
                    <td className="p-3 text-right">{row.active}</td>
                    <td className="p-3 text-right">{row.inactive}</td>
                    <td className="p-3 text-right">
                      {row.kind === "CLIENT" ? row.lead : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 text-sm font-semibold">Clients</h3>
              <p className="text-sm text-gray-600">
                Projects: <span className="font-semibold text-gray-900">{report.projects}</span>
              </p>
              <p className="text-sm text-gray-600">
                Business value:{" "}
                <span className="font-semibold text-gray-900">
                  {"\u20B9"}
                  {report.value.toLocaleString("en-IN")}
                </span>
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-2 text-sm font-semibold">Vendors by category</h3>
              {report.vendorCats.length === 0 ? (
                <p className="text-sm text-gray-500">No vendors yet.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {report.vendorCats.map(([cat, n]) => (
                    <li key={cat} className="flex justify-between">
                      <span className="text-gray-600">{cat}</span>
                      <span className="font-semibold text-gray-900">{n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Export CSV ({visible.length})
            </button>
            <button
              type="button"
              onClick={closeTool}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* MEETING MODAL */}
      {tool === "meeting" && (
        <Modal title="Schedule meeting" onClose={closeTool} maxWidth="max-w-lg">
          <form onSubmit={submitMeeting} className="space-y-4">
            <label className="block space-y-1 text-sm">
              <span>Contact *</span>
              <select
                className={inputClass}
                value={meeting.contactUid}
                onChange={(e) => setMeeting((m) => ({ ...m, contactUid: e.target.value }))}
              >
                <option value="">Select contact</option>
                {meetingContacts.map((c) => (
                  <option key={c.uid} value={c.uid}>
                    {c.name} ({KIND_LABEL[c.kind]})
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="space-y-1 text-sm">
                <span>Date *</span>
                <input
                  type="date"
                  className={inputClass}
                  value={meeting.date}
                  onChange={(e) => setMeeting((m) => ({ ...m, date: e.target.value }))}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>Time *</span>
                <input
                  type="time"
                  className={inputClass}
                  value={meeting.time}
                  onChange={(e) => setMeeting((m) => ({ ...m, time: e.target.value }))}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>Duration</span>
                <select
                  className={inputClass}
                  value={meeting.duration}
                  onChange={(e) => setMeeting((m) => ({ ...m, duration: e.target.value }))}
                >
                  <option value="30">30 min</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </label>
            </div>

            <label className="block space-y-1 text-sm">
              <span>Notes</span>
              <textarea
                className={inputClass}
                rows={2}
                value={meeting.note}
                onChange={(e) => setMeeting((m) => ({ ...m, note: e.target.value }))}
              />
            </label>

            {meetingError && (
              <p className="text-sm font-medium text-red-600">{meetingError}</p>
            )}

            <p className="text-xs text-gray-500">
              This opens Google Calendar with the details filled in. The meeting is saved in
              your calendar, not inside the ERP.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-lg bg-amber-800 px-5 py-2 text-sm font-medium text-white hover:bg-amber-900"
              >
                Add to Google Calendar
              </button>
              <button
                type="button"
                onClick={closeTool}
                className="rounded-lg border px-5 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}