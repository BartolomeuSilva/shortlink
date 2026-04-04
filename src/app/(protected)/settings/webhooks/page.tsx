'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTopbar } from '@/components/layout/Topbar'
import { PageHeader } from '@/components/layout/PageHeader'

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  active: boolean
  createdAt: string
  _count: { deliveries: number }
  deliveries: { success: boolean; deliveredAt: string; statusCode: number | null }[]
}

const EVENT_LABELS: Record<string, string> = {
  'link.clicked': 'Clique em link',
  'link.created': 'Link criado',
  'link.expired': 'Link expirado',
  'link.health': 'Saúde do link',
}
const ALL_EVENTS = Object.keys(EVENT_LABELS)

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, string>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const topbar = useTopbar()

  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['link.clicked'])
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/webhooks')
    const data = await res.json()
    setWebhooks(data.webhooks || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    topbar.setTitle('Webhooks')
    topbar.setSubtitle('Gerencie notificações em tempo real')
    topbar.setActions(null)
  }, [topbar])

  const handleCreate = async () => {
    if (!name || !url || selectedEvents.length === 0) {
      setFormError('Por favor, preencha o nome, URL e selecione ao menos um evento.')
      return
    }
    setCreating(true)
    setFormError('')
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, secret, events: selectedEvents }),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || 'Erro ao criar'); return }
      setWebhooks(prev => [data.webhook, ...prev])
      setShowForm(false)
      setName(''); setUrl(''); setSecret('')
      setSelectedEvents(['link.clicked'])
    } catch {
      setFormError('Erro ao conectar com o servidor.')
    } finally {
      setCreating(false)
    }
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: 'POST' })
      const data = await res.json()
      setTestResult(prev => ({ ...prev, [id]: data.success ? `✓ OK (${data.statusCode})` : `✗ Erro (${data.statusCode || 'Timeout'})` }))
      setTimeout(() => setTestResult(prev => { const n = { ...prev }; delete n[id]; return n }), 5000)
    } finally {
      setTestingId(null)
    }
  }

  const handleToggle = async (id: string, active: boolean) => {
    await fetch(`/api/webhooks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, active: !active } : w))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este webhook?')) return
    setDeletingId(id)
    await fetch(`/api/webhooks/${id}`, { method: 'DELETE' })
    setWebhooks(prev => prev.filter(w => w.id !== id))
    setDeletingId(null)
  }

  if (loading) return (
    <div className="page-content">
      <div className="profile-spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border-secondary)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
    </div>
  )

  return (
    <div className="page-content">
      <PageHeader title="Webhooks" subtitle="Receba notificações em tempo real para eventos dos seus links" />

      <div className="settings-container">
        
        {/* Help Hint */}
        <div className="settings-hint">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          <div className="settings-hint-text">
            Use Webhooks para integrar com <strong>Zapier</strong>, <strong>n8n</strong>, ou qualquer servidor personalizado. Enviamos um payload JSON sempre que o evento ocorrer.
          </div>
        </div>

        {/* Action Card: Create Webhook */}
        {!showForm ? (
          <div className="settings-action-card">
            <div className="settings-action-header">
              <h3 className="settings-action-title">Novo Webhook</h3>
              <p className="settings-action-description">Crie integrações em tempo real para seus eventos dos links.</p>
            </div>
            <div className="settings-action-form">
              <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ height: '48px', padding: '0 28px' }}>
                + Criar Webhook
              </button>
            </div>
          </div>
        ) : (
          <div className="settings-action-card" style={{ flexDirection: 'column' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Novo Webhook</div>
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Preencha os campos abaixo para criar uma nova integração</div>
            </div>

            <div style={{ height: '1px', background: 'var(--border-primary)', margin: '20px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label className="settings-list-label">Nome de Identificação</label>
                  <input
                    className="settings-input-modern"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Notificação Slack Vendas"
                  />
                </div>
                <div>
                  <label className="settings-list-label">URL de Destino (Endpoint)</label>
                  <input
                    className="settings-input-modern"
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://sua-api.com/webhook"
                    style={{ fontFamily: 'var(--font-dm-mono)' }}
                  />
                </div>
              </div>

              <div>
                <label className="settings-list-label">Secret de Verificação <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(opcional)</span></label>
                <input
                  className="settings-input-modern"
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  placeholder="Header X-Webhook-Secret — deixe em branco para ignorar"
                />
              </div>

              <div>
                <label className="settings-list-label">Eventos a Notificar</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginTop: '10px' }}>
                  {ALL_EVENTS.map(ev => (
                    <label key={ev} style={{
                      display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                      padding: '12px 16px', borderRadius: '12px', transition: 'all 0.15s ease',
                      border: `1.5px solid ${selectedEvents.includes(ev) ? 'var(--primary)' : 'var(--border-secondary)'}`,
                      background: selectedEvents.includes(ev) ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'var(--bg-tertiary)',
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(ev)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', flexShrink: 0 }}
                        onChange={e => setSelectedEvents(prev => e.target.checked ? [...prev, ev] : prev.filter(x => x !== ev))}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{EVENT_LABELS[ev]}</div>
                        <code style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{ev}</code>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {formError && (
                <div style={{ fontSize: '13px', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-primary" onClick={handleCreate} disabled={creating} style={{ height: '44px', padding: '0 28px' }}>
                  {creating ? 'Salvando...' : 'Salvar Webhook'}
                </button>
                <button className="btn btn-ghost" onClick={() => { setShowForm(false); setFormError('') }} style={{ height: '44px', padding: '0 20px' }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '40px', marginBottom: '16px' }}>
          <h2 className="settings-section-title">Webhooks Configurados</h2>
        </div>

        {/* Webhooks List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {webhooks.length === 0 ? (
            <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', borderStyle: 'dashed' }}>
              <div className="security-avatar-box" style={{ margin: '0 auto 20px', opacity: 0.5 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Nenhum webhook ativo</div>
              <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', maxWidth: '300px', margin: '0 auto' }}>
                Comece integrando seus links com outras ferramentas em tempo real.
              </p>
            </div>
          ) : (
            webhooks.map(wh => {
              const lastDelivery = wh.deliveries ? wh.deliveries[0] : null
              const isFailing = lastDelivery && !lastDelivery.success

              return (
                <div key={wh.id} className="glass-card" style={{ padding: '24px', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                    {/* Status Avatar */}
                    <div className="security-avatar-box" style={{ 
                      background: !wh.active ? 'var(--bg-secondary)' : isFailing ? 'var(--error-lighter)' : 'var(--success-lighter)',
                      color: !wh.active ? 'var(--text-tertiary)' : isFailing ? 'var(--error)' : 'var(--success)',
                      flexShrink: 0
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {isFailing ? (
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
                        ) : (
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        )}
                      </svg>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{wh.name}</div>
                        {!wh.active && <span className="settings-badge-disabled">Pausado</span>}
                        {wh.active && !isFailing && <span className="settings-badge-active" style={{ background: 'var(--success-lighter)', color: 'var(--success)', border: 'none' }}>Ativo</span>}
                        {isFailing && <span className="settings-badge-active" style={{ background: 'var(--error-lighter)', color: 'var(--error)', border: 'none' }}>Erro</span>}
                      </div>
                      
                      <div style={{ 
                        fontSize: '13px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap', fontFamily: 'var(--font-dm-mono)', marginBottom: '12px' 
                      }}>
                        {wh.url}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        {wh.events.map(ev => (
                          <span key={ev} className="settings-badge-active" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-secondary)', padding: '2px 10px', fontSize: '10px' }}>
                            {EVENT_LABELS[ev] || ev}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{wh._count.deliveries}</span> entregas
                        </div>
                        {lastDelivery && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Última: <span style={{ color: lastDelivery.success ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                              {lastDelivery.success ? 'OK' : `Falha (${lastDelivery.statusCode || 'N/A'})`}
                            </span>
                            <span style={{ opacity: 0.3 }}>|</span>
                            <span>{new Date(lastDelivery.deliveredAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>

                      {testResult[wh.id] && (
                        <div style={{ 
                          fontSize: '12px', marginTop: '16px', padding: '10px 14px', borderRadius: '10px',
                          background: testResult[wh.id].includes('OK') ? 'var(--success-lighter)' : 'var(--error-lighter)',
                          color: testResult[wh.id].includes('OK') ? 'var(--success)' : 'var(--error)',
                          fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                          animation: 'fadeIn 0.3s ease-out'
                        }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                          Resultado do Teste: {testResult[wh.id]}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleTest(wh.id)}
                        disabled={testingId === wh.id}
                        className="btn btn-ghost"
                        style={{ height: '36px', fontSize: '12px', border: '1.5px solid var(--border-secondary)', padding: '0 16px' }}
                      >
                        {testingId === wh.id ? '...' : 'Testar'}
                      </button>
                      <button
                        onClick={() => handleToggle(wh.id, wh.active)}
                        className="btn btn-ghost"
                        style={{ height: '36px', fontSize: '12px', border: '1.5px solid var(--border-secondary)', padding: '0 16px' }}
                      >
                        {wh.active ? 'Pausar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => handleDelete(wh.id)}
                        disabled={deletingId === wh.id}
                        className="btn btn-ghost"
                        style={{ height: '36px', width: '36px', padding: 0, color: 'var(--error)', border: '1.5px solid var(--border-secondary)' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
