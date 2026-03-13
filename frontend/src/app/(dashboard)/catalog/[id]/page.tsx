"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface CatalogItem {
  id: string;
  title_fr: string;
  description_fr: string;
  price: number;
  currency: string;
}

export default function CatalogDetailPage() {

  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [item, setItem] = useState<CatalogItem | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  async function loadData() {
    setLoading(true);

    await Promise.all([
      fetchItem(),
      fetchImages()
    ]);

    setLoading(false);
  }

  async function fetchItem() {

    try {

      const res = await fetch(`http://localhost:8001/catalog/items/${id}`);

      if (!res.ok) throw new Error("Item introuvable");

      const data = await res.json();

      setItem(data);

    } catch (error) {

      console.error(error);
      setItem(null);

    }

  }

  async function fetchImages() {

    try {

      const res = await fetch(`http://localhost:8001/catalog/items/${id}/media`);

      if (!res.ok) return;

      const data = await res.json();

      const urls = data.map((m: any) => m.url);

      setImages(urls);

      if (urls.length > 0) {
        setSelectedIndex(0);
      }

    } catch (error) {

      console.error(error);

    }

  }

  if (loading) {
    return (
      <div className="p-6 text-gray-500">
        Chargement des données...
      </div>
    );
  }

  if (!item) {
    return <p className="p-6">Item introuvable</p>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">

      {/* BACK BUTTON */}
      <button
        onClick={() => router.push("/catalog")}
        className="flex items-center gap-2 text-gray-600 hover:text-black mb-6"
      >
        <ArrowLeft size={18} />
        Retour
      </button>

      {/* GALLERY */}
      <div className="grid grid-cols-4 gap-4">

        {/* MAIN IMAGE */}
        <div className="col-span-4 md:col-span-3 h-[420px] rounded-2xl overflow-hidden bg-gray-100">

          {images.length > 0 ? (

            <img
              src={images[selectedIndex]}
              alt={item.title_fr}
              className="w-full h-full object-cover"
            />

          ) : (

            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Aucune image
            </div>

          )}

        </div>

        {/* THUMBNAILS */}
        {images.length > 1 && (

          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible">

            {images.map((img, index) => (

              <img
                key={index}
                src={img}
                onClick={() => setSelectedIndex(index)}
                className={`h-20 w-28 md:w-full object-cover rounded-lg cursor-pointer border-2 transition ${
                  selectedIndex === index
                    ? "border-[#7C4DFF]"
                    : "border-transparent hover:border-gray-300"
                }`}
              />

            ))}

          </div>

        )}

      </div>

      {/* CONTENT */}
      <div className="mt-10">

        <h1 className="text-3xl font-bold">
          {item.title_fr}
        </h1>

        <div className="text-2xl font-bold text-[#7C4DFF] mt-4">
          {item.price} {item.currency}
        </div>

        <div className="mt-6 text-gray-700 leading-relaxed whitespace-pre-line">
          {item.description_fr}
        </div>

      </div>

    </div>
  );

}