'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

interface SidebarUser {
  name?: string | null
  email?: string | null
  image?: string | null
}

interface SidebarProps {
  user: SidebarUser
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' },
  { label: 'Links', href: '/links', icon: '<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' },
  { label: 'QR Codes', href: '/qr', icon: '<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 17h.01"/></svg>' },
]

const settingsItems = [
  { label: 'Configurações', href: '/settings', icon: '<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },
  { label: 'Comparar', href: '/links/compare', icon: '<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
]

export function MobileNav() {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isMobile) return null

  const isActive = (href: string) => pathname === href || pathname === href + '/'

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '72px',
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
      zIndex: 100,
      backdropFilter: 'blur(20px)',
      backgroundColor: 'rgba(var(--bg-secondary-rgb), 0.9)',
    }}>
      {navItems.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 16px',
              borderRadius: '12px',
              color: active ? 'var(--primary)' : 'var(--text-tertiary)',
              textDecoration: 'none',
              fontSize: '11px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              background: active ? 'var(--bg-hover)' : 'transparent',
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: item.icon }} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isActive = (href: string) => pathname === href || pathname === href + '/'

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() || '?'

  if (isMobile) {
    return null
  }

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-primary)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 12px',
      zIndex: 50,
    }}>
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', padding: '0 8px' }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '16px', color: '#fff',
        }}>
          1
        </div>
        <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>123bit</span>
      </Link>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 500,
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                background: active ? 'var(--bg-hover)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: item.icon }} />
              {item.label}
            </Link>
          )
        })}

        <div style={{ height: '1px', background: 'var(--border-primary)', margin: '12px 0' }} />

        {settingsItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 500,
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                background: active ? 'var(--bg-hover)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: item.icon }} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '8px', display: 'flex', justifyContent: 'center' }}>
        <ThemeToggle />
      </div>

      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-primary)' }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
          }}
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 600, color: 'var(--primary)', flexShrink: 0,
          }}>
            {user.image ? (
              <img src={user.image} alt={user.name || ''} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {user.name || user.email?.split('@')[0]}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Plano Gratuito
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
