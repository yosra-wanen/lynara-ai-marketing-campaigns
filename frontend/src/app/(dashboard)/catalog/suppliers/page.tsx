"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Eye, Search, User, Trash2 } from "lucide-react";

type Supplier = {
  id: string;
  name: string;
  description: string;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");

  const filteredSuppliers = suppliers.filter((supplier) =>
    (supplier.name || "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8001/catalog/suppliers", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Erreur fetch suppliers");
      const data = await res.json();
      setSuppliers(data);
    } catch (error) {
      console.error(error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteSupplier(id: string) {
    if (!confirm("Voulez-vous vraiment supprimer ce fournisseur ?")) return;

    try {
      const res = await fetch(`http://localhost:8001/catalog/suppliers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      setSuppliers(suppliers.filter((s) => s.id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-white/5 flex-grow max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un fournisseur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-[#2A2A2A] dark:border-gray-700 outline-none focus:ring-2 focus:ring-[#7C4DFF]/50 transition-all"
            />
          </div>
        </div>

        <Link
          href="/catalog/suppliers/new"
          className="flex items-center justify-center gap-2 bg-[#7C4DFF] hover:bg-[#6A3DF0] text-white px-5 py-3 rounded-xl shadow transition-colors font-medium"
        >
          <Plus size={20} />
          Ajouter Fournisseur
        </Link>
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-[#7C4DFF] border-t-transparent rounded-full mx-auto mb-4"></div>
            Chargement des fournisseurs...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
            <User size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Aucun fournisseur trouvé</p>
            <p className="mt-1">Commencez par ajouter votre premier fournisseur au catalogue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#2A2A2A] text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Nom du fournisseur</th>
                  <th className="px-6 py-4 font-medium hidden md:table-cell">Description</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-[#2A2A2A]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center font-bold">
                          {(supplier.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {supplier.name || "Sans nom"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 hidden md:table-cell max-w-xs truncate">
                      {supplier.description || <span className="italic opacity-50">Aucune description</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/catalog/suppliers/${supplier.id}`}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Détails"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          href={`/catalog/suppliers/${supplier.id}/edit`}
                          className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={18} />
                        </Link>
                        <button
                          onClick={() => deleteSupplier(supplier.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredSuppliers.length === 0 && search && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      Aucun résultat pour "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}