'use client';

import { useEffect, useState, Suspense } from 'react';
import { Sparkles, Clock, TrendingUp, TrendingDown, BarChart2, Lightbulb, Star, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchRecommendationsPostingTime,
  fetchRecommendationsCaptions,
  fetchWeeklyReport,
  PostingTimeData,
  CaptionRecommendations,
  WeeklyReportData,
} from '@/lib/api/instagram';

// ── Defaults shown immediately on mount (no skeleton needed) ──────────────────

const DEFAULT_HEATMAP = [
  0, 0, 0, 0, 0, 0,
  0.1, 0.3, 0.85, 0.5, 0.3, 0.2,
  0.5, 0.4, 0.3, 0.2, 0.3, 0.5,
  0.6, 0.7, 0.80, 0.6, 0.3, 0.1,
];

const DEFAULT_POSTING_TIME: PostingTimeData = {
  top_slots: [
    { day: 'Tous les jours', hour: 12, label: '12:00 — Tous les jours',    score: 0.92 },
    { day: 'Lundi-Vendredi', hour: 8,  label: '08:00 — Lundi-Vendredi',   score: 0.85 },
    { day: 'Mardi-Jeudi',    hour: 20, label: '20:00 — Mardi & Jeudi',    score: 0.78 },
  ],
  heatmap: DEFAULT_HEATMAP,
  data_based: false,
};

const DEFAULT_CAPTIONS: CaptionRecommendations = {
  tips: [
    { tip: 'Utilisez des hashtags pertinents (5-10 max)',              reason: 'Des hashtags ciblés augmentent votre visibilité auprès du bon public.' },
    { tip: 'Publiez des stories quotidiennement',                      reason: 'Les stories maintiennent votre présence et engagement au quotidien.' },
    { tip: 'Répondez aux commentaires dans les 2 premières heures',    reason: "L'algorithme favorise les posts avec une activité rapide après publication." },
    { tip: 'Utilisez des visuels de haute qualité',                    reason: 'Les images nettes et attrayantes génèrent 40% plus d\'engagement.' },
    { tip: 'Variez les formats : posts, reels, carousels',             reason: 'La diversité des formats touche un public plus large.' },
  ],
  top_captions: [],
  data_based: false,
};

const DEFAULT_WEEKLY: WeeklyReportData = {
  current_week:  { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0 },
  previous_week: { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0 },
  changes:       { impressions_pct: null, reach_pct: null, likes_pct: null },
  best_post:     null,
  tips:          ['Commencez à publier pour voir vos statistiques!'],
  date_from:     '',
  date_to:       '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function pctBadge(pct: number | null) {
  if (pct === null) return <span className="text-xs text-gray-400">—</span>;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? '+' : ''}{pct}%
    </span>
  );
}

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// ── Heatmap ───────────────────────────────────────────────────────────────────

function Heatmap({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Activité par heure (UTC+1)</p>
      <div className="flex gap-1 items-end">
        {data.map((v, h) => (
          <div key={h} className="flex flex-col items-center gap-1 flex-1">
            <div
              className="w-full rounded-sm transition-all duration-500"
              style={{
                height: `${Math.max(4, Math.round((v / max) * 40))}px`,
                background: v === 0 ? '#e5e7eb' : `rgba(160,121,255,${0.2 + 0.8 * (v / max)})`,
              }}
            />
            {h % 4 === 0 && <span className="text-[9px] text-gray-400">{h}h</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Cards ─────────────────────────────────────────────────────────────────────

function PostingTimeCard({ data }: { data: PostingTimeData }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#262626] bg-white dark:bg-[#111] p-6">
      <div className="flex items-center gap-2 mb-1">
        <Clock size={18} className="text-[#a079ff]" />
        <h2 className="font-semibold text-gray-900 dark:text-white">Meilleurs moments pour publier</h2>
      </div>
      {!data.data_based && (
        <p className="text-xs text-amber-500 mb-3">
          Recommandations générales — vos données personnelles apparaîtront après vos premières publications.
        </p>
      )}

      <div className="mt-3 space-y-2">
        {data.top_slots.map((slot, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#a079ff]/10 text-[#a079ff] text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{slot.label}</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, s) => (
                <div
                  key={s}
                  className="h-1.5 w-4 rounded-full transition-colors duration-500"
                  style={{ background: s < Math.ceil(slot.score * 5) ? '#a079ff' : '#e5e7eb' }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Heatmap data={data.heatmap} />
    </div>
  );
}

function WeeklyReportCard({ data }: { data: WeeklyReportData }) {
  const c = data.current_week;
  const { changes, best_post, tips } = data;
  const hasData = c.impressions > 0 || c.reach > 0 || c.likes > 0;

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#262626] bg-white dark:bg-[#111] p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={18} className="text-[#a079ff]" />
        <h2 className="font-semibold text-gray-900 dark:text-white">Rapport hebdomadaire</h2>
        {data.date_from && (
          <span className="ml-auto text-xs text-gray-400">{data.date_from} → {data.date_to}</span>
        )}
      </div>

      {!hasData ? (
        <div className="rounded-xl bg-gray-50 dark:bg-[#1a1a1a] px-4 py-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Commencez à publier pour voir vos statistiques!
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Impressions', value: c.impressions, pct: changes.impressions_pct },
              { label: 'Portée',      value: c.reach,       pct: changes.reach_pct },
              { label: 'Likes',       value: c.likes,       pct: changes.likes_pct },
            ].map(({ label, value, pct }) => (
              <div key={label} className="rounded-xl bg-gray-50 dark:bg-[#1a1a1a] px-3 py-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{fmt(value)}</p>
                <div className="mt-0.5">{pctBadge(pct)}</div>
              </div>
            ))}
          </div>

          {best_post && (
            <div className="mb-4 rounded-xl border border-[#a079ff]/20 bg-[#a079ff]/5 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Star size={14} className="text-[#a079ff]" />
                <span className="text-xs font-semibold text-[#a079ff]">Meilleur post de la semaine</span>
              </div>
              {best_post.caption && (
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-1">{best_post.caption}</p>
              )}
              <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>{fmt(best_post.impressions)} impressions</span>
                <span>{(best_post.engagement_rate * 100).toFixed(1)}% engagement</span>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-4 space-y-2">
        {tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#a079ff]/10 text-[#a079ff] text-[10px] font-bold">
              {i + 1}
            </span>
            {tip}
          </div>
        ))}
      </div>
    </div>
  );
}

function CaptionTipsCard({ data }: { data: CaptionRecommendations }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#262626] bg-white dark:bg-[#111] p-6">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb size={18} className="text-[#a079ff]" />
        <h2 className="font-semibold text-gray-900 dark:text-white">Conseils IA pour vos légendes</h2>
      </div>
      {!data.data_based && (
        <p className="text-xs text-amber-500 mb-3">
          Conseils généraux — vos recommandations personnalisées apparaîtront après vos premières publications.
        </p>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.tips.map((tip, i) => (
          <div key={i} className="rounded-xl bg-gray-50 dark:bg-[#1a1a1a] px-4 py-3">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{tip.tip}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{tip.reason}</p>
          </div>
        ))}
      </div>

      {data.top_captions.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Meilleures légendes</p>
          <div className="space-y-2">
            {data.top_captions.map((c, i) => (
              <div key={i} className="rounded-xl border border-gray-100 dark:border-[#262626] px-4 py-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{c.caption}</p>
                <p className="mt-1 text-xs text-[#a079ff] font-medium">
                  {(c.engagement_rate * 100).toFixed(1)}% engagement
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function RecommendationsPageContent() {
  // useAuth returns { companyId, loading, ... } — NOT { user }
  const { companyId, loading: authLoading } = useAuth();

  const [postingTime, setPostingTime] = useState<PostingTimeData>(DEFAULT_POSTING_TIME);
  const [captions, setCaptions]       = useState<CaptionRecommendations>(DEFAULT_CAPTIONS);
  const [weekly, setWeekly]           = useState<WeeklyReportData>(DEFAULT_WEEKLY);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    // Wait until auth has resolved; if no company, keep showing defaults
    if (authLoading || !companyId) return;

    setRefreshing(true);
    setError(null);

    const params = { company_id: companyId };

    Promise.all([
      fetchRecommendationsPostingTime(params),
      fetchRecommendationsCaptions(params),
      fetchWeeklyReport(params),
    ])
      .then(([pt, cap, wk]) => {
        console.log('[Recommendations] posting-time:', pt);
        console.log('[Recommendations] captions:', cap);
        console.log('[Recommendations] weekly:', wk);
        setPostingTime(pt);
        setCaptions(cap);
        setWeekly(wk);
      })
      .catch(e => {
        console.error('[Recommendations] fetch error:', e);
        // Keep showing defaults; surface a dismissible error banner
        setError(e.message);
      })
      .finally(() => setRefreshing(false));
  }, [companyId, authLoading]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#a079ff]/10">
            <Sparkles size={20} className="text-[#a079ff]" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Recommandations IA</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Optimisez votre stratégie Instagram grâce aux données
            </p>
          </div>
          {refreshing && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <RefreshCw size={14} className="animate-spin" />
              Mise à jour…
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <PostingTimeCard data={postingTime} />
          <WeeklyReportCard data={weekly} />
          <div className="lg:col-span-2">
            <CaptionTipsCard data={captions} />
          </div>
        </div>

      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <Suspense>
      <RecommendationsPageContent />
    </Suspense>
  );
}
