import type { NextAuthConfig } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'

const publicPaths = [
  '/',
  '/login',
  '/register',
]

const publicApiPaths = [
  '/api/auth',
  '/api/links/public',
  '/api/links/',
  '/api/domains/',
  '/api/keys/',
]

const publicShortCodePattern = /^\/[a-zA-Z0-9_-]+$/
const apiQrPattern = /^\/api\/links\/[a-zA-Z0-9_-]+\/qr(\?.*)?$/

// Config edge-compatible (sem bcryptjs/Node.js APIs) — usada no middleware
export const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const pathname = nextUrl.pathname

      // Short codes públicos (ex: /abc123)
      if (publicShortCodePattern.test(pathname)) return true

      // QR API pública
      if (apiQrPattern.test(pathname)) return true

      // Paths públicos
      if (publicPaths.some(p => pathname === p)) return true

      // API paths públicas
      if (publicApiPaths.some(p => pathname.startsWith(p))) return true

      // Tudo mais requer autenticação
      return !!auth?.user
    },
  },
}
