'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const COMPANY_ID = '11111111-1111-1111-1111-111111111111'

export default function DeduplicationPage() {
  const [duplicates, setDuplicates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => { fetchDuplicates() }, [])

  async function fetchDuplicates() {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/leads/deduplicate?company_id=${COMPANY_ID}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail)
      const data = json.data
      setDuplicates(data?.duplicates || [])
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(leadId: string) {
    if (!confirm('Supprimer ce lead dupliqué ?')) return
    setDeleting(leadId)
    try {
      const res = await fetch(`${API_URL}/leads/deduplicate/${leadId}?company_id=${COMPANY_ID}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error()
      toast.success('Lead supprimé!')
      fetchDuplicates()
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E1306C] mx-auto"></div>
      <p className="mt-4 text-gray-500">Analyse en cours...</p>
    </div>
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Déduplication</h1>
          <p className="text-sm text-gray-500 mt-1">Détection automatique des leads en double</p>
        </div>
        <button onClick={fetchDuplicates}
          className="px-4 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D] transition-colors">
          🔄 Relancer l'analyse
        </button>
      </div>

      {duplicates.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-lg font-semibold text-gray-700">Aucun doublon détecté!</p>
          <p className="text-gray-400 mt-2">Tous vos leads sont uniques.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-gray-500">{duplicates.length} groupe(s) de doublons détecté(s)</p>

          {duplicates.map((group, index) => (
            <div key={index} className="bg-white rounded-lg border border-orange-200 overflow-hidden">
              <div className="bg-orange-50 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-orange-500">⚠️</span>
                  <span className="text-sm font-semibold text-orange-800">
                    Doublon par {group.match_type === 'email' ? 'Email' : 'Téléphone'}
                  </span>
                  <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
                    {group.match_value}
                  </span>
                </div>
                <span className="text-xs text-orange-600">{group.count} leads identiques</span>
              </div>

              <div className="divide-y divide-gray-100">
                {group.leads?.map((lead: any, i: number) => (
                  <div key={lead.lead_id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-green-500' : 'bg-orange-400'}`}>
                        {i === 0 ? '✓' : i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{lead.customer_name || 'Sans nom'}</p>
                        <p className="text-xs text-gray-500">{lead.customer_email || '-'} • {lead.customer_phone || '-'}</p>
                        <p className="text-xs text-gray-400">{lead.company_name || '-'} • Créé le {new Date(lead.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${i === 0 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {i === 0 ? 'Original' : 'Doublon'}
                      </span>
                      {i !== 0 && (
                        <button
                          onClick={() => handleDelete(lead.lead_id)}
                          disabled={deleting === lead.lead_id}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 disabled:opacity-50"
                        >
                          {deleting === lead.lead_id ? 'Suppression...' : 'Supprimer'}
                        </button>
                      )}
                      <a href={`/leads/${lead.lead_id}`}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200">
                        Voir
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}