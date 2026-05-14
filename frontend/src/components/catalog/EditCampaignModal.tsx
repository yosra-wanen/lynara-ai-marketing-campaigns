"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Save, Trash2, Info, Settings, Image as ImageIcon, ShoppingCart, Globe, Quote, Target } from "lucide-react";
import { TagMultiSelect } from "./TagMultiSelect";
import { TypeSelector } from "./TypeSelector";
import { CategoryTree, buildCategoryTree } from "./CategoryTree";

interface Props {
  campagne: any;
  onClose: () => void;
  onUpdated: () => void;
  companyId: string;
}

type Tab = "general" | "commerce" | "partners" | "storytelling" | "targeting" | "media" | "settings";

export default function EditCampaignModal({ campagne, onClose, onUpdated, companyId: COMPANY_ID }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // CAT-01-01: Basic fields
  const [titleFr, setTitleFr] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [reference, setReference] = useState("");
  const [itemTypeId, setItemTypeId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [prix, setPrix] = useState("");
  const [currency, setCurrency] = useState("TND");
  const [status, setStatus] = useState("draft");

  // CAT-03: Storytelling
  const [descFr, setDescFr] = useState("");
  const [descAr, setDescAr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [subtitleFr, setSubtitleFr] = useState("");
  const [subtitleAr, setSubtitleAr] = useState("");
  const [subtitleEn, setSubtitleEn] = useState("");
  const [highlightsFr, setHighlightsFr] = useState("");
  const [highlightsAr, setHighlightsAr] = useState("");
  const [highlightsEn, setHighlightsEn] = useState("");
  const [internalReference, setInternalReference] = useState("");
  const [benefits, setBenefits] = useState<{ id?: string, benefit_fr: string, benefit_ar: string, benefit_en: string }[]>([]);
  const [scenarios, setScenarios] = useState<{ fr: string, ar: string, en: string }[]>([]);
  const [constraints, setConstraints] = useState<{ key: string, fr: string, ar: string, en: string }[]>([]);


  // CAT-05: Commerce
  const [variants, setVariants] = useState<{ id?: string, name: string, price: string, start_date: string, end_date: string }[]>([]);
  const [options, setOptions] = useState<{ id?: string, name: string, price: string, start_date: string, end_date: string }[]>([]);
  const [conditions, setConditions] = useState({ conditions_vente: "", acompte_percent: "", delai_livraison: "", politique_annulation: "" });

  // CAT-06: Targeting
  const [positioning, setPositioning] = useState("");
  const [tone, setTone] = useState("");
  const [keywords, setKeywords] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [nearbyPoi, setNearbyPoi] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);

  // CAT-07: Suppliers
  const [selectedSuppliers, setSelectedSuppliers] = useState<{ id?: string, supplier_id: string, commission_rate: string, notes: string }[]>([]);

  // Media
  const [existingMedia, setExistingMedia] = useState<any[]>([]);
  const [newMediaItems, setNewMediaItems] = useState<{ file: File, preview: string, isPrimary: boolean, caption: string, context: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Metadata
  const [itemTypes, setItemTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableCollections, setAvailableCollections] = useState<any[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<any[]>([]);
  const [availableSuppliers, setAvailableSuppliers] = useState<any[]>([]);

  // CAT-01-03: Dynamic attributes
  const [typeSchema, setTypeSchema] = useState<any[]>([]);
  const [dynamicAttributes, setDynamicAttributes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMetadataAndData();
  }, []);

  const API_BASE = "http://localhost:8001";

  useEffect(() => {
    if (itemTypeId && itemTypes.length > 0) {
      fetch(`${API_BASE}/catalog/item-types/${itemTypeId}/attribute-schema`)
        .then(r => r.json()).then(d => setTypeSchema(Array.isArray(d) ? d : [])).catch(() => setTypeSchema([]));
    } else {
      setTypeSchema([]);
    }
  }, [itemTypeId, itemTypes]);

  async function fetchMetadataAndData() {
    try {
      // 1. Fetch metadata options
      const [catsRes, typesRes, tagsRes, collsRes, profsRes, suppsRes] = await Promise.all([
        fetch(`${API_BASE}/catalog/categories?company_id=${COMPANY_ID}`),
        fetch(`${API_BASE}/catalog/item-types`),
        fetch(`${API_BASE}/catalog/tags?company_id=${COMPANY_ID}`),
        fetch(`${API_BASE}/catalog/collections?company_id=${COMPANY_ID}`),
        fetch(`${API_BASE}/catalog/target-profiles?company_id=${COMPANY_ID}`),
        fetch(`${API_BASE}/catalog/suppliers?company_id=${COMPANY_ID}`)
      ]);

      const [cats, types, tags, colls, profs, supps] = await Promise.all([
        catsRes.json(), typesRes.json(), tagsRes.json(), collsRes.json(), profsRes.json(), suppsRes.json()
      ]);

      setCategories(Array.isArray(cats) ? buildCategoryTree(cats) : []);
      setItemTypes(Array.isArray(types) ? types : []);

      setAvailableTags(Array.isArray(tags) ? tags : []);
      setAvailableCollections(Array.isArray(colls) ? colls : []);
      setAvailableProfiles(Array.isArray(profs) ? profs : []);
      setAvailableSuppliers(Array.isArray(supps) ? supps : []);

      // 2. Fetch Item Full Details from Supabase
      const itemId = campagne.id;

      const { data: itemData } = await supabase.schema("catalog").from("items").select("*").eq("id", itemId).single();
      if (itemData) {
        setTitleFr(itemData.title_fr || "");
        setTitleAr(itemData.title_ar || "");
        setTitleEn(itemData.title_en || "");
        setReference(itemData.reference || "");
        setItemTypeId(itemData.item_type_id || "");
        setCategoryId(itemData.category_id || "");
        setPrix(itemData.price !== null ? itemData.price.toString() : "");
        setCurrency(itemData.currency || "TND");
        setStatus(itemData.status || "draft");
        setDescFr(itemData.description_fr || "");
        setDescAr(itemData.description_ar || "");
        setDescEn(itemData.description_en || "");
        setSubtitleFr(itemData.subtitle_fr || "");
        setSubtitleAr(itemData.subtitle_ar || "");
        setSubtitleEn(itemData.subtitle_en || "");
        setHighlightsFr(itemData.description_highlights_fr || "");
        setHighlightsAr(itemData.description_highlights_ar || "");
        setHighlightsEn(itemData.description_highlights_en || "");
        setInternalReference(itemData.internal_reference || "");
        setScenarios(Array.isArray(itemData.usage_scenarios) ? itemData.usage_scenarios : []);
        setConstraints(Array.isArray(itemData.constraints) ? itemData.constraints : []);
        setConditions({
          conditions_vente: itemData.conditions_vente || "",
          acompte_percent: itemData.acompte_percent !== null ? itemData.acompte_percent.toString() : "",
          delai_livraison: itemData.delai_livraison || "",
          politique_annulation: itemData.politique_annulation || ""
        });
        setPositioning(itemData.positioning || "");
        setTone(itemData.tone || "");
        setKeywords(itemData.keywords ? itemData.keywords.join(", ") : "");
        setCity(itemData.city || "");
        setNeighborhood(itemData.neighborhood || "");
        setNearbyPoi(itemData.nearby_poi || "");

      }

      // Relations
      const { data: iTags } = await supabase.schema("catalog").from("item_tags").select("tag_id").eq("item_id", itemId);
      setSelectedTags(iTags?.map(t => t.tag_id) || []);

      const { data: iColls } = await supabase.schema("catalog").from("collection_items").select("collection_id").eq("item_id", itemId);
      setSelectedCollections(iColls?.map(c => c.collection_id) || []);

      const { data: iProfs } = await supabase.schema("catalog").from("item_target_profiles").select("target_profile_id").eq("item_id", itemId);
      setSelectedProfiles(iProfs?.map(p => p.target_profile_id) || []);

      const { data: iSupps } = await supabase.schema("catalog").from("item_suppliers").select("*").eq("item_id", itemId);
      setSelectedSuppliers(iSupps?.map(s => ({ id: s.id, supplier_id: s.supplier_id, commission_rate: s.commission_rate?.toString() || "", notes: s.notes || "" })) || []);

      const { data: iBens } = await supabase.schema("catalog").from("item_benefits").select("*").eq("item_id", itemId);
      setBenefits(iBens?.map(b => ({ id: b.id, benefit_fr: b.benefit_fr || "", benefit_ar: b.benefit_ar || "", benefit_en: b.benefit_en || "" })) || []);

      const { data: iVars } = await supabase.schema("catalog").from("item_variants").select("*").eq("item_id", itemId);
      setVariants(iVars?.map(v => ({ id: v.id, name: v.name || "", price: v.price?.toString() || "", start_date: v.start_date || "", end_date: v.end_date || "" })) || []);

      const { data: iOpts } = await supabase.schema("catalog").from("item_options").select("*").eq("item_id", itemId);
      setOptions(iOpts?.map(o => ({ id: o.id, name: o.name || "", price: o.price?.toString() || "", start_date: o.start_date || "", end_date: o.end_date || "" })) || []);

      const { data: iAttrsVal } = await supabase.schema("catalog").from("item_attribute_values").select("attribute_id, value, attribute_definitions(display_label)").eq("item_id", itemId);
      const dynAttrs: Record<string, string> = {};
      iAttrsVal?.forEach((a: any) => {
        const name = a.attribute_definitions?.display_label;
        if (name) dynAttrs[name] = a.value || "";
      });
      setDynamicAttributes(dynAttrs);


      const iMedia = await fetch(`${API_BASE}/catalog/items/${itemId}/media`).then(res => res.json()).catch(() => []);
      setExistingMedia(iMedia || []);

      setDataLoaded(true);
    } catch (e) { console.error(e); }
  }

  const handleMediaUpload = (files: FileList | File[]) => {
    const newFiles = Array.from(files).filter(f => f.type.startsWith("image/")).map((file, i) => ({
      file, preview: URL.createObjectURL(file), isPrimary: existingMedia.length === 0 && newMediaItems.length === 0 && i === 0, caption: "", context: "catalog"
    }));
    setNewMediaItems(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleMediaUpload(e.dataTransfer.files);
  };

  async function deleteExistingMedia(id: string) {
    if (!confirm("Voulez-vous vraiment supprimer cette image ?")) return;
    try {
      const res = await fetch(`${API_BASE}/catalog/media/${id}`, { method: "DELETE" });
      if (res.ok) setExistingMedia(existingMedia.filter(m => m.id !== id));
    } catch (e) { console.error(e); }
  }

  async function updateCampaign() {
    if (!titleFr || !itemTypeId) { alert("Le titre (FR) et le type d'offre sont obligatoires."); return; }
    setLoading(true);
    try {
      const itemId = campagne.id;
      const { data: { user } } = await supabase.auth.getUser();

      const { error: itemError } = await supabase.schema("catalog").from("items").update({
        updated_by: user?.id || null,
        reference,
        internal_reference: internalReference,
        title_fr: titleFr, title_ar: titleAr, title_en: titleEn,
        subtitle_fr: subtitleFr, subtitle_ar: subtitleAr, subtitle_en: subtitleEn,
        description_fr: descFr, description_ar: descAr, description_en: descEn,
        description_highlights_fr: highlightsFr, description_highlights_ar: highlightsAr, description_highlights_en: highlightsEn,
        price: prix ? Number(prix) : null, currency,
        category_id: categoryId || null,
        item_type_id: itemTypeId || null,
        status,
        conditions_vente: conditions.conditions_vente,
        acompte_percent: conditions.acompte_percent ? Number(conditions.acompte_percent) : null,
        delai_livraison: conditions.delai_livraison,
        politique_annulation: conditions.politique_annulation,
        positioning, tone, city, neighborhood, nearby_poi: nearbyPoi,
        keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        usage_scenarios: scenarios,
        constraints
      }).eq("id", itemId);


      if (itemError) throw itemError;

      // Simplest way to manage relations: Delete existing and re-insert everything
      const delPromises: any[] = [];
      delPromises.push(supabase.schema("catalog").from("item_tags").delete().eq("item_id", itemId));
      delPromises.push(supabase.schema("catalog").from("collection_items").delete().eq("item_id", itemId));
      delPromises.push(supabase.schema("catalog").from("item_target_profiles").delete().eq("item_id", itemId));
      delPromises.push(supabase.schema("catalog").from("item_suppliers").delete().eq("item_id", itemId));
      delPromises.push(supabase.schema("catalog").from("item_variants").delete().eq("item_id", itemId));
      delPromises.push(supabase.schema("catalog").from("item_options").delete().eq("item_id", itemId));
      delPromises.push(supabase.schema("catalog").from("item_attribute_values").delete().eq("item_id", itemId));
      delPromises.push(supabase.schema("catalog").from("item_benefits").delete().eq("item_id", itemId));

      await Promise.all(delPromises);


      const insPromises: any[] = [];
      if (selectedTags.length > 0) insPromises.push(supabase.schema("catalog").from("item_tags").insert(selectedTags.map(tag_id => ({ item_id: itemId, tag_id, company_id: COMPANY_ID }))).select());
      if (selectedCollections.length > 0) insPromises.push(supabase.schema("catalog").from("collection_items").insert(selectedCollections.map(collection_id => ({ item_id: itemId, collection_id, company_id: COMPANY_ID }))).select());
      if (selectedProfiles.length > 0) insPromises.push(supabase.schema("catalog").from("item_target_profiles").insert(selectedProfiles.map(profile_id => ({ item_id: itemId, target_profile_id: profile_id, company_id: COMPANY_ID }))).select());

      const validSupps = selectedSuppliers.filter(s => s.supplier_id);
      if (validSupps.length > 0) insPromises.push(supabase.schema("catalog").from("item_suppliers").insert(validSupps.map(s => ({ company_id: COMPANY_ID, item_id: itemId, supplier_id: s.supplier_id, commission_rate: s.commission_rate ? Number(s.commission_rate) : null, notes: s.notes }))).select());


      if (variants.length > 0) insPromises.push(supabase.schema("catalog").from("item_variants").insert(variants.map(v => ({ company_id: COMPANY_ID, item_id: itemId, name: v.name, price: v.price ? Number(v.price) : null, start_date: v.start_date || null, end_date: v.end_date || null }))).select());
      if (options.length > 0) insPromises.push(supabase.schema("catalog").from("item_options").insert(options.map(o => ({ company_id: COMPANY_ID, item_id: itemId, name: o.name, price: o.price ? Number(o.price) : null, start_date: o.start_date || null, end_date: o.end_date || null }))).select());

      if (benefits.length > 0) {
        insPromises.push(supabase.schema("catalog").from("item_benefits").insert(benefits.map(b => ({ item_id: itemId, company_id: COMPANY_ID, benefit_fr: b.benefit_fr, benefit_ar: b.benefit_ar, benefit_en: b.benefit_en }))).select());
      }

      // Dynamic Attributes
      const attributeData = Object.entries(dynamicAttributes)
        .filter(([, v]) => v !== "")
        .map(([name, value]) => {
          const attrDef = typeSchema.find(a => a.name === name);
          return { company_id: COMPANY_ID, item_id: itemId, attribute_id: attrDef?.id, value };
        })
        .filter(a => a.attribute_id);

      if (attributeData.length > 0) {
        insPromises.push(supabase.schema("catalog").from("item_attribute_values").insert(attributeData).select());
      }


      await Promise.all(insPromises);

      // Media upload

      // NEW MEDIA UPLOAD
      for (const m of newMediaItems) {
        const formData = new FormData();
        formData.append("file", m.file);
        formData.append("company_id", COMPANY_ID);
        formData.append("is_primary", String(m.isPrimary));
        if (m.caption) formData.append("caption_text", m.caption);
        if (m.context) formData.append("usage_context", m.context);
        
        await fetch(`${API_BASE}/catalog/items/${itemId}/media`, {
          method: "POST",
          body: formData,
        });
      }

      onUpdated();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert("Erreur: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!dataLoaded) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl">Chargement...</div>
      </div>
    );
  }

  const TABS = [
    { id: "general", label: "Général", icon: Info },
    { id: "commerce", label: "Commerce", icon: ShoppingCart },
    { id: "partners", label: "Partenaires", icon: Globe },
    { id: "storytelling", label: "Storytelling", icon: Quote },
    { id: "targeting", label: "Ciblage", icon: Target },
    { id: "media", label: "Médias", icon: ImageIcon },
    { id: "settings", label: "Publication", icon: Settings },
  ];

  const inp = "w-full bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 transition";
  const label = "block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Modifier l'offre</h2>
            <p className="text-sm text-gray-500 mt-0.5">Mettez à jour les informations</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 overflow-x-auto border-b border-gray-100 dark:border-white/5">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-[#7C4DFF] text-white" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"}`}>
                <Icon size={15} />{tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* GENERAL TAB */}
          {activeTab === "general" && (
            <div className="space-y-5">
              <div className="space-y-3">
                <label className={label}>Type d'offre *</label>
                <TypeSelector
                  itemTypes={itemTypes}
                  selectedTypeId={itemTypeId}
                  onChange={setItemTypeId}
                />
              </div>

              <div className="space-y-2">
                <label className={label}>Catégorie</label>
                <div className="border border-gray-200 dark:border-white/10 rounded-xl p-2 max-h-48 overflow-y-auto bg-gray-50 dark:bg-[#2A2A2A]">
                  <CategoryTree
                    nodes={buildCategoryTree(categories)}
                    selectedIds={categoryId ? [categoryId] : []}
                    onToggle={(id) => setCategoryId(prev => prev === id ? "" : id)}
                    multiSelect={false}
                  />
                </div>
              </div>

              <div>
                <label className={label}>Titre (FR) *</label>
                <input value={titleFr} onChange={e => setTitleFr(e.target.value)} placeholder="Titre principal en français" className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>Titre (AR)</label>
                  <input value={titleAr} onChange={e => setTitleAr(e.target.value)} placeholder="العنوان بالعربية" className={inp} dir="rtl" />
                </div>
                <div>
                  <label className={label}>Titre (EN)</label>
                  <input value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="Title in English" className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={label}>Référence *</label><input value={reference} onChange={e => setReference(e.target.value)} className={inp} placeholder="PFE-2024-001" /></div>
                  <div><label className={label}>Référence Interne</label><input value={internalReference} onChange={e => setInternalReference(e.target.value)} className={inp} placeholder="REF-INT-999" /></div>
                </div>

              </div>

              {/* CAT-01-03: Dynamic Attributes */}
              {typeSchema.length > 0 && (
                <div className="border-t pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-[#7C4DFF] uppercase tracking-wider">Attributs spécifiques – {itemTypes.find(t => t.id === itemTypeId)?.label}</h4>



                  <div className="grid grid-cols-2 gap-4">
                    {typeSchema.map(attr => (
                      <div key={attr.id}>
                        <label className={label}>{attr.name}</label>
                        {attr.value_type === "enum" ? (
                          <select value={dynamicAttributes[attr.name] || ""} onChange={e => setDynamicAttributes({ ...dynamicAttributes, [attr.name]: e.target.value })} className={inp}>
                            <option value="">--</option>
                          </select>
                        ) : (
                          <input type={attr.value_type === "number" ? "number" : "text"} value={dynamicAttributes[attr.name] || ""} onChange={e => setDynamicAttributes({ ...dynamicAttributes, [attr.name]: e.target.value })} placeholder={attr.name} className={inp} />
                        )}
                      </div>
                    ))}


                  </div>
                </div>
              )}

              {/* Tags & Collections */}
              <div className="grid grid-cols-2 gap-6 border-t pt-4">
                <div>
                  <label className={label}>Tags</label>
                  <TagMultiSelect
                    availableTags={availableTags}
                    selectedTagIds={selectedTags}
                    onChange={setSelectedTags}
                    onCreateTag={async (name) => {
                      try {
                        const res = await fetch(`${API_BASE}/catalog/tags`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ name, company_id: COMPANY_ID }),
                        });
                        const tag = await res.json();
                        setAvailableTags(prev => [...prev, tag]);
                        return tag;
                      } catch { return null; }
                    }}
                    placeholder="Ajouter des tags..."
                  />
                </div>
                <div>
                  <label className={label}>Collections</label>
                  <div className="flex flex-wrap gap-2">
                    {availableCollections.map(col => (
                      <button key={col.id} onClick={() => setSelectedCollections(selectedCollections.includes(col.id) ? selectedCollections.filter(c => c !== col.id) : [...selectedCollections, col.id])} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${selectedCollections.includes(col.id) ? "bg-emerald-500 text-white" : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400"}`}>{col.name}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COMMERCE TAB */}
          {activeTab === "commerce" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2"><label className={label}>Prix indicatif</label><input type="number" value={prix} onChange={e => setPrix(e.target.value)} placeholder="0" className={inp} /></div>
                <div><label className={label}>Devise</label><select value={currency} onChange={e => setCurrency(e.target.value)} className={inp}><option>TND</option><option>EUR</option><option>USD</option><option>MAD</option></select></div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Variantes</h3>
                  <button onClick={() => setVariants([...variants, { name: "", price: "", start_date: "", end_date: "" }])} className="text-xs bg-[#7C4DFF]/10 text-[#7C4DFF] font-bold px-3 py-1.5 rounded-lg">+ Variante</button>
                </div>
                {variants.map((v, i) => (
                  <div key={i} className="flex flex-col gap-2 p-3 mb-2 border rounded-xl bg-gray-50 dark:bg-white/5">
                    <div className="flex gap-3">
                      <input placeholder="Nom (ex: Surface 120m²)" value={v.name} onChange={e => { const n = [...variants]; n[i].name = e.target.value; setVariants(n); }} className={`${inp} flex-[3]`} />
                      <input type="number" placeholder="Prix" value={v.price} onChange={e => { const n = [...variants]; n[i].price = e.target.value; setVariants(n); }} className={`${inp} flex-1`} />
                      <button onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={16} /></button>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-400 uppercase font-bold">Début saison</label>
                        <input type="date" value={v.start_date} onChange={e => { const n = [...variants]; n[i].start_date = e.target.value; setVariants(n); }} className="w-full text-xs p-2 border rounded-lg bg-white dark:bg-[#1A1A1A]" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-400 uppercase font-bold">Fin saison</label>
                        <input type="date" value={v.end_date} onChange={e => { const n = [...variants]; n[i].end_date = e.target.value; setVariants(n); }} className="w-full text-xs p-2 border rounded-lg bg-white dark:bg-[#1A1A1A]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Options & Suppléments</h3>
                  <button onClick={() => setOptions([...options, { name: "", price: "", start_date: "", end_date: "" }])} className="text-xs bg-emerald-500/10 text-emerald-600 font-bold px-3 py-1.5 rounded-lg">+ Option</button>
                </div>
                {options.map((o, i) => (
                  <div key={i} className="flex flex-col gap-2 p-3 mb-2 border rounded-xl bg-gray-50 dark:bg-white/5">
                    <div className="flex gap-3">
                      <input placeholder="Option (ex: Parking)" value={o.name} onChange={e => { const n = [...options]; n[i].name = e.target.value; setOptions(n); }} className={`${inp} flex-[3]`} />
                      <input type="number" placeholder="Prix" value={o.price} onChange={e => { const n = [...options]; n[i].price = e.target.value; setOptions(n); }} className={`${inp} flex-1`} />
                      <button onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={16} /></button>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-400 uppercase font-bold">Début validité</label>
                        <input type="date" value={o.start_date} onChange={e => { const n = [...options]; n[i].start_date = e.target.value; setOptions(n); }} className="w-full text-xs p-2 border rounded-lg bg-white dark:bg-[#1A1A1A]" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-400 uppercase font-bold">Fin validité</label>
                        <input type="date" value={o.end_date} onChange={e => { const n = [...options]; n[i].end_date = e.target.value; setOptions(n); }} className="w-full text-xs p-2 border rounded-lg bg-white dark:bg-[#1A1A1A]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Conditions de vente</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={label}>Acompte (%)</label><input type="number" value={conditions.acompte_percent} onChange={e => setConditions({ ...conditions, acompte_percent: e.target.value })} className={inp} placeholder="30" /></div>
                  <div><label className={label}>Délai de livraison</label><input value={conditions.delai_livraison} onChange={e => setConditions({ ...conditions, delai_livraison: e.target.value })} className={inp} placeholder="30 jours" /></div>
                </div>
                <div><label className={label}>Conditions générales de vente</label><textarea value={conditions.conditions_vente} onChange={e => setConditions({ ...conditions, conditions_vente: e.target.value })} rows={2} className={inp} placeholder="Conditions..." /></div>
                <div><label className={label}>Politique d'annulation</label><textarea value={conditions.politique_annulation} onChange={e => setConditions({ ...conditions, politique_annulation: e.target.value })} rows={2} className={inp} placeholder="Délai d'annulation..." /></div>
              </div>
            </div>
          )}

          {/* PARTNERS TAB */}
          {activeTab === "partners" && (
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-sm font-bold uppercase text-[#7C4DFF]">Fournisseurs & Propriétaires</h3>
                <button onClick={() => setSelectedSuppliers([...selectedSuppliers, { supplier_id: "", commission_rate: "", notes: "" }])} className="text-[#7C4DFF] font-bold text-xs bg-[#7C4DFF]/10 px-3 py-1.5 rounded-lg">+ Ajouter un partenaire</button>
              </div>
              {selectedSuppliers.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Aucun partenaire lié à cette offre.</p>}
              {selectedSuppliers.map((s, i) => (
                <div key={i} className="flex gap-3 p-4 border rounded-xl bg-gray-50 dark:bg-white/5">
                  <select value={s.supplier_id} onChange={e => { const n = [...selectedSuppliers]; n[i].supplier_id = e.target.value; setSelectedSuppliers(n); }} className={`${inp} flex-[2]`}>
                    <option value="">-- Fournisseur --</option>
                    {availableSuppliers.map(supp => <option key={supp.id} value={supp.id}>{supp.name}</option>)}
                  </select>
                  <div className="flex-1 relative">
                    <input type="number" placeholder="Commission" value={s.commission_rate} onChange={e => { const n = [...selectedSuppliers]; n[i].commission_rate = e.target.value; setSelectedSuppliers(n); }} className={inp} />
                    <span className="absolute right-3 top-3 text-xs text-gray-400">%</span>
                  </div>
                  <input placeholder="Notes" value={s.notes} onChange={e => { const n = [...selectedSuppliers]; n[i].notes = e.target.value; setSelectedSuppliers(n); }} className={`${inp} flex-[2]`} />
                  <button onClick={() => setSelectedSuppliers(selectedSuppliers.filter((_, idx) => idx !== i))} className="text-red-400 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}

          {/* STORYTELLING TAB */}
          {activeTab === "storytelling" && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div><label className={label}>Sous-titre (FR)</label><input value={subtitleFr} onChange={e => setSubtitleFr(e.target.value)} placeholder="Titre d'accroche..." className={inp} /></div>
                <div><label className={label}>العنوان الفرعي (AR)</label><input value={subtitleAr} onChange={e => setSubtitleAr(e.target.value)} placeholder="..." className={inp} dir="rtl" /></div>
                <div><label className={label}>Subtitle (EN)</label><input value={subtitleEn} onChange={e => setSubtitleEn(e.target.value)} placeholder="Catchy title..." className={inp} /></div>
              </div>


              <div>
                <label className={label}>Description détaillée (FR)</label>
                <textarea rows={4} value={descFr} onChange={e => setDescFr(e.target.value)} placeholder="Décrivez votre offre en français..." className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>Description (AR)</label>
                  <textarea rows={3} value={descAr} onChange={e => setDescAr(e.target.value)} placeholder="الوصف بالعربية..." className={inp} dir="rtl" />
                </div>
                <div>
                  <label className={label}>Description (EN)</label>
                  <textarea rows={3} value={descEn} onChange={e => setDescEn(e.target.value)} placeholder="Description in English..." className={inp} />
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Settings size={16} /> Points forts / Description Highlights</h3>
                <div>
                  <label className={label}>Points forts (FR)</label>
                  <textarea rows={2} value={highlightsFr} onChange={e => setHighlightsFr(e.target.value)} placeholder="Points clés à mettre en avant..." className={inp} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={label}>Points forts (AR)</label><textarea rows={2} value={highlightsAr} onChange={e => setHighlightsAr(e.target.value)} className={inp} dir="rtl" /></div>
                  <div><label className={label}>Highlights (EN)</label><textarea rows={2} value={highlightsEn} onChange={e => setHighlightsEn(e.target.value)} className={inp} /></div>
                </div>
              </div>


              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Bénéfices & Promesses</h3>
                  <button onClick={() => setBenefits([...benefits, { benefit_fr: "", benefit_ar: "", benefit_en: "" }])} className="text-xs bg-[#7C4DFF]/10 text-[#7C4DFF] font-bold px-3 py-1.5 rounded-lg">+ Bénéfice</button>
                </div>
                {benefits.map((b, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                    <input placeholder="Bénéfice FR" value={b.benefit_fr} onChange={e => { const n = [...benefits]; n[i].benefit_fr = e.target.value; setBenefits(n); }} className={inp} />
                    <input placeholder="بالعربية" value={b.benefit_ar} onChange={e => { const n = [...benefits]; n[i].benefit_ar = e.target.value; setBenefits(n); }} className={inp} dir="rtl" />
                    <div className="flex gap-2">
                      <input placeholder="English" value={b.benefit_en} onChange={e => { const n = [...benefits]; n[i].benefit_en = e.target.value; setBenefits(n); }} className={`${inp} flex-1`} />
                      <button onClick={() => setBenefits(benefits.filter((_, idx) => idx !== i))} className="text-red-400"><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Scénarios d'usage</h3>
                  <button onClick={() => setScenarios([...scenarios, { fr: "", ar: "", en: "" }])} className="text-xs bg-emerald-500/10 text-emerald-600 font-bold px-3 py-1.5 rounded-lg">+ Scénario</button>
                </div>
                {scenarios.map((s, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                    <input placeholder="Scénario FR" value={s.fr} onChange={e => { const n = [...scenarios]; n[i].fr = e.target.value; setScenarios(n); }} className={inp} />
                    <input placeholder="بالعربية" value={s.ar} onChange={e => { const n = [...scenarios]; n[i].ar = e.target.value; setScenarios(n); }} className={inp} dir="rtl" />
                    <div className="flex gap-2">
                      <input placeholder="English" value={s.en} onChange={e => { const n = [...scenarios]; n[i].en = e.target.value; setScenarios(n); }} className={`${inp} flex-1`} />
                      <button onClick={() => setScenarios(scenarios.filter((_, idx) => idx !== i))} className="text-red-400"><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TARGETING TAB */}
          {activeTab === "targeting" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={label}>Positionnement</label><input value={positioning} onChange={e => setPositioning(e.target.value)} placeholder="Ex: Premium, Accessible..." className={inp} /></div>
                <div><label className={label}>Ton de communication</label><input value={tone} onChange={e => setTone(e.target.value)} placeholder="Ex: Formel, Moderne..." className={inp} /></div>
              </div>
              <div><label className={label}>Mots-clés (séparés par virgule)</label><input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="appartement, lac1, luxe, vue..." className={inp} /></div>
              <div className="border-t pt-4 grid grid-cols-3 gap-4">
                <div><label className={label}>Ville</label><input value={city} onChange={e => setCity(e.target.value)} placeholder="Tunis" className={inp} /></div>
                <div><label className={label}>Quartier</label><input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Lac 1" className={inp} /></div>
                <div><label className={label}>Points d'intérêt</label><input value={nearbyPoi} onChange={e => setNearbyPoi(e.target.value)} placeholder="Métro, Centre comm..." className={inp} /></div>
              </div>
              <div className="border-t pt-4">
                <label className={label}>Profils cibles</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableProfiles.map(p => (
                    <button key={p.id} onClick={() => setSelectedProfiles(selectedProfiles.includes(p.id) ? selectedProfiles.filter(id => id !== p.id) : [...selectedProfiles, p.id])} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${selectedProfiles.includes(p.id) ? "bg-orange-400 text-white" : "bg-gray-100 dark:bg-white/10 text-gray-600"}`}>{p.name}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MEDIA TAB */}
          {activeTab === "media" && (
            <div className="space-y-4">

              {/* Existing Media */}
              {existingMedia.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-600 mb-3">Images existantes</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {existingMedia.map((m) => (
                      <div key={m.id} className={`p-3 rounded-2xl border ${m.is_primary ? "border-[#7C4DFF] bg-[#7C4DFF]/5" : "border-gray-200"}`}>
                        <div className="flex gap-3">
                          <img src={m.url} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="text-xs font-semibold text-gray-500">{m.usage_context}</div>
                            <div className="text-xs text-gray-600 truncate">{m.caption_text || "Sans légende"}</div>
                            <div className="flex justify-between items-center">
                              {m.is_primary && <span className="text-[10px] text-[#7C4DFF] font-bold">⭐ Principal</span>}
                              {!m.is_primary && <span className="text-[10px] text-gray-400">Ordinaire</span>}
                              <button onClick={() => deleteExistingMedia(m.id)} className="text-red-400"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload new */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`p-10 border-2 border-dashed rounded-3xl text-center transition-all ${
                  isDragging ? "border-[#7C4DFF] bg-[#7C4DFF]/10 scale-[1.02]" : "border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                <ImageIcon className={`mx-auto mb-4 transition ${isDragging ? "text-[#7C4DFF] scale-110" : "text-gray-400"}`} size={40} />
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {isDragging ? "Relâchez les images ici..." : "Glissez-déposez vos images"}
                </h3>
                <p className="text-sm text-gray-500 mb-4">ou cliquez pour parcourir (PNG, JPG, WEBP)</p>
                <label className="px-6 py-2.5 bg-[#7C4DFF] text-white rounded-xl cursor-pointer font-bold inline-block hover:bg-[#6A3DF0] transition shadow-lg shadow-[#7C4DFF]/20">
                  Parcourir
                  <input type="file" multiple accept="image/*" onChange={(e) => e.target.files && handleMediaUpload(e.target.files)} className="hidden" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {newMediaItems.map((m, idx) => (
                  <div key={idx} className={`p-3 rounded-2xl border ${m.isPrimary ? "border-[#7C4DFF] bg-[#7C4DFF]/5" : "border-gray-200 dark:border-white/10"}`}>
                    <div className="flex gap-3">
                      <img src={m.preview} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 space-y-2">
                        <select value={m.context} onChange={e => { const n = [...newMediaItems]; n[idx].context = e.target.value; setNewMediaItems(n); }} className="text-xs border rounded-lg p-1 w-full">
                          <option value="catalog">Catalogue</option>
                          <option value="social_post">Post Social</option>
                        </select>
                        <input value={m.caption} onChange={e => { const n = [...newMediaItems]; n[idx].caption = e.target.value; setNewMediaItems(n); }} placeholder="Légende..." className="w-full text-xs border-b py-1 outline-none bg-transparent" />
                        <div className="flex justify-between items-center">
                          {!m.isPrimary && <button onClick={() => setNewMediaItems(newMediaItems.map((item, i) => ({ ...item, isPrimary: i === idx })))} className="text-[10px] text-[#7C4DFF] font-bold uppercase">Définir principal</button>}
                          {m.isPrimary && <span className="text-[10px] text-[#7C4DFF] font-bold">⭐ Principal</span>}
                          <button onClick={() => { URL.revokeObjectURL(m.preview); setNewMediaItems(newMediaItems.filter((_, i) => i !== idx)); }} className="text-red-400"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="space-y-5">
              <div>
                <label className={label}>Statut de publication</label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {[
                    { v: "draft",     l: "🔵 Brouillon" },
                    { v: "published", l: "🟢 Publié" },
                    { v: "archived",  l: "⚫ Archivé" }
                  ].map(opt => (
                    <button key={opt.v} onClick={() => setStatus(opt.v)} className={`p-3 rounded-xl border-2 text-sm font-semibold transition ${status === opt.v ? "border-[#7C4DFF] bg-[#7C4DFF]/10 text-[#7C4DFF]" : "border-gray-200 dark:border-white/10 text-gray-500"}`}>{opt.l}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 dark:border-white/5">
          <button onClick={onClose} className="px-6 py-3 rounded-2xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50">Annuler</button>
          <button onClick={updateCampaign} disabled={loading} className="px-8 py-3 bg-[#7C4DFF] hover:bg-[#6A3DF0] text-white rounded-2xl font-bold shadow-lg shadow-[#7C4DFF]/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Save size={18} />}
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
