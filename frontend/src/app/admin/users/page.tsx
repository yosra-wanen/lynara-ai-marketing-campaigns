'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, ShieldCheck, ShieldOff, Ban, Trash2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface User {
  id:         string;
  email:      string;
  full_name:  string;
  role:       'admin' | 'user';
  status:     'active' | 'banned';
  created_at: string;
}

export default function AdminUsersPage() {
  const [users,       setUsers]       = useState<User[]>([]);
  const [filtered,    setFiltered]    = useState<User[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [roleFilter,  setRoleFilter]  = useState('all');
  const [statFilter,  setStatFilter]  = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/admin/users`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? 'Erreur');
      setUsers(json.data ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur chargement utilisateurs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let list = [...users];
    if (search)              list = list.filter(u => u.email.toLowerCase().includes(search.toLowerCase()) || u.full_name.toLowerCase().includes(search.toLowerCase()));
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    if (statFilter !== 'all') list = list.filter(u => u.status === statFilter);
    setFiltered(list);
  }, [users, search, roleFilter, statFilter]);

  async function changeRole(userId: string, role: 'admin' | 'user') {
    setActionLoading(userId + 'role');
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method:      'PUT',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error();
      toast.success(role === 'admin' ? 'Promu administrateur' : 'Rétrogradé utilisateur');
      fetchUsers();
    } catch {
      toast.error('Erreur lors du changement de rôle');
    } finally {
      setActionLoading(null);
    }
  }

  async function toggleBan(userId: string, banned: boolean) {
    setActionLoading(userId + 'ban');
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/ban`, {
        method:      'PUT',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ banned }),
      });
      if (!res.ok) throw new Error();
      toast.success(banned ? 'Utilisateur banni' : 'Utilisateur débanni');
      fetchUsers();
    } catch {
      toast.error('Erreur lors du bannissement');
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Supprimer définitivement l'utilisateur ${email} ?`)) return;
    setActionLoading(userId + 'del');
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method:      'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      toast.success('Utilisateur supprimé');
      fetchUsers();
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Utilisateurs</h1>
        <p className="text-sm text-gray-500 mt-1">{filtered.length} utilisateur(s)</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] dark:bg-[#111] dark:border-[#262626] dark:text-white"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] dark:bg-[#111] dark:border-[#262626] dark:text-white"
        >
          <option value="all">Tous les rôles</option>
          <option value="admin">Admin</option>
          <option value="user">Utilisateur</option>
        </select>
        <select
          value={statFilter}
          onChange={(e) => setStatFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] dark:bg-[#111] dark:border-[#262626] dark:text-white"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="banned">Banni</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-100 dark:border-[#262626] overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-[#262626]">
          <thead className="bg-gray-50 dark:bg-[#1A1A1A]">
            <tr>
              {['Utilisateur', 'Rôle', 'Statut', 'Créé le', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-[#1E1E1E]">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#7C4DFF] mx-auto" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : filtered.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-[#1A1A1A]">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name || '—'}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-[#7C4DFF]/15 text-[#7C4DFF]' : 'bg-gray-100 text-gray-600 dark:bg-[#262626] dark:text-gray-300'}`}>
                    {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.status === 'active' ? 'Actif' : 'Banni'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {user.role === 'admin' ? (
                      <button
                        onClick={() => changeRole(user.id, 'user')}
                        disabled={actionLoading === user.id + 'role'}
                        title="Rétrograder"
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#262626] disabled:opacity-40"
                      >
                        <ShieldOff size={15} />
                      </button>
                    ) : (
                      <button
                        onClick={() => changeRole(user.id, 'admin')}
                        disabled={actionLoading === user.id + 'role'}
                        title="Promouvoir admin"
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-[#7C4DFF]/10 hover:text-[#7C4DFF] dark:hover:bg-[#262626] disabled:opacity-40"
                      >
                        <ShieldCheck size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => toggleBan(user.id, user.status !== 'banned')}
                      disabled={actionLoading === user.id + 'ban'}
                      title={user.status === 'banned' ? 'Débannir' : 'Bannir'}
                      className={`p-1.5 rounded-lg disabled:opacity-40 ${user.status === 'banned' ? 'text-green-500 hover:bg-green-50' : 'text-orange-400 hover:bg-orange-50'}`}
                    >
                      <Ban size={15} />
                    </button>
                    <button
                      onClick={() => deleteUser(user.id, user.email)}
                      disabled={actionLoading === user.id + 'del'}
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
