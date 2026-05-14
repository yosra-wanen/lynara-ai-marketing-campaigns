'use client';

import { useState } from 'react';
import { X, Sparkles, Loader2, Check, RefreshCw } from 'lucide-react';
import { generateImage } from '@/lib/api/instagram-ai';
import type { ImageStyle, ImageResult } from '@/lib/api/instagram-ai';
import toast from 'react-hot-toast';

const STYLES: { value: ImageStyle; label: string; desc: string }[] = [
  { value: 'moderne',    label: 'Moderne',     desc: 'Clean, contemporain' },
  { value: 'lumineux',   label: 'Lumineux',    desc: 'Lumineux, aérien' },
  { value: 'élégant',    label: 'Élégant',     desc: 'Luxe, raffiné' },
  { value: 'minimaliste', label: 'Minimaliste', desc: 'Simple, épuré' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  companyId: string;
  draftId?: string;
  contentType?: string;
  onApply: (url: string) => void;
}

export default function AiImageModal({ open, onClose, companyId, draftId, contentType, onApply }: Props) {
  const [prompt, setPrompt]   = useState('');
  const [style, setStyle]     = useState<ImageStyle>('moderne');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<ImageResult | null>(null);

  async function handleGenerate() {
    if (!prompt.trim() || !companyId) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await generateImage({
        company_id: companyId,
        draft_id: draftId,
        prompt: prompt.trim(),
        style,
        content_type: contentType || 'post',
      });
      setResult(res.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur génération image');
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (!result) return;
    onApply(result.url);
    toast.success('Image ajoutée aux médias !');
    onClose();
    setResult(null);
    setPrompt('');
  }

  if (!open) return null;

  const isVertical = contentType === 'story' || contentType === 'reel';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#262626] shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8E0FF] dark:bg-[#A079FF]/20 text-[#7C4DFF]">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Générer image IA</h2>
              <p className="text-[10px] text-gray-400">Placeholder — Replicate / StabilityAI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Prompt */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Description de l&apos;image *
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Ex: Villa moderne à Tunis avec piscine, coucher de soleil, style photographique..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-[#262626] rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] resize-none"
            />
          </div>

          {/* Style selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Style visuel</label>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`text-left px-3 py-2.5 rounded-xl border transition-colors ${
                    style === s.value
                      ? 'border-[#7C4DFF] bg-[#7C4DFF]/10'
                      : 'border-gray-200 dark:border-[#262626] hover:border-gray-300 dark:hover:border-[#333]'
                  }`}
                >
                  <p className={`text-xs font-medium ${style === s.value ? 'text-[#7C4DFF] dark:text-[#B394FF]' : 'text-gray-900 dark:text-white'}`}>
                    {s.label}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#7C4DFF] text-white text-sm font-medium rounded-xl hover:bg-[#6B3FE0] disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Génération…</>
            ) : (
              <><Sparkles size={16} /> Générer l&apos;image</>
            )}
          </button>

          {/* Preview */}
          {result && (
            <div className="space-y-3">
              <div className={`mx-auto overflow-hidden rounded-xl border border-gray-200 dark:border-[#262626] bg-gray-100 dark:bg-[#1A1A1A] ${isVertical ? 'max-w-[200px]' : 'w-full'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.url}
                  alt="Aperçu généré"
                  className="w-full h-auto object-cover"
                />
              </div>
              <p className="text-[10px] text-center text-gray-400">
                {result.width} × {result.height}px · Style {style}
              </p>
              <p className="text-[10px] text-center text-amber-600 dark:text-amber-400">
                Image placeholder — connectez Replicate ou StabilityAI pour la génération réelle
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {result && (
          <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100 dark:border-[#262626] shrink-0">
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
              <Check size={14} /> Utiliser cette image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
