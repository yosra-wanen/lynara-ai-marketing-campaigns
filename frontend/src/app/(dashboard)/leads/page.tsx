'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Lead {
  id: string
  nom_complet: string
  email: string
  telephone: string
  bien_id: string
  score?: number
  status?: string
  // Add other fields as needed
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const supabase = createClient()

  useEffect(() => {
    fetchLeads()
  }, [])

  async function fetchLeads() {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')

      if (error) {
        setError(error.message)
        console.error('Error:', error)
      } else {
        console.log('Leads data:', data)
        setLeads(data || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredLeads = leads.filter(lead => {
    const searchableText = `${lead.nom_complet} ${lead.email} ${lead.telephone || ''}`.toLowerCase()
    return searchableText.includes(searchTerm.toLowerCase())
  })

  const getStatusColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800'
    if (score >= 70) return 'bg-red-100 text-red-800'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800'
    return 'bg-blue-100 text-blue-800'
  }

  const getStatusLabel = (score?: number) => {
    if (!score) return 'Nouveau'
    if (score >= 70) return '🔥 Chaud'
    if (score >= 40) return '⚡ Moyen'
    return '❄️ Froid'
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <span>+</span> Nouveau Lead
        </button>
      </div>

      {/* Search and filter */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher un lead..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tous les statuts</option>
          <option value="chaud">Chaud</option>
          <option value="moyen">Moyen</option>
          <option value="froid">Froid</option>
        </select>
        <button 
          onClick={fetchLeads}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          ↻ Rafraîchir
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des leads...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600 font-medium">Erreur:</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <p className="text-gray-500 text-xs mt-2">Vérifiez la console (F12)</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom complet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Aucun lead trouvé
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {lead.nom_complet}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.telephone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.score)}`}>
                        {getStatusLabel(lead.score)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{lead.score || 0}</span>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (lead.score || 0) >= 70 ? 'bg-green-500' : 
                              (lead.score || 0) >= 40 ? 'bg-yellow-500' : 'bg-gray-500'
                            }`}
                            style={{ width: `${lead.score || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-800 mr-3">Voir</button>
                      <button className="text-gray-600 hover:text-gray-800">Modifier</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats */}
      {!loading && !error && leads.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Total: {leads.length} leads • Affichés: {filteredLeads.length}
        </div>
      )}
    </div>
  )
}