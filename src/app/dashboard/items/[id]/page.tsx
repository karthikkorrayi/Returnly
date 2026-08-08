import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
    .select('*')
    .eq('id', id)
    .single()

  if (error || !item) {
    notFound()
  }

  const scanUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/item/${item.qr_code_id}`
  const qrImageUrl = `/api/generate-qr?text=${encodeURIComponent(scanUrl)}`

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="tag-card mx-auto max-w-md space-y-5 p-6">
        <h1 className="font-display pr-10 text-4xl font-semibold text-[var(--color-ink)]">{item.title}</h1>
        {item.category && <p className="text-[var(--color-ink-muted)]">{item.category}</p>}

        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.title}
            className="max-h-64 w-full rounded-2xl object-cover"
          />
        )}

        <div className="border-t border-[var(--color-line)] pt-5">
          <h2 className="mb-2 font-semibold text-[var(--color-ink)]">Item QR code</h2>
          <p className="font-utility mb-3 text-xs text-[var(--color-ink-muted)]">{item.qr_code_id}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageUrl}
            alt="QR code for this item"
            className="mx-auto rounded-2xl border border-[var(--color-line)] bg-white p-3"
          />
          <a
            href={qrImageUrl}
            download={`${item.title}-qr.png`}
            className="mt-3 block rounded-full py-3 text-center text-sm font-bold text-[var(--color-primary-trust)] hover:bg-[rgb(42_111_119_/_0.08)]"
          >
            Download QR Code
          </a>
        </div>
      </div>
    </div>
  )
}