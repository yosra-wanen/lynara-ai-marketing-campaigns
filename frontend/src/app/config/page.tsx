'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Bot, Plus, Eye, EyeOff, Check, X,
    PowerOff, ChevronLeft, AlertTriangle,
    MoreVertical, Trash2, Shield, KeyRound,
} from 'lucide-react';
import { Button } from '@/components';
import { ToastService } from '@/app/services/toast.service';
import { TranslationService } from '@/app/services/translation.service';

// ─── Types ────────────────────────────────────────────────────────────────────
type Provider = 'openai' | 'anthropic' | 'openrouter' | 'mistral' | 'gemini';

interface AiConfig {
    config_id: string;
    company_id: string;
    provider: Provider;
    is_active: boolean;
    key_preview: string;
    updated_at: string;
}

// ─── Metadata fournisseurs ────────────────────────────────────────────────────
const PROVIDERS: Record<
    Provider,
    { label: string; placeholder: string; color: string; textColor: string; short: string }
> = {
    openai:     { label: 'OpenAI',      placeholder: 'sk-...',           color: '#1a1a1a', textColor: '#fff', short: 'OAI' },
    anthropic:  { label: 'Anthropic',   placeholder: 'sk-ant-...',       color: '#CC785C', textColor: '#fff', short: 'ANT' },
    openrouter: { label: 'OpenRouter',  placeholder: 'sk-or-...',        color: '#6366F1', textColor: '#fff', short: 'OR'  },
    mistral:    { label: 'Mistral AI',  placeholder: 'mistral-key-...',  color: '#F7931A', textColor: '#fff', short: 'MI'  },
    gemini:     { label: 'Gemini',      placeholder: 'AIza...',          color: '#4285F4', textColor: '#fff', short: 'GEM' },
};

const ALL_PROVIDERS = Object.keys(PROVIDERS) as Provider[];

// ─── Validation clé ───────────────────────────────────────────────────────────
function validateApiKey(value: string): string | null {
    if (!value.trim()) return 'aiKeyRequired';
    if (value.trim().length < 10) return 'aiKeyTooShort';
    return null;
}

export default function AiConfigPage() {
    const searchParams = useSearchParams();
    const companyId = searchParams.get('company_id') ?? '';
    const router = useRouter();
    const toastService = new ToastService();
    const translator = new TranslationService();

    const [configs, setConfigs]         = useState<AiConfig[]>([]);
    const [loading, setLoading]         = useState(true);
    const [companyName, setCompanyName] = useState('');
    const [toggling, setToggling]       = useState(false);

    // ─── Add modal ─────────────────────────────────────────────────────────────
    const [addModalOpen, setAddModalOpen]           = useState(false);
    const [addProvider, setAddProvider]             = useState<Provider>('openai');
    const [addProviderError, setAddProviderError]   = useState<string | null>(null);
    const [addKeyInput, setAddKeyInput]             = useState('');
    const [addKeyError, setAddKeyError]             = useState<string | null>(null);
    const [addKeyTouched, setAddKeyTouched]         = useState(false);
    const [addShowKey, setAddShowKey]               = useState(false);
    const [addSaving, setAddSaving]                 = useState(false);

    // ─── Delete modal ──────────────────────────────────────────────────────────
    const [deleteModalOpen, setDeleteModalOpen]     = useState(false);
    const [configToDelete, setConfigToDelete]       = useState<AiConfig | null>(null);
    const [deleting, setDeleting]                   = useState(false);

    // ─── Dropdown ─────────────────────────────────────────────────────────────
    const [openDropdown, setOpenDropdown]           = useState<string | null>(null);
    const dropdownRef                               = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setOpenDropdown(null);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ─── Fetch ─────────────────────────────────────────────────────────────────
    const fetchConfigs = () => {
        if (configs.length === 0) setLoading(true);
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/${companyId}/ai-configs/`, {
            method: 'GET', credentials: 'include',
        })
            .then(async (res) => { const body = await res.json(); if (!res.ok) throw body.detail; return body; })
            .then((response) => {
                setConfigs(response.data?.configs || []);
                setCompanyName(response.data?.company_name || '');
            })
            .catch(() => toastService.displayToast(translator.translate('validation', 'aiLoadError'), 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { if (companyId) fetchConfigs(); }, [companyId]);

    const getConfig = (provider: Provider) => configs.find((c) => c.provider === provider);

    const formatDate = (iso: string) => {
        const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
        if (diff < 60) return "à l'instant";
        if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
        return `il y a ${Math.floor(diff / 86400)}j`;
    };

    // ─── ADD ──────────────────────────────────────────────────────────────────
    const openAddModal = () => {
        const missing = ALL_PROVIDERS.find((p) => !getConfig(p)) ?? 'openai';
        setAddProvider(missing as Provider);
        setAddKeyInput('');
        setAddKeyError(null);
        setAddKeyTouched(false);
        setAddShowKey(false);
        setAddProviderError(null);
        setAddModalOpen(true);
    };

    const closeAddModal = () => {
        setAddModalOpen(false);
        setAddKeyInput('');
        setAddKeyError(null);
        setAddKeyTouched(false);
        setAddProviderError(null);
    };

    const handleAddKey = () => {
        setAddKeyTouched(true);

        if (getConfig(addProvider)) {
            setAddProviderError('aiProviderAlreadyExists');
            return;
        }
        setAddProviderError(null);

        const err = validateApiKey(addKeyInput);
        setAddKeyError(err);
        if (err) return;

        setAddSaving(true);
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/${companyId}/ai-configs/`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: addProvider, raw_key: addKeyInput }),
        })
            .then(async (res) => { const body = await res.json(); if (!res.ok) throw body.detail; return body; })
            .then(() => {
                toastService.displayToast(translator.translate('validation', 'aiKeySaved'), 'success');
                closeAddModal();
                fetchConfigs();
            })
            .catch((err) => toastService.displayToast( translator.translate('validation', 'aiKeyError'), 'error'))
            .finally(() => setAddSaving(false));
    };

    // ─── DELETE ───────────────────────────────────────────────────────────────
    const openDeleteModal = (config: AiConfig) => {
        setOpenDropdown(null);
        setConfigToDelete(config);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setConfigToDelete(null);
    };

    const confirmDelete = () => {
        if (!configToDelete) return;
        setDeleting(true);
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/${companyId}/ai-configs/${configToDelete.config_id}`, {
            method: 'DELETE', credentials: 'include',
        })
            .then(async (res) => { const body = await res.json(); if (!res.ok) throw body.detail; return body; })
            .then(() => {
                toastService.displayToast(translator.translate('validation', 'aiKeyDeleted'), 'success');
                closeDeleteModal();
                fetchConfigs();
            })
            .catch((err) => toastService.displayToast(err || translator.translate('validation', 'aiToggleError'), 'error'))
            .finally(() => setDeleting(false));
    };

    // ─── TOGGLE DIRECT (sans modal de confirmation) ───────────────────────────
    const directToggle = (config: AiConfig) => {
        if (toggling) return;
        setToggling(true);
        fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/company/${companyId}/ai-configs/${config.config_id}/toggle`,
            {
                method: 'PATCH', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !config.is_active }),
            }
        )
            .then(async (res) => { const body = await res.json(); if (!res.ok) throw body.detail; return body; })
            .then(() => {
                toastService.displayToast(
                    config.is_active
                        ? translator.translate('validation', 'aiKeyDeactivated')
                        : translator.translate('validation', 'aiKeyActivated'),
                    'success'
                );
                fetchConfigs();
            })
            .catch((err) => toastService.displayToast( translator.translate('validation', 'aiToggleError'), 'error'))
            .finally(() => setToggling(false));
    };

    // ─── Key input shared component ───────────────────────────────────────────
    const KeyInput = ({
        value, onChange, onBlur, placeholder, showKey, onToggleShow, error, touched, onKeyDown,
    }: {
        value: string; onChange: (v: string) => void; onBlur: () => void;
        placeholder: string; showKey: boolean; onToggleShow: () => void;
        error: string | null; touched: boolean; onKeyDown?: (e: React.KeyboardEvent) => void;
    }) => (
        <div className="flex flex-col gap-1">
            <div className="relative">
                <input
                    type={showKey ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    onKeyDown={onKeyDown}
                    autoFocus
                    className={`w-full rounded-lg border px-3 py-2 pr-9 text-sm font-mono
                        text-gray-900 dark:text-gray-100 bg-white dark:bg-[#0d0d0d]
                        focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] transition-colors
                        ${touched && error
                            ? 'border-red-400 dark:border-red-500'
                            : 'border-gray-200 dark:border-[#262626]'
                        }`}
                />
                <button
                    type="button"
                    onClick={onToggleShow}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
            </div>
            {touched && error && (
                <p className="text-xs text-red-500">{translator.translate('validation', error)}</p>
            )}
        </div>
    );

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="w-full min-h-screen flex flex-col items-center px-4 py-8 md:py-10">
            <div className="w-full max-w-3xl">

                {/* Breadcrumb */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-8 transition-colors"
                >
                    <ChevronLeft size={16} />
                    {translator.translate('profile', 'yourCompanies')}
                </button>

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#E8E0FF] dark:bg-[#A079FF]/25 flex items-center justify-center">
                            <Bot size={18} className="text-[#7C4DFF]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Config AI</h1>
                            {companyName && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">{companyName}</p>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus size={14} />}
                        onClick={openAddModal}
                    >
                        {translator.translate('validation', 'newKey')}
                    </Button>
                </div>

                {/* ── Info banner — clés chiffrées ── */}
                <div className="flex items-start gap-3 p-4 mb-6 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/60 dark:bg-blue-900/10">
                    <Shield size={15} className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        {translator.translate('validation', 'aiKeysEncryptedInfo')}
                    </p>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="spinner-border" role="status" style={{ color: '#7C4DFF' }} />
                    </div>
                )}

                {/* ── Empty state ── */}
                {!loading && configs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-gray-200 dark:border-[#262626]">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                            <KeyRound size={22} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {translator.translate('validation', 'noAiKeysConfigured')}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-600 text-center max-w-xs">
                            {translator.translate('validation', 'noAiKeysConfiguredSub')}
                        </p>
                    </div>
                )}

                {/* ── Liste des clés configurées ── */}
                {!loading && configs.length > 0 && (
                    <ul className="space-y-3">
                        {configs.map((config) => {
                            const meta = PROVIDERS[config.provider];

                            return (
                                <li
                                    key={config.config_id}
                                    className="rounded-2xl border border-gray-100 dark:border-[#262626] bg-gray-50/50 dark:bg-[#121212] overflow-visible transition-colors hover:border-gray-200 dark:hover:border-[#333]"
                                >
                                    <div className="flex items-center gap-4 p-4">

                                        {/* Provider badge */}
                                        <div
                                            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                                            style={{ background: meta.color, color: meta.textColor }}
                                        >
                                            {meta.short}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                                    {meta.label}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                                    ${config.is_active
                                                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                        : 'bg-gray-100 dark:bg-[#262626] text-gray-500 dark:text-gray-400'
                                                    }`}>
                                                    {config.is_active
                                                        ? translator.translate('validation', 'active')
                                                        : translator.translate('validation', 'inactive')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                                {config.key_preview} · modifié {formatDate(config.updated_at)}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0">

                                            {/* Bouton toggle direct (sans modal) */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                leftIcon={<PowerOff size={13} />}
                                                disabled={toggling}
                                                className={
                                                    config.is_active
                                                        ? 'text-red-500 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10'
                                                        : 'text-green-600 border-green-200 dark:border-green-900/30 hover:bg-green-50 dark:hover:bg-green-900/10'
                                                }
                                                onClick={() => directToggle(config)}
                                            >
                                                {config.is_active
                                                    ? translator.translate('validation', 'deactivate')
                                                    : translator.translate('validation', 'activate')}
                                            </Button>

                                            {/* Bouton Options → dropdown Supprimer uniquement */}
                                            <div className="relative" ref={openDropdown === config.config_id ? dropdownRef : undefined}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    leftIcon={<MoreVertical size={13} />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDropdown(openDropdown === config.config_id ? null : config.config_id);
                                                    }}
                                                >
                                                    {translator.translate('profile', 'actions')}
                                                </Button>

                                                {openDropdown === config.config_id && (
                                                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-[#262626] shadow-lg z-50 overflow-hidden">
                                                        <button
                                                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                                            onClick={() => openDeleteModal(config)}
                                                        >
                                                            <Trash2 size={14} />
                                                            {translator.translate('profile', 'delete')}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}


                {/* ══════════ MODAL — ADD KEY ══════════ */}
                {addModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50" onClick={closeAddModal} />
                        <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-sm z-10 shadow-xl overflow-hidden">

                            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-[#262626]">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-[#E8E0FF] dark:bg-[#A079FF]/25 flex items-center justify-center">
                                        <Plus size={15} className="text-[#7C4DFF]" />
                                    </div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                                        {translator.translate('validation', 'addApiKey')}
                                    </h2>
                                </div>
                                <button onClick={closeAddModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="px-6 py-5 space-y-4">
                                {/* Provider selector */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        {translator.translate('validation', 'provider')}
                                    </label>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {ALL_PROVIDERS.map((p) => {
                                            const m = PROVIDERS[p];
                                            const alreadyHas = !!getConfig(p);
                                            return (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    disabled={alreadyHas}
                                                    onClick={() => {
                                                        setAddProvider(p);
                                                        setAddProviderError(null);
                                                    }}
                                                    title={alreadyHas ? `${m.label} — clé existante` : m.label}
                                                    className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-xs font-bold transition-all
                                                        ${addProvider === p
                                                            ? 'border-[#7C4DFF] ring-2 ring-[#7C4DFF]/30'
                                                            : 'border-gray-100 dark:border-[#262626] hover:border-gray-200 dark:hover:border-[#333]'
                                                        }
                                                        ${alreadyHas ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                                                    `}
                                                >
                                                    <span
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold mb-0.5"
                                                        style={{ background: m.color, color: m.textColor }}
                                                    >
                                                        {m.short}
                                                    </span>
                                                    <span className="text-gray-600 dark:text-gray-300 text-[10px] leading-tight text-center">{m.label}</span>
                                                    {alreadyHas && (
                                                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-500" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {addProviderError && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {translator.translate('validation', addProviderError)}
                                        </p>
                                    )}
                                </div>

                                {/* Key input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        {translator.translate('validation', 'apiKeyLabel')} — <span className="font-semibold">{PROVIDERS[addProvider].label}</span>
                                    </label>
                                    <KeyInput
                                        value={addKeyInput}
                                        onChange={(v) => {
                                            setAddKeyInput(v);
                                            if (addKeyTouched) setAddKeyError(validateApiKey(v));
                                        }}
                                        onBlur={() => {}}
                                        placeholder={PROVIDERS[addProvider].placeholder}
                                        showKey={addShowKey}
                                        onToggleShow={() => setAddShowKey(!addShowKey)}
                                        error={addKeyError}
                                        touched={addKeyTouched}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddKey(); }}
                                    />
                                </div>
                            </div>

                            <div className="px-6 pb-6 flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={closeAddModal} disabled={addSaving}>
                                    {translator.translate('validation', 'cancel')}
                                </Button>
                                <Button
                                    type="button"
                                    className="flex-1"
                                    leftIcon={<Check size={13} />}
                                    disabled={addSaving}
                                    onClick={handleAddKey}
                                >
                                    {addSaving ? translator.translate('validation', 'saving') : translator.translate('validation', 'save')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}


                {/* ══════════ MODAL — DELETE ══════════ */}
                {deleteModalOpen && configToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50" onClick={closeDeleteModal} />
                        <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-sm z-10 shadow-xl overflow-hidden">

                            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-[#262626]">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                        <Trash2 size={15} className="text-red-500" />
                                    </div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                                        {translator.translate('validation', 'deleteKey')}
                                    </h2>
                                </div>
                                <button onClick={closeDeleteModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="px-6 py-5 space-y-3">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {translator.translate('validation', 'deleteKeyConfirm')}{' '}
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {PROVIDERS[configToDelete.provider].label}
                                    </span>{' '}?
                                </p>
                                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                                    <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                                        {translator.translate('validation', 'deleteKeyWarning')}
                                    </p>
                                </div>
                            </div>

                            <div className="px-6 pb-6 flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={closeDeleteModal} disabled={deleting}>
                                    {translator.translate('validation', 'cancel')}
                                </Button>
                                <Button
                                    type="button"
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white border-red-500"
                                    onClick={confirmDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? translator.translate('profile', 'deleting') : translator.translate('profile', 'delete')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}