"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditSupplierPage() {
  const params = useParams();
  const supplierId = params.id;
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSupplier();
  }, [supplierId]);

  async function fetchSupplier() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:8001/catalog/suppliers/${supplierId}`);
      if (!res.ok) throw new Error("Erreur lors du fetch du fournisseur");
      const data = await res.json();
      setName(data.name);
      setDescription(data.description || "");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`http://localhost:8001/catalog/suppliers/${supplierId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Erreur lors de la mise à jour");
      }

      router.push(`/catalog/suppliers/${supplierId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Chargement du fournisseur...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Modifier le fournisseur</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block mb-1 font-medium">Nom du fournisseur</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {saving ? "Sauvegarde..." : "Enregistrer les modifications"}
        </button>
      </form>
    </div>
  );
}