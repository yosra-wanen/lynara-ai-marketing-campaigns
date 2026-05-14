"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

type Item = {
  id: string;
  title_fr: string;
};

type Supplier = {
  id: string;
  name: string;
};

export default function AddItemToSupplierPage() {
  const params = useParams();
  const supplierId = params.id as string;
  const router = useRouter();
  const { companyId } = useAuth();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [supplierId]);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      // Fetch the supplier to get its name
      const supRes = await fetch(`http://localhost:8001/catalog/suppliers/${supplierId}`);
      if (!supRes.ok) throw new Error("Fournisseur introuvable");
      const supData = await supRes.json();
      setSupplier(supData);

      // Fetch all available items
      const itemsRes = await fetch(`http://localhost:8001/catalog/items-with-images?company_id=${companyId}`);
      if (!itemsRes.ok) throw new Error("Erreur lors de la récupération des produits");
      const itemsData = await itemsRes.json();
      setItems(itemsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItemId) {
      setError("Veuillez sélectionner un produit.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`http://localhost:8001/catalog/suppliers/${supplierId}/add-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_id: selectedItemId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.detail || data?.message || "Erreur lors de l'ajout du produit");
      }

      router.push(`/catalog/suppliers/${supplierId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-4">Chargement...</p>;
  if (!supplier) return <p className="p-4 text-red-500">Fournisseur introuvable.</p>;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ajouter un produit</h1>
        <Link
          href={`/catalog/suppliers/${supplierId}`}
          className="text-gray-500 hover:text-gray-700"
        >
          Retour
        </Link>
      </div>

      <p className="mb-4 text-gray-600">
        Sélectionnez un produit à lier au fournisseur <strong>{supplier.name}</strong>.
      </p>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block mb-2 font-medium">Produit</label>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:border-gray-700"
          >
            <option value="" disabled>-- Sélectionnez un produit --</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title_fr}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 mt-2 font-medium disabled:opacity-50"
        >
          {saving ? "Ajout en cours..." : "Ajouter au fournisseur"}
        </button>
      </form>
    </div>
  );
}
