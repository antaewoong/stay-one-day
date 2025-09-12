'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function SystemCheck() {
  const [envInfo, setEnvInfo] = useState<any>(null)
  const [authInfo, setAuthInfo] = useState<any>(null)
  const [err, setErr] = useState<string>('')

  useEffect(() => { fetch('/api/_debug/supabase').then(r=>r.json()).then(setEnvInfo).catch(e=>setErr(String(e))) }, [])

  async function runAuthCheck() {
    try {
      const sb = (window as any).__sod_supabase__ || (window as any).supabase || createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: { session } } = await sb.auth.getSession()
      const token = session?.access_token
      const res = await fetch('/api/_debug/auth-check', { headers: { Authorization: `Bearer ${token||''}`, 'x-supabase-auth': token||'' } })
      const json = await res.json()
      setAuthInfo({ status: res.status, ...json })
    } catch (e:any) { setErr(String(e?.message||e)) }
  }

  return (
    <div style={{maxWidth:720,margin:'40px auto',fontFamily:'ui-sans-serif'}}>
      <h1 style={{fontSize:22,fontWeight:700}}>System Check</h1>
      <section style={{marginTop:20}}>
        <h2 style={{fontSize:18,fontWeight:600}}>Environment</h2>
        <pre style={{background:'#111',color:'#0f0',padding:12,borderRadius:8,overflow:'auto'}}>
          {envInfo ? JSON.stringify(envInfo, null, 2) : 'Loading...'}
        </pre>
      </section>
      <section style={{marginTop:20}}>
        <h2 style={{fontSize:18,fontWeight:600}}>Auth → getUser()</h2>
        <button onClick={runAuthCheck} style={{padding:'8px 12px',borderRadius:8,border:'1px solid #333'}}>Run</button>
        <pre style={{background:'#111',color:'#0ff',padding:12,borderRadius:8,overflow:'auto',marginTop:10}}>
          {authInfo ? JSON.stringify(authInfo, null, 2) : 'Not run'}
        </pre>
      </section>
      {err && <p style={{color:'tomato'}}>Error: {err}</p>}
    </div>
  )
}