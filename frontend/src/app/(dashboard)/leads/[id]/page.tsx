'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const COMPANY_ID = '11111111-1111-1111-1111-111111111111'

export default function LeadDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLead() }, [id])

  async function fetchLead() {
    try {
      const res = await fetch(`${API_URL}/leads/${id}?company_id=${COMPANY_ID}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail)
      setLead(json.data)
    } catch {
      toast.error('Lead introuvable')
      router.push('/leads')
    } finally {
      setLoading(false)
    }
  }

  const getRatingLabel = (rating: string) => {
    if (rating === 'hot') return '🔥 Chaud'
    if (rating === 'warm') return '⚡ Moyen'
    return '❄️ Froid'
  }

  const getRatingColor = (rating: string) => {
    if (rating === 'hot') return 'bg-red-100 text-red-800'
    if (rating === 'warm') return 'bg-yellow-100 text-yellow-800'
    return 'bg-blue-100 text-blue-800'
  }

  const getStatusLabel = (status: string) => {
    const map: any = { new: 'Nouveau', contacted: 'Contacté', qualified: 'Qualifié', proposal: 'Proposition', negotiation: 'Négociation', converted: 'Converti', lost: 'Perdu' }
    return map[status] || status
  }

  if (loading) return (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E1306C] mx-auto"></div>
      <p className="mt-4 text-gray-500">Chargement...</p>
    </div>
  )

  if (!lead) return null

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">{lead.customer_name || 'Lead sans nom'}</h1>
        <a href="/leads" className="text-[#E1306C] hover:underline">← Retour</a>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Statut</p>
          <p className="font-medium">{getStatusLabel(lead.status)}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Rating</p>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRatingColor(lead.rating)}`}>
            {getRatingLabel(lead.rating)}
          </span>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Score</p>
          <p className="font-medium text-2xl text-[#E1306C]">{lead.score || 0}<span className="text-sm text-gray-400">/100</span></p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Valeur estimée</p>
          <p className="font-medium">{lead.estimated_value ? `${lead.estimated_value} €` : '-'}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#111827] border-b pb-2">Informations de contact</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">Nom</p>
            <p className="text-sm">{lead.customer_name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">Email</p>
            <p className="text-sm">{lead.customer_email || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">Téléphone</p>
            <p className="text-sm">{lead.customer_phone || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">Poste</p>
            <p className="text-sm">{lead.customer_job_title || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">Entreprise</p>
            <p className="text-sm">{lead.company_name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">Source</p>
            <p className="text-sm">{lead.source || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">Priorité</p>
            <p className="text-sm">{lead.priority || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">Probabilité</p>
            <p className="text-sm">{lead.probability || 0}%</p>
          </div>
        </div>

        {lead.crm_notes && (
          <div className="pt-2">
            <p className="text-xs text-gray-400 uppercase mb-1">Notes CRM</p>
            <p className="text-sm bg-gray-50 p-3 rounded-lg">{lead.crm_notes}</p>
          </div>
        )}

        <div className="pt-2 text-xs text-gray-400">
          Créé le {new Date(lead.created_at).toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  )
}