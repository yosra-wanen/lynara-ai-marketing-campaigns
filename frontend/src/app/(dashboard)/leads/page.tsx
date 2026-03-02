'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
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

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Leads</h1>
      <div className="bg-white rounded-lg border">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Nom</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Téléphone</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id} className="border-t">
                <td className="px-6 py-3">{lead.nom_complet}</td>
                <td className="px-6 py-3">{lead.email}</td>
                <td className="px-6 py-3">{lead.telephone || '-'}</td>
                <td className="px-6 py-3">
                  <a href={`/leads/${lead.id}`} className="text-blue-600">Voir</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}