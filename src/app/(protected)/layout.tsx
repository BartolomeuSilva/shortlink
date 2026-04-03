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
    .select('name, email, image')
    .eq('id', session.user.id)
    .single()

  const user = {
    name: dbUser?.name ?? session.user.name,
    email: dbUser?.email ?? session.user.email,
    image: dbUser?.image ?? session.user.image,
  }

  return (
    <LayoutShell user={user}>
      {children}
    </LayoutShell>
  )
}
