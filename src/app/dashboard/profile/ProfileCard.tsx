'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  full_name: string | null
  phone_number: string | null
  address: string | null
  city: string
  country: string
  state_region: string
  reputation_score: number | null
}

export default function ProfileCard({ userId, email, profile }: { userId: string; email: string; profile: Profile }) {
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number ?? '')
  const [address, setAddress] = useState(profile.address ?? '')
  const [city, setCity] = useState(profile.city ?? '')
  const [stateRegion, setStateRegion] = useState(profile.state_region ?? '')
  const [country, setCountry] = useState(profile.country ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initials = (profile.full_name || email || '?').trim().charAt(0).toUpperCase()
  const isIncomplete = !profile.full_name || !profile.phone_number || !profile.address

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone_number: phoneNumber, address })
      .eq('id', userId)
    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }
    setEditing(false)
  }

  return (
    <div className="tag-card mt-6 p-6 sm:p-8">
      {isIncomplete && !editing && (
        <p className="mb-4 rounded-2xl bg-[var(--color-alert-lost-soft)] p-3 text-sm font-bold text-[#7a3d0b]">
          Complete your profile so finders and Returnly can reach you reliably.
        </p>
      )}

      <div className="flex items-start gap-5">
        <div className="flex shrink-0 flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-trust)]/15 text-2xl font-black text-[var(--color-primary-trust-dark)]">
            {initials}
          </div>
          <p className="mt-2 text-center text-xs font-black uppercase text-[var(--color-ink-muted)]">Score</p>
          <p className="font-display text-2xl font-semibold text-[#435f3d]">{profile.reputation_score ?? 0}</p>
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-3">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="input-field" required />
              <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} type="tel" placeholder="Phone number" className="input-field" required />
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" rows={2} className="input-field" required />
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="input-field" />
              <input value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} placeholder="State" className="input-field" />
              <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" className="input-field" />
              {error && <p className="text-sm font-bold text-[#7a3d0b]">{error}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm">{saving ? 'Saving…' : 'Save'}</button>
                <button type="button" onClick={() => setEditing(false)} className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink)]">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <h1 className="font-display truncate text-3xl font-semibold text-[var(--color-ink)]">{profile.full_name || 'Add your name'}</h1>
                <button type="button" onClick={() => setEditing(true)} aria-label="Edit profile" className="shrink-0 rounded-full border border-[var(--color-line)] bg-white/70 p-2 text-lg leading-none hover:bg-white">
                  ✎
                </button>
              </div>
              <p className="text-sm text-[var(--color-ink-muted)]">{email}</p>
              <p className="text-sm text-[var(--color-ink-muted)]">{profile.phone_number || 'No phone number added'}</p>
              <p className="text-sm text-[var(--color-ink-muted)]">{profile.address || 'No address added'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}