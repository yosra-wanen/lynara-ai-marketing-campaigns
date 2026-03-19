"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

export default function EditSupplierPage() {
  const params = useParams();
  const supplierId = params.id;
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchSupplier(); }, [supplierId]);

  async function fetchSupplier() {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8001/catalog/suppliers/${supplierId}`);
      if (!res.ok) throw new Error("Fournisseur introuvable");
      const data = await res.json();
      setName(data.name);
      setDescription(data.description || "");
    } catch (err: any) {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      router.push(`/catalog/suppliers/${supplierId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111111] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-[#7C4DFF] border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111111]">
      <div className="w-full px-6 py-8 max-w-lg mx-auto">

        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 hover:text-[#7C4DFF] transition">
            <ArrowLeft size={15} /> Retour
          </button>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden">

          {/* HEADER */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">Modifier le fournisseur</h1>
            <p className="text-xs text-gray-400 mt-0.5">Modifiez les informations du fournisseur</p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Nom du fournisseur *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 focus:border-[#7C4DFF] transition"
                placeholder="Ex: Fournisseur ABC"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 transition resize-none"
                placeholder="Ex: Fabricant, Partenaire..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-[#7C4DFF] hover:bg-[#6A3DF0] disabled:opacity-40 text-white rounded-xl font-medium transition active:scale-95"
              >
                <Save size={14} />
                {saving ? "Sauvegarde..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
