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

export default function DeduplicationPage() {
  const [duplicates, setDuplicates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [merging, setMerging] = useState<string | null>(null)
  const [rules, setRules] = useState({ match_on_email: true, match_on_phone: true, match_on_name: false })
  const [savingRules, setSavingRules] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [mergingLeads, setMergingLeads] = useState<{ primary: any, duplicate: any } | null>(null)
  const [mergeFields, setMergeFields] = useState<any>({})

  useEffect(() => { fetchDuplicates() }, [])

  async function fetchDuplicates() {
    try {
      setLoading(true)
      const res = await fetchWithRetry(`${API_URL}/leads/deduplicate?company_id=${COMPANY_ID}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail)
      setDuplicates(json.data?.duplicates || [])
    } catch (err) {
      const msg = err instanceof Error && err.name === 'AbortError'
        ? 'Délai dépassé — vérifiez que l’API (port 3001) est démarrée.'
        : 'Erreur lors du chargement'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveRules(e: React.FormEvent) {
    e.preventDefault()
    setSavingRules(true)
    try {
      const res = await fetchWithRetry(`${API_URL}/leads/deduplicate/rules?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rules)
      })
      if (!res.ok) throw new Error()
      toast.success('Règles sauvegardées!')
      setShowRules(false)
      fetchDuplicates()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSavingRules(false)
    }
  }

  async function handleDelete(leadId: string) {
    if (!confirm('Supprimer ce lead dupliqué ?')) return
    setDeleting(leadId)
    try {
      const res = await fetchWithRetry(`${API_URL}/leads/deduplicate/${leadId}?company_id=${COMPANY_ID}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Lead supprimé!')
      fetchDuplicates()
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  function openMerge(primary: any, duplicate: any) {
    setMergingLeads({ primary, duplicate })
    setMergeFields({
      customer_name: primary.customer_name || duplicate.customer_name || '',
      customer_email: primary.customer_email || duplicate.customer_email || '',
      customer_phone: primary.customer_phone || duplicate.customer_phone || '',
      company_name: primary.company_name || duplicate.company_name || '',
      industry: primary.industry || duplicate.industry || '',
      website: primary.website || duplicate.website || '',
      linkedin_url: primary.linkedin_url || duplicate.linkedin_url || '',
    })
  }

  async function handleMerge() {
    if (!mergingLeads) return
    setMerging(mergingLeads.primary.lead_id)
    try {
      const res = await fetchWithRetry(`${API_URL}/leads/deduplicate/merge?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_lead_id: mergingLeads.primary.lead_id,
          duplicate_lead_id: mergingLeads.duplicate.lead_id,
          fields_to_keep: mergeFields
        })
      })
      if (!res.ok) throw new Error()
      toast.success('Leads fusionnés avec succès!')
      setMergingLeads(null)
      fetchDuplicates()
    } catch {
      toast.error('Erreur lors de la fusion')
    } finally {
      setMerging(null)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Déduplication</h1>
          <p className="text-sm text-gray-500 mt-1">Détection et fusion automatique des leads en double</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRules(!showRules)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            ⚙️ Règles
          </button>
          <button onClick={fetchDuplicates}
            className="px-4 py-2 bg-[#7C4DFF] text-white rounded-lg hover:bg-[#FD1D1D]">
            🔄 Relancer
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7C4DFF] mx-auto"></div>
          <p className="mt-3 text-gray-500">Analyse en cours...</p>
        </div>
      ) : (
        <>
          {showRules && (
            <form onSubmit={handleSaveRules} className="bg-white rounded-lg border p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">⚙️ Règles de déduplication</h2>
              <div className="space-y-3">
                {[
                  { field: 'match_on_email', label: 'Détecter par Email', desc: 'Deux leads avec le même email sont considérés comme doublons' },
                  { field: 'match_on_phone', label: 'Détecter par Téléphone', desc: 'Deux leads avec le même téléphone sont considérés comme doublons' },
                  { field: 'match_on_name', label: 'Détecter par Nom', desc: 'Deux leads avec le même nom sont considérés comme doublons' },
                ].map(item => (
                  <label key={item.field} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox"
                      checked={(rules as any)[item.field]}
                      onChange={(e) => setRules({ ...rules, [item.field]: e.target.checked })}
                      className="w-4 h-4 accent-[#7C4DFF]" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button type="submit" disabled={savingRules}
                  className="px-6 py-2 bg-[#7C4DFF] text-white rounded-lg hover:bg-[#FD1D1D] disabled:opacity-50">
                  {savingRules ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                <button type="button" onClick={() => setShowRules(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg">
                  Annuler
                </button>
              </div>
            </form>
          )}

          {duplicates.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-lg font-semibold text-gray-700">Aucun doublon détecté!</p>
              <p className="text-gray-400 mt-2">Tous vos leads sont uniques.</p>
            </div>
          ) : (
            <div className="space-y-6">
          <p className="text-sm text-gray-500">{duplicates.length} groupe(s) de doublons détecté(s)</p>
          {duplicates.map((group, index) => (
            <div key={index} className="bg-white rounded-lg border border-orange-200 overflow-hidden">
              <div className="bg-orange-50 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-orange-500">⚠️</span>
                  <span className="text-sm font-semibold text-orange-800">
                    Doublon par {group.match_type === 'email' ? 'Email' : 'Téléphone'}
                  </span>
                  <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
                    {group.match_value}
                  </span>
                </div>
                <span className="text-xs text-orange-600">{group.count} leads identiques</span>
              </div>
              <div className="divide-y divide-gray-100">
                {group.leads?.map((lead: any, i: number) => (
                  <div key={lead.lead_id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-green-500' : 'bg-orange-400'}`}>
                        {i === 0 ? '✓' : i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{lead.customer_name || 'Sans nom'}</p>
                        <p className="text-xs text-gray-500">{lead.customer_email || '-'} • {lead.customer_phone || '-'}</p>
                        <p className="text-xs text-gray-400">{lead.company_name || '-'} • Créé le {new Date(lead.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${i === 0 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {i === 0 ? 'Original' : 'Doublon'}
                      </span>
                      {i !== 0 && (
                        <>
                          <button
                            onClick={() => openMerge(group.leads[0], lead)}
                            disabled={merging === group.leads[0].lead_id}
                            className="px-3 py-1 bg-[#833AB4] text-white text-xs rounded-lg hover:bg-[#7C4DFF] disabled:opacity-50">
                            🔀 Fusionner
                          </button>
                          <button
                            onClick={() => handleDelete(lead.lead_id)}
                            disabled={deleting === lead.lead_id}
                            className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 disabled:opacity-50">
                            {deleting === lead.lead_id ? '...' : 'Supprimer'}
                          </button>
                        </>
                      )}
                      <a href={`/leads/${lead.lead_id}`}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200">
                        Voir
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
            </div>
          )}
        </>
      )}

      {/* MERGE MODAL */}
      {mergingLeads && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-2">🔀 Fusionner les leads</h2>
            <p className="text-sm text-gray-500 mb-4">Choisissez les valeurs à garder dans le lead fusionné</p>

            <div className="space-y-3">
              {[
                { label: 'Nom', field: 'customer_name' },
                { label: 'Email', field: 'customer_email' },
                { label: 'Téléphone', field: 'customer_phone' },
                { label: 'Entreprise', field: 'company_name' },
                { label: 'Secteur', field: 'industry' },
                { label: 'Site web', field: 'website' },
                { label: 'LinkedIn', field: 'linkedin_url' },
              ].map(item => (
                <div key={item.field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
                  <div className="flex gap-2 items-center">
                    <button type="button"
                      onClick={() => setMergeFields({ ...mergeFields, [item.field]: mergingLeads.primary[item.field] })}
                      className={`flex-1 p-2 text-xs border rounded-lg text-left transition-all ${mergeFields[item.field] === mergingLeads.primary[item.field] ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="text-green-600 font-medium">Original: </span>
                      {mergingLeads.primary[item.field] || '-'}
                    </button>
                    <button type="button"
                      onClick={() => setMergeFields({ ...mergeFields, [item.field]: mergingLeads.duplicate[item.field] })}
                      className={`flex-1 p-2 text-xs border rounded-lg text-left transition-all ${mergeFields[item.field] === mergingLeads.duplicate[item.field] ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="text-orange-600 font-medium">Doublon: </span>
                      {mergingLeads.duplicate[item.field] || '-'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleMerge} disabled={!!merging}
                className="flex-1 py-2 bg-[#833AB4] text-white rounded-lg hover:bg-[#7C4DFF] disabled:opacity-50">
                {merging ? 'Fusion en cours...' : '🔀 Confirmer la fusion'}
              </button>
              <button onClick={() => setMergingLeads(null)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}