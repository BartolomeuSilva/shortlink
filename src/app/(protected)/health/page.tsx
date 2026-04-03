'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTopbar } from '@/components/layout/Topbar'

interface LinkHealth {
  id: string
  shortCode: string
  title: string | null
  originalUrl: string
  healthStatus: string | null
  lastHealthCheck: string | null
  clickCount: number
}

const statusConfig: Record<string, { label: string; color: string; class: string }> = {
  ok:      { label: 'Online',  color: '#22c55e', class: 'ok' },
  error:   { label: 'Erro',    color: '#ef4444', class: 'error' },
  timeout: { label: 'Timeout', color: '#f59e0b', class: 'warning' },
  unknown: { label: 'Pendente', color: 'var(--text-tertiary)', class: 'unknown' },
}

function getStatus(s: string | null) {
  return statusConfig[s || 'unknown'] || statusConfig.unknown
}

function timeAgo(date: string | null): string {
  if (!date) return 'Nunca verificado'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Agora mesmo'
  if (mins < 60) return `Há ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Há ${hrs}h`
  return `Há ${Math.floor(hrs / 24)}d`
}

export default function HealthPage() {
  const [links, setLinks] = useState<LinkHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState<string | null>(null)
  const [bulkChecking, setBulkChecking] = useState(false)
  const topbar = useTopbar()

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/links/health')
      const data = await res.json()
      setLinks(data.links || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const checkAll = async () => {
    setBulkChecking(true)
    try {
      await fetch('/api/links/health', { method: 'PATCH' })
      await load()
    } finally {
      setBulkChecking(false)
    }
  }

  useEffect(() => {
    topbar.setTitle('Health Monitor')
    topbar.setSubtitle('Status em tempo real dos destinos dos seus links')
    topbar.setActions(
      <button
        className="btn btn-primary"
        onClick={checkAll}
        disabled={bulkChecking || loading}
      >
        {bulkChecking ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="profile-spinner" style={{ marginRight: '8px' }}>
              <path d="M21 12a9 9 0 11-6.219-8.56"></path>
            </svg>
            Verificando...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path>
            </svg>
            Verificar Todos
          </>
        )}
      </button>
    )
  }, [bulkChecking, loading])

  const checkOne = async (id: string) => {
    setChecking(id)
    try {
      await fetch('/api/links/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: id }),
      })
      await load()
    } finally {
      setChecking(null)
    }
  }

  const counts = {
    ok: links.filter(l => l.healthStatus === 'ok').length,
    error: links.filter(l => l.healthStatus === 'error').length,
    timeout: links.filter(l => l.healthStatus === 'timeout').length,
    unknown: links.filter(l => !l.healthStatus || l.healthStatus === 'unknown').length,
  }

  return (
    <div className="page-content">
      {/* KPI Section */}
      <div className="health-grid">
        <div className="health-kpi-card health-kpi-online">
          <div className="health-kpi-value">{counts.ok}</div>
          <div className="health-kpi-label">Online</div>
        </div>
        <div className="health-kpi-card health-kpi-error">
          <div className="health-kpi-value">{counts.error}</div>
          <div className="health-kpi-label">Erros</div>
        </div>
        <div className="health-kpi-card health-kpi-warning">
          <div className="health-kpi-value">{counts.timeout}</div>
          <div className="health-kpi-label">Timeout</div>
        </div>
        <div className="health-kpi-card">
          <div className="health-kpi-value" style={{ color: 'var(--text-tertiary)' }}>{counts.unknown}</div>
          <div className="health-kpi-label">Pendentes</div>
        </div>
      </div>

      {/* Main List */}
      <div className="health-list">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="profile-spinner">
              <path d="M21 12a9 9 0 11-6.219-8.56"></path>
            </svg>
          </div>
        ) : links.length === 0 ? (
          <div className="ws-empty" style={{ maxWidth: '800px', width: '100%' }}>
            <div className="ws-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h3 className="ws-empty-title">Tudo limpo por aqui</h3>
            <p className="ws-empty-desc">
              Você ainda não tem links para monitorar. Assim que criar seus links, eles aparecerão aqui para verificação automática de saúde.
            </p>
          </div>
        ) : (
          links.map(link => {
            const s = getStatus(link.healthStatus)
            const isChecking = checking === link.id
            
            return (
              <div key={link.id} className="health-item">
                <div className={`health-status-dot ${s.class}`} />
                
                <div className="health-item-info">
                  <div className="health-item-title">{link.title || link.shortCode}</div>
                  <div className="health-item-url">{link.originalUrl}</div>
                </div>

                <div className="health-item-meta">
                  <div className="health-status-text" style={{ color: s.color }}>{s.label}</div>
                  <div className="health-last-check">{timeAgo(link.lastHealthCheck)}</div>
                </div>

                <button
                  className="health-btn-refresh"
                  onClick={(e) => { e.preventDefault(); checkOne(link.id); }}
                  disabled={isChecking || bulkChecking}
                  title="Verificar agora"
                >
                  {isChecking ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="profile-spinner">
                      <path d="M21 12a9 9 0 11-6.219-8.56"></path>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                    </svg>
                  )}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
