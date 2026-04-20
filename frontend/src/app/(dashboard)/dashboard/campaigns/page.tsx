'use client'
import { useEffect, useState } from 'react'

const COMPANY_ID = '1c7e1651-d68a-4725-abd7-ecf63719a70d'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const CHANNEL_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  tiktok: '#000000',
  whatsapp: '#25D366',
  email: '#7C4DFF',
}

export default function CampaignsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('total_reach')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const res = await fetch(`${API_URL}/analytics/campaigns?company_id=${COMPANY_ID}`)
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch {
      setData({
        total_campaigns: 10,
        campaigns: [
          { campaign: 'Offre Été 2025 - Maldives', posts: 8, total_reach: 245000, total_likes: 18500, total_comments: 1200, total_shares: 4500, channel: 'instagram' },
          { campaign: 'Bali Découverte', posts: 6, total_reach: 312000, total_likes: 22300, total_comments: 1890, total_shares: 6700, channel: 'tiktok' },
          { campaign: 'Pack Dubai Luxe', posts: 7, total_reach: 189000, total_likes: 14200, total_comments: 890, total_shares: 3200, channel: 'instagram' },
          { campaign: 'Paris Romantique', posts: 5, total_reach: 178000, total_likes: 12800, total_comments: 780, total_shares: 2900, channel: 'tiktok' },
          { campaign: 'Santorini Premium', posts: 6, total_reach: 156000, total_likes: 11400, total_comments: 720, total_shares: 2600, channel: 'instagram' },
          { campaign: 'Newsletter Été 2025', posts: 3, total_reach: 72000, total_likes: 0, total_comments: 0, total_shares: 0, channel: 'email' },
          { campaign: 'Offre Famille Bali', posts: 4, total_reach: 98000, total_likes: 7800, total_comments: 450, total_shares: 1800, channel: 'whatsapp' },
          { campaign: 'Offre Ramadan Dubaï', posts: 3, total_reach: 87000, total_likes: 6500, total_comments: 380, total_shares: 1400, channel: 'whatsapp' },
          { campaign: 'Promo Automne 2025', posts: 4, total_reach: 112000, total_likes: 8900, total_comments: 560, total_shares: 2100, channel: 'facebook' },
          { campaign: 'Istanbul Express', posts: 3, total_reach: 67000, total_likes: 4800, total_comments: 290, total_shares: 980, channel: 'tiktok' },
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const campaigns = (data?.campaigns || []).sort((a: any, b: any) => b[sortBy] - a[sortBy])
  const totalReach = campaigns.reduce((sum: number, c: any) => sum + c.total_reach, 0)
  const totalLikes = campaigns.reduce((sum: number, c: any) => sum + c.total_likes, 0)
  const totalPosts = campaigns.reduce((sum: number, c: any) => sum + c.posts, 0)
  const maxReach = Math.max(...campaigns.map((c: any) => c.total_reach), 1)

  // A/B comparison — top 2 campaigns
  const topTwo = campaigns.slice(0, 2)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Performance des Campagnes</h1>
        <p className="text-sm text-gray-500 mt-1">Analyse des campagnes marketing multicanales — Tunisie Booking</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Total Campagnes</p>
          <p className="text-3xl font-bold text-[#111827] mt-1">{data?.total_campaigns || 0}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Portée Totale</p>
          <p className="text-3xl font-bold text-[#7C4DFF] mt-1">
            {totalReach > 1000 ? `${Math.round(totalReach / 1000)}K` : totalReach}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Total Likes</p>
          <p className="text-3xl font-bold text-[#111827] mt-1">
            {totalLikes > 1000 ? `${Math.round(totalLikes / 1000)}K` : totalLikes}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Total Posts</p>
          <p className="text-3xl font-bold text-[#111827] mt-1">{totalPosts}</p>
        </div>
      </div>

      {/* A/B Comparison */}
      {topTwo.length >= 2 && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-[#111827] mb-4">
            Comparaison A/B — Top 2 Campagnes
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {topTwo.map((camp: any, i: number) => (
              <div key={i} className={`p-4 rounded-xl border-2 ${i === 0 ? 'border-[#7C4DFF] bg-[#7C4DFF]/5' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${i === 0 ? 'bg-[#7C4DFF] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {i === 0 ? 'Variante A — Gagnante' : 'Variante B'}
                    </span>
                    <p className="text-sm font-semibold text-[#111827] mt-2">{camp.campaign}</p>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CHANNEL_COLORS[camp.channel] || '#7C4DFF' }}
                  ></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Portée', value: camp.total_reach > 1000 ? `${Math.round(camp.total_reach / 1000)}K` : camp.total_reach },
                    { label: 'Likes', value: camp.total_likes > 1000 ? `${Math.round(camp.total_likes / 1000)}K` : camp.total_likes },
                    { label: 'Commentaires', value: camp.total_comments },
                    { label: 'Partages', value: camp.total_shares },
                  ].map(item => (
                    <div key={item.label} className="bg-white rounded-lg p-2 text-center border">
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="text-lg font-bold text-[#111827]">{item.value}</p>
                    </div>
                  ))}
                </div>
                {i === 0 && (
                  <p className="text-xs text-[#7C4DFF] mt-3 font-medium">
                    +{Math.round((topTwo[0].total_reach / topTwo[1].total_reach - 1) * 100)}% de portée vs Variante B
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Table */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#111827]">Toutes les Campagnes</h2>
          <select
            className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="total_reach">Trier par Portée</option>
            <option value="total_likes">Trier par Likes</option>
            <option value="total_comments">Trier par Commentaires</option>
            <option value="total_shares">Trier par Partages</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Campagne</th>
                <th className="text-center text-xs font-medium text-gray-500 pb-3">Canal</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-3">Posts</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-3">Portée</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-3">Likes</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-3">Commentaires</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-3">Partages</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3 pl-4">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map((camp: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-3 text-sm font-medium text-gray-900">{camp.campaign}</td>
                  <td className="py-3 text-center">
                    <span
                      className="text-xs px-2 py-1 rounded-full text-white font-medium capitalize"
                      style={{ backgroundColor: CHANNEL_COLORS[camp.channel] || '#7C4DFF' }}
                    >
                      {camp.channel}
                    </span>
                  </td>
                  <td className="py-3 text-right text-sm text-gray-600">{camp.posts}</td>
                  <td className="py-3 text-right text-sm font-medium text-[#7C4DFF]">
                    {camp.total_reach > 1000 ? `${Math.round(camp.total_reach / 1000)}K` : camp.total_reach}
                  </td>
                  <td className="py-3 text-right text-sm text-gray-600">
                    {camp.total_likes > 1000 ? `${Math.round(camp.total_likes / 1000)}K` : camp.total_likes}
                  </td>
                  <td className="py-3 text-right text-sm text-gray-600">{camp.total_comments}</td>
                  <td className="py-3 text-right text-sm text-gray-600">{camp.total_shares}</td>
                  <td className="py-3 pl-4">
                    <div className="w-24 bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-[#7C4DFF]"
                        style={{ width: `${(camp.total_reach / maxReach) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}