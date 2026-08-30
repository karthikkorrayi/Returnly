import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
    .select('id,title,is_lost')
    .eq('qr_code_id', qrId)
    .single()

  if (!item || !item.is_lost) {
    redirect(`/item/${qrId}`)
  }

  const { data: existingReport } = await supabase
    .from('found_reports')
    .select('id')
    .eq('item_id', item.id)
    .eq('finder_id', user.id)
    .eq('finder_type', 'registered')
    .neq('status', 'resolved')
    .maybeSingle()

  let reportId = existingReport?.id

  if (!reportId) {
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

    const { data: newReport, error: insertError } = await supabase
      .from('found_reports')
      .insert({
        item_id: item.id,
        finder_type: 'registered',
        finder_id: user.id,
        finder_name: profile?.full_name ?? 'Returnly user',
        status: 'pending',
        chat_status: 'requested',
      })
      .select('id')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        // The unique index caught a race (double-click, retry, etc.) —
        // fetch the row that actually won instead of erroring
        const { data: winnerReport } = await supabase
          .from('found_reports')
          .select('id')
          .eq('item_id', item.id)
          .eq('finder_id', user.id)
          .eq('finder_type', 'registered')
          .neq('status', 'resolved')
          .single()

        reportId = winnerReport?.id
      }
    } else {
      reportId = newReport.id

      // Default first message — only on genuine creation, so revisiting
      // an existing chat never re-sends the greeting
      await supabase.from('messages').insert({
        report_id: reportId,
        sender_id: user.id,
        body: `Hi, I found your ${item.title}!`,
      })
    }
  }

  if (!reportId) {
    redirect(`/item/${qrId}`)
  }

  redirect(`/dashboard/messages/${reportId}?justConnected=1`)
}