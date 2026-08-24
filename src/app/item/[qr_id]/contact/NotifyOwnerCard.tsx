'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type NotifyOwnerCardProps = {
  itemId: string
  itemTitle: string
  ownerName: string
  existingReportId: string | null
}

export default function NotifyOwnerCard({ itemId, itemTitle, ownerName, existingReportId }: NotifyOwnerCardProps) {
  const [sent, setSent] = useState(Boolean(existingReportId))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleNotify() {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user!.id).single()

    const { error: insertError } = await supabase.from('found_reports').insert({
      item_id: itemId,
      finder_type: 'registered',
      finder_id: user!.id,
      finder_name: profile?.full_name ?? 'Returnly user',
      status: 'pending',
      chat_status: 'requested',
    })

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setSent(true)
  }

  return (
    <main className="lost-mode-page flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-6 text-center shadow-[var(--shadow-card)] sm:p-8">
        {sent ? (
          <>
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary-trust)]/12 text-4xl text-[var(--color-primary-trust-dark)]" aria-hidden="true">
              ⏳
            </div>
            <p className="status-pill status-safe mx-auto mb-4 w-fit">Owner notified</p>
            <h1 className="font-display text-4xl font-semibold text-[var(--color-ink)]">Waiting for {ownerName}</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--color-ink-muted)]">
              They&apos;ve been alerted about {itemTitle}. Once they accept, you can chat directly here.
            </p>
            <button
              type="button"
              onClick={() => router.push('/dashboard/chats')}
              className="btn-primary mt-6 w-full px-5 py-3"
            >
              Go to my chats
            </button>
          </>
        ) : (
          <>
            <p className="status-pill status-lost mx-auto mb-4 w-fit">Notify owner</p>
            <h1 className="font-display text-4xl font-semibold text-[var(--color-ink)]">Ping {ownerName}?</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--color-ink-muted)]">
              They&apos;ll get an alert that someone may have found {itemTitle}. Once they accept, a private chat opens between you.
            </p>
            {error && <p className="mt-4 rounded-xl bg-[var(--color-alert-lost-soft)] p-3 text-sm font-bold text-[#7a3d0b]">{error}</p>}
            <button type="button" onClick={handleNotify} disabled={loading} className="btn-lost mt-6 w-full px-5 py-3">
              {loading ? 'Notifying…' : `Notify ${ownerName}`}
            </button>
          </>
        )}
      </div>
    </main>
  )
}