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
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const segmentsPerPage = 6

  useEffect(() => { fetchSegments() }, [])

  async function fetchSegments() {
    try {
      setLoading(true)
      const res = await fetchWithRetry(`${API_URL}/leads/segments/list?company_id=${COMPANY_ID}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail)
      setSegments(json.data || [])
    } catch {
      toast.error('Erreur lors du chargement des segments')
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
      fetchSegments()
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
      fetchSegments()
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

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
          <p className="text-sm text-gray-500 mt-1">Organisez vos leads en groupes ciblés</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D]">
          + Nouveau Segment
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold">Nouveau segment</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input type="text" required className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Leads Chauds..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
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
    </div>
  )
}