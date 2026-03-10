'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const COMPANY_ID = '11111111-1111-1111-1111-111111111111'

async function fetchWithRetry(url: string, options?: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options)
      if (res.ok) return res
      if (i === retries - 1) return res
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw new Error('Max retries reached')
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'segments' | 'stats'>('segments')
  const segmentsPerPage = 6

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [segRes, leadsRes] = await Promise.all([
        fetchWithRetry(`${API_URL}/leads/segments/list?company_id=${COMPANY_ID}`),
        fetchWithRetry(`${API_URL}/leads/?company_id=${COMPANY_ID}&limit=100`)
      ])
      const segJson = await segRes.json()
      const leadsJson = await leadsRes.json()
      setSegments(segJson.data || [])
      setLeads(leadsJson.data || [])
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetchWithRetry(`${API_URL}/leads/segments/create?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error()
      toast.success('Segment créé!')
      setFormData({ name: '', description: '' })
      setShowForm(false)
      fetchData()
    } catch {
      toast.error('Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(segmentId: string) {
    if (!confirm('Supprimer ce segment ?')) return
    setDeleting(segmentId)
    try {
      const res = await fetchWithRetry(`${API_URL}/leads/segments/${segmentId}?company_id=${COMPANY_ID}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Segment supprimé!')
      fetchData()
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  const handleExport = () => {
    if (segments.length === 0) return toast.error('Aucun segment à exporter')
    const csv = segments.map(s =>
      `${s.name},${s.description || ''},${s.lead_count || 0},${new Date(s.created_at).toLocaleDateString('fr-FR')}`
    ).join('\n')
    const blob = new Blob([`Nom,Description,Leads,Date création\n${csv}`], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `segments-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Segments exportés!')
  }

  // Stats calculations
  const totalLeads = leads.length
  const hotLeads = leads.filter(l => l.rating === 'hot').length
  const warmLeads = leads.filter(l => l.rating === 'warm').length
  const coldLeads = leads.filter(l => l.rating === 'cold').length
  const newLeads = leads.filter(l => l.status === 'new').length
  const convertedLeads = leads.filter(l => l.status === 'converted').length
  const avgScore = totalLeads > 0 ? Math.round(leads.reduce((sum, l) => sum + (l.score || 0), 0) / totalLeads) : 0

  const statusStats = [
    { label: 'Nouveau', count: leads.filter(l => l.status === 'new').length, color: 'bg-gray-400' },
    { label: 'Contacté', count: leads.filter(l => l.status === 'contacted').length, color: 'bg-blue-400' },
    { label: 'Qualifié', count: leads.filter(l => l.status === 'qualified').length, color: 'bg-green-400' },
    { label: 'Proposition', count: leads.filter(l => l.status === 'proposal').length, color: 'bg-purple-400' },
    { label: 'Négociation', count: leads.filter(l => l.status === 'negotiation').length, color: 'bg-orange-400' },
    { label: 'Converti', count: leads.filter(l => l.status === 'converted').length, color: 'bg-emerald-400' },
    { label: 'Perdu', count: leads.filter(l => l.status === 'lost').length, color: 'bg-red-400' },
  ].filter(s => s.count > 0)

  const totalPages = Math.ceil(segments.length / segmentsPerPage)
  const paginatedSegments = segments.slice((currentPage - 1) * segmentsPerPage, currentPage * segmentsPerPage)

  if (loading) return (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E1306C] mx-auto"></div>
      <p className="mt-4 text-gray-500">Chargement...</p>
    </div>
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Segments <span className="text-sm font-normal text-gray-400">({segments.length})</span></h1>
          <p className="text-sm text-gray-500 mt-1">Organisez et analysez vos leads</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            📥 Exporter CSV
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D]">
            + Nouveau Segment
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button onClick={() => setActiveTab('segments')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'segments' ? 'border-[#E1306C] text-[#E1306C]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          📂 Segments
        </button>
        <button onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'stats' ? 'border-[#E1306C] text-[#E1306C]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          📊 Statistiques & Répartition
        </button>
      </div>

      {/* SEGMENTS TAB */}
      {activeTab === 'segments' && (
        <>
          {showForm && (
            <form onSubmit={handleCreate} className="bg-white rounded-lg border p-6 mb-6 space-y-4">
              <h2 className="text-lg font-semibold">Nouveau segment</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input type="text" required
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Leads Chauds..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                    value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description du segment..." />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={creating}
                  className="px-6 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D] disabled:opacity-50">
                  {creating ? 'Création...' : 'Créer'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Annuler
                </button>
              </div>
            </form>
          )}

          {segments.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
              <p className="text-4xl mb-4">📂</p>
              <p className="text-lg font-semibold text-gray-700">Aucun segment créé</p>
              <p className="text-gray-400 mt-2">Créez votre premier segment pour organiser vos leads</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                {paginatedSegments.map(segment => (
                  <div key={segment.segment_id} className="bg-white rounded-lg border p-5 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#E1306C]/10 flex items-center justify-center text-[#E1306C] font-bold text-lg">
                        {segment.name.charAt(0).toUpperCase()}
                      </div>
                      <button onClick={() => handleDelete(segment.segment_id)} disabled={deleting === segment.segment_id}
                        className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50">
                        {deleting === segment.segment_id ? '...' : 'Supprimer'}
                      </button>
                    </div>
                    <h3 className="font-semibold text-gray-900">{segment.name}</h3>
                    {segment.description && <p className="text-sm text-gray-500 mt-1">{segment.description}</p>}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400">{segment.lead_count || 0} lead(s)</span>
                      <span className="text-xs text-gray-400">{new Date(segment.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
                    className={`px-4 py-2 text-sm rounded-lg ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 hover:bg-gray-300'}`}>
                    ← Précédent
                  </button>
                  <span className="text-sm text-gray-500">Page {currentPage} sur {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
                    className={`px-4 py-2 text-sm rounded-lg ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 hover:bg-gray-300'}`}>
                    Suivant →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* STATS TAB */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border p-5">
              <p className="text-sm text-gray-500">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalLeads}</p>
              <p className="text-xs text-gray-400 mt-1">dans votre CRM</p>
            </div>
            <div className="bg-white rounded-lg border p-5">
              <p className="text-sm text-gray-500">Score Moyen</p>
              <p className="text-3xl font-bold text-[#E1306C] mt-1">{avgScore}</p>
              <p className="text-xs text-gray-400 mt-1">sur 100</p>
            </div>
            <div className="bg-white rounded-lg border p-5">
              <p className="text-sm text-gray-500">Convertis</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{convertedLeads}</p>
              <p className="text-xs text-gray-400 mt-1">{totalLeads > 0 ? Math.round(convertedLeads / totalLeads * 100) : 0}% du total</p>
            </div>
            <div className="bg-white rounded-lg border p-5">
              <p className="text-sm text-gray-500">Total Segments</p>
              <p className="text-3xl font-bold text-[#833AB4] mt-1">{segments.length}</p>
              <p className="text-xs text-gray-400 mt-1">segments créés</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Rating Distribution */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🌡️ Répartition par Temperature</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">🔥 Chaud</span>
                    <span className="font-medium">{hotLeads} leads ({totalLeads > 0 ? Math.round(hotLeads / totalLeads * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-red-400 h-3 rounded-full transition-all"
                      style={{ width: totalLeads > 0 ? `${hotLeads / totalLeads * 100}%` : '0%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">⚡ Moyen</span>
                    <span className="font-medium">{warmLeads} leads ({totalLeads > 0 ? Math.round(warmLeads / totalLeads * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-yellow-400 h-3 rounded-full transition-all"
                      style={{ width: totalLeads > 0 ? `${warmLeads / totalLeads * 100}%` : '0%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">❄️ Froid</span>
                    <span className="font-medium">{coldLeads} leads ({totalLeads > 0 ? Math.round(coldLeads / totalLeads * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-blue-400 h-3 rounded-full transition-all"
                      style={{ width: totalLeads > 0 ? `${coldLeads / totalLeads * 100}%` : '0%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Répartition par Statut</h2>
              {statusStats.length === 0 ? (
                <p className="text-gray-400 text-sm">Aucune donnée disponible</p>
              ) : (
                <div className="space-y-3">
                  {statusStats.map(stat => (
                    <div key={stat.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{stat.label}</span>
                        <span className="font-medium">{stat.count} ({totalLeads > 0 ? Math.round(stat.count / totalLeads * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`${stat.color} h-2 rounded-full transition-all`}
                          style={{ width: totalLeads > 0 ? `${stat.count / totalLeads * 100}%` : '0%' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Segments Table */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📂 Détail des Segments</h2>
            {segments.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucun segment créé</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Segment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leads</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date création</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {segments.map(segment => (
                    <tr key={segment.segment_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#E1306C]/10 flex items-center justify-center text-[#E1306C] font-bold text-sm">
                            {segment.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{segment.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{segment.description || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{segment.lead_count || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(segment.created_at).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}