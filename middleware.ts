// /middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => request.cookies.get(key)?.value,
        set: (key, value, options) => {
          response.cookies.set(key, value, options)
        },
        remove: (key, options) => {
          response.cookies.delete(key)
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // If user is NOT logged in and accessing /dashboard, redirect to /login
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user IS logged in and trying to access /login, redirect to /dashboard/:id
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL(`/dashboard/${user.id}`, request.url))
  }

  return response
}

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)', // run middleware on all routes except static
  ],
}
