"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Plus, ImagePlus } from "lucide-react";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateCampaignModal({ onClose, onCreated }: Props) {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [primaryImage, setPrimaryImage] = useState<File | null>(null);
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);
  const [secondaryImages, setSecondaryImages] = useState<FileList | null>(null);
  const [secondaryPreviews, setSecondaryPreviews] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  async function fetchCategories() {
    const res = await fetch("http://localhost:8001/catalog/categories");
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : data.data || []);
  }

  function handlePrimaryImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setPrimaryImage(file);
    if (file) setPrimaryPreview(URL.createObjectURL(file));
  }

  function handleSecondaryImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    setSecondaryImages(files);
    if (files) {
      const previews = Array.from(files).map(f => URL.createObjectURL(f));
      setSecondaryPreviews(previews);
    }
  }

  async function createCampaign() {
    if (!nom.trim()) return;
    setLoading(true);

    const { data: item, error: itemError } = await supabase
      .schema("catalog")
      .from("items")
      .insert({
        company_id: "bf907290-a4d0-49d9-9d18-327b074d9747",
        title_fr: nom,
        description_fr: description,
        price: Number(prix),
        currency: "TND",
        category_id: categoryId || null,
      })
      .select()
      .single();

    if (itemError) { alert(itemError.message); setLoading(false); return; }

    let mediaRows: any[] = [];

    if (primaryImage) {
      const safeName = primaryImage.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const fileName = `${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from("catalog-images").upload(fileName, primaryImage);
      if (!error) {
        const { data } = supabase.storage.from("catalog-images").getPublicUrl(fileName);
        mediaRows.push({ company_id: "bf907290-a4d0-49d9-9d18-327b074d9747", item_id: item.id, url: data.publicUrl, is_primary: true });
      }
    }

    if (secondaryImages) {
      for (const file of Array.from(secondaryImages)) {
        const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
        const fileName = `${Date.now()}-${safeName}`;
        const { error } = await supabase.storage.from("catalog-images").upload(fileName, file);
        if (error) continue;
        const { data } = supabase.storage.from("catalog-images").getPublicUrl(fileName);
        mediaRows.push({ company_id: "bf907290-a4d0-49d9-9d18-327b074d9747", item_id: item.id, url: data.publicUrl, is_primary: false });
      }
    }

    if (mediaRows.length > 0) {
      const { error } = await supabase.schema("catalog").from("media_assets").insert(mediaRows);
      if (error) console.error(error);
    }

    setLoading(false);
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-white/5 overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Nouvelle offre</h2>
            <p className="text-xs text-gray-400 mt-0.5">Remplissez les informations de base</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* BODY */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">

          {/* NOM */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Nom de l'offre *</label>
            <input
              placeholder="Ex: Appartement S+2 La Marsa..."
              className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 focus:border-[#7C4DFF] transition"
              value={nom}
              onChange={e => setNom(e.target.value)}
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Description</label>
            <textarea
              placeholder="Décrivez l'offre en détail..."
              rows={3}
              className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 focus:border-[#7C4DFF] transition resize-none"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* PRIX + CATEGORIE */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Prix (TND)</label>
              <input
                type="number"
                placeholder="0"
                className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 transition"
                value={prix}
                onChange={e => setPrix(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Catégorie</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 transition"
              >
                <option value="">-- Catégorie --</option>
                {Array.isArray(categories) && categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* IMAGE PRINCIPALE */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Image principale</label>
            {primaryPreview ? (
              <div className="relative">
                <img src={primaryPreview} className="w-full h-32 object-cover rounded-xl" />
                <button
                  onClick={() => { setPrimaryImage(null); setPrimaryPreview(null); }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                >✕</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl cursor-pointer hover:border-[#7C4DFF]/40 transition bg-gray-50 dark:bg-[#2A2A2A]">
                <ImagePlus size={20} className="text-gray-400 mb-1" />
                <span className="text-xs text-gray-400">Cliquer pour choisir</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePrimaryImage} />
              </label>
            )}
          </div>

          {/* IMAGES SECONDAIRES */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Images secondaires</label>
            {secondaryPreviews.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 mb-2">
                {secondaryPreviews.map((src, i) => (
                  <img key={i} src={src} className="h-16 w-full object-cover rounded-lg" />
                ))}
              </div>
            ) : null}
            <label className="flex items-center gap-2 text-xs text-[#7C4DFF] cursor-pointer hover:underline">
              <Plus size={14} />
              Ajouter des images
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleSecondaryImages} />
            </label>
          </div>

        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#111111]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition"
          >
            Annuler
          </button>
          <button
            onClick={createCampaign}
            disabled={loading || !nom.trim()}
            className="px-5 py-2 text-sm bg-[#7C4DFF] hover:bg-[#6A3DF0] disabled:opacity-40 text-white rounded-xl font-medium transition active:scale-95 shadow-lg shadow-violet-200 dark:shadow-none"
          >
            {loading ? "Création..." : "Créer l'offre"}
          </button>
        </div>

      </div>
    </div>
  );
}
