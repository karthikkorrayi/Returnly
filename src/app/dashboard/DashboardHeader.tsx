'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardHeader({ userEmail, chatCount }: { userEmail: string; chatCount: number }) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navLinkClass = (href: string) =>
    `rounded-full px-4 py-2 text-sm font-bold ${
      pathname === href
        ? 'bg-[var(--color-primary-trust)]/12 text-[var(--color-primary-trust-dark)]'
        : 'text-[var(--color-ink-muted)] hover:bg-white/70'
    }`

  return (
    <header className="sticky top-0 z-10 border-b border-[var(--color-line)] bg-[var(--color-base-bg)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/dashboard" className="font-display text-2xl font-semibold text-[var(--color-primary-trust)]">
          Returnly
        </Link>

        <nav className="flex flex-wrap items-center gap-2" aria-label="Dashboard">
          <Link href="/dashboard" className={navLinkClass('/dashboard')}>Dashboard</Link>
          <Link href="/dashboard/chats" className={`relative ${navLinkClass('/dashboard/chats')}`}>
             Chats
            {chatCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-alert-lost)] px-1 text-[0.65rem] font-black text-white">
                {chatCount}
              </span>
            )}
          </Link>
          <Link href="/scan" className={navLinkClass('/scan')}> Scan</Link>
          <Link href="/dashboard/profile" className={navLinkClass('/dashboard/profile')}>Profile</Link>
          <span className="hidden text-sm text-[var(--color-ink-muted)] sm:inline">{userEmail}</span>
          <button type="button" onClick={handleLogout} className="rounded-full border border-[var(--color-line)] bg-white/70 px-4 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-white">
            Log out
          </button>
        </nav>
      </div>
    </header>
  )
}