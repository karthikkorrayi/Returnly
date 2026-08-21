'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const normalizedEmail = email.trim()

    // redirectTo points at the SAME callback route used for email
    // confirmation — it already knows how to exchange a code for a
    // session, we're just telling it to land on /reset-password next
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      }
    )

    setLoading(false)

    // Supabase does not error on an unknown email, by design — this
    // prevents the form from being used to check which emails have
    // an account. Always show the same confirmation state.
    if (resetError) {
      setError(resetError.message)
      return
    }

    setSubmittedEmail(normalizedEmail)
  }

  if (submittedEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <section className="w-full max-w-sm rounded-[1.35rem] border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--shadow-card)] sm:p-7">
          <p className="status-pill status-safe w-fit">Reset link sent</p>
          <h1 className="font-display mt-3 text-4xl font-semibold leading-none text-[var(--color-ink)]">
            Check your inbox
          </h1>
          <p className="mt-4 text-sm leading-6 text-[var(--color-ink-muted)]">
            If an account exists for <span className="font-bold text-[var(--color-ink)]">{submittedEmail}</span>,
            we sent a link to reset your password. Open it to choose a new one.
          </p>
          <div className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-base-bg)] p-4 text-sm text-[var(--color-ink-muted)]">
            No email yet? Check spam, or try again in a few minutes.
          </div>
          <button
            type="button"
            onClick={() => setSubmittedEmail('')}
            className="mt-3 w-full text-center text-sm font-bold text-[var(--color-ink-muted)] hover:underline"
          >
            ← Wrong email? Go back
          </button>
          <Link href="/login" className="btn-primary mt-4 block w-full px-4 py-3 text-center">
            Back to login
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[1.35rem] border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--shadow-card)] sm:p-7"
      >
        <div className="mb-6 space-y-2">
          <p className="font-utility text-xs font-bold uppercase text-[var(--color-primary-trust)]">Returnly</p>
          <h1 className="font-display text-4xl font-semibold leading-none text-[var(--color-ink)]">Reset password</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">Enter your account email and we&apos;ll send a reset link.</p>
        </div>

        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-[var(--color-alert-lost)]/30 bg-[var(--color-alert-lost-soft)] p-3 text-sm font-medium text-[#7a3d0b]" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="shrink-0 text-lg font-bold leading-none text-[#7a3d0b] hover:opacity-70">×</button>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-[var(--color-ink)]" htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field mt-1"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-6 w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          aria-busy={loading}
        >
          {loading ? 'Sending link…' : 'Send reset link'}
        </button>

        <p className="mt-5 text-center text-sm text-[var(--color-ink-muted)]">
          <Link href="/login" className="font-bold text-[var(--color-primary-trust)] hover:text-[var(--color-primary-trust-dark)]">
            ← Back to login
          </Link>
        </p>
      </form>
    </main>
  )
}