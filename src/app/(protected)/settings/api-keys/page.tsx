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

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))
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

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [newKey, setNewKey] = useState<{ id: string; key: string; name: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle('Chaves de API')
    topbar.setSubtitle('Gerencie chaves de acesso para integração com a API')
    topbar.setActions(null)
  }, [topbar])

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
      setConfirmId(null)
    }
  }

  const copyKey = () => {
    if (!newKey) return
    navigator.clipboard.writeText(newKey.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="page-content">
      <div className="settings-container">

        {/* Chave recém-criada */}
        {newKey && (
          <div style={{
            marginBottom: '24px', padding: '20px 24px', borderRadius: '16px',
            background: 'color-mix(in srgb, #22c55e 6%, transparent)',
            border: '1px solid color-mix(in srgb, #22c55e 25%, transparent)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Chave criada com sucesso
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Certifique-se de copiar sua chave agora. Por sua segurança, <strong style={{ color: 'var(--text-primary)' }}>esta é a única vez que ela será exibida integralmente</strong>.
            </p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
              <div style={{
                flex: 1, padding: '12px 16px', borderRadius: '10px',
                background: 'var(--bg-primary)', border: '1px solid var(--border-secondary)',
                fontFamily: 'var(--font-dm-mono)', fontSize: '13px', color: 'var(--primary)',
                wordBreak: 'break-all', lineHeight: 1.5,
              }}>
                {newKey.key}
              </div>
              <button
                onClick={copyKey}
                className="btn btn-ghost"
                style={{
                  height: 'auto', padding: '0 16px', flexShrink: 0, fontSize: '13px', fontWeight: 600,
                  border: `1px solid ${copied ? '#22c55e' : 'var(--border-secondary)'}`,
                  color: copied ? '#22c55e' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copiado
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Gerar nova chave */}
        <div className="settings-action-card">
          <div className="settings-action-header">
            <h3 className="settings-action-title">Gerar Nova Chave</h3>
            <p className="settings-action-description">Crie uma nova chave para acessar a API de forma segura em seus projetos.</p>
            {error && (
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}
          </div>
          <div className="settings-action-form">
            <div className="settings-input-group-modern" style={{ minWidth: '220px' }}>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Ex: API Produção - Backend"
                className="settings-input-modern"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="btn btn-primary"
              style={{ height: '48px', padding: '0 24px', flexShrink: 0 }}
            >
              {creating ? 'Gerando...' : 'Gerar Chave'}
            </button>
          </div>
        </div>

        {/* Lista de chaves */}
        <div style={{ marginTop: '32px', marginBottom: '16px' }}>
          <div className="settings-label">Chaves Ativas</div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="profile-spinner" style={{ width: '28px', height: '28px', border: '3px solid var(--border-secondary)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto' }} />
          </div>
        ) : keys.length === 0 ? (
          <div style={{
            padding: '48px 24px', textAlign: 'center', borderRadius: '16px',
            background: 'var(--bg-secondary)', border: '1px dashed var(--border-secondary)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Nenhuma chave ativa</div>
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Gere uma chave acima para começar a usar a API.</div>
            </div>
          </div>
        ) : (
          <div className="settings-info-list">
            {keys.map(k => (
              <div key={k.id} className="settings-info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px', padding: '16px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{k.name}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'color-mix(in srgb, #22c55e 10%, transparent)', color: '#22c55e', border: '1px solid color-mix(in srgb, #22c55e 25%, transparent)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Ativa</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', gap: '16px' }}>
                      <span>Criada em {formatDate(k.createdAt)}</span>
                      {k.lastUsedAt && <span>Último uso: {timeAgo(k.lastUsedAt)}</span>}
                    </div>
                  </div>

                  {confirmId === k.id ? (
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button onClick={() => setConfirmId(null)} className="btn btn-ghost" style={{ height: '34px', padding: '0 14px', fontSize: '12px' }}>
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleRevoke(k.id)}
                        disabled={revokingId === k.id}
                        className="btn"
                        style={{ height: '34px', padding: '0 14px', fontSize: '12px', background: '#ef4444', color: 'white', border: 'none' }}
                      >
                        {revokingId === k.id ? '...' : 'Confirmar revogação'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(k.id)}
                      className="btn btn-ghost"
                      style={{ height: '34px', padding: '0 14px', fontSize: '12px', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', flexShrink: 0 }}
                    >
                      Revogar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Aviso de segurança */}
        <div className="settings-hint" style={{ marginTop: '24px', borderLeftColor: '#f59e0b' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div className="settings-hint-text">
            <strong style={{ color: '#f59e0b' }}>Aviso de Segurança:</strong> Chaves de API concedem acesso total à sua conta. Trate-as como senhas. Nunca publique-as no GitHub ou locais públicos. Caso suspeite de vazamento, <strong>revogue-as imediatamente</strong>.
          </div>
        </div>

      </div>
    </div>
  )
}
