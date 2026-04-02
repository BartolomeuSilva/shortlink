'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatNumber, getBaseUrl } from '@/lib/utils'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CreateLinkModal } from './CreateLinkModal'

interface LinkRow {
  id: string
  shortCode: string
  originalUrl: string
  title: string | null
  isActive: boolean
  clickCount: number
  expiresAt: string | null
  createdAt: string
  tags: { id: string; name: string; color: string }[]
}

interface LinkTableProps {
  links: LinkRow[]
  total: number
  page: number
  pageSize: number
}

export function LinkTable({ links: initialLinks, total, page, pageSize }: LinkTableProps) {
  const router = useRouter()
  const [links, setLinks] = useState(initialLinks)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const baseUrl = getBaseUrl()

  const refreshLinks = useCallback(async () => {
    try {
      const res = await fetch('/api/links')
      if (res.ok) {
        const data = await res.json()
        setLinks(data.links || [])
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const maxClicks = Math.max(...links.map((l) => l.clickCount), 1)

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const toggleAll = () => {
    if (selected.size === links.length) setSelected(new Set())
    else setSelected(new Set(links.map((l) => l.id)))
  }

  const copyLink = async (shortCode: string, id: string) => {
    await navigator.clipboard.writeText(`${baseUrl}/${shortCode}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleActive = async (id: string, current: boolean) => {
    setLinks((prev) => prev.map((l) => l.id === id ? { ...l, isActive: !current } : l))
    await fetch(`/api/links/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    })
  }

  const deleteLink = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este link?')) return
    setDeletingId(id)
    await fetch(`/api/links/${id}`, { method: 'DELETE' })
    setLinks((prev) => prev.filter((l) => l.id !== id))
    setDeletingId(null)
  }

  const bulkDelete = async () => {
    if (!confirm(`Excluir ${selected.size} link(s)?`)) return
    await Promise.all([...selected].map((id) =>
      fetch(`/api/links/${id}`, { method: 'DELETE' })
    ))
    setLinks((prev) => prev.filter((l) => !selected.has(l.id)))
    setSelected(new Set())
  }

  const downloadQR = async (id: string, shortCode: string) => {
    const res = await fetch(`/api/links/${id}/qr?format=png`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-${shortCode}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatus = (link: LinkRow) => {
    if (!link.isActive) return 'off'
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) return 'expired'
    return 'active'
  }

  const filtered = links.filter((l) => {
    const matchSearch =
      !search ||
      l.shortCode.toLowerCase().includes(search.toLowerCase()) ||
      l.originalUrl.toLowerCase().includes(search.toLowerCase()) ||
      l.title?.toLowerCase().includes(search.toLowerCase())
    const status = getStatus(l)
    const matchStatus = statusFilter === 'all' || status === statusFilter
    return matchSearch && matchStatus
  })

  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      {/* TOOLBAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }} className="links-toolbar">
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" stroke="var(--text-tertiary)" strokeWidth="1.5" fill="none"
            style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar links..."
            style={{
              width: '100%', height: '38px', fontFamily: 'inherit', fontSize: '13px',
              color: 'var(--text-primary)', background: 'var(--bg-secondary)',
              border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: '6px',
              padding: '0 12px 0 34px', outline: 'none',
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            fontFamily: 'inherit', fontSize: '12px', color: 'var(--text-secondary)',
            background: 'var(--bg-secondary)', border: '0.5px solid rgba(0,0,0,0.1)',
            padding: '0 12px', height: '38px', borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="off">Inativo</option>
          <option value="expired">Expirado</option>
        </select>

        {selected.size > 0 && (
          <button
            onClick={bulkDelete}
            style={{
              fontFamily: 'inherit', fontSize: '12px', fontWeight: 400,
              color: 'var(--color-error)', background: 'var(--color-error-bg)',
              border: '0.5px solid rgba(163,45,45,0.2)',
              padding: '0 12px', height: '38px', borderRadius: '6px', cursor: 'pointer',
            }}
          >
            Excluir {selected.size} selecionado(s)
          </button>
        )}

        <button
          onClick={() => setShowModal(true)}
          style={{
            fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
            color: 'var(--bg-secondary)', background: 'var(--primary)', border: 'none',
            padding: '0 16px', height: '38px', borderRadius: '6px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" stroke="var(--bg-secondary)" strokeWidth="2" fill="none">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo link
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: 'flex', gap: '20px', padding: '14px 0', borderBottom: '0.5px solid rgba(0,0,0,0.07)', marginBottom: '0', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <span><strong style={{ color: 'var(--text-primary)' }}>{total}</strong> links</span>
        <span><strong style={{ color: 'var(--text-primary)' }}>{links.filter((l) => getStatus(l) === 'active').length}</strong> ativos</span>
        <span><strong style={{ color: 'var(--text-primary)' }}>{formatNumber(links.reduce((s, l) => s + l.clickCount, 0))}</strong> cliques totais</span>
      </div>

      {/* MOBILE CARDS */}
      <div className="link-cards-mobile">
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
            {search || statusFilter !== 'all' ? 'Nenhum link encontrado com esses filtros.' : 'Nenhum link criado ainda.'}
          </div>
        ) : filtered.map((link) => {
          const status = getStatus(link)
          const statusStyle = status === 'active'
            ? { background: '#EAF3DE', color: '#27500A' }
            : status === 'expired'
            ? { background: '#FAEEDA', color: '#854F0B' }
            : { background: '#EEEDE9', color: 'var(--text-secondary)' }
          const dotColor = status === 'active' ? '#3B6D11' : status === 'expired' ? '#854F0B' : 'var(--text-tertiary)'

          return (
            <div key={link.id} className="link-mobile-card">
              <div className="link-mc-header">
                <div className="link-mc-icon">🔗</div>
                <div className="link-mc-info">
                  <div className="link-mc-short">{baseUrl}/{link.shortCode}</div>
                  <div className="link-mc-orig">{link.title || link.originalUrl}</div>
                </div>
                <span style={{ ...statusStyle, display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '99px', flexShrink: 0 }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: dotColor, display: 'inline-block' }} />
                  {status === 'active' ? 'Ativo' : status === 'expired' ? 'Expirado' : 'Inativo'}
                </span>
              </div>
              <div className="link-mc-meta">
                <span className="link-mc-clicks">{formatNumber(link.clickCount)} cliques</span>
                <span>{formatDistanceToNow(parseISO(link.createdAt), { addSuffix: true, locale: ptBR })}</span>
              </div>
              <div className="link-mc-actions">
                <button onClick={() => copyLink(link.shortCode, link.id)} className="link-mc-btn" title="Copiar link">
                  {copiedId === link.id ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                  )}
                </button>
                <Link href={`/links/${link.id}`} className="link-mc-btn" title="Analytics">
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
                </Link>
                <button onClick={() => downloadQR(link.id, link.shortCode)} className="link-mc-btn" title="Baixar QR Code">
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM17 17h3v3h-3z" /></svg>
                </button>
                <label title={link.isActive ? 'Desativar' : 'Ativar'} style={{ width: '30px', height: '17px', cursor: 'pointer', display: 'inline-flex', position: 'relative', alignItems: 'center', margin: '5px 9px 5px 4px' }}>
                  <input type="checkbox" checked={link.isActive} onChange={() => toggleActive(link.id, link.isActive)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                  <span style={{ position: 'absolute', inset: 0, background: link.isActive ? 'var(--primary)' : 'var(--border-secondary)', borderRadius: '99px', transition: 'background 0.2s' }} />
                  <span style={{ position: 'absolute', width: '13px', height: '13px', left: '2px', top: '2px', background: 'var(--bg-secondary)', borderRadius: '50%', transition: 'transform 0.2s', transform: link.isActive ? 'translateX(13px)' : 'translateX(0)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </label>
                <button onClick={() => deleteLink(link.id)} disabled={deletingId === link.id} className="link-mc-btn" style={{ color: 'var(--color-error)' }} title="Excluir">
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" /></svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* TABLE (desktop) */}
      <div className="link-table-desktop" style={{ background: 'var(--bg-secondary)', border: '0.5px solid rgba(0,0,0,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '11px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', background: 'var(--bg-tertiary)', verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <input type="checkbox" checked={selected.size === links.length && links.length > 0} onChange={toggleAll} style={{ width: '14px', height: '14px', accentColor: 'var(--primary)', cursor: 'pointer' }} />
                </div>
              </th>
              {['Link', 'Status', 'Cliques', 'Tags', 'Criado em', ''].map((h, i) => (
                <th key={i} style={{
                  fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)',
                  textAlign: 'left', padding: '11px 16px',
                  borderBottom: '0.5px solid rgba(0,0,0,0.07)',
                  letterSpacing: '0.2px', textTransform: 'uppercase',
                  background: 'var(--bg-tertiary)', whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                  {search || statusFilter !== 'all' ? 'Nenhum link encontrado com esses filtros.' : 'Nenhum link criado ainda.'}
                </td>
              </tr>
            ) : (
              filtered.map((link) => {
                const status = getStatus(link)
                const statusStyle = status === 'active'
                  ? { background: '#EAF3DE', color: '#27500A' }
                  : status === 'expired'
                  ? { background: '#FAEEDA', color: '#854F0B' }
                  : { background: '#EEEDE9', color: 'var(--text-secondary)' }
                const dotColor = status === 'active' ? '#3B6D11' : status === 'expired' ? '#854F0B' : 'var(--text-tertiary)'

                return (
                  <tr key={link.id} style={{ borderBottom: '0.5px solid rgba(0,0,0,0.05)', cursor: 'default' }}>
                    <td style={{ padding: '11px 16px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <input type="checkbox" checked={selected.has(link.id)} onChange={() => toggleSelect(link.id)} style={{ width: '14px', height: '14px', accentColor: 'var(--primary)', cursor: 'pointer' }} />
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#EEEDE9', border: '0.5px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>
                          🔗
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-dm-mono, DM Mono, monospace)', fontSize: '12px', color: 'var(--primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {baseUrl}/{link.shortCode}
                            <svg width="10" height="10" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" style={{ opacity: 0.5 }}>
                              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </div>
                          {link.title && (
                            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '1px' }}>{link.title}</div>
                          )}
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 300, maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {link.originalUrl}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ ...statusStyle, display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: dotColor, display: 'inline-block' }} />
                        {status === 'active' ? 'Ativo' : status === 'expired' ? 'Expirado' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: 'var(--font-dm-mono, DM Mono, monospace)', fontSize: '13px', fontWeight: 500, minWidth: '48px', textAlign: 'right' }}>
                          {formatNumber(link.clickCount)}
                        </span>
                        <div style={{ width: '60px', height: '3px', background: '#EEEDE9', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ width: `${(link.clickCount / maxClicks) * 100}%`, height: '100%', background: 'var(--primary-light)', borderRadius: '99px' }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {link.tags.map((tag) => (
                          <span key={tag.id} style={{ fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '99px', background: tag.color + '20', color: tag.color }}>
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '12px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                      {formatDistanceToNow(parseISO(link.createdAt), { addSuffix: true, locale: ptBR })}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <button
                          onClick={() => copyLink(link.shortCode, link.id)}
                          title="Copiar link"
                          style={{ fontFamily: 'inherit', fontSize: '11px', color: 'var(--text-secondary)', background: 'none', border: '0.5px solid transparent', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          {copiedId === link.id ? '✓' : (
                            <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none">
                              <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                            </svg>
                          )}
                        </button>
                        <Link
                          href={`/links/${link.id}`}
                          title="Ver analytics"
                          style={{ fontFamily: 'inherit', fontSize: '11px', color: 'var(--text-secondary)', background: 'none', border: '0.5px solid transparent', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none">
                            <path d="M18 20V10M12 20V4M6 20v-6" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => downloadQR(link.id, link.shortCode)}
                          title="Baixar QR Code"
                          style={{ fontFamily: 'inherit', fontSize: '11px', color: 'var(--text-secondary)', background: 'none', border: '0.5px solid transparent', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none">
                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                            <path d="M14 14h3v3h-3zM17 17h3v3h-3z" />
                          </svg>
                        </button>
                <label title={link.isActive ? 'Desativar' : 'Ativar'} style={{ width: '30px', height: '17px', cursor: 'pointer', display: 'inline-flex', position: 'relative', alignItems: 'center', margin: '5px 9px 5px 4px' }}>
                  <input type="checkbox" checked={link.isActive} onChange={() => toggleActive(link.id, link.isActive)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                  <span style={{ position: 'absolute', inset: 0, background: link.isActive ? 'var(--primary)' : 'var(--border-secondary)', borderRadius: '99px', transition: 'background 0.2s' }} />
                  <span style={{ position: 'absolute', width: '13px', height: '13px', left: '2px', top: '2px', background: 'var(--bg-secondary)', borderRadius: '50%', transition: 'transform 0.2s', transform: link.isActive ? 'translateX(13px)' : 'translateX(0)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </label>
                        <button
                          onClick={() => deleteLink(link.id)}
                          disabled={deletingId === link.id}
                          title="Excluir"
                          style={{ fontFamily: 'inherit', fontSize: '11px', color: 'var(--text-tertiary)', background: 'none', border: '0.5px solid transparent', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '0.5px solid rgba(0,0,0,0.07)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Mostrando {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} de {total} links
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1
              return (
                <Link
                  key={p}
                  href={`/links?page=${p}`}
                  style={{
                    fontFamily: 'inherit', fontSize: '12px',
                    color: p === page ? 'var(--bg-secondary)' : 'var(--text-secondary)',
                    background: p === page ? 'var(--primary)' : 'none',
                    border: '0.5px solid rgba(0,0,0,0.08)',
                    padding: '5px 10px', borderRadius: '6px', textDecoration: 'none',
                    minWidth: '32px', textAlign: 'center',
                  }}
                >
                  {p}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* FAB — mobile only */}
      <button className="fab" onClick={() => setShowModal(true)} aria-label="Novo link">
        <svg width="22" height="22" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {showModal && <CreateLinkModal onClose={() => setShowModal(false)} onSuccess={refreshLinks} />}
    </>
  )
}
