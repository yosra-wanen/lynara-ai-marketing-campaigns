"use client";

import { useState,useEffect} from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateCampaignModal({ onClose, onCreated }: Props) {

  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");

  const [primaryImage, setPrimaryImage] = useState<File | null>(null);
  const [secondaryImages, setSecondaryImages] = useState<FileList | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState("");

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetchCategories();
  }, []);
  
  async function fetchCategories() {
  
    const res = await fetch("http://localhost:8001/catalog/categories");
    const data = await res.json();

    console.log("CATEGORIES:", data);

    setCategories(Array.isArray(data) ? data : data.data || []);
  
  }
  

  async function createCampaign() {

    setLoading(true);

    // 1️⃣ Create item
    const { data: item, error: itemError } = await supabase
      .schema("catalog")
      .from("items")
      .insert({
        company_id: "bf907290-a4d0-49d9-9d18-327b074d9747",
        title_fr: nom,
        description_fr: description,
        price: Number(prix),
        currency: "TND",
        category_id: categoryId
      })
      .select()
      .single();

    if (itemError) {
      alert(itemError.message);
      setLoading(false);
      return;
    }
    

    let mediaRows: any[] = [];

    // 2️⃣ Upload PRIMARY image
    if (primaryImage) {

      const safeName = primaryImage.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const fileName = Date.now() + "-" + safeName;

      const { error } = await supabase.storage
        .from("catalog-images")
        .upload(fileName, primaryImage);

      if (!error) {

        const { data } = supabase.storage
          .from("catalog-images")
          .getPublicUrl(fileName);

        mediaRows.push({
          company_id: "bf907290-a4d0-49d9-9d18-327b074d9747",
          item_id: item.id,
          url: data.publicUrl,
          is_primary: true
        });

      }

    }

    // 3️⃣ Upload SECONDARY images
    if (secondaryImages) {

      for (const file of Array.from(secondaryImages)) {

        const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
        const fileName = Date.now() + "-" + safeName;

        const { error } = await supabase.storage
          .from("catalog-images")
          .upload(fileName, file);

        if (error) continue;

        const { data } = supabase.storage
          .from("catalog-images")
          .getPublicUrl(fileName);

        mediaRows.push({
          company_id: "bf907290-a4d0-49d9-9d18-327b074d9747",
          item_id: item.id,
          url: data.publicUrl,
          is_primary: false
        });

      }

    }

    // 4️⃣ Insert media rows
    if (mediaRows.length > 0) {

      const { error } = await supabase
        .schema("catalog")
        .from("media_assets")
        .insert(mediaRows);

      if (error) console.error(error);

    }

    setLoading(false);

    onCreated();
    onClose();
    

  }

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl w-full max-w-md">

        <h2 className="text-lg font-bold mb-4">
          Ajouter une campagne
        </h2>

        <div className="space-y-3">

          <input
            placeholder="Nom"
            className="w-full border p-2 rounded"
            value={nom}
            onChange={(e)=>setNom(e.target.value)}
          />

          <textarea
            placeholder="Description"
            className="w-full border p-2 rounded"
            value={description}
            onChange={(e)=>setDescription(e.target.value)}
          />

          <input
            placeholder="Prix"
            className="w-full border p-2 rounded"
            value={prix}
            onChange={(e)=>setPrix(e.target.value)}
          />
          <select
            value={categoryId}
            onChange={(e)=>setCategoryId(e.target.value)}
            className="w-full border p-2 rounded"
          >

          <option value="">Choisir catégorie</option> 

          {Array.isArray(categories) && categories.map((cat:any)=>(
           <option key={cat.id} value={cat.id}>
           {cat.name}
           </option>
          ))}

          </select>

          {/* PRIMARY IMAGE */}

          <div className="space-y-2">

            <label className="text-sm font-medium text-gray-600">
              Image principale
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPrimaryImage(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-[#7C4DFF] file:text-white
              hover:file:bg-[#6A3DF0]"
            />

          </div>

          {/* SECONDARY IMAGES */}

          <div className="space-y-2">

            <label className="text-sm font-medium text-gray-600">
              Images secondaires
            </label>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setSecondaryImages(e.target.files)}
              className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-[#7C4DFF] file:text-white
              hover:file:bg-[#6A3DF0]"
            />

          </div>

        </div>
        <label className="text-sm font-medium text-gray-600">
  
</label>



        <div className="flex justify-end gap-3 mt-4">

          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Annuler
          </button>

          <button
            onClick={createCampaign}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded"
          >
            {loading ? "Création..." : "Créer"}
          </button>

        </div>

      </div>

    </div>

  );

}