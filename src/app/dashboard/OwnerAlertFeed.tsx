'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type FoundReport = {
  id: string
  item_id: string
  finder_type: string | null
  finder_id: string | null
  finder_name: string | null
  notes: string | null
  found_image_url: string | null
  latitude: number | null
  longitude: number | null
  status: string | null
  created_at: string
  items?: { title: string | null } | { title: string | null }[] | null
}

const reportDateFormatter = new Intl.DateTimeFormat('en-IN', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

function reportItemTitle(report: FoundReport) {
  if (Array.isArray(report.items)) {
    return report.items[0]?.title ?? 'Tagged item'
  }
  return report.items?.title ?? 'Tagged item'
}

export default function OwnerAlertFeed({ initialReports }: { initialReports: FoundReport[] }) {
  const [reports, setReports] = useState(initialReports)
  const [newReportIds, setNewReportIds] = useState<Set<string>>(new Set())

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
            .select('id,item_id,finder_type,finder_id,finder_name,notes,found_image_url,latitude,longitude,status,created_at,items(title)')
            .eq('id', insertedReport.id)
            .single<FoundReport>()

          const nextReport = data ?? insertedReport
          setReports((current) => (current.some((r) => r.id === nextReport.id) ? current : [nextReport, ...current]))
          setNewReportIds((current) => new Set(current).add(nextReport.id))
          window.setTimeout(() => {
            setNewReportIds((current) => {
              const next = new Set(current)
              next.delete(nextReport.id)
              return next
            })
          }, 4200)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const activeReports = useMemo(() => reports.filter((r) => r.status !== 'resolved'), [reports])

  return (
    <section className="mt-10" aria-labelledby="owner-alert-feed-heading">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="live-indicator mb-3 w-fit" aria-label="Supabase Realtime is listening for found reports">
            <span className="live-dot" />
            Live
          </div>
          <h2 id="owner-alert-feed-heading" className="font-display text-4xl font-semibold text-[var(--color-ink)]">Owner alert feed</h2>
          <p className="mt-2 max-w-2xl text-[var(--color-ink-muted)]">Click a report to see full details, location, and next steps.</p>
        </div>
        <p className="font-utility rounded-full bg-white/70 px-3 py-2 text-xs font-bold uppercase text-[var(--color-ink-muted)]">{activeReports.length} open</p>
      </div>

      {activeReports.length === 0 ? (
        <div className="rounded-[1.35rem] border border-dashed border-[var(--color-line)] bg-white/60 p-6 text-[var(--color-ink-muted)]">
          No open found reports yet. When a finder scans a lost tag, the alert will appear here without refreshing.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {activeReports.map((report) => {
            const isRegistered = report.finder_type === 'registered' && report.finder_id
            const href = isRegistered ? `/dashboard/messages/${report.id}` : `/dashboard/reports/${report.id}`

            return (
              <Link key={report.id} href={href} className={`found-report-card block ${newReportIds.has(report.id) ? 'found-report-card-new' : ''}`}>
                {newReportIds.has(report.id) && <p className="new-report-ribbon">New report just arrived</p>}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="status-pill status-lost">! Found report</span>
                    <span className="ml-2 text-xs font-bold text-[var(--color-ink-muted)]">{reportDateFormatter.format(new Date(report.created_at))}</span>
                    <h3 className="mt-3 text-2xl font-black text-[var(--color-ink)]">{reportItemTitle(report)}</h3>
                    <p className="mt-1 text-sm font-bold text-[var(--color-ink-muted)]">Finder: {report.finder_name || 'Helpful finder'}</p>
                  </div>
                  {report.found_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={report.found_image_url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                  )}
                </div>
                <p className={`mt-3 inline-block rounded-full px-4 py-2 text-sm font-black ${isRegistered ? 'bg-[var(--color-primary-trust)]/12 text-[var(--color-primary-trust-dark)]' : 'bg-white text-[var(--color-ink)] ring-1 ring-[var(--color-line)]'}`}>
                  {isRegistered ? 'Message finder →' : 'View report →'}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}