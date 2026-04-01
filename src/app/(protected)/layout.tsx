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
    <div style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)', display: 'flex', minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
      <Sidebar user={session.user} />
      <MobileNav />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
