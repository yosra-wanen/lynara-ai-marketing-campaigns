'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function LeadDetailPage() {
  const { companyId: COMPANY_ID } = useAuth()
  const { id } = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newActivity, setNewActivity] = useState({ activity_type: 'call', description: '' })
  const [addingActivity, setAddingActivity] = useState(false)
  const [showActivityForm, setShowActivityForm] = useState(false)

  useEffect(() => { fetchLead() }, [id])

  async function fetchLead() {
    try {
      const [leadRes, activitiesRes] = await Promise.all([
        fetch(`${API_URL}/leads/${id}?company_id=${COMPANY_ID}`),
        fetch(`${API_URL}/leads/${id}/activities?company_id=${COMPANY_ID}`)
      ])
      const leadJson = await leadRes.json()
      const activitiesJson = await activitiesRes.json()
      if (!leadRes.ok) throw new Error(leadJson.detail)
      setLead(leadJson.data)
      setActivities(activitiesJson.data || [])
    } catch {
      toast.error('Lead introuvable')
      router.push('/leads')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault()
    setAddingActivity(true)
    try {
      const res = await fetch(`${API_URL}/leads/${id}/activities?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newActivity)
      })
      if (!res.ok) throw new Error()
      toast.success('Activité ajoutée!')
      setNewActivity({ activity_type: 'call', description: '' })
      setShowActivityForm(false)
      fetchLead()
    } catch {
      toast.error('Erreur lors de l\'ajout')
    } finally {
      setAddingActivity(false)
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
    const map: any = {
      new: 'Nouveau', contacted: 'Contacté', qualified: 'Qualifié',
      proposal: 'Proposition', negotiation: 'Négociation',
      converted: 'Converti', lost: 'Perdu', unqualified: 'Non qualifié'
    }
    return map[status] || status
  }

  const getActivityIcon = (type: string) => {
    const map: any = {
      created: '✨', updated: '✏️', enriched: '💎',
      status_changed: '🔄', note_added: '📝',
      call: '📞', email: '📧', meeting: '🤝'
    }
    return map[type] || '📌'
  }

  const getActivityLabel = (type: string) => {
    const map: any = {
      created: 'Lead créé', updated: 'Lead modifié', enriched: 'Lead enrichi',
      status_changed: 'Statut modifié', note_added: 'Note ajoutée',
      call: 'Appel téléphonique', email: 'Email envoyé', meeting: 'Réunion'
    }
    return map[type] || type
  }

  if (loading) return (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C4DFF] mx-auto"></div>
      <p className="mt-4 text-gray-500">Chargement...</p>
    </div>
  )

  if (!lead) return null

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">{lead.customer_name || 'Lead sans nom'}</h1>
        <div className="flex gap-2">
          <a href={`/leads/${id}/modifier`}
            className="px-4 py-2 bg-[#7C4DFF] text-white rounded-lg hover:bg-[#FD1D1D]">
            Modifier
          </a>
          <a href="/leads" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            ← Retour
          </a>
        </div>
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
          <p className="font-medium text-2xl text-[#7C4DFF]">{lead.score || 0}<span className="text-sm text-gray-400">/100</span></p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Valeur estimée</p>
          <p className="font-medium">{lead.estimated_value ? `${lead.estimated_value} €` : '-'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-[#111827] border-b pb-2 mb-4">Informations de contact</h2>
            <div className="space-y-3">
              {[
                { label: 'Nom', value: lead.customer_name },
                { label: 'Email', value: lead.customer_email },
                { label: 'Téléphone', value: lead.customer_phone },
                { label: 'Poste', value: lead.customer_job_title },
                { label: 'Entreprise', value: lead.company_name },
                { label: 'Secteur', value: lead.industry },
                { label: 'Site web', value: lead.website },
                { label: 'LinkedIn', value: lead.linkedin_url },
                { label: 'Source', value: lead.source },
                { label: 'Priorité', value: lead.priority },
                { label: 'Probabilité', value: lead.probability ? `${lead.probability}%` : null },
                { label: 'Ville', value: lead.billing_city },
                { label: 'Pays', value: lead.billing_country },
              ].map(item => item.value ? (
                <div key={item.label} className="flex justify-between">
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="text-sm text-gray-800">{item.value}</p>
                </div>
              ) : null)}
            </div>
            {lead.crm_notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-400 mb-1">Notes CRM</p>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">{lead.crm_notes}</p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t text-xs text-gray-400">
              Créé le {new Date(lead.created_at).toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h2 className="text-lg font-semibold text-[#111827]">Historique des activités</h2>
              <button onClick={() => setShowActivityForm(!showActivityForm)}
                className="text-xs px-3 py-1 bg-[#7C4DFF] text-white rounded-lg hover:bg-[#FD1D1D]">
                + Ajouter
              </button>
            </div>

            {showActivityForm && (
              <form onSubmit={handleAddActivity} className="mb-4 p-3 bg-gray-50 rounded-lg space-y-2">
                <select
                  className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
                  value={newActivity.activity_type}
                  onChange={(e) => setNewActivity({ ...newActivity, activity_type: e.target.value })}>
                  <option value="call">📞 Appel téléphonique</option>
                  <option value="email">📧 Email envoyé</option>
                  <option value="meeting">🤝 Réunion</option>
                  <option value="note_added">📝 Note</option>
                </select>
                <textarea rows={2} required
                  className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
                  placeholder="Description..."
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })} />
                <div className="flex gap-2">
                  <button type="submit" disabled={addingActivity}
                    className="px-3 py-1 bg-[#7C4DFF] text-white text-sm rounded-lg disabled:opacity-50">
                    {addingActivity ? 'Ajout...' : 'Ajouter'}
                  </button>
                  <button type="button" onClick={() => setShowActivityForm(false)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg">
                    Annuler
                  </button>
                </div>
              </form>
            )}

            {activities.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Aucune activité enregistrée</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activities.map((activity: any) => (
                  <div key={activity.activity_id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#7C4DFF]/10 flex items-center justify-center text-sm flex-shrink-0">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{getActivityLabel(activity.activity_type)}</p>
                      {activity.description && (
                        <p className="text-xs text-gray-500">{activity.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.created_at).toLocaleDateString('fr-FR')} à {new Date(activity.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}