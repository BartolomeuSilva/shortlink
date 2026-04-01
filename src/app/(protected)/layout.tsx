import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
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

  // Buscar direto do banco para sempre ter nome e foto atualizados
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true },
  })

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
