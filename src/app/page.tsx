import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-6 sm:py-10">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col justify-center gap-10">
        <nav className="flex items-center justify-between" aria-label="Primary">
          <div className="font-display text-2xl font-semibold text-[var(--color-primary-trust)]">Returnly</div>
          <Link href="/scan" className="rounded-full px-4 py-3 text-sm font-bold text-[var(--color-primary-trust)] hover:bg-white/70">
            Scan a tag
          </Link>
          <Link href="/login" className="rounded-full px-4 py-3 text-sm font-bold text-[var(--color-primary-trust)] hover:bg-white/70">
            Log in
          </Link>
        </nav>

        <div className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <p className="status-pill status-safe w-fit">✓ QR tag recovery</p>
            <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl">
              Help good people return the things you rely on.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-[var(--color-ink-muted)]">
              Attach a Returnly QR tag to a laptop, keyring, wallet, or bag. If it goes missing, the finder scans the tag and reaches you without seeing private details.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="btn-primary px-6 py-3">Add your first tag</Link>
              <Link href="/dashboard" className="min-h-11 rounded-full border border-[var(--color-line)] bg-white/70 px-6 py-3 text-center font-bold text-[var(--color-ink)] hover:bg-white">
                View my items
              </Link>
            </div>
          </div>

          <div className="tag-card p-6 sm:p-8" aria-label="Example Returnly physical QR tag">
            <div className="mb-8 flex items-start justify-between gap-6 pr-10">
              <div>
                <p className="font-utility text-xs text-[var(--color-ink-muted)]">TAG ID RTN-48K2-M9</p>
                <h2 className="font-display mt-2 text-3xl font-semibold">Work backpack</h2>
              </div>
              <span className="status-pill status-lost">! Lost</span>
            </div>
            <div className="grid grid-cols-[7rem_1fr] gap-5">
              <div className="rounded-2xl border border-[var(--color-line)] bg-white p-3 shadow-inner">
                <div className="grid aspect-square grid-cols-4 gap-1" aria-hidden="true">
                  {Array.from({ length: 16 }).map((_, index) => (
                    <span key={index} className={index % 3 === 0 || index === 5 || index === 14 ? 'rounded-sm bg-[var(--color-ink)]' : 'rounded-sm bg-[var(--color-line)]'} />
                  ))}
                </div>
              </div>
              <div className="space-y-3 text-sm leading-6 text-[var(--color-ink-muted)]">
                <p className="font-semibold text-[var(--color-ink)]">Finder message</p>
                <p>“I found this near Gate B. I can wait by the information desk.”</p>
                <button className="btn-lost w-full px-4 py-3">Message the owner</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}