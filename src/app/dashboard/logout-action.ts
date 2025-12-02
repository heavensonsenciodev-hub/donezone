// /app/dashboard/logout-action.ts
'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function logout() {
  // ✅ Await cookies() because it returns a Promise
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          cookieStore.set({ name, value, ...options })
        },
        remove: (name) => {
          cookieStore.delete(name)
        },
      },
    }
  )

  // ✅ Sign out clears the session and cookie
  await supabase.auth.signOut()

  // ✅ Redirect to login after logout
  redirect('/login')
}
