import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NotifyOwnerCard from './NotifyOwnerCard'

export default async function ContactOwnerPage({
  params,
}: {
  params: Promise<{ qr_id: string }>
}) {
  const { qr_id: qrId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/item/${qrId}/contact`)}`)
  }

  const { data: item } = await supabase
    .from('items_public')
    .select('id,user_id,title,is_lost')
    .eq('qr_code_id', qrId)
    .single()

  if (!item || !item.is_lost) {
    redirect(`/item/${qrId}`)
  }

  const { data: owner } = await supabase
    .from('profiles_public')
    .select('full_name')
    .eq('id', item.user_id)
    .single()

  const { data: existingReport } = await supabase
    .from('found_reports')
    .select('id,chat_status')
    .eq('item_id', item.id)
    .eq('finder_id', user.id)
    .eq('finder_type', 'registered')
    .neq('status', 'resolved')
    .maybeSingle()

  // Already accepted — no need for the popup, go straight into the chat
  if (existingReport?.chat_status === 'accepted') {
    redirect(`/dashboard/messages/${existingReport.id}`)
  }

  return (
    <NotifyOwnerCard
      itemId={item.id}
      itemTitle={item.title}
      ownerName={owner?.full_name || 'the owner'}
      existingReportId={existingReport?.id ?? null}
    />
  )
}