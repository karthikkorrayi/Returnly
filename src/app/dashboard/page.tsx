import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Your Items</h1>
          <Link
            href="/dashboard/items/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            + Add Item
          </Link>
        </div>

        {!items || items.length === 0 ? (
          <p className="text-gray-500">No items yet. Add your first one above.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/items/${item.id}`}
                className="block bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-semibold text-gray-800">{item.title}</h2>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                  {item.is_lost && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                      LOST
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}