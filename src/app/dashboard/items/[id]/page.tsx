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

  const { data: item, error } = await supabase
    .from('items')
    .select('id,title,category,description,secret_identification_mark,image_url,qr_code_id,is_lost,reward_amount,created_at')
    .eq('id', id)
    .single()

  if (error || !item) {
    notFound()
  }

  const { data: order } = await supabase
    .from('qr_fulfillment_orders')
    .select('status')
    .eq('item_id', id)
    .maybeSingle()

  return <ItemDetailClient item={item} fulfillmentStatus={order?.status ?? null} />
}