type FinderProfile = {
  full_name: string | null
  city: string | null
  state: string | null
  country: string | null
  reputation_score: number | null
  has_finder_badge: boolean | null
}

export default function FinderProfileCard({ profile }: { profile: FinderProfile }) {
  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(', ')
  const initials = (profile.full_name || '?').trim().charAt(0).toUpperCase()

  return (
    <div className="mb-4 flex items-center gap-4 rounded-2xl border border-[var(--color-line)] bg-white/70 p-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-trust)]/15 text-lg font-black text-[var(--color-primary-trust-dark)]">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-black text-[var(--color-ink)]">{profile.full_name || 'Returnly user'}</p>
          {profile.has_finder_badge && (
            <span className="rounded-full bg-[var(--color-success-reunited-soft)] px-2 py-0.5 text-xs font-black text-[#435f3d]">✓ Finder badge</span>
          )}
        </div>
        <p className="text-sm text-[var(--color-ink-muted)]">{location || 'Location not shared'}</p>
        <p className="text-xs font-bold text-[var(--color-ink-muted)]">Score: {profile.reputation_score ?? 0}</p>
      </div>
    </div>
  )
}