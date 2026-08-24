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

  // Count of active/pending registered chats visible to this user —
  // RLS already restricts this to rows they're a participant in
  const { count } = await supabase
    .from('found_reports')
    .select('id', { count: 'exact', head: true })
    .eq('finder_type', 'registered')
    .neq('status', 'resolved')

  return (
    <div className="min-h-screen">
      <DashboardHeader userEmail={user.email ?? ''} chatCount={count ?? 0} />
      {children}
    </div>
  )
}