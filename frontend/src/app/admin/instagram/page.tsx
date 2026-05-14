'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Instagram, Unlink } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface InstagramAccount {
  id:                string;
  username:          string;
  instagram_user_id: string;
  owner_name:        string;
  owner_email:       string;
  follower_count:    number;
  is_connected:      boolean;
  created_at:        string;
}

export default function AdminInstagramPage() {
  const [accounts,      setAccounts]      = useState<InstagramAccount[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchAccounts() {
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/admin/instagram`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? 'Erreur');
      setAccounts(json.data ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur chargement comptes Instagram');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAccounts(); }, []);

  async function disconnect(accountId: string, username: string) {
    if (!confirm(`Déconnecter le compte @${username} ?`)) return;
    setActionLoading(accountId);
    try {
      const res = await fetch(`${API_URL}/admin/instagram/${accountId}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (!res.ok) throw new Error();
      toast.success(`@${username} déconnecté`);
      fetchAccounts();
    } catch {
      toast.error('Erreur lors de la déconnexion');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comptes Instagram</h1>
        <p className="text-sm text-gray-500 mt-1">{accounts.length} compte(s) enregistré(s)</p>
      </div>

      <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-100 dark:border-[#262626] overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-[#262626]">
          <thead className="bg-gray-50 dark:bg-[#1A1A1A]">
            <tr>
              {['Compte', 'Propriétaire', 'Abonnés', 'Statut', 'Connecté le', 'Actions'].map((h) => (
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
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <Instagram size={36} className="opacity-30" />
                    <p className="text-sm">Aucun compte Instagram connecté</p>
                  </div>
                </td>
              </tr>
            ) : accounts.map((acct) => (
              <tr key={acct.id} className="hover:bg-gray-50 dark:hover:bg-[#1A1A1A]">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
                      <Instagram size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">@{acct.username}</p>
                      <p className="text-xs text-gray-400">{acct.instagram_user_id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900 dark:text-white">{acct.owner_name || '—'}</p>
                  <p className="text-xs text-gray-500">{acct.owner_email}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {acct.follower_count.toLocaleString('fr-FR')}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${acct.is_connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {acct.is_connected ? 'Connecté' : 'Déconnecté'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {acct.created_at ? new Date(acct.created_at).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="px-6 py-4">
                  {acct.is_connected && (
                    <button
                      onClick={() => disconnect(acct.id, acct.username)}
                      disabled={actionLoading === acct.id}
                      title="Déconnecter"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg text-red-500 border border-red-200 hover:bg-red-50 disabled:opacity-40 transition-colors"
                    >
                      <Unlink size={13} />
                      Déconnecter
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
