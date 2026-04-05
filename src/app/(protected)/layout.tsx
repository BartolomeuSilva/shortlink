import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { LayoutShell } from '@/components/layout/LayoutShell'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Buscar direto do banco para sempre ter nome e foto atualizados usando Supabase
  const { data: dbUser } = await supabaseAdmin
    .from('User')
    .select('name, email, image, updatedAt')
    .eq('id', session.user.id)
    .single()

  // Cache-busting: adiciona updatedAt como query param para evitar cache do browser
  const imageWithCacheBust = dbUser?.image
    ? `${dbUser.image}?t=${new Date(dbUser.updatedAt).getTime()}`
    : null

  const user = {
    name: dbUser?.name ?? session.user.name,
    email: dbUser?.email ?? session.user.email,
    image: imageWithCacheBust ?? session.user.image,
  }

  return (
    <LayoutShell user={user}>
      {children}
    </LayoutShell>
  )
}
