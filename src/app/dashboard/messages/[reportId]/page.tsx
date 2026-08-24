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
    .select('id,item_id,finder_id,finder_name,status,chat_status')
    .eq('id', reportId)
    .single()

  if (error || !report) {
    notFound()
  }

  // Fetch the item via items_public instead of embedding items(...) —
  // the base `items` table is owner-only under RLS, so embedding it
  // silently returns null for the finder's side. This was a real bug:
  // finders always saw "this item" instead of the real title.
  const { data: item } = await supabase
    .from('items_public')
    .select('title,user_id')
    .eq('id', report.item_id)
    .single()

  const isOwner = item?.user_id === user.id
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
      otherPartyName={isOwner ? report.finder_name || 'Finder' : 'the owner'}
      itemTitle={item?.title ?? 'this item'}
      reportStatus={report.status ?? 'pending'}
      chatStatus={report.chat_status}
      initialMessages={initialMessages ?? []}
      justConnected={justConnected === '1'}
    />
  )
}