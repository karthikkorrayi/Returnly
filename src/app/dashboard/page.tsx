import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import OwnerAlertFeed from './OwnerAlertFeed'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: foundReports, error: foundReportsError } = await supabase
    .from('found_reports')
    .select('id,item_id,finder_name,notes,latitude,longitude,status,created_at,items(title)')
    .neq('status', 'resolved')
    .order('created_at', { ascending: false })

  if (foundReportsError) {
    console.error('Failed to load found reports:', foundReportsError.message)
  }

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-utility text-xs font-bold uppercase text-[var(--color-primary-trust-dark)]">Owner dashboard</p>
            <h1 className="font-display mt-2 text-5xl font-semibold text-[var(--color-ink)]">Your tagged items</h1>
            <p className="mt-3 max-w-2xl text-[var(--color-ink-muted)]">Monitor every physical tag, switch into Lost Mode quickly, and see reward status at a glance.</p>
          </div>
          <Link href="/dashboard/items/new" className="btn-primary px-5 py-3 text-sm">
            Add item tag
          </Link>
        </div>

        {!items || items.length === 0 ? (
          <div className="tag-card p-8">
            <h2 className="font-display text-3xl font-semibold text-[var(--color-ink)]">No tagged items yet</h2>
            <p className="mt-2 text-[var(--color-ink-muted)]">Add your first item to generate a printable QR tag.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <Link key={item.id} href={`/dashboard/items/${item.id}`} className={`tag-card block p-5 hover:-translate-y-0.5 ${item.is_lost ? 'tag-card-lost' : ''}`}>
                <div className="flex min-h-52 flex-col justify-between gap-5 pr-8">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.is_lost ? <span className="status-pill status-lost">! Lost</span> : <span className="status-pill status-safe">✓ Safe</span>}
                      {item.is_lost && <span className="status-pill status-reward">{item.reward_amount ? 'Reward set' : 'No reward yet'}</span>}
                    </div>
                    <h2 className="font-display mt-5 text-3xl font-semibold text-[var(--color-ink)]">{item.title}</h2>
                    <p className="mt-2 text-sm font-bold text-[var(--color-ink-muted)]">{item.category || 'Uncategorized'}</p>
                  </div>
                  <p className="text-sm text-[var(--color-ink-muted)] line-clamp-2">{item.description || 'No description added.'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <OwnerAlertFeed initialReports={foundReports ?? []} />
      </div>
    </main>
  )
}