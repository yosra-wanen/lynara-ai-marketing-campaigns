'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  Instagram, FileText, Calendar, BarChart2, Settings,
  Plus, CheckCircle, Clock, AlertCircle, Camera,
} from 'lucide-react';
import { fetchAccounts, fetchDrafts } from '@/lib/api/instagram';
import type { InstagramAccount, InstagramDraft, DraftStatus } from '@/lib/api/instagram';

const STATUS_BADGE: Record<DraftStatus, { label: string; className: string }> = {
  draft:     { label: 'Brouillon', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  ready:     { label: 'Prêt',      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  scheduled: { label: 'Planifié',  className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  published: { label: 'Publié',    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  failed:    { label: 'Échoué',    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  cancelled: { label: 'Annulé',    className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function InstagramPage() {
  const { companyId, loading: authLoading } = useAuth();
  const [accounts, setAccounts]   = useState<InstagramAccount[]>([]);
  const [drafts, setDrafts]       = useState<InstagramDraft[]>([]);
  const [totals, setTotals]       = useState({ all: 0, scheduled: 0, published: 0 });
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [accts, recent, sched, pub] = await Promise.all([
        fetchAccounts(companyId),
        fetchDrafts({ company_id: companyId, page_size: 6 }),
        fetchDrafts({ company_id: companyId, status: 'scheduled', page_size: 1 }),
        fetchDrafts({ company_id: companyId, status: 'published', page_size: 1 }),
      ]);
      setAccounts(Array.isArray(accts) ? accts : []);
      setDrafts(Array.isArray(recent?.data) ? recent.data : []);
      setTotals({
        all:       recent?.total       ?? 0,
        scheduled: sched?.total        ?? 0,
        published: pub?.total          ?? 0,
      });
    } catch {
      // ignore - avoid crashing the page
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!authLoading && companyId) load();
  }, [companyId, authLoading, load]);

  const quickLinks = [
    { href: '/instagram/studio',    icon: <FileText size={20} />,   label: 'Studio',       sub: 'Créer et gérer les brouillons' },
    { href: '/instagram/calendar',  icon: <Calendar size={20} />,   label: 'Calendrier',   sub: 'Posts planifiés' },
    { href: '/instagram/analytics', icon: <BarChart2 size={20} />,  label: 'Analytiques',  sub: 'Métriques et performance' },
    { href: '/instagram/settings',  icon: <Settings size={20} />,   label: 'Comptes',      sub: 'Gérer vos comptes Instagram' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100 dark:bg-[#111] animate-pulse" />
          ))
        ) : (
          <>
            <StatCard
              label="Comptes connectés"
              value={accounts.filter((a) => a.is_connected).length}
              icon={<Instagram size={20} />}
              color="purple"
            />
            <StatCard label="Total brouillons" value={totals.all}       icon={<FileText size={20} />}     color="blue" />
            <StatCard label="Planifiés"         value={totals.scheduled} icon={<Clock size={20} />}        color="amber" />
            <StatCard label="Publiés"           value={totals.published} icon={<CheckCircle size={20} />}  color="green" />
          </>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex flex-col gap-3 rounded-2xl border border-gray-100 dark:border-[#262626] bg-white dark:bg-[#111] p-5 hover:border-[#7C4DFF]/40 hover:shadow-md transition-all group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8E0FF] dark:bg-[#A079FF]/20 text-[#7C4DFF] dark:text-[#B394FF] group-hover:bg-[#7C4DFF] group-hover:text-white transition-colors">
              {l.icon}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{l.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{l.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent drafts */}
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#262626]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#262626]">
          <h2 className="font-semibold text-gray-900 dark:text-white">Brouillons récents</h2>
          <Link href="/instagram/studio" className="text-sm text-[#7C4DFF] hover:underline">
            Voir tout →
          </Link>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-100 dark:divide-[#262626]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-[#1A1A1A] animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-56 bg-gray-100 dark:bg-[#1A1A1A] rounded animate-pulse" />
                  <div className="h-3 w-32 bg-gray-100 dark:bg-[#1A1A1A] rounded animate-pulse" />
                </div>
                <div className="h-6 w-20 rounded-full bg-gray-100 dark:bg-[#1A1A1A] animate-pulse" />
              </div>
            ))}
          </div>
        ) : drafts.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8E0FF] dark:bg-[#A079FF]/20 text-[#7C4DFF]">
              <Camera size={28} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Aucun brouillon</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Créez votre premier post Instagram</p>
            </div>
            <Link
              href="/instagram/studio"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#7C4DFF] text-white text-sm font-medium rounded-xl hover:bg-[#6B3FE0] transition-colors"
            >
              <Plus size={16} />
              Nouveau brouillon
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-[#262626]">
            {drafts.map((d, i) => {
              const badge = STATUS_BADGE[d.status] ?? STATUS_BADGE.draft;
              return (
                <li key={d.id ?? String(i)}>
                  <Link
                    href="/instagram/studio"
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8E0FF] dark:bg-[#A079FF]/20 text-[#7C4DFF]">
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {d.caption ? d.caption.slice(0, 70) + (d.caption.length > 70 ? '…' : '') : 'Sans légende'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
                        {d.content_type} · {fmt(d.updated_at ?? d.created_at)}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Connected accounts preview */}
      {!loading && accounts.length > 0 && (
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#262626]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#262626]">
            <h2 className="font-semibold text-gray-900 dark:text-white">Comptes connectés</h2>
            <Link href="/instagram/settings" className="text-sm text-[#7C4DFF] hover:underline">Gérer →</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#262626]">
            {accounts.slice(0, 3).map((a, i) => (
              <div key={a.id ?? String(i)} className="flex items-center gap-4 px-6 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white font-semibold text-sm">
                  {a.username[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">@{a.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(a.follower_count ?? 0).toLocaleString('fr-FR')} abonnés
                  </p>
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${a.is_connected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500'}`}>
                  {a.is_connected ? 'Connecté' : 'Déconnecté'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && accounts.length === 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Aucun compte Instagram connecté.{' '}
            <Link href="/instagram/settings" className="underline font-medium">Connecter un compte →</Link>
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label, value, icon, color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'purple' | 'blue' | 'amber' | 'green';
}) {
  const colors: Record<string, string> = {
    purple: 'bg-[#E8E0FF] text-[#7C4DFF] dark:bg-[#A079FF]/20 dark:text-[#B394FF]',
    blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    amber:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    green:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  };
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 dark:border-[#262626] bg-white dark:bg-[#111] p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
