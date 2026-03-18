"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
  const [images, setImages] = useState<any[]>([]);

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {

    const res = await fetch(`http://localhost:8001/catalog/items/${campagne.id}/media`);

    const data = await res.json();

    setImages(data);

  }

  async function deleteImage(id: string) {

    await supabase
      .schema("catalog")
      .from("media_assets")
      .delete()
      .eq("id", id);

    fetchImages();

  }

  async function updateCampaign() {

    setLoading(true);

    try {

      // update text fields
      const { error } = await supabase
        .schema("catalog")
        .from("items")
        .update({
          title_fr: nom,
          description_fr: description,
          price: Number(prix)
        })
        .eq("id", campagne.id);

      if (error) throw error;

      // upload new images
      if (newImages) {

        for (const file of Array.from(newImages)) {

          const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
          const fileName = Date.now() + "-" + safeName;

          const { error: uploadError } = await supabase.storage
            .from("catalog-images")
            .upload(fileName, file);

          if (uploadError) continue;

          const { data } = supabase.storage
            .from("catalog-images")
            .getPublicUrl(fileName);

          await supabase
            .schema("catalog")
            .from("media_assets")
            .insert({
              item_id: campagne.id,
              company_id: "bf907290-a4d0-49d9-9d18-327b074d9747",
              url: data.publicUrl,
              is_primary: false
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

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl w-full max-w-md">

        <h2 className="text-lg font-bold mb-4">
          Modifier la campagne
        </h2>

        <div className="space-y-3">

          <input
            value={nom}
            onChange={(e)=>setNom(e.target.value)}
            placeholder="Nom"
            className="w-full border p-2 rounded"
          />

          <textarea
            value={description}
            onChange={(e)=>setDescription(e.target.value)}
            placeholder="Description"
            className="w-full border p-2 rounded"
          />

          <input
            type="number"
            value={prix}
            onChange={(e)=>setPrix(e.target.value)}
            placeholder="Prix"
            className="w-full border p-2 rounded"
          />

          {/* CURRENT IMAGES */}

          <div className="mt-4">

            <p className="text-sm font-medium mb-2">
              Images actuelles
            </p>

            <div className="grid grid-cols-4 gap-2">

            {images.map((img:any, index:number)=>(
                <div key={index} className="relative">

                  <img
                    src={img.url}
                    className="h-16 w-full object-cover rounded"
                  />

                  <button
                    onClick={()=>deleteImage(img.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded"
                  >
                    ✕
                  </button>

                </div>

              ))}

            </div>

          </div>

          {/* ADD NEW IMAGES */}

          <div className="mt-4">

            <p className="text-sm text-gray-600 mb-2">
              Ajouter de nouvelles images
            </p>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e)=>setNewImages(e.target.files)}
              className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-[#7C4DFF] file:text-white
              hover:file:bg-[#6A3DF0]"
            />

          </div>

        </div>

        <div className="flex justify-end gap-3 mt-4">

          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Annuler
          </button>

          <button
            onClick={updateCampaign}
            className="px-4 py-2 bg-purple-600 text-white rounded"
          >
            {loading ? "Modification..." : "Modifier"}
          </button>

        </div>

      </div>

    </div>

  );

}