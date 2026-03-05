'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const COMPANY_ID = '11111111-1111-1111-1111-111111111111'

export default function SegmentsPage() {
  const [segments, setSegments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })

  useEffect(() => { fetchSegments() }, [])

  async function fetchSegments() {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/leads/segments/list?company_id=${COMPANY_ID}`)
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
      const res = await fetch(`${API_URL}/leads/segments/create?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail)
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
    try {
      const res = await fetch(`${API_URL}/leads/segments/${segmentId}?company_id=${COMPANY_ID}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Segment supprimé')
      fetchSegments()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  if (loading) return (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E1306C] mx-auto"></div>
      <p className="mt-4 text-gray-500">Chargement...</p>
    </div>
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Segments</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D] transition-colors">
          + Nouveau Segment
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#111827]">Créer un segment</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input type="text" required
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Leads chauds, Prospects LinkedIn..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={2}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez ce segment..." />
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

      <p className="text-sm text-gray-500 mb-4">{segments.length} segment(s)</p>

      {segments.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400 mb-4">Aucun segment créé</p>
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D]">
            Créer mon premier segment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map(segment => (
            <div key={segment.segment_id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-[#111827]">{segment.name}</h3>
                <button onClick={() => handleDelete(segment.segment_id)}
                  className="text-red-400 hover:text-red-600 text-sm">
                  Supprimer
                </button>
              </div>
              {segment.description && (
                <p className="text-sm text-gray-500 mb-3">{segment.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs bg-[#E1306C]/10 text-[#E1306C] px-2 py-1 rounded-full">
                  {segment.lead_count} lead(s)
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(segment.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}