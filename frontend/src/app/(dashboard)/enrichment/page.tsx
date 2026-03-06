'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const COMPANY_ID = '11111111-1111-1111-1111-111111111111'

export default function EnrichmentPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [enriching, setEnriching] = useState(false)
  const [formData, setFormData] = useState({
    industry: '',
    website: '',
    linkedin_url: '',
    company_size: '',
    annual_revenue: '',
    billing_city: '',
    billing_country: '',
    customer_job_title: '',
    twitter_url: '',
    facebook_url: '',
  })

  useEffect(() => { fetchLeads() }, [])

  async function fetchLeads() {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/leads/?company_id=${COMPANY_ID}&limit=100`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail)
      setLeads(json.data || [])
    } catch {
      toast.error('Erreur lors du chargement des leads')
    } finally {
      setLoading(false)
    }
  }

  function selectLead(lead: any) {
    setSelectedLead(lead)
    setFormData({
      industry: lead.industry || '',
      website: lead.website || '',
      linkedin_url: lead.linkedin_url || '',
      company_size: lead.company_size || '',
      annual_revenue: lead.annual_revenue || '',
      billing_city: lead.billing_city || '',
      billing_country: lead.billing_country || '',
      customer_job_title: lead.customer_job_title || '',
      twitter_url: lead.twitter_url || '',
      facebook_url: lead.facebook_url || '',
    })
  }

  async function handleEnrich(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLead) return
    setEnriching(true)
    try {
      const res = await fetch(`${API_URL}/leads/${selectedLead.lead_id}/enrich?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : null
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail)
      toast.success('Lead enrichi avec succès!')
      setSelectedLead(null)
      fetchLeads()
    } catch {
      toast.error('Erreur lors de l\'enrichissement')
    } finally {
      setEnriching(false)
    }
  }

  const update = (field: string, value: string) => setFormData({ ...formData, [field]: value })

  if (loading) return (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E1306C] mx-auto"></div>
      <p className="mt-4 text-gray-500">Chargement...</p>
    </div>
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Enrichissement des Leads</h1>
        <p className="text-sm text-gray-500 mt-1">Complétez les informations manquantes de vos leads</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-[#111827] mb-4">Sélectionner un lead</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {leads.map(lead => (
              <div
                key={lead.lead_id}
                onClick={() => selectLead(lead)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedLead?.lead_id === lead.lead_id
                    ? 'border-[#E1306C] bg-[#E1306C]/5'
                    : 'border-gray-200 bg-white hover:border-[#E1306C]/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{lead.customer_name || 'Sans nom'}</p>
                    <p className="text-xs text-gray-500">{lead.customer_email || '-'}</p>
                    <p className="text-xs text-gray-400">{lead.company_name || '-'}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-1 flex-wrap justify-end">
                      {!lead.industry && <span className="text-xs bg-orange-100 text-orange-600 px-1 rounded">secteur</span>}
                      {!lead.website && <span className="text-xs bg-orange-100 text-orange-600 px-1 rounded">site web</span>}
                      {!lead.linkedin_url && <span className="text-xs bg-orange-100 text-orange-600 px-1 rounded">linkedin</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {!selectedLead ? (
            <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center h-full flex flex-col items-center justify-center">
              <p className="text-gray-400">Sélectionnez un lead à enrichir</p>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-[#111827] mb-4">
                Enrichir: {selectedLead.customer_name || 'Sans nom'}
              </h2>
              <form onSubmit={handleEnrich} className="bg-white rounded-lg border p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
                    <input type="text" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                      value={formData.industry} onChange={(e) => update('industry', e.target.value)}
                      placeholder="Ex: Technologie, Immobilier..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                    <input type="text" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                      value={formData.website} onChange={(e) => update('website', e.target.value)}
                      placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                    <input type="text" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                      value={formData.linkedin_url} onChange={(e) => update('linkedin_url', e.target.value)}
                      placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Taille entreprise</label>
                    <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                      value={formData.company_size} onChange={(e) => update('company_size', e.target.value)}>
                      <option value="">Non défini</option>
                      <option value="1-10">1-10 employés</option>
                      <option value="11-50">11-50 employés</option>
                      <option value="51-200">51-200 employés</option>
                      <option value="201-500">201-500 employés</option>
                      <option value="500+">500+ employés</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                    <input type="text" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                      value={formData.billing_city} onChange={(e) => update('billing_city', e.target.value)}
                      placeholder="Ex: Tunis, Paris..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                    <input type="text" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                      value={formData.billing_country} onChange={(e) => update('billing_country', e.target.value)}
                      placeholder="Ex: Tunisie, France..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Poste</label>
                    <input type="text" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                      value={formData.customer_job_title} onChange={(e) => update('customer_job_title', e.target.value)}
                      placeholder="Ex: Directeur Commercial..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Revenu annuel (€)</label>
                    <input type="number" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                      value={formData.annual_revenue} onChange={(e) => update('annual_revenue', e.target.value)}
                      placeholder="Ex: 500000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                    <input type="text" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                      value={formData.twitter_url} onChange={(e) => update('twitter_url', e.target.value)}
                      placeholder="https://twitter.com/..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                    <input type="text" className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                      value={formData.facebook_url} onChange={(e) => update('facebook_url', e.target.value)}
                      placeholder="https://facebook.com/..." />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={enriching}
                    className="px-6 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D] disabled:opacity-50">
                    {enriching ? 'Enrichissement...' : '✨ Enrichir le lead'}
                  </button>
                  <button type="button" onClick={() => setSelectedLead(null)}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}