'use client'

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
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Meus Links',
    href: '/links',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
        <path d="M14.828 14.828a4 4 0 000-5.656l-4-4a4 4 0 10-5.656 5.656l1.1 1.1" />
      </svg>
    ),
  },
  {
    label: 'QR Codes',
    href: '/qr',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 17h.01M17 14h.01M20 14h.01M14 20h.01M20 17h.01M20 20h.01" />
      </svg>
    ),
  },
  {
    label: 'Comparar',
    href: '/links/compare',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
]

const settingsItems = [
  {
    label: 'Domínios',
    href: '/settings?domain=1',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  },
  {
    label: 'Configurações',
    href: '/settings',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
  {
    label: 'API Keys',
    href: '/settings?api=1',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    ),
  },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    return pathname === href || pathname === href + '/'
  }

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() || '?'

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
      {/* LOGO */}
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', padding: '0 8px' }}>
        <div style={{
          width: '32px', height: '32px',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '14px', color: 'var(--bg-secondary)',
        }}>
          1
        </div>
        <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>123bit</span>
      </Link>

      {/* NAV */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 400,
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                background: active ? 'var(--bg-hover)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ opacity: active ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}

        <div style={{ height: '1px', background: 'var(--border-primary)', margin: '8px 12px' }} />

        {settingsItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 400,
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                background: active ? 'var(--bg-hover)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ opacity: active ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* THEME TOGGLE */}
      <div style={{ padding: '8px' }}>
        <ThemeToggle />
      </div>

      {/* USER CARD */}
      <div style={{ marginTop: 'auto', padding: '12px 8px', borderTop: '1px solid var(--border-primary)' }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
          }}
          onClick={() => signOut({ callbackUrl: '/login' })}
          title="Sair"
        >
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'var(--purple-100)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 500, color: 'var(--purple-800)', flexShrink: 0,
          }}>
            {user.image ? (
              <img src={user.image} alt={user.name || ''} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name || user.email?.split('@')[0]}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 300 }}>
              Plano Gratuito
              <span style={{
                display: 'inline-block', fontSize: '10px', fontWeight: 500,
                padding: '2px 7px', borderRadius: '99px',
                background: 'var(--purple-50)', color: 'var(--purple-800)',
                border: '0.5px solid var(--purple-100)', marginLeft: '6px',
              }}>
                FREE
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
