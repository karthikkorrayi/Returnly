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
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-gray-800">Add New Item</h1>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g. MacBook Pro"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g. Electronics"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Secret Identification Mark
          </label>
          <p className="text-xs text-gray-500 mb-1">
            Only you can see this — used to verify a finder&apos;s claim.
          </p>
          <input
            type="text"
            value={secretMark}
            onChange={(e) => setSecretMark(e.target.value)}
            className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g. small scratch near the logo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Item & Generate QR'}
        </button>
      </form>
    </div>
  )
}