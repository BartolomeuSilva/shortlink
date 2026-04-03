import NextAuth from 'next-auth'
import { SupabaseAdapter } from '@auth/supabase-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from './supabase'
import { customAlphabet } from 'nanoid'
import { authConfig } from './auth.config'

const generateApiKey = customAlphabet(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  32
)

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    ...authConfig.providers,
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('🔑 Auth: Missing credentials');
          return null;
        }

        const email = credentials.email as string
        const password = credentials.password as string

        console.log(`🔑 Auth: Attempting login for ${email}`);
        
        // Debug connection
        const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
        console.log(`🔑 Auth: SUPABASE_SERVICE_ROLE_KEY present: ${hasServiceKey}`);

        const { data: user, error: supabaseError } = await supabaseAdmin
          .from('User')
          .select('*')
          .eq('email', email)
          .single()

        if (supabaseError) {
          console.error('❌ Auth: Supabase query error:', supabaseError);
          return null;
        }

        if (!user || !user.password) {
          console.log('🔑 Auth: User not found or has no password');
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
          console.log('🔑 Auth: Invalid password');
          return null;
        }

        console.log('✅ Auth: Login successful');
        return { id: user.id, email: user.email, name: user.name, image: user.image }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider !== 'credentials' && user.id) {
        const { data: existing } = await supabaseAdmin
          .from('User')
          .select('apiKey')
          .eq('id', user.id)
          .single()

        if (existing && !existing.apiKey) {
          await supabaseAdmin
            .from('User')
            .update({ apiKey: generateApiKey() })
            .eq('id', user.id)
        }
      }
      return true
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
