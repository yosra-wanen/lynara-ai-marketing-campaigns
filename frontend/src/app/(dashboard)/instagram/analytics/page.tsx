'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { BarChart2, Eye, Heart, MessageCircle, Share2, TrendingUp, TrendingDown, Users } from 'lucide-react';
import {
  fetchAccounts,
  fetchAnalyticsSummary,
  fetchAnalyticsPosts,
  fetchAnalyticsAccount,
} from '@/lib/api/instagram';
import type {
  InstagramAccount,
  AnalyticsSummary,
  PostAnalytics,
  AccountAnalytics,
  MetricsByPost,
} from '@/lib/api/instagram';

// ── Helpers ───────────────────────────────────────────────────────────────────

type Preset = '7' | '14' | '30' | '90';

function dateRange(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days + 1);
  return {
    date_from: from.toISOString().slice(0, 10),
    date_to:   to.toISOString().slice(0, 10),
  };
}

function fmtShort(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function pctBadge(pct: number | null) {
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
      up ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
         : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    }`}>
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {Math.abs(pct)}%
    </span>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse bg-gray-100 dark:bg-[#1A1A1A] rounded-xl ${className ?? ''}`} style={style} />;
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, icon, color, pct, loading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'green' | 'amber';
  pct: number | null;
  loading: boolean;
}) {
  const colors: Record<string, string> = {
    purple: 'bg-[#E8E0FF] text-[#7C4DFF] dark:bg-[#A079FF]/20 dark:text-[#B394FF]',
    blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    amber:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    green:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  };
  if (loading) return <Skeleton className="h-28" />;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 dark:border-[#262626] bg-white dark:bg-[#111] p-5">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>
          {icon}
        </div>
        {pctBadge(pct)}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString('fr-FR')}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { companyId, loading: authLoading } = useAuth();

  const [accounts, setAccounts]       = useState<InstagramAccount[]>([]);
  const [accountFilter, setAccountFilter] = useState('');
  const [preset, setPreset]           = useState<Preset>('7');

  const [summary, setSummary]         = useState<AnalyticsSummary | null>(null);
  const [postsData, setPostsData]     = useState<PostAnalytics | null>(null);
  const [accountData, setAccountData] = useState<AccountAnalytics | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // Load accounts once
  useEffect(() => {
    if (!companyId || authLoading) return;
    fetchAccounts(companyId).then((a) => setAccounts(a ?? [])).catch(() => {});
  }, [companyId, authLoading]);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    const range = dateRange(parseInt(preset, 10));
    const params = { company_id: companyId, account_id: accountFilter || undefined, ...range };
    try {
      const [sum, posts, acct] = await Promise.all([
        fetchAnalyticsSummary(params),
        fetchAnalyticsPosts(params),
        fetchAnalyticsAccount(params),
      ]);
      setSummary(sum);
      setPostsData(posts);
      setAccountData(acct);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur chargement analytics');
    } finally {
      setLoading(false);
    }
  }, [companyId, accountFilter, preset]);

  useEffect(() => {
    if (!authLoading && companyId) load();
  }, [companyId, authLoading, load]);

  // ── Chart data ──────────────────────────────────────────────────────────────

  const chartData = postsData?.by_date ?? [];
  const maxImp    = Math.max(...chartData.map((d) => d.impressions), 1);
  const maxReach  = Math.max(...chartData.map((d) => d.reach), 1);
  const maxBar    = Math.max(maxImp, maxReach, 1);

  const followerData   = accountData?.by_date ?? [];
  const maxFollowers   = Math.max(...followerData.map((d) => d.followers_count), 1);

  const hasPostData    = (postsData?.by_post.length ?? 0) > 0;
  const hasFollowerData = followerData.length > 0;

  const totals  = postsData?.totals;
  const changes = summary?.changes;

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Filters bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {accounts.length > 1 && (
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-[#262626] rounded-xl bg-white dark:bg-[#111] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
          >
            <option value="">Tous les comptes</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>@{a.username}</option>
            ))}
          </select>
        )}

        <div className="flex rounded-xl border border-gray-200 dark:border-[#262626] overflow-hidden">
          {(['7', '14', '30', '90'] as Preset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-r last:border-r-0 border-gray-200 dark:border-[#262626] ${
                preset === p
                  ? 'bg-[#7C4DFF] text-white'
                  : 'bg-white dark:bg-[#111] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
              }`}
            >
              {p}j
            </button>
          ))}
        </div>

        {summary && !loading && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {fmtDate(summary.date_from)} – {fmtDate(summary.date_to)}
          </span>
        )}
      </div>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Impressions"  value={totals?.impressions ?? 0} icon={<Eye size={20} />}            color="blue"   pct={changes?.impressions_pct ?? null} loading={loading} />
        <KpiCard label="Portée"       value={totals?.reach ?? 0}       icon={<Share2 size={20} />}         color="purple" pct={changes?.reach_pct ?? null}       loading={loading} />
        <KpiCard label="Likes"        value={totals?.likes ?? 0}       icon={<Heart size={20} />}          color="green"  pct={changes?.likes_pct ?? null}       loading={loading} />
        <KpiCard label="Commentaires" value={totals?.comments ?? 0}    icon={<MessageCircle size={20} />}  color="amber"  pct={changes?.comments_pct ?? null}    loading={loading} />
      </div>

      {/* ── Impressions & Portée chart ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#262626] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white">Impressions & Portée</h2>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#7C4DFF]" />Impressions</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#A079FF]/50" />Portée</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-end gap-2 h-36">
            {[...Array(parseInt(preset) > 14 ? 10 : parseInt(preset))].map((_, i) => (
              <div key={i} className="flex-1 flex gap-0.5 items-end h-full">
                <Skeleton className={`flex-1 rounded-b-none`} style={{ height: `${30 + Math.random() * 60}%` } as React.CSSProperties} />
                <Skeleton className={`flex-1 rounded-b-none`} style={{ height: `${20 + Math.random() * 50}%` } as React.CSSProperties} />
              </div>
            ))}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <BarChart2 size={28} className="text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucune donnée disponible — publiez des posts pour voir vos analytiques
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 h-36 min-w-0" style={{ minWidth: `${chartData.length * 36}px` }}>
              {chartData.map((d) => {
                const impPct   = Math.round((d.impressions / maxBar) * 100);
                const reachPct = Math.round((d.reach / maxBar) * 100);
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="flex items-end gap-0.5 w-full" style={{ height: '120px' }}>
                      {/* Impressions bar */}
                      <div className="flex-1 relative overflow-hidden rounded-t-sm bg-[#7C4DFF]/10 dark:bg-[#7C4DFF]/20" style={{ height: '100%' }}>
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-[#7C4DFF] rounded-t-sm transition-all duration-500"
                          style={{ height: `${impPct}%` }}
                        />
                      </div>
                      {/* Reach bar */}
                      <div className="flex-1 relative overflow-hidden rounded-t-sm bg-[#A079FF]/10 dark:bg-[#A079FF]/20" style={{ height: '100%' }}>
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-[#A079FF]/60 rounded-t-sm transition-all duration-500"
                          style={{ height: `${reachPct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {fmtShort(d.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Followers chart ────────────────────────────────────────────────── */}
      {(loading || hasFollowerData) && (
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#262626] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-900 dark:text-white">Abonnés</h2>
            {!loading && accountData?.latest && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {accountData.latest.followers_count.toLocaleString('fr-FR')}
                </span>
                {accountData.follower_change !== 0 && (
                  <span className={`text-xs font-medium ${accountData.follower_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {accountData.follower_change > 0 ? '+' : ''}{accountData.follower_change}
                  </span>
                )}
                <Users size={14} className="text-gray-400" />
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-end gap-2 h-24">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="flex-1 rounded-b-none" style={{ height: `${40 + i * 5}%` } as React.CSSProperties} />
              ))}
            </div>
          ) : followerData.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
              Aucune donnée de suivi d&apos;abonnés
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex items-end gap-1 h-24 min-w-0" style={{ minWidth: `${followerData.length * 36}px` }}>
                {followerData.map((d) => {
                  const pct = Math.round((d.followers_count / maxFollowers) * 100);
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="w-full relative overflow-hidden rounded-t-sm bg-amber-100 dark:bg-amber-900/20" style={{ height: '80px' }}>
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-amber-400 dark:bg-amber-500 rounded-t-sm transition-all duration-500"
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {fmtShort(d.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Posts table ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#262626] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#262626]">
          <h2 className="font-semibold text-gray-900 dark:text-white">Performance par post</h2>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-100 dark:divide-[#262626]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-32" />
                </div>
                {[...Array(5)].map((__, j) => <Skeleton key={j} className="h-5 w-14" />)}
              </div>
            ))}
          </div>
        ) : !hasPostData ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center px-4">
            <BarChart2 size={32} className="text-gray-300 dark:text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Aucune donnée disponible</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Publiez des posts pour voir vos analytiques
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#262626]">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Post</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Impressions</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Portée</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Likes</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Commentaires</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Eng.%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262626]">
                {(postsData?.by_post ?? []).map((p: MetricsByPost) => (
                  <tr key={p.draft_id} className="hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                        {p.caption ? p.caption.slice(0, 60) + (p.caption.length > 60 ? '…' : '') : 'Sans légende'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{p.content_type ?? '—'}</p>
                    </td>
                    <td className="px-4 py-4 text-right text-gray-900 dark:text-white font-medium">
                      {p.impressions.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-900 dark:text-white font-medium">
                      {p.reach.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-900 dark:text-white font-medium">
                      {p.likes.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-900 dark:text-white font-medium">
                      {p.comments.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        p.engagement_rate >= 0.05
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : p.engagement_rate >= 0.02
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {(p.engagement_rate * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
