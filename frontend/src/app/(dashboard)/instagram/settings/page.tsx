'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { Instagram, Plus, Loader2, Unlink, CheckCircle, AlertCircle, X } from 'lucide-react';
import { fetchAccounts, connectAccount, disconnectAccount } from '@/lib/api/instagram';
import type { InstagramAccount } from '@/lib/api/instagram';

export default function InstagramSettingsPage() {
  const { companyId, userId, loading: authLoading } = useAuth();
  const [accounts, setAccounts]   = useState<InstagramAccount[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Connect form state
  const [igUserId, setIgUserId]   = useState('');
  const [username, setUsername]   = useState('');
  const [name, setName]           = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [pageId, setPageId]       = useState('');
  const [accountType, setAccountType] = useState('BUSINESS');

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const accts = await fetchAccounts(companyId);
      setAccounts(Array.isArray(accts) ? accts : []);
    } catch {
      toast.error('Erreur chargement comptes');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!authLoading && companyId) load();
  }, [companyId, authLoading, load]);

  async function handleConnect() {
    if (!companyId || !igUserId.trim() || !username.trim() || !accessToken.trim()) {
      toast.error('Remplissez tous les champs obligatoires');
      return;
    }
    setConnecting(true);
    try {
      const acct = await connectAccount({
        company_id: companyId,
        instagram_user_id: igUserId.trim(),
        username: username.trim(),
        name: name.trim() || undefined,
        access_token: accessToken.trim(),
        page_id: pageId.trim() || undefined,
        account_type: accountType,
      });
      setAccounts((prev) => [acct, ...prev]);
      toast.success(`@${acct.username} connecté !`);
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur connexion');
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect(accountId: string, acctUsername: string) {
    if (!confirm(`Déconnecter @${acctUsername} ?`)) return;
    setDisconnecting(accountId);
    try {
      await disconnectAccount(accountId);
      setAccounts((prev) =>
        prev.map((a) => (a.id === accountId ? { ...a, is_connected: false } : a))
      );
      toast.success(`@${acctUsername} déconnecté`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur déconnexion');
    } finally {
      setDisconnecting(null);
    }
  }

  function resetForm() {
    setShowForm(false);
    setIgUserId(''); setUsername(''); setName('');
    setAccessToken(''); setPageId(''); setAccountType('BUSINESS');
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comptes Instagram</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez vos comptes Instagram Business connectés
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-[#7C4DFF] text-white text-sm font-medium rounded-xl hover:bg-[#6B3FE0] transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Annuler' : 'Connecter un compte'}
        </button>
      </div>

      {/* Connect form */}
      {showForm && (
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#262626] p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white">
              <Instagram size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Nouveau compte</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Compte Instagram Business ou Creator</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Instagram User ID *" value={igUserId} onChange={setIgUserId} placeholder="123456789" />
            <Field label="Nom d'utilisateur *" value={username} onChange={setUsername} placeholder="mon_compte" prefix="@" />
            <Field label="Nom affiché" value={name} onChange={setName} placeholder="Mon Agence" />
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type de compte</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#262626] rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              >
                <option value="BUSINESS">BUSINESS</option>
                <option value="CREATOR">CREATOR</option>
              </select>
            </div>
            <Field label="Facebook Page ID" value={pageId} onChange={setPageId} placeholder="987654321" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Access Token *
            </label>
            <textarea
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              rows={3}
              placeholder="EAABsbCS..."
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#262626] rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] resize-none font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">Obtenez votre token via Meta for Developers → Graph API Explorer</p>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={resetForm} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Annuler
            </button>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex items-center gap-2 px-5 py-2 bg-[#7C4DFF] text-white text-sm font-medium rounded-xl hover:bg-[#6B3FE0] disabled:opacity-50 transition-colors"
            >
              {connecting ? <Loader2 size={16} className="animate-spin" /> : <Instagram size={16} />}
              Connecter
            </button>
          </div>
        </div>
      )}

      {/* Accounts list */}
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#262626] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#262626]">
          <h2 className="font-semibold text-gray-900 dark:text-white">Comptes connectés</h2>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-100 dark:divide-[#262626]">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="px-6 py-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-[#1A1A1A] animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-gray-100 dark:bg-[#1A1A1A] rounded animate-pulse" />
                  <div className="h-3 w-28 bg-gray-100 dark:bg-[#1A1A1A] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-14 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-[#1A1A1A] text-gray-400">
              <Instagram size={28} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Aucun compte connecté</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Connectez un compte Instagram Business pour commencer à publier
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#7C4DFF] text-white text-sm font-medium rounded-xl hover:bg-[#6B3FE0] transition-colors"
            >
              <Plus size={16} />
              Connecter un compte
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-[#262626]">
            {accounts.map((a, i) => (
              <li key={a.id ?? String(i)} className="flex items-center gap-4 px-6 py-5">
                {/* Avatar */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white font-semibold text-base">
                  {a.username[0]?.toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white">@{a.username}</p>
                    {a.is_connected ? (
                      <CheckCircle size={14} className="text-green-500 shrink-0" />
                    ) : (
                      <AlertCircle size={14} className="text-red-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-0.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(a.follower_count ?? 0).toLocaleString('fr-FR')} abonnés
                    </p>
                    {a.account_type && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{a.account_type}</span>
                    )}
                    <span className={`text-xs font-medium ${a.is_connected ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      {a.is_connected ? 'Actif' : 'Déconnecté'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {a.is_connected && (
                  <button
                    onClick={() => handleDisconnect(a.id, a.username)}
                    disabled={disconnecting === a.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors shrink-0"
                  >
                    {disconnecting === a.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Unlink size={14} />
                    )}
                    Déconnecter
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 px-4 py-3.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <Instagram size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          L&apos;authentification OAuth complète avec Meta sera disponible dans Epic 5. Pour l&apos;instant, entrez manuellement vos tokens depuis Meta for Developers.
        </p>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{prefix}</span>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${prefix ? 'pl-7 pr-3' : 'px-3'} py-2 text-sm border border-gray-200 dark:border-[#262626] rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]`}
        />
      </div>
    </div>
  );
}
