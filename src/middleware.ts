import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

const publicPaths = [
  '/',
  '/login',
  '/register',
  '/api/auth',
  '/api/links/public',
  '/api/links/',
  '/api/domains/',
  '/api/keys/',
]

const publicShortCodePattern = /^\/[a-zA-Z0-9_-]+$/
const apiPattern = /^\/api\/links\/[a-zA-Z0-9_-]+\/qr(\?.*)?$/

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicShortCodePattern.test(pathname)) {
    return NextResponse.next()
  }

  if (apiPattern.test(pathname)) {
    return NextResponse.next()
  }

  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )

  if (isPublicPath) {
    return NextResponse.next()
  }

  const session = await auth()
  
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
