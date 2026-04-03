'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const COMPANY_ID = '11111111-1111-1111-1111-111111111111'

export default function ModifierLeadPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_job_title: '',
    company_name: '',
    source: '',
    status: 'new',
    rating: '',
    priority: 'medium',
    score: 0,
    estimated_value: 0,
    probability: 0,
    crm_notes: '',
    next_action: '',
    lost_reason: '',
    industry: '',
    website: '',
    linkedin_url: '',
    company_size: '',
  })

  useEffect(() => { fetchLead() }, [id])

  async function fetchLead() {
    try {
      const res = await fetch(`${API_URL}/leads/${id}?company_id=${COMPANY_ID}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail)
      const lead = json.data
      setFormData({
        customer_name: lead.customer_name || '',
        customer_email: lead.customer_email || '',
        customer_phone: lead.customer_phone || '',
        customer_job_title: lead.customer_job_title || '',
        company_name: lead.company_name || '',
        source: lead.source || '',
        status: lead.status || 'new',
        rating: lead.rating || '',
        priority: lead.priority || 'medium',
        score: lead.score || 0,
        estimated_value: lead.estimated_value || 0,
        probability: lead.probability || 0,
        crm_notes: lead.crm_notes || '',
        next_action: lead.next_action || '',
        lost_reason: lead.lost_reason || '',
        industry: lead.industry || '',
        website: lead.website || '',
        linkedin_url: lead.linkedin_url || '',
        company_size: lead.company_size || '',
      })
    } catch {
      toast.error('Lead introuvable')
      router.push('/leads')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/leads/${id}?company_id=${COMPANY_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail)
      toast.success('Lead modifié avec succès!')
      setTimeout(() => router.push(`/leads/${id}`), 1500)
    } catch {
      toast.error('Erreur lors de la modification')
    } finally {
      setSaving(false)
    }
  }

  const update = (field: string, value: any) => setFormData({ ...formData, [field]: value })

  if (loading) return (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C4DFF] mx-auto"></div>
      <p className="mt-4 text-gray-500">Chargement...</p>
    </div>
  )

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Modifier le Lead</h1>
        <a href={`/leads/${id}`} className="text-[#7C4DFF] hover:underline">← Retour</a>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
            <input type="text" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              value={formData.customer_name} onChange={(e) => update('customer_name', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              value={formData.customer_email} onChange={(e) => update('customer_email', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="tel" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              value={formData.customer_phone} onChange={(e) => update('customer_phone', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poste / Fonction</label>
            <input type="text" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              value={formData.customer_job_title} onChange={(e) => update('customer_job_title', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
            <input type="text" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              value={formData.company_name} onChange={(e) => update('company_name', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              value={formData.source} onChange={(e) => update('source', e.target.value)}>
              <option value="">Non défini</option>
              <option value="manual">Manuel</option>
              <option value="website">Site web</option>
              <option value="linkedin">LinkedIn</option>
              <option value="referral">Référence</option>
              <option value="cold_call">Appel à froid</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              value={formData.status} onChange={(e) => update('status', e.target.value)}>
              <option value="new">Nouveau</option>
              <option value="contacted">Contacté</option>
              <option value="qualified">Qualifié</option>
              <option value="proposal">Proposition</option>
              <option value="negotiation">Négociation</option>
              <option value="converted">Converti</option>
              <option value="lost">Perdu</option>
              <option value="unqualified">Non qualifié</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              value={formData.rating} onChange={(e) => update('rating', e.target.value)}>
              <option value="">Non défini</option>
              <option value="cold">❄️ Froid</option>
              <option value="warm">⚡ Moyen</option>
              <option value="hot">🔥 Chaud</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
            <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              value={formData.priority} onChange={(e) => update('priority', e.target.value)}>
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Score (0-100)</label>
            <input type="number" min="0" max="100" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              value={formData.score} onChange={(e) => update('score', parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valeur estimée (€)</label>
            <input type="number" min="0" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              value={formData.estimated_value} onChange={(e) => update('estimated_value', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Probabilité (%)</label>
            <input type="number" min="0" max="100" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              value={formData.probability} onChange={(e) => update('probability', parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
            <input type="text" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              value={formData.industry} onChange={(e) => update('industry', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
            <input type="text" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              value={formData.website} onChange={(e) => update('website', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prochaine action</label>
          <input type="text" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
            value={formData.next_action} onChange={(e) => update('next_action', e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes CRM</label>
          <textarea rows={3} className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
            value={formData.crm_notes} onChange={(e) => update('crm_notes', e.target.value)} />
        </div>

        {formData.status === 'lost' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Raison de la perte</label>
            <input type="text" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              value={formData.lost_reason} onChange={(e) => update('lost_reason', e.target.value)} />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="px-6 py-2 bg-[#7C4DFF] text-white rounded-lg hover:bg-[#FD1D1D] disabled:opacity-50">
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          <a href={`/leads/${id}`} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            Annuler
          </a>
        </div>
      </form>
    </div>
  )
}