'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, AlertTriangle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AdminSettingsPage() {
  const [platformName,     setPlatformName]     = useState('Lynara AI');
  const [maintenanceMode,  setMaintenanceMode]  = useState(false);
  const [loading,          setLoading]          = useState(true);
  const [saving,           setSaving]           = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`${API_URL}/admin/settings`, { credentials: 'include' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.detail ?? 'Erreur');

        const settings = json.data ?? {};
        if (settings.platform_name  !== undefined) setPlatformName(String(settings.platform_name).replace(/^"|"$/g, ''));
        if (settings.maintenance_mode !== undefined) setMaintenanceMode(settings.maintenance_mode === true || settings.maintenance_mode === 'true');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erreur chargement paramètres');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/settings`, {
        method:      'PUT',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ platform_name: platformName, maintenance_mode: maintenanceMode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail ?? 'Erreur');
      toast.success('Paramètres sauvegardés');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">Configuration globale de la plateforme</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-[#111] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Platform name */}
          <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-100 dark:border-[#262626] p-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">
              Général
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nom de la plateforme
                </label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] dark:bg-[#1A1A1A] dark:border-[#262626] dark:text-white"
                  placeholder="Lynara AI"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Affiché dans les emails et l'interface utilisateur.
                </p>
              </div>
            </div>
          </div>

          {/* Maintenance mode */}
          <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-100 dark:border-[#262626] p-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">
              Maintenance
            </h2>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Mode maintenance</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Lorsqu'il est actif, les utilisateurs non-admin voient une page de maintenance.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={maintenanceMode}
                onClick={() => setMaintenanceMode((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] focus:ring-offset-2 ${maintenanceMode ? 'bg-[#7C4DFF]' : 'bg-gray-200 dark:bg-[#262626]'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5 ${maintenanceMode ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </button>
            </div>

            {maintenanceMode && (
              <div className="mt-4 flex items-start gap-2 px-3 py-2.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <AlertTriangle size={15} className="text-orange-500 mt-0.5 shrink-0" />
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Le mode maintenance est <strong>actif</strong>. Les utilisateurs réguliers ne peuvent pas accéder à l'application.
                </p>
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#7C4DFF] text-white text-sm font-medium rounded-lg hover:bg-[#6B3FE0] disabled:opacity-50 transition-colors"
            >
              <Save size={15} />
              {saving ? 'Sauvegarde…' : 'Sauvegarder les paramètres'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
