import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)', background: 'var(--bg-primary)', display: 'flex', minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
      <Sidebar user={session.user} />
      <MobileNav />
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '72px' }}>
        {children}
      </main>
    </div>
  )
}
