'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Users, Megaphone, TrendingUp, Instagram, ScrollText, Settings, ArrowRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Analytics {
  total_users:      number;
  total_campaigns:  number;
  active_campaigns: number;
  total_instagram:  number;
}

interface LogEntry {
  id:           string;
  action:       string;
  performed_by: string;
  created_at:   string;
}

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [logs, setLogs]           = useState<LogEntry[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [analyticsRes, logsRes] = await Promise.all([
          fetch(`${API_URL}/admin/analytics`, { credentials: 'include' }),
          fetch(`${API_URL}/admin/logs`,      { credentials: 'include' }),
        ]);

        if (analyticsRes.ok) {
          const json = await analyticsRes.json();
          setAnalytics(json.data);
        }
        if (logsRes.ok) {
          const json = await logsRes.json();
          setLogs((json.data ?? []).slice(0, 5));
        }
      } catch {
        toast.error('Erreur lors du chargement du tableau de bord');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = [
    {
      label: 'Utilisateurs',
      value: analytics?.total_users ?? 0,
      icon: <Users size={22} className="text-[#7C4DFF]" />,
      href: '/admin/users',
      bg: 'bg-[#7C4DFF]/10',
    },
    {
      label: 'Campagnes totales',
      value: analytics?.total_campaigns ?? 0,
      icon: <Megaphone size={22} className="text-blue-500" />,
      href: '/admin/campaigns',
      bg: 'bg-blue-50',
    },
    {
      label: 'Campagnes actives',
      value: analytics?.active_campaigns ?? 0,
      icon: <TrendingUp size={22} className="text-green-500" />,
      href: '/admin/campaigns',
      bg: 'bg-green-50',
    },
    {
      label: 'Comptes Instagram',
      value: analytics?.total_instagram ?? 0,
      icon: <Instagram size={22} className="text-pink-500" />,
      href: '/admin/instagram',
      bg: 'bg-pink-50',
    },
  ];

  const quickLinks = [
    { href: '/admin/users',     label: 'Gérer les utilisateurs',  icon: <Users size={18} /> },
    { href: '/admin/campaigns', label: 'Gérer les campagnes',     icon: <Megaphone size={18} /> },
    { href: '/admin/analytics', label: 'Voir les analytics',      icon: <TrendingUp size={18} /> },
    { href: '/admin/logs',      label: 'Consulter les journaux',  icon: <ScrollText size={18} /> },
    { href: '/admin/settings',  label: 'Paramètres plateforme',   icon: <Settings size={18} /> },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Vue d'ensemble de la plateforme Lynara AI</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white dark:bg-[#111] rounded-xl border border-gray-100 dark:border-[#262626] p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`rounded-xl p-3 ${s.bg}`}>{s.icon}</div>
            <div>
              {loading ? (
                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mb-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              )}
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick links */}
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-100 dark:border-[#262626] p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
            Accès rapides
          </h2>
          <ul className="space-y-2">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-[#7C4DFF]/10 hover:text-[#7C4DFF] transition-colors group"
                >
                  <span className="flex items-center gap-2">{l.icon}{l.label}</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent logs */}
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-100 dark:border-[#262626] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              Activité récente
            </h2>
            <Link href="/admin/logs" className="text-xs text-[#7C4DFF] hover:underline">Voir tout</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-9 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucune activité récente</p>
          ) : (
            <ul className="space-y-2">
              {logs.map((log) => (
                <li key={log.id} className="flex items-start justify-between text-sm">
                  <span className="px-2 py-0.5 bg-[#7C4DFF]/10 text-[#7C4DFF] rounded text-xs font-mono">
                    {log.action}
                  </span>
                  <span className="text-xs text-gray-400 ml-2 shrink-0">
                    {new Date(log.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
