import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MarkRecoveredButton from './MarkRecoveredButton'

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>
}) {
  const { reportId } = await params
  const supabase = await createClient()

  const { data: report, error } = await supabase
    .from('found_reports')
    .select('id,item_id,finder_name,finder_phone,notes,found_image_url,latitude,longitude,status,items(title)')
    .eq('id', reportId)
    .single()

  if (error || !report) {
    notFound()
  }

  const itemRecord = Array.isArray(report.items) ? report.items[0] : report.items
  const mapUrl =
    report.latitude && report.longitude
      ? `https://www.google.com/maps?q=${report.latitude},${report.longitude}`
      : null

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="text-sm font-bold text-[var(--color-primary-trust-dark)] hover:underline">← Back to dashboard</Link>

        <article className="tag-card mt-6 p-6 sm:p-7">
          <p className="status-pill status-lost w-fit">Found report</p>
          <h1 className="font-display mt-3 text-4xl font-semibold text-[var(--color-ink)]">{itemRecord?.title ?? 'Item'}</h1>

          <div className="mt-5 grid gap-2 text-sm">
            <p><span className="font-black text-[var(--color-ink)]">Finder:</span> <span className="text-[var(--color-ink-muted)]">{report.finder_name ?? 'Unknown'}</span></p>
            {report.finder_phone && <p><span className="font-black text-[var(--color-ink)]">Phone:</span> <span className="text-[var(--color-ink-muted)]">{report.finder_phone}</span></p>}
            <p><span className="font-black text-[var(--color-ink)]">Note:</span> <span className="text-[var(--color-ink-muted)]">{report.notes || 'No note included.'}</span></p>
          </div>

          {report.found_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={report.found_image_url} alt="Photo submitted by the finder" className="mt-4 max-h-72 w-full rounded-2xl object-cover" />
          )}

          {mapUrl && (
            <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-full border-2 border-[var(--color-primary-trust)] px-5 py-2 text-sm font-black text-[var(--color-primary-trust-dark)] hover:bg-[var(--color-primary-trust)]/10">
              Open location in Google Maps ↗
            </a>
          )}

          <div className="mt-6">
            {report.status === 'resolved' ? (
              <p className="rounded-2xl bg-[var(--color-success-reunited-soft)] p-4 text-sm font-bold text-[#435f3d]">Recovered.</p>
            ) : (
              <MarkRecoveredButton reportId={report.id} itemId={report.item_id} />
            )}
          </div>
        </article>
      </div>
    </main>
  )
}