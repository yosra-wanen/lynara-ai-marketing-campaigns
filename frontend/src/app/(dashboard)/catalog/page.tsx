"use client";

import EditCampaignModal from "@/components/catalog/EditCampaignModal";
import CreateCampaignModal from "@/components/catalog/CreateCampaignModal";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Trash2, MapPin, DollarSign } from "lucide-react";
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
      const data = await res.json();
  
      const formatted = data.map((item: any) => ({
        id: item.id,
        nom: item.title_fr,
        description: item.description_fr,
        prix: item.price,
        category: item.category,
        localisation: "Tunisie",
        image_url: item.image_url
      }));
      setCampagnes(formatted);
      console.log(formatted);
  
    } catch (error) {
  
      console.error(error);
  
    }
  
    setLoading(false);
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

    const res = await fetch("http://localhost:8001/catalog/categories");
  
    const data = await res.json();
  
    console.log("CATEGORIES:", data);
  
    setCategories(data);
  }

  return (

    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex items-center justify-between">
        {/* FILTER BAR */}
        <div className="
  bg-white dark:bg-[#1E1E1E]
  p-4 rounded-xl shadow-sm
  border border-gray-200 dark:border-white/5
">

  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

    {/* SEARCH */}
    <input
      type="text"
      placeholder="Rechercher par nom..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="border rounded-lg px-3 py-2 dark:bg-[#2A2A2A]"
    />

    {/* LOCALISATION */}
    <input
      type="text"
      placeholder="Filtrer par localisation..."
      value={localisationFilter}
      onChange={(e) => setLocalisationFilter(e.target.value)}
      className="border rounded-lg px-3 py-2 dark:bg-[#2A2A2A]"
    />

    {/* PRIX MIN */}
    <input
      type="number"
      placeholder="Prix minimum"
      value={prixMin}
      onChange={(e) => setPrixMin(e.target.value)}
      className="border rounded-lg px-3 py-2 dark:bg-[#2A2A2A]"
    />

    {/* PRIX MAX */}
    <input
      type="number"
      placeholder="Prix maximum"
      value={prixMax}
      onChange={(e) => setPrixMax(e.target.value)}
      className="border rounded-lg px-3 py-2 dark:bg-[#2A2A2A]"
    />
  </div>
  <div className="flex flex-wrap gap-2 mt-3">

  <button
    onClick={() => setSelectedCategory("")}
    className={`px-3 py-1 rounded-full text-sm border transition ${
      selectedCategory === ""
        ? "bg-purple-600 text-white border-purple-600"
        : "bg-transparent border-gray-300 dark:border-white/10"
    }`}
  >
    Tout
  </button>

  {categories.map((cat: any) => (
    <button
      key={cat.id}
      onClick={() => setSelectedCategory(cat.name)}
      className={`px-3 py-1 rounded-full text-sm border transition ${
        selectedCategory === cat.name
          ? "bg-purple-600 text-white border-purple-600"
          : "bg-transparent border-gray-300 dark:border-white/10"
      }`}
    >
      {cat.name}
    </button>
  ))}

</div>
  
  

</div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#7C4DFF] hover:bg-[#6A3DF0] text-white px-4 py-2 rounded-xl shadow"
        >
          <Plus size={18} />
          Ajouter une campagne
        </button>

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
  className="
    group
    bg-white dark:bg-[#1E1E1E]
    rounded-2xl
    shadow-sm hover:shadow-xl
    border border-gray-200 dark:border-white/5
    overflow-hidden
    transition-all duration-300
  "
>

  {/* CLICKABLE AREA */}
  <Link href={`/catalog/${campagne.id}`}>

    {/* IMAGE */}
    <div className="relative h-48 w-full overflow-hidden">

      {campagne.image_url ? (

        <img
          src={campagne.image_url}
          alt={campagne.nom}
          className="
            w-full h-full object-cover
            group-hover:scale-105
            transition-transform duration-300
          "
        />

      ) : (

        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-[#2A2A2A]">
          <span className="text-gray-400 text-sm">
            Aucune image
          </span>
        </div>

      )}

    </div>

    {/* CONTENT */}
    <div className="p-5">

      <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
        {campagne.nom}
      </h2>
      <div className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md mt-1">
        {campagne.category|| "Non catégorisé"}
      </div>
      <div className="flex flex-wrap gap-1 mt-2">

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