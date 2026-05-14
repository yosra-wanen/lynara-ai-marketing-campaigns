'use client';

import { Suspense } from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import {
  Plus, Search, Trash2, Send, Image,
  ChevronDown, Loader2, Camera, Sparkles, Clock, XCircle, RefreshCw,
} from 'lucide-react';
import {
  fetchDrafts, fetchDraft, fetchAccounts, createDraft, updateDraft, deleteDraft,
  publishDraft, addMedia, removeMedia, scheduleDraft, cancelJob, fetchJobs,
} from '@/lib/api/instagram';
import type { InstagramDraft, InstagramAccount, DraftStatus, ContentType, SourceMode, ScheduleJob } from '@/lib/api/instagram';
import AiCaptionPanel from '@/components/instagram/AiCaptionPanel';
import AiImageModal from '@/components/instagram/AiImageModal';
import ScheduleModal from '@/components/instagram/ScheduleModal';
import CataloguePickerModal, { type CatalogueItem } from '@/components/instagram/CataloguePickerModal';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<DraftStatus, { label: string; className: string; gradient?: string }> = {
  draft:     { label: 'Brouillon', className: 'text-gray-500 dark:text-gray-400',   gradient: 'linear-gradient(120deg,#e5e7eb,#f3f4f6)' },
  ready:     { label: 'Prêt',      className: 'text-blue-700 dark:text-blue-300',    gradient: 'linear-gradient(120deg,#dbeafe,#eff6ff)' },
  scheduled: { label: 'Planifié',  className: 'text-amber-700 dark:text-amber-300',  gradient: 'linear-gradient(120deg,#fef3c7,#fffbeb)' },
  published: { label: 'Publié',    className: 'text-emerald-700 dark:text-emerald-300', gradient: 'linear-gradient(120deg,#d1fae5,#ecfdf5)' },
  failed:    { label: 'Échoué',    className: 'text-red-600 dark:text-red-400',      gradient: 'linear-gradient(120deg,#fee2e2,#fff1f2)' },
  cancelled: { label: 'Annulé',    className: 'text-gray-400 dark:text-gray-500',    gradient: 'linear-gradient(120deg,#f3f4f6,#f9fafb)' },
};

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'post',      label: 'Post' },
  { value: 'carousel',  label: 'Carousel' },
  { value: 'story',     label: 'Story' },
  { value: 'reel',      label: 'Reel' },
];

const SOURCE_MODES: { value: SourceMode; label: string }[] = [
  { value: 'libre',   label: 'Mode libre' },
  { value: 'catalog', label: 'Depuis catalogue' },
];

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ── Page ─────────────────────────────────────────────────────────────────────

function StudioPageContent() {
  const { companyId, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const initialDraftId = searchParams.get('draft_id');

  // List state
  const [drafts, setDrafts]           = useState<InstagramDraft[]>([]);
  const [total, setTotal]             = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage]               = useState(1);
  const PAGE_SIZE = 15;

  // Editor state
  const [selected, setSelected]       = useState<InstagramDraft | null>(null);
  const [accounts, setAccounts]       = useState<InstagramAccount[]>([]);
  const [caption, setCaption]         = useState('');
  const [contentType, setContentType] = useState<ContentType>('post');
  const [sourceMode, setSourceMode]   = useState<SourceMode>('libre');
  const [accountId, setAccountId]     = useState('');
  const [saving, setSaving]           = useState(false);
  const [publishing, setPublishing]   = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [mediaUrl, setMediaUrl]         = useState('');
  const [addingMedia, setAddingMedia]   = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const [cataloguePickerOpen, setCataloguePickerOpen] = useState(false);

  // Schedule state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [activeJob, setActiveJob]                 = useState<ScheduleJob | null>(null);
  const [scheduling, setScheduling]               = useState(false);
  const [cancelling, setCancelling]               = useState(false);
  const [checkingStatus, setCheckingStatus]       = useState(false);

  // AI panel/modal state
  const [aiCaptionOpen, setAiCaptionOpen] = useState(false);
  const [aiImageOpen, setAiImageOpen]     = useState(false);

  const captionRef = useRef<HTMLTextAreaElement>(null);

  // ── Load list ─────────────────────────────────────────────────────────────

  const loadDrafts = useCallback(async () => {
    if (!companyId) return;
    setListLoading(true);
    try {
      const res = await fetchDrafts({
        company_id: companyId,
        status: statusFilter || undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setDrafts(Array.isArray(res?.data) ? res.data : []);
      setTotal(res?.total ?? 0);
    } catch {
      toast.error('Erreur chargement brouillons');
    } finally {
      setListLoading(false);
    }
  }, [companyId, statusFilter, page]);

  const loadAccounts = useCallback(async () => {
    if (!companyId) return;
    try {
      const accts = await fetchAccounts(companyId);
      setAccounts(Array.isArray(accts) ? accts.filter((a) => a.is_connected) : []);
    } catch {
      // ignore
    }
  }, [companyId]);

  useEffect(() => {
    if (!authLoading && companyId) {
      loadDrafts();
      loadAccounts();
    }
  }, [companyId, authLoading, loadDrafts, loadAccounts]);

  // Auto-select draft from URL param (e.g. coming from calendar)
  useEffect(() => {
    if (!initialDraftId || !companyId || authLoading) return;
    fetchDraft(initialDraftId).then(openDraft).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDraftId, companyId, authLoading]);

  // Load active job whenever a scheduled draft is selected.
  // If the scheduled_time has already passed (server was down), auto-refresh
  // the draft — the startup catch-up may have already published it.
  useEffect(() => {
    if (!selected || selected.status !== 'scheduled' || !companyId) {
      setActiveJob(null);
      return;
    }
    fetchJobs({ company_id: companyId, draft_id: selected.id, status: 'pending' })
      .then(async (jobs) => {
        const job = jobs[0] ?? null;
        setActiveJob(job);

        // No pending job, or scheduled_time is already in the past
        const isPast = job ? new Date(job.scheduled_time) <= new Date() : true;
        if (isPast) {
          const refreshed = await fetchDraft(selected.id).catch(() => null);
          if (refreshed && refreshed.status !== selected.status) {
            setSelected(refreshed);
            setCaption(refreshed.caption ?? '');
            setDrafts((prev) => prev.map((d) => d.id === refreshed.id ? refreshed : d));
            if (refreshed.status === 'published') {
              toast.success('Post publié automatiquement !');
            }
          }
        }
      })
      .catch(() => setActiveJob(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, selected?.status, companyId]);

  // ── Select draft → populate editor ───────────────────────────────────────

  function openDraft(d: InstagramDraft) {
    setSelected(d);
    setCaption(d.caption ?? '');
    setContentType(d.content_type);
    setSourceMode(d.source_mode);
    setAccountId(d.account_id ?? '');
    setMediaUrl('');
  }

  // ── Create new draft ──────────────────────────────────────────────────────

  async function handleCreate(mode: SourceMode) {
    if (!companyId) return;
    try {
      const draft = await createDraft({ company_id: companyId, source_mode: mode });
      setDrafts((prev) => [draft, ...prev]);
      setTotal((t) => t + 1);
      openDraft(draft);
      toast.success('Brouillon créé');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur création');
    }
  }

  // ── Create draft from catalogue item ─────────────────────────────────────

  async function handleCatalogueSelect(item: CatalogueItem) {
    if (!companyId) return;
    try {
      const parts = [
        item.title_fr,
        item.description_fr?.trim() || '',
        item.price != null ? `💰 ${item.price.toLocaleString('fr-FR')} ${item.currency ?? 'TND'}` : '',
      ].filter(Boolean);
      const caption = parts.join('\n\n');

      const draft = await createDraft({
        company_id: companyId,
        source_mode: 'catalog',
        content_type: 'post',
        caption,
        catalog_item_id: item.id,
      });

      // Attach catalogue image as first media item
      if (item.image_url) {
        const media = await addMedia(draft.id, {
          url: item.image_url,
          media_type: 'image',
          order_index: 0,
        });
        draft.media_items = [media];
      }

      setDrafts((prev) => [draft, ...prev]);
      setTotal((t) => t + 1);
      openDraft(draft);
      toast.success('Brouillon créé depuis le catalogue');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur création depuis catalogue');
    }
  }

  // ── Delete a media item ───────────────────────────────────────────────────

  async function handleDeleteMedia(mediaItemId: string) {
    if (!selected) return;
    if (!confirm('Supprimer ce média ?')) return;
    setDeletingMediaId(mediaItemId);
    try {
      await removeMedia(selected.id, mediaItemId);
      setSelected((prev) =>
        prev ? { ...prev, media_items: (prev.media_items ?? []).filter((m) => m.id !== mediaItemId) } : prev
      );
      toast.success('Média supprimé');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur suppression média');
    } finally {
      setDeletingMediaId(null);
    }
  }

  // ── Auto-save caption / meta on blur ──────────────────────────────────────

  async function saveChanges() {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await updateDraft(selected.id, {
        caption,
        content_type: contentType,
        source_mode: sourceMode,
        account_id: accountId || undefined,
      });
      setSelected(updated);
      setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  async function handlePublish() {
    if (!selected) return;
    setPublishing(true);
    try {
      await saveChanges();
      const updated = await publishDraft(selected.id);
      setSelected(updated);
      setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      toast.success('Publié avec succès !');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur publication');
    } finally {
      setPublishing(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!selected) return;
    if (!confirm('Supprimer ce brouillon ?')) return;
    setDeleting(true);
    try {
      await deleteDraft(selected.id);
      setDrafts((prev) => prev.filter((d) => d.id !== selected.id));
      setTotal((t) => t - 1);
      setSelected(null);
      toast.success('Brouillon supprimé');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur suppression');
    } finally {
      setDeleting(false);
    }
  }

  // ── Schedule ──────────────────────────────────────────────────────────────

  async function handleSchedule(scheduledTime: string) {
    if (!selected) return;
    setScheduling(true);
    try {
      await saveChanges();
      const job = await scheduleDraft(selected.id, scheduledTime);
      setActiveJob(job);
      setSelected((prev) => prev ? { ...prev, status: 'scheduled' } : prev);
      setDrafts((prev) => prev.map((d) => d.id === selected.id ? { ...d, status: 'scheduled' } : d));
      toast.success('Publication planifiée !');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur planification');
      throw e; // let ScheduleModal keep loading=true if needed
    } finally {
      setScheduling(false);
    }
  }

  async function handleCheckStatus() {
    if (!selected || !companyId) return;
    setCheckingStatus(true);
    try {
      const refreshed = await fetchDraft(selected.id);
      setSelected(refreshed);
      setCaption(refreshed.caption ?? '');
      setDrafts((prev) => prev.map((d) => d.id === refreshed.id ? refreshed : d));
      if (refreshed.status === 'published') {
        setActiveJob(null);
        toast.success('Post publié !');
      } else {
        const jobs = await fetchJobs({ company_id: companyId, draft_id: refreshed.id, status: 'pending' });
        setActiveJob(jobs[0] ?? null);
        toast.success('Statut mis à jour');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur vérification');
    } finally {
      setCheckingStatus(false);
    }
  }

  async function handleCancelSchedule() {
    if (!activeJob) return;
    if (!confirm('Annuler la planification de ce post ?')) return;
    setCancelling(true);
    try {
      await cancelJob(activeJob.id);
      setActiveJob(null);
      setSelected((prev) => prev ? { ...prev, status: 'draft' } : prev);
      setDrafts((prev) => prev.map((d) => d.id === selected?.id ? { ...d, status: 'draft' } : d));
      toast.success('Planification annulée');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur annulation');
    } finally {
      setCancelling(false);
    }
  }

  // ── Add media ─────────────────────────────────────────────────────────────

  async function handleAddMedia(url?: string) {
    const targetUrl = url ?? mediaUrl;
    if (!selected || !targetUrl.trim()) return;
    setAddingMedia(true);
    try {
      const media = await addMedia(selected.id, {
        url: targetUrl.trim(),
        media_type: 'image',
        order_index: selected.media_items?.length ?? 0,
      });
      setSelected((prev) =>
        prev ? { ...prev, media_items: [...(prev.media_items ?? []), media] } : prev
      );
      setMediaUrl('');
      toast.success('Média ajouté');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur ajout média');
    } finally {
      setAddingMedia(false);
    }
  }

  // ── AI caption apply ──────────────────────────────────────────────────────

  function handleApplyCaption(newCaption: string, hashtags: string[], cta: string) {
    const full = `${newCaption}\n\n${hashtags.join(' ')}\n\n${cta}`;
    setCaption(full);
    if (captionRef.current) captionRef.current.focus();
  }

  // ── Filtered list (client-side search) ───────────────────────────────────

  const filtered = search.trim()
    ? drafts.filter((d) =>
        (d.caption ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : drafts;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex gap-0 h-[calc(100vh-88px)] -mx-6 -mt-6 overflow-hidden">

        {/* ── Left: Draft list ─────────────────────────────────────────────── */}
        <div className="w-72 shrink-0 flex flex-col border-r border-gray-100 dark:border-[#262626] bg-white dark:bg-[#0A0A0A]">

          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-[#262626] space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Studio</h2>
              <div className="flex gap-1">
                {SOURCE_MODES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => m.value === 'catalog' ? setCataloguePickerOpen(true) : handleCreate(m.value)}
                    className="text-xs px-2 py-1 rounded-lg bg-[#7C4DFF] text-white hover:bg-[#6B3FE0] transition-colors"
                  >
                    + {m.label === 'Mode libre' ? 'Libre' : 'Catalogue'}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-[#262626] rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-[#7C4DFF] dark:text-white"
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full py-1.5 pl-3 pr-8 text-xs border border-gray-200 dark:border-[#262626] rounded-lg bg-white dark:bg-[#111] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#7C4DFF] appearance-none"
              >
                <option value="">Tous les statuts</option>
                {Object.entries(STATUS_BADGE).map(([v, { label }]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {listLoading ? (
              <div className="p-3 space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-[#111] animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8E0FF] dark:bg-[#A079FF]/20 text-[#7C4DFF]">
                  <Camera size={22} />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucun brouillon</p>
                <button
                  onClick={() => handleCreate('libre')}
                  className="flex items-center gap-1.5 text-xs text-[#7C4DFF] hover:underline"
                >
                  <Plus size={14} /> Créer
                </button>
              </div>
            ) : (
              <ul className="p-2 space-y-1.5">
                {filtered.map((d, i) => {
                  const badge = STATUS_BADGE[d.status] ?? STATUS_BADGE.draft;
                  const isSelected = selected?.id === d.id;
                  return (
                    <li key={d.id ?? String(i)}>
                      <button
                        onClick={() => openDraft(d)}
                        className={`w-full text-left rounded-xl px-3 py-3 transition-all group ${
                          isSelected
                            ? 'bg-[#7C4DFF]/10 border border-[#7C4DFF]/40 shadow-sm'
                            : 'hover:bg-gray-50 dark:hover:bg-[#1A1A1A] border border-transparent hover:border-gray-200 dark:hover:border-[#262626]'
                        }`}
                      >
                        <p className={`text-xs font-semibold truncate leading-snug ${isSelected ? 'text-[#7C4DFF]' : 'text-gray-900 dark:text-white'}`}>
                          {d.caption ? d.caption.slice(0, 52) + (d.caption.length > 52 ? '…' : '') : 'Sans légende'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.className}`}
                            style={{ background: badge.gradient }}
                          >
                            {badge.label}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 capitalize font-medium">
                            {d.content_type}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-gray-100 dark:border-[#262626] text-xs text-gray-500">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-[#1A1A1A] disabled:opacity-40"
              >
                ←
              </button>
              <span>{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-[#1A1A1A] disabled:opacity-40"
              >
                →
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Editor panel ──────────────────────────────────────────── */}
        {selected ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-black">

            {/* Editor header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-[#262626] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[selected.status].className}`}
                  style={{ background: STATUS_BADGE[selected.status].gradient }}
                >
                  {STATUS_BADGE[selected.status].label}
                </span>
                {selected.status === 'scheduled' && activeJob && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 truncate">
                    <Clock size={12} />
                    {new Date(activeJob.scheduled_time).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                {selected.status !== 'scheduled' && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Modifié {fmt(selected.updated_at ?? selected.created_at)}
                  </span>
                )}
                {saving && <Loader2 size={14} className="animate-spin text-gray-400" />}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Supprimer
                </button>

                {selected.status === 'scheduled' && (
                  <button
                    onClick={handleCheckStatus}
                    disabled={checkingStatus}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#262626] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1A1A1A] disabled:opacity-50 transition-colors"
                  >
                    {checkingStatus ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Vérifier le statut
                  </button>
                )}

                {selected.status === 'scheduled' ? (
                  <button
                    onClick={handleCancelSchedule}
                    disabled={cancelling || !activeJob}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-600 border border-amber-300 dark:border-amber-800 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 transition-colors"
                  >
                    {cancelling ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    Annuler planif.
                  </button>
                ) : (
                  <button
                    onClick={() => setScheduleModalOpen(true)}
                    disabled={scheduling || selected.status === 'published'}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-600 border border-amber-300 dark:border-amber-800 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 transition-colors"
                  >
                    {scheduling ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                    Planifier
                  </button>
                )}

                <button
                  onClick={handlePublish}
                  disabled={publishing || selected.status === 'published' || selected.status === 'scheduled'}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-[#7C4DFF] text-white rounded-lg hover:bg-[#6B3FE0] disabled:opacity-50 transition-colors"
                >
                  {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Publier
                </button>
              </div>
            </div>

            {/* Editor body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Past-schedule warning */}
              {selected.status === 'scheduled' && activeJob && new Date(activeJob.scheduled_time) <= new Date() && (
                <div className="flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                  <Clock size={16} className="shrink-0" />
                  <span className="flex-1">
                    La date de publication est passée. Le serveur publiera ce post au prochain redémarrage.
                  </span>
                  <button
                    onClick={handleCheckStatus}
                    disabled={checkingStatus}
                    className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 underline underline-offset-2 disabled:opacity-50"
                  >
                    {checkingStatus ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    Vérifier maintenant
                  </button>
                </div>
              )}

              {/* Meta row */}
              <div className="grid grid-cols-3 gap-4">
                {/* Account */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Compte Instagram
                  </label>
                  <div className="relative">
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      onBlur={saveChanges}
                      className="w-full py-2 pl-3 pr-8 text-sm border border-gray-200 dark:border-[#262626] rounded-xl bg-white dark:bg-[#111] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] appearance-none"
                    >
                      <option value="">Aucun compte</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>@{a.username}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Content type */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Type de contenu
                  </label>
                  <div className="flex gap-1 flex-wrap">
                    {CONTENT_TYPES.map((ct) => (
                      <button
                        key={ct.value}
                        onClick={() => { setContentType(ct.value); }}
                        onMouseUp={saveChanges}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          contentType === ct.value
                            ? 'bg-[#7C4DFF] text-white'
                            : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#262626]'
                        }`}
                      >
                        {ct.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Source mode */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Source
                  </label>
                  <div className="flex gap-1">
                    {SOURCE_MODES.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => { setSourceMode(m.value); }}
                        onMouseUp={saveChanges}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          sourceMode === m.value
                            ? 'bg-[#7C4DFF] text-white'
                            : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#262626]'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Légende</label>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] ${caption.length > 2200 ? 'text-red-500' : 'text-gray-400'}`}>
                      {caption.length} / 2200
                    </span>
                    <button
                      onClick={() => setAiCaptionOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs bg-gradient-to-r from-[#7C4DFF] to-[#A079FF] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                    >
                      <Sparkles size={12} />
                      Générer avec IA
                    </button>
                  </div>
                </div>
                <textarea
                  ref={captionRef}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  onBlur={saveChanges}
                  rows={8}
                  placeholder="Écrivez votre légende Instagram ici…"
                  className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-[#262626] rounded-xl bg-white dark:bg-[#111] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] resize-none"
                />
              </div>

              {/* Media */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Médias ({selected.media_items?.length ?? 0})
                  </label>
                  <button
                    onClick={() => setAiImageOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs bg-gradient-to-r from-[#7C4DFF] to-[#A079FF] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                  >
                    <Sparkles size={12} />
                    Générer image IA
                  </button>
                </div>

                {/* Media grid */}
                {(selected.media_items?.length ?? 0) > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {selected.media_items!.map((m, i) => (
                      <div key={m.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#262626]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.url}
                          alt={`Media ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded bg-black/60 text-white text-[10px] font-bold">
                          {i + 1}
                        </div>
                        <button
                          onClick={() => handleDeleteMedia(m.id)}
                          disabled={deletingMediaId === m.id}
                          className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded bg-red-500/90 hover:bg-red-600 text-white transition-colors disabled:opacity-60"
                          title="Supprimer ce média"
                        >
                          {deletingMediaId === m.id
                            ? <Loader2 size={10} className="animate-spin" />
                            : <XCircle size={10} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add media URL */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Image size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="URL de l'image ou vidéo"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-[#262626] rounded-xl bg-white dark:bg-[#111] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddMedia(); }}
                    />
                  </div>
                  <button
                    onClick={() => handleAddMedia()}
                    disabled={!mediaUrl.trim() || addingMedia}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#7C4DFF] text-white text-sm rounded-xl hover:bg-[#6B3FE0] disabled:opacity-50 transition-colors shrink-0"
                  >
                    {addingMedia ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Ajouter
                  </button>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                  Collez une URL publique d&apos;image, ou utilisez &quot;Générer image IA&quot; ci-dessus.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center bg-gray-50 dark:bg-[#0A0A0A]">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#E8E0FF] dark:bg-[#A079FF]/20 text-[#7C4DFF]">
              <Camera size={36} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Sélectionnez un brouillon</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Ou créez-en un nouveau pour commencer
              </p>
            </div>
            <div className="flex gap-2">
              {SOURCE_MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => m.value === 'catalog' ? setCataloguePickerOpen(true) : handleCreate(m.value)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#7C4DFF] text-white text-sm font-medium rounded-xl hover:bg-[#6B3FE0] transition-colors"
                >
                  <Plus size={16} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── AI Caption Panel (slide-in) ───────────────────────────────────── */}
      {selected && companyId && (
        <AiCaptionPanel
          open={aiCaptionOpen}
          onClose={() => setAiCaptionOpen(false)}
          companyId={companyId}
          draftId={selected.id}
          existingCaption={caption}
          onApply={handleApplyCaption}
        />
      )}

      {/* ── AI Image Modal ────────────────────────────────────────────────── */}
      {selected && companyId && (
        <AiImageModal
          open={aiImageOpen}
          onClose={() => setAiImageOpen(false)}
          companyId={companyId}
          draftId={selected.id}
          contentType={contentType}
          onApply={(url) => handleAddMedia(url)}
        />
      )}

      {/* ── Schedule Modal ────────────────────────────────────────────────── */}
      <ScheduleModal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSchedule={handleSchedule}
      />

      {/* ── Catalogue Picker Modal ────────────────────────────────────────── */}
      {companyId && (
        <CataloguePickerModal
          open={cataloguePickerOpen}
          onClose={() => setCataloguePickerOpen(false)}
          companyId={companyId}
          onSelect={handleCatalogueSelect}
        />
      )}
    </>
  );
}

export default function StudioPage() {
  return (
    <Suspense>
      <StudioPageContent />
    </Suspense>
  );
}
