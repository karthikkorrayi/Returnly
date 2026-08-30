import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()

  // notFound() rather than a "you're not authorized" message — this
  // avoids confirming to a non-admin that an admin area even exists
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