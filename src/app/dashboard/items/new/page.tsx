'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import { createClient } from '@/lib/supabase/client'

export default function NewItemPage() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [secretMark, setSecretMark] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    const supabase = createClient()
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Confirm we have a logged-in user before doing anything else —
    // needed to build the storage path and satisfy the RLS insert check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in.')
      setLoading(false)
      return
    }

    let imageUrl: string | null = null

    // Upload image first (if provided) — path must start with the
    // user's id to satisfy the storage RLS policy from Step 1
    if (imageFile) {
      const filePath = `${user.id}/${nanoid()}-${imageFile.name}`

      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(filePath, imageFile)

      if (uploadError) {
        setError(`Image upload failed: ${uploadError.message}`)
        setLoading(false)
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('item-images').getPublicUrl(filePath)

      imageUrl = publicUrl
    }

    // Unique slug this item's QR code will encode
    const qrCodeId = nanoid(10)

    const { data: newItem, error: insertError } = await supabase
      .from('items')
      .insert({
        user_id: user.id,
        title,
        category,
        description,
        secret_identification_mark: secretMark,
        image_url: imageUrl,
        qr_code_id: qrCodeId,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Send them to the item's detail page, where the QR is displayed
    router.push(`/dashboard/items/${newItem.id}`)
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="tag-card mx-auto max-w-md space-y-5 p-6"
      >
        <h1 className="font-display pr-10 text-4xl font-semibold text-[var(--color-ink)]">Add a tagged item</h1>

        {error && (
          <p className="rounded-xl bg-[var(--color-alert-lost-soft)] p-3 text-sm font-medium text-[#7a3d0b]">{error}</p>
        )}

        <div>
          <label className="block text-sm font-bold text-[var(--color-ink)]">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field mt-1"
            placeholder="e.g. MacBook Pro"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-ink)]">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field mt-1"
            placeholder="e.g. Electronics"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-ink)]">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input-field mt-1"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-ink)]">
            Secret Identification Mark
          </label>
          <p className="mb-1 text-xs text-[var(--color-ink-muted)]">
            Only you can see this — used to verify a finder&apos;s claim.
          </p>
          <input
            type="text"
            value={secretMark}
            onChange={(e) => setSecretMark(e.target.value)}
            className="input-field mt-1"
            placeholder="e.g. small scratch near the logo"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--color-ink)]">Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-white/70 p-3 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full px-4 py-3 disabled:opacity-50"
        >
          {loading ? 'Saving tag...' : 'Save item and generate QR'}
        </button>
      </form>
    </div>
  )
}