'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const COMPANY_ID = '11111111-1111-1111-1111-111111111111'

export default function CollectePage() {
  const [config, setConfig] = useState({
    keywords: '',
    location: '',
    industry: '',
    limit: 10,
    sources: ['linkedin', 'website', 'annuaires']
  })
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [selectedLeads, setSelectedLeads] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [searched, setSearched] = useState(false)

  const sources = [
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'website', label: 'Sites web' },
    { id: 'annuaires', label: 'Annuaires' },
    { id: 'social', label: 'Réseaux sociaux' },
  ]

  const toggleSource = (sourceId: string) => {
    const newSources = config.sources.includes(sourceId)
      ? config.sources.filter(s => s !== sourceId)
      : [...config.sources, sourceId]
    setConfig({ ...config, sources: newSources })
  }

  const toggleLead = (lead: any) => {
    const exists = selectedLeads.find(l => l.customer_email === lead.customer_email)
    if (exists) setSelectedLeads(selectedLeads.filter(l => l.customer_email !== lead.customer_email))
    else setSelectedLeads([...selectedLeads, lead])
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config.keywords) return toast.error('Entrez des mots-clés')
    setLoading(true)
    setResults([])
    setSelectedLeads([])
    setSearched(false)
    try {
      const res = await fetch(`${API_URL}/leads/collect?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail)
      setResults(json.data || [])
      setSearched(true)
      toast.success(`${json.total} leads trouvés!`)
    } catch {
      toast.error('Erreur lors de la collecte')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (selectedLeads.length === 0) return toast.error('Sélectionnez au moins un lead')
    setImporting(true)
    try {
      let imported = 0
      for (const lead of selectedLeads) {
        const res = await fetch(`${API_URL}/leads/?company_id=${COMPANY_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: lead.customer_name,
            customer_email: lead.customer_email,
            customer_phone: lead.customer_phone,
            company_name: lead.company_name,
            industry: lead.industry,
            source: lead.source,
            score: lead.score,
            rating: lead.rating,
            status: lead.status,
            priority: lead.priority,
          })
        })
        if (res.ok) imported++
      }
      toast.success(`${imported} lead(s) importé(s) dans votre CRM!`)
      setSelectedLeads([])
      setResults(results.filter(r => !selectedLeads.find(s => s.customer_email === r.customer_email)))
    } catch {
      toast.error('Erreur lors de l\'importation')
    } finally {
      setImporting(false)
    }
  }

  const getRatingColor = (rating: string) => {
    if (rating === 'hot') return 'bg-red-100 text-red-800'
    if (rating === 'warm') return 'bg-yellow-100 text-yellow-800'
    return 'bg-blue-100 text-blue-800'
  }

  const getRatingLabel = (rating: string) => {
    if (rating === 'hot') return '🔥 Chaud'
    if (rating === 'warm') return '⚡ Moyen'
    return '❄️ Froid'
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Collecte Web IA</h1>
        <p className="text-sm text-gray-500 mt-1">Collectez et qualifiez automatiquement des leads depuis le web</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <form onSubmit={handleSearch} className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[#111827]">🔍 Configuration</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mots-clés *</label>
              <input type="text" required
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                placeholder="Ex: directeur commercial, CEO..."
                value={config.keywords}
                onChange={(e) => setConfig({ ...config, keywords: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
              <input type="text"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                placeholder="Ex: Tunis, Paris..."
                value={config.location}
                onChange={(e) => setConfig({ ...config, location: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
              <input type="text"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                placeholder="Ex: Technologie, Immobilier..."
                value={config.industry}
                onChange={(e) => setConfig({ ...config, industry: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de leads</label>
              <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                value={config.limit}
                onChange={(e) => setConfig({ ...config, limit: parseInt(e.target.value) })}>
                <option value={5}>5 leads</option>
                <option value={10}>10 leads</option>
                <option value={20}>20 leads</option>
                <option value={50}>50 leads</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sources</label>
              <div className="space-y-2">
                {sources.map(source => (
                  <label key={source.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox"
                      checked={config.sources.includes(source.id)}
                      onChange={() => toggleSource(source.id)}
                      className="w-4 h-4 accent-[#E1306C]" />
                    <span className="text-sm text-gray-700">{source.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D] disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Collecte en cours...
                </span>
              ) : '🚀 Lancer la collecte'}
            </button>
          </form>
        </div>

        <div className="col-span-2">
          {!searched && !loading && (
            <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center h-full flex flex-col items-center justify-center">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-400">Configurez votre recherche et lancez la collecte</p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-lg border p-12 text-center h-full flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E1306C] mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium">Collecte en cours...</p>
              <p className="text-xs text-gray-400 mt-2">Analyse des sources et scoring des leads</p>
            </div>
          )}

          {searched && results.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">{results.length} lead(s) trouvé(s) — {selectedLeads.length} sélectionné(s)</p>
                {selectedLeads.length > 0 && (
                  <button onClick={handleImport} disabled={importing}
                    className="px-4 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D] disabled:opacity-50 text-sm">
                    {importing ? 'Importation...' : `✅ Importer ${selectedLeads.length} lead(s)`}
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {results.map((lead, index) => (
                  <div key={index}
                    onClick={() => toggleLead(lead)}
                    className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
                      selectedLeads.find(l => l.customer_email === lead.customer_email)
                        ? 'border-[#E1306C] bg-[#E1306C]/5'
                        : 'border-gray-200 hover:border-[#E1306C]/50'
                    }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <input type="checkbox" readOnly
                          checked={!!selectedLeads.find(l => l.customer_email === lead.customer_email)}
                          className="mt-1 w-4 h-4 accent-[#E1306C]" />
                        <div>
                          <p className="font-medium text-sm text-gray-900">{lead.customer_name}</p>
                          <p className="text-xs text-gray-500">{lead.customer_email}</p>
                          <p className="text-xs text-gray-400">{lead.company_name} • {lead.industry}</p>
                          <p className="text-xs text-gray-400">📍 {lead.location} • Source: {lead.source}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${getRatingColor(lead.rating)}`}>
                          {getRatingLabel(lead.rating)}
                        </span>
                        <p className="text-xs text-gray-500">Score: <span className="font-bold text-[#E1306C]">{lead.score}</span>/100</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}