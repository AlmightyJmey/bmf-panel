'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email sau parola gresita.')
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: 'rgba(20,20,22,0.92)', border: '0.5px solid #2a2a2e',
        borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '340px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '50px', fontWeight: 500, color: '#fff', letterSpacing: '2px' }}>BMF</div>
          <div style={{ fontSize: '13px', color: '#7dc8ff', letterSpacing: '3px', fontWeight: 500 }}>SlaxRP</div>
          <div style={{ fontSize: '9px', color: '#666', letterSpacing: '5px', marginTop: '6px' }}>BLACK MAFIA FAMILY</div>
        </div>

        <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '5px' }}>Email</label>
        <input
          type="email"
          placeholder="email@exemplu.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ marginBottom: '12px' }}
        />

        <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '5px' }}>Parola</label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />

        <button
          className="btn-blue"
          style={{ width: '100%', marginTop: '1.5rem' }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Se conecteaza...' : 'Intra in panel'}
        </button>

        {error && (
          <div style={{ color: '#e24b4a', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
