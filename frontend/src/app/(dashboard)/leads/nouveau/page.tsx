'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const COMPANY_ID = '11111111-1111-1111-1111-111111111111'

export default function NouveauLeadPage() {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_job_title: '',
    company_name: '',
    source: 'manual',
    status: 'new',
    rating: '',
    priority: 'medium',
    score: 0,
    estimated_value: 0,
    crm_notes: '',
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/leads/?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail)
      toast.success('Lead créé avec succès!')
      setTimeout(() => router.push('/leads'), 1500)
    } catch (error) {
      toast.error('Erreur lors de la création du lead')
    } finally {
      setLoading(false)
    }
  }

  const update = (field: string, value: any) => setFormData({ ...formData, [field]: value })

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Nouveau Lead</h1>
        <a href="/leads" className="text-[#E1306C] hover:underline">← Retour</a>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
            <input type="text" required className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
              value={formData.customer_name} onChange={(e) => update('customer_name', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
              value={formData.customer_email} onChange={(e) => update('customer_email', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="tel" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
              value={formData.customer_phone} onChange={(e) => update('customer_phone', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poste / Fonction</label>
            <input type="text" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
              value={formData.customer_job_title} onChange={(e) => update('customer_job_title', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
            <input type="text" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
              value={formData.company_name} onChange={(e) => update('company_name', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
              value={formData.source} onChange={(e) => update('source', e.target.value)}>
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
            <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
              value={formData.status} onChange={(e) => update('status', e.target.value)}>
              <option value="new">Nouveau</option>
              <option value="contacted">Contacté</option>
              <option value="qualified">Qualifié</option>
              <option value="proposal">Proposition</option>
              <option value="negotiation">Négociation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
              value={formData.rating} onChange={(e) => update('rating', e.target.value)}>
              <option value="">Non défini</option>
              <option value="cold">❄️ Froid</option>
              <option value="warm">⚡ Moyen</option>
              <option value="hot">🔥 Chaud</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
            <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
              value={formData.priority} onChange={(e) => update('priority', e.target.value)}>
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valeur estimée (€)</label>
            <input type="number" min="0" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
              value={formData.estimated_value} onChange={(e) => update('estimated_value', parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes CRM</label>
          <textarea rows={3} className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
            value={formData.crm_notes} onChange={(e) => update('crm_notes', e.target.value)} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="px-6 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D] disabled:opacity-50">
            {loading ? 'Création...' : 'Créer le lead'}
          </button>
          <a href="/leads" className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            Annuler
          </a>
        </div>
      </form>
    </div>
  )
}