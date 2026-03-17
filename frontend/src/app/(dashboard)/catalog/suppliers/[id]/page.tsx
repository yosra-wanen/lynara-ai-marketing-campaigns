"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Supplier = {
  id: string;
  name: string;
  description?: string;
};

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

type ItemSupplier = {
  item_id: string;
  items?: {
    id: string;
    title_fr: string;
  };
};

export default function SupplierDetailPage() {
  const params = useParams();
  const supplierId = params.id as string;
  const router = useRouter();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [items, setItems] = useState<ItemSupplier[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSupplier();
  }, [supplierId]);

  async function fetchSupplier() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:8001/catalog/suppliers/${supplierId}`);
      if (!res.ok) throw new Error("Erreur lors du fetch du fournisseur");
      const data = await res.json();
      setSupplier(data); 
      
      const itemsRes = await fetch(`http://localhost:8001/catalog/suppliers/${supplierId}/items`);
      if (!itemsRes.ok) throw new Error("Erreur lors du fetch des produits liés");
      const itemsData = await itemsRes.json();
      setItems(itemsData);

      const contactsRes = await fetch(`http://localhost:8001/catalog/suppliers/${supplierId}/contacts`);
      if (!contactsRes.ok) throw new Error("Erreur lors du fetch des contacts");
      const contactsData = await contactsRes.json();
      setContacts(contactsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveItem(itemId: string) {
    if (!confirm("Supprimer ce produit du fournisseur ?")) return;

    try {
      const res = await fetch(`http://localhost:8001/catalog/suppliers/${supplierId}/remove-item/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression du produit");
      setItems(items.filter((i) => i.item_id !== itemId));
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  }

  async function handleRemoveContact(contactId: string) {
    if (!confirm("Supprimer ce contact ?")) return;

    try {
      const res = await fetch(`http://localhost:8001/catalog/suppliers/${supplierId}/contacts/${contactId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression du contact");
      setContacts(contacts.filter((c) => c.id !== contactId));
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  }

  if (loading) return <p className="p-4">Chargement du fournisseur...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!supplier) return <p className="p-4">Fournisseur introuvable</p>;

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-[#1E1E1E] p-6 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
        <div>
           <h1 className="text-2xl font-bold">{supplier.name}</h1>
           <p className="mt-2 text-gray-600 dark:text-gray-300"><strong>Description :</strong> {supplier.description || "Aucune description"}</p>
        </div>
        <Link
          href={`/catalog/suppliers/${supplier.id}/edit`}
          className="bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Modifier
        </Link>
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden p-6">
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-xl font-semibold">Produits liés</h2>
           <Link
             href={`/catalog/suppliers/${supplier.id}/add-item`}
             className="bg-[#7C4DFF] hover:bg-[#6A3DF0] text-white px-4 py-2 rounded-lg shadow-sm font-medium transition-colors"
           >
             + Lier un produit
           </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#2A2A2A] text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Nom du produit</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
              {items.map((item) => (
                <tr key={item.item_id} className="hover:bg-gray-50 dark:hover:bg-[#2A2A2A]/50 transition-colors">
                  <td className="px-4 py-4 font-medium text-gray-900 dark:text-gray-100">
                    {item.items?.title_fr || "Produit Inconnu"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/catalog/${item.item_id}`}
                        className="text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded transition-colors text-sm font-medium"
                      >
                        Voir produit
                      </Link>
                      <button
                        className="text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded transition-colors text-sm font-medium"
                        onClick={() => handleRemoveItem(item.item_id)}
                      >
                        Retirer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                    Aucun produit lié actuellement.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden p-6">
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-xl font-semibold">Contacts du fournisseur</h2>
           <Link
             href={`/catalog/suppliers/${supplier.id}/add-contact`}
             className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm font-medium transition-colors"
           >
             + Ajouter contact
           </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#2A2A2A] text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Téléphone</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-[#2A2A2A]/50 transition-colors">
                  <td className="px-4 py-4 font-medium text-gray-900 dark:text-gray-100">
                    {contact.name || "Inconnu"}
                  </td>
                  <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                    {contact.email || "-"}
                  </td>
                  <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                    {contact.phone || "-"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      className="text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded transition-colors text-sm font-medium"
                      onClick={() => handleRemoveContact(contact.id)}
                    >
                      Retirer
                    </button>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Aucun contact actuellement.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}