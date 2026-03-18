"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Tag, Calendar, Share2,
  ChevronLeft, ChevronRight, X, Plus, Pencil,
  Trash2, Check, ZoomIn, Users,
} from "lucide-react";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface CatalogItem {
  id: string;
  title_fr: string;
  description_fr: string;
  price: number;
  currency: string;
  category?: string;
  state?: string;
  created_at?: string;
  company_id?: string;
}
interface Variant       { id: string; name: string; price: number | null; created_at: string }
interface Option        { id: string; name: string; price: number | null; created_at: string }
interface TargetProfile { id: string; name: string; description: string | null }
interface LinkedProfile { id: string; target_profile_id: string; target_profiles: TargetProfile }
interface Conditions {
  conditions_vente: string | null;
  acompte_percent: number | null;
  delai_livraison: string | null;
  politique_annulation: string | null;
}

type Tab = "infos" | "variantes" | "options" | "cible" | "conditions";

const API        = "http://localhost:8001";
const COMPANY_ID = "7abcc5d8-f6c9-4602-bfce-a7dba8fa2981";

const PROFILE_ICONS: Record<string, string> = {
  "Famille":             "👨‍👩‍👧",
  "Investisseur":        "💼",
  "Jeune professionnel": "👨‍💻",
  "Résidence secondaire":"🏖️",
  "Revendeur":           "🏪",
  "Touriste":            "✈️",
};

function formatPrice(price: number, currency = "TND"): string {
  if (!price) return "—";
  return new Intl.NumberFormat("fr-TN").format(price) + " " + currency;
}

// ─────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111111] animate-pulse">
      <div className="w-full px-6 py-8">
        <div className="h-4 w-32 bg-gray-200 dark:bg-[#2A2A2A] rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-3">
            <div className="h-[460px] bg-gray-200 dark:bg-[#2A2A2A] rounded-2xl" />
            <div className="flex gap-3">
              {[1,2,3].map(i => <div key={i} className="h-20 w-28 bg-gray-200 dark:bg-[#2A2A2A] rounded-xl" />)}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="h-6 w-3/4 bg-gray-200 dark:bg-[#2A2A2A] rounded" />
            <div className="h-10 w-1/2 bg-gray-200 dark:bg-[#2A2A2A] rounded" />
            <div className="h-32 bg-gray-200 dark:bg-[#2A2A2A] rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function CatalogDetailPage() {
  const params  = useParams();
  const id      = params.id as string;
  const router  = useRouter();

  const [item,        setItem]        = useState<CatalogItem | null>(null);
  const [images,      setImages]      = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [lightbox,    setLightbox]    = useState(false);
  const [activeTab,   setActiveTab]   = useState<Tab>("infos");
  const [copied,      setCopied]      = useState(false);

  // variants
  const [variants,     setVariants]     = useState<Variant[]>([]);
  const [varLoading,   setVarLoading]   = useState(false);
  const [newVarName,   setNewVarName]   = useState("");
  const [newVarPrice,  setNewVarPrice]  = useState("");
  const [editingVar,   setEditingVar]   = useState<string | null>(null);
  const [editVarName,  setEditVarName]  = useState("");
  const [editVarPrice, setEditVarPrice] = useState("");

  // options
  const [options,      setOptions]      = useState<Option[]>([]);
  const [optLoading,   setOptLoading]   = useState(false);
  const [newOptName,   setNewOptName]   = useState("");
  const [newOptPrice,  setNewOptPrice]  = useState("");
  const [editingOpt,   setEditingOpt]   = useState<string | null>(null);
  const [editOptName,  setEditOptName]  = useState("");
  const [editOptPrice, setEditOptPrice] = useState("");

  // cible
  const [allProfiles,    setAllProfiles]    = useState<TargetProfile[]>([]);
  const [linkedProfiles, setLinkedProfiles] = useState<LinkedProfile[]>([]);
  const [cibleLoading,   setCibleLoading]   = useState(false);
  const [togglingId,     setTogglingId]     = useState<string | null>(null);

  // conditions
  const [conditions,  setConditions]  = useState<Conditions | null>(null);
  const [condLoading, setCondLoading] = useState(false);
  const [condSaving,  setCondSaving]  = useState(false);
  const [condForm,    setCondForm]    = useState({
    conditions_vente: "",
    acompte_percent: "",
    delai_livraison: "",
    politique_annulation: "",
  });
  // positionnement
const [posForm,    setPosForm]    = useState({
  positioning: "",
  tone: "",
  keywords: [] as string[],
  city: "",
  neighborhood: "",
  nearby_poi: "",
});
const [posSaving,  setPosSaving]  = useState(false);
const [newKeyword, setNewKeyword] = useState("");
const [completeness, setCompleteness] = useState<{score: number, details: Record<string, boolean>} | null>(null);
const [mandatoryCheck, setMandatoryCheck] = useState<{missing: string[], complete: boolean, item_type: string | null} | null>(null);

  // keyboard nav for lightbox
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!lightbox) return;
    if (e.key === "ArrowRight") setSelectedIdx(i => (i + 1) % images.length);
    if (e.key === "ArrowLeft")  setSelectedIdx(i => (i - 1 + images.length) % images.length);
    if (e.key === "Escape")     setLightbox(false);
  }, [lightbox, images.length]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => { if (id) loadData(); }, [id]);

  useEffect(() => {
    if (activeTab === "variantes"  && variants.length === 0)    fetchVariants();
    if (activeTab === "options"    && options.length === 0)     fetchOptions();
    if (activeTab === "cible"      && allProfiles.length === 0) fetchCible();
    if (activeTab === "conditions" && !conditions)              fetchConditions();
    
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    await Promise.all([fetchItem(), fetchImages(), fetchCompleteness(), fetchMandatoryCheck()]);
    setLoading(false);
  }

  async function fetchItem() {
    try {
      const res = await fetch(`${API}/catalog/items/${id}`);
      if (!res.ok) throw new Error();
      setItem(await res.json());
    } catch { setItem(null); }
  }

  async function fetchImages() {
    try {
      const res  = await fetch(`${API}/catalog/items/${id}/media`);
      if (!res.ok) return;
      const data = await res.json();
      setImages(data.map((m: any) => m.url));
    } catch { /* silent */ }
  }

  // ── VARIANTS ──
  async function fetchVariants() {
    setVarLoading(true);
    try { setVariants(await (await fetch(`${API}/catalog/items/${id}/variants`)).json()); }
    catch { /* silent */ }
    setVarLoading(false);
  }
  async function addVariant() {
    if (!newVarName.trim()) return;
    const v = await (await fetch(`${API}/catalog/items/${id}/variants`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newVarName.trim(), price: newVarPrice ? parseFloat(newVarPrice) : null }),
    })).json();
    setVariants(p => [...p, v]); setNewVarName(""); setNewVarPrice("");
  }
  async function saveVariant(vid: string) {
    const v = await (await fetch(`${API}/catalog/variants/${vid}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editVarName, price: editVarPrice ? parseFloat(editVarPrice) : null }),
    })).json();
    setVariants(p => p.map(x => x.id === vid ? v : x)); setEditingVar(null);
  }
  async function deleteVariant(vid: string) {
    if (!confirm("Supprimer cette variante ?")) return;
    await fetch(`${API}/catalog/variants/${vid}`, { method: "DELETE" });
    setVariants(p => p.filter(x => x.id !== vid));
  }

  // ── OPTIONS ──
  async function fetchOptions() {
    setOptLoading(true);
    try { setOptions(await (await fetch(`${API}/catalog/items/${id}/options`)).json()); }
    catch { /* silent */ }
    setOptLoading(false);
  }
  async function addOption() {
    if (!newOptName.trim()) return;
    const o = await (await fetch(`${API}/catalog/items/${id}/options`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newOptName.trim(), price: newOptPrice ? parseFloat(newOptPrice) : null }),
    })).json();
    setOptions(p => [...p, o]); setNewOptName(""); setNewOptPrice("");
  }
  async function saveOption(oid: string) {
    const o = await (await fetch(`${API}/catalog/options/${oid}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editOptName, price: editOptPrice ? parseFloat(editOptPrice) : null }),
    })).json();
    setOptions(p => p.map(x => x.id === oid ? o : x)); setEditingOpt(null);
  }
  async function deleteOption(oid: string) {
    if (!confirm("Supprimer cette option ?")) return;
    await fetch(`${API}/catalog/options/${oid}`, { method: "DELETE" });
    setOptions(p => p.filter(x => x.id !== oid));
  }

  // ── CIBLE ──
  async function fetchCible() {
    setCibleLoading(true);
    try {
      const [all, linked] = await Promise.all([
        fetch(`${API}/catalog/target-profiles?company_id=${COMPANY_ID}`).then(r => r.json()),
        fetch(`${API}/catalog/items/${id}/target-profiles`).then(r => r.json()),
      ]);
      setAllProfiles(all);
      setLinkedProfiles(linked);
    } catch { /* silent */ }
    setCibleLoading(false);
  }

  async function toggleProfile(profile: TargetProfile) {
    setTogglingId(profile.id);
    const isLinked = linkedProfiles.some(l => l.target_profile_id === profile.id);
    try {
      if (isLinked) {
        await fetch(`${API}/catalog/items/${id}/target-profiles/${profile.id}`, { method: "DELETE" });
        setLinkedProfiles(p => p.filter(l => l.target_profile_id !== profile.id));
      } else {
        const res  = await fetch(`${API}/catalog/items/${id}/target-profiles/${profile.id}`, { method: "POST" });
        const data = await res.json();
        setLinkedProfiles(p => [...p, { ...data, target_profiles: profile }]);
      }
    } catch { /* silent */ }
    setTogglingId(null);
  }

  // ── CONDITIONS ──
  async function fetchConditions() {
    setCondLoading(true);
    try {
      const data = await (await fetch(`${API}/catalog/items/${id}/conditions`)).json();
      setConditions(data);
      setCondForm({
        conditions_vente:     data.conditions_vente     ?? "",
        acompte_percent:      data.acompte_percent?.toString() ?? "",
        delai_livraison:      data.delai_livraison      ?? "",
        politique_annulation: data.politique_annulation ?? "",
      });
    } catch { /* silent */ }
    setCondLoading(false);
  }

  async function saveConditions() {
    setCondSaving(true);
    try {
      await fetch(`${API}/catalog/items/${id}/conditions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conditions_vente:     condForm.conditions_vente     || null,
          acompte_percent:      condForm.acompte_percent ? parseFloat(condForm.acompte_percent) : null,
          delai_livraison:      condForm.delai_livraison      || null,
          politique_annulation: condForm.politique_annulation || null,
        }),
      });
      alert("✅ Conditions enregistrées avec succès !");
    } catch {
      alert("❌ Erreur lors de l'enregistrement.");
    }
    setCondSaving(false);
  }
  async function fetchPositionnement() {
    try {
      const data = await (await fetch(`${API}/catalog/items/${id}/positionnement`)).json();
      setPosForm({
        positioning:  data.positioning  ?? "",
        tone:         data.tone         ?? "",
        keywords:     data.keywords     ?? [],
        city:         data.city         ?? "",
        neighborhood: data.neighborhood ?? "",
        nearby_poi:   data.nearby_poi   ?? "",
      });
    } catch { /* silent */ }
  }
  async function fetchCompleteness() {
    try {
      const data = await (await fetch(`${API}/catalog/items/${id}/completeness`)).json();
      setCompleteness(data);
    } catch { /* silent */ }
  }
  async function fetchMandatoryCheck() {
    try {
      const data = await (await fetch(`${API}/catalog/items/${id}/mandatory-check`)).json();
      setMandatoryCheck(data);
    } catch { /* silent */ }
  }
  async function savePositionnement() {
    setPosSaving(true);
    try {
      await fetch(`${API}/catalog/items/${id}/positionnement`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positioning:  posForm.positioning  || null,
          tone:         posForm.tone         || null,
          keywords:     posForm.keywords.length > 0 ? posForm.keywords : null,
          city:         posForm.city         || null,
          neighborhood: posForm.neighborhood || null,
          nearby_poi:   posForm.nearby_poi   || null,
        }),
      });
      alert("✅ Positionnement enregistré !");
    } catch {
      alert("❌ Erreur lors de l'enregistrement.");
    }
    setPosSaving(false);
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <Skeleton />;
  if (!item)   return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p className="text-gray-500 mb-4">Offre introuvable</p>
      <button onClick={() => router.push("/catalog")} className="text-[#7C4DFF] text-sm hover:underline">← Retour au catalogue</button>
    </div>
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "infos",      label: "Infos" },
    { key: "variantes",  label: `Variantes${variants.length > 0 ? ` (${variants.length})` : ""}` },
    { key: "options",    label: `Options${options.length > 0 ? ` (${options.length})` : ""}` },
    { key: "cible",      label: `Cible${linkedProfiles.length > 0 ? ` (${linkedProfiles.length})` : ""}` },
    { key: "conditions", label: "Conditions" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111111]">

      {/* ── LIGHTBOX ── */}
      {lightbox && images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button onClick={() => setLightbox(false)} className="absolute top-5 right-5 text-white/70 hover:text-white"><X size={28} /></button>
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setSelectedIdx(i => (i - 1 + images.length) % images.length); }} className="absolute left-5 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition"><ChevronLeft size={32} /></button>
              <button onClick={(e) => { e.stopPropagation(); setSelectedIdx(i => (i + 1) % images.length); }} className="absolute right-5 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition"><ChevronRight size={32} /></button>
            </>
          )}
          <img src={images[selectedIdx]} alt={item.title_fr} className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
          <div className="absolute bottom-5 text-white/50 text-sm">{selectedIdx + 1} / {images.length}</div>
        </div>
      )}

      <div className="w-full px-6 py-8">

        {/* ── BREADCRUMB ── */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <button onClick={() => router.push("/catalog")} className="flex items-center gap-1.5 hover:text-[#7C4DFF] transition">
            <ArrowLeft size={15} />Catalogue
          </button>
          <span>/</span>
          <span className="text-gray-600 dark:text-gray-300 font-medium line-clamp-1 max-w-xs">{item.title_fr}</span>
        </div>

        {/* ── MAIN LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-10">

          {/* LEFT: GALLERY */}
          <div className="lg:col-span-3">
            <div className="relative h-[460px] rounded-2xl overflow-hidden bg-gray-200 dark:bg-[#2A2A2A] cursor-zoom-in group" onClick={() => images.length > 0 && setLightbox(true)}>
              {images.length > 0 ? (
                <>
                  <img src={images[selectedIdx]} alt={item.title_fr} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition bg-white/20 backdrop-blur-sm rounded-full p-3"><ZoomIn size={22} className="text-white" /></div>
                  </div>
                  {images.length > 1 && <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">{selectedIdx + 1} / {images.length}</div>}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Aucune image</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 mt-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <img key={i} src={img} alt="" onClick={() => setSelectedIdx(i)}
                    className={`h-20 w-28 flex-shrink-0 object-cover rounded-xl cursor-pointer border-2 transition-all duration-150 ${selectedIdx === i ? "border-[#7C4DFF] scale-95 shadow-lg shadow-violet-200 dark:shadow-none" : "border-transparent hover:border-gray-300 dark:hover:border-white/20 opacity-70 hover:opacity-100"}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: STICKY SIDEBAR */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-6 space-y-5">
              <div>
                {item.category && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-3 py-1 rounded-full mb-3">
                    <Tag size={11} />{item.category}
                  </span>
                )}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{item.title_fr}</h1>
              </div>
              {/* COMPLETENESS SCORE */}
{completeness !== null && (
  <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-white/5 p-4">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Complétude</p>
      <span className={`text-sm font-bold ${
        completeness.score >= 80 ? "text-green-600" :
        completeness.score >= 50 ? "text-amber-500" :
        "text-red-500"
      }`}>{completeness.score}%</span>
    </div>
    <div className="w-full bg-gray-100 dark:bg-[#2A2A2A] rounded-full h-2 mb-3">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${
          completeness.score >= 80 ? "bg-green-500" :
          completeness.score >= 50 ? "bg-amber-500" :
          "bg-red-500"
        }`}
        style={{ width: `${completeness.score}%` }}
      />
    </div>
    <div className="grid grid-cols-3 gap-1">
      {Object.entries(completeness.details).map(([key, val]) => (
        <div key={key} className={`flex items-center gap-1 text-xs ${val ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
          <span>{val ? "✓" : "○"}</span>
          <span className="truncate">{
            key === "title_fr"    ? "Titre" :
            key === "description" ? "Desc." :
            key === "price"       ? "Prix" :
            key === "image"       ? "Image" :
            key === "category"    ? "Catég." :
            key === "positioning" ? "Posit." :
            key === "keywords"    ? "Mots-clés" :
            key === "variants"    ? "Variants" :
            "Profils"
          }</span>
        </div>
      ))}
    </div>
  </div>
)}
{/* MANDATORY CHECK */}
{mandatoryCheck && !mandatoryCheck.complete && mandatoryCheck.missing.length > 0 && (
  <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800/30 p-4">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-red-500 text-sm">⚠️</span>
      <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
        Champs obligatoires manquants
      </p>
    </div>
    <div className="space-y-1">
      {mandatoryCheck.missing.map((field, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400">
          <span>○</span>
          <span>{
            field === "title_fr"        ? "Titre FR" :
            field === "description_fr"  ? "Description FR" :
            field === "price"           ? "Prix" :
            field === "image"           ? "Image principale" :
            field === "category"        ? "Catégorie" :
            field === "positioning"     ? "Positionnement" :
            field === "keywords"        ? "Mots-clés" :
            field === "variants"        ? "Variantes" :
            field === "profiles"        ? "Profils cibles" :
            field === "city"            ? "Ville" :
            field === "conditions_vente"? "Conditions de vente" :
            field === "delai_livraison" ? "Délai de livraison" :
            field
          }</span>
        </div>
      ))}
    </div>
  </div>
)}
              <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-white/5 p-5">
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-medium">Prix</p>
                <p className="text-3xl font-bold text-[#7C4DFF]">{formatPrice(item.price, item.currency)}</p>
                {item.state && (
                  <span className={`inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${
                    item.state === "ready"    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                    item.state === "draft"    ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {item.state === "ready" ? "✓ Prêt" : item.state === "draft" ? "Brouillon" : "Archivé"}
                  </span>
                )}
              </div>

              {linkedProfiles.length > 0 && (
                <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-white/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={14} className="text-[#7C4DFF]" />
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cibles</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {linkedProfiles.map(l => (
                      <span key={l.id} className="text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2.5 py-1 rounded-full">
                        {PROFILE_ICONS[l.target_profiles?.name] ?? "🎯"} {l.target_profiles?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/5 px-3 py-1.5 rounded-full">
                  <MapPin size={12} className="text-[#7C4DFF]" />Tunisie
                </div>
                {item.created_at && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/5 px-3 py-1.5 rounded-full">
                    <Calendar size={12} className="text-[#7C4DFF]" />
                    {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                )}
              </div>

              <button onClick={copyLink} className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[#7C4DFF] border border-gray-200 dark:border-white/10 hover:border-[#7C4DFF]/30 rounded-xl py-2.5 transition">
                <Share2 size={15} />{copied ? "Lien copié !" : "Partager cette offre"}
              </button>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100 dark:border-white/5 px-2 pt-2">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-medium rounded-t-xl transition-all ${
                  activeTab === tab.key
                    ? "bg-[#7C4DFF] text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* ── INFOS ── */}
            {/* ── INFOS ── */}
{activeTab === "infos" && (
  <div className="space-y-6">
    {/* Description */}
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Description</p>
      {item.description_fr
        ? <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{item.description_fr}</p>
        : <p className="text-sm text-gray-400 italic">Aucune description renseignée.</p>
      }
    </div>

    {/* Positionnement & Ton */}
    <div className="border-t border-gray-100 dark:border-white/5 pt-5">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Positionnement & Ton</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Positionnement</label>
          <select
            className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
            value={posForm.positioning}
            onChange={e => setPosForm(p => ({ ...p, positioning: e.target.value }))}
          >
            <option value="">-- Choisir --</option>
            <option value="luxe">Luxe</option>
            <option value="familial">Familial</option>
            <option value="investissement">Investissement</option>
            <option value="eco">Éco / Abordable</option>
            <option value="professionnel">Professionnel</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Ton souhaité</label>
          <select
            className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
            value={posForm.tone}
            onChange={e => setPosForm(p => ({ ...p, tone: e.target.value }))}
          >
            <option value="">-- Choisir --</option>
            <option value="inspirationnel">Inspirationnel</option>
            <option value="sérieux">Sérieux</option>
            <option value="fun">Fun</option>
            <option value="professionnel">Professionnel</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>
    </div>

    {/* Mots-clés */}
    <div className="border-t border-gray-100 dark:border-white/5 pt-5">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Mots-clés métier</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {posForm.keywords.map((kw, i) => (
          <span key={i} className="flex items-center gap-1.5 text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-3 py-1 rounded-full">
            {kw}
            <button onClick={() => setPosForm(p => ({ ...p, keywords: p.keywords.filter((_, j) => j !== i) }))} className="hover:text-red-500 transition">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 text-sm border border-dashed border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
          placeholder="Ex: vue mer, centre-ville, piscine…"
          value={newKeyword}
          onChange={e => setNewKeyword(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && newKeyword.trim()) {
              setPosForm(p => ({ ...p, keywords: [...p.keywords, newKeyword.trim()] }));
              setNewKeyword("");
            }
          }}
        />
        <button
          onClick={() => {
            if (newKeyword.trim()) {
              setPosForm(p => ({ ...p, keywords: [...p.keywords, newKeyword.trim()] }));
              setNewKeyword("");
            }
          }}
          className="flex items-center gap-1.5 bg-[#7C4DFF] hover:bg-[#6A3DF0] text-white px-4 py-2 rounded-xl text-sm transition active:scale-95"
        >
          <Plus size={15} /> Ajouter
        </button>
      </div>
    </div>

    {/* Zone géographique */}
    <div className="border-t border-gray-100 dark:border-white/5 pt-5">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Zone géographique</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Ville</label>
          <input type="text" className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30" placeholder="Ex: Tunis, Sfax…" value={posForm.city} onChange={e => setPosForm(p => ({ ...p, city: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Quartier</label>
          <input type="text" className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30" placeholder="Ex: La Marsa, Lac 2…" value={posForm.neighborhood} onChange={e => setPosForm(p => ({ ...p, neighborhood: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">À proximité</label>
          <input type="text" className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30" placeholder="Ex: École, Plage, Metro…" value={posForm.nearby_poi} onChange={e => setPosForm(p => ({ ...p, nearby_poi: e.target.value }))} />
        </div>
      </div>
    </div>

    {/* Save button */}
    <button
      onClick={savePositionnement}
      disabled={posSaving}
      className="flex items-center gap-2 bg-[#7C4DFF] hover:bg-[#6A3DF0] disabled:opacity-40 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition active:scale-95"
    >
      {posSaving ? "Enregistrement..." : "Enregistrer"}
    </button>
  </div>
)}

            {/* ── VARIANTES ── */}
            {activeTab === "variantes" && (
              <div>
                <p className="text-xs text-gray-400 mb-4">Surface, étage, couleur, durée, taille…</p>
                {varLoading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-[#2A2A2A] rounded-xl animate-pulse" />)}</div>
                ) : variants.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Aucune variante pour le moment.</p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {variants.map(v => (
                      <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#2A2A2A] border border-gray-100 dark:border-white/5 group">
                        {editingVar === v.id ? (
                          <>
                            <input className="flex-1 text-sm border border-gray-300 dark:border-white/10 rounded-lg px-3 py-1.5 bg-white dark:bg-[#1A1A1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/40" value={editVarName} onChange={e => setEditVarName(e.target.value)} />
                            <input className="w-28 text-sm border border-gray-300 dark:border-white/10 rounded-lg px-3 py-1.5 bg-white dark:bg-[#1A1A1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/40" value={editVarPrice} onChange={e => setEditVarPrice(e.target.value)} type="number" placeholder="Prix" />
                            <button onClick={() => saveVariant(v.id)} className="text-green-600 hover:text-green-700"><Check size={16} /></button>
                            <button onClick={() => setEditingVar(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm dark:text-white">{v.name}</span>
                            {v.price !== null && <span className="text-sm font-semibold text-[#7C4DFF]">{formatPrice(v.price)}</span>}
                            <button onClick={() => { setEditingVar(v.id); setEditVarName(v.name); setEditVarPrice(v.price?.toString() ?? ""); }} className="text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition"><Pencil size={14} /></button>
                            <button onClick={() => deleteVariant(v.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <input className="flex-1 text-sm border border-dashed border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30" value={newVarName} onChange={e => setNewVarName(e.target.value)} placeholder="Ex: Studio 35m², Chambre Deluxe…" onKeyDown={e => e.key === "Enter" && addVariant()} />
                  <input className="w-28 text-sm border border-dashed border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30" value={newVarPrice} onChange={e => setNewVarPrice(e.target.value)} placeholder="Prix" type="number" />
                  <button onClick={addVariant} disabled={!newVarName.trim()} className="flex items-center gap-1.5 bg-[#7C4DFF] hover:bg-[#6A3DF0] disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm transition active:scale-95">
                    <Plus size={15} /> Ajouter
                  </button>
                </div>
              </div>
            )}

            {/* ── OPTIONS ── */}
            {activeTab === "options" && (
              <div>
                <p className="text-xs text-gray-400 mb-4">Parking, petit-déjeuner, assurance, livraison…</p>
                {optLoading ? (
                  <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-[#2A2A2A] rounded-xl animate-pulse" />)}</div>
                ) : options.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Aucune option pour le moment.</p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {options.map(o => (
                      <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#2A2A2A] border border-gray-100 dark:border-white/5 group">
                        {editingOpt === o.id ? (
                          <>
                            <input className="flex-1 text-sm border border-gray-300 dark:border-white/10 rounded-lg px-3 py-1.5 bg-white dark:bg-[#1A1A1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/40" value={editOptName} onChange={e => setEditOptName(e.target.value)} />
                            <input className="w-28 text-sm border border-gray-300 dark:border-white/10 rounded-lg px-3 py-1.5 bg-white dark:bg-[#1A1A1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/40" value={editOptPrice} onChange={e => setEditOptPrice(e.target.value)} type="number" placeholder="Prix" />
                            <button onClick={() => saveOption(o.id)} className="text-green-600 hover:text-green-700"><Check size={16} /></button>
                            <button onClick={() => setEditingOpt(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm dark:text-white">{o.name}</span>
                            {o.price !== null && <span className="text-sm font-semibold text-[#7C4DFF]">{formatPrice(o.price)}</span>}
                            <button onClick={() => { setEditingOpt(o.id); setEditOptName(o.name); setEditOptPrice(o.price?.toString() ?? ""); }} className="text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition"><Pencil size={14} /></button>
                            <button onClick={() => deleteOption(o.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <input className="flex-1 text-sm border border-dashed border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30" value={newOptName} onChange={e => setNewOptName(e.target.value)} placeholder="Ex: Parking, Petit-déjeuner…" onKeyDown={e => e.key === "Enter" && addOption()} />
                  <input className="w-28 text-sm border border-dashed border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30" value={newOptPrice} onChange={e => setNewOptPrice(e.target.value)} placeholder="Prix" type="number" />
                  <button onClick={addOption} disabled={!newOptName.trim()} className="flex items-center gap-1.5 bg-[#7C4DFF] hover:bg-[#6A3DF0] disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm transition active:scale-95">
                    <Plus size={15} /> Ajouter
                  </button>
                </div>
              </div>
            )}

            {/* ── CIBLE ── */}
            {activeTab === "cible" && (
              <div>
                <p className="text-xs text-gray-400 mb-5">
                  Sélectionnez les profils de clients ciblés par cette offre. L'agent IA utilisera ces profils pour adapter le contenu marketing.
                </p>
                {cibleLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-[#2A2A2A] rounded-xl animate-pulse" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {allProfiles.map(profile => {
                      const isLinked   = linkedProfiles.some(l => l.target_profile_id === profile.id);
                      const isToggling = togglingId === profile.id;
                      return (
                        <button
                          key={profile.id}
                          onClick={() => toggleProfile(profile)}
                          disabled={isToggling}
                          className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                            isLinked
                              ? "border-[#7C4DFF] bg-violet-50 dark:bg-violet-900/20"
                              : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#2A2A2A] hover:border-[#7C4DFF]/40"
                          } ${isToggling ? "opacity-60 cursor-wait" : "cursor-pointer active:scale-95"}`}
                        >
                          {isLinked && (
                            <div className="absolute top-3 right-3 w-5 h-5 bg-[#7C4DFF] rounded-full flex items-center justify-center">
                              <Check size={11} className="text-white" />
                            </div>
                          )}
                          <span className="text-2xl">{PROFILE_ICONS[profile.name] ?? "🎯"}</span>
                          <div>
                            <p className={`text-sm font-semibold ${isLinked ? "text-[#7C4DFF]" : "text-gray-800 dark:text-white"}`}>
                              {profile.name}
                            </p>
                            {profile.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                                {profile.description}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {linkedProfiles.length > 0 && (
                  <p className="text-xs text-gray-400 mt-4 text-center">
                    {linkedProfiles.length} profil{linkedProfiles.length > 1 ? "s" : ""} sélectionné{linkedProfiles.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}

            {/* ── CONDITIONS ── */}
            {activeTab === "conditions" && (
              <div>
                <p className="text-xs text-gray-400 mb-5">
                  Conditions commerciales, acompte, délais et politique d'annulation.
                </p>
                {condLoading ? (
                  <div className="space-y-3">
                    {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-[#2A2A2A] rounded-xl animate-pulse" />)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                        Conditions générales de vente
                      </label>
                      <textarea
                        rows={3}
                        className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 resize-none"
                        placeholder="Ex: Vente sous conditions suspensives, conformément à la loi..."
                        value={condForm.conditions_vente}
                        onChange={e => setCondForm(p => ({ ...p, conditions_vente: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                          Acompte requis (%)
                        </label>
                        <input
                          type="number" min={0} max={100}
                          className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
                          placeholder="Ex: 10"
                          value={condForm.acompte_percent}
                          onChange={e => setCondForm(p => ({ ...p, acompte_percent: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                          Délai de livraison
                        </label>
                        <input
                          type="text"
                          className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30"
                          placeholder="Ex: 6 mois, Immédiat, Sur commande..."
                          value={condForm.delai_livraison}
                          onChange={e => setCondForm(p => ({ ...p, delai_livraison: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                        Politique d'annulation
                      </label>
                      <textarea
                        rows={2}
                        className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/30 resize-none"
                        placeholder="Ex: Annulation gratuite avant 30 jours, acompte non remboursable après..."
                        value={condForm.politique_annulation}
                        onChange={e => setCondForm(p => ({ ...p, politique_annulation: e.target.value }))}
                      />
                    </div>
                    <button
                      onClick={saveConditions}
                      disabled={condSaving}
                      className="flex items-center gap-2 bg-[#7C4DFF] hover:bg-[#6A3DF0] disabled:opacity-40 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition active:scale-95"
                    >
                      {condSaving ? "Enregistrement..." : "Enregistrer les conditions"}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
