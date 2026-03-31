"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, Plus, Trash2, Pencil, Check, X,
  Package, Mail, Phone, User, Percent, ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const API = "http://localhost:8002";

type Supplier = { id: string; name: string; description?: string; created_at?: string };
type Contact  = { id: string; name: string; email?: string; phone?: string };
type LinkedItem = {
  id: string;
  item_id: string;
  commission: number | null;
  items?: { id: string; title_fr: string; price: number | null; status: string };
};

type Tab = "items" | "contacts" | "infos";

function fmtPrice(p: number | null | undefined, c = "TND") {
  if (!p) return "—";
  return new Intl.NumberFormat("fr-TN").format(p) + " " + c;
}

// ────────────────────────────────────────────────
export default function SupplierDetailPage() {
  const params     = useParams();
  const supplierId = params.id as string;
  const router     = useRouter();
  const { companyId } = useAuth();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [items,    setItems]    = useState<LinkedItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<Tab>("items");

  // inline edit supplier
  const [editing,   setEditing]   = useState(false);
  const [editName,  setEditName]  = useState("");
  const [editDesc,  setEditDesc]  = useState("");
  const [saving,    setSaving]    = useState(false);

  // inline add contact
  const [showAddContact, setShowAddContact] = useState(false);
  const [newCName, setNewCName]   = useState("");
  const [newCEmail, setNewCEmail] = useState("");
  const [newCPhone, setNewCPhone] = useState("");

  // inline add item
  const [showAddItem, setShowAddItem]       = useState(false);
  const [allItems, setAllItems]             = useState<{id:string; title_fr:string}[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [newCommission, setNewCommission]   = useState("");

  // inline edit commission
  const [editingCommission, setEditingCommission] = useState<string | null>(null);
  const [editCommVal, setEditCommVal]             = useState("");

  useEffect(() => { if (supplierId) loadAll(); }, [supplierId]);

  async function loadAll() {
    setLoading(true);
    try {
      const [sRes, iRes, cRes] = await Promise.all([
        fetch(`${API}/catalog/suppliers/${supplierId}`),
        fetch(`${API}/catalog/suppliers/${supplierId}/items`),
        fetch(`${API}/catalog/suppliers/${supplierId}/contacts`),
      ]);
      const s = await sRes.json();
      setSupplier(s);
      setEditName(s.name || "");
      setEditDesc(s.description || "");
      setItems(await iRes.json());
      setContacts(await cRes.json());
    } catch { /* silent */ }
    setLoading(false);
  }

  // ── Save supplier info ──
  async function saveSupplier() {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/catalog/suppliers/${supplierId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null }),
      });
      const data = await res.json();
      setSupplier(data);
      setEditing(false);
    } catch { alert("Erreur lors de la mise à jour"); }
    setSaving(false);
  }

  // ── Delete contact ──
  async function deleteContact(cid: string) {
    if (!confirm("Supprimer ce contact ?")) return;
    await fetch(`${API}/catalog/suppliers/${supplierId}/contacts/${cid}`, { method: "DELETE" });
    setContacts((p) => p.filter((c) => c.id !== cid));
  }

  // ── Add contact ──
  async function addContact() {
    if (!newCName.trim()) return;
    try {
      const res = await fetch(`${API}/catalog/suppliers/${supplierId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCName.trim(),
          email: newCEmail.trim() || null,
          phone: newCPhone.trim() || null,
          company_id: companyId,
        }),
      });
      const data = await res.json();
      setContacts((p) => [...p, data]);
      setNewCName(""); setNewCEmail(""); setNewCPhone("");
      setShowAddContact(false);
    } catch { alert("Erreur"); }
  }

  // ── Remove item ──
  async function removeItem(itemId: string) {
    if (!confirm("Retirer cette offre du fournisseur ?")) return;
    await fetch(`${API}/catalog/suppliers/${supplierId}/items/${itemId}`, { method: "DELETE" });
    setItems((p) => p.filter((i) => i.items?.id !== itemId && i.item_id !== itemId));
  }

  // ── Add item ──
  async function loadAllItems() {
    if (!companyId) return;
    try {
      const res = await fetch(`${API}/catalog/items?company_id=${companyId}&page_size=100`);
      const json = await res.json();
      const data = json.data || json;
      setAllItems(Array.isArray(data) ? data.map((i: any) => ({ id: i.id, title_fr: i.title_fr || "Sans nom" })) : []);
    } catch { setAllItems([]); }
  }

  async function addItem() {
    if (!selectedItemId) return;
    try {
      const res = await fetch(`${API}/catalog/suppliers/${supplierId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: selectedItemId,
          commission: newCommission ? parseFloat(newCommission) : null,
        }),
      });
      if (res.status === 409) { alert("Cette offre est déjà liée."); return; }
      await loadAll();
      setSelectedItemId(""); setNewCommission(""); setShowAddItem(false);
    } catch { alert("Erreur"); }
  }

  // ── Update commission ──
  async function saveCommission(itemId: string) {
    try {
      await fetch(`${API}/catalog/suppliers/${supplierId}/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commission: editCommVal ? parseFloat(editCommVal) : null }),
      });
      setItems((p) =>
        p.map((i) =>
          (i.item_id === itemId || i.items?.id === itemId)
            ? { ...i, commission: editCommVal ? parseFloat(editCommVal) : null }
            : i
        )
      );
      setEditingCommission(null);
    } catch { alert("Erreur"); }
  }

  // ── SKELETON ──
  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-40 bg-gray-200 dark:bg-[#2A2A2A] rounded" />
      <div className="h-32 bg-gray-200 dark:bg-[#2A2A2A] rounded-2xl" />
      <div className="h-64 bg-gray-200 dark:bg-[#2A2A2A] rounded-2xl" />
    </div>
  );

  if (!supplier) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-gray-500">Fournisseur introuvable</p>
      <button onClick={() => router.push("/catalog/suppliers")} className="text-[#7C4DFF] text-sm hover:underline">← Retour</button>
    </div>
  );

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "items",    label: "Offres liées",  count: items.length },
    { key: "contacts", label: "Contacts",      count: contacts.length },
    { key: "infos",    label: "Informations" },
  ];

  const alreadyLinkedIds = new Set(items.map((i) => i.item_id || i.items?.id));

  return (
    <div className="space-y-6">

      {/* ── BREADCRUMB ── */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <button onClick={() => router.push("/catalog/suppliers")} className="flex items-center gap-1.5 hover:text-[#7C4DFF] transition">
          <ArrowLeft size={15} /> Fournisseurs
        </button>
        <span>/</span>
        <span className="text-gray-600 dark:text-gray-300 font-medium">{supplier.name}</span>
      </div>

      {/* ── HEADER CARD ── */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-violet-200 dark:shadow-none">
              {(supplier.name || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              {editing ? (
                <div className="space-y-2">
                  <input
                    className="text-lg font-bold border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 w-72"
                    value={editName} onChange={(e) => setEditName(e.target.value)}
                  />
                  <textarea
                    className="text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 w-72 resize-none"
                    rows={2} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description..."
                  />
                  <div className="flex gap-2">
                    <button onClick={saveSupplier} disabled={saving} className="flex items-center gap-1.5 bg-[#7C4DFF] hover:bg-[#6A3DF0] disabled:opacity-40 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition">
                      <Check size={13} /> {saving ? "..." : "Enregistrer"}
                    </button>
                    <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600 text-xs"><X size={14} /></button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{supplier.name}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{supplier.description || "Aucune description"}</p>
                </>
              )}
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-[#7C4DFF]/30 hover:text-[#7C4DFF] rounded-xl transition"
            >
              <Pencil size={13} /> Modifier
            </button>
          )}
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 dark:border-white/5 px-2 pt-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); if (t.key === "items" && showAddItem && allItems.length === 0) loadAllItems(); }}
              className={`px-5 py-3 text-sm font-medium rounded-t-xl transition-all ${
                tab === t.key
                  ? "bg-[#7C4DFF] text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              {t.label}{t.count !== undefined ? ` (${t.count})` : ""}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ══════════ ITEMS TAB ══════════ */}
          {tab === "items" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-400">Offres du catalogue liées à ce fournisseur, avec leur commission.</p>
                <button
                  onClick={() => { setShowAddItem(!showAddItem); if (!showAddItem && allItems.length === 0) loadAllItems(); }}
                  className="flex items-center gap-1.5 bg-[#7C4DFF] hover:bg-[#6A3DF0] text-white px-4 py-2 rounded-xl text-xs font-semibold transition active:scale-95"
                >
                  <Plus size={14} /> Lier une offre
                </button>
              </div>

              {/* Inline add item */}
              {showAddItem && (
                <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/30 rounded-xl p-4 mb-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block font-medium">Offre</label>
                      <select
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                        className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
                      >
                        <option value="">-- Sélectionner une offre --</option>
                        {allItems
                          .filter((i) => !alreadyLinkedIds.has(i.id))
                          .map((i) => (
                            <option key={i.id} value={i.id}>{i.title_fr}</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block font-medium">Commission (%)</label>
                      <input
                        type="number" min={0} max={100} step={0.1}
                        placeholder="Ex: 10"
                        value={newCommission}
                        onChange={(e) => setNewCommission(e.target.value)}
                        className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addItem} disabled={!selectedItemId} className="flex items-center gap-1.5 bg-[#7C4DFF] hover:bg-[#6A3DF0] disabled:opacity-40 text-white px-4 py-2 rounded-lg text-xs font-semibold transition">
                      <Check size={13} /> Enregistrer
                    </button>
                    <button onClick={() => setShowAddItem(false)} className="text-xs text-gray-500 hover:text-gray-700 px-3">Annuler</button>
                  </div>
                </div>
              )}

              {/* Items list */}
              {items.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Package size={28} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Aucune offre liée à ce fournisseur.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((link) => {
                    const itm    = link.items;
                    const itemId = link.item_id || itm?.id || "";
                    return (
                      <div key={link.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#2A2A2A] border border-gray-100 dark:border-white/5 group">
                        <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                          <Package size={16} className="text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{itm?.title_fr || "Offre inconnue"}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {itm?.price != null && (
                              <span className="text-xs text-[#7C4DFF] font-bold">{fmtPrice(itm.price)}</span>
                            )}
                            {itm?.status && (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                itm.status === "published" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                : itm.status === "draft" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                : "bg-gray-100 text-gray-500"
                              }`}>
                                {itm.status === "published" ? "Publié" : itm.status === "draft" ? "Brouillon" : "Archivé"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Commission */}
                        <div className="flex items-center gap-2">
                          {editingCommission === itemId ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number" min={0} max={100} step={0.1}
                                className="w-20 text-xs border border-gray-300 dark:border-white/10 rounded-lg px-2 py-1.5 bg-white dark:bg-[#1A1A1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/40"
                                value={editCommVal}
                                onChange={(e) => setEditCommVal(e.target.value)}
                                placeholder="%"
                              />
                              <button onClick={() => saveCommission(itemId)} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
                              <button onClick={() => setEditingCommission(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingCommission(itemId); setEditCommVal(link.commission?.toString() ?? ""); }}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#7C4DFF] bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 px-2.5 py-1 rounded-lg transition"
                              title="Modifier la commission"
                            >
                              <Percent size={11} />
                              {link.commission != null ? `${link.commission}%` : "—"}
                            </button>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <Link href={`/catalog/${itemId}`} className="text-blue-400 hover:text-blue-600 p-1"><ExternalLink size={14} /></Link>
                          <button onClick={() => removeItem(itemId)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════ CONTACTS TAB ══════════ */}
          {tab === "contacts" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-400">Personnes de contact pour ce fournisseur.</p>
                <button
                  onClick={() => setShowAddContact(!showAddContact)}
                  className="flex items-center gap-1.5 bg-[#7C4DFF] hover:bg-[#6A3DF0] text-white px-4 py-2 rounded-xl text-xs font-semibold transition active:scale-95"
                >
                  <Plus size={14} /> Ajouter un contact
                </button>
              </div>

              {/* Inline add contact */}
              {showAddContact && (
                <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/30 rounded-xl p-4 mb-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block font-medium">Nom *</label>
                      <input
                        value={newCName} onChange={(e) => setNewCName(e.target.value)}
                        className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
                        placeholder="Nom du contact"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block font-medium">Email</label>
                      <input
                        type="email" value={newCEmail} onChange={(e) => setNewCEmail(e.target.value)}
                        className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
                        placeholder="email@exemple.com"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block font-medium">Téléphone</label>
                      <input
                        value={newCPhone} onChange={(e) => setNewCPhone(e.target.value)}
                        className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
                        placeholder="+216 XX XXX XXX"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addContact} disabled={!newCName.trim()} className="flex items-center gap-1.5 bg-[#7C4DFF] hover:bg-[#6A3DF0] disabled:opacity-40 text-white px-4 py-2 rounded-lg text-xs font-semibold transition">
                      <Check size={13} /> Enregistrer
                    </button>
                    <button onClick={() => setShowAddContact(false)} className="text-xs text-gray-500 hover:text-gray-700 px-3">Annuler</button>
                  </div>
                </div>
              )}

              {/* Contacts list */}
              {contacts.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <User size={28} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Aucun contact pour ce fournisseur.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contacts.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-[#2A2A2A] border border-gray-100 dark:border-white/5 group">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                        {(c.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.name}</p>
                        <div className="flex items-center gap-4 mt-0.5">
                          {c.email && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Mail size={11} /> {c.email}
                            </span>
                          )}
                          {c.phone && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone size={11} /> {c.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteContact(c.id)}
                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════ INFOS TAB ══════════ */}
          {tab === "infos" && (
            <div className="space-y-4 max-w-xl">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Nom</p>
                <p className="text-sm text-gray-800 dark:text-white">{supplier.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{supplier.description || "Aucune description"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Date de création</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-violet-50 dark:bg-violet-900/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-[#7C4DFF]">{items.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Offre{items.length > 1 ? "s" : ""} liée{items.length > 1 ? "s" : ""}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{contacts.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Contact{contacts.length > 1 ? "s" : ""}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}