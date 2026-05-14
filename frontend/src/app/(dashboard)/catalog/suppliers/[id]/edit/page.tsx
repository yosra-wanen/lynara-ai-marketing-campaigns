"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Check } from "lucide-react";

const API = "http://localhost:8001";

export default function EditSupplierPage() {
  const params     = useParams();
  const supplierId = params.id as string;
  const router     = useRouter();

  const [name, setName]        = useState("");
  const [description, setDesc] = useState("");
  const [loading, setLoading]  = useState(true);
  const [saving, setSaving]    = useState(false);
  const [error, setError]      = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/catalog/suppliers/${supplierId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setName(data.name || "");
        setDesc(data.description || "");
      } catch { setError("Fournisseur introuvable"); }
      setLoading(false);
    }
    load();
  }, [supplierId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Le nom est requis"); return; }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/catalog/suppliers/${supplierId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      router.push(`/catalog/suppliers/${supplierId}`);
    } catch (err: any) {
      setError(err.message || "Erreur");
    }
    setSaving(false);
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse max-w-2xl">
      <div className="h-4 w-40 bg-gray-200 dark:bg-[#2A2A2A] rounded" />
      <div className="h-64 bg-gray-200 dark:bg-[#2A2A2A] rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">

      <div className="flex items-center gap-2 text-sm text-gray-400">
        <button onClick={() => router.push(`/catalog/suppliers/${supplierId}`)} className="flex items-center gap-1.5 hover:text-[#7C4DFF] transition">
          <ArrowLeft size={15} /> Retour
        </button>
        <span>/</span>
        <span className="text-gray-600 dark:text-gray-300 font-medium">Modifier</span>
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-violet-200 dark:shadow-none">
            <Building2 size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Modifier le fournisseur</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Mettez à jour les informations.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-3 mb-5 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wide">
              Nom du fournisseur *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 transition"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 resize-none transition"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 bg-[#7C4DFF] hover:bg-[#6A3DF0] disabled:opacity-40 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-[#7C4DFF]/20 transition active:scale-95"
            >
              <Check size={15} /> {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/catalog/suppliers/${supplierId}`)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-4 py-2.5 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}