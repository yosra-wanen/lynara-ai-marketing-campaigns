"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus, Search, Trash2, Eye, Building2, Users, Package,
  RefreshCw, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const API = "http://localhost:8001";

type Supplier = {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
};

export default function SuppliersPage() {
  const { companyId, loading: authLoading } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [deleting, setDeleting]   = useState<string | null>(null);

  const filtered = suppliers.filter((s) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!authLoading && companyId) fetchSuppliers();
  }, [companyId, authLoading]);

  async function fetchSuppliers() {
    if (!companyId) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/catalog/suppliers?company_id=${companyId}`, { cache: "no-store" });
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch { setSuppliers([]); }
    setLoading(false);
  }

  async function deleteSupplier(id: string) {
    if (!confirm("Supprimer ce fournisseur définitivement ? Ses liens avec les offres seront aussi supprimés.")) return;
    setDeleting(id);
    try {
      await fetch(`${API}/catalog/suppliers/${id}`, { method: "DELETE" });
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert("Erreur lors de la suppression");
    }
    setDeleting(null);
  }

  if (authLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-[#7C4DFF] border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fournisseurs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Gérez vos partenaires et fournisseurs pour chaque offre du catalogue.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSuppliers}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E1E1E] text-gray-500 hover:text-[#7C4DFF] transition"
          >
            <RefreshCw size={15} />
          </button>
          <Link
            href="/catalog/suppliers/new"
            className="flex items-center gap-2 bg-[#7C4DFF] hover:bg-[#6A3DF0] text-white px-5 py-2.5 rounded-xl shadow-lg shadow-[#7C4DFF]/20 transition font-semibold text-sm"
          >
            <Plus size={16} /> Ajouter un fournisseur
          </Link>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Building2, label: "Fournisseurs actifs", value: suppliers.length, color: "violet" },
          { icon: Users,     label: "Résultats affichés",  value: filtered.length,   color: "blue" },
          { icon: Package,   label: "Recherche active",    value: search ? "Oui" : "Non", color: "emerald" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200 dark:border-white/5 p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-${color}-50 dark:bg-${color}-900/20`}>
              <Icon size={20} className={`text-${color}-600 dark:text-${color}-400`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── SEARCH ── */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un fournisseur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 transition"
        />
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3 text-gray-400">
            <div className="animate-spin w-8 h-8 border-4 border-[#7C4DFF] border-t-transparent rounded-full" />
            <span className="text-sm">Chargement des fournisseurs...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4">
              <Building2 size={28} className="text-gray-300" />
            </div>
            <p className="text-lg font-semibold text-gray-700 dark:text-white">
              {search ? "Aucun résultat" : "Aucun fournisseur"}
            </p>
            <p className="text-sm mt-1">
              {search ? `Aucun fournisseur pour "${search}"` : "Commencez par ajouter votre premier fournisseur."}
            </p>
            {!search && (
              <Link
                href="/catalog/suppliers/new"
                className="mt-6 flex items-center gap-2 bg-[#7C4DFF] text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
              >
                <Plus size={15} /> Ajouter un fournisseur
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/5">
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Fournisseur</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden md:table-cell">Description</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden lg:table-cell">Ajouté le</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filtered.map((s) => (
                <tr key={s.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-violet-200 dark:shadow-none">
                        {(s.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.name || "Sans nom"}</p>
                        {s.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 md:hidden">{s.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell max-w-xs">
                    <span className="line-clamp-1">{s.description || <span className="italic opacity-40">Aucune description</span>}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400 hidden lg:table-cell">
                    {s.created_at
                      ? new Date(s.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/catalog/suppliers/${s.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#7C4DFF] bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 rounded-lg transition-colors"
                      >
                        <Eye size={13} /> Voir
                      </Link>
                      <button
                        onClick={() => deleteSupplier(s.id)}
                        disabled={deleting === s.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={13} /> {deleting === s.id ? "..." : "Supprimer"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── COUNT ── */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          {filtered.length} fournisseur{filtered.length > 1 ? "s" : ""}
          {search && ` pour "${search}"`}
        </p>
      )}
    </div>
  );
}