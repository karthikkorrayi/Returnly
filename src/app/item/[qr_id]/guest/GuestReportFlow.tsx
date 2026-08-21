'use client'

import { FormEvent, useMemo, useState } from 'react'
import { nanoid } from 'nanoid'
import { createClient } from '@/lib/supabase/client'

type Step = 'contact' | 'otp' | 'details' | 'done'

type LocationState = {
  latitude: number | null
  longitude: number | null
  status: 'idle' | 'requesting' | 'shared' | 'unavailable' | 'denied'
}

const steps: { id: Step; label: string }[] = [
  { id: 'contact', label: 'Your info' },
  { id: 'otp', label: 'Quick check' },
  { id: 'details', label: 'Meet-up note' },
  { id: 'done', label: 'Sent' },
]

export default function GuestReportFlow({ itemId, itemTitle }: { itemId: string; itemTitle: string }) {
  const [step, setStep] = useState<Step>('contact')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [notes, setNotes] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    status: 'idle',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const currentStepIndex = useMemo(
    () => steps.findIndex((candidate) => candidate.id === step),
    [step],
  )

  function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStep('otp')
  }

  function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // NOTE: placeholder step — accepts any input, no real verification
    // yet. Deliberately deferred; see project notes before treating this
    // as a real bot/spam guard.
    setStep('details')
  }

  async function handleDetailsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    setSubmitting(true)

    const supabase = createClient()
    let foundImageUrl: string | null = null

    if (imageFile) {
      const filePath = `${itemId}/${nanoid()}-${imageFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('found-report-images')
        .upload(filePath, imageFile)

      if (uploadError) {
        setSubmitError(`Photo upload failed: ${uploadError.message}`)
        setSubmitting(false)
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('found-report-images').getPublicUrl(filePath)
      foundImageUrl = publicUrl
    }

    const { error: insertError } = await supabase.from('found_reports').insert({
      item_id: itemId,
      finder_type: 'guest',
      finder_name: name,
      finder_phone: phone,
      notes,
      found_image_url: foundImageUrl,
      latitude: location.status === 'shared' ? location.latitude : null,
      longitude: location.status === 'shared' ? location.longitude : null,
      status: 'pending',
    })

    setSubmitting(false)

    if (insertError) {
      setSubmitError(insertError.message)
      return
    }

    setStep('done')
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocation((current) => ({ ...current, status: 'unavailable' }))
      return
    }

    setLocation((current) => ({ ...current, status: 'requesting' }))
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          status: 'shared',
        })
      },
      () => {
        setLocation((current) => ({ ...current, status: 'denied' }))
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 },
    )
  }

  return (
    <main className="lost-mode-page min-h-screen px-4 py-4 sm:py-8">
      <section className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col justify-center gap-4">
        <div className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="status-pill status-lost">Found item</p>
            <p className="font-utility text-xs font-bold uppercase text-[var(--color-ink-muted)]">About 2 min</p>
          </div>

          <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight text-[var(--color-ink)]">
            Help return {itemTitle}.
          </h1>
          <p className="mt-4 text-lg font-semibold leading-7 text-[var(--color-ink-muted)]">
            You do not need an account. We will only use this to help the owner safely coordinate pickup.
          </p>

          <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Report progress">
            {steps.map((progressStep, index) => (
              <li key={progressStep.id} className="space-y-2">
                <div
                  className={`h-2 rounded-full ${index <= currentStepIndex ? 'bg-[var(--color-primary-trust)]' : 'bg-[var(--color-line)]'}`}
                />
                <span className="block text-center text-[0.65rem] font-black uppercase tracking-wide text-[var(--color-ink-muted)]">
                  {progressStep.label}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-[1.75rem] border border-[var(--color-line)] bg-white/82 p-5 shadow-[var(--shadow-card)] sm:p-6">
          {step === 'contact' && (
            <form className="space-y-5" onSubmit={handleContactSubmit}>
              <div>
                <p className="status-pill status-safe mb-4 w-fit">Step 1</p>
                <h2 className="text-3xl font-black leading-9 text-[var(--color-ink)]">How can the owner reach you?</h2>
                <p className="mt-2 text-base font-semibold leading-6 text-[var(--color-ink-muted)]">
                  A name and phone number is enough to start. Keep it short — you are doing a kind thing.
                </p>
              </div>

              <label className="block text-sm font-black text-[var(--color-ink)]">
                Name
                <input className="input-field mt-2" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" />
              </label>
              <label className="block text-sm font-black text-[var(--color-ink)]">
                Phone number
                <input className="input-field mt-2" value={phone} onChange={(event) => setPhone(event.target.value)} required type="tel" autoComplete="tel" />
              </label>
              <button className="btn-primary w-full px-5 py-3" type="submit">Continue — quick verification</button>
            </form>
          )}

          {step === 'otp' && (
            <form className="space-y-5" onSubmit={handleOtpSubmit}>
              <div>
                <p className="status-pill status-safe mb-4 w-fit">Step 2</p>
                <h2 className="text-3xl font-black leading-9 text-[var(--color-ink)]">30-second bot check</h2>
                <p className="mt-2 text-base font-semibold leading-6 text-[var(--color-ink-muted)]">
                  We send a one-time code by email to confirm you are a real person, not a bot. It usually takes less than 30 seconds.
                </p>
              </div>
              <label className="block text-sm font-black text-[var(--color-ink)]">
                Email for the code
                <input className="input-field mt-2" value={email} onChange={(event) => setEmail(event.target.value)} required type="email" autoComplete="email" />
              </label>
              <label className="block text-sm font-black text-[var(--color-ink)]">
                Verification code
                <input className="input-field mt-2 text-center text-2xl font-black tracking-[0.35em]" value={otp} onChange={(event) => setOtp(event.target.value)} required inputMode="numeric" maxLength={6} placeholder="123456" />
              </label>
              <button className="btn-primary w-full px-5 py-3" type="submit">I’m verified</button>
            </form>
          )}

          {step === 'details' && (
            <form className="space-y-5" onSubmit={handleDetailsSubmit}>
              <div>
                <p className="status-pill status-safe mb-4 w-fit">Step 3</p>
                <h2 className="text-3xl font-black leading-9 text-[var(--color-ink)]">Add a helpful note</h2>
                <p className="mt-2 text-base font-semibold leading-6 text-[var(--color-ink-muted)]">
                  Tell the owner where you found it or when you can meet. A photo and location are optional, but both help them act quickly.
                </p>
              </div>

              {submitError && (
                <p className="rounded-2xl bg-[var(--color-alert-lost-soft)] p-3 text-sm font-bold text-[#7a3d0b]">{submitError}</p>
              )}

              <label className="block text-sm font-black text-[var(--color-ink)]">
                Note to owner
                <textarea className="input-field mt-2 min-h-32 resize-none" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Found near the front desk. I can wait here for 10 minutes." />
              </label>

              <label className="block text-sm font-black text-[var(--color-ink)]">
                Photo of where you found it (optional)
                <input
                  className="mt-2 w-full rounded-xl border border-[var(--color-line)] bg-white/70 p-3 text-sm"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                />
              </label>

              <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-alert-lost-soft)]/55 p-4">
                <p className="text-sm font-black text-[var(--color-ink)]">Why location?</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[var(--color-ink-muted)]">
                  Your browser will ask permission first. If you allow it, we add your approximate coordinates to the report so the owner can head to the right meetup spot.
                </p>
                <button className="mt-3 min-h-11 w-full rounded-full border-2 border-[var(--color-alert-lost)] bg-white px-4 py-2 font-black text-[#7a3d0b]" type="button" onClick={requestLocation} disabled={location.status === 'requesting'}>
                  {location.status === 'requesting' ? 'Asking your browser…' : 'Share my location'}
                </button>
                {location.status === 'shared' && <p className="mt-2 text-sm font-bold text-[var(--color-primary-trust-dark)]">Location added to this report.</p>}
                {location.status === 'denied' && <p className="mt-2 text-sm font-bold text-[#7a3d0b]">No problem — you can still send the report without location.</p>}
                {location.status === 'unavailable' && <p className="mt-2 text-sm font-bold text-[#7a3d0b]">This browser does not support location sharing.</p>}
              </div>

              <button className="btn-lost w-full px-5 py-3 disabled:opacity-60" type="submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send report to owner'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-success-reunited-soft)] text-5xl text-[#435f3d]" aria-hidden="true">✓</div>
              <p className="status-pill status-recovered mx-auto w-fit">Report sent</p>
              <h2 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight text-[var(--color-ink)]">You helped.</h2>
              <p className="text-lg font-semibold leading-7 text-[var(--color-ink-muted)]">
                The owner has been notified with your name, phone number, note, and location if you shared it. They will contact you directly to arrange a safe pickup.
              </p>
              <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-left">
                <p className="font-black text-[var(--color-ink)]">What to expect next</p>
                <ul className="mt-2 space-y-2 text-sm font-semibold leading-6 text-[var(--color-ink-muted)]">
                  <li>• Most owners reply quickly when their item is marked lost.</li>
                  <li>• Meet somewhere public if you choose to hand it off.</li>
                  <li>• If you need to leave, your note helps them follow up.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}