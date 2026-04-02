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

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  ok:      { label: 'Online',  color: '#22c55e', dot: '#22c55e' },
  error:   { label: 'Erro',    color: '#ef4444', dot: '#ef4444' },
  timeout: { label: 'Timeout', color: '#f59e0b', dot: '#f59e0b' },
  unknown: { label: 'Não verificado', color: 'var(--text-tertiary)', dot: 'var(--border-secondary)' },
}

function getStatus(s: string | null) {
  return statusConfig[s || 'unknown'] || statusConfig.unknown
}

function timeAgo(date: string | null): string {
  if (!date) return 'Nunca'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Agora mesmo'
  if (mins < 60) return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  return `${Math.floor(hrs / 24)}d atrás`
}

export default function HealthPage() {
  const [links, setLinks] = useState<LinkHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState<string | null>(null)
  const [bulkChecking, setBulkChecking] = useState(false)
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle('Health Monitor')
    topbar.setSubtitle('Monitore se os destinos dos seus links estão online')
    topbar.setActions(
      <button
        className="btn btn-primary"
        onClick={checkAll}
        disabled={bulkChecking}
        style={{ whiteSpace: 'nowrap' }}
      >
        {bulkChecking ? 'Verificando...' : 'Verificar todos'}
      </button>
    )
  }, [bulkChecking])

  const load = useCallback(async () => {
    const res = await fetch('/api/links/health')
    const data = await res.json()
    setLinks(data.links || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

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

  const checkAll = async () => {
    setBulkChecking(true)
    try {
      await fetch('/api/links/health', { method: 'PATCH' })
      await load()
    } finally {
      setBulkChecking(false)
    }
  }

  const counts = {
    ok: links.filter(l => l.healthStatus === 'ok').length,
    error: links.filter(l => l.healthStatus === 'error').length,
    timeout: links.filter(l => l.healthStatus === 'timeout').length,
    unknown: links.filter(l => !l.healthStatus || l.healthStatus === 'unknown').length,
  }

  return (
    <>
      <div className="page-content">
        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Online', count: counts.ok, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
            { label: 'Com erro', count: counts.error, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
            { label: 'Timeout', count: counts.timeout, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
            { label: 'Não verificado', count: counts.unknown, color: 'var(--text-tertiary)', bg: 'var(--bg-secondary)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '16px 20px', border: `1px solid ${s.bg}`, background: s.bg }}>
              <div style={{ fontSize: '24px', fontWeight: 600, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: '12px', color: s.color, marginTop: '2px', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Links list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)', fontSize: '14px' }}>Carregando...</div>
        ) : links.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>Nenhum link para monitorar</div>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Crie links para começar a monitorar seus destinos.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {links.map(link => {
              const s = getStatus(link.healthStatus)
              return (
                <div key={link.id} className="card" style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Status dot */}
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                      background: s.dot,
                      boxShadow: link.healthStatus === 'ok'
                        ? '0 0 0 3px rgba(34,197,94,0.15)'
                        : link.healthStatus === 'error'
                        ? '0 0 0 3px rgba(239,68,68,0.15)'
                        : undefined,
                    }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {link.title || link.shortCode}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px', maxWidth: '320px' }}>
                        {link.originalUrl}
                      </div>
                    </div>

                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: s.color }}>{s.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                        {timeAgo(link.lastHealthCheck)}
                      </div>
                    </div>

                    <button
                      onClick={() => checkOne(link.id)}
                      disabled={checking === link.id}
                      style={{
                        flexShrink: 0, width: '32px', height: '32px', borderRadius: '8px',
                        border: '1px solid var(--border-secondary)', background: 'transparent',
                        cursor: checking === link.id ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-tertiary)',
                      }}
                      title="Verificar agora"
                    >
                      <svg
                        width="13" height="13" viewBox="0 0 24 24"
                        stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"
                        style={{ animation: checking === link.id ? 'spin 1s linear infinite' : 'none' }}
                      >
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
