'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    const supabase = createClient()
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }, // stored in auth.users metadata
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // NOTE: we still need a DB trigger to copy this into `profiles`.
    // Covered in the next step — signUp alone does NOT create a profiles row.
    if (data.user) {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <form
        onSubmit={handleSignup}
        className="tag-card w-full max-w-sm space-y-5 p-6"
      >
        <h1 className="font-display pr-10 text-4xl font-semibold text-[var(--color-ink)]">Create account</h1>

        {error && (
          <p className="rounded-xl bg-[var(--color-alert-lost-soft)] p-3 text-sm font-medium text-[#7a3d0b]">{error}</p>
        )}

        <div>
          <label className="block text-sm font-bold text-[var(--color-ink)]">Full Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input-field mt-1"
          />
        </div>

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
            minLength={6}
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
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </div>
  )
}