'use client'
import { useEffect, useState } from 'react'

const COMPANY_ID = '1c7e1651-d68a-4725-abd7-ecf63719a70d'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function ExecutiveDashboard() {
  const [kpis, setKpis] = useState({
    total_leads: 0,
    converted: 0,
    conversion_rate: 0,
    total_revenue: 0,
    avg_deal_value: 0,
    cpl: 0,
  })
  const [funnel, setFunnel] = useState<any[]>([])
  const [channelData, setChannelData] = useState<any[]>([])
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch(`${API_URL}/analytics/executive?company_id=${COMPANY_ID}`)
      const json = await res.json()
      if (json.success) {
        setKpis(json.data.kpis)
        setFunnel(json.data.funnel)
        setChannelData(json.data.channels)
        setWeeklyData(json.data.weekly)
      }
    } catch {
      // Use hardcoded fallback data for demo
      setKpis({
        total_leads: 247,
        converted: 38,
        conversion_rate: 15.4,
        total_revenue: 342500,
        avg_deal_value: 9013,
        cpl: 45,
      })
      setFunnel([
        { stage: 'Leads créés', count: 247, color: '#7C4DFF' },
        { stage: 'Contactés', count: 189, color: '#8B5FF7' },
        { stage: 'Qualifiés', count: 124, color: '#A079FF' },
        { stage: 'Négociation', count: 67, color: '#B394FF' },
        { stage: 'Convertis', count: 38, color: '#6D3FEB' },
      ])
      setChannelData([
        { channel: 'Instagram', leads: 89, converted: 16, revenue: 128000, color: '#E1306C' },
        { channel: 'Facebook', leads: 54, converted: 9, revenue: 76500, color: '#1877F2' },
        { channel: 'TikTok', leads: 48, converted: 6, revenue: 52000, color: '#000000' },
        { channel: 'WhatsApp', leads: 34, converted: 5, revenue: 48000, color: '#25D366' },
        { channel: 'Email', leads: 22, converted: 2, revenue: 38000, color: '#7C4DFF' },
      ])
      setWeeklyData([
        { week: 'S1', leads: 18, converted: 3 },
        { week: 'S2', leads: 24, converted: 4 },
        { week: 'S3', leads: 31, converted: 5 },
        { week: 'S4', leads: 28, converted: 4 },
        { week: 'S5', leads: 35, converted: 6 },
        { week: 'S6', leads: 42, converted: 7 },
        { week: 'S7', leads: 38, converted: 5 },
        { week: 'S8', leads: 31, converted: 4 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const maxFunnel = funnel[0]?.count || 1
  const maxWeekly = Math.max(...weeklyData.map(w => w.leads), 1)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Tableau de bord Exécutif</h1>
        <p className="text-sm text-gray-500 mt-1">
          Vue d'ensemble des performances — Tunisie Booking
        </p>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500">Total Leads</p>
            <p className="text-3xl font-bold text-[#111827] mt-1">{kpis.total_leads}</p>
            <p className="text-xs text-green-600 mt-1">+12% vs mois dernier</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500">Leads Convertis</p>
            <p className="text-3xl font-bold text-[#7C4DFF] mt-1">{kpis.converted}</p>
            <p className="text-xs text-green-600 mt-1">+8% vs mois dernier</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500">Taux de Conversion</p>
            <p className="text-3xl font-bold text-[#111827] mt-1">{kpis.conversion_rate}%</p>
            <p className="text-xs text-green-600 mt-1">+2.1% vs mois dernier</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500">Revenu Total</p>
            <p className="text-3xl font-bold text-[#7C4DFF] mt-1">
              {kpis.total_revenue.toLocaleString()} TND
            </p>
            <p className="text-xs text-green-600 mt-1">+18% vs mois dernier</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500">Valeur Moyenne Deal</p>
            <p className="text-3xl font-bold text-[#111827] mt-1">
              {kpis.avg_deal_value.toLocaleString()} TND
            </p>
            <p className="text-xs text-gray-400 mt-1">Par conversion</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500">Coût par Lead (CPL)</p>
            <p className="text-3xl font-bold text-[#111827] mt-1">{kpis.cpl} TND</p>
            <p className="text-xs text-green-600 mt-1">-5% vs mois dernier</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Funnel Chart */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-[#111827] mb-6">
            Funnel de Conversion
          </h2>
          <div className="space-y-3">
            {funnel.map((stage, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{stage.stage}</span>
                  <span className="font-semibold text-[#111827]">{stage.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-8 relative overflow-hidden">
                  <div
                    className="h-8 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                    style={{
                      width: `${(stage.count / maxFunnel) * 100}%`,
                      backgroundColor: stage.color,
                    }}
                  >
                    <span className="text-white text-xs font-medium">
                      {Math.round((stage.count / maxFunnel) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Evolution */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-[#111827] mb-6">
            Évolution Hebdomadaire
          </h2>
          <div className="flex items-end gap-2 h-40">
            {weeklyData.map((week, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5">
                  <div
                    className="w-full rounded-t-sm bg-[#7C4DFF] transition-all duration-500"
                    style={{ height: `${(week.leads / maxWeekly) * 120}px` }}
                    title={`${week.leads} leads`}
                  ></div>
                  <div
                    className="w-full rounded-t-sm bg-[#6D3FEB] opacity-60"
                    style={{ height: `${(week.converted / maxWeekly) * 120}px` }}
                    title={`${week.converted} convertis`}
                  ></div>
                </div>
                <span className="text-xs text-gray-400">{week.week}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#7C4DFF]"></div>
              <span className="text-xs text-gray-500">Leads</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#6D3FEB] opacity-60"></div>
              <span className="text-xs text-gray-500">Convertis</span>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Performance */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-6">
          Performance par Canal
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Canal</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-3">Leads</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-3">Convertis</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-3">Taux</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-3">Revenu</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3 pl-4">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {channelData.map((ch, i) => {
                const rate = Math.round((ch.converted / ch.leads) * 100)
                const maxRevenue = Math.max(...channelData.map(c => c.revenue))
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ch.color }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900">{ch.channel}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-sm text-gray-600">{ch.leads}</td>
                    <td className="py-3 text-right text-sm text-gray-600">{ch.converted}</td>
                    <td className="py-3 text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        rate >= 20 ? 'bg-green-100 text-green-700' :
                        rate >= 10 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {rate}%
                      </span>
                    </td>
                    <td className="py-3 text-right text-sm font-medium text-[#7C4DFF]">
                      {ch.revenue.toLocaleString()} TND
                    </td>
                    <td className="py-3 pl-4">
                      <div className="w-32 bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-[#7C4DFF]"
                          style={{ width: `${(ch.revenue / maxRevenue) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}