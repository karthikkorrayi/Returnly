'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  full_name: string | null
  phone_number: string | null
  address: string | null
}

export default function ProfileForm({ userId, profile }: { userId: string; profile: Profile }) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number ?? '')
  const [address, setAddress] = useState(profile.address ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isIncomplete = !profile.full_name || !profile.phone_number || !profile.address

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

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

    setMessage('Profile updated.')
  }

  return (
    <form onSubmit={handleSubmit} className="tag-card mt-6 space-y-4 p-6 sm:p-8">
      {isIncomplete && (
        <p className="rounded-2xl bg-[var(--color-alert-lost-soft)] p-3 text-sm font-bold text-[#7a3d0b]">
          Complete your profile so finders and Returnly can reach you reliably.
        </p>
      )}
      {message && <p className="rounded-xl bg-[var(--color-primary-trust)]/10 p-3 text-sm font-bold text-[var(--color-primary-trust-dark)]">{message}</p>}
      {error && <p className="rounded-xl bg-[var(--color-alert-lost-soft)] p-3 text-sm font-bold text-[#7a3d0b]">{error}</p>}

      <div>
        <label className="block text-sm font-bold text-[var(--color-ink)]">Full name</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field mt-1" required />
      </div>
      <div>
        <label className="block text-sm font-bold text-[var(--color-ink)]">Phone number</label>
        <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} type="tel" className="input-field mt-1" required />
      </div>
      <div>
        <label className="block text-sm font-bold text-[var(--color-ink)]">Address</label>
        <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="input-field mt-1" required />
      </div>

      <button type="submit" disabled={saving} className="btn-primary px-5 py-3">
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}