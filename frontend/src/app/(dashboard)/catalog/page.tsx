"use client";

import EditCampaignModal from "@/components/catalog/EditCampaignModal";
import CreateCampaignModal from "@/components/catalog/CreateCampaignModal";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Trash2, MapPin, DollarSign, Users } from "lucide-react";
import Link from "next/link";

interface Campagne {
  id: string; // Changé de number à string pour correspondre aux UUIDs
  nom: string;
  description: string;
  prix: number;
  localisation: string;
  image_url?: string;
  category?: string;
  date_creation: string;
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

  const campagnesFiltrees = campagnes.filter((campagne) => {
    const matchSearch =
      campagne.nom.toLowerCase().includes(search.toLowerCase());
  
    const matchLocation =
      localisationFilter === "" ||
      campagne.localisation.toLowerCase().includes(localisationFilter.toLowerCase());
  
    const matchPrixMin =
      prixMin === "" || campagne.prix >= Number(prixMin);
  
    const matchPrixMax =
      prixMax === "" || campagne.prix <= Number(prixMax);
  
    const matchCategory =
      selectedCategory === "" || campagne.category === selectedCategory;
  
    return (
      matchSearch &&
      matchLocation &&
      matchPrixMin &&
      matchPrixMax &&
      matchCategory
    );
  });

  useEffect(() => {
    fetchCampagnes();
    fetchCategories();
  }, []);

  async function fetchCampagnes() {
    setLoading(true);
    try {
      const res = await fetch(
        "http://localhost:8001/catalog/items-with-images",
        { cache: "no-store" }
      );
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      
      if (!Array.isArray(data)) {
         console.error("Expected an array but got:", data);
         setCampagnes([]);
         return;
      }
  
      const formatted = data.map((item: any) => ({
        id: item.id,
        nom: item.title_fr,
        description: item.description_fr,
        prix: item.price,
        category: item.category,
        localisation: "Tunisie",
        image_url: item.image_url,
        date_creation: new Date().toISOString()
      }));
      setCampagnes(formatted);
      console.log("CAMPAGNES:", formatted);
    } catch (error) {
      console.error("Fetch campagnes error:", error);
      setCampagnes([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteCampagne(id: string) {
    if (!confirm("Supprimer cette campagne ?")) return;
  
    // 1️⃣ delete images linked to the item
    const { error: mediaError } = await supabase
      .schema("catalog")
      .from("media_assets")
      .delete()
      .eq("item_id", id);
  
    if (mediaError) {
      console.error(mediaError);
    }
  
    // 2️⃣ delete the item itself
    const { error: itemError } = await supabase
      .schema("catalog")
      .from("items")
      .delete()
      .eq("id", id);
  
      if (itemError) {
        console.error("Item delete error:", itemError);
        alert(itemError.message);
        return;
      }
  
      // 3️⃣ refresh catalog
      fetchCampagnes();
  }

  async function fetchCategories() {
    try {
      const res = await fetch("http://localhost:8001/catalog/categories");
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.error("Expected array but got:", data);
        setCategories([]);
        return;
      }
      console.log("CATEGORIES:", data);
      setCategories(data);
    } catch (error) {
      console.error("Fetch categories error:", error);
      setCategories([]);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER WITH FILTERS AND ACTIONS */}
      <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-white/5">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* SEARCH & FILTERS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 w-full">
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-2 dark:bg-[#2A2A2A] dark:border-white/10"
            />
            <input
              type="text"
              placeholder="Localisation..."
              value={localisationFilter}
              onChange={(e) => setLocalisationFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 dark:bg-[#2A2A2A] dark:border-white/10"
            />
            <input
              type="number"
              placeholder="Prix min"
              value={prixMin}
              onChange={(e) => setPrixMin(e.target.value)}
              className="border rounded-lg px-3 py-2 dark:bg-[#2A2A2A] dark:border-white/10"
            />
            <input
              type="number"
              placeholder="Prix max"
              value={prixMax}
              onChange={(e) => setPrixMax(e.target.value)}
              className="border rounded-lg px-3 py-2 dark:bg-[#2A2A2A] dark:border-white/10"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Link
              href="/catalog/suppliers"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-50 dark:bg-[#2A2A2A] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#353535] px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 font-medium transition-all text-sm"
            >
              <Users size={16} className="text-purple-500" />
              Fournisseurs
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-50 dark:bg-[#2A2A2A] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#353535] px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 font-medium transition-all text-sm"
            >
              <Plus size={16} className="text-purple-500" />
              Ajouter Produit
            </button>
          </div>
        </div>

        {/* CATEGORIES CHIPS */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-3 py-1 rounded-full text-xs border transition ${
              selectedCategory === ""
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-transparent border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400"
            }`}
          >
            Tout
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1 rounded-full text-xs border transition ${
                selectedCategory === cat.name
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-transparent border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* GRID */}
      {loading ? (
        <p>Chargement...</p>
      ) : campagnes.length === 0 ? (
        <p>Aucune campagne.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {campagnesFiltrees.map((campagne) => (
            <div
              key={campagne.id}
              className="group bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 dark:border-white/5 overflow-hidden transition-all duration-300"
            >
              {/* CLICKABLE AREA */}
              <Link href={`/catalog/${campagne.id}`}>
                {/* IMAGE */}
                <div className="relative h-48 w-full overflow-hidden">
                  {campagne.image_url ? (
                    <img
                      src={campagne.image_url}
                      alt={campagne.nom}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-[#2A2A2A]">
                      <span className="text-gray-400 text-sm">Aucune image</span>
                    </div>
                  )}
                </div>

                {/* CONTENT */}
                <div className="p-5">
                  <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {campagne.nom}
                  </h2>
                  <div className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md mt-1">
                    {campagne.category || "Non catégorisé"}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {campagne.description}
                  </p>
                  <div className="mt-3 font-bold text-[#7C4DFF] text-lg">
                    {campagne.prix} TND
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    📍 {campagne.localisation}
                  </div>
                </div>
              </Link>

              {/* ACTIONS OUTSIDE LINK */}
              <div className="flex justify-between items-center px-5 pb-5">
                <button
                  onClick={() => setEditingCampaign(campagne)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <Pencil size={16} />
                  Modifier
                </button>
                <button
                  onClick={() => deleteCampagne(campagne.id.toString())}
                  className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <CreateCampaignModal
          onClose={() => setShowModal(false)}
          onCreated={fetchCampagnes}
        />
      )}

      {/* EDIT MODAL */}
      {editingCampaign && (
        <EditCampaignModal
          campagne={editingCampaign}
          onClose={() => setEditingCampaign(null)}
          onUpdated={fetchCampagnes}
        />
      )}
    </div>
  );
}