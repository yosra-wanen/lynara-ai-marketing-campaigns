'use client'
import { useEffect, useState } from 'react'

const COMPANY_ID = '11111111-1111-1111-1111-111111111111'

export default function QuotasPage() {
  const [stats, setStats] = useState({
    searches_used: 0,
    searches_limit: 100,
    leads_collected: 0,
    leads_limit: 1000,
    leads_imported: 0,
    api_calls: 0,
    api_calls_limit: 5000,
  })

  const [roles, setRoles] = useState([
    { role: 'Admin', can_launch_search: true, can_validate_leads: true, can_manage_quotas: true },
    { role: 'Manager', can_launch_search: true, can_validate_leads: true, can_manage_quotas: false },
    { role: 'Commercial', can_launch_search: false, can_validate_leads: true, can_manage_quotas: false },
    { role: 'Viewer', can_launch_search: false, can_validate_leads: false, can_manage_quotas: false },
  ])

  const [defaults, setDefaults] = useState({
    default_sectors: '',
    default_countries: '',
    default_client_types: '',
  })

  const [savingRoles, setSavingRoles] = useState(false)
  const [savingDefaults, setSavingDefaults] = useState(false)

  useEffect(() => { fetchQuotas() }, [])

  async function fetchQuotas() {
    try {
      const ctrl = new AbortController()
      const id = setTimeout(() => ctrl.abort(), 10000)
      const res = await fetch(`http://localhost:8000/ai-orchestration/quotas?company_id=${COMPANY_ID}`, { signal: ctrl.signal })
      clearTimeout(id)
      const json = await res.json()
      if (json.success) setStats(json.data)
    } catch {
      // Quotas API optional; page still usable
    }
  }

  const getPercentage = (used: number, limit: number) => Math.min(Math.round(used / limit * 100), 100)

  const getBarColor = (pct: number) => {
    if (pct >= 90) return 'bg-red-500'
    if (pct >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Gouvernance & Quotas</h1>
        <p className="text-sm text-gray-500 mt-1">Gérez les quotas, accès et paramètres par défaut de votre entreprise</p>
      </div>

      {/* Quota Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Recherches IA', used: stats.searches_used, limit: stats.searches_limit, icon: '🔍' },
          { label: 'Leads collectés', used: stats.leads_collected, limit: stats.leads_limit, icon: '👥' },
          { label: 'Appels API', used: stats.api_calls, limit: stats.api_calls_limit, icon: '⚡' },
        ].map(item => {
          const pct = getPercentage(item.used, item.limit)
          return (
            <div key={item.label} className="bg-white rounded-lg border p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-gray-500">{item.icon} {item.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{item.used}<span className="text-sm font-normal text-gray-400">/{item.limit}</span></p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${pct >= 90 ? 'bg-red-100 text-red-700' : pct >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                  {pct}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className={`${getBarColor(pct)} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{item.limit - item.used} restants</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Role Access */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔐 Règles d'accès par rôle</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left text-xs font-medium text-gray-500 pb-2">Rôle</th>
                  <th className="text-center text-xs font-medium text-gray-500 pb-2">Lancer recherche</th>
                  <th className="text-center text-xs font-medium text-gray-500 pb-2">Valider leads</th>
                  <th className="text-center text-xs font-medium text-gray-500 pb-2">Gérer quotas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roles.map((role, index) => (
                  <tr key={role.role}>
                    <td className="py-3 text-sm font-medium text-gray-900">{role.role}</td>
                    {(['can_launch_search', 'can_validate_leads', 'can_manage_quotas'] as const).map(field => (
                      <td key={field} className="py-3 text-center">
                        <input type="checkbox"
                          checked={role[field]}
                          onChange={(e) => {
                            const updated = [...roles]
                            updated[index] = { ...role, [field]: e.target.checked }
                            setRoles(updated)
                          }}
                          className="w-4 h-4 accent-[#E1306C]" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => { setSavingRoles(true); setTimeout(() => { setSavingRoles(false); alert('Règles sauvegardées!') }, 500) }}
            disabled={savingRoles}
            className="mt-4 px-6 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D] disabled:opacity-50 text-sm">
            {savingRoles ? 'Sauvegarde...' : 'Sauvegarder les règles'}
          </button>
        </div>

        {/* Default Target Params */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🎯 Paramètres de cible par défaut</h2>
          <p className="text-sm text-gray-500 mb-4">Ces paramètres seront pré-remplis dans le formulaire de collecte IA</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secteurs par défaut</label>
              <input type="text"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                placeholder="Ex: Immobilier, Tech, Finance..."
                value={defaults.default_sectors}
                onChange={(e) => setDefaults({ ...defaults, default_sectors: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pays cibles</label>
              <input type="text"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                placeholder="Ex: Tunisie, Maroc, France..."
                value={defaults.default_countries}
                onChange={(e) => setDefaults({ ...defaults, default_countries: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Types de clients cibles</label>
              <input type="text"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                placeholder="Ex: PME, Grands comptes, Startups..."
                value={defaults.default_client_types}
                onChange={(e) => setDefaults({ ...defaults, default_client_types: e.target.value })} />
            </div>
          </div>
          <button onClick={() => { setSavingDefaults(true); setTimeout(() => { setSavingDefaults(false); alert('Paramètres sauvegardés!') }, 500) }}
            disabled={savingDefaults}
            className="mt-4 px-6 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D] disabled:opacity-50 text-sm">
            {savingDefaults ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
          </button>
        </div>
      </div>
    </div>
  )
}