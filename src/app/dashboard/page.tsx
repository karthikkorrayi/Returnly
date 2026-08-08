import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="font-display text-4xl font-semibold text-[var(--color-ink)]">Your Items</h1>
          <Link
            href="/dashboard/items/new"
            className="btn-primary px-5 py-3 text-sm"
          >
            Add item tag
          </Link>
        </div>

        {!items || items.length === 0 ? (
          <div className="tag-card p-6"><p className="text-[var(--color-ink-muted)]">No items yet — add your first tag.</p></div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/items/${item.id}`}
                className="tag-card block p-5 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-4 pr-8">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-[var(--color-ink)]">{item.title}</h2>
                    <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{item.category}</p>
                  </div>
                  {item.is_lost ? (
                    <span className="status-pill status-lost">! Lost</span>
                  ) : (
                    <span className="status-pill status-safe">✓ Safe</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}