"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Trash2, Package, User, Mail, Phone } from "lucide-react";

type Supplier = { id: string; name: string; description?: string };
type Contact = { id: string; name: string; email: string; phone: string };
type ItemSupplier = { item_id: string; items?: { id: string; title_fr: string } };

export default function SupplierDetailPage() {
  const params = useParams();
  const supplierId = params.id as string;
  const router = useRouter();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [items, setItems] = useState<ItemSupplier[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { fetchSupplier(); }, [supplierId]);

  async function fetchSupplier() {
    setLoading(true);
    setError("");
    try {
      const [supRes, itemsRes, contactsRes] = await Promise.all([
        fetch(`http://localhost:8001/catalog/suppliers/${supplierId}`),
        fetch(`http://localhost:8001/catalog/suppliers/${supplierId}/items`),
        fetch(`http://localhost:8001/catalog/suppliers/${supplierId}/contacts`),
      ]);
      setSupplier(await supRes.json());
      setItems(await itemsRes.json());
      setContacts(await contactsRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveItem(itemId: string) {
    if (!confirm("Retirer ce produit du fournisseur ?")) return;
    await fetch(`http://localhost:8001/catalog/suppliers/${supplierId}/remove-item/${itemId}`, { method: "DELETE" });
    setItems(items.filter(i => i.item_id !== itemId));
  }

  async function handleRemoveContact(contactId: string) {
    if (!confirm("Supprimer ce contact ?")) return;
    await fetch(`http://localhost:8001/catalog/suppliers/${supplierId}/contacts/${contactId}`, { method: "DELETE" });
    setContacts(contacts.filter(c => c.id !== contactId));
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111111] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-[#7C4DFF] border-t-transparent rounded-full" />
    </div>
  );

  if (error || !supplier) return (
    <div className="p-6 text-red-500">{error || "Fournisseur introuvable"}</div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111111]">
      <div className="w-full px-6 py-8 max-w-5xl mx-auto">

        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <button onClick={() => router.push("/catalog/suppliers")} className="flex items-center gap-1.5 hover:text-[#7C4DFF] transition">
            <ArrowLeft size={15} /> Fournisseurs
          </button>
          <span>/</span>
          <span className="text-gray-600 dark:text-gray-300 font-medium">{supplier.name}</span>
        </div>

        {/* HEADER CARD */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-white/5 p-6 mb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 flex items-center justify-center text-xl font-bold">
              {supplier.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{supplier.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{supplier.description || "Aucune description"}</p>
            </div>
          </div>
          <Link
            href={`/catalog/suppliers/${supplier.id}/edit`}
            className="flex items-center gap-1.5 text-sm font-medium bg-[#7C4DFF] hover:bg-[#6A3DF0] text-white px-4 py-2 rounded-xl transition active:scale-95"
          >
            <Pencil size={14} /> Modifier
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* PRODUITS LIÉS */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-[#7C4DFF]" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Produits liés</h2>
                <span className="text-xs bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <Link href={`/catalog/suppliers/${supplier.id}/add-item`} className="flex items-center gap-1 text-xs font-medium text-[#7C4DFF] hover:underline">
                <Plus size={13} /> Lier
              </Link>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-gray-400 italic p-5">Aucun produit lié.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {items.map(item => (
                  <div key={item.item_id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                    <Link href={`/catalog/${item.item_id}`} className="text-sm text-gray-800 dark:text-white hover:text-[#7C4DFF] transition">
                      {item.items?.title_fr || "Produit inconnu"}
                    </Link>
                    <button onClick={() => handleRemoveItem(item.item_id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CONTACTS */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <User size={16} className="text-[#7C4DFF]" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Contacts</h2>
                <span className="text-xs bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{contacts.length}</span>
              </div>
              <Link href={`/catalog/suppliers/${supplier.id}/add-contact`} className="flex items-center gap-1 text-xs font-medium text-[#7C4DFF] hover:underline">
                <Plus size={13} /> Ajouter
              </Link>
            </div>
            {contacts.length === 0 ? (
              <p className="text-sm text-gray-400 italic p-5">Aucun contact.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {contacts.map(contact => (
                  <div key={contact.id} className="flex items-start justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</p>
                      {contact.email && (
                        <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <Mail size={11} /> {contact.email}
                        </p>
                      )}
                      {contact.phone && (
                        <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <Phone size={11} /> {contact.phone}
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleRemoveContact(contact.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
