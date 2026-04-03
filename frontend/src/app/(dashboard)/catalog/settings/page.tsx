"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CategoryTree, buildCategoryTree, CategoryNode } from "@/components/catalog/CategoryTree";
import {
  Tag, Folder, Layers, Plus, Pencil, Trash2, X, Check,
  ChevronLeft, Package2,
} from "lucide-react";

const API = "http://localhost:8002";

type Section = "categories" | "tags" | "types" | "attributes" | "collections";

interface Category { id: string; name: string; parent_id: string | null; }
interface TagItem { id: string; name: string; }
interface ItemType { id: string; code: string; label: string; description?: string; }
interface Collection { id: string; name: string; description?: string; }
interface AttributeDef {
  id: string;
  company_id: string;
  category_id: string | null;
  attribute_name: string;
  display_label: string;
  data_type: string;
  config: Record<string, any>;
  is_active: boolean;
}

// ── INLINE FORM ──────────────────────────────
function InlineForm({
  value, onChange, onSubmit, onCancel, placeholder, loading,
}: {
  value: string; onChange: (v: string) => void;
  onSubmit: () => void; onCancel: () => void;
  placeholder?: string; loading?: boolean;
}) {
  return (
    <div className="flex gap-2 items-center">
      <input
        autoFocus
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") onSubmit(); if (e.key === "Escape") onCancel(); }}
        placeholder={placeholder ?? "Nom..."}
        className="flex-1 text-sm border border-[#7C4DFF]/40 rounded-xl px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
      />
      <button onClick={onSubmit} disabled={loading || !value.trim()} className="p-2 bg-[#7C4DFF] text-white rounded-xl hover:bg-[#6A3DF0] disabled:opacity-40 transition">
        <Check size={16} />
      </button>
      <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl transition">
        <X size={16} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function CatalogSettingsPage() {
  const { companyId, loading: authLoading } = useAuth();
  const [section, setSection] = useState<Section>("categories");

  // ── CATEGORIES STATE ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatParent, setNewCatParent] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [editCat, setEditCat] = useState<{ id: string; name: string } | null>(null);

  // ── TAGS STATE ──
  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagLoading, setTagLoading] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const [editTag, setEditTag] = useState<{ id: string; name: string } | null>(null);

  // ── TYPES STATE ──
  const [types, setTypes] = useState<ItemType[]>([]);
  const [typeLoading, setTypeLoading] = useState(false);
  const [addingType, setAddingType] = useState(false);
  const [newType, setNewType] = useState({ code: "", label: "", description: "" });
  const [editType, setEditType] = useState<ItemType | null>(null);

  // ── COLLECTIONS STATE ──
  const [collections, setCollections] = useState<Collection[]>([]);
  const [colLoading, setColLoading] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [addingCol, setAddingCol] = useState(false);
  const [editCol, setEditCol] = useState<{ id: string; name: string } | null>(null);

  // ── ATTRIBUTES STATE ──
  const [attributes, setAttributes] = useState<AttributeDef[]>([]);
  const [attrLoading, setAttrLoading] = useState(false);
  const [addingAttr, setAddingAttr] = useState(false);
  const [newAttr, setNewAttr] = useState({ category_id: "", attribute_name: "", display_label: "", data_type: "text" });

  useEffect(() => {
    if (companyId) {
      fetchCategories();
      fetchTags();
      fetchTypes();
      fetchCollections();
      fetchAttributes();
    }
  }, [companyId]);

  // ── CATEGORIES CRUD ──
  async function fetchCategories() {
    setCatLoading(true);
    try {
      const res = await fetch(`${API}/catalog/categories?company_id=${companyId}`);
      setCategories(await res.json());
    } catch { setCategories([]); }
    setCatLoading(false);
  }

  async function createCategory() {
    if (!newCatName.trim() || !companyId) return;
    setCatLoading(true);
    try {
      await fetch(`${API}/catalog/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim(), company_id: companyId, parent_id: newCatParent || null }),
      });
      setNewCatName(""); setNewCatParent(""); setAddingCat(false);
      fetchCategories();
    } catch { alert("Erreur création catégorie"); }
    setCatLoading(false);
  }

  async function updateCategory(id: string, name: string) {
    setCatLoading(true);
    try {
      await fetch(`${API}/catalog/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setEditCat(null);
      fetchCategories();
    } catch { alert("Erreur mise à jour"); }
    setCatLoading(false);
  }

  async function deleteCategory(id: string) {
    if (!confirm("Supprimer cette catégorie et détacher ses sous-catégories ?")) return;
    await fetch(`${API}/catalog/categories/${id}`, { method: "DELETE" });
    fetchCategories();
  }

  // ── TAGS CRUD ──
  async function fetchTags() {
    setTagLoading(true);
    try {
      const res = await fetch(`${API}/catalog/tags?company_id=${companyId}`);
      setTags(await res.json());
    } catch { setTags([]); }
    setTagLoading(false);
  }

  async function createTag() {
    if (!newTagName.trim() || !companyId) return;
    setTagLoading(true);
    try {
      await fetch(`${API}/catalog/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim(), company_id: companyId }),
      });
      setNewTagName(""); setAddingTag(false);
      fetchTags();
    } catch { alert("Erreur création tag"); }
    setTagLoading(false);
  }

  async function updateTag(id: string, name: string) {
    await fetch(`${API}/catalog/tags/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setEditTag(null);
    fetchTags();
  }

  async function deleteTag(id: string) {
    if (!confirm("Supprimer ce tag ? Il sera retiré de toutes les offres.")) return;
    await fetch(`${API}/catalog/tags/${id}`, { method: "DELETE" });
    fetchTags();
  }

  // ── TYPES CRUD ──
  async function fetchTypes() {
    setTypeLoading(true);
    try {
      const res = await fetch(`${API}/catalog/item-types`);
      setTypes(await res.json());
    } catch { setTypes([]); }
    setTypeLoading(false);
  }

  async function createType() {
    if (!newType.code.trim() || !newType.label.trim()) return;
    setTypeLoading(true);
    try {
      await fetch(`${API}/catalog/item-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newType),
      });
      setNewType({ code: "", label: "", description: "" }); setAddingType(false);
      fetchTypes();
    } catch { alert("Erreur création type"); }
    setTypeLoading(false);
  }

  async function updateType(id: string, label: string, description?: string) {
    await fetch(`${API}/catalog/item-types/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, description }),
    });
    setEditType(null);
    fetchTypes();
  }

  // ── COLLECTIONS CRUD ──
  async function fetchCollections() {
    setColLoading(true);
    try {
      const res = await fetch(`${API}/catalog/collections?company_id=${companyId}`);
      setCollections(await res.json());
    } catch { setCollections([]); }
    setColLoading(false);
  }

  async function createCollection() {
    if (!newColName.trim() || !companyId) return;
    setColLoading(true);
    try {
      await fetch(`${API}/catalog/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newColName.trim(), company_id: companyId }),
      });
      setNewColName(""); setAddingCol(false);
      fetchCollections();
    } catch { alert("Erreur création collection"); }
    setColLoading(false);
  }

  async function deleteCollection(id: string) {
    if (!confirm("Supprimer cette collection ?")) return;
    await fetch(`${API}/catalog/collections/${id}`, { method: "DELETE" });
    fetchCollections();
  }

  // ── ATTRIBUTES CRUD ──
  async function fetchAttributes() {
    setAttrLoading(true);
    try {
      const res = await fetch(`${API}/catalog/attributes?company_id=${companyId}`);
      setAttributes(await res.json());
    } catch { setAttributes([]); }
    setAttrLoading(false);
  }

  async function createAttribute() {
    if (!newAttr.attribute_name.trim() || !newAttr.display_label.trim() || !companyId) return;
    setAttrLoading(true);
    try {
      await fetch(`${API}/catalog/attributes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          category_id: newAttr.category_id || null,
          attribute_name: newAttr.attribute_name.trim(),
          display_label: newAttr.display_label.trim(),
          data_type: newAttr.data_type,
        }),
      });
      setNewAttr({ category_id: "", attribute_name: "", display_label: "", data_type: "text" });
      setAddingAttr(false);
      fetchAttributes();
    } catch { alert("Erreur création attribut"); }
    setAttrLoading(false);
  }

  async function deleteAttribute(id: string) {
    if (!confirm("Désactiver cet attribut ?")) return;
    await fetch(`${API}/catalog/attributes/${id}`, { method: "DELETE" });
    fetchAttributes();
  }

  if (authLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#7C4DFF] border-t-transparent rounded-full" /></div>;
  if (!companyId) return <div className="p-8 text-center text-gray-400">Aucune entreprise active.</div>;

  const tree = buildCategoryTree(categories);

  const SECTIONS: { id: Section; label: string; icon: any; count: number }[] = [
    { id: "categories", label: "Catégories", icon: Folder, count: categories.length },
    { id: "tags", label: "Tags", icon: Tag, count: tags.length },
    { id: "collections", label: "Collections", icon: Layers, count: collections.length },
    { id: "types", label: "Types d'offre", icon: Layers, count: types.length },
    { id: "attributes", label: "Attributs", icon: Package2, count: attributes.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <a href="/catalog" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#7C4DFF] transition">
          <ChevronLeft size={16} /> Catalogue
        </a>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion du référentiel</h1>
          <p className="text-sm text-gray-500 mt-0.5">Catégories · Tags · Types d'offre</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── LEFT NAV ── */}
        <div className="space-y-2">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${section === s.id
                    ? "bg-[#7C4DFF] text-white shadow-lg shadow-[#7C4DFF]/25"
                    : "bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} />
                  {s.label}
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${section === s.id ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-white/10 text-gray-500"
                  }`}>
                  {s.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="lg:col-span-3 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">

          {/* ════════════════════════
              CATEGORIES
          ════════════════════════ */}
          {section === "categories" && (
            <div>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Catégories</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Structure hiérarchique avec parent/enfants</p>
                </div>
                <button
                  onClick={() => { setAddingCat(true); setNewCatName(""); setNewCatParent(""); }}
                  className="flex items-center gap-2 bg-[#7C4DFF] hover:bg-[#6A3DF0] text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  <Plus size={15} /> Ajouter
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Add form */}
                {addingCat && (
                  <div className="bg-violet-50 dark:bg-violet-900/10 rounded-xl p-4 space-y-3 border border-violet-200 dark:border-violet-800/30">
                    <p className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wide">Nouvelle catégorie</p>
                    <InlineForm
                      value={newCatName}
                      onChange={setNewCatName}
                      onSubmit={createCategory}
                      onCancel={() => setAddingCat(false)}
                      placeholder="Nom de la catégorie"
                      loading={catLoading}
                    />
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Catégorie parente (optionnel)</label>
                      <select
                        value={newCatParent}
                        onChange={e => setNewCatParent(e.target.value)}
                        className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
                      >
                        <option value="">Aucune (racine)</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Tree display */}
                {catLoading ? (
                  <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />)}</div>
                ) : categories.length === 0 ? (
                  <div className="py-8 text-center">
                    <Folder size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-400">Aucune catégorie. Créez-en une !</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {categories.map(cat => (
                      <div key={cat.id} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 group">
                        {editCat?.id === cat.id ? (
                          <InlineForm
                            value={editCat.name}
                            onChange={name => setEditCat({ ...editCat, name })}
                            onSubmit={() => updateCategory(cat.id, editCat.name)}
                            onCancel={() => setEditCat(null)}
                          />
                        ) : (
                          <>
                            <Folder size={14} className="text-amber-500 flex-shrink-0" />
                            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                              {cat.name}
                              {cat.parent_id && (
                                <span className="ml-2 text-[10px] text-gray-400">
                                  ↳ {categories.find(c => c.id === cat.parent_id)?.name}
                                </span>
                              )}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button onClick={() => setEditCat({ id: cat.id, name: cat.name })} className="p-1.5 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => deleteCategory(cat.id)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════
              TAGS
          ════════════════════════ */}
          {section === "tags" && (
            <div>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Tags</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Étiquettes libres associées aux offres</p>
                </div>
                <button
                  onClick={() => { setAddingTag(true); setNewTagName(""); }}
                  className="flex items-center gap-2 bg-[#7C4DFF] hover:bg-[#6A3DF0] text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  <Plus size={15} /> Ajouter
                </button>
              </div>

              <div className="p-6 space-y-4">
                {addingTag && (
                  <div className="bg-violet-50 dark:bg-violet-900/10 rounded-xl p-4 border border-violet-200 dark:border-violet-800/30">
                    <p className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wide mb-3">Nouveau tag</p>
                    <InlineForm
                      value={newTagName}
                      onChange={setNewTagName}
                      onSubmit={createTag}
                      onCancel={() => setAddingTag(false)}
                      placeholder="Nom du tag"
                      loading={tagLoading}
                    />
                  </div>
                )}

                {tagLoading ? (
                  <div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-8 w-20 bg-gray-100 dark:bg-white/5 rounded-full animate-pulse" />)}</div>
                ) : tags.length === 0 ? (
                  <div className="py-8 text-center">
                    <Tag size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-400">Aucun tag. Créez-en un !</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tags.map(tag => (
                      <div key={tag.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 group">
                        {editTag?.id === tag.id ? (
                          <InlineForm
                            value={editTag.name}
                            onChange={name => setEditTag({ ...editTag, name })}
                            onSubmit={() => updateTag(tag.id, editTag.name)}
                            onCancel={() => setEditTag(null)}
                          />
                        ) : (
                          <>
                            <span className="text-xs font-bold text-[#7C4DFF]">#</span>
                            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{tag.name}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button onClick={() => setEditTag({ id: tag.id, name: tag.name })} className="p-1.5 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => deleteTag(tag.id)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════
              TYPES
          ════════════════════════ */}
          {section === "types" && (
            <div>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Types d'offre</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Modèles métier (immobilier, service, produit…) · <span className="text-amber-600 font-semibold">Le code doit être unique</span>
                  </p>
                </div>
                <button
                  onClick={() => { setAddingType(true); setNewType({ code: "", label: "", description: "" }); }}
                  className="flex items-center gap-2 bg-[#7C4DFF] hover:bg-[#6A3DF0] text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  <Plus size={15} /> Ajouter
                </button>
              </div>

              <div className="p-6 space-y-4">
                {addingType && (
                  <div className="bg-violet-50 dark:bg-violet-900/10 rounded-xl p-4 space-y-3 border border-violet-200 dark:border-violet-800/30">
                    <p className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wide">Nouveau type d'offre</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Code unique *</label>
                        <input
                          value={newType.code}
                          onChange={e => setNewType(p => ({ ...p, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") }))}
                          placeholder="ex: real_estate"
                          className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Label affiché *</label>
                        <input
                          value={newType.label}
                          onChange={e => setNewType(p => ({ ...p, label: e.target.value }))}
                          placeholder="ex: Immobilier"
                          className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Description (optionnel)</label>
                      <input
                        value={newType.description}
                        onChange={e => setNewType(p => ({ ...p, description: e.target.value }))}
                        placeholder="Description du type d'offre..."
                        className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
                      />
                    </div>
                    <div className="flex gap-2 justify-end mt-1">
                      <button onClick={() => setAddingType(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition">Annuler</button>
                      <button
                        onClick={createType}
                        disabled={typeLoading || !newType.code || !newType.label}
                        className="px-4 py-2 text-sm bg-[#7C4DFF] text-white rounded-xl hover:bg-[#6A3DF0] disabled:opacity-40 transition font-semibold"
                      >
                        {typeLoading ? "Création..." : "Créer"}
                      </button>
                    </div>
                  </div>
                )}

                {typeLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />)}</div>
                ) : types.length === 0 ? (
                  <div className="py-8 text-center">
                    <Layers size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-400">Aucun type d'offre.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {types.map(type => (
                      <div key={type.id} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 group border border-transparent hover:border-gray-100 dark:hover:border-white/5 transition">
                        {editType?.id === type.id ? (
                          <div className="flex-1 space-y-2">
                            <input
                              value={editType.label}
                              onChange={e => setEditType({ ...editType, label: e.target.value })}
                              className="w-full text-sm border border-[#7C4DFF]/40 rounded-xl px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none"
                              placeholder="Label"
                            />
                            <input
                              value={editType.description ?? ""}
                              onChange={e => setEditType({ ...editType, description: e.target.value })}
                              className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none"
                              placeholder="Description"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => updateType(type.id, editType.label, editType.description)} className="flex items-center gap-1 px-3 py-1.5 bg-[#7C4DFF] text-white rounded-lg text-xs font-semibold">
                                <Check size={12} /> Enregistrer
                              </button>
                              <button onClick={() => setEditType(null)} className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-xs transition">
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                              <Package2 size={18} className="text-[#7C4DFF]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{type.label}</p>
                              <p className="text-xs font-mono text-gray-400">{type.code}</p>
                              {type.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{type.description}</p>}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button onClick={() => setEditType(type)} className="p-1.5 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition">
                                <Pencil size={13} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════
              COLLECTIONS
          ════════════════════════ */}
          {section === "collections" && (
            <div>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Collections Thématiques</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Regroupez vos offres (Nouveautés, Promos, Premium...)</p>
                </div>
                <button
                  onClick={() => { setAddingCol(true); setNewColName(""); }}
                  className="flex items-center gap-2 bg-[#7C4DFF] hover:bg-[#6A3DF0] text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  <Plus size={15} /> Ajouter
                </button>
              </div>

              <div className="p-6 space-y-4">
                {addingCol && (
                  <div className="bg-violet-50 dark:bg-violet-900/10 rounded-xl p-4 border border-violet-200 dark:border-violet-800/30">
                    <p className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wide mb-3">Nouvelle Collection</p>
                    <InlineForm
                      value={newColName}
                      onChange={setNewColName}
                      onSubmit={createCollection}
                      onCancel={() => setAddingCol(false)}
                      placeholder="Nom de la collection (ex: Soldes d'été)"
                      loading={colLoading}
                    />
                  </div>
                )}

                {colLoading ? (
                  <div className="flex flex-wrap gap-2">{[1, 2, 3].map(i => <div key={i} className="h-10 w-full bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />)}</div>
                ) : collections.length === 0 ? (
                  <div className="py-8 text-center">
                    <Layers size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-400">Aucune collection. Créez-en une !</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {collections.map(col => (
                      <div key={col.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 group transition">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                          <Layers size={14} className="text-emerald-500" />
                        </div>
                        <span className="flex-1 text-sm font-bold text-gray-700 dark:text-gray-300">{col.name}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => deleteCollection(col.id)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Supprimer">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════
              ATTRIBUTES
          ════════════════════════ */}
          {section === "attributes" && (
            <div>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Attributs dynamiques</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Créez des champs personnalisés pour vos catégories d'offres
                  </p>
                </div>
                <button
                  onClick={() => { setAddingAttr(true); setNewAttr({ category_id: "", attribute_name: "", display_label: "", data_type: "text" }); }}
                  className="flex items-center gap-2 bg-[#7C4DFF] hover:bg-[#6A3DF0] text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  <Plus size={15} /> Ajouter
                </button>
              </div>

              <div className="p-6 space-y-4">
                {addingAttr && (
                  <div className="bg-violet-50 dark:bg-violet-900/10 rounded-xl p-4 space-y-3 border border-violet-200 dark:border-violet-800/30">
                    <p className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wide">Nouvel attribut</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Titre (affiché) *</label>
                        <input
                          value={newAttr.display_label}
                          onChange={e => {
                            const val = e.target.value;
                            setNewAttr(p => ({
                              ...p,
                              display_label: val,
                              attribute_name: !p.attribute_name || p.attribute_name === p.display_label.toLowerCase().replace(/[^a-z0-9_]/g, "_")
                                ? val.toLowerCase().replace(/[^a-z0-9_]/g, "_")
                                : p.attribute_name
                            }));
                          }}
                          placeholder="ex: Kilométrage"
                          className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Clé technique *</label>
                        <input
                          value={newAttr.attribute_name}
                          onChange={e => setNewAttr(p => ({ ...p, attribute_name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") }))}
                          placeholder="ex: kilometrage"
                          className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Lié à la catégorie (optionnel)</label>
                        <select
                          value={newAttr.category_id}
                          onChange={e => setNewAttr(p => ({ ...p, category_id: e.target.value }))}
                          className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
                        >
                          <option value="">-- Attribut global --</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Type de donnée</label>
                        <select
                          value={newAttr.data_type}
                          onChange={e => setNewAttr(p => ({ ...p, data_type: e.target.value }))}
                          className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
                        >
                          <option value="text">Texte</option>
                          <option value="number">Nombre</option>
                          <option value="boolean">Oui/Non</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end mt-1">
                      <button onClick={() => setAddingAttr(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition">Annuler</button>
                      <button
                        onClick={createAttribute}
                        disabled={attrLoading || !newAttr.attribute_name || !newAttr.display_label}
                        className="px-4 py-2 text-sm bg-[#7C4DFF] text-white rounded-xl hover:bg-[#6A3DF0] disabled:opacity-40 transition font-semibold"
                      >
                        {attrLoading ? "Création..." : "Créer l'attribut"}
                      </button>
                    </div>
                  </div>
                )}

                {attrLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />)}</div>
                ) : attributes.length === 0 ? (
                  <div className="py-8 text-center">
                    <Package2 size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-400">Aucun attribut personnalisé.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attributes.map(attr => (
                      <div key={attr.id} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 group border border-transparent hover:border-gray-100 dark:hover:border-white/5 transition">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                          <Layers size={18} className="text-[#7C4DFF]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{attr.display_label}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-[#333] px-1.5 py-0.5 rounded">{attr.attribute_name}</span>
                            <span className="text-[10px] uppercase font-bold text-blue-500">{attr.data_type}</span>
                            {attr.category_id && (
                              <span className="text-[10px] uppercase font-bold text-amber-500">
                                Catégorie: {categories.find(c => c.id === attr.category_id)?.name || "Inconnue"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => deleteAttribute(attr.id)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Désactiver">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
