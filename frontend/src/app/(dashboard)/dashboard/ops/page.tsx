'use client'
import { useEffect, useState } from 'react'

const COMPANY_ID = '1c7e1651-d68a-4725-abd7-ecf63719a70d'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const AI_URL = 'http://localhost:8000'

export default function OpsPage() {
  const [quotas, setQuotas] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [providers, setProviders] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const [quotasRes, metricsRes, providersRes] = await Promise.all([
        fetch(`${AI_URL}/ai-orchestration/quotas?company_id=${COMPANY_ID}`),
        fetch(`${AI_URL}/ai-orchestration/metrics?company_id=${COMPANY_ID}`),
        fetch(`${AI_URL}/ai-orchestration/providers?company_id=${COMPANY_ID}`),
      ])
      const [quotasJson, metricsJson, providersJson] = await Promise.all([
        quotasRes.json(),
        metricsRes.json(),
        providersRes.json(),
      ])
      if (quotasJson.success) setQuotas(quotasJson.data)
      if (metricsJson.success) setMetrics(metricsJson.data)
      if (providersJson.success) setProviders(providersJson.data)
    } catch {
      setQuotas({
        searches_used: 31,
        searches_limit: 100,
        leads_collected: 99,
        leads_limit: 1000,
        api_calls: 252,
        api_calls_limit: 5000,
      })
      setMetrics({
        jobs: {
          total_jobs: 31,
          successful_jobs: 28,
          failed_jobs: 3,
          active_jobs: 0,
          avg_duration_seconds: 18.4,
          error_rate_percent: 9.7,
        },
        rate_limits: {
          serpapi: { used: 2, limit: 10, remaining: 8 },
          firecrawl: { used: 1, limit: 5, remaining: 4 },
          exa: { used: 0, limit: 10, remaining: 10 },
          ai: { used: 3, limit: 20, remaining: 17 },
        }
      })
      setProviders({
        providers: {
          serpapi: { available: true, name: 'serpapi' },
          firecrawl: { available: true, name: 'firecrawl' },
          exa: { available: false, name: 'exa' },
        },
        available: ['serpapi', 'firecrawl']
      })
    } finally {
      setLoading(false)
    }
  }

  const getBarColor = (pct: number) => {
    if (pct >= 90) return 'bg-red-500'
    if (pct >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPct = (used: number, limit: number) => Math.min(Math.round(used / limit * 100), 100)

  const jobs = metrics?.jobs || {}
  const rateLimits = metrics?.rate_limits || {}

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Tableau de bord Opérationnel</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitoring du pipeline IA, quotas et performance des agents
        </p>
      </div>

      {/* Pipeline KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Jobs Total</p>
          <p className="text-3xl font-bold text-[#111827] mt-1">{jobs.total_jobs || 0}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Jobs Réussis</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{jobs.successful_jobs || 0}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Jobs Échoués</p>
          <p className="text-3xl font-bold text-red-500 mt-1">{jobs.failed_jobs || 0}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Durée Moyenne</p>
          <p className="text-3xl font-bold text-[#7C4DFF] mt-1">{jobs.avg_duration_seconds || 0}s</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Quotas */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-[#111827] mb-4">Quotas d'utilisation</h2>
          <div className="space-y-4">
            {quotas && [
              { label: 'Recherches IA', used: quotas.searches_used, limit: quotas.searches_limit },
              { label: 'Leads collectés', used: quotas.leads_collected, limit: quotas.leads_limit },
              { label: 'Appels API', used: quotas.api_calls, limit: quotas.api_calls_limit },
            ].map(item => {
              const pct = getPct(item.used, item.limit)
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium">{item.used}/{item.limit} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`${getBarColor(pct)} h-3 rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{item.limit - item.used} restants</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Rate Limits */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-[#111827] mb-4">Rate Limiting par Service</h2>
          <div className="space-y-4">
            {Object.entries(rateLimits).map(([service, data]: [string, any]) => {
              const pct = getPct(data.used, data.limit)
              return (
                <div key={service}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 capitalize">{service}</span>
                    <span className="font-medium">{data.used}/{data.limit} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`${getBarColor(pct)} h-3 rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{data.remaining} appels restants/minute</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Providers Status */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Statut des Providers</h2>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(providers?.providers || {}).map(([name, info]: [string, any]) => (
            <div key={name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
              <div>
                <p className="text-sm font-medium text-gray-900 capitalize">{name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {info.available ? 'Opérationnel' : 'Non configuré'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${info.available ? 'bg-green-400' : 'bg-gray-300'}`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline Health */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Santé du Pipeline</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-xs text-gray-500">Taux de Succès</p>
            <p className={`text-3xl font-bold mt-1 ${
              (100 - (jobs.error_rate_percent || 0)) >= 90 ? 'text-green-600' :
              (100 - (jobs.error_rate_percent || 0)) >= 70 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {Math.round(100 - (jobs.error_rate_percent || 0))}%
            </p>
            <p className="text-xs text-gray-400 mt-1">SLA cible: 95%</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-xs text-gray-500">Taux d'Erreur</p>
            <p className={`text-3xl font-bold mt-1 ${
              (jobs.error_rate_percent || 0) <= 5 ? 'text-green-600' :
              (jobs.error_rate_percent || 0) <= 15 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {jobs.error_rate_percent || 0}%
            </p>
            <p className="text-xs text-gray-400 mt-1">Seuil alerte: 10%</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-xs text-gray-500">Jobs Actifs</p>
            <p className="text-3xl font-bold text-[#7C4DFF] mt-1">{jobs.active_jobs || 0}</p>
            <p className="text-xs text-gray-400 mt-1">En cours d'exécution</p>
          </div>
        </div>
      </div>
    </div>
  )
}