import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This route handles the redirect after a user clicks the confirmation
// link in their signup email (or, later, an email-OTP magic link).
// Supabase sends the user here with a `code` param; we exchange it for
// a real session, then send them into the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Session cookie is now set — safe to send them into the app
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Missing or invalid code — send them back to login with an error flag
  // rather than silently failing
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}