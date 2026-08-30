'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Message = { id: string; sender_id: string; body: string; created_at: string }

type ChatThreadProps = {
  reportId: string
  currentUserId: string
  isOwner: boolean
  otherPartyName: string
  itemTitle: string
  reportStatus: string
  chatStatus: string | null
  initialMessages: Message[]
  justConnected: boolean
}

export default function ChatThread({
  reportId,
  currentUserId,
  isOwner,
  otherPartyName,
  itemTitle,
  reportStatus,
  chatStatus,
  initialMessages,
  justConnected,
}: ChatThreadProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(justConnected)
  const [resolved, setResolved] = useState(reportStatus === 'resolved')
  const [status, setStatus] = useState(chatStatus)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status !== 'accepted') return

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
  }, [reportId, status])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function acceptChat() {
    setAccepting(true)
    setError(null)
    const supabase = createClient()
    const { error: acceptError } = await supabase.from('found_reports').update({ chat_status: 'accepted' }).eq('id', reportId)
    setAccepting(false)

    if (acceptError) {
      setError(acceptError.message)
      return
    }
    setStatus('accepted')
  }

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

    // No longer deletes messages immediately — resolved_at starts the
    // retention clock, and a scheduled cleanup job removes them later
    const { error: reportError } = await supabase
      .from('found_reports')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', reportId)
    const { error: itemError } = reportRow
      ? await supabase.from('items').update({ is_lost: false }).eq('id', reportRow.item_id)
      : { error: null }

    setResolving(false)

    if (reportError || itemError) {
      setError(reportError?.message ?? itemError?.message ?? 'Could not complete this action.')
      return
    }

    setResolved(true)
  }

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="tag-card p-5 sm:p-6">
          {showWelcome && (
            <div className="mb-5 rounded-2xl border border-[var(--color-primary-trust)]/30 bg-[var(--color-primary-trust)]/10 p-4">
              <p className="font-black text-[var(--color-primary-trust-dark)]">You&apos;re connected.</p>
              <button type="button" onClick={() => setShowWelcome(false)} className="mt-2 text-sm font-bold text-[var(--color-primary-trust-dark)] hover:underline">
                Got it
              </button>
            </div>
          )}

          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)]">{itemTitle}</h1>
              <p className="text-sm text-[var(--color-ink-muted)]">With {otherPartyName}</p>
            </div>
            {isOwner && status === 'accepted' && !resolved && (
              <button type="button" onClick={markRecovered} disabled={resolving} className="btn-recovered px-4 py-2 text-sm">
                {resolving ? 'Finishing…' : 'Mark as Recovered'}
              </button>
            )}
          </div>

          {resolved ? (
            <p className="rounded-2xl bg-[var(--color-success-reunited-soft)] p-4 text-sm font-bold text-[#435f3d]">
              Marked as received. This conversation will be automatically cleared in a few days.
            </p>
          ) : status === 'requested' && isOwner ? (
            <div className="rounded-2xl border border-[var(--color-primary-trust)]/30 bg-[var(--color-primary-trust)]/8 p-5">
              <p className="font-black text-[var(--color-ink)]">{otherPartyName} may have found {itemTitle}.</p>
              {messages[0] && (
                <p className="mt-3 rounded-xl bg-white/80 p-3 text-sm text-[var(--color-ink)]">"{messages[0].body}"</p>
              )}
              <p className="mt-3 text-sm text-[var(--color-ink-muted)]">Accept to reply and continue the conversation.</p>
              {error && <p className="mt-3 text-sm font-bold text-[#7a3d0b]">{error}</p>}
              <button type="button" onClick={acceptChat} disabled={accepting} className="btn-primary mt-4 px-6 py-3">
                {accepting ? 'Accepting…' : 'Accept and reply'}
              </button>
            </div>
          ) : status === 'requested' && !isOwner ? (
            <div className="rounded-2xl border border-[var(--color-line)] bg-white/70 p-5 text-center">
              <p className="font-black text-[var(--color-ink)]">Waiting for {otherPartyName} to accept.</p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">You&apos;ll be able to message once they do.</p>
            </div>
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