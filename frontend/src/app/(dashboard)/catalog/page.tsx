"use client";

import EditCampaignModal from "@/components/catalog/EditCampaignModal";
import CreateCampaignModal from "@/components/catalog/CreateCampaignModal";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus, Pencil, Trash2, RefreshCw, Search, SlidersHorizontal,
  ChevronLeft, ChevronRight, Package, Tag, MapPin, Star, Save, Bookmark
} from "lucide-react";
import Link from "next/link";

const API = "http://localhost:8001";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface CatalogItem {
  id: string;
  nom: string;
  description: string;
  prix: number;
  currency: string;
  localisation: string;
  image_url?: string;
  category?: string;
  category_id?: string;
  item_type?: string;
  item_type_id?: string;
  status: "draft" | "published" | "archived";
  tags: string[];
  date_creation: string;
}

interface ItemType { id: string; label: string; }
interface Category { id: string; name: string; }

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function formatPrice(price: number, currency = "TND"): string {
  if (!price) return "—";
  return new Intl.NumberFormat("fr-TN").format(price) + " " + currency;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft:     { label: "Brouillon",  className: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  published: { label: "Publié",     className: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  archived:  { label: "Archivé",    className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
};

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────
export default function CataloguePage() {
  const { companyId, companyName, userId, loading: authLoading } = useAuth();

  // Data
  const [items, setItems]     = useState<CatalogItem[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModal, setShowModal]           = useState(false);
  const [editingItem, setEditingItem]       = useState<CatalogItem | null>(null);

  // Sidebar filters visibility
  const [showFilters, setShowFilters]       = useState(false);

  // Filter state
  const [search, setSearch]               = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [selectedCatId, setSelectedCatId]   = useState("");
  const [cityFilter, setCityFilter]         = useState("");
  const [priceMin, setPriceMin]             = useState("");
  const [priceMax, setPriceMax]             = useState("");
  const [favoritesOnly, setFavoritesOnly]   = useState(false);

  // Saved Views
  const [savedViews, setSavedViews] = useState<any[]>([]);
  const [savingViewName, setSavingViewName] = useState("");
  const [isSavingView, setIsSavingView] = useState(false);

  // Pagination
  const [page, setPage]           = useState(1);
  const PAGE_SIZE                 = 12;
  const totalPages                = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Reference data
  const [itemTypes, setItemTypes]   = useState<ItemType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, selectedStatus, selectedTypeId, selectedCatId, cityFilter, priceMin, priceMax, favoritesOnly]);

  useEffect(() => {
    if (!authLoading && companyId) {
      fetchItems();
      fetchReferenceData();
      if (userId) fetchSavedViews();
    }
  }, [companyId, authLoading, page, search, selectedStatus, selectedTypeId, selectedCatId, cityFilter, priceMin, priceMax, favoritesOnly]);

  // ── FETCH ITEMS (paginated + filtered) ──
  const fetchItems = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        company_id: companyId,
        page: String(page),
        page_size: String(PAGE_SIZE),
      });
      if (search)           params.set("search", search);
      if (selectedStatus)   params.set("status", selectedStatus);
      if (selectedTypeId)   params.set("item_type_id", selectedTypeId);
      if (selectedCatId)    params.set("category_id", selectedCatId);
      if (cityFilter)       params.set("city", cityFilter);
      if (priceMin)         params.set("price_min", priceMin);
      if (priceMax)         params.set("price_max", priceMax);
      if (favoritesOnly)    params.set("favorites_only", "true");
      if (userId)           params.set("user_id", userId);

      const res  = await fetch(`${API}/catalog/items-with-images?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();

      const safeData = Array.isArray(json) ? json : (json.data ?? []);
      setTotal(json.total ?? safeData.length);

      setItems(
        safeData.map((item: any) => ({
          id:            item.id,
          nom:           item.title_fr || "Sans nom",
          description:   item.description_fr || "",
          prix:          item.price || 0,
          currency:      item.currency || "TND",
          category:      item.category,
          category_id:   item.category_id,
          item_type:     item.item_type,
          item_type_id:  item.item_type_id,
          localisation:  item.city || item.neighborhood || "—",
          image_url:     item.image_url,
          status:        item.status || "draft",
          tags:          item.tags || [],
          date_creation: item.created_at || new Date().toISOString(),
        }))
      );
    } catch (error) {
      console.error("Fetch error:", error);
      setItems([]);
    }
    setLoading(false);
  }, [companyId, userId, page, search, selectedStatus, selectedTypeId, selectedCatId, cityFilter, priceMin, priceMax, favoritesOnly]);

  // ── FETCH REFERENCE DATA ──
  async function fetchReferenceData() {
    if (!companyId) return;
    try {
      const [typesRes, catsRes] = await Promise.all([
        fetch(`${API}/catalog/item-types`),
        fetch(`${API}/catalog/categories?company_id=${companyId}`),
      ]);
      const [types, cats] = await Promise.all([typesRes.json(), catsRes.json()]);
      setItemTypes(Array.isArray(types) ? types : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch { /* silent */ }
  }

  // ── DELETE ──
  async function deleteItem(id: string) {
    if (!confirm("Supprimer cette offre définitivement ?")) return;
    try {
      const res = await fetch(`${API}/catalog/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur suppression");
      setItems(prev => prev.filter(i => i.id !== id));
      setTotal(prev => prev - 1);
    } catch (err: any) {
      alert(err.message);
    }
  }

  // ── SAVED VIEWS ──
  async function fetchSavedViews() {
    if (!userId || !companyId) return;
    try {
      const res = await fetch(`${API}/catalog/saved-views?company_id=${companyId}&user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSavedViews(data);
      }
    } catch { /* silent */ }
  }

  async function saveCurrentView() {
    if (!userId || !companyId || !savingViewName.trim()) return;
    setIsSavingView(true);
    try {
      const payload = {
        company_id: companyId,
        user_id: userId,
        name: savingViewName.trim(),
        view_type: "list",
        filters: { search, selectedStatus, selectedTypeId, selectedCatId, cityFilter, priceMin, priceMax, favoritesOnly },
        is_default: false
      };
      const res = await fetch(`${API}/catalog/saved-views`, {
        method: "POST",
        headers: { "Content-Type" : "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSavingViewName("");
        fetchSavedViews();
        alert("Vue sauvegardée !");
      }
    } catch {
      alert("Erreur lors de la sauvegarde.");
    }
    setIsSavingView(false);
  }

  function applySavedView(view: any) {
    if (!view.filters) return;
    const f = view.filters;
    setSearch(f.search || "");
    setSelectedStatus(f.selectedStatus || "");
    setSelectedTypeId(f.selectedTypeId || "");
    setSelectedCatId(f.selectedCatId || "");
    setCityFilter(f.cityFilter || "");
    setPriceMin(f.priceMin || "");
    setPriceMax(f.priceMax || "");
    setFavoritesOnly(f.favoritesOnly || false);
    setShowFilters(true);
  }

  // ── RESET FILTERS ──
  function resetFilters() {
    setSearch(""); setSelectedStatus(""); setSelectedTypeId("");
    setSelectedCatId(""); setCityFilter(""); setPriceMin(""); setPriceMax("");
    setFavoritesOnly(false);
    setPage(1);
  }

  const hasActiveFilters = search || selectedStatus || selectedTypeId || selectedCatId || cityFilter || priceMin || priceMax;

  // ─────────────────────────────────────────────
  // GUARDS
  // ─────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#7C4DFF] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-lg font-medium">Aucune entreprise active trouvée.</p>
        <p className="text-sm mt-2">Veuillez créer ou sélectionner une entreprise dans votre profil.</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── TOPBAR ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Search + filter toggle */}
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une offre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-all ${
              showFilters || hasActiveFilters || favoritesOnly
                ? "bg-[#7C4DFF] text-white border-[#7C4DFF]"
                : "bg-white dark:bg-[#1E1E1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400"
            }`}
          >
            <SlidersHorizontal size={15} />
            Filtres {(hasActiveFilters || favoritesOnly) && <span className="w-2 h-2 bg-white rounded-full inline-block ml-1" />}
          </button>

          {/* Quick Favorite Toggle */}
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-all ${
              favoritesOnly
                ? "bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800"
                : "bg-white dark:bg-[#1E1E1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400"
            }`}
          >
            <Star size={15} fill={favoritesOnly ? "currentColor" : "none"} />
            Favoris
          </button>

          {/* Saved Views Dropdown equivalent (simple select for now) */}
          {savedViews.length > 0 && (
            <select
              className="px-4 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E1E1E] text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 cursor-pointer max-w-[200px]"
              onChange={(e) => {
                const vid = e.target.value;
                if (!vid) return;
                const view = savedViews.find(v => v.id === vid);
                if (view) applySavedView(view);
                e.target.value = ""; // reset after apply
              }}
            >
              <option value="">Vos vues sauvegardées...</option>
              {savedViews.map(sv => (
                <option key={sv.id} value={sv.id}>{sv.name}</option>
              ))}
            </select>
          )}

        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {total} offre{total !== 1 ? "s" : ""}
          </span>
          <button
            onClick={fetchItems}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E1E1E] text-gray-500 hover:text-[#7C4DFF] transition"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#7C4DFF] hover:bg-[#6A3DF0] text-white px-5 py-2.5 rounded-xl shadow-lg shadow-[#7C4DFF]/20 transition-all font-semibold text-sm"
          >
            <Plus size={16} />
            Ajouter une offre
          </button>
        </div>
      </div>

      {/* ── FILTERS PANEL ── */}
      {showFilters && (
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Status */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Statut</label>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
              >
                <option value="">Tous statuts</option>
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
                <option value="archived">Archivé</option>
              </select>
            </div>

            {/* Item Type */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Type d'offre</label>
              <select
                value={selectedTypeId}
                onChange={e => setSelectedTypeId(e.target.value)}
                className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
              >
                <option value="">Tous types</option>
                {itemTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Catégorie</label>
              <select
                value={selectedCatId}
                onChange={e => setSelectedCatId(e.target.value)}
                className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
              >
                <option value="">Toutes catégories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Ville</label>
              <input
                type="text"
                placeholder="Ex: Tunis..."
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
                className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
              />
            </div>

            {/* Price Min */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Prix min</label>
              <input
                type="number"
                placeholder="0"
                value={priceMin}
                onChange={e => setPriceMin(e.target.value)}
                className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
              />
            </div>

            {/* Price Max */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block font-medium">Prix max</label>
              <input
                type="number"
                placeholder="∞"
                value={priceMax}
                onChange={e => setPriceMax(e.target.value)}
                className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-white/5 pt-4">
            {(hasActiveFilters || favoritesOnly) ? (
              <button
                onClick={resetFilters}
                className="text-xs text-[#7C4DFF] hover:underline font-medium"
              >
                ✕ Réinitialiser les filtres
              </button>
            ) : <div />}

            {/* Save View Form */}
            {(hasActiveFilters || favoritesOnly) && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nommer cette vue..."
                  value={savingViewName}
                  onChange={e => setSavingViewName(e.target.value)}
                  className="text-xs border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none"
                />
                <button
                  onClick={saveCurrentView}
                  disabled={isSavingView || !savingViewName.trim()}
                  className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                >
                  <Save size={12} /> Sauvegarder la vue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── GRID ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-200 dark:bg-[#2A2A2A]" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-[#2A2A2A] rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-[#2A2A2A] rounded w-1/2" />
                <div className="h-5 bg-gray-200 dark:bg-[#2A2A2A] rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-white/5 shadow-sm text-gray-400">
          <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Package size={32} className="text-gray-300" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">Aucune offre trouvée</p>
          <p className="text-base mt-2 text-gray-500 max-w-md text-center">
            {hasActiveFilters
              ? "Aucun résultat pour ces filtres. Essayez de les modifier."
              : <>Aucun produit pour <span className="font-bold text-[#7C4DFF]">{companyName}</span>.</>
            }
          </p>
          <div className="mt-8 flex gap-4">
            {hasActiveFilters && (
              <button onClick={resetFilters} className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl text-sm font-bold transition-all">
                Réinitialiser
              </button>
            )}
            <button onClick={fetchItems} className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl text-sm font-bold transition-all">
              <RefreshCw size={16} /> Actualiser
            </button>
            <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-[#7C4DFF] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#7C4DFF]/20">
              Créer un produit
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map((item) => {
              const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft;
              return (
                <div
                  key={item.id}
                  className="group bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 dark:border-white/5 overflow-hidden transition-all duration-300"
                >
                  <Link href={`/catalog/${item.id}`}>
                    {/* Image */}
                    <div className="relative h-44 w-full overflow-hidden bg-gray-50 dark:bg-[#2A2A2A]">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.nom}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={32} className="text-gray-300 dark:text-gray-600" />
                        </div>
                      )}
                      {/* Status badge */}
                      <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.className}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-4">
                      <h2 className="font-bold text-gray-900 dark:text-white group-hover:text-[#7C4DFF] transition-colors truncate text-sm leading-snug">
                        {item.nom}
                      </h2>

                      {/* Type & Category */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.item_type && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full">
                            <Tag size={9} /> {item.item_type}
                          </span>
                        )}
                        {item.category && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                            {item.category}
                          </span>
                        )}
                      </div>

                      {/* Price & Location */}
                      <div className="mt-3 flex items-end justify-between">
                        <span className="font-black text-[#7C4DFF] text-lg">
                          {formatPrice(item.prix, item.currency)}
                        </span>
                        {item.localisation !== "—" && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-400">
                            <MapPin size={10} className="text-[#7C4DFF]" />
                            {item.localisation}
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[10px] bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full border border-gray-200 dark:border-white/10">
                              #{tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-[10px] text-gray-400">+{item.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="flex justify-between items-center px-4 pb-4 pt-0 border-t border-gray-50 dark:border-white/5 mt-1">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="text-blue-500 hover:text-blue-700 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Pencil size={13} /> MODIFIER
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-red-400 hover:text-red-600 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={13} /> SUPPRIMER
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── PAGINATION ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E1E1E] disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5 transition"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === "number" && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${
                        page === p
                          ? "bg-[#7C4DFF] text-white shadow-lg shadow-[#7C4DFF]/25"
                          : "border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E1E1E] hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E1E1E] disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* ── MODALS ── */}
      {showModal && (
        <CreateCampaignModal
          companyId={companyId}
          onClose={() => setShowModal(false)}
          onCreated={fetchItems}
        />
      )}
      {editingItem && (
        <EditCampaignModal
          campagne={editingItem}
          companyId={companyId}
          onClose={() => setEditingItem(null)}
          onUpdated={fetchItems}
        />
      )}
    </div>
  );
}
