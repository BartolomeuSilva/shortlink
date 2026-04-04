'use client'

import { useState, useCallback, useEffect } from 'react'
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
  hasQr?: boolean
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

  useEffect(() => {
    setLinks(initialLinks)
  }, [initialLinks])

  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string, shortCode: string } | null>(null)
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
    setDeletingId(id)
    await fetch(`/api/links/${id}`, { method: 'DELETE' })
    setLinks((prev) => prev.filter((l) => l.id !== id))
    setDeletingId(null)
    setShowDeleteModal(false)
    setItemToDelete(null)
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
    <div className="links-page">
      {/* TOOLBAR */}
      <div className="links-toolbar">
        <div className="links-search-wrapper">
          <svg className="links-search-icon" width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            className="links-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por título ou URL..."
          />
        </div>
        <select
          className="links-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Status: Todos</option>
          <option value="active">🟢 Ativos</option>
          <option value="off">⚪ Inativos</option>
          <option value="expired">🟡 Expirados</option>
        </select>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          style={{ height: '48px', borderRadius: '14px', padding: '0 20px' }}
        >
          Novo Link
        </button>
      </div>

      {/* STATS BAR */}
      <div className="links-stats-bar">
        <span><strong>{total}</strong> links criados</span>
        <span>•</span>
        <span><strong>{formatNumber(links.reduce((s, l) => s + l.clickCount, 0))}</strong> cliques</span>
      </div>

      {/* LINKS GRID */}
      <div className="links-grid">
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '15px' }}>
            {search || statusFilter !== 'all' ? 'Nenhum link encontrado com esses filtros.' : 'Você ainda não criou nenhum link.'}
          </div>
        ) : (
          filtered.map((link) => {
            const status = getStatus(link)
            return (
              <div key={link.id} className="links-card">
                <div className="links-card-header">
                  <div className="links-card-icon">🔗</div>
                  <div className="links-card-info">
                    <a href={`${baseUrl}/${link.shortCode}`} target="_blank" rel="noopener noreferrer" className="links-card-short">
                      {baseUrl.replace(/^https?:\/\//, '')}/{link.shortCode}
                    </a>
                    <div className="links-card-title">{link.title || 'Link sem título'}</div>
                    <div className="links-card-orig">{link.originalUrl}</div>
                  </div>
                  <span className={`links-status-badge status-${status}`}>
                    <span className="status-dot" />
                    {status === 'active' ? 'Ativo' : status === 'expired' ? 'Expirado' : 'Inativo'}
                  </span>
                </div>

                <div className="links-card-meta">
                  <div className="links-card-clicks">
                    <span className="links-clicks-count">{formatNumber(link.clickCount)}</span>
                    <span className="links-clicks-label">cliques</span>
                  </div>
                  <div className="links-card-date">
                    Criado {formatDistanceToNow(parseISO(link.createdAt), { addSuffix: true, locale: ptBR })}
                  </div>
                </div>

                <div className="links-card-actions">
                  <button
                    className="links-action-btn"
                    onClick={() => copyLink(link.shortCode, link.id)}
                    title="Copiar Link"
                  >
                    {copiedId === link.id ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                    )}
                  </button>
                  <Link href={`/links/${link.id}`} className="links-action-btn" title="Analytics">
                    <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
                  </Link>
                  {link.hasQr && (
                    <button onClick={() => downloadQR(link.id, link.shortCode)} className="links-action-btn" title="Download QR Code">
                      <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM17 17h3v3h-3z" /></svg>
                    </button>
                  )}
                  <button
                    className="links-action-btn btn-delete"
                    onClick={() => {
                      setItemToDelete({ id: link.id, shortCode: link.shortCode });
                      setShowDeleteModal(true);
                    }}
                    title="Excluir"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" /></svg>
                  </button>

                  <label className="links-switch">
                    <input
                      type="checkbox"
                      checked={link.isActive}
                      onChange={() => toggleActive(link.id, link.isActive)}
                    />
                    <span className="links-slider" />
                  </label>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* FAB — Mobile only */}
      <button className="dash-fab" onClick={() => setShowModal(true)} aria-label="Novo link">
        <svg width="24" height="24" viewBox="0 0 24 24" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {showModal && <CreateLinkModal onClose={() => setShowModal(false)} onSuccess={refreshLinks} />}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="sidebar-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="dash-card" style={{ maxWidth: '400px', padding: '24px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(239,68,68,0.1)', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Excluir Link?</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', lineHeight: '1.5', marginBottom: '24px' }}>
              Tem certeza que deseja excluir o link <strong>{itemToDelete?.shortCode}</strong>? Esta ação é irreversível.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, background: '#ef4444', border: 'none' }}
                onClick={() => itemToDelete && deleteLink(itemToDelete.id)}
                disabled={!!deletingId}
              >
                {deletingId ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
