'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // Sign out the temporary recovery session on purpose — the person
    // asked for this explicitly: prove the new password works by
    // logging in fresh, rather than silently staying authenticated
    await supabase.auth.signOut()

    router.push('/login?reset=success')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[1.35rem] border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--shadow-card)] sm:p-7"
      >
        <div className="mb-6 space-y-2">
          <p className="font-utility text-xs font-bold uppercase text-[var(--color-primary-trust)]">Returnly</p>
          <h1 className="font-display text-4xl font-semibold leading-none text-[var(--color-ink)]">Choose a new password</h1>
        </div>

        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-[var(--color-alert-lost)]/30 bg-[var(--color-alert-lost-soft)] p-3 text-sm font-medium text-[#7a3d0b]" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="shrink-0 text-lg font-bold leading-none text-[#7a3d0b] hover:opacity-70">×</button>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--color-ink)]" htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-ink)]" htmlFor="confirm-password">Confirm password</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field mt-1"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-6 w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          aria-busy={loading}
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </main>
  )
}