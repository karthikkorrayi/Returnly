'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    const supabase = createClient()
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh() // ensures server components pick up new auth state
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <form
        onSubmit={handleLogin}
        className="tag-card w-full max-w-sm space-y-5 p-6"
      >
        <h1 className="font-display pr-10 text-4xl font-semibold text-[var(--color-ink)]">Log in</h1>

        {error && (
          <p className="rounded-xl bg-[var(--color-alert-lost-soft)] p-3 text-sm font-medium text-[#7a3d0b]">{error}</p>
        )}

        <div>
          <label className="block text-sm font-bold text-[var(--color-ink)]">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field mt-1"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-ink)]">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field mt-1"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full px-4 py-3 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </div>
  )
}