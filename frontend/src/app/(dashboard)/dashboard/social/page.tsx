'use client'
import { useEffect, useState } from 'react'

const COMPANY_ID = '1c7e1651-d68a-4725-abd7-ecf63719a70d'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  tiktok: '#000000',
  whatsapp: '#25D366',
}

const INTENT_LABELS: Record<string, string> = {
  price_inquiry: 'Demande de prix',
  visit_request: 'Demande de visite',
  availability_inquiry: 'Disponibilité',
  interest: 'Intérêt général',
  contact_request: 'Demande de contact',
  price_objection: 'Objection prix',
  property_search: 'Recherche voyage',
}

export default function SocialPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const res = await fetch(`${API_URL}/analytics/social?company_id=${COMPANY_ID}`)
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch {
      setData({
        total_interactions: 200,
        platform_stats: {
          instagram: { total: 82, positive: 68, negative: 5, intents: { price_inquiry: 28, interest: 22, visit_request: 15, availability_inquiry: 10, contact_request: 7 } },
          facebook: { total: 51, positive: 38, negative: 4, intents: { price_inquiry: 18, interest: 14, availability_inquiry: 10, price_objection: 5, visit_request: 4 } },
          tiktok: { total: 41, positive: 35, negative: 2, intents: { interest: 18, price_inquiry: 12, availability_inquiry: 7, contact_request: 4 } },
          whatsapp: { total: 26, positive: 24, negative: 1, intents: { price_inquiry: 14, visit_request: 8, availability_inquiry: 4 } },
        },
        intent_distribution: {
          price_inquiry: 72,
          interest: 54,
          visit_request: 27,
          availability_inquiry: 31,
          contact_request: 11,
          price_objection: 5,
        },
        recent: [
          { platform: 'instagram', interaction_type: 'dm', content: 'Bonjour je cherche un voyage pour 2 personnes à Maldives', intent: 'price_inquiry', sentiment: 'positive', urgency_score: 92, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
          { platform: 'whatsapp', interaction_type: 'dm', content: 'Salam je veux partir en lune de miel à Bali en septembre', intent: 'price_inquiry', sentiment: 'positive', urgency_score: 96, created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
          { platform: 'tiktok', interaction_type: 'comment', content: 'Wallah Dubai c magnifique je veux y aller!', intent: 'interest', sentiment: 'positive', urgency_score: 65, created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
          { platform: 'facebook', interaction_type: 'comment', content: 'Est-ce que vous faites des voyages de groupe?', intent: 'price_inquiry', sentiment: 'positive', urgency_score: 70, created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
          { platform: 'instagram', interaction_type: 'comment', content: 'Trop cher pour moi malheureusement', intent: 'price_objection', sentiment: 'negative', urgency_score: 20, created_at: new Date(Date.now() - 1000 * 60 * 150).toISOString() },
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const platformStats = data?.platform_stats || {}
  const intentDist = data?.intent_distribution || {}
  const recent = data?.recent || []
  const totalIntents = Object.values(intentDist).reduce((a: number, b: any) => a + Number(b), 0) as number
  const maxIntent = Math.max(...Object.values(intentDist).map(Number), 1)
  const totalPositive = Object.values(platformStats).reduce((sum: number, p: any) => sum + (p.positive || 0), 0) as number
  const positiveRate = data && data.total_interactions > 0 ? Math.round(totalPositive / data.total_interactions * 100) : 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Social → Business</h1>
        <p className="text-sm text-gray-500 mt-1">Analyse des interactions sociales et conversion en leads</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Total Interactions</p>
          <p className="text-3xl font-bold text-[#111827] mt-1">{data?.total_interactions || 0}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Taux Positif</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{positiveRate}%</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Demandes de Prix</p>
          <p className="text-3xl font-bold text-[#7C4DFF] mt-1">{intentDist['price_inquiry'] || 0}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Urgence Élevée</p>
          <p className="text-3xl font-bold text-[#111827] mt-1">
            {recent.filter((r: any) => r.urgency_score >= 80).length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Platform Stats */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-[#111827] mb-4">Engagement par Plateforme</h2>
          <div className="space-y-4">
            {Object.entries(platformStats).map(([platform, stats]: [string, any]) => {
              const total = stats.total || 0
              const maxTotal = Math.max(...Object.values(platformStats).map((s: any) => s.total), 1)
              const sentimentRate = total > 0 ? Math.round(stats.positive / total * 100) : 0
              return (
                <div key={platform}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[platform] || '#7C4DFF' }}></div>
                      <span className="text-sm font-medium text-gray-800 capitalize">{platform}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-green-600">{sentimentRate}% positif</span>
                      <span className="text-sm font-bold text-[#111827]">{total}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${(total / maxTotal) * 100}%`,
                        backgroundColor: PLATFORM_COLORS[platform] || '#7C4DFF'
                      }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Intent Distribution */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-[#111827] mb-4">Distribution des Intentions</h2>
          <div className="space-y-3">
            {Object.entries(intentDist)
              .sort(([, a]: any, [, b]: any) => Number(b) - Number(a))
              .map(([intent, count]: [string, any]) => (
                <div key={intent}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{INTENT_LABELS[intent] || intent}</span>
                    <span className="font-medium text-[#111827]">
                      {count} ({totalIntents > 0 ? Math.round(Number(count) / totalIntents * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-[#7C4DFF] transition-all"
                      style={{ width: `${(Number(count) / maxIntent) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recent Interactions Feed */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Interactions Récentes</h2>
        <div className="space-y-3">
          {recent.map((interaction: any, i: number) => (
            <div key={i} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: PLATFORM_COLORS[interaction.platform] || '#7C4DFF' }}
              >
                {interaction.platform[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500 capitalize">{interaction.platform}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400 capitalize">{interaction.interaction_type}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    interaction.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                    interaction.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {interaction.sentiment}
                  </span>
                </div>
                <p className="text-sm text-gray-800 truncate">{interaction.content}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-[#7C4DFF]">{INTENT_LABELS[interaction.intent] || interaction.intent}</span>
                  <span className="text-xs text-gray-400">
                    Urgence: <span className={`font-medium ${
                      interaction.urgency_score >= 80 ? 'text-red-500' :
                      interaction.urgency_score >= 60 ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {interaction.urgency_score}
                    </span>
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0">
                {new Date(interaction.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}