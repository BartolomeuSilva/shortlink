'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ProfileModal } from '@/components/profile/ProfileModal'

interface SidebarUser {
  name?: string | null
  email?: string | null
  image?: string | null
}

interface SidebarProps {
  user: SidebarUser
  isOpen?: boolean
  collapsed?: boolean
  onClose?: () => void
  onToggleCollapse?: () => void
  onProfileUpdate?: (patch: { name?: string; image?: string }) => void
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  },
  {
    label: 'Meus Links',
    href: '/links',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /><path d="M14.828 14.828a4 4 0 000-5.656l-4-4a4 4 0 10-5.656 5.656l1.1 1.1" /></svg>,
  },
  {
    label: 'Campanhas',
    href: '/campaigns',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  },
  {
    label: 'Link-in-Bio',
    href: '/bio',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M6 20v-2a6 6 0 0112 0v2" /></svg>,
  },
  {
    label: 'Health Monitor',
    href: '/health',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  },
  {
    label: 'QR Codes',
    href: '/qr',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 17h.01M17 14h.01M20 14h.01M14 20h.01M20 17h.01M20 20h.01" /></svg>,
  },
  {
    label: 'Workspaces',
    href: '/workspaces',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  },
]

const settingsItems = [
  {
    label: 'Configurações',
    href: '/settings',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>,
  },
  {
    label: 'Segurança',
    href: '/settings/security',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>,
  },
  {
    label: 'Pixels',
    href: '/settings/pixels',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  },
  {
    label: 'Webhooks',
    href: '/settings/webhooks',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 0018 8a3 3 0 000-6 3 3 0 00-2.96 3.45L8.09 9.5A3 3 0 006 9a3 3 0 000 6c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65a3 3 0 103-2.92z" /></svg>,
  },
  {
    label: 'Domínios',
    href: '/settings/domains',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>,
  },
  {
    label: 'API Keys',
    href: '/settings/api-keys',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>,
  },
]

export function Sidebar({ user, isOpen, collapsed, onClose, onToggleCollapse, onProfileUpdate }: SidebarProps) {
  const pathname = usePathname()
  const [profileOpen, setProfileOpen] = useState(false)

  const isActive = (href: string) => pathname === href

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() || '?'

  return (
    <>
    <aside className={`sidebar ${isOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
      {/* LOGO + COLLAPSE TOGGLE */}
      <div className="sidebar-logo-row">
        <Link href="/dashboard" className="sidebar-logo" onClick={onClose}>
          <div className="sidebar-logo-icon">1</div>
          <div className="sidebar-logo-text">123<span>bit</span></div>
        </Link>
        <button
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* NAV */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${active ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={onClose}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </Link>
          )
        })}

        <div className="sidebar-divider" />

        {settingsItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${active ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={onClose}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* USER CARD */}
      <div className="sidebar-user">
        <div
          className="sidebar-user-card"
          onClick={() => setProfileOpen(true)}
          title={collapsed ? (user.name || user.email || 'Perfil') : 'Ver perfil'}
        >
          <div className="sidebar-user-avatar">
            {user.image ? (
              <img src={user.image} alt={user.name || ''} />
            ) : initials}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {user.name || user.email?.split('@')[0]}
            </div>
            <div className="sidebar-user-plan">
              Plano Gratuito
              <span className="sidebar-user-badge">FREE</span>
            </div>
          </div>
        </div>
      </div>
    </aside>

    {profileOpen && (
      <ProfileModal
        user={user}
        onClose={() => setProfileOpen(false)}
        onProfileUpdate={onProfileUpdate}
      />
    )}
  </>
  )
}
