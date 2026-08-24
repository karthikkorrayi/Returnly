'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Message = { id: string; sender_id: string; body: string; created_at: string }

type ChatThreadProps = {
  reportId: string
  currentUserId: string
  isOwner: boolean
  itemTitle: string
  reportStatus: string
  initialMessages: Message[]
  justConnected: boolean
}

export default function ChatThread({
  reportId,
  currentUserId,
  isOwner,
  itemTitle,
  reportStatus,
  initialMessages,
  justConnected,
}: ChatThreadProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(justConnected)
  const [resolved, setResolved] = useState(reportStatus === 'resolved')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`report-messages-${reportId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `report_id=eq.${reportId}` },
        (payload) => {
          const incoming = payload.new as Message
          setMessages((current) => (current.some((m) => m.id === incoming.id) ? current : [...current, incoming]))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [reportId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return

    setSending(true)
    setError(null)
    const supabase = createClient()
    const { error: sendError } = await supabase.from('messages').insert({
      report_id: reportId,
      sender_id: currentUserId,
      body: draft.trim(),
    })
    setSending(false)

    if (sendError) {
      setError(sendError.message)
      return
    }
    setDraft('')
  }

  async function markRecovered() {
    setResolving(true)
    setError(null)
    const supabase = createClient()

    const { data: reportRow } = await supabase.from('found_reports').select('item_id').eq('id', reportId).single()

    const { error: deleteError } = await supabase.from('messages').delete().eq('report_id', reportId)
    const { error: reportError } = await supabase.from('found_reports').update({ status: 'resolved' }).eq('id', reportId)
    const { error: itemError } = reportRow
      ? await supabase.from('items').update({ is_lost: false }).eq('id', reportRow.item_id)
      : { error: null }

    setResolving(false)

    if (deleteError || reportError || itemError) {
      setError(deleteError?.message ?? reportError?.message ?? itemError?.message ?? 'Could not complete this action.')
      return
    }

    setMessages([])
    setResolved(true)
  }

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="tag-card p-5 sm:p-6">
          {showWelcome && (
            <div className="mb-5 rounded-2xl border border-[var(--color-primary-trust)]/30 bg-[var(--color-primary-trust)]/10 p-4">
              <p className="font-black text-[var(--color-primary-trust-dark)]">You&apos;re connected.</p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Message the owner below to arrange the return of {itemTitle}.</p>
              <button type="button" onClick={() => setShowWelcome(false)} className="mt-3 text-sm font-bold text-[var(--color-primary-trust-dark)] hover:underline">
                Got it
              </button>
            </div>
          )}

          <div className="mb-4 flex items-center justify-between gap-3">
            <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)]">{itemTitle}</h1>
            {isOwner && !resolved && (
              <button type="button" onClick={markRecovered} disabled={resolving} className="btn-recovered px-4 py-2 text-sm">
                {resolving ? 'Finishing…' : 'Mark as Recovered'}
              </button>
            )}
          </div>

          {resolved ? (
            <p className="rounded-2xl bg-[var(--color-success-reunited-soft)] p-4 text-sm font-bold text-[#435f3d]">
              This item was marked recovered. The conversation has been closed and cleared.
            </p>
          ) : (
            <>
              <div className="h-80 space-y-3 overflow-y-auto rounded-2xl border border-[var(--color-line)] bg-white/60 p-4">
                {messages.length === 0 && <p className="text-sm text-[var(--color-ink-muted)]">No messages yet — say hello.</p>}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                      message.sender_id === currentUserId
                        ? 'ml-auto bg-[var(--color-primary-trust)] text-white'
                        : 'bg-white text-[var(--color-ink)] shadow-sm'
                    }`}
                  >
                    {message.body}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {error && <p className="mt-3 text-sm font-bold text-[#7a3d0b]">{error}</p>}

              <form onSubmit={sendMessage} className="mt-4 flex gap-2">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} className="input-field flex-1" placeholder="Type a message…" />
                <button type="submit" disabled={sending} className="btn-primary px-5 py-3">Send</button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  )
}