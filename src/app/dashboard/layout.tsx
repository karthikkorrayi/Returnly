import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardHeader from './DashboardHeader'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader userEmail={user.email ?? ''} />
      {children}
    </div>
  )
}