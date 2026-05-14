'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, RefreshCw, Check, Loader2, Copy } from 'lucide-react';
import { generateCaption, improveCaption } from '@/lib/api/instagram-ai';
import type { CaptionTone, CaptionLanguage, CaptionResult } from '@/lib/api/instagram-ai';
import toast from 'react-hot-toast';

const TONES: { value: CaptionTone; label: string }[] = [
  { value: 'professionnel', label: 'Professionnel' },
  { value: 'enthousiaste',  label: 'Enthousiaste' },
  { value: 'informatif',    label: 'Informatif' },
  { value: 'persuasif',     label: 'Persuasif' },
];

const LANGUAGES: { value: CaptionLanguage; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'عربي' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  companyId: string;
  draftId?: string;
  existingCaption: string;
  onApply: (caption: string, hashtags: string[], cta: string) => void;
}

export default function AiCaptionPanel({ open, onClose, companyId, draftId, existingCaption, onApply }: Props) {
  const [context, setContext]     = useState('');
  const [tone, setTone]           = useState<CaptionTone>('professionnel');
  const [language, setLanguage]   = useState<CaptionLanguage>('fr');
  const [instructions, setInstructions] = useState('');
  const [mode, setMode]           = useState<'generate' | 'improve'>('generate');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<CaptionResult | null>(null);
  const [displayed, setDisplayed] = useState('');
  const [typing, setTyping]       = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open && existingCaption) {
      setContext(existingCaption.slice(0, 300));
      if (existingCaption.trim()) setMode('improve');
    }
  }, [open, existingCaption]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  function typewrite(text: string) {
    setDisplayed('');
    setTyping(true);
    let i = 0;
    function tick() {
      i++;
      setDisplayed(text.slice(0, i));
      if (i < text.length) {
        timerRef.current = setTimeout(tick, 12);
      } else {
        setTyping(false);
      }
    }
    timerRef.current = setTimeout(tick, 12);
  }

  async function handleGenerate() {
    if (!companyId) return;
    setLoading(true);
    setResult(null);
    setDisplayed('');
    try {
      let res;
      if (mode === 'improve' && existingCaption.trim()) {
        res = await improveCaption({
          company_id: companyId,
          draft_id: draftId,
          existing_caption: existingCaption,
          instructions: instructions || 'Améliore cette légende',
          language,
        });
      } else {
        res = await generateCaption({
          company_id: companyId,
          draft_id: draftId,
          context: context || existingCaption || 'Contenu immobilier en Tunisie',
          tone,
          language,
        });
      }
      setResult(res.data);
      typewrite(res.data.caption);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur génération');
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (!result) return;
    onApply(result.caption, result.hashtags, result.cta);
    toast.success('Légende appliquée !');
    onClose();
  }

  function handleCopyHashtags() {
    if (!result) return;
    navigator.clipboard.writeText(result.hashtags.join(' '));
    toast.success('Hashtags copiés');
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#111] h-full shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#262626] shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8E0FF] dark:bg-[#A079FF]/20 text-[#7C4DFF]">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Générer avec IA</h2>
              <p className="text-[10px] text-gray-400">Légende Instagram</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-[#1A1A1A] rounded-xl">
            {(['generate', 'improve'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  mode === m
                    ? 'bg-white dark:bg-[#262626] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                {m === 'generate' ? 'Générer' : 'Améliorer'}
              </button>
            ))}
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Langue</label>
            <div className="flex gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLanguage(l.value)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                    language === l.value
                      ? 'border-[#7C4DFF] bg-[#7C4DFF]/10 text-[#7C4DFF] dark:text-[#B394FF]'
                      : 'border-gray-200 dark:border-[#262626] text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {mode === 'generate' ? (
            <>
              {/* Tone */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Ton</label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      className={`py-1.5 text-xs rounded-lg border transition-colors ${
                        tone === t.value
                          ? 'border-[#7C4DFF] bg-[#7C4DFF]/10 text-[#7C4DFF] dark:text-[#B394FF]'
                          : 'border-gray-200 dark:border-[#262626] text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Context */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Contexte / Description du post
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                  placeholder="Ex: Villa 4 chambres à La Marsa, 250m², vue mer, piscine..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#262626] rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] resize-none"
                />
              </div>
            </>
          ) : (
            /* Improve mode */
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Instructions d&apos;amélioration
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                placeholder="Ex: Rends-la plus percutante, ajoute plus d'emojis, raccourcis..."
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#262626] rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] resize-none"
              />
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || typing}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#7C4DFF] text-white text-sm font-medium rounded-xl hover:bg-[#6B3FE0] disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Génération en cours…</>
            ) : (
              <><Sparkles size={16} /> {mode === 'generate' ? 'Générer' : 'Améliorer'}</>
            )}
          </button>

          {/* Result */}
          {(displayed || result) && (
            <div className="space-y-3">
              {/* Caption preview */}
              <div className="relative p-4 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-gray-200 dark:border-[#262626]">
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                  {displayed}
                  {typing && <span className="inline-block w-0.5 h-4 bg-[#7C4DFF] ml-0.5 animate-pulse" />}
                </p>
              </div>

              {/* Hashtags */}
              {result && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Hashtags</span>
                    <button
                      onClick={handleCopyHashtags}
                      className="flex items-center gap-1 text-[10px] text-[#7C4DFF] hover:underline"
                    >
                      <Copy size={10} /> Copier
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.hashtags.map((h) => (
                      <span key={h} className="px-2 py-0.5 text-[11px] bg-[#7C4DFF]/10 text-[#7C4DFF] dark:text-[#B394FF] rounded-full">
                        {h}
                      </span>
                    ))}
                  </div>
                  {result.cta && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      CTA : {result.cta}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {result && !typing && (
          <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-100 dark:border-[#262626] shrink-0">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-200 dark:border-[#262626] rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors"
            >
              <RefreshCw size={14} /> Régénérer
            </button>
            <button
              onClick={handleApply}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm bg-[#7C4DFF] text-white font-medium rounded-xl hover:bg-[#6B3FE0] transition-colors"
            >
              <Check size={14} /> Appliquer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
