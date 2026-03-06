'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const COMPANY_ID = '11111111-1111-1111-1111-111111111111'

async function fetchWithRetry(url: string, options?: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options)
      if (res.ok) return res
      if (i === retries - 1) return res
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw new Error('Max retries reached')
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const leadsPerPage = 10

  useEffect(() => { fetchLeads() }, [currentPage, statusFilter, searchTerm])

  async function fetchLeads() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        company_id: COMPANY_ID,
        page: currentPage.toString(),
        limit: leadsPerPage.toString(),
      })
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)

      const res = await fetchWithRetry(`${API_URL}/leads/?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail)
      setLeads(json.data || [])
      setTotal(json.total || 0)
    } catch {
      toast.error('Erreur lors du chargement des leads')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    setSearchTerm(searchInput)
  }

  const handleDelete = async (leadId: string) => {
    if (!confirm('Supprimer ce lead ?')) return
    try {
      await fetchWithRetry(`${API_URL}/leads/${leadId}?company_id=${COMPANY_ID}`, { method: 'DELETE' })
      toast.success('Lead supprimé')
      fetchLeads()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return toast.error('Sélectionnez au moins un lead')
    if (!confirm(`Supprimer ${selectedLeads.length} lead(s) ?`)) return
    try {
      await Promise.all(selectedLeads.map(id =>
        fetchWithRetry(`${API_URL}/leads/${id}?company_id=${COMPANY_ID}`, { method: 'DELETE' })
      ))
      toast.success(`${selectedLeads.length} lead(s) supprimé(s)`)
      setSelectedLeads([])
      setSelectAll(false)
      fetchLeads()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleBulkExport = () => {
    if (selectedLeads.length === 0) return toast.error('Sélectionnez au moins un lead')
    const selectedData = leads.filter(l => selectedLeads.includes(l.lead_id))
    const csv = selectedData.map(l =>
      `${l.customer_name || ''},${l.customer_email || ''},${l.customer_phone || ''},${l.score || 0}`
    ).join('\n')
    const blob = new Blob([`Nom,Email,Téléphone,Score\n${csv}`], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success(`${selectedLeads.length} lead(s) exporté(s)`)
  }

  const toggleLeadSelection = (leadId: string) => {
    const newSelected = selectedLeads.includes(leadId)
      ? selectedLeads.filter(id => id !== leadId)
      : [...selectedLeads, leadId]
    setSelectedLeads(newSelected)
    setSelectAll(newSelected.length === leads.length && leads.length > 0)
  }

  useEffect(() => {
    if (selectAll) setSelectedLeads(leads.map(l => l.lead_id))
    else setSelectedLeads([])
  }, [selectAll])

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

  const getStatusColor = (status: string) => {
    const map: any = {
      new: 'bg-gray-100 text-gray-800',
      contacted: 'bg-blue-100 text-blue-800',
      qualified: 'bg-green-100 text-green-800',
      proposal: 'bg-purple-100 text-purple-800',
      negotiation: 'bg-orange-100 text-orange-800',
      converted: 'bg-emerald-100 text-emerald-800',
      lost: 'bg-red-100 text-red-800',
    }
    return map[status] || 'bg-gray-100 text-gray-800'
  }

  const totalPages = Math.ceil(total / leadsPerPage)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Leads <span className="text-sm font-normal text-gray-400">({total})</span></h1>
        <a href="/leads/nouveau" className="px-4 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D]">
          + Nouveau Lead
        </a>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input type="text" placeholder="Rechercher par nom, email, entreprise..."
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
          value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        <select className="w-48 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C]"
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}>
          <option value="all">Tous les statuts</option>
          <option value="new">Nouveau</option>
          <option value="contacted">Contacté</option>
          <option value="qualified">Qualifié</option>
          <option value="proposal">Proposition</option>
          <option value="negotiation">Négociation</option>
          <option value="converted">Converti</option>
          <option value="lost">Perdu</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D]">
          🔍 Rechercher
        </button>
        {searchTerm && (
          <button type="button" onClick={() => { setSearchTerm(''); setSearchInput(''); setCurrentPage(1) }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            ✕ Effacer
          </button>
        )}
      </form>

      {selectedLeads.length > 0 && (
        <div className="bg-[#E1306C]/10 border border-[#E1306C]/20 rounded-lg p-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-[#E1306C]">{selectedLeads.length} lead(s) sélectionné(s)</span>
          <div className="flex gap-2">
            <button onClick={handleBulkExport} className="px-3 py-1 bg-[#833AB4] text-white text-sm rounded-lg">Exporter</button>
            <button onClick={handleBulkDelete} className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg">Supprimer</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E1306C] mx-auto"></div>
            <p className="mt-2 text-gray-500 text-sm">Chargement...</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox" checked={selectAll} onChange={(e) => setSelectAll(e.target.checked)}
                    className="rounded border-gray-300 accent-[#E1306C]" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entreprise</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leads.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-8 text-center text-gray-400">Aucun lead trouvé</td></tr>
              ) : leads.map(lead => (
                <tr key={lead.lead_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedLeads.includes(lead.lead_id)}
                      onChange={() => toggleLeadSelection(lead.lead_id)}
                      className="rounded border-gray-300 accent-[#E1306C]" />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{lead.customer_name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{lead.customer_email || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{lead.customer_phone || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{lead.company_name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                      {getStatusLabel(lead.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRatingColor(lead.rating)}`}>
                      {getRatingLabel(lead.rating)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{lead.score || 0}</td>
                  <td className="px-4 py-3 text-sm flex gap-2">
                    <a href={`/leads/${lead.lead_id}`} className="text-[#E1306C] hover:underline">Voir</a>
                    <a href={`/leads/${lead.lead_id}/modifier`} className="text-blue-500 hover:underline">Modifier</a>
                    <button onClick={() => handleDelete(lead.lead_id)} className="text-red-400 hover:text-red-600">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
            className={`px-4 py-2 text-sm rounded-lg ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}>
            ← Précédent
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 text-sm rounded-lg ${currentPage === page ? 'bg-[#E1306C] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                {page}
              </button>
            ))}
          </div>
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
            className={`px-4 py-2 text-sm rounded-lg ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}>
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}