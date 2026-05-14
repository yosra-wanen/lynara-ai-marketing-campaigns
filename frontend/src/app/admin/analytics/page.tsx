'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, Megaphone, TrendingUp, Instagram } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface MonthPoint { month: string; count: number; }

interface Analytics {
  total_users:           number;
  total_companies:       number;
  total_campaigns:       number;
  active_campaigns:      number;
  total_instagram:       number;
  users_per_month:       MonthPoint[];
  campaigns_per_month:   MonthPoint[];
}

function BarChart({ data, color }: { data: MonthPoint[]; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-28 pt-2">
      {data.map((d) => (
        <div key={d.month} className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
          <span className="text-[10px] text-gray-500 font-medium">{d.count || ''}</span>
          <div
            className="w-full rounded-t transition-all duration-300"
            style={{
              height:     `${Math.max((d.count / max) * 85, d.count > 0 ? 4 : 0)}%`,
              background: color,
              opacity:    0.85,
            }}
          />
          <span className="text-[10px] text-gray-400">{d.month.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data,    setData]    = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`${API_URL}/admin/analytics`, { credentials: 'include' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.detail ?? 'Erreur');
        setData(json.data);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erreur chargement analytics');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const kpis = [
    { label: 'Utilisateurs',      value: data?.total_users ?? 0,      icon: <Users size={20} className="text-[#7C4DFF]" />,  bg: 'bg-[#7C4DFF]/10' },
    { label: 'Entreprises',        value: data?.total_companies ?? 0,   icon: <TrendingUp size={20} className="text-blue-500" />, bg: 'bg-blue-50' },
    { label: 'Campagnes totales',  value: data?.total_campaigns ?? 0,   icon: <Megaphone size={20} className="text-emerald-500" />, bg: 'bg-emerald-50' },
    { label: 'Campagnes actives',  value: data?.active_campaigns ?? 0,  icon: <Megaphone size={20} className="text-green-500" />,   bg: 'bg-green-50' },
    { label: 'Comptes Instagram',  value: data?.total_instagram ?? 0,   icon: <Instagram size={20} className="text-pink-500" />,   bg: 'bg-pink-50' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Vue d'ensemble des 6 derniers mois</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white dark:bg-[#111] rounded-xl border border-gray-100 dark:border-[#262626] p-4 flex flex-col gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${k.bg}`}>
              {k.icon}
            </div>
            {loading ? (
              <div className="h-7 w-12 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{k.value}</p>
            )}
            <p className="text-xs text-gray-500 leading-tight">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-100 dark:border-[#262626] p-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Nouveaux utilisateurs / mois
          </h2>
          {loading ? (
            <div className="h-28 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg animate-pulse" />
          ) : (
            <BarChart data={data?.users_per_month ?? []} color="#7C4DFF" />
          )}
        </div>

        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-100 dark:border-[#262626] p-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Campagnes créées / mois
          </h2>
          {loading ? (
            <div className="h-28 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg animate-pulse" />
          ) : (
            <BarChart data={data?.campaigns_per_month ?? []} color="#10B981" />
          )}
        </div>
      </div>

      {/* Summary table */}
      {!loading && data && (
        <div className="mt-6 bg-white dark:bg-[#111] rounded-xl border border-gray-100 dark:border-[#262626] p-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">
            Détail mensuel
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#262626]">
                  <th className="py-2 text-left text-xs font-semibold text-gray-500 uppercase">Mois</th>
                  <th className="py-2 text-right text-xs font-semibold text-gray-500 uppercase">Nouveaux utilisateurs</th>
                  <th className="py-2 text-right text-xs font-semibold text-gray-500 uppercase">Campagnes créées</th>
                </tr>
              </thead>
              <tbody>
                {(data.users_per_month ?? []).map((row, i) => (
                  <tr key={row.month} className="border-b border-gray-50 dark:border-[#1A1A1A]">
                    <td className="py-2 text-gray-700 dark:text-gray-300">{row.month}</td>
                    <td className="py-2 text-right text-gray-900 dark:text-white font-medium">{row.count}</td>
                    <td className="py-2 text-right text-gray-900 dark:text-white font-medium">
                      {data.campaigns_per_month?.[i]?.count ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
