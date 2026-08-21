'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    const supabase = createClient()
    e.preventDefault()
    setError(null)
    setLoading(true)

    const normalizedEmail = email.trim()
    const { error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    setSubmittedEmail(normalizedEmail)
    setLoading(false)
  }

  if (submittedEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <section className="w-full max-w-sm rounded-[1.35rem] border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--shadow-card)] sm:p-7" aria-labelledby="confirm-email-title">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="status-pill status-safe w-fit">Email confirmation</p>
              <h1 id="confirm-email-title" className="font-display text-4xl font-semibold leading-none text-[var(--color-ink)]">
                Check your inbox
              </h1>
            </div>
            <div className="relative h-14 w-14 shrink-0 rounded-2xl border border-[var(--color-line)] bg-[var(--color-alert-lost-soft)] shadow-inner" aria-hidden="true">
              <div className="absolute left-3 top-4 h-6 w-8 rounded-md border border-[var(--color-alert-lost)] bg-white/80" />
              <div className="absolute left-5 top-1.5 h-8 w-8 rotate-12 rounded-md bg-[var(--color-primary-trust)]/15 [clip-path:polygon(0_0,72%_0,100%_28%,100%_100%,0_100%)]" />
            </div>
          </div>

          <div className="space-y-4 text-sm leading-6 text-[var(--color-ink-muted)]">
            <p>
              We sent a confirmation link to <span className="font-bold text-[var(--color-ink)]">{submittedEmail}</span>.
            </p>
            <p>
              Open that email and confirm your address before returning to Returnly. Your account will not be ready until that step is complete.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-base-bg)] p-4 text-sm text-[var(--color-ink-muted)]">
            No email yet? Check spam or try signing up again with the same address in a few minutes.
          </div>

          <Link href="/login" className="btn-primary mt-6 w-full px-4 py-3">
            Go to login
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-sm rounded-[1.35rem] border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-6 shadow-[var(--shadow-card)] sm:p-7"
      >
        <div className="mb-6 space-y-2">
          <p className="font-utility text-xs font-bold uppercase text-[var(--color-primary-trust)]">Returnly</p>
          <h1 className="font-display text-4xl font-semibold leading-none text-[var(--color-ink)]">Create account</h1>
        </div>

        {error && (
          <p className="mb-5 rounded-xl border border-[var(--color-alert-lost)]/30 bg-[var(--color-alert-lost-soft)] p-3 text-sm font-medium text-[#7a3d0b]" role="alert">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--color-ink)]" htmlFor="full-name">Full name</label>
            <input
              id="full-name"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-ink)]" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-ink)]" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        {/* <button
          type="button"
          onClick={() => setSubmittedEmail('')}
          className="mt-3 w-full text-center text-sm font-bold text-[var(--color-ink-muted)] hover:underline"
        >
          ← Entered the wrong email? Go back
        </button> */}

        <p className="mt-5 text-center text-sm text-[var(--color-ink-muted)]">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[var(--color-primary-trust)] hover:text-[var(--color-primary-trust-dark)]">
            Log in
          </Link>
        </p>
      </form>
    </main>
  )
}