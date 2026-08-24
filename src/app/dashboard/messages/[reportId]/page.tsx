import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatThread from './ChatThread'

export default async function MessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ reportId: string }>
  searchParams: Promise<{ justConnected?: string }>
}) {
  const { reportId } = await params
  const { justConnected } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: report, error } = await supabase
    .from('found_reports')
    .select('id,item_id,finder_id,finder_name,status,items(title,user_id)')
    .eq('id', reportId)
    .single()

  if (error || !report) {
    notFound()
  }

  const itemRecord = Array.isArray(report.items) ? report.items[0] : report.items
  const isOwner = itemRecord?.user_id === user.id
  const isFinder = report.finder_id === user.id

  if (!isOwner && !isFinder) {
    notFound()
  }

  const { data: initialMessages } = await supabase
    .from('messages')
    .select('id,sender_id,body,created_at')
    .eq('report_id', reportId)
    .order('created_at', { ascending: true })

  return (
    <ChatThread
      reportId={reportId}
      currentUserId={user.id}
      isOwner={isOwner}
      itemTitle={itemRecord?.title ?? 'this item'}
      reportStatus={report.status ?? 'pending'}
      initialMessages={initialMessages ?? []}
      justConnected={justConnected === '1'}
    />
  )
}