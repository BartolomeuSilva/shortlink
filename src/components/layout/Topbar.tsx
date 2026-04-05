'use client'

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useUser } from './UserContext'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

interface TopbarContextValue {
  title: string
  setTitle: (title: string) => void
  subtitle?: string
  setSubtitle: (subtitle: string | undefined) => void
  actions: ReactNode
  setActions: (actions: ReactNode) => void
}

const TopbarContext = createContext<TopbarContextValue | null>(null)

export function useTopbar() {
  const ctx = useContext(TopbarContext)
  if (!ctx) throw new Error('useTopbar must be used within TopbarProvider')
  return ctx
}

export function TopbarProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState<string | undefined>()
  const [actions, setActions] = useState<ReactNode>(null)

  return (
    <TopbarContext.Provider value={{ title, setTitle, subtitle, setSubtitle, actions, setActions }}>
      {children}
    </TopbarContext.Provider>
  )
}

export function Topbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { name, email, image } = useUser()

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() || '?'

  const displayName = name || email?.split('@')[0] || 'Usuário'

  // Generate a fake account ID from email
  const accountId = email ? `o_${email.replace(/[^a-z0-9]/gi, '').slice(0, 10)}` : 'o_free'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  return (
    <header className="desktop-topbar">
      <div className="desktop-topbar-left">
        <TopbarContent />
      </div>
      <div className="desktop-topbar-right">
        <TopbarActions />

        {/* Upgrade button */}
        <Link
          href="/upgrade"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff', fontSize: '13px', fontWeight: 600,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          Fazer upgrade
        </Link>

        {/* Help icon */}
        <Link
          href="/help"
          style={{
            width: '32px', height: '32px', borderRadius: '8px',
            border: '1px solid var(--border-primary)', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
          title="Ajuda"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </Link>

        {/* AI sparkle icon */}
        <button
          style={{
            width: '32px', height: '32px', borderRadius: '8px',
            border: '1px solid var(--border-primary)', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)',
          }}
          title="IA"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
            <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z" opacity=".6" />
            <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z" opacity=".4" />
          </svg>
        </button>

        <ThemeToggle />

        {/* User dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '5px 10px 5px 6px', borderRadius: '8px',
              border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)',
              cursor: 'pointer', fontSize: '13px', fontWeight: 500,
              color: 'var(--text-primary)',
            }}
          >
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {image && (image.startsWith('http://') || image.startsWith('https://'))
                ? <img src={image} alt={displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : initials}
            </div>
            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" style={{ opacity: 0.5, flexShrink: 0 }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              minWidth: '260px', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)', borderRadius: '12px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.15)', zIndex: 200,
              overflow: 'hidden',
            }}>
              {/* User info */}
              <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-primary)' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px', fontWeight: 700, color: '#fff',
                }}>
                  {image && (image.startsWith('http://') || image.startsWith('https://'))
                    ? <img src={image} alt={displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email}
                  </div>
                </div>
              </div>

              {/* Account + upgrade */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-dm-mono, monospace)' }}>
                    {accountId}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Conta de Free</div>
                </div>
                <Link
                  href="/upgrade"
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    padding: '5px 12px', borderRadius: '6px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff', fontSize: '12px', fontWeight: 600,
                    textDecoration: 'none', whiteSpace: 'nowrap',
                  }}
                >
                  Fazer upgrade
                </Link>
              </div>

              {/* Menu items */}
              <div style={{ padding: '6px' }}>
                {[
                  { label: 'Ajuda', href: '/help' },
                  { label: 'Documentação da API', href: '/docs/api' },
                  { label: 'Termos do 123Bit', href: '/terms' },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'block', padding: '9px 12px', borderRadius: '8px',
                      fontSize: '13px', color: 'var(--text-primary)',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    {item.label}
                  </Link>
                ))}

                <button
                  onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: '/' }) }}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: '8px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: '13px', color: 'var(--text-primary)', textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function TopbarContent() {
  const ctx = useContext(TopbarContext)
  if (!ctx || !ctx.title) return null
  return (
    <div>
      <div className="desktop-topbar-title">{ctx.title}</div>
      {ctx.subtitle && <div className="desktop-topbar-subtitle">{ctx.subtitle}</div>}
    </div>
  )
}

function TopbarActions() {
  const ctx = useContext(TopbarContext)
  if (!ctx || !ctx.actions) return null
  return <>{ctx.actions}</>
}
