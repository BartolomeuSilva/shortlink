'use client'

import { useState, useEffect } from 'react'

interface Domain {
  id: string
  domain: string
  verified: boolean
  txtRecord: string | null
  sslStatus: string | null
  createdAt: string
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/domains')
      .then(r => r.json())
      .then(d => setDomains(d.domains || []))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async () => {
    if (!input.trim()) return
    setAdding(true)
    setError('')
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: input.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao adicionar domínio'); return }
      setDomains(prev => [data.domain, ...prev])
      setExpandedId(data.domain.id)
      setInput('')
    } catch {
      setError('Erro ao adicionar domínio')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await fetch(`/api/domains/${id}`, { method: 'DELETE' })
      setDomains(prev => prev.filter(d => d.id !== id))
      if (expandedId === id) setExpandedId(null)
    } finally {
      setDeletingId(null)
    }
  }

  const copyTxt = (txt: string, id: string) => {
    navigator.clipboard.writeText(txt)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Domínios</div>
          <div className="page-subtitle">Conecte domínios personalizados aos seus links</div>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: '680px' }}>

        {/* Add domain card */}
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Adicionar domínio
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="meudominio.com"
              style={{
                flex: 1, height: '40px',
                fontFamily: 'var(--font-dm-mono, DM Mono, monospace)', fontSize: '13px',
                color: 'var(--text-primary)', background: 'var(--bg-secondary)',
                border: '1px solid var(--border-secondary)', borderRadius: '8px',
                padding: '0 12px', outline: 'none', boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleAdd}
              disabled={adding || !input.trim()}
              className="btn btn-primary"
              style={{ whiteSpace: 'nowrap', paddingLeft: '18px', paddingRight: '18px' }}
            >
              {adding ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
          {error && (
            <div className="settings-alert settings-alert-error" style={{ marginTop: '12px' }}>
              {error}
            </div>
          )}
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '10px', fontWeight: 300 }}>
            Após adicionar, você precisará configurar um registro TXT no seu DNS para verificar a propriedade.
          </p>
        </div>

        {/* Domain list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            Carregando domínios...
          </div>
        ) : domains.length === 0 ? (
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))',
              border: '1px solid var(--border-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" stroke="var(--text-tertiary)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Nenhum domínio ainda
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 300 }}>
              Adicione um domínio personalizado para usar nos seus links encurtados.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {domains.map(d => (
              <div key={d.id} className="card" style={{ overflow: 'hidden' }}>
                {/* Main row */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '16px 20px',
                }}>
                  {/* Status dot */}
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    background: d.verified ? '#22c55e' : '#f59e0b',
                    boxShadow: d.verified ? '0 0 0 3px rgba(34,197,94,0.15)' : '0 0 0 3px rgba(245,158,11,0.15)',
                  }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)',
                      fontFamily: 'var(--font-dm-mono, DM Mono, monospace)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {d.domain}
                    </div>
                    <div style={{ fontSize: '12px', color: d.verified ? '#22c55e' : '#f59e0b', marginTop: '2px', fontWeight: 500 }}>
                      {d.verified ? 'Verificado' : 'Aguardando verificação'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {!d.verified && d.txtRecord && (
                      <button
                        onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                        className="btn btn-ghost"
                        style={{ fontSize: '12px', padding: '6px 12px', height: '32px' }}
                      >
                        {expandedId === d.id ? 'Ocultar DNS' : 'Ver DNS'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(d.id)}
                      disabled={deletingId === d.id}
                      style={{
                        width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                        background: 'transparent', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-tertiary)',
                        transition: 'background 150ms, color 150ms',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'
                        ;(e.currentTarget as HTMLButtonElement).style.color = '#ef4444'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* TXT record panel */}
                {expandedId === d.id && d.txtRecord && (
                  <div style={{
                    borderTop: '1px solid var(--border-primary)',
                    padding: '16px 20px',
                    background: 'var(--bg-secondary)',
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      Configuração DNS
                    </div>
                    <div style={{
                      background: 'var(--bg-primary)', borderRadius: '8px',
                      border: '1px solid var(--border-primary)', overflow: 'hidden',
                    }}>
                      {[
                        { label: 'Tipo', value: 'TXT' },
                        { label: 'Nome / Host', value: '@' },
                        { label: 'Valor', value: d.txtRecord },
                      ].map((row, i, arr) => (
                        <div key={row.label} style={{
                          display: 'flex', alignItems: 'center',
                          padding: '10px 14px', gap: '12px',
                          borderBottom: i < arr.length - 1 ? '1px solid var(--border-primary)' : 'none',
                        }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', minWidth: '80px', fontWeight: 500 }}>
                            {row.label}
                          </span>
                          <span style={{
                            flex: 1, fontSize: '12px', fontFamily: 'var(--font-dm-mono, DM Mono, monospace)',
                            color: 'var(--text-primary)', wordBreak: 'break-all',
                          }}>
                            {row.value}
                          </span>
                          {row.label === 'Valor' && (
                            <button
                              onClick={() => copyTxt(d.txtRecord!, d.id)}
                              style={{
                                flexShrink: 0, width: '28px', height: '28px', borderRadius: '6px',
                                border: '1px solid var(--border-secondary)', background: 'transparent',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: copied === d.id ? '#22c55e' : 'var(--text-tertiary)',
                                transition: 'color 150ms',
                              }}
                              title="Copiar"
                            >
                              {copied === d.id ? (
                                <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="9" y="9" width="13" height="13" rx="2" />
                                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '10px', fontWeight: 300 }}>
                      Após configurar o DNS, aguarde até 48h para propagação e verificação automática.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
