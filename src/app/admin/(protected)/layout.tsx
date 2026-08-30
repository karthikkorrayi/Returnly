import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()

  // A logged-in but non-admin user still gets a 404, not "access
  // denied" — no reason to confirm to a regular user that this area
  // exists just because they happened to guess the URL
  if (!profile?.is_admin) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[var(--color-base-bg)]">
      <header className="border-b border-[var(--color-line)] bg-white/80 px-4 py-4">
        <p className="font-display text-2xl font-semibold text-[var(--color-ink)]">Returnly Admin</p>
      </header>
      {children}
    </div>
  )
}