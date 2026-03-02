'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leads</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Nouveau Lead
        </button>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Rechercher..."
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          className="w-48 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tous les statuts</option>
          <option value="chaud">🔥 Chaud</option>
          <option value="moyen">⚡ Moyen</option>
          <option value="froid">❄️ Froid</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-2">
        {filteredLeads.length} lead(s) trouvé(s)
      </p>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLeads.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {lead.nom_complet}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {lead.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {lead.telephone || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.score)}`}>
                    {getStatusLabel(lead.score)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {lead.score || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <a href={`/leads/${lead.id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                    Voir
                  </a>
                  <button className="text-gray-600 hover:text-gray-900">
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredLeads.length === 0 && (
        <p className="text-center text-gray-500 mt-8">Aucun résultat trouvé</p>
      )}
    </div>
  )
}