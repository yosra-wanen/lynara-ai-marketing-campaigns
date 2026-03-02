'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [leadsPerPage] = useState(5)
  
  // Actions groupées states
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    fetchLeads()
  }, [])

  async function fetchLeads() {
    try {
      const { data, error } = await supabase.from('leads').select('*')
      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erreur lors du chargement des leads')
    } finally {
      setLoading(false)
    }
  }

  // Filter leads based on search AND status
  const filteredLeads = leads.filter(lead => {
    const searchText = searchTerm.toLowerCase()
    const matchesSearch = 
      lead.nom_complet?.toLowerCase().includes(searchText) ||
      lead.email?.toLowerCase().includes(searchText) ||
      lead.telephone?.includes(searchText)
    
    // Determine status based on score
    let leadStatus = 'froid'
    if (lead.score >= 70) leadStatus = 'chaud'
    else if (lead.score >= 40) leadStatus = 'moyen'
    
    const matchesStatus = statusFilter === 'all' || leadStatus === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Pagination logic
  const indexOfLastLead = currentPage * leadsPerPage
  const indexOfFirstLead = indexOfLastLead - leadsPerPage
  const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead)
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage)

  // Handle select all
  useEffect(() => {
    if (selectAll) {
      const currentIds = currentLeads.map(lead => lead.id)
      if (JSON.stringify(selectedLeads) !== JSON.stringify(currentIds)) {
        setSelectedLeads(currentIds)
      }
    } else {
      if (selectedLeads.length > 0 && selectedLeads.every(id => currentLeads.some(lead => lead.id === id))) {
        setSelectedLeads([])
      }
    }
  }, [selectAll, currentLeads])

  // Handle individual lead selection
  const toggleLeadSelection = (leadId: string) => {
    const newSelected = selectedLeads.includes(leadId)
      ? selectedLeads.filter(id => id !== leadId)
      : [...selectedLeads, leadId]
    
    setSelectedLeads(newSelected)
    setSelectAll(newSelected.length === currentLeads.length && currentLeads.length > 0)
  }

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) {
      toast.error('Sélectionnez au moins un lead')
      return
    }

    if (!confirm(`Supprimer ${selectedLeads.length} lead(s) ?`)) return

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', selectedLeads)

      if (error) throw error

      toast.success(`${selectedLeads.length} lead(s) supprimé(s)`)
      setSelectedLeads([])
      setSelectAll(false)
      fetchLeads()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  // Bulk export
  const handleBulkExport = () => {
    if (selectedLeads.length === 0) {
      toast.error('Sélectionnez au moins un lead')
      return
    }

    const selectedData = leads.filter(lead => selectedLeads.includes(lead.id))
    const csv = selectedData.map(lead => 
      `${lead.nom_complet},${lead.email},${lead.telephone || ''},${lead.score || 0}`
    ).join('\n')
    
    const blob = new Blob([`Nom,Email,Téléphone,Score\n${csv}`], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    
    toast.success(`${selectedLeads.length} lead(s) exporté(s)`)
  }

  // Change page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      setSelectedLeads([])
      setSelectAll(false)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      setSelectedLeads([])
      setSelectAll(false)
    }
  }

  const getStatusLabel = (score: number) => {
    if (score >= 70) return '🔥 Chaud'
    if (score >= 40) return '⚡ Moyen'
    return '❄️ Froid'
  }

  const getStatusColor = (score: number) => {
    if (score >= 70) return 'bg-red-100 text-red-800'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800'
    return 'bg-blue-100 text-blue-800'
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E1306C] mx-auto"></div>
        <p className="mt-4">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Leads</h1>
        <a 
          href="/leads/nouveau"
          className="px-4 py-2 bg-[#E1306C] text-white rounded-lg hover:bg-[#FD1D1D] transition-colors inline-block"
        >
          + Nouveau Lead
        </a>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Rechercher..."
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C] focus:border-transparent"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
            setSelectedLeads([])
            setSelectAll(false)
          }}
        />
        
        <select
          className="w-48 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E1306C] focus:border-transparent"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setCurrentPage(1)
            setSelectedLeads([])
            setSelectAll(false)
          }}
        >
          <option value="all">Tous les statuts</option>
          <option value="chaud">🔥 Chaud</option>
          <option value="moyen">⚡ Moyen</option>
          <option value="froid">❄️ Froid</option>
        </select>
      </div>

      {/* Actions groupées bar */}
      {selectedLeads.length > 0 && (
        <div className="bg-[#E1306C]/10 border border-[#E1306C]/20 rounded-lg p-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-[#E1306C]">
            {selectedLeads.length} lead(s) sélectionné(s)
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkExport}
              className="px-3 py-1 bg-[#833AB4] text-white text-sm rounded-lg hover:bg-[#E1306C] transition-colors"
            >
              Exporter
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-[#374151] mb-2">
        {filteredLeads.length} lead(s) trouvé(s)
      </p>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-card">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => setSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-[#E1306C] focus:ring-[#E1306C] accent-[#E1306C]"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#374151] uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#374151] uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#374151] uppercase tracking-wider">Téléphone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#374151] uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#374151] uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#374151] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentLeads.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedLeads.includes(lead.id)}
                    onChange={() => toggleLeadSelection(lead.id)}
                    className="rounded border-gray-300 text-[#E1306C] focus:ring-[#E1306C] accent-[#E1306C]"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#111827]">
                  {lead.nom_complet}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">
                  {lead.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">
                  {lead.telephone || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.score)}`}>
                    {getStatusLabel(lead.score)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">
                  {lead.score || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">
                  <a href={`/leads/${lead.id}`} className="text-[#E1306C] hover:text-[#FD1D1D] mr-3">
                    Voir
                  </a>
                  <button className="text-[#374151] hover:text-[#111827]">
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredLeads.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`px-4 py-2 text-sm rounded-lg ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-[#374151] hover:bg-gray-300'
            }`}
          >
            ← Précédent
          </button>
          
          <span className="text-sm text-[#374151]">
            Page {currentPage} sur {totalPages}
          </span>
          
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 text-sm rounded-lg ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-[#374151] hover:bg-gray-300'
            }`}
          >
            Suivant →
          </button>
        </div>
      )}
      
      {filteredLeads.length === 0 && (
        <p className="text-center text-[#374151] mt-8">Aucun résultat trouvé</p>
      )}
    </div>
  )
}