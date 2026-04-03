'use client'

import { useState, useCallback } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar, TopbarProvider } from './Topbar'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { MobileNav } from './MobileNav'
import Link from 'next/link'

interface LayoutShellProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  children: React.ReactNode
}

export function LayoutShell({ user, children }: LayoutShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [displayUser, setDisplayUser] = useState(user)

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const toggleCollapse = useCallback(() => setCollapsed((v) => !v), [])
  const handleProfileUpdate = useCallback((patch: { name?: string; image?: string }) => {
    setDisplayUser((prev) => ({ ...prev, ...patch }))
  }, [])

  return (
    <div style={{ fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)', display: 'flex', minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
      {drawerOpen && (
        <div className="sidebar-overlay" onClick={closeDrawer} />
      )}

      <Sidebar
        user={displayUser}
        isOpen={drawerOpen}
        collapsed={collapsed}
        onClose={closeDrawer}
        onToggleCollapse={toggleCollapse}
        onProfileUpdate={handleProfileUpdate}
      />

      {/* Mobile topbar */}
      <header className="mobile-topbar">
        <button className="mobile-topbar-btn" onClick={() => setDrawerOpen(true)} aria-label="Abrir menu">
          <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <Link href="/dashboard" className="mobile-topbar-logo">
          <div className="sidebar-logo-icon" style={{ width: '24px', height: '24px', fontSize: '11px' }}>1</div>
          <span>123<span style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>bit</span></span>
        </Link>
        <ThemeToggle />
      </header>

      <TopbarProvider>
        <Topbar />
        <main className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
          {children}
        </main>
        <MobileNav />
      </TopbarProvider>
    </div>
  )
}
