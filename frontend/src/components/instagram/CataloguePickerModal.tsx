'use client';

import { useEffect, useState } from 'react';
import { Search, X, ShoppingBag, Loader2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export interface CatalogueItem {
  id: string;
  title_fr: string;
  description_fr?: string;
  price?: number;
  currency?: string;
  status?: string;
  category?: string;
  image_url?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  companyId: string;
  onSelect: (item: CatalogueItem) => void;
}

const PAGE_SIZE = 12;

export default function CataloguePickerModal({ open, onClose, companyId, onSelect }: Props) {
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (!open || !companyId) return;
    setLoading(true);
    const q = new URLSearchParams({
      company_id: companyId,
      page: String(page),
      page_size: String(PAGE_SIZE),
    });
    if (search.trim()) q.set('search', search.trim());

    fetch(`${API}/catalog/items-with-images?${q}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setItems(Array.isArray(d.data) ? d.data : []);
        setTotal(d.total ?? 0);
      })
      .catch(() => {
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [open, companyId, search, page]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSearch('');
      setPage(1);
    }
  }, [open]);

  if (!open) return null;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl mx-4 rounded-2xl bg-white dark:bg-[#111] shadow-2xl flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#262626] shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#7C4DFF]" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Choisir une offre du catalogue</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-[#262626] shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une offre…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-[#262626] rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] dark:text-white placeholder-gray-400"
              autoFocus
            />
          </div>
        </div>

        {/* Items grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-[#7C4DFF]" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <ShoppingBag size={36} className="text-gray-300 dark:text-gray-700" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {search ? `Aucune offre trouvée pour "${search}"` : 'Aucune offre publiée dans le catalogue'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => { onSelect(item); onClose(); }}
                  className="text-left rounded-xl border border-gray-200 dark:border-[#262626] overflow-hidden hover:border-[#7C4DFF] hover:shadow-lg transition-all group bg-white dark:bg-[#1a1a1a]"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gray-100 dark:bg-[#262626] overflow-hidden">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.title_fr}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={24} className="text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug">
                      {item.title_fr}
                    </p>
                    {item.price != null && (
                      <p className="mt-1 text-xs font-bold text-[#7C4DFF]">
                        {item.price.toLocaleString('fr-FR')} {item.currency ?? 'TND'}
                      </p>
                    )}
                    {item.category && (
                      <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500 truncate">
                        {item.category}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-[#262626] shrink-0 text-xs text-gray-500 dark:text-gray-400">
            <span>{total} offre{total !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-[#262626] disabled:opacity-40"
              >
                ←
              </button>
              <span>{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-[#262626] disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
