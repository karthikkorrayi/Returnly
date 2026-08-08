import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold text-gray-800">
        Welcome, {user.email}
      </h1>
      <p className="text-gray-600 mt-2">
        Your items dashboard will go here (Phase 2).
      </p>
    </main>
  )
}