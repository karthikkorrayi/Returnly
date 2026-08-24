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
    .select('id,is_lost')
    .eq('qr_code_id', qrId)
    .single()

  if (!item || !item.is_lost) {
    redirect(`/item/${qrId}`)
  }

  // Reuse an existing open report from this finder for this item,
  // rather than creating a fresh one every time they revisit
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const { data: newReport, error } = await supabase
      .from('found_reports')
      .insert({
        item_id: item.id,
        finder_type: 'registered',
        finder_id: user.id,
        finder_name: profile?.full_name ?? 'Returnly user',
        status: 'pending',
      })
      .select('id')
      .single()

    if (error || !newReport) {
      redirect(`/item/${qrId}`)
    }

    reportId = newReport.id
  }

  redirect(`/dashboard/messages/${reportId}?justConnected=1`)
}