'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  action: () => void
  keywords?: string[]
}

const NavIcon = ({ d }: { d: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setActiveIndex(0)
  }, [])

  const navigate = useCallback((href: string) => {
    router.push(href)
    close()
  }, [router, close])

  const commands: Command[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Ir para o painel principal',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
      action: () => navigate('/dashboard'),
      keywords: ['home', 'início', 'painel'],
    },
    {
      id: 'links',
      label: 'Meus Links',
      description: 'Ver todos os links',
      icon: <NavIcon d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M14.828 14.828a4 4 0 000-5.656l-4-4a4 4 0 10-5.656 5.656l1.1 1.1" />,
      action: () => navigate('/links'),
      keywords: ['url', 'encurtar', 'short'],
    },
    {
      id: 'new-link',
      label: 'Criar novo link',
      description: 'Encurtar uma nova URL',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
      action: () => navigate('/links?new=1'),
      keywords: ['criar', 'novo', 'encurtar', 'url', 'add'],
    },
    {
      id: 'campaigns',
      label: 'Campanhas',
      description: 'Gerenciar campanhas',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
      action: () => navigate('/campaigns'),
      keywords: ['analytics', 'stats', 'campanha'],
    },
    {
      id: 'bio-pages',
      label: 'Minhas Bios',
      description: 'Páginas de bio e links',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M6 20v-2a6 6 0 0112 0v2" /></svg>,
      action: () => navigate('/bio-pages'),
      keywords: ['bio', 'página', 'perfil', 'linktree'],
    },
    {
      id: 'new-bio',
      label: 'Criar nova Bio',
      description: 'Nova página de bio',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
      action: () => navigate('/bio-pages/new'),
      keywords: ['criar', 'novo', 'bio', 'página'],
    },
    {
      id: 'qr',
      label: 'QR Codes',
      description: 'Gerar e gerenciar QR Codes',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM17 17h3v3h-3z" /></svg>,
      action: () => navigate('/qr'),
      keywords: ['qr', 'code', 'código'],
    },
    {
      id: 'health',
      label: 'Health Monitor',
      description: 'Monitorar saúde dos links',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
      action: () => navigate('/health'),
      keywords: ['monitor', 'saúde', 'status', 'uptime'],
    },
    {
      id: 'workspaces',
      label: 'Workspaces',
      description: 'Gerenciar espaços de trabalho',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
      action: () => navigate('/workspaces'),
      keywords: ['workspace', 'equipe', 'time'],
    },
    {
      id: 'settings',
      label: 'Configurações',
      description: 'Configurações da conta',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>,
      action: () => navigate('/settings'),
      keywords: ['configurar', 'conta', 'perfil', 'settings'],
    },
    {
      id: 'settings-domains',
      label: 'Domínios',
      description: 'Configurar domínios personalizados',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>,
      action: () => navigate('/settings/domains'),
      keywords: ['domínio', 'domain', 'custom'],
    },
    {
      id: 'settings-api',
      label: 'API Keys',
      description: 'Gerenciar chaves de API',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>,
      action: () => navigate('/settings/api-keys'),
      keywords: ['api', 'key', 'token', 'integração'],
    },
    {
      id: 'upgrade',
      label: 'Fazer upgrade',
      description: 'Assinar um plano premium',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
      action: () => navigate('/upgrade'),
      keywords: ['premium', 'plano', 'assinar', 'pagar'],
    },
  ]

  const filtered = query.trim() === ''
    ? commands
    : commands.filter(cmd => {
        const q = query.toLowerCase()
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.description?.toLowerCase().includes(q) ||
          cmd.keywords?.some(k => k.toLowerCase().includes(q))
        )
      })

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const active = listRef.current.querySelector('[data-active="true"]') as HTMLElement
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // Global keydown listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      filtered[activeIndex]?.action()
    } else if (e.key === 'Escape') {
      close()
    }
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '15vh',
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        style={{
          width: '100%', maxWidth: '560px', margin: '0 16px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '14px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
        onKeyDown={onKeyDown}
      >
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px 16px',
          borderBottom: filtered.length > 0 ? '1px solid var(--border-primary)' : undefined,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" style={{ opacity: 0.4, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar páginas e ações..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: '15px', color: 'var(--text-primary)',
            }}
          />
          <kbd style={{
            padding: '2px 6px', borderRadius: '5px', fontSize: '11px',
            background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
            color: 'var(--text-tertiary)', fontFamily: 'monospace',
          }}>
            esc
          </kbd>
        </div>

        {/* Results */}
        {filtered.length > 0 && (
          <div ref={listRef} style={{ padding: '6px', maxHeight: '360px', overflowY: 'auto' }}>
            {filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                data-active={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={cmd.action}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: i === activeIndex ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
                  textAlign: 'left',
                }}
              >
                <span style={{
                  width: '30px', height: '30px', borderRadius: '7px', flexShrink: 0,
                  background: i === activeIndex ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: i === activeIndex ? 'var(--primary)' : 'var(--text-secondary)',
                }}>
                  {cmd.icon}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {cmd.label}
                  </span>
                  {cmd.description && (
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                      {cmd.description}
                    </span>
                  )}
                </span>
                {i === activeIndex && (
                  <kbd style={{
                    padding: '2px 6px', borderRadius: '5px', fontSize: '11px',
                    background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
                    color: 'var(--text-tertiary)', fontFamily: 'monospace', flexShrink: 0,
                  }}>
                    ↵
                  </kbd>
                )}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
            Nenhum resultado para "{query}"
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '8px 14px', borderTop: '1px solid var(--border-primary)',
          display: 'flex', gap: '14px',
          color: 'var(--text-tertiary)', fontSize: '11px',
        }}>
          {[
            { keys: ['↑', '↓'], label: 'navegar' },
            { keys: ['↵'], label: 'selecionar' },
            { keys: ['esc'], label: 'fechar' },
          ].map(({ keys, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {keys.map(k => (
                <kbd key={k} style={{
                  padding: '1px 5px', borderRadius: '4px', fontSize: '10px',
                  background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
                  fontFamily: 'monospace',
                }}>
                  {k}
                </kbd>
              ))}
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
