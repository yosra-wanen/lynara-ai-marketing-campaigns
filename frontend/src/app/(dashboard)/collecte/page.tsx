'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

const AI_URL = 'http://localhost:8000'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const COMPANY_ID = '11111111-1111-1111-1111-111111111111'

export default function CollectePage() {
  const [activeTab, setActiveTab] = useState<'search' | 'results' | 'history'>('search')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStats, setJobStats] = useState<any>(null)
  const [selectedLeads, setSelectedLeads] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [editingLead, setEditingLead] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState<string>('')
  const [rejectingLead, setRejectingLead] = useState<any>(null)
  const [filterRating, setFilterRating] = useState('all')
  const [sortBy, setSortBy] = useState('score')

  const [config, setConfig] = useState({
    keywords: '',
    location: '',
    industry: '',
    target_persona: '',
    budget_target: '',
    volume: 10,
    sources: ['web', 'linkedin', 'annuaires'],
    quality_vs_quantity: 'quality',
    search_depth: 'standard',
  })

  const sources = [
    { id: 'web', label: 'Sites web' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'annuaires', label: 'Annuaires' },
    { id: 'social', label: 'Réseaux sociaux' },
  ]

  const toggleSource = (sourceId: string) => {
    const newSources = config.sources.includes(sourceId)
      ? config.sources.filter(s => s !== sourceId)
      : [...config.sources, sourceId]
    setConfig({ ...config, sources: newSources })
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config.keywords) return toast.error('Entrez des mots-clés')
    setLoading(true)
    setResults([])
    setSelectedLeads([])

    try {
      const res = await fetch(`${AI_URL}/ai-orchestration/jobs?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail)

      setJobId(json.job_id)
      setResults(json.data || [])
      setJobStats({
        total: json.total,
        sources_analyzed: json.sources_analyzed,
        message: json.message
      })

      // Save to history
      const historyEntry = {
        id: json.job_id,
        keywords: config.keywords,
        location: config.location,
        industry: config.industry,
        date: new Date().toLocaleDateString('fr-FR'),
        total_found: json.total,
        imported: 0
      }
      setHistory(prev => [historyEntry, ...prev])
      setActiveTab('results')
      toast.success(json.message)
    } catch (err) {
      toast.error('Erreur lors de la recherche IA')
    } finally {
      setLoading(false)
    }
  }

  const toggleLead = (lead: any) => {
    const exists = selectedLeads.find(l => l.temp_id === lead.temp_id)
    if (exists) setSelectedLeads(selectedLeads.filter(l => l.temp_id !== lead.temp_id))
    else setSelectedLeads([...selectedLeads, lead])
  }

  const handleSelectAll = () => {
    const filtered = getFilteredResults()
    if (selectedLeads.length === filtered.length) setSelectedLeads([])
    else setSelectedLeads(filtered)
  }

  const handleReject = (lead: any) => {
    setRejectingLead(lead)
    setRejectReason('')
  }

  const confirmReject = () => {
    if (!rejectingLead) return
    setResults(results.filter(r => r.temp_id !== rejectingLead.temp_id))
    setSelectedLeads(selectedLeads.filter(l => l.temp_id !== rejectingLead.temp_id))
    setRejectingLead(null)
    toast.success('Lead rejeté!')
  }

  const handleEditSave = () => {
    if (!editingLead) return
    setResults(results.map(r => r.temp_id === editingLead.temp_id ? editingLead : r))
    setEditingLead(null)
    toast.success('Lead modifié!')
  }

  const handleImport = async () => {
    if (selectedLeads.length === 0) return toast.error('Sélectionnez au moins un lead')
    setImporting(true)
    try {
      let imported = 0
      for (const lead of selectedLeads) {
        const payload = { ...lead }
        delete payload.temp_id
        delete payload.keyword_match
        delete payload.justification

        const res = await fetch(`${API_URL}/leads/?company_id=${COMPANY_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) imported++
      }

      // Update history
      setHistory(prev => prev.map(h =>
        h.id === jobId ? { ...h, imported } : h
      ))

      toast.success(`${imported} lead(s) importé(s) dans le CRM!`)
      setSelectedLeads([])
      setResults(results.filter(r => !selectedLeads.find(s => s.temp_id === r.temp_id)))
    } catch {
      toast.error('Erreur lors de l\'importation')
    } finally {
      setImporting(false)
    }
  }

  const rerunSearch = (entry: any) => {
    setConfig({ ...config, keywords: entry.keywords, location: entry.location || '', industry: entry.industry || '' })
    setActiveTab('search')
    toast.success('Critères chargés! Lancez la recherche.')
  }

  const getFilteredResults = () => {
    let filtered = [...results]
    if (filterRating !== 'all') filtered = filtered.filter(l => l.rating === filterRating)
    if (sortBy === 'score') filtered.sort((a, b) => (b.score || 0) - (a.score || 0))
    else if (sortBy === 'name') filtered.sort((a, b) => (a.customer_name || '').localeCompare(b.customer_name || ''))
    else if (sortBy === 'company') filtered.sort((a, b) => (a.company_name || '').localeCompare(b.company_name || ''))
    return filtered
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
        <p className="text-sm text-gray-500 mt-1">Collectez et qualifiez automatiquement des leads grâce à l'intelligence artificielle</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button onClick={() => setActiveTab('search')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'search' ? 'border-[#E1306C] text-[#E1306C]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          🔍 Configuration
        </button>
        <button onClick={() => setActiveTab('results')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'results' ? 'border-[#E1306C] text-[#E1306C]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          📋 Résultats {results.length > 0 && `(${results.length})`}
        </button>
        <button onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-[#E1306C] text-[#E1306C]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          🕐 Historique {history.length > 0 && `(${history.length})`}
        </button>
      </div>

      {/* SEARCH TAB */}
      {activeTab === 'search' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <form onSubmit={handleSearch} className="bg-white rounded-lg border p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[#111827]">📝 Brief de recherche</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mots-clés / Brief *</label>
                <textarea required rows={3}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                  placeholder="Ex: directeurs commerciaux agences immobilières luxe Tunis..."
                  value={config.keywords}
                  onChange={(e) => setConfig({ ...config, keywords: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
                  <input type="text"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                    placeholder="Ex: Tunis, Casablanca..."
                    value={config.location}
                    onChange={(e) => setConfig({ ...config, location: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
                  <input type="text"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                    placeholder="Ex: Immobilier, Tech..."
                    value={config.industry}
                    onChange={(e) => setConfig({ ...config, industry: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Persona cible</label>
                  <input type="text"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                    placeholder="Ex: Directeur, CEO, Manager..."
                    value={config.target_persona}
                    onChange={(e) => setConfig({ ...config, target_persona: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget cible</label>
                  <input type="text"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                    placeholder="Ex: 50k-200k TND..."
                    value={config.budget_target}
                    onChange={(e) => setConfig({ ...config, budget_target: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sources</label>
                <div className="flex gap-4">
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
                className="w-full py-3 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D] disabled:opacity-50 font-medium">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Recherche IA en cours...
                  </span>
                ) : '🚀 Lancer la recherche IA'}
              </button>
            </form>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-[#111827] mb-4">⚙️ Options avancées</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Volume souhaité</label>
                  <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                    value={config.volume}
                    onChange={(e) => setConfig({ ...config, volume: parseInt(e.target.value) })}>
                    <option value={5}>5 leads</option>
                    <option value={10}>10 leads</option>
                    <option value={20}>20 leads</option>
                    <option value={50}>50 leads</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                  <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                    value={config.quality_vs_quantity}
                    onChange={(e) => setConfig({ ...config, quality_vs_quantity: e.target.value })}>
                    <option value="quality">Qualité</option>
                    <option value="quantity">Quantité</option>
                    <option value="balanced">Équilibré</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profondeur</label>
                  <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                    value={config.search_depth}
                    onChange={(e) => setConfig({ ...config, search_depth: e.target.value })}>
                    <option value="quick">Rapide</option>
                    <option value="standard">Standard</option>
                    <option value="deep">Approfondie</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-[#E1306C]/5 rounded-lg border border-[#E1306C]/20 p-4">
              <p className="text-sm font-medium text-[#E1306C] mb-2">💡 Conseils</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Soyez précis dans votre brief</li>
                <li>• Ajoutez la localisation pour de meilleurs résultats</li>
                <li>• Combinez plusieurs sources pour plus de leads</li>
                <li>• Qualité > Quantité pour des leads pertinents</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS TAB */}
      {activeTab === 'results' && (
        <div>
          {results.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-gray-400">Lancez une recherche pour voir les résultats</p>
              <button onClick={() => setActiveTab('search')}
                className="mt-4 px-4 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D]">
                Configurer une recherche
              </button>
            </div>
          ) : (
            <>
              {/* Stats bar */}
              {jobStats && (
                <div className="bg-white rounded-lg border p-4 mb-4 flex items-center justify-between">
                  <div className="flex gap-6">
                    <div><p className="text-xs text-gray-500">Leads trouvés</p><p className="text-lg font-bold text-[#E1306C]">{jobStats.total}</p></div>
                    <div><p className="text-xs text-gray-500">Sources analysées</p><p className="text-lg font-bold text-gray-700">{jobStats.sources_analyzed}</p></div>
                    <div><p className="text-xs text-gray-500">Sélectionnés</p><p className="text-lg font-bold text-[#833AB4]">{selectedLeads.length}</p></div>
                  </div>
                  {selectedLeads.length > 0 && (
                    <button onClick={handleImport} disabled={importing}
                      className="px-6 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D] disabled:opacity-50">
                      {importing ? 'Importation...' : `✅ Importer ${selectedLeads.length} lead(s)`}
                    </button>
                  )}
                </div>
              )}

              {/* Filters */}
              <div className="flex gap-3 mb-4">
                <button onClick={handleSelectAll}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">
                  {selectedLeads.length === getFilteredResults().length ? 'Désélectionner tout' : 'Sélectionner tout'}
                </button>
                <select className="p-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                  value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
                  <option value="all">Tous les ratings</option>
                  <option value="hot">🔥 Chaud</option>
                  <option value="warm">⚡ Moyen</option>
                  <option value="cold">❄️ Froid</option>
                </select>
                <select className="p-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                  value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="score">Trier par score</option>
                  <option value="name">Trier par nom</option>
                  <option value="company">Trier par entreprise</option>
                </select>
              </div>

              {/* Results list */}
              <div className="space-y-3">
                {getFilteredResults().map((lead, index) => (
                  <div key={lead.temp_id || index}
                    className={`bg-white rounded-lg border p-4 transition-all ${selectedLeads.find(l => l.temp_id === lead.temp_id) ? 'border-[#E1306C] bg-[#E1306C]/5' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <input type="checkbox"
                          checked={!!selectedLeads.find(l => l.temp_id === lead.temp_id)}
                          onChange={() => toggleLead(lead)}
                          className="mt-1 w-4 h-4 accent-[#E1306C]" />
                        <div>
                          <p className="font-medium text-sm text-gray-900">{lead.customer_name}</p>
                          <p className="text-xs text-gray-500">{lead.customer_email || '-'} • {lead.customer_phone || '-'}</p>
                          <p className="text-xs text-gray-400">{lead.company_name} • {lead.industry}</p>
                          <p className="text-xs text-gray-400">📍 {lead.billing_city || '-'}, {lead.billing_country || '-'}</p>
                          {lead.justification && (
                            <p className="text-xs text-[#833AB4] mt-1 italic">💡 {lead.justification}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getRatingColor(lead.rating)}`}>
                          {getRatingLabel(lead.rating)}
                        </span>
                        <p className="text-xs text-gray-500">Score: <span className="font-bold text-[#E1306C]">{lead.score}</span>/100</p>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingLead({ ...lead })}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200">
                            ✏️ Modifier
                          </button>
                          <button onClick={() => handleReject(lead)}
                            className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200">
                            ✕ Rejeter
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
              <p className="text-4xl mb-4">🕐</p>
              <p className="text-gray-400">Aucune recherche effectuée</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brief</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localisation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secteur</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leads trouvés</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Importés</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {history.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.keywords}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{entry.location || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{entry.industry || '-'}</td>
                      <td className="px-4 py-3 text-sm text-[#E1306C] font-medium">{entry.total_found}</td>
                      <td className="px-4 py-3 text-sm text-emerald-600 font-medium">{entry.imported}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{entry.date}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => rerunSearch(entry)}
                          className="px-3 py-1 bg-[#E1306C]/10 text-[#E1306C] text-xs rounded-lg hover:bg-[#E1306C]/20">
                          🔄 Relancer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">✏️ Modifier le lead</h2>
            <div className="space-y-3">
              {[
                { label: 'Nom', field: 'customer_name' },
                { label: 'Email', field: 'customer_email' },
                { label: 'Téléphone', field: 'customer_phone' },
                { label: 'Entreprise', field: 'company_name' },
                { label: 'Secteur', field: 'industry' },
                { label: 'Ville', field: 'billing_city' },
                { label: 'Pays', field: 'billing_country' },
                { label: 'Site web', field: 'website' },
              ].map(item => (
                <div key={item.field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
                  <input type="text"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                    value={editingLead[item.field] || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, [item.field]: e.target.value })} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleEditSave}
                className="px-6 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D]">
                Sauvegarder
              </button>
              <button onClick={() => setEditingLead(null)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h2 className="text-lg font-semibold mb-2">✕ Rejeter le lead</h2>
            <p className="text-sm text-gray-500 mb-4">Pourquoi rejetez-vous <span className="font-medium">{rejectingLead.customer_name}</span>?</p>
            <select className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C] mb-4"
              value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}>
              <option value="">Sélectionnez une raison...</option>
              <option value="hors_cible">Hors cible</option>
              <option value="doublon">Doublon évident</option>
              <option value="donnees_incompletes">Données incomplètes</option>
              <option value="non_pertinent">Non pertinent</option>
              <option value="autre">Autre</option>
            </select>
            <div className="flex gap-3">
              <button onClick={confirmReject}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                Confirmer le rejet
              </button>
              <button onClick={() => setRejectingLead(null)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}