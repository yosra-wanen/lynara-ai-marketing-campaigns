"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Plus, Trash2 } from "lucide-react";

interface Props {
  campagne: any;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditCampaignModal({ campagne, onClose, onUpdated }: Props) {
  const [nom, setNom] = useState(campagne.nom || "");
  const [description, setDescription] = useState(campagne.description || "");
  const [prix, setPrix] = useState(campagne.prix || "");
  const [loading, setLoading] = useState(false);
  const [newImages, setNewImages] = useState<FileList | null>(null);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [images, setImages] = useState<any[]>([]);

  useEffect(() => { fetchImages(); }, []);

  async function fetchImages() {
    const res = await fetch(`http://localhost:8001/catalog/items/${campagne.id}/media`);
    const data = await res.json();
    setImages(data);
  }

  async function deleteImage(id: string) {
    await supabase.schema("catalog").from("media_assets").delete().eq("id", id);
    fetchImages();
  }

  function handleNewImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    setNewImages(files);
    if (files) {
      setNewPreviews(Array.from(files).map(f => URL.createObjectURL(f)));
    }
  }

  async function updateCampaign() {
    setLoading(true);
    try {
      const { error } = await supabase
        .schema("catalog")
        .from("items")
        .update({ title_fr: nom, description_fr: description, price: Number(prix) })
        .eq("id", campagne.id);
      if (error) throw error;

      if (newImages) {
        for (const file of Array.from(newImages)) {
          const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
          const fileName = `${Date.now()}-${safeName}`;
          const { error: uploadError } = await supabase.storage.from("catalog-images").upload(fileName, file);
          if (uploadError) continue;
          const { data } = supabase.storage.from("catalog-images").getPublicUrl(fileName);
          await supabase.schema("catalog").from("media_assets").insert({
            item_id: campagne.id,
            company_id: "bf907290-a4d0-49d9-9d18-327b074d9747",
            url: data.publicUrl,
            is_primary: false,
          });
        }
      }

      onUpdated();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-white/5 overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Modifier l'offre</h2>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{campagne.nom}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* BODY */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">

          {/* NOM */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Nom de l'offre</label>
            <input
              value={nom}
              onChange={e => setNom(e.target.value)}
              className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 focus:border-[#7C4DFF] transition"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 transition resize-none"
            />
          </div>

          {/* PRIX */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Prix (TND)</label>
            <input
              type="number"
              value={prix}
              onChange={e => setPrix(e.target.value)}
              className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 transition"
            />
          </div>

          {/* CURRENT IMAGES */}
          {images.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                Images actuelles ({images.length})
              </label>
              <div className="grid grid-cols-4 gap-2">
                {images.map((img: any) => (
                  <div key={img.id} className="relative group">
                    <img src={img.url} className="h-16 w-full object-cover rounded-xl" />
                    <button
                      onClick={() => deleteImage(img.id)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center"
                    >
                      <Trash2 size={14} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NEW IMAGES */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
              Ajouter des images
            </label>
            {newPreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-2">
                {newPreviews.map((src, i) => (
                  <img key={i} src={src} className="h-16 w-full object-cover rounded-xl opacity-80" />
                ))}
              </div>
            )}
            <label className="flex items-center gap-2 text-xs text-[#7C4DFF] cursor-pointer hover:underline">
              <Plus size={14} />
              Choisir des images
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleNewImages} />
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
            onClick={updateCampaign}
            disabled={loading}
            className="px-5 py-2 text-sm bg-[#7C4DFF] hover:bg-[#6A3DF0] disabled:opacity-40 text-white rounded-xl font-medium transition active:scale-95 shadow-lg shadow-violet-200 dark:shadow-none"
          >
            {loading ? "Modification..." : "Enregistrer"}
          </button>
        </div>

      </div>
    </div>
  );
}
