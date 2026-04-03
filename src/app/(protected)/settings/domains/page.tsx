'use client'

import { useState, useEffect } from 'react'
import { useTopbar } from '@/components/layout/Topbar'
import { PageHeader } from '@/components/layout/PageHeader'

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
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle('Domínios')
    topbar.setSubtitle('Conecte domínios personalizados aos seus links')
    topbar.setActions(null)
  }, [topbar])

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
      if (!res.ok) { 
        setError(data.error || 'Erro ao adicionar domínio')
        return 
      }
      setDomains(prev => [data.domain, ...prev])
      setExpandedId(data.domain.id)
      setInput('')
    } catch (err) {
      setError('Erro ao adicionar domínio')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este domínio?')) return
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

  if (loading) {
    return (
      <div className="page-content">
        <div className="profile-spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border-secondary)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
      </div>
    )
  }

  return (
    <div className="page-content">
      <PageHeader 
        title="Domínios Personalizados" 
        subtitle="Gerencie os domínios que você usa para encurtar seus links" 
      />

      <div className="settings-container">
        {/* DNS Hint */}
        <div className="settings-hint">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div className="settings-hint-text">
            Siga as instruções de configuração DNS para ativar cada domínio. Geralmente, você precisará adicionar um registro <strong>TXT</strong> no seu provedor (Cloudflare, GoDaddy, etc).
          </div>
        </div>

        {/* Add domain card */}
        <div className="settings-action-card">
          <div className="settings-action-header">
            <div className="settings-action-icon" style={{ background: 'var(--primary-lighter)', color: 'var(--primary)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
            </div>
            <div className="settings-action-info">
              <h3 className="settings-action-title">Adicionar Novo Domínio</h3>
              <p className="settings-action-description">Conecte seu domínio para dar mais autoridade aos seus links.</p>
            </div>
          </div>
          
          <div className="settings-input-group">
            <div className="settings-input-wrapper">
              <input
                type="text"
                value={input}
                className="settings-input-modern"
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="ex: link.suaempresa.com"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={adding || !input.trim()}
              className="btn btn-primary"
              style={{ height: '48px', padding: '0 24px' }}
            >
              {adding ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>

          {error && (
            <div className="settings-error-alert" style={{ marginTop: '16px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
        </div>

        <div style={{ marginTop: '40px', marginBottom: '16px' }}>
          <h2 className="settings-section-title">Domínios Conectados</h2>
        </div>

        {/* Domain list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {domains.length === 0 ? (
            <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', borderStyle: 'dashed' }}>
              <div className="security-avatar-box" style={{ margin: '0 auto 24px', opacity: 0.5 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Nenhum domínio configurado</div>
              <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', maxWidth: '320px', margin: '0 auto' }}>
                Seus domínios personalizados aparecerão aqui após serem adicionados.
              </p>
            </div>
          ) : (
            domains.map(d => (
              <div key={d.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '20px',
                  padding: '20px 24px',
                }}>
                  {/* Status indicator */}
                  <div className="security-avatar-box" style={{ 
                    background: d.verified ? 'var(--success-lighter)' : 'var(--warning-lighter)',
                    color: d.verified ? 'var(--success)' : 'var(--warning)',
                    flexShrink: 0
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {d.verified ? (
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      ) : (
                        <circle cx="12" cy="12" r="10" />
                      )}
                      {d.verified && <polyline points="22 4 12 14.01 9 11.01" />}
                      {!d.verified && <line x1="12" y1="8" x2="12" y2="12" />}
                      {!d.verified && <line x1="12" y1="16" x2="12.01" y2="16" />}
                    </svg>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)',
                      fontFamily: 'var(--font-dm-mono)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {d.domain}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                       {d.verified ? (
                         <span className="settings-badge-active" style={{ background: 'var(--success-lighter)', color: 'var(--success)', border: 'none' }}>Verificado</span>
                       ) : (
                         <span className="settings-badge-active" style={{ background: 'var(--warning-lighter)', color: 'var(--warning)', border: 'none' }}>Aguardando Verificação</span>
                       )}
                       <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', opacity: 0.6 }}>{new Date(d.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {!d.verified && d.txtRecord && (
                      <button
                        onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                        className="btn btn-ghost"
                        style={{ height: '36px', padding: '0 16px', fontSize: '12px', border: '1px solid var(--border-secondary)', background: expandedId === d.id ? 'var(--bg-secondary)' : 'transparent' }}
                      >
                        {expandedId === d.id ? 'Ocultar Configuração' : 'Configurar DNS'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(d.id)}
                      disabled={deletingId === d.id}
                      className="btn btn-ghost"
                      style={{ width: '36px', height: '36px', padding: 0, color: 'var(--error)' }}
                    >
                      {deletingId === d.id ? (
                        <div className="profile-spinner" style={{ width: '14px', height: '14px', border: '2px solid var(--border-secondary)', borderTopColor: 'var(--error)' }} />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* DNS Configuration panel */}
                {expandedId === d.id && d.txtRecord && (
                  <div style={{
                    borderTop: '1.5px solid var(--border-secondary)',
                    padding: '24px',
                    background: 'var(--bg-secondary)',
                    animation: 'slideDown 0.3s ease-out'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)' }} />
                        Configurações DNS necessárias
                    </div>
                    
                    <div style={{
                      background: 'var(--bg-primary)', borderRadius: '12px',
                      border: '1.5px solid var(--border-secondary)', overflow: 'hidden',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', gap: '16px', borderBottom: '1px solid var(--border-secondary)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', minWidth: '100px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo</span>
                        <span style={{ flex: 1, fontSize: '13px', fontFamily: 'var(--font-dm-mono)', color: 'var(--primary)', fontWeight: 600 }}>TXT</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', gap: '16px', borderBottom: '1px solid var(--border-secondary)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', minWidth: '100px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nome / Host</span>
                        <span style={{ flex: 1, fontSize: '13px', fontFamily: 'var(--font-dm-mono)', color: 'var(--text-primary)' }}>@</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', gap: '16px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', minWidth: '100px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valor</span>
                        <span style={{ flex: 1, fontSize: '13px', fontFamily: 'var(--font-dm-mono)', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{d.txtRecord}</span>
                        <button
                          onClick={() => copyTxt(d.txtRecord!, d.id)}
                          className="btn btn-ghost"
                          style={{ flexShrink: 0, width: '32px', height: '32px', padding: 0, border: '1px solid var(--border-secondary)', color: copied === d.id ? 'var(--success)' : 'var(--text-tertiary)' }}
                        >
                          {copied === d.id ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                              <rect x="9" y="9" width="13" height="13" rx="2" />
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.15)', display: 'flex', gap: '12px' }}>
                        <div style={{ color: 'var(--primary)', marginTop: '2px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                           Se você usa Cloudflare, desative o Proxy para este registro. A propagação pode levar algum tempo.
                        </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
