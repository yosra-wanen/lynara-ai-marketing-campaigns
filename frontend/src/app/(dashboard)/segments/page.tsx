'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const COMPANY_ID = '11111111-1111-1111-1111-111111111111'
const FETCH_TIMEOUT_MS = 15000

function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(id))
}

async function fetchWithRetry(url: string, options?: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetchWithTimeout(url, options)
      if (res.ok) return res
      if (i === retries - 1) return res
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, 800 * (i + 1)))
    }
  }
  throw new Error('Max retries reached')
}

type Rule = {
  id: string
  field: string
  operator: string
  value: string
  connector: 'AND' | 'OR'
}

type DynamicSegment = {
  id: string
  name: string
  description: string
  rules: Rule[]
  matched_leads: any[]
  created_at: string
}

const RULE_FIELDS = [
  { value: 'score', label: 'Score', type: 'number' },
  { value: 'rating', label: 'Rating', type: 'select', options: ['hot', 'warm', 'cold'] },
  { value: 'industry', label: 'Secteur', type: 'text' },
  { value: 'billing_city', label: 'Ville', type: 'text' },
  { value: 'billing_country', label: 'Pays', type: 'text' },
  { value: 'status', label: 'Statut', type: 'select', options: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'] },
  { value: 'priority', label: 'Priorité', type: 'select', options: ['high', 'medium', 'low'] },
  { value: 'source', label: 'Source', type: 'text' },
]

const OPERATORS_NUMBER = ['>', '<', '>=', '<=', '=']
const OPERATORS_TEXT = ['=', '!=', 'contient']
const OPERATORS_SELECT = ['=', '!=']

export default function SegmentsPage() {
  const [activeTab, setActiveTab] = useState<'segments' | 'stats' | 'builder'>('segments')
  const [segments, setSegments] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Stats
  const [stats, setStats] = useState({
    total_leads: 0,
    avg_score: 0,
    converted: 0,
    total_segments: 0,
  })

  // Dynamic segments
  const [dynamicSegments, setDynamicSegments] = useState<DynamicSegment[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dynamic_segments')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  // Rule builder
  const [showBuilder, setShowBuilder] = useState(false)
  const [builderName, setBuilderName] = useState('')
  const [builderDescription, setBuilderDescription] = useState('')
  const [builderRules, setBuilderRules] = useState<Rule[]>([
    { id: '1', field: 'score', operator: '>', value: '70', connector: 'AND' }
  ])
  const [previewLeads, setPreviewLeads] = useState<any[]>([])
  const [previewing, setPreviewing] = useState(false)
  const [editingSegment, setEditingSegment] = useState<DynamicSegment | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [segRes, leadsRes] = await Promise.all([
        fetchWithRetry(`${API_URL}/leads/segments/list?company_id=${COMPANY_ID}`),
        fetchWithRetry(`${API_URL}/leads/?company_id=${COMPANY_ID}&limit=500`)
      ])

      const segJson = await segRes.json()
      const leadsJson = await leadsRes.json()

      const segData = Array.isArray(segJson.data) ? segJson.data : []
      const leadsData = Array.isArray(leadsJson.data) ? leadsJson.data : []

      setSegments(segData)
      setLeads(leadsData)

      setStats({
        total_leads: leadsData.length,
        avg_score: leadsData.length > 0
          ? Math.round(leadsData.reduce((sum: number, l: any) => sum + (l.score || 0), 0) / leadsData.length)
          : 0,
        converted: leadsData.filter((l: any) => l.status === 'won').length,
        total_segments: segData.length,
      })
    } catch (err) {
      const msg = err instanceof Error
        ? (err.name === 'AbortError' ? 'Délai dépassé — vérifiez que l’API (port 3001) est démarrée.' : err.message)
        : 'Erreur lors du chargement'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  function addRule() {
    const newRule: Rule = {
      id: Date.now().toString(),
      field: 'score',
      operator: '>',
      value: '70',
      connector: 'AND'
    }
    setBuilderRules([...builderRules, newRule])
  }

  function removeRule(ruleId: string) {
    setBuilderRules(builderRules.filter(r => r.id !== ruleId))
  }

  function updateRule(ruleId: string, field: string, value: string) {
    setBuilderRules(builderRules.map(r => {
      if (r.id !== ruleId) return r
      const updated = { ...r, [field]: value }
      if (field === 'field') {
        const fieldDef = RULE_FIELDS.find(f => f.value === value)
        if (fieldDef?.type === 'number') updated.operator = '>'
        else if (fieldDef?.type === 'select') updated.operator = '='
        else updated.operator = '='
        updated.value = fieldDef?.options?.[0] || ''
      }
      return updated
    }))
  }

  function getOperators(fieldName: string) {
    const fieldDef = RULE_FIELDS.find(f => f.value === fieldName)
    if (fieldDef?.type === 'number') return OPERATORS_NUMBER
    if (fieldDef?.type === 'select') return OPERATORS_SELECT
    return OPERATORS_TEXT
  }

  function applyRulesToLeads(rules: Rule[], leadsData: any[]) {
    if (rules.length === 0) return []

    return leadsData.filter(lead => {
      let result = matchRule(lead, rules[0])

      for (let i = 1; i < rules.length; i++) {
        const ruleMatch = matchRule(lead, rules[i])
        if (rules[i].connector === 'AND') result = result && ruleMatch
        else result = result || ruleMatch
      }

      return result
    })
  }

  function matchRule(lead: any, rule: Rule): boolean {
    const leadValue = lead[rule.field]
    const ruleValue = rule.value

    if (leadValue === undefined || leadValue === null) return false

    switch (rule.operator) {
      case '>': return Number(leadValue) > Number(ruleValue)
      case '<': return Number(leadValue) < Number(ruleValue)
      case '>=': return Number(leadValue) >= Number(ruleValue)
      case '<=': return Number(leadValue) <= Number(ruleValue)
      case '=': return String(leadValue).toLowerCase() === String(ruleValue).toLowerCase()
      case '!=': return String(leadValue).toLowerCase() !== String(ruleValue).toLowerCase()
      case 'contient': return String(leadValue).toLowerCase().includes(String(ruleValue).toLowerCase())
      default: return false
    }
  }

  function handlePreview() {
    setPreviewing(true)
    setTimeout(() => {
      const matched = applyRulesToLeads(builderRules, leads)
      setPreviewLeads(matched)
      setPreviewing(false)
      toast.success(`${matched.length} lead(s) correspondent aux règles`)
    }, 500)
  }

  function handleSaveSegment() {
    if (!builderName.trim()) return toast.error('Entrez un nom pour le segment')
    if (builderRules.length === 0) return toast.error('Ajoutez au moins une règle')

    const matched = applyRulesToLeads(builderRules, leads)

    if (editingSegment) {
      const updated = dynamicSegments.map(s =>
        s.id === editingSegment.id
          ? { ...s, name: builderName, description: builderDescription, rules: builderRules, matched_leads: matched }
          : s
      )
      setDynamicSegments(updated)
      localStorage.setItem('dynamic_segments', JSON.stringify(updated))
      toast.success('Segment modifié!')
    } else {
      const newSegment: DynamicSegment = {
        id: Date.now().toString(),
        name: builderName,
        description: builderDescription,
        rules: builderRules,
        matched_leads: matched,
        created_at: new Date().toLocaleDateString('fr-FR')
      }
      const updated = [newSegment, ...dynamicSegments]
      setDynamicSegments(updated)
      localStorage.setItem('dynamic_segments', JSON.stringify(updated))
      toast.success(`Segment créé! ${matched.length} leads correspondent`)
    }

    setBuilderName('')
    setBuilderDescription('')
    setBuilderRules([{ id: '1', field: 'score', operator: '>', value: '70', connector: 'AND' }])
    setPreviewLeads([])
    setEditingSegment(null)
    setShowBuilder(false)
    setActiveTab('segments')
  }

  function handleEditSegment(segment: DynamicSegment) {
    setEditingSegment(segment)
    setBuilderName(segment.name)
    setBuilderDescription(segment.description)
    setBuilderRules(segment.rules)
    setPreviewLeads(segment.matched_leads)
    setShowBuilder(true)
    setActiveTab('builder')
  }

  function handleDeleteDynamicSegment(segmentId: string) {
    const updated = dynamicSegments.filter(s => s.id !== segmentId)
    setDynamicSegments(updated)
    localStorage.setItem('dynamic_segments', JSON.stringify(updated))
    toast.success('Segment supprimé!')
  }

  async function handleDeleteSegment(segmentId: string) {
    if (!confirm('Supprimer ce segment?')) return
    try {
      const res = await fetchWithRetry(
        `${API_URL}/leads/segments/${segmentId}?company_id=${COMPANY_ID}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error()
      toast.success('Segment supprimé!')
      fetchData()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  function exportCSV(segs: any[]) {
    const headers = ['Nom', 'Description', 'Leads', 'Date']
    const rows = segs.map(s => [
      s.name || s.segment_name,
      s.description || '',
      s.lead_count || s.matched_leads?.length || 0,
      s.created_at || ''
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'segments.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const allSegments = [
    ...dynamicSegments.map(s => ({ ...s, type: 'dynamic', lead_count: s.matched_leads?.length || 0 })),
    ...segments.map(s => ({ ...s, type: 'static' }))
  ]

  const totalPages = Math.ceil(allSegments.length / itemsPerPage)
  const paginatedSegments = allSegments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const getRatingStats = () => {
    const hot = leads.filter(l => l.rating === 'hot').length
    const warm = leads.filter(l => l.rating === 'warm').length
    const cold = leads.filter(l => l.rating === 'cold').length
    const total = leads.length || 1
    return { hot, warm, cold, total }
  }

  const getStatusStats = () => {
    const statuses = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']
    return statuses.map(s => ({
      status: s,
      count: leads.filter(l => l.status === s).length,
      label: { new: 'Nouveau', contacted: 'Contacté', qualified: 'Qualifié', proposal: 'Proposition', won: 'Gagné', lost: 'Perdu' }[s]
    }))
  }

  const getFieldDef = (fieldName: string) => RULE_FIELDS.find(f => f.value === fieldName)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Segments</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez et créez des segments dynamiques de leads</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCSV(allSegments)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
            📥 Exporter CSV
          </button>
          <button onClick={() => { setShowBuilder(true); setActiveTab('builder'); setEditingSegment(null); setBuilderName(''); setBuilderDescription(''); setBuilderRules([{ id: '1', field: 'score', operator: '>', value: '70', connector: 'AND' }]); setPreviewLeads([]) }}
            className="px-4 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D] text-sm">
            ➕ Nouveau segment dynamique
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { id: 'segments', label: '📂 Segments' },
          { id: 'stats', label: '📊 Statistiques' },
          { id: 'builder', label: '🔧 Règle Builder' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-[#E1306C] text-[#E1306C]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* SEGMENTS TAB */}
      {activeTab === 'segments' && (
        <div>
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E1306C] mx-auto"></div>
              <p className="mt-3 text-gray-500">Chargement...</p>
            </div>
          ) : allSegments.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
              <p className="text-4xl mb-4">📂</p>
              <p className="text-lg font-semibold text-gray-700">Aucun segment créé</p>
              <p className="text-gray-400 mt-2">Créez votre premier segment dynamique</p>
              <button onClick={() => setActiveTab('builder')}
                className="mt-4 px-4 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D]">
                ➕ Créer un segment
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {paginatedSegments.map((segment: any, index: number) => (
                  <div key={segment.id|| index} className="bg-white rounded-lg border p-5 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${segment.type === 'dynamic' ? 'bg-[#833AB4]' : 'bg-[#E1306C]'}`}>
                        {segment.type === 'dynamic' ? '🔧' : '📂'}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${segment.type === 'dynamic' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'}`}>
                        {segment.type === 'dynamic' ? 'Dynamique' : 'Statique'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{segment.name || segment.segment_name}</h3>
                    <p className="text-xs text-gray-500 mb-3">{segment.description || '-'}</p>
                    {segment.type === 'dynamic' && segment.rules && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 mb-1">Règles:</p>
                        {segment.rules.slice(0, 2).map((rule: Rule, i: number) => (
                          <p key={rule.id} className="text-xs text-[#833AB4]">
                            {i > 0 && <span className="text-gray-400">{rule.connector} </span>}
                            {rule.field} {rule.operator} {rule.value}
                          </p>
                        ))}
                        {segment.rules.length > 2 && (
                          <p className="text-xs text-gray-400">+{segment.rules.length - 2} règle(s)</p>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-[#E1306C] font-medium">
                        👥 {segment.lead_count || segment.matched_leads?.length || 0} leads
                      </span>
                      <div className="flex gap-1">
                        {segment.type === 'dynamic' && (
                          <button onClick={() => handleEditSegment(segment)}
                            className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200">
                            ✏️
                          </button>
                        )}
                        <button
                          onClick={() => segment.type === 'dynamic'
                            ? handleDeleteDynamicSegment(segment.id)
                            : handleDeleteSegment(segment.id)}
                          className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200">
                    ← Précédent
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i + 1} onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1 rounded-lg ${currentPage === i + 1 ? 'bg-[#E1306C] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200">
                    Suivant →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* STATS TAB */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Leads', value: stats.total_leads, icon: '👥', color: 'text-[#E1306C]' },
              { label: 'Score Moyen', value: stats.avg_score, icon: '⭐', color: 'text-yellow-500' },
              { label: 'Convertis', value: stats.converted, icon: '✅', color: 'text-green-500' },
              { label: 'Total Segments', value: allSegments.length, icon: '📂', color: 'text-[#833AB4]' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-lg border p-5">
                <p className="text-sm text-gray-500">{item.icon} {item.label}</p>
                <p className={`text-3xl font-bold mt-2 ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">🌡️ Répartition par température</h3>
              {(() => {
                const { hot, warm, cold, total } = getRatingStats()
                return [
                  { label: '🔥 Chaud', count: hot, color: 'bg-red-500', pct: Math.round(hot / total * 100) },
                  { label: '⚡ Moyen', count: warm, color: 'bg-yellow-500', pct: Math.round(warm / total * 100) },
                  { label: '❄️ Froid', count: cold, color: 'bg-blue-500', pct: Math.round(cold / total * 100) },
                ].map(item => (
                  <div key={item.label} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.label}</span>
                      <span className="font-medium">{item.count} ({item.pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.pct}%` }}></div>
                    </div>
                  </div>
                ))
              })()}
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">📊 Répartition par statut</h3>
              {getStatusStats().map(item => (
                <div key={item.status} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-[#E1306C] h-2 rounded-full"
                      style={{ width: `${leads.length ? Math.round(item.count / leads.length * 100) : 0}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">📋 Détail des segments</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leads</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allSegments.map((segment: any) => (
                  <tr key={segment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{segment.name || segment.segment_name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${segment.type === 'dynamic' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'}`}>
                        {segment.type === 'dynamic' ? 'Dynamique' : 'Statique'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{segment.description || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#E1306C] font-medium">
                      {segment.lead_count || segment.matched_leads?.length || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{segment.created_at || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BUILDER TAB */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">🔧 Constructeur de règles</h2>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du segment *</label>
                  <input type="text"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                    placeholder="Ex: Leads chauds immobilier Tunis..."
                    value={builderName}
                    onChange={(e) => setBuilderName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
                    placeholder="Ex: Leads avec score élevé dans l'immobilier..."
                    value={builderDescription}
                    onChange={(e) => setBuilderDescription(e.target.value)} />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Règles de filtrage:</p>
                {builderRules.map((rule, index) => (
                  <div key={rule.id} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                    {index > 0 && (
                      <select
                        value={rule.connector}
                        onChange={(e) => updateRule(rule.id, 'connector', e.target.value)}
                        className="p-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#E1306C] w-16">
                        <option value="AND">ET</option>
                        <option value="OR">OU</option>
                      </select>
                    )}
                    {index === 0 && <span className="text-xs text-gray-500 w-16">Si</span>}

                    <select
                      value={rule.field}
                      onChange={(e) => updateRule(rule.id, 'field', e.target.value)}
                      className="p-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#E1306C] flex-1">
                      {RULE_FIELDS.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>

                    <select
                      value={rule.operator}
                      onChange={(e) => updateRule(rule.id, 'operator', e.target.value)}
                      className="p-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#E1306C] w-20">
                      {getOperators(rule.field).map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>

                    {getFieldDef(rule.field)?.type === 'select' ? (
                      <select
                        value={rule.value}
                        onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                        className="p-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#E1306C] flex-1">
                        {getFieldDef(rule.field)?.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={getFieldDef(rule.field)?.type === 'number' ? 'number' : 'text'}
                        value={rule.value}
                        onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                        className="p-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#E1306C] flex-1"
                        placeholder="Valeur..." />
                    )}

                    {builderRules.length > 1 && (
                      <button onClick={() => removeRule(rule.id)}
                        className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                <button onClick={addRule}
                  className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-[#E1306C] hover:text-[#E1306C] text-sm">
                  ➕ Ajouter une règle
                </button>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={handlePreview} disabled={previewing}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm disabled:opacity-50">
                  {previewing ? 'Prévisualisation...' : '👁️ Prévisualiser'}
                </button>
                <button onClick={handleSaveSegment}
                  className="px-6 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D] text-sm">
                  {editingSegment ? '💾 Modifier le segment' : '💾 Sauvegarder le segment'}
                </button>
                {editingSegment && (
                  <button onClick={() => { setEditingSegment(null); setBuilderName(''); setBuilderDescription(''); setBuilderRules([{ id: '1', field: 'score', operator: '>', value: '70', connector: 'AND' }]); setPreviewLeads([]) }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                    Annuler
                  </button>
                )}
              </div>
            </div>

            {/* Preview results */}
            {previewLeads.length > 0 && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">👁️ Prévisualisation — {previewLeads.length} lead(s) correspondent</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {previewLeads.map((lead, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{lead.customer_name}</p>
                        <p className="text-xs text-gray-500">{lead.company_name} • {lead.industry}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-[#E1306C]">Score: {lead.score}</p>
                        <p className="text-xs text-gray-400">{lead.billing_city}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Helper panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">📚 Guide des champs</h3>
              <div className="space-y-2">
                {RULE_FIELDS.map(field => (
                  <div key={field.value} className="text-xs">
                    <span className="font-medium text-gray-700">{field.label}</span>
                    <span className="text-gray-400"> — {field.type === 'number' ? 'Nombre (0-100)' : field.type === 'select' ? field.options?.join(', ') : 'Texte libre'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">💡 Exemples de segments</h3>
              <div className="space-y-3">
                {[
                  { name: 'Leads chauds', rules: 'score > 70' },
                  { name: 'Immobilier Tunis', rules: 'industry = Immobilier ET ville = Tunis' },
                  { name: 'À contacter', rules: 'status = new ET score > 50' },
                ].map(ex => (
                  <div key={ex.name} className="p-2 bg-gray-50 rounded">
                    <p className="text-xs font-medium text-gray-700">{ex.name}</p>
                    <p className="text-xs text-gray-500">{ex.rules}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#833AB4]/5 rounded-lg border border-[#833AB4]/20 p-4">
              <p className="text-sm font-medium text-[#833AB4] mb-2">🔧 Connecteurs</p>
              <p className="text-xs text-gray-600"><span className="font-medium">ET</span> — Le lead doit correspondre aux deux règles</p>
              <p className="text-xs text-gray-600 mt-1"><span className="font-medium">OU</span> — Le lead doit correspondre à l'une des règles</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}