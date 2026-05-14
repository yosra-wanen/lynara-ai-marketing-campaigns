'use client';

import { useState } from 'react';
import { X, Calendar, Clock, Globe, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSchedule: (scheduledTime: string) => Promise<void>;
}

const TIMEZONES = [
  { value: 'Africa/Tunis',   label: 'Tunis (UTC+1)' },
  { value: 'Europe/Paris',   label: 'Paris (UTC+1/+2)' },
  { value: 'UTC',            label: 'UTC (UTC+0)' },
  { value: 'America/New_York', label: 'New York (UTC-5/-4)' },
];

// Fixed offsets for MVP — Africa/Tunis has no DST so +01:00 is always correct
const TZ_OFFSETS: Record<string, string> = {
  'Africa/Tunis':    '+01:00',
  'Europe/Paris':    '+01:00',
  'UTC':             '+00:00',
  'America/New_York': '-05:00',
};

export default function ScheduleModal({ open, onClose, onSchedule }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate]     = useState(today);
  const [time, setTime]     = useState('09:00');
  const [tz, setTz]         = useState('Africa/Tunis');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const previewDate = date
    ? new Date(`${date}T${time}`).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : '—';

  async function handleConfirm() {
    if (!date || !time) return;
    const offset = TZ_OFFSETS[tz] ?? '+00:00';
    const isoString = `${date}T${time}:00${offset}`;
    setLoading(true);
    try {
      await onSchedule(isoString);
      onClose();
    } catch {
      // parent handles the toast
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#111] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#262626]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#262626]">
          <h2 className="font-semibold text-gray-900 dark:text-white">Planifier la publication</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Date */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              <Calendar size={14} /> Date
            </label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#262626] rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
            />
          </div>

          {/* Time */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              <Clock size={14} /> Heure
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#262626] rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              <Globe size={14} /> Fuseau horaire
            </label>
            <select
              value={tz}
              onChange={(e) => setTz(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#262626] rounded-xl bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
            >
              {TIMEZONES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 px-4 py-3">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Sera publié le <strong>{previewDate}</strong> à <strong>{time}</strong> ({tz})
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-[#262626]">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#262626] rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!date || !time || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
            Planifier
          </button>
        </div>
      </div>
    </div>
  );
}
