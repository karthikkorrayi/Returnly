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
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">{item.title}</h1>
        {item.category && <p className="text-gray-500">{item.category}</p>}

        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full rounded-md object-cover max-h-64"
          />
        )}

        <div className="border-t pt-4">
          <h2 className="font-semibold text-gray-700 mb-2">Item QR Code</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageUrl}
            alt="QR code for this item"
            className="mx-auto border rounded-md"
          />
          <a
            href={qrImageUrl}
            download={`${item.title}-qr.png`}
            className="block text-center mt-3 text-blue-600 hover:underline text-sm"
          >
            Download QR Code
          </a>
        </div>
      </div>
    </div>
  )
}