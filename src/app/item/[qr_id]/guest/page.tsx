import { notFound } from 'next/navigation'
import GuestReportFlow from './GuestReportFlow'
import { createClient } from '@/lib/supabase/server'

type GuestItem = {
  id: string
  title: string
  is_lost: boolean
}

export default async function GuestReportPage({
  params,
}: {
  params: Promise<{ qr_id: string }>
}) {
  const { qr_id: qrId } = await params
  const supabase = await createClient()

  const { data: item, error } = await supabase
    .from('items_public')
    .select('id,title,is_lost')
    .eq('qr_code_id', qrId)
    .single<GuestItem>()

  if (error || !item || !item.is_lost) {
    notFound()
  }

  return <GuestReportFlow itemId={item.id} itemTitle={item.title} />
}