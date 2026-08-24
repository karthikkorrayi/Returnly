import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const statusLabel: Record<string, string> = {
  requested: 'Pending',
  accepted: 'Active',
}

export default async function ChatsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // RLS already scopes this to rows where you're the finder OR the
  // item's owner — the two "Finders can view their own reports" and
  // "Owners can view reports on their items" policies OR together
  const { data: reports } = await supabase
    .from('found_reports')
    .select('id,item_id,finder_id,finder_name,chat_status,status,created_at')
    .eq('finder_type', 'registered')
    .neq('status', 'resolved')
    .order('created_at', { ascending: false })

  const itemIds = [...new Set((reports ?? []).map((r) => r.item_id))]
  const { data: items } = itemIds.length
    ? await supabase.from('items_public').select('id,title,user_id').in('id', itemIds)
    : { data: [] }

  const ownerIds = [...new Set((items ?? []).map((i) => i.user_id).filter((id) => id !== user!.id))]
  const { data: owners } = ownerIds.length
    ? await supabase.from('profiles_public').select('id,full_name').in('id', ownerIds)
    : { data: [] }

  const itemById = new Map((items ?? []).map((i) => [i.id, i]))
  const ownerNameById = new Map((owners ?? []).map((o) => [o.id, o.full_name]))

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="text-sm font-bold text-[var(--color-primary-trust-dark)] hover:underline">← Back to dashboard</Link>

        <h1 className="font-display mt-4 text-4xl font-semibold text-[var(--color-ink)]">Chats</h1>
        <p className="mt-2 text-[var(--color-ink-muted)]">Requests and active conversations, as owner or finder.</p>

        {(!reports || reports.length === 0) ? (
          <div className="tag-card mt-6 p-8 text-[var(--color-ink-muted)]">No chats yet.</div>
        ) : (
          <div className="mt-6 space-y-3">
            {reports.map((report) => {
              const item = itemById.get(report.item_id)
              const isOwner = item?.user_id === user!.id
              const otherPartyName = isOwner ? report.finder_name || 'Finder' : ownerNameById.get(item?.user_id ?? '') || 'the owner'
              const needsYourAction = isOwner && report.chat_status === 'requested'

              return (
                <Link
                  key={report.id}
                  href={`/dashboard/messages/${report.id}`}
                  className={`tag-card flex items-center justify-between gap-3 p-4 ${needsYourAction ? 'ring-2 ring-[var(--color-alert-lost)]' : ''}`}
                >
                  <div>
                    <p className="font-black text-[var(--color-ink)]">{item?.title ?? 'Item'}</p>
                    <p className="text-sm text-[var(--color-ink-muted)]">With {otherPartyName}</p>
                  </div>
                  <span className={`status-pill ${report.chat_status === 'accepted' ? 'status-safe' : 'status-reward'}`}>
                    {needsYourAction ? 'Needs your response' : statusLabel[report.chat_status ?? 'requested']}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}