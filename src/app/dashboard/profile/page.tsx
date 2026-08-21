import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name,phone_number,reputation_score')
    .eq('id', user!.id)
    .single()

  return (
    <main className="px-4 py-8">
      <section className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="text-sm font-bold text-[var(--color-primary-trust-dark)] hover:underline">← Back to dashboard</Link>
        <article className="tag-card mt-6 p-6 sm:p-8">
          <p className="font-utility text-xs font-bold uppercase text-[var(--color-primary-trust-dark)]">Owner profile</p>
          <h1 className="font-display mt-3 text-5xl font-semibold text-[var(--color-ink)]">{profile?.full_name || 'Returnly owner'}</h1>
          <p className="mt-3 text-[var(--color-ink-muted)]">Your profile keeps recovery coordination straightforward: just your contact name, phone, and one numeric trust indicator.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-[var(--color-line)] bg-white/70 p-5">
              <p className="text-sm font-black text-[var(--color-ink-muted)]">Full name</p>
              <p className="mt-2 text-2xl font-black text-[var(--color-ink)]">{profile?.full_name || 'Not added'}</p>
            </div>
            <div className="rounded-3xl border border-[var(--color-line)] bg-white/70 p-5">
              <p className="text-sm font-black text-[var(--color-ink-muted)]">Phone number</p>
              <p className="mt-2 text-2xl font-black text-[var(--color-ink)]">{profile?.phone_number || 'Not added'}</p>
            </div>
            <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-success-reunited-soft)] p-5 sm:col-span-2">
              <p className="text-sm font-black text-[#435f3d]">Reputation score</p>
              <p className="font-display mt-2 text-6xl font-semibold text-[#435f3d]">{profile?.reputation_score ?? 0}</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-ink-muted)]">A simple numeric trust signal based on Returnly activity.</p>
            </div>
          </div>
        </article>
      </section>
    </main>
  )
}