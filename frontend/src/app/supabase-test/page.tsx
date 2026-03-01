'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SupabaseTest() {
  const [status, setStatus] = useState('Testing connection...')
  const [error, setError] = useState('')

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient()
        
        // Just test if we can connect to Supabase (not to a specific table)
        const { error } = await supabase.auth.getSession()
        
        if (error) {
          setStatus('❌ Connection failed')
          setError(error.message)
        } else {
          setStatus('✅ Connected to Supabase successfully!')
        }
      } catch (err: any) {
        setStatus('❌ Error')
        setError(err.message)
      }
    }

    testConnection()
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h1>Supabase Connection Test</h1>
      <div style={{ 
        padding: '20px', 
        background: status.includes('✅') ? '#e8f5e8' : '#ffebee',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2>{status}</h2>
        {error && <pre style={{ color: 'red' }}>{error}</pre>}
      </div>
      
      <div style={{ marginTop: '40px' }}>
        <h3>Next Steps:</h3>
        <p>Now we need to create the database tables in Supabase:</p>
        <ul>
          <li>leads table</li>
          <li>campaigns table</li>
          <li>segments table</li>
          <li>etc.</li>
        </ul>
      </div>
    </div>
  )
}