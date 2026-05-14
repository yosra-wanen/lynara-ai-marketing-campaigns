'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, PowerOff, Trash2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Campaign {
  id:           string;
  title_fr:     string;
  status:       string;
  company_id:   string;
  company_name: string;
  price:        number | null;
  currency:     string | null;
  created_at:   string;
}

const STATUS_LABEL: Record<string, string> = {
  draft:     'Brouillon',
  published: 'Publié',
  archived:  'Archivé',
};

const STATUS_COLOR: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600 dark:bg-[#262626] dark:text-gray-300',
  published: 'bg-green-100 text-green-700',
  archived:  'bg-orange-100 text-orange-700',
};

export default function AdminCampaignsPage() {
  const [campaigns,     setCampaigns]     = useState<Campaign[]>([]);
  const [filtered,      setFiltered]      = useState<Campaign[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchCampaigns() {
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/admin/campaigns`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? 'Erreur');
      setCampaigns(json.data ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur chargement campagnes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCampaigns(); }, []);

  useEffect(() => {
    let list = [...campaigns];
    if (search)              list = list.filter(c => (c.title_fr ?? '').toLowerCase().includes(search.toLowerCase()) || (c.company_name ?? '').toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter);
    setFiltered(list);
  }, [campaigns, search, statusFilter]);

  async function deactivate(id: string) {
    if (!confirm('Désactiver cette campagne ?')) return;
    setActionLoading(id + 'deac');
    try {
      const res = await fetch(`${API_URL}/admin/campaigns/${id}/deactivate`, {
        method: 'PUT', credentials: 'include',
      });
      if (!res.ok) throw new Error();
      toast.success('Campagne désactivée');
      fetchCampaigns();
    } catch {
      toast.error('Erreur lors de la désactivation');
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteCampaign(id: string, title: string) {
    if (!confirm(`Supprimer définitivement « ${title} » ?`)) return;
    setActionLoading(id + 'del');
    try {
      const res = await fetch(`${API_URL}/admin/campaigns/${id}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (!res.ok) throw new Error();
      toast.success('Campagne supprimée');
      fetchCampaigns();
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campagnes</h1>
        <p className="text-sm text-gray-500 mt-1">{filtered.length} campagne(s)</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par titre ou entreprise…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] dark:bg-[#111] dark:border-[#262626] dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] dark:bg-[#111] dark:border-[#262626] dark:text-white"
        >
          <option value="all">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="published">Publié</option>
          <option value="archived">Archivé</option>
        </select>
      </div>

      <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-100 dark:border-[#262626] overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-[#262626]">
          <thead className="bg-gray-50 dark:bg-[#1A1A1A]">
            <tr>
              {['Titre', 'Entreprise', 'Statut', 'Prix', 'Créé le', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-[#1E1E1E]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#7C4DFF] mx-auto" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                  Aucune campagne trouvée
                </td>
              </tr>
            ) : filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-[#1A1A1A]">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                  {c.title_fr || '—'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{c.company_name || '—'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLOR[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {c.price != null ? `${c.price} ${c.currency ?? 'TND'}` : '—'}
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {c.status !== 'archived' && (
                      <button
                        onClick={() => deactivate(c.id)}
                        disabled={actionLoading === c.id + 'deac'}
                        title="Désactiver"
                        className="p-1.5 rounded-lg text-orange-400 hover:bg-orange-50 disabled:opacity-40"
                      >
                        <PowerOff size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteCampaign(c.id, c.title_fr)}
                      disabled={actionLoading === c.id + 'del'}
                      title="Supprimer"
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
