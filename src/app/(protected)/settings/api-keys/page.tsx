'use client'

import { useState, useEffect } from 'react'
import { useTopbar } from '@/components/layout/Topbar'

interface ApiKey {
  id: string
  name: string
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

function timeAgo(date: string | null): string {
  if (!date) return 'Nunca'
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  if (days < 30) return `${days}d atrás`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}m atrás`
  return `${Math.floor(months / 12)}a atrás`
}

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [newKey, setNewKey] = useState<{ id: string; key: string; name: string } | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null)
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle('API Keys')
    topbar.setSubtitle('Gerencie chaves de acesso à API do 123bit')
    topbar.setActions(null)
  }, [])

  useEffect(() => {
    fetch('/api/keys')
      .then(r => r.json())
      .then(d => setKeys(d.keys || []))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    setError('')
    setNewKey(null)
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao criar chave'); return }
      setKeys(prev => [data.apiKey, ...prev])
      setNewKey({ id: data.apiKey.id, key: data.key, name: data.apiKey.name })
      setName('')
    } catch {
      setError('Erro ao criar chave')
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: string) => {
    setRevokingId(id)
    try {
      await fetch(`/api/keys/${id}`, { method: 'DELETE' })
      setKeys(prev => prev.filter(k => k.id !== id))
      if (newKey?.id === id) setNewKey(null)
    } finally {
      setRevokingId(null)
      setRevokeConfirmId(null)
    }
  }

  const copyKey = () => {
    if (!newKey) return
    navigator.clipboard.writeText(newKey.key)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  return (
    <>
      <div className="page-content" style={{ maxWidth: '680px' }}>

        {/* New key revealed */}
        {newKey && (
          <div style={{
            marginBottom: '24px', padding: '20px', borderRadius: '12px',
            border: '1px solid rgba(34,197,94,0.25)',
            background: 'rgba(34,197,94,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#22c55e' }}>
                Chave criada — copie agora, ela não será exibida novamente
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                flex: 1, padding: '10px 14px', borderRadius: '8px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
                fontFamily: 'var(--font-dm-mono, DM Mono, monospace)', fontSize: '13px',
                color: 'var(--text-primary)', wordBreak: 'break-all',
                userSelect: 'all',
              }}>
                {newKey.key}
              </div>
              <button
                onClick={copyKey}
                className="btn btn-ghost"
                style={{ flexShrink: 0, padding: '0 14px', color: copiedKey ? '#22c55e' : undefined }}
              >
                {copiedKey ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Create key card */}
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Nova chave de API
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Nome da chave (ex: Produção)"
              style={{
                flex: 1, height: '40px',
                fontFamily: 'inherit', fontSize: '13px',
                color: 'var(--text-primary)', background: 'var(--bg-secondary)',
                border: '1px solid var(--border-secondary)', borderRadius: '8px',
                padding: '0 12px', outline: 'none', boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="btn btn-primary"
              style={{ whiteSpace: 'nowrap', paddingLeft: '18px', paddingRight: '18px' }}
            >
              {creating ? 'Criando...' : 'Criar'}
            </button>
          </div>
          {error && (
            <div className="settings-alert settings-alert-error" style={{ marginTop: '12px' }}>
              {error}
            </div>
          )}
        </div>

        {/* Keys list */}
        {keys.length === 0 && !loading ? (
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))',
              border: '1px solid var(--border-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" stroke="var(--text-tertiary)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Nenhuma chave ativa
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 300 }}>
              Crie uma chave de API para integrar o 123bit com seus sistemas.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {keys.map(k => (
              <div key={k.id} className="card" style={{ padding: '16px 20px' }}>
                {revokeConfirmId === k.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Revogar <strong style={{ color: 'var(--text-primary)' }}>{k.name}</strong>? Esta ação é irreversível.
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setRevokeConfirmId(null)}
                        className="btn btn-ghost"
                        style={{ fontSize: '13px', padding: '6px 14px', height: '32px' }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleRevoke(k.id)}
                        disabled={revokingId === k.id}
                        style={{
                          height: '32px', padding: '0 14px', borderRadius: '8px', border: 'none',
                          background: '#ef4444', color: 'white', fontSize: '13px', fontWeight: 500,
                          cursor: revokingId === k.id ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit', opacity: revokingId === k.id ? 0.7 : 1,
                        }}
                      >
                        {revokingId === k.id ? 'Revogando...' : 'Confirmar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Key icon */}
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))',
                      border: '1px solid var(--border-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#8b5cf6',
                    }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                      </svg>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {k.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <span>Criada {formatDate(k.createdAt)}</span>
                        {k.lastUsedAt && <span>· Usada {timeAgo(k.lastUsedAt)}</span>}
                        {k.expiresAt && (
                          <span style={{ color: new Date(k.expiresAt) < new Date() ? '#ef4444' : 'var(--text-tertiary)' }}>
                            · Expira {formatDate(k.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setRevokeConfirmId(k.id)}
                      style={{
                        flexShrink: 0, height: '32px', padding: '0 12px', borderRadius: '8px',
                        border: '1px solid var(--border-secondary)', background: 'transparent',
                        cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                        color: 'var(--text-tertiary)', fontFamily: 'inherit',
                        transition: 'border-color 150ms, color 150ms',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444'
                        ;(e.currentTarget as HTMLButtonElement).style.color = '#ef4444'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-secondary)'
                        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'
                      }}
                    >
                      Revogar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '20px', fontWeight: 300 }}>
          As chaves de API fornecem acesso completo à conta. Não as compartilhe e revogue imediatamente se suspeitar de comprometimento.
        </p>
      </div>
    </>
  )
}
