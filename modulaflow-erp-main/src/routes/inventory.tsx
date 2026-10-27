import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Package, Image as ImageIcon, Upload, X, Save, Pencil, Trash2, FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { AppShell } from "@/components/erp/AppShell";
import { NUM } from "@/lib/erp/units";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory & Product Catalogue | Payal Decor ERP" },
      {
        name: "description",
        content: "Search products, dimensions, prices and stock.",
      },
    ],
  }),
  component: Inventory,
});

type Product = {
  srNo: string;
  itemName: string;
  dimension: string;
  price: number;
  category: string;
  image?: string;
};

/* ------------------------------------------------------------------
   Smart Edge Industries - Price List For Desk Based Workstation
   Elite Series (W.e.f 1st August 2024)

   DATA: Production page sarkha - var form, khali saved list.
   Add / Edit / Delete kelele products browser madhe save hotat.
------------------------------------------------------------------- */

type Group = {
  no: number;
  category: string;
  /** item name prefix */
  name: string;
  /** sizes (600, 750 ...) */
  sizes: number[];
  /** how to make dimension from size */
  dim: (s: number) => string;
  prices: number[];
};

const W9 = [600, 750, 900, 1050, 1200, 1350, 1500, 1650, 1800];
const W5 = [600, 750, 900, 1050, 1200];
const L11 = [750, 900, 1050, 1200, 1350, 1500, 1650, 1800, 1950, 2100, 2400];
const L8 = [750, 900, 1050, 1200, 1350, 1500, 1650, 1800];

const legDim = (s: number) => `${s - 10}X725`;
const strDim = (s: number) => `${s - 10}X725/50`;
const spineDim = (s: number) => `${s}X58x78`;
const beamDim = (s: number) => `${s}X25x50`;

const SPINE_PRICES = [600, 650, 750, 800, 900, 1000, 1100, 1150, 1250, 1350, 1500];

const GROUPS: Group[] = [
  {
    no: 1, category: "Elite C Side Legs",
    name: "Elite C Side Leg", sizes: W9, dim: legDim,
    prices: [2850, 2900, 3100, 3200, 3300, 3400, 3500, 3600, 3650],
  },
  {
    no: 2, category: "Elite C Mid Legs",
    name: "Elite C Mid Leg", sizes: W9, dim: legDim,
    prices: [2850, 2900, 3000, 3100, 3150, 3250, 3300, 3350, 3500],
  },
  {
    no: 3, category: "Elite T Mid Legs",
    name: "Elite T Mid Leg", sizes: W9, dim: legDim,
    prices: [1600, 1650, 1700, 1800, 1850, 1900, 1950, 2000, 2050],
  },
  {
    no: 4, category: "Elite T Mid Leg With Plate",
    name: "Elite T Mid Leg With Plate", sizes: W9, dim: legDim,
    prices: [2650, 2700, 2750, 3200, 3300, 3350, 4100, 4150, 4200],
  },
  {
    no: 5, category: "Elite C Mid Leg 1 Side Storage Support",
    name: "Elite C Mid Leg 1 Str Sppt-", sizes: W5, dim: strDim,
    prices: [2250, 2300, 2350, 2450, 2500],
  },
  {
    no: 6, category: "Elite C Mid Leg 2 Side Storage Support",
    name: "Elite C Mid Leg 2 Str Sppt-", sizes: W5, dim: strDim,
    prices: [1650, 1700, 1750, 1850, 1900],
  },
  {
    no: 7, category: "Elite C Side Leg 1 Side Storage Support",
    name: "Elite C Side Leg 1 Str Sppt-", sizes: W5, dim: strDim,
    prices: [2250, 2300, 2450, 2500, 2600],
  },
  {
    no: 8, category: "Elite C Side Leg 2 Side Storage Support",
    name: "Elite C Side Leg 2 Str Sppt-", sizes: W5, dim: strDim,
    prices: [1600, 1700, 1800, 1900, 2000],
  },
  {
    no: 9, category: "Elite Fst Spine",
    name: "Elite Fst Spine", sizes: L11, dim: spineDim, prices: SPINE_PRICES,
  },
  {
    no: 10, category: "Elite Side/Mid Spine",
    name: "Elite Side/Mid Spine", sizes: L11, dim: spineDim, prices: SPINE_PRICES,
  },
  {
    no: 11, category: "Elite Mid Beam",
    name: "Elite Mid Beam", sizes: L8, dim: beamDim,
    prices: [500, 500, 550, 600, 650, 700, 750, 800],
  },
];

const SEED_PRODUCTS: Product[] = GROUPS.flatMap((g) =>
  g.sizes.map((s, i) => ({
    srNo: `${g.no}.${i + 1}`,
    itemName: g.name.endsWith("-") ? `${g.name} ${s}` : `${g.name} - ${s}`,
    dimension: g.dim(s),
    price: g.prices[i],
    category: g.category,
  })),
);

const PRODUCTS_KEY = "payal-erp-products";
const OLD_IMAGE_KEY = "payal-erp-product-images"; // earlier version (images by Sr.No)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const EMPTY_FORM = {
  srNo: "",
  itemName: "",
  dimension: "",
  price: "",
  category: "",
  image: "",
};

const inputCls =
  "h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

const bySrNo = (a: Product, b: Product) =>
  a.srNo.localeCompare(b.srNo, undefined, { numeric: true });

/** Resize to max px (default 400) and return a compact data URL (keeps localStorage small). */
function fileToDataUrl(file: Blob, max = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("invalid image"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------
   Excel madhle images vachnyasathi helpers
   (.xlsx = zip file; images xl/media madhe, row anchor drawing xml madhe)
------------------------------------------------------------------- */

const REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
};

const xmlDoc = (s: string) => new DOMParser().parseFromString(s, "application/xml");
const byLocal = (root: Document | Element, name: string) =>
  Array.from(root.getElementsByTagNameNS("*", name));

/** "../media/x.png" sarkhe relative path ala tar full zip path kara */
function resolvePath(base: string, target: string) {
  if (target.startsWith("/")) return target.slice(1);
  const parts = base.split("/").slice(0, -1);
  for (const seg of target.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg !== ".") parts.push(seg);
  }
  return parts.join("/");
}

async function readRels(zip: JSZip, path: string): Promise<Record<string, string>> {
  const dir = path.split("/").slice(0, -1).join("/");
  const name = path.split("/").pop();
  const f = zip.file(`${dir}/_rels/${name}.rels`);
  const map: Record<string, string> = {};
  if (!f) return map;
  const doc = xmlDoc(await f.async("string"));
  for (const r of byLocal(doc, "Relationship")) {
    map[r.getAttribute("Id") ?? ""] = resolvePath(path, r.getAttribute("Target") ?? "");
  }
  return map;
}

/** Excel sheet madhle images: 0-based row number -> image Blob */
async function readSheetImages(buf: ArrayBuffer, sheetName: string): Promise<Map<number, Blob>> {
  const out = new Map<number, Blob>();
  try {
    const zip = await JSZip.loadAsync(buf);
    const wbDoc = xmlDoc(await zip.file("xl/workbook.xml")!.async("string"));
    const wbRels = await readRels(zip, "xl/workbook.xml");
    const sheetEl = byLocal(wbDoc, "sheet").find((s) => s.getAttribute("name") === sheetName);
    const rid = sheetEl?.getAttributeNS(REL_NS, "id");
    const sheetPath = rid ? wbRels[rid] : undefined;
    if (!sheetPath) return out;

    const sheetRels = await readRels(zip, sheetPath);
    const sheetDoc = xmlDoc(await zip.file(sheetPath)!.async("string"));
    const drId = byLocal(sheetDoc, "drawing")[0]?.getAttributeNS(REL_NS, "id");
    const drawingPath = drId ? sheetRels[drId] : undefined;
    if (!drawingPath) return out;

    const drawRels = await readRels(zip, drawingPath);
    const drawDoc = xmlDoc(await zip.file(drawingPath)!.async("string"));
    const anchors = [...byLocal(drawDoc, "oneCellAnchor"), ...byLocal(drawDoc, "twoCellAnchor")];

    for (const a of anchors) {
      const from = byLocal(a, "from")[0];
      const rowText = from ? byLocal(from, "row")[0]?.textContent : null;
      const embed = byLocal(a, "blip")[0]?.getAttributeNS(REL_NS, "embed");
      const mediaPath = embed ? drawRels[embed] : undefined;
      if (rowText == null || !mediaPath) continue;

      const row = Number(rowText);
      if (out.has(row)) continue;
      const media = zip.file(mediaPath);
      if (!media) continue;

      const ext = mediaPath.split(".").pop()!.toLowerCase();
      const bytes = await media.async("uint8array");
      out.set(row, new Blob([bytes as unknown as BlobPart], { type: MIME[ext] ?? "image/png" }));
    }
  } catch {
    /* images optional - data tari import hoil */
  }
  return out;
}

/** Thumbnail in table rows: click = zoom (if image exists), click = upload (if no image). */
function ProductImage({
  src,
  alt,
  onPick,
  onRemove,
}: {
  src?: string;
  alt: string;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(false);

  // Esc dabla ki zoom band
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  return (
    <div className="group relative mx-auto h-14 w-16">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => (src ? setZoom(true) : inputRef.current?.click())}
        title={src ? "Click to zoom" : "Click to upload image"}
        aria-label={src ? `Zoom image of ${alt}` : `Upload image for ${alt}`}
        className={cn(
          "relative flex h-14 w-16 items-center justify-center overflow-hidden rounded-md border border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary",
          src ? "cursor-zoom-in" : "cursor-pointer",
        )}
      >
        {src ? (
          <img src={src} alt={alt} className="h-full w-full bg-white object-contain" />
        ) : (
          <span className="flex flex-col items-center">
            <ImageIcon size={20} />
            <span className="mt-1 text-[10px]">Upload</span>
          </span>
        )}
      </button>

      {src && (
        <>
          {/* image badla */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            title="Change image"
            aria-label="Change image"
            className="absolute -bottom-1.5 -right-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-primary text-white group-hover:flex"
          >
            <Upload size={11} />
          </button>

          {/* image kadha */}
          <button
            type="button"
            onClick={onRemove}
            title="Remove image"
            aria-label="Remove image"
            className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-destructive text-white group-hover:flex"
          >
            <X size={10} />
          </button>
        </>
      )}

      {/* ZOOM POPUP */}
      {zoom && src && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/70 p-6"
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={src}
              alt={alt}
              className="max-h-[80vh] max-w-[90vw] rounded-xl bg-white object-contain shadow-2xl"
            />
            <p className="mt-3 text-center text-sm font-medium text-white">{alt}</p>
            <button
              type="button"
              onClick={() => setZoom(false)}
              aria-label="Close"
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-muted"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Inventory() {
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingSrNo, setEditingSrNo] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const formRef = useRef<HTMLElement>(null);
  const formImageRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

    // ---- products are stored in the shared database (server) ----
  const syncedRef = useRef<Map<string, string>>(new Map());
  const [serverOk, setServerOk] = useState(false);

  // load: server list; browser's old saved list is merged in once (migration)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let local: Product[] | null = null;
      try {
        const raw = localStorage.getItem(PRODUCTS_KEY);
        local = raw ? JSON.parse(raw) : null;
        const oldRaw = localStorage.getItem(OLD_IMAGE_KEY);
        if (local && oldRaw) {
          const old: Record<string, string> = JSON.parse(oldRaw);
          local = local.map((p) => (!p.image && old[p.srNo] ? { ...p, image: old[p.srNo] } : p));
        }
      } catch {
        /* ignore */
      }

      try {
        const res = await fetch(`${API_URL}/inventory-products`);
        if (!res.ok) throw new Error("load failed");
        const server: Product[] = await res.json();
        if (cancelled) return;

        const byNo = new Map(server.map((p) => [p.srNo, p]));
        if (server.length === 0) {
          // database empty: first time, push this browser's list (or the seed list)
          setProducts(local ?? SEED_PRODUCTS);
        } else {
          for (const p of local ?? []) {
            const s = byNo.get(p.srNo);
            if (!s) byNo.set(p.srNo, p);
            else if (!s.image && p.image) byNo.set(p.srNo, { ...s, image: p.image });
          }
          setProducts([...byNo.values()]);
        }
        syncedRef.current = new Map(server.map((p) => [p.srNo, JSON.stringify(p)]));
        setServerOk(true);
      } catch {
        if (cancelled) return;
        setProducts(local ?? SEED_PRODUCTS);
        setError("Server shi connect hot nahi. Thoda vel thamba ani page refresh kara.");
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // save: send only the changed / deleted rows to the server
  useEffect(() => {
    if (!loaded || !serverOk) return;

    const current = new Map(products.map((p) => [p.srNo, JSON.stringify(p)]));
    const upserts = products.filter(
      (p) => syncedRef.current.get(p.srNo) !== current.get(p.srNo),
    );
    const deletes = [...syncedRef.current.keys()].filter((k) => !current.has(k));

    const clearLocal = () => {
      try {
        localStorage.removeItem(PRODUCTS_KEY);
        localStorage.removeItem(OLD_IMAGE_KEY);
      } catch {
        /* ignore */
      }
    };

    if (upserts.length === 0 && deletes.length === 0) {
      clearLocal();
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/inventory-products/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ upserts, deletes }),
        });
        if (!res.ok) throw new Error("save failed");
        syncedRef.current = current;
        clearLocal();
      } catch {
        setError("Save jhale nahi (server). Internet tapasa ani punha prayatna kara.");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [products, loaded, serverOk]);
    
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((p) => {
      const matchesCategory = category === "All" || p.category === category;
      const matchesSearch =
        !query ||
        p.srNo.toLowerCase().includes(query) ||
        p.itemName.toLowerCase().includes(query) ||
        p.dimension.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        String(p.price).includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, search, category]);

  const setField = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
    setMessage("");
  };

  const clearForm = () => {
    setForm(EMPTY_FORM);
    setEditingSrNo(null);
    setError("");
    setMessage("");
  };

  const pickImage = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      setError("Kripya image file (PNG/JPG) nivda.");
      return null;
    }
    try {
      return await fileToDataUrl(file);
    } catch {
      setError("Image load karta aali nahi.");
      return null;
    }
  };

  const saveProduct = () => {
    const srNo = form.srNo.trim();
    const itemName = form.itemName.trim();
    const price = Number(form.price);

    if (!srNo || !itemName || form.price === "" || Number.isNaN(price) || price < 0) {
      setError("Sr.No, Item Name ani Price (number) bharne garjeche aahe.");
      return;
    }
    if (srNo !== editingSrNo && products.some((p) => p.srNo === srNo)) {
      setError(`Sr.No ${srNo} adhich aahe. Dusra Sr.No vapra.`);
      return;
    }

    const item: Product = {
      srNo,
      itemName,
      dimension: form.dimension.trim(),
      price,
      category: form.category.trim() || "Uncategorised",
      image: form.image || undefined,
    };

    setProducts((prev) =>
      (editingSrNo ? prev.map((p) => (p.srNo === editingSrNo ? item : p)) : [...prev, item]).sort(bySrNo),
    );
    setMessage(editingSrNo ? `${srNo} update zale.` : `${srNo} save zale.`);
    setForm(EMPTY_FORM);
    setEditingSrNo(null);
    setError("");
  };

  const editProduct = (p: Product) => {
    setForm({
      srNo: p.srNo,
      itemName: p.itemName,
      dimension: p.dimension,
      price: String(p.price),
      category: p.category,
      image: p.image ?? "",
    });
    setEditingSrNo(p.srNo);
    setError("");
    setMessage("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const deleteProduct = (p: Product) => {
    if (!confirm(`"${p.itemName}" (${p.srNo}) delete karaycha?`)) return;
    setProducts((prev) => prev.filter((x) => x.srNo !== p.srNo));
    if (editingSrNo === p.srNo) clearForm();
  };

  const setRowImage = async (srNo: string, file: File) => {
    const url = await pickImage(file);
    if (url) setProducts((prev) => prev.map((p) => (p.srNo === srNo ? { ...p, image: url } : p)));
  };

  const removeRowImage = (srNo: string) =>
    setProducts((prev) => prev.map((p) => (p.srNo === srNo ? { ...p, image: undefined } : p)));

  // ---- Excel export: whole catalogue -> .xlsx ----
  const exportExcel = () => {
    if (products.length === 0) {
      setError("Export karayla kahich products nahit.");
      return;
    }
    const rows = products.map((p) => ({
      "Sr.No": p.srNo,
      "Item Name": p.itemName,
      "Dimension (mm)": p.dimension,
      "Price (₹)": p.price,
      Category: p.category,
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet["!cols"] = [{ wch: 10 }, { wch: 44 }, { wch: 16 }, { wch: 12 }, { wch: 42 }];
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Products");
    XLSX.writeFile(book, "Product_Catalogue.xlsx");
    setError("");
    setMessage(`${products.length} products Excel madhe export zale.`);
  };

  // ---- Excel import: update by Sr.No, add new ones, images pan ghya ----
  const importExcel = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const book = XLSX.read(buf, { type: "array" });
      const norm = (v: unknown) => String(v ?? "").toLowerCase().replace(/[^a-z]/g, "");

      /** exact naav adhi shodha, nantar "starts with" (not = vagla karaychi naave) */
      const colIndex = (h: string[], exact: string[], starts: string[], not: string[] = []) => {
        for (const e of exact) {
          const i = h.indexOf(e);
          if (i >= 0) return i;
        }
        return h.findIndex(
          (x) => starts.some((s) => x.startsWith(s)) && !not.some((n) => x.startsWith(n)),
        );
      };

      // find the sheet + heading row that has Sr.No / Item Name / Price (or Rate) columns
      // (heading row need not be the first row - title rows above it are fine)
      let grid: unknown[][] = [];
      let headerAt = -1;
      let foundSheet = "";
      let col = { sr: -1, name: -1, dim: -1, price: -1, cat: -1 };

      for (const sheetName of book.SheetNames) {
        const g = XLSX.utils.sheet_to_json<unknown[]>(book.Sheets[sheetName], {
          header: 1,
          defval: "",
          raw: false,
        });
        for (let r = 0; r < Math.min(g.length, 30); r++) {
          const h = g[r].map(norm);
          const c = {
            sr: colIndex(h, ["srno"], ["srno"]),
            name: colIndex(h, ["itemname"], ["itemname"]),
            dim: colIndex(
              h,
              ["dimension", "dimensions"],
              ["dimension", "sizemm", "sizewidth"],
              ["dimensiontype"],
            ),
            price: colIndex(h, ["price"], ["price", "rate"]),
            cat: colIndex(h, ["category"], ["category"]),
          };
          if (c.sr >= 0 && c.name >= 0 && c.price >= 0) {
            grid = g;
            headerAt = r;
            col = c;
            foundSheet = sheetName;
            break;
          }
        }
        if (headerAt >= 0) break;
      }

      if (headerAt < 0) {
        setMessage("");
        setError("Excel madhe Sr.No, Item Name ani Price (kinva Rate) he heading sapadle nahit.");
        return;
      }

      // images: sheet madhle row-nusar images (row number = grid index + first used row)
      const firstRow = XLSX.utils.decode_range(book.Sheets[foundSheet]["!ref"] ?? "A1").s.r;
      const sheetImages = await readSheetImages(buf, foundSheet);

      const cell = (row: unknown[], i: number) => (i >= 0 ? String(row[i] ?? "").trim() : "");

      const next = [...products];
      const seen = new Set<string>();
      let added = 0;
      let updated = 0;
      let skipped = 0;
      let duplicates = 0;
      let withImage = 0;
      let group = ""; // category taken from group heading rows (e.g. "Elite C Side Legs")

      for (let r = headerAt + 1; r < grid.length; r++) {
        const row = grid[r];
        const srNo = cell(row, col.sr);
        const itemName = cell(row, col.name);
        const priceText = cell(row, col.price).replace(/[^0-9.]/g, "");

        if (!srNo && !itemName && !priceText) continue; // blank row

        if (priceText === "") {
          // no price: either a group heading row (Sr.No like "1") or an incomplete item row
          if (srNo.includes(".") && itemName) skipped++;
          else if (srNo && itemName) group = itemName;
          continue;
        }

        const price = Number(priceText);
        if (!srNo || !itemName || Number.isNaN(price)) {
          skipped++;
          continue;
        }

        if (seen.has(srNo)) duplicates++;
        seen.add(srNo);

        const dimension = cell(row, col.dim);
        const cat = cell(row, col.cat) || group;

        let image: string | undefined;
        const blob = sheetImages.get(firstRow + r);
        if (blob) {
          try {
            image = await fileToDataUrl(blob, 240);
            withImage++;
          } catch {
            /* image kharab - skip */
          }
        }

        const idx = next.findIndex((p) => p.srNo === srNo);

        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            itemName,
            dimension,
            price,
            category: cat || next[idx].category,
            image: image ?? next[idx].image,
          };
          updated++;
        } else {
          next.push({ srNo, itemName, dimension, price, category: cat || "Uncategorised", image });
          added++;
        }
      }

      setProducts(next.sort(bySrNo));
      setError("");
      setMessage(
        `Import zale: ${added} navin, ${updated} update, ${withImage} images` +
          (skipped ? `, ${skipped} rows skip` : "") +
          (duplicates ? `. SAVDHAN: ${duplicates} rows chi Sr.No repeat zali - tya overwrite zalya` : "") +
          ".",
      );
    } catch {
      setMessage("");
      setError("Excel file vachta aali nahi. .xlsx kinva .csv file vapra.");
    }
  };

  const labelCls = "mb-2 block text-sm font-semibold";

  return (
    <AppShell title="Inventory">
      {/* ADD / EDIT PRODUCT FORM */}
      <section
        ref={formRef}
        className="scroll-mt-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
      >
        <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
          <Package size={20} />
          {editingSrNo ? `Edit Product - ${editingSrNo}` : "Add Product"}
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="p-srno">Sr.No</label>
            <input
              id="p-srno"
              value={form.srNo}
              onChange={(e) => setField("srNo", e.target.value)}
              placeholder="e.g. 1.10"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="p-name">Item Name</label>
            <input
              id="p-name"
              value={form.itemName}
              onChange={(e) => setField("itemName", e.target.value)}
              placeholder="e.g. Elite C Side Leg - 600"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="p-dim">Dimension</label>
            <input
              id="p-dim"
              value={form.dimension}
              onChange={(e) => setField("dimension", e.target.value)}
              placeholder="e.g. 590X725"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="p-price">Price (₹)</label>
            <input
              id="p-price"
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setField("price", e.target.value)}
              placeholder="e.g. 2850"
              className={inputCls}
            />
          </div>

          <div>
            <span className={labelCls}>Image</span>
            <div className="flex h-12 items-center gap-3">
              <input
                ref={formImageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  const url = await pickImage(file);
                  if (url) setField("image", url);
                }}
              />
              <button
                type="button"
                onClick={() => formImageRef.current?.click()}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium hover:border-primary hover:text-primary"
              >
                <Upload size={16} />
                {form.image ? "Change image" : "Choose image"}
              </button>

              {form.image && (
                <div className="relative">
                  <img
                    src={form.image}
                    alt="Preview"
                    className="h-12 w-14 rounded-md border border-border bg-white object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setField("image", "")}
                    aria-label="Remove image"
                    className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={saveProduct}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Save size={18} />
            {editingSrNo ? "Update Product" : "Save Product"}
          </button>

          <button
            type="button"
            onClick={clearForm}
            className="h-12 rounded-xl border border-border bg-background px-6 text-sm font-medium hover:bg-muted"
          >
            {editingSrNo ? "Cancel Edit" : "Clear Form"}
          </button>

          <input
            ref={importRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) importExcel(file);
            }}
          />

          <button
            type="button"
            onClick={() => importRef.current?.click()}
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-background px-6 text-sm font-medium hover:border-primary hover:text-primary"
          >
            <Upload size={18} />
            Import
          </button>

          <button
            type="button"
            onClick={exportExcel}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-green-600 px-6 text-sm font-semibold text-white hover:bg-green-700"
          >
            <FileSpreadsheet size={18} />
            Excel
          </button>

          {error && <span className="text-sm font-medium text-destructive">{error}</span>}
          {!error && message && <span className="text-sm font-medium text-success">{message}</span>}
        </div>
      </section>

      {/* PRODUCT CATALOGUE */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">Product Catalogue</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Smart Edge - Elite Series price list (w.e.f 1st August 2024) ·{" "}
              <span className="font-semibold text-primary">{filteredProducts.length}</span> of{" "}
              {products.length} products
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-72 max-w-full">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter product category"
              className="h-11 w-64 max-w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              <option value="All">All Categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="max-h-[640px] overflow-auto px-6 pb-2">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted text-left">
                <th className="rounded-l-lg px-4 py-3 font-semibold">Sr.No</th>
                <th className="px-4 py-3 font-semibold">Item Name</th>
                <th className="px-4 py-3 font-semibold">Dimension</th>
                <th className="px-4 py-3 text-right font-semibold">Price (₹)</th>
                <th className="px-4 py-3 text-center font-semibold">Image</th>
                <th className="rounded-r-lg px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.srNo}
                  className={cn(
                    "border-b border-border last:border-0 hover:bg-muted/30",
                    editingSrNo === product.srNo && "bg-primary/5",
                  )}
                >
                  <td className="px-4 py-3 font-medium">{product.srNo}</td>

                  <td className="px-4 py-3">
                    <div className="font-medium">{product.itemName}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{product.category}</div>
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">{product.dimension || "-"}</td>

                  <td className="tabular px-4 py-3 text-right font-semibold">
                    {NUM.format(product.price)}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <ProductImage
                      src={product.image}
                      alt={product.itemName}
                      onPick={(f) => setRowImage(product.srNo, f)}
                      onRemove={() => removeRowImage(product.srNo)}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => editProduct(product)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(product)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No products found. Try another search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </section>
    </AppShell>
  );
}