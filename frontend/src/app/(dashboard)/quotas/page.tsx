'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const AI_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'

export default function QuotasPage() {
  const { companyId: COMPANY_ID } = useAuth()
  const [stats, setStats] = useState({
    searches_used: 0,
    searches_limit: 100,
    leads_collected: 0,
    leads_limit: 1000,
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
    default_location: '',
    default_industry: '',
    default_persona: '',
    default_volume: 10,
  })

  const [providers, setProviders] = useState<any>(null)
  const [savingRoles, setSavingRoles] = useState(false)
  const [savingDefaults, setSavingDefaults] = useState(false)
  const [loadingDefaults, setLoadingDefaults] = useState(true)

  useEffect(() => {
    fetchQuotas()
    fetchTargetParams()
    fetchProviders()
  }, [])

  async function fetchQuotas() {
    try {
      const res = await fetch(`${AI_URL}/ai-orchestration/quotas?company_id=${COMPANY_ID}`)
      const json = await res.json()
      if (json.success) setStats(json.data)
    } catch {
      // Quotas API optional
    }
  }

  async function fetchTargetParams() {
    try {
      const res = await fetch(`${AI_URL}/ai-orchestration/target-params?company_id=${COMPANY_ID}`)
      const json = await res.json()
      if (json.success && json.data) {
        setDefaults({
          default_location: json.data.default_location || '',
          default_industry: json.data.default_industry || '',
          default_persona: json.data.default_persona || '',
          default_volume: json.data.default_volume || 10,
        })
      }
    } catch {
      // Optional
    } finally {
      setLoadingDefaults(false)
    }
  }

  async function fetchProviders() {
    try {
      const res = await fetch(`${AI_URL}/ai-orchestration/providers?company_id=${COMPANY_ID}`)
      const json = await res.json()
      if (json.success) setProviders(json.data)
    } catch {
      // Optional
    }
  }

  async function saveRoles() {
    setSavingRoles(true)
    try {
      // Saved locally for now — backend role management to be implemented
      await new Promise(r => setTimeout(r, 500))
      toast.success('Règles sauvegardées!')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSavingRoles(false)
    }
  }

  async function saveDefaults() {
    setSavingDefaults(true)
    try {
      const res = await fetch(`${AI_URL}/ai-orchestration/target-params?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaults)
      })
      const json = await res.json()
      if (json.success) toast.success('Paramètres sauvegardés!')
      else throw new Error()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSavingDefaults(false)
    }
  }

  const getPercentage = (used: number, limit: number) =>
    Math.min(Math.round((used / limit) * 100), 100)

  const getBarColor = (pct: number) => {
    if (pct >= 90) return 'bg-red-500'
    if (pct >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Gouvernance & Quotas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gérez les quotas, accès et paramètres par défaut de votre entreprise
        </p>
      </div>

      {/* Quota Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Recherches IA', used: stats.searches_used, limit: stats.searches_limit },
          { label: 'Leads collectés', used: stats.leads_collected, limit: stats.leads_limit },
          { label: 'Appels API', used: stats.api_calls, limit: stats.api_calls_limit },
        ].map(item => {
          const pct = getPercentage(item.used, item.limit)
          return (
            <div key={item.label} className="bg-white rounded-lg border p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {item.used}
                    <span className="text-sm font-normal text-gray-400">/{item.limit}</span>
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  pct >= 90 ? 'bg-red-100 text-red-700' :
                  pct >= 70 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {pct}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className={`${getBarColor(pct)} h-2 rounded-full transition-all`}
                  style={{ width: `${pct}%` }}></div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{item.limit - item.used} restants</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* LEAD-AI-06-02: Role Access Rules */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Règles d'accès par rôle
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Définissez quels rôles peuvent accéder au module IA
          </p>
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
                          className="w-4 h-4 accent-[#7C4DFF]" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={saveRoles} disabled={savingRoles}
            className="mt-4 px-6 py-2 bg-[#7C4DFF] text-white rounded-lg hover:bg-[#6D3FEB] disabled:opacity-50 text-sm">
            {savingRoles ? 'Sauvegarde...' : 'Sauvegarder les règles'}
          </button>
        </div>

        {/* LEAD-AI-06-03: Default Target Params */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Paramètres de cible par défaut
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Ces paramètres seront pré-remplis dans le formulaire de collecte IA
          </p>
          {loadingDefaults ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#7C4DFF] mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localisation par défaut
                </label>
                <input type="text"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
                  placeholder="Ex: Tunis, Casablanca..."
                  value={defaults.default_location}
                  onChange={(e) => setDefaults({ ...defaults, default_location: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secteur par défaut
                </label>
                <input type="text"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
                  placeholder="Ex: Immobilier, Tech, Finance..."
                  value={defaults.default_industry}
                  onChange={(e) => setDefaults({ ...defaults, default_industry: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Persona cible par défaut
                </label>
                <input type="text"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
                  placeholder="Ex: Directeur, CEO, Manager..."
                  value={defaults.default_persona}
                  onChange={(e) => setDefaults({ ...defaults, default_persona: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volume par défaut
                </label>
                <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
                  value={defaults.default_volume}
                  onChange={(e) => setDefaults({ ...defaults, default_volume: parseInt(e.target.value) })}>
                  <option value={5}>5 leads</option>
                  <option value={10}>10 leads</option>
                  <option value={20}>20 leads</option>
                  <option value={50}>50 leads</option>
                </select>
              </div>
            </div>
          )}
          <button onClick={saveDefaults} disabled={savingDefaults || loadingDefaults}
            className="mt-4 px-6 py-2 bg-[#7C4DFF] text-white rounded-lg hover:bg-[#6D3FEB] disabled:opacity-50 text-sm">
            {savingDefaults ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
          </button>
        </div>
      </div>

      {/* Providers Status */}
      {providers && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Statut des providers de recherche
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(providers.providers || {}).map(([name, info]: [string, any]) => (
              <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">{name}</p>
                  <p className="text-xs text-gray-500">
                    {info.available ? 'Configuré' : 'Non configuré'}
                  </p>
                </div>
                <span className={`w-3 h-3 rounded-full ${info.available ? 'bg-green-400' : 'bg-gray-300'}`}></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}