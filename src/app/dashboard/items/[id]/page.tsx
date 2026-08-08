import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ItemDetailClient from './ItemDetailClient'

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // RLS ensures this only returns a row if the current user owns it —
  // no need for a manual user_id check here, the database enforces it
  const { data: item, error } = await supabase
    .from('items')
    .select('id,title,category,description,secret_identification_mark,image_url,qr_code_id,is_lost,reward_amount,created_at')
    .eq('id', id)
    .single()

  if (error || !item) {
    notFound()
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const scanUrl = `${siteUrl}/item/${item.qr_code_id}`
  const qrImageUrl = `/api/generate-qr?text=${encodeURIComponent(scanUrl)}&width=1200`

  return <ItemDetailClient item={item} qrImageUrl={qrImageUrl} scanUrl={scanUrl} />
}