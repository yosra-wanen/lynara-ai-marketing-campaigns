'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { fetchJobs, fetchDrafts } from '@/lib/api/instagram';
import type { ScheduleJob, InstagramDraft } from '@/lib/api/instagram';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday-indexed
}

interface EnrichedJob extends ScheduleJob {
  caption?: string;
  content_type?: string;
}

export default function CalendarPage() {
  const { companyId, loading: authLoading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs]               = useState<EnrichedJob[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [rawJobs, draftsRes] = await Promise.all([
        fetchJobs({ company_id: companyId, status: 'pending' }),
        fetchDrafts({ company_id: companyId, status: 'scheduled', page_size: 100 }),
      ]);

      const draftMap = new Map<string, InstagramDraft>(
        draftsRes.data.map((d) => [d.id, d])
      );

      const enriched: EnrichedJob[] = rawJobs.map((job) => {
        const draft = draftMap.get(job.draft_id);
        return {
          ...job,
          caption:      draft?.caption,
          content_type: draft?.content_type,
        };
      });

      setJobs(enriched);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!authLoading && companyId) load();
  }, [companyId, authLoading, load]);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  }

  const numDays  = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  function jobsOnDay(day: number): EnrichedJob[] {
    return jobs.filter((j) => {
      const dt = new Date(j.scheduled_time);
      return dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === day;
    });
  }

  const selectedDayJobs = selectedDay !== null ? jobsOnDay(selectedDay) : [];

  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#262626] overflow-hidden">

        {/* Calendar header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#262626]">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-[#262626]">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-[#7C4DFF] border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              const isToday    = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSelected = day === selectedDay;
              const dayJobs    = day !== null ? jobsOnDay(day) : [];

              return (
                <button
                  key={idx}
                  onClick={() => day !== null && setSelectedDay(day === selectedDay ? null : day)}
                  disabled={day === null}
                  className={`min-h-[80px] p-2 border-b border-r border-gray-100 dark:border-[#262626] text-left transition-colors
                    ${day === null ? 'bg-gray-50 dark:bg-[#0A0A0A] cursor-default' : 'hover:bg-gray-50 dark:hover:bg-[#1A1A1A] cursor-pointer'}
                    ${isSelected ? 'bg-[#7C4DFF]/5 dark:bg-[#7C4DFF]/10 ring-1 ring-inset ring-[#7C4DFF]/30' : ''}
                  `}
                >
                  {day !== null && (
                    <>
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium mb-1
                        ${isToday ? 'bg-[#7C4DFF] text-white' : 'text-gray-700 dark:text-gray-300'}
                      `}>
                        {day}
                      </span>
                      <div className="space-y-0.5">
                        {dayJobs.slice(0, 2).map((j) => (
                          <div key={j.id} className="truncate text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 px-1.5 py-0.5 rounded">
                            {j.caption ? j.caption.slice(0, 18) + '…' : 'Post'}
                          </div>
                        ))}
                        {dayJobs.length > 2 && (
                          <div className="text-[10px] text-gray-400">+{dayJobs.length - 2}</div>
                        )}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected day detail */}
      {selectedDay !== null && (
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#262626]">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#262626]">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {selectedDay} {MONTH_NAMES[month]} {year}
            </h3>
          </div>
          {selectedDayJobs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Calendar size={28} className="text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Aucun post planifié ce jour</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-[#262626]">
              {selectedDayJobs.map((j) => (
                <li
                  key={j.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] cursor-pointer transition-colors"
                  onClick={() => router.push(`/instagram/studio?draft_id=${j.draft_id}`)}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-600">
                    <Clock size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {j.caption ? j.caption.slice(0, 80) + (j.caption.length > 80 ? '…' : '') : 'Sans légende'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
                      {j.content_type ?? 'post'} · {new Date(j.scheduled_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    Planifié
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
