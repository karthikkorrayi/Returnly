'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type FoundReport = {
  id: string
  item_id: string
  finder_name: string | null
  note: string | null
  latitude: number | null
  longitude: number | null
  status: string | null
  created_at: string
  items?: { title: string | null } | { title: string | null }[] | null
}

type OwnerAlertFeedProps = {
  initialReports: FoundReport[]
}

const reportDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

function formatCoordinates(latitude: number | null, longitude: number | null) {
  if (latitude === null || longitude === null) {
    return 'Location not shared'
  }

  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
}

function reportItemTitle(report: FoundReport) {
  if (Array.isArray(report.items)) {
    return report.items[0]?.title ?? 'Tagged item'
  }

  return report.items?.title ?? 'Tagged item'
}

function staticMapUrl(latitude: number | null, longitude: number | null) {
  if (latitude === null || longitude === null) {
    return null
  }

  const marker = `${latitude},${longitude}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.01}%2C${longitude + 0.01}%2C${latitude + 0.01}&layer=mapnik&marker=${marker}`
}

export default function OwnerAlertFeed({ initialReports }: OwnerAlertFeedProps) {
  const [reports, setReports] = useState(initialReports)
  const [newReportIds, setNewReportIds] = useState<Set<string>>(new Set())
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('owner-found-report-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'found_reports' },
        async (payload) => {
          const insertedReport = payload.new as FoundReport
          const { data } = await supabase
            .from('found_reports')
            .select('id,item_id,finder_name,note,latitude,longitude,status,created_at,items(title)')
            .eq('id', insertedReport.id)
            .single<FoundReport>()

          const nextReport = data ?? insertedReport
          setReports((currentReports) => {
            if (currentReports.some((report) => report.id === nextReport.id)) {
              return currentReports
            }

            return [nextReport, ...currentReports]
          })
          setNewReportIds((currentIds) => new Set(currentIds).add(nextReport.id))
          window.setTimeout(() => {
            setNewReportIds((currentIds) => {
              const nextIds = new Set(currentIds)
              nextIds.delete(nextReport.id)
              return nextIds
            })
          }, 4200)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const activeReports = useMemo(
    () => reports.filter((report) => report.status !== 'resolved'),
    [reports],
  )

  async function markAsRecovered(reportId: string, itemId: string) {
    const supabase = createClient()
    setError(null)
    setResolvingIds((currentIds) => new Set(currentIds).add(reportId))

    const { error: reportError } = await supabase
      .from('found_reports')
      .update({ status: 'resolved' })
      .eq('id', reportId)

    const { error: itemError } = await supabase
      .from('items')
      .update({ is_lost: false })
      .eq('id', itemId)

    if (reportError || itemError) {
      setError(reportError?.message ?? itemError?.message ?? 'Unable to mark this report recovered.')
      setResolvingIds((currentIds) => {
        const nextIds = new Set(currentIds)
        nextIds.delete(reportId)
        return nextIds
      })
      return
    }

    window.setTimeout(() => {
      setReports((currentReports) => currentReports.map((report) => (report.id === reportId ? { ...report, status: 'resolved' } : report)))
      setResolvingIds((currentIds) => {
        const nextIds = new Set(currentIds)
        nextIds.delete(reportId)
        return nextIds
      })
    }, 760)
  }

  return (
    <section className="mt-10" aria-labelledby="owner-alert-feed-heading">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="live-indicator mb-3 w-fit" aria-label="Supabase Realtime is listening for found reports">
            <span className="live-dot" />
            Live
          </div>
          <h2 id="owner-alert-feed-heading" className="font-display text-4xl font-semibold text-[var(--color-ink)]">Owner alert feed</h2>
          <p className="mt-2 max-w-2xl text-[var(--color-ink-muted)]">Incoming found reports slide in here automatically with finder details and a map pin preview.</p>
        </div>
        <p className="font-utility rounded-full bg-white/70 px-3 py-2 text-xs font-bold uppercase text-[var(--color-ink-muted)]">{activeReports.length} open</p>
      </div>

      {error && <p className="mb-4 rounded-2xl bg-[var(--color-alert-lost-soft)] p-4 text-sm font-bold text-[#7a3d0b]">{error}</p>}

      {activeReports.length === 0 ? (
        <div className="rounded-[1.35rem] border border-dashed border-[var(--color-line)] bg-white/60 p-6 text-[var(--color-ink-muted)]">No open found reports yet. When a finder scans a lost tag, the alert will appear here without refreshing.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {activeReports.map((report) => {
            const mapUrl = staticMapUrl(report.latitude, report.longitude)
            const isResolving = resolvingIds.has(report.id)
            return (
              <article key={report.id} className={`found-report-card ${newReportIds.has(report.id) ? 'found-report-card-new' : ''} ${isResolving ? 'found-report-card-recovered' : ''}`}>
                {newReportIds.has(report.id) && <p className="new-report-ribbon">New report just arrived</p>}
                <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
                  <div className="map-preview" aria-label={`Map pin preview for ${formatCoordinates(report.latitude, report.longitude)}`}>
                    {mapUrl ? <iframe title="Found report location map" src={mapUrl} loading="lazy" /> : <span className="map-pin-fallback">⌖</span>}
                  </div>
                  <div className="flex min-w-0 flex-col justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={isResolving ? 'status-pill status-recovered' : 'status-pill status-lost'}>{isResolving ? '✓ Recovered' : '! Found report'}</span>
                        <span className="text-xs font-bold text-[var(--color-ink-muted)]">{reportDateFormatter.format(new Date(report.created_at))}</span>
                      </div>
                      <h3 className="mt-3 text-2xl font-black text-[var(--color-ink)]">{reportItemTitle(report)}</h3>
                      <p className="mt-1 text-sm font-bold text-[var(--color-ink-muted)]">Finder: {report.finder_name || 'Helpful finder'}</p>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-ink-muted)]">{report.note || 'No note included yet.'}</p>
                      <p className="font-utility mt-3 text-xs font-bold uppercase text-[var(--color-ink-muted)]">{formatCoordinates(report.latitude, report.longitude)}</p>
                    </div>
                    <button type="button" className="btn-recovered px-5 py-3" disabled={isResolving} onClick={() => markAsRecovered(report.id, report.item_id)}>
                      {isResolving ? 'Reuniting…' : 'Mark as Recovered'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}