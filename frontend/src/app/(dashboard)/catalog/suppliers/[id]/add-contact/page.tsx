"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Supplier = {
  id: string;
  name: string;
};

export default function AddContactPage() {
  const params = useParams();
  const supplierId = params.id as string;
  const router = useRouter();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSupplier();
  }, [supplierId]);

  async function fetchSupplier() {
    setLoading(true);
    setError("");
    try {
      const supRes = await fetch(`http://localhost:8001/catalog/suppliers/${supplierId}`);
      if (!supRes.ok) throw new Error("Fournisseur introuvable");
      const supData = await supRes.json();
      setSupplier(supData);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) {
      setError("Le nom est obligatoire.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`http://localhost:8001/catalog/suppliers/${supplierId}/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.detail || data?.message || "Erreur lors de l'ajout du contact");
      }

      router.push(`/catalog/suppliers/${supplierId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-4">Chargement...</p>;
  if (!supplier) return <p className="p-4 text-red-500">Fournisseur introuvable.</p>;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ajouter un contact</h1>
        <Link
          href={`/catalog/suppliers/${supplierId}`}
          className="text-gray-500 hover:text-gray-700"
        >
          Retour
        </Link>
      </div>

      <p className="mb-4 text-gray-600">
        Ajoutez un contact pour le fournisseur <strong>{supplier.name}</strong>.
      </p>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block mb-2 font-medium">Nom complet *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:border-gray-700"
            placeholder="Ex: Jean Dupont"
          />
        </div>

        <div>
           <label className="block mb-2 font-medium">Email</label>
           <input
             type="email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             className="w-full border rounded px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:border-gray-700"
             placeholder="Ex: jean.dupont@fournisseur.com"
           />
        </div>

        <div>
           <label className="block mb-2 font-medium">Téléphone</label>
           <input
             type="tel"
             value={phone}
             onChange={(e) => setPhone(e.target.value)}
             className="w-full border rounded px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:border-gray-700"
             placeholder="Ex: +33 6 12 34 56 78"
           />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 mt-2 font-medium disabled:opacity-50"
        >
          {saving ? "Ajout en cours..." : "Créer le contact"}
        </button>
      </form>
    </div>
  );
}
