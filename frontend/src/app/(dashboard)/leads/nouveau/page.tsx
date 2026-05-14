'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const AI_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'

export default function NouveauLeadPage() {
  const { companyId: COMPANY_ID } = useAuth()
  const [activeTab, setActiveTab] = useState<'manual' | 'csv'>('manual')
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
  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [aiSuggested, setAiSuggested] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const router = useRouter()

  async function handleAiSuggest() {
    if (!formData.company_name && !formData.customer_name) {
      return toast.error('Entrez au moins un nom ou une entreprise pour obtenir des suggestions IA')
    }
    setAiSuggesting(true)
    setAiSuggested(false)
    try {
      const res = await fetch(`${AI_URL}/ai-orchestration/lead-research?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: formData.company_name || formData.customer_name,
          location: '',
          industry: '',
          volume: 1,
          search_depth: 'quick'
        })
      })
      const json = await res.json()
      if (json.success && json.results?.leads?.length > 0) {
        const suggestion = json.results.leads[0]
        setFormData(prev => ({
          ...prev,
          customer_name: prev.customer_name || suggestion.customer_name || '',
          customer_email: prev.customer_email || suggestion.customer_email || '',
          customer_phone: prev.customer_phone || suggestion.customer_phone || '',
          customer_job_title: prev.customer_job_title || suggestion.customer_job_title || '',
          company_name: prev.company_name || suggestion.company_name || '',
          score: suggestion.score || prev.score || 0,
          rating: prev.rating || suggestion.rating || '',
          crm_notes: prev.crm_notes || suggestion.justification || '',
        }))
        setAiSuggested(true)
        toast.success('Suggestions IA appliquées!')
      } else {
        toast.error('Aucune suggestion trouvée')
      }
    } catch {
      toast.error('Erreur lors de la suggestion IA')
    } finally {
      setAiSuggesting(false)
    }
  }

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

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvFile) return toast.error('Sélectionnez un fichier CSV')
    setImporting(true)
    setImportResult(null)
    try {
      const formDataObj = new FormData()
      formDataObj.append('file', csvFile)
      const res = await fetch(`${API_URL}/leads/import/csv?company_id=${COMPANY_ID}`, {
        method: 'POST',
        body: formDataObj
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail)
      setImportResult(json)
      toast.success(json.message)
    } catch {
      toast.error("Erreur lors de l'importation")
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const csv = `customer_name,customer_email,customer_phone,customer_job_title,company_name,source,industry,website,billing_city,billing_country
Jean Dupont,jean@example.com,+33612345678,Directeur,Acme Corp,linkedin,Technologie,https://acme.com,Paris,France
Marie Martin,marie@example.com,+33698765432,Manager,Beta Inc,website,Immobilier,,Lyon,France`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-leads.csv'
    a.click()
    toast.success('Template téléchargé!')
  }

  const update = (field: string, value: any) => setFormData({ ...formData, [field]: value })

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Nouveau Lead</h1>
        <a href="/leads" className="text-[#7C4DFF] hover:underline">← Retour</a>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'manual' ? 'bg-[#7C4DFF] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Création manuelle
        </button>
        <button onClick={() => setActiveTab('csv')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'csv' ? 'bg-[#7C4DFF] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Importer CSV
        </button>
      </div>

      {activeTab === 'manual' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">

          <div className="bg-[#7C4DFF]/5 border border-[#7C4DFF]/20 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#7C4DFF]">Suggestion IA</p>
              <p className="text-xs text-gray-500">Entrez un nom ou une entreprise puis cliquez pour obtenir des suggestions automatiques</p>
            </div>
            <button type="button" onClick={handleAiSuggest} disabled={aiSuggesting}
              className="px-4 py-2 bg-[#7C4DFF] text-white rounded-lg hover:bg-[#6D3FEB] disabled:opacity-50 text-sm flex items-center gap-2 whitespace-nowrap">
              {aiSuggesting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Suggestion en cours...
                </>
              ) : 'Suggérer via IA'}
            </button>
          </div>

          {aiSuggested && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">Suggestions IA appliquées — vérifiez et complétez les champs</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
              <input type="text" required
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
                value={formData.customer_name} onChange={(e) => update('customer_name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
                value={formData.customer_email} onChange={(e) => update('customer_email', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input type="tel"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
                value={formData.customer_phone} onChange={(e) => update('customer_phone', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Poste / Fonction</label>
              <input type="text"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
                value={formData.customer_job_title} onChange={(e) => update('customer_job_title', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
              <input type="text"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
                value={formData.company_name} onChange={(e) => update('company_name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
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
              <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
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
              <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
                value={formData.rating} onChange={(e) => update('rating', e.target.value)}>
                <option value="">Non défini</option>
                <option value="cold">Froid</option>
                <option value="warm">Moyen</option>
                <option value="hot">Chaud</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Valeur estimée (€)</label>
              <input type="number" min="0"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
                value={formData.estimated_value} onChange={(e) => update('estimated_value', parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes CRM</label>
            <textarea rows={3}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
              value={formData.crm_notes} onChange={(e) => update('crm_notes', e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="px-6 py-2 bg-[#7C4DFF] text-white rounded-lg hover:bg-[#6D3FEB] disabled:opacity-50">
              {loading ? 'Création...' : 'Créer le lead'}
            </button>
            <a href="/leads" className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              Annuler
            </a>
          </div>
        </form>
      )}

      {activeTab === 'csv' && (
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-1">Format CSV requis</p>
            <p className="text-xs text-blue-600">Colonnes acceptées: customer_name, customer_email, customer_phone, customer_job_title, company_name, source, industry, website, billing_city, billing_country</p>
            <button onClick={downloadTemplate}
              className="mt-2 text-xs text-blue-600 underline hover:text-blue-800">
              Télécharger le template
            </button>
          </div>

          <form onSubmit={handleCsvImport} className="space-y-4">
            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${csvFile ? 'border-[#7C4DFF] bg-[#7C4DFF]/5' : 'border-gray-300'}`}>
              {csvFile ? (
                <div>
                  <p className="text-[#7C4DFF] font-medium">{csvFile.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{(csvFile.size / 1024).toFixed(1)} KB</p>
                  <button type="button" onClick={() => setCsvFile(null)}
                    className="mt-2 text-xs text-red-500 hover:text-red-700">
                    Supprimer
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-400 mb-2">Glissez votre fichier CSV ici</p>
                  <label className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                    Parcourir
                    <input type="file" accept=".csv" className="hidden"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              )}
            </div>

            <button type="submit" disabled={importing || !csvFile}
              className="w-full py-2 bg-[#7C4DFF] text-white rounded-lg hover:bg-[#6D3FEB] disabled:opacity-50">
              {importing ? 'Importation en cours...' : 'Importer les leads'}
            </button>
          </form>

          {importResult && (
            <div className={`rounded-lg p-4 ${importResult.imported > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`font-medium ${importResult.imported > 0 ? 'text-green-800' : 'text-red-800'}`}>
                {importResult.imported} lead(s) importé(s) avec succès
              </p>
              {importResult.errors?.length > 0 && (
                <p className="text-xs text-red-600 mt-1">{importResult.errors.length} erreur(s)</p>
              )}
              <a href="/leads" className="mt-2 inline-block text-sm text-[#7C4DFF] hover:underline">
                Voir les leads importés →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}