'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const searchParamsResetFlag = searchParams.get('reset')
  // Where to send the user after login — defaults to the dashboard,
  // but respects a ?next= param set by pages like the lost-item scan page
  const next = searchParams.get('next') || '/dashboard'

  const handleLogin = async (e: React.FormEvent) => {
    const supabase = createClient()
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm rounded-[1.35rem] border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--shadow-card)] sm:p-7"
      >
        <div className="mb-6 space-y-2">
          <p className="font-utility text-xs font-bold uppercase text-[var(--color-primary-trust)]">Returnly</p>
          <h1 className="font-display text-4xl font-semibold leading-none text-[var(--color-ink)]">Log in</h1>
        </div>

        {searchParamsResetFlag === 'success' && !error && (
        <p className="mb-5 rounded-xl border border-[var(--color-primary-trust)]/30 bg-[var(--color-primary-trust)]/10 p-3 text-sm font-medium text-[var(--color-primary-trust-dark)]">
            Password updated. Log in with your new password.
        </p>
        )}

        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-[var(--color-alert-lost)]/30 bg-[var(--color-alert-lost-soft)] p-3 text-sm font-medium text-[#7a3d0b]" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="shrink-0 text-lg font-bold leading-none text-[#7a3d0b] hover:opacity-70"
            >
              ×
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--color-ink)]" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-ink)]" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field mt-1"
            />
          </div>
            <p className="text-right text-sm">
                <Link href="/forgot-password" className="font-bold text-[var(--color-primary-trust-dark)] hover:underline">
                    Forgot password?
                </Link>
            </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-6 w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          aria-busy={loading}
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>

        <p className="mt-5 text-center text-sm text-[var(--color-ink-muted)]">
          New to Returnly?{' '}
          <Link href="/signup" className="font-bold text-[var(--color-primary-trust)] hover:text-[var(--color-primary-trust-dark)]">
            Create account
          </Link>
        </p>
      </form>
    </main>
  )
}