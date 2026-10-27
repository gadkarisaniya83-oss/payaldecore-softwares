import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/erp/AppShell";
import { useState } from "react";

export const Route = createFileRoute("/masters/products")({
  component: ProductMaster,
});

type Product = {
  id: number;
  name: string;
  code: string;
  category: string;
  unit: string;
  price: number;
};

function ProductMaster() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");

  const handleSave = () => {
    if (!name || !code || !category || !unit || !price) {
      alert("Please fill all fields");
      return;
    }

    const newProduct: Product = {
      id: Date.now(),
      name,
      code,
      category,
      unit,
      price: Number(price),
    };

    setProducts((prev) => [...prev, newProduct]);

    setName("");
    setCode("");
    setCategory("");
    setUnit("");
    setPrice("");
    setShowForm(false);
  };

  return (
    <AppShell title="master products">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Product Master</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your products
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {showForm ? "Close" : "+ Add Product"}
          </button>
        </div>

        {showForm && (
          <div className="mt-6 rounded-lg border bg-card p-5">
            <h2 className="text-lg font-semibold">Add Product</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product Name"
                className="rounded-md border px-3 py-2"
              />

              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Product Code"
                className="rounded-md border px-3 py-2"
              />

              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category"
                className="rounded-md border px-3 py-2"
              />

              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Unit (NOS, SQFT, etc.)"
                className="rounded-md border px-3 py-2"
              />

              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Price"
                type="number"
                className="rounded-md border px-3 py-2"
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="mt-5 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
            >
              Save Product
            </button>
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-left">Price</th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No products added yet.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-t">
                    <td className="px-4 py-3">{product.name}</td>
                    <td className="px-4 py-3">{product.code}</td>
                    <td className="px-4 py-3">{product.category}</td>
                    <td className="px-4 py-3">{product.unit}</td>
                    <td className="px-4 py-3">?{product.price}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
