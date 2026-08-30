'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setLoading(false)
      setError(signInError.message)
      return
    }

    // A clear message here beats a silent 404 right after a
    // successful login — the layout's notFound() is still the real
    // enforcement, this is just better feedback for a real admin
    // who mistyped which account they meant to use
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', data.user.id).single()
    setLoading(false)

    if (!profile?.is_admin) {
      setError('This account does not have admin access.')
      await supabase.auth.signOut()
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1c1f26] px-4 py-8">
      <form onSubmit={handleLogin} className="w-full max-w-sm rounded-[1.35rem] border border-white/10 bg-[#242832] p-6 shadow-2xl sm:p-7">
        <p className="font-utility text-xs font-bold uppercase text-white/50">Returnly</p>
        <h1 className="font-display mt-1 text-3xl font-semibold text-white">Admin sign in</h1>
        <p className="mt-2 text-sm text-white/60">Restricted access. Use your admin account credentials.</p>

        {error && (
          <p className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 text-sm font-medium text-orange-300" role="alert">
            {error}
          </p>
        )}

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-bold text-white/80">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/30" autoComplete="email" />
          </div>
          <div>
            <label className="block text-sm font-bold text-white/80">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/30" autoComplete="current-password" />
          </div>
        </div>

        <button type="submit" disabled={loading} className="mt-6 w-full rounded-full bg-white px-4 py-3 font-bold text-[#1c1f26] disabled:opacity-60">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}