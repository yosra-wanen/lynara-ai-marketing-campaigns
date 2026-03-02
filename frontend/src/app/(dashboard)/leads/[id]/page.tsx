'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

export default function LeadDetailPage() {
  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const params = useParams()
  const supabase = createClient()
  
  const leadId = params.id

  useEffect(() => {
    fetchLead()
  }, [leadId])

  async function fetchLead() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()
      if (error) throw error
      setLead(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4">Chargement...</p>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-red-800 font-semibold mb-2">Lead non trouvé</h2>
          <p className="text-red-600 mb-4">L'ID que vous recherchez n'existe pas.</p>
          <div className="flex gap-3">
            <a 
              href="/leads" 
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              ← Retour
            </a>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <a href="/leads" className="text-blue-600 mb-4 block">← Retour à la liste</a>
      
      <div className="bg-white rounded-lg border p-6">
        <h1 className="text-2xl font-bold mb-4">{lead.nom_complet}</h1>
        <div className="space-y-2">
          <p><strong>Email:</strong> {lead.email}</p>
          <p><strong>Téléphone:</strong> {lead.telephone || '-'}</p>
          <p><strong>Score:</strong> {lead.score || 0}</p>
        </div>
      </div>
    </div>
  )
}