'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'

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
    <div className="page-content">
      <PageHeader
        title="Chaves de API"
        subtitle="Gerencie suas chaves de acesso para integração com outros sistemas"
      />

      <div className="settings-container">
        {/* Nova chave revelada — Modal de Segurança */}
        {newKey && (
          <div className="glass-card mb-8 p-6 border-green-500/30 bg-green-500/[0.02] animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <span className="text-xs font-bold text-green-500 uppercase tracking-widest">
                Chave criada com sucesso
              </span>
            </div>
            <p className="text-sm text-secondary mb-6 leading-relaxed">
              Certifique-se de copiar sua chave agora. Por sua segurança, <strong className="text-white">esta é a única vez que ela será exibida integralmente</strong>.
            </p>
            
            <div className="flex gap-3">
              <div className="flex-1 px-4 py-3.5 rounded-xl bg-black/40 border border-white/10 font-mono text-sm break-all text-primary selection:bg-primary/20">
                {newKey.key}
              </div>
              <button
                onClick={copyKey}
                className={`btn glass px-5 h-[48px] flex items-center justify-center gap-2 transition-all duration-300 ${copiedKey ? 'text-green-500 border-green-500/50 bg-green-500/10' : 'hover:border-primary/50'}`}
                title="Copiar chave"
              >
                {copiedKey ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-wider">Copiado</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-wider">Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Card de Geração de Nova Chave — Estrutura em Linha Premium */}
        <div className="settings-action-card">
          <div className="settings-action-header">
            <h3 className="settings-action-title">Gerar Nova Chave</h3>
            <p className="settings-action-description">
              Crie uma nova chave para acessar nossa API de forma segura em seus projetos.
            </p>
          </div>

          <div className="settings-action-form">
            <div className="settings-input-group-modern">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Ex: API Produção - Backend"
                className="settings-input-modern"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="btn btn-primary"
              style={{ minWidth: '150px', height: '48px' }}
            >
              {creating ? 'Gerando...' : 'Gerar Chave'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {/* Listagem de Chaves Ativas */}
        <h3 className="settings-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none" className="text-primary opacity-80">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
          Chaves Ativas
        </h3>

        {loading ? (
          <div className="glass-card flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : keys.length === 0 ? (
          <div className="glass-card py-20 text-center border-dashed">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-inner">
              <svg width="32" height="32" viewBox="0 0 24 24" stroke="var(--text-tertiary)" strokeWidth="1.5" fill="none" className="opacity-50">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-white mb-2">Sem chaves ativas</h4>
            <p className="text-sm text-tertiary max-w-xs mx-auto leading-relaxed">Você ainda não possui chaves de API. Crie uma acima para começar a usar a API.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {keys.map((k) => (
              <div key={k.id} className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/20 hover:bg-white/[0.02] transition-all duration-500 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-white tracking-tight group-hover:text-primary transition-colors">{k.name}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20">Ativa</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-y-2 text-xs text-secondary font-medium">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 opacity-70">
                        Criada em {formatDate(k.createdAt)}
                      </span>
                      {k.lastUsedAt && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/10 hide-mobile"></span>
                          <span className="flex items-center gap-1.5 opacity-70">
                            Último uso: {timeAgo(k.lastUsedAt)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-0">
                  {revokeConfirmId === k.id ? (
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                      <button 
                        onClick={() => setRevokeConfirmId(null)} 
                        className="btn glass px-4 h-9 text-[10px] font-bold uppercase tracking-wider"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => handleRevoke(k.id)} 
                        disabled={revokingId === k.id}
                        className="btn bg-red-500/90 hover:bg-red-500 text-white border-none px-5 h-9 text-[10px] font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                      >
                        {revokingId === k.id ? '...' : 'Confirmar'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRevokeConfirmId(k.id)}
                      className="btn glass border-transparent hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 text-tertiary px-4 h-9 text-[10px] font-bold uppercase tracking-widest transition-all group-hover:opacity-100 md:opacity-50"
                    >
                      Revogar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 p-6 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10 flex items-start gap-4">
          <svg width="22" height="22" viewBox="0 0 24 24" stroke="rgb(245, 158, 11)" strokeWidth="2" fill="none" className="mt-0.5 flex-shrink-0 opacity-70">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-amber-500 uppercase tracking-widest">Aviso de Segurança</h5>
            <p className="text-sm text-yellow-100/50 leading-relaxed font-medium">
              Chaves de API concedem acesso total à sua conta. Trate-as como senhas. 
              Nunca publique-as no GitHub ou locais públicos. Caso suspeite de vazamento, <strong className="text-amber-500">revogue-as imediatamente</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
