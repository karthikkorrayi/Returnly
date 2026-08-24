'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MarkRecoveredButton({ reportId, itemId }: { reportId: string; itemId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: reportError } = await supabase.from('found_reports').update({ status: 'resolved' }).eq('id', reportId)
    const { error: itemError } = await supabase.from('items').update({ is_lost: false }).eq('id', itemId)
    setLoading(false)

    if (reportError || itemError) {
      setError(reportError?.message ?? itemError?.message ?? 'Could not update.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={loading} className="btn-recovered px-5 py-3">
        {loading ? 'Updating…' : 'Mark as Recovered'}
      </button>
      {error && <p className="mt-2 text-sm font-bold text-[#7a3d0b]">{error}</p>}
    </div>
  )
}