"use client";

import EditCampaignModal from "@/components/catalog/EditCampaignModal";
import CreateCampaignModal from "@/components/catalog/CreateCampaignModal";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Trash2, MapPin, Search, SlidersHorizontal, LayoutGrid, List } from "lucide-react";
import Link from "next/link";

interface Campagne {
  id: number;
  nom: string;
  description: string;
  prix: number;
  localisation: string;
  image_url?: string;
  category?: string;
  date_creation: string;
}

function formatPrice(price: number): string {
  if (!price) return "—";
  return new Intl.NumberFormat("fr-TN").format(price) + " TND";
}

const CATEGORY_COLORS: Record<string, string> = {
  "Immobilier": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Voyage": "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Marketing": "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  "Services": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "Design": "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
};

function getCategoryStyle(category?: string): string {
  if (!category) return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
  return CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
}

export default function CataloguePage() {
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campagne | null>(null);
  const [search, setSearch] = useState("");
  const [prixMin, setPrixMin] = useState("");
  const [prixMax, setPrixMax] = useState("");
  const [localisationFilter, setLocalisationFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const campagnesFiltrees = campagnes.filter((c) => {
    const matchSearch = c.nom.toLowerCase().includes(search.toLowerCase());
    const matchLocation = localisationFilter === "" || c.localisation.toLowerCase().includes(localisationFilter.toLowerCase());
    const matchPrixMin = prixMin === "" || c.prix >= Number(prixMin);
    const matchPrixMax = prixMax === "" || c.prix <= Number(prixMax);
    const matchCategory = selectedCategory === "" || c.category === selectedCategory;
    return matchSearch && matchLocation && matchPrixMin && matchPrixMax && matchCategory;
  });

  const activeFiltersCount = [localisationFilter, prixMin, prixMax].filter(Boolean).length;

  useEffect(() => {
    fetchCampagnes();
    fetchCategories();
  }, []);

  async function fetchCampagnes() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8001/catalog/items-with-images", { cache: "no-store" });
      const data = await res.json();
      const formatted = data.map((item: any) => ({
        id: item.id,
        nom: item.title_fr,
        description: item.description_fr,
        prix: item.price,
        category: item.category,
        localisation: "Tunisie",
        image_url: item.image_url,
      }));
      setCampagnes(formatted);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  async function deleteCampagne(id: string) {
    if (!confirm("Supprimer cette offre ?")) return;
    const { error: mediaError } = await supabase.schema("catalog").from("media_assets").delete().eq("item_id", id);
    if (mediaError) console.error(mediaError);
    const { error: itemError } = await supabase.schema("catalog").from("items").delete().eq("id", id);
    if (itemError) { alert(itemError.message); return; }
    fetchCampagnes();
  }

  async function fetchCategories() {
    const res = await fetch("http://localhost:8001/catalog/categories");
    const data = await res.json();
    setCategories(data);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111111]">
      <div className="max-w-screen-xl mx-auto px-6 py-8">

        {/* ── PAGE HEADER ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Catalogue
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {loading ? "Chargement…" : `${campagnesFiltrees.length} offre${campagnesFiltrees.length !== 1 ? "s" : ""} ${campagnesFiltrees.length !== campagnes.length ? `sur ${campagnes.length}` : "au total"}`}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#7C4DFF] hover:bg-[#6A3DF0] active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-violet-200 dark:shadow-none transition-all duration-150"
          >
            <Plus size={16} />
            Nouvelle offre
          </button>
        </div>

        {/* ── SEARCH + FILTERS ── */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm mb-6 overflow-hidden">

          {/* TOP BAR */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-white/5">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une offre…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 focus:border-[#7C4DFF] dark:text-white transition"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition ${
                showFilters || activeFiltersCount > 0
                  ? "bg-[#7C4DFF]/10 border-[#7C4DFF]/30 text-[#7C4DFF]"
                  : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2A2A2A]"
              }`}
            >
              <SlidersHorizontal size={15} />
              Filtres
              {activeFiltersCount > 0 && (
                <span className="bg-[#7C4DFF] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-1 border border-gray-200 dark:border-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition ${viewMode === "grid" ? "bg-[#7C4DFF] text-white" : "text-gray-400 hover:text-gray-600"}`}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition ${viewMode === "list" ? "bg-[#7C4DFF] text-white" : "text-gray-400 hover:text-gray-600"}`}
              >
                <List size={14} />
              </button>
            </div>
          </div>

          {/* ADVANCED FILTERS (collapsible) */}
          {showFilters && (
            <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#1E1E1E]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Localisation</label>
                  <input
                    type="text"
                    placeholder="Ex: Tunis, Sfax…"
                    value={localisationFilter}
                    onChange={(e) => setLocalisationFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Prix minimum</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={prixMin}
                    onChange={(e) => setPrixMin(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Prix maximum</label>
                  <input
                    type="number"
                    placeholder="∞"
                    value={prixMax}
                    onChange={(e) => setPrixMax(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 dark:text-white"
                  />
                </div>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => { setLocalisationFilter(""); setPrixMin(""); setPrixMax(""); }}
                  className="mt-3 text-xs text-red-500 hover:text-red-700 transition"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}

          {/* CATEGORY PILLS */}
          <div className="flex flex-wrap gap-2 px-4 py-3">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedCategory === ""
                  ? "bg-[#7C4DFF] text-white border-[#7C4DFF] shadow-sm"
                  : "bg-transparent border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-[#7C4DFF]/40 hover:text-[#7C4DFF]"
              }`}
            >
              Tout ({campagnes.length})
            </button>
            {categories.map((cat: any) => {
              const count = campagnes.filter((c) => c.category === cat.name).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedCategory === cat.name
                      ? "bg-[#7C4DFF] text-white border-[#7C4DFF] shadow-sm"
                      : "bg-transparent border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-[#7C4DFF]/40 hover:text-[#7C4DFF]"
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div className={`grid gap-5 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-100 dark:bg-[#2A2A2A]" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-100 dark:bg-[#2A2A2A] rounded w-3/4" />
                  <div className="h-3 bg-gray-100 dark:bg-[#2A2A2A] rounded w-1/3" />
                  <div className="h-3 bg-gray-100 dark:bg-[#2A2A2A] rounded w-full" />
                  <div className="h-3 bg-gray-100 dark:bg-[#2A2A2A] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : campagnesFiltrees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-[#2A2A2A] rounded-2xl flex items-center justify-center mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Aucune offre trouvée</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
              Essayez de modifier vos filtres ou ajoutez une nouvelle offre.
            </p>
            <button
              onClick={() => { setSearch(""); setSelectedCategory(""); setLocalisationFilter(""); setPrixMin(""); setPrixMax(""); }}
              className="text-sm text-[#7C4DFF] hover:underline"
            >
              Réinitialiser tous les filtres
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* ── GRID VIEW ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {campagnesFiltrees.map((campagne) => (
              <div
                key={campagne.id}
                className="group bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden hover:border-[#7C4DFF]/30 hover:shadow-lg hover:shadow-violet-100/50 dark:hover:shadow-none transition-all duration-200"
              >
                <Link href={`/catalog/${campagne.id}`}>
                  {/* IMAGE */}
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100 dark:bg-[#2A2A2A]">
                    {campagne.image_url ? (
                      <img
                        src={campagne.image_url}
                        alt={campagne.nom}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Aucune image</span>
                      </div>
                    )}
                    {/* CATEGORY BADGE OVER IMAGE */}
                    <div className="absolute top-3 left-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm ${getCategoryStyle(campagne.category)}`}>
                        {campagne.category ?? "Non catégorisé"}
                      </span>
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="p-4">
                    <h2 className="font-semibold text-sm text-gray-900 dark:text-white leading-snug line-clamp-1 mb-1">
                      {campagne.nom}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">
                      {campagne.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#7C4DFF]">
                        {formatPrice(campagne.prix)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin size={11} />
                        {campagne.localisation}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* ACTIONS */}
                <div className="flex items-center gap-2 px-4 pb-4 pt-0 border-t border-gray-50 dark:border-white/5 mt-1 pt-3">
                  <button
                    onClick={() => setEditingCampaign(campagne)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-[#7C4DFF] hover:bg-[#7C4DFF]/5 py-1.5 rounded-lg transition"
                  >
                    <Pencil size={13} />
                    Modifier
                  </button>
                  <div className="w-px h-4 bg-gray-200 dark:bg-white/10" />
                  <button
                    onClick={() => deleteCampagne(campagne.id.toString())}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 py-1.5 rounded-lg transition"
                  >
                    <Trash2 size={13} />
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── LIST VIEW ── */
          <div className="space-y-3">
            {campagnesFiltrees.map((campagne) => (
              <div
                key={campagne.id}
                className="group bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-200 dark:border-white/5 hover:border-[#7C4DFF]/30 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="flex items-center gap-4 p-4">
                  <Link href={`/catalog/${campagne.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-[#2A2A2A]">
                      {campagne.image_url ? (
                        <img src={campagne.image_url} alt={campagne.nom} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">—</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h2 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{campagne.nom}</h2>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${getCategoryStyle(campagne.category)}`}>
                          {campagne.category ?? "Non catégorisé"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{campagne.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-bold text-[#7C4DFF]">{formatPrice(campagne.prix)}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin size={11} />{campagne.localisation}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setEditingCampaign(campagne)}
                      className="p-2 text-gray-400 hover:text-[#7C4DFF] hover:bg-[#7C4DFF]/5 rounded-lg transition"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => deleteCampagne(campagne.id.toString())}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <CreateCampaignModal onClose={() => setShowModal(false)} onCreated={fetchCampagnes} />}
      {editingCampaign && <EditCampaignModal campagne={editingCampaign} onClose={() => setEditingCampaign(null)} onUpdated={fetchCampagnes} />}
    </div>
  );
}
