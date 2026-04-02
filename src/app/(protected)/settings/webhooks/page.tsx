'use client'

import { useEffect, useState } from 'react'
import { useTopbar } from '@/components/layout/Topbar'

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

  useEffect(() => {
    topbar.setTitle('Webhooks')
    topbar.setSubtitle('Receba notificações em tempo real para eventos dos seus links')
    topbar.setActions(
      <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
        {showForm ? 'Cancelar' : '+ Novo webhook'}
      </button>
    )
  }, [showForm])

  const load = async () => {
    const res = await fetch('/api/webhooks')
    const data = await res.json()
    setWebhooks(data.webhooks || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!name || !url || selectedEvents.length === 0) return
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
    } finally {
      setCreating(false)
    }
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: 'POST' })
      const data = await res.json()
      setTestResult(prev => ({ ...prev, [id]: data.success ? `OK (${data.statusCode})` : `Falhou (${data.statusCode || 'sem resposta'})` }))
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
    setDeletingId(id)
    await fetch(`/api/webhooks/${id}`, { method: 'DELETE' })
    setWebhooks(prev => prev.filter(w => w.id !== id))
    setDeletingId(null)
  }

  const inp: React.CSSProperties = {
    width: '100%', height: '40px', fontFamily: 'inherit', fontSize: '13px',
    color: 'var(--text-primary)', background: 'var(--bg-secondary)',
    border: '1px solid var(--border-secondary)', borderRadius: '8px',
    padding: '0 12px', outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }

  return (
    <>
      <div className="page-content" style={{ maxWidth: '680px' }}>
        {/* Create form */}
        {showForm && (
          <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '16px' }}>Novo webhook</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={lbl}>Nome</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Notificação Slack" style={inp} />
              </div>
              <div>
                <label style={lbl}>URL de destino</label>
                <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://hooks.slack.com/..." style={inp} />
              </div>
              <div>
                <label style={lbl}>Secret (opcional)</label>
                <input value={secret} onChange={e => setSecret(e.target.value)} placeholder="Enviado no header X-Webhook-Secret" style={inp} />
              </div>
              <div>
                <label style={lbl}>Eventos</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ALL_EVENTS.map(ev => (
                    <label key={ev} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(ev)}
                        onChange={e => setSelectedEvents(prev => e.target.checked ? [...prev, ev] : prev.filter(x => x !== ev))}
                      />
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{EVENT_LABELS[ev]}</span>
                      <code style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-dm-mono, monospace)' }}>{ev}</code>
                    </label>
                  ))}
                </div>
              </div>
              {formError && <div style={{ fontSize: '13px', color: '#ef4444' }}>{formError}</div>}
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? 'Criando...' : 'Criar webhook'}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)', fontSize: '14px' }}>Carregando...</div>
        ) : webhooks.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>Nenhum webhook ainda</div>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Crie um webhook para integrar com Slack, Zapier, n8n e muito mais.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {webhooks.map(wh => {
              const lastDelivery = wh.deliveries[0]
              return (
                <div key={wh.id} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    {/* Status dot */}
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%', marginTop: '5px', flexShrink: 0,
                      background: !wh.active ? 'var(--border-secondary)' : lastDelivery?.success === false ? '#ef4444' : '#22c55e',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{wh.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wh.url}</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {wh.events.map(ev => (
                          <span key={ev} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: 'rgba(139,92,246,0.08)', color: '#8b5cf6', border: '0.5px solid rgba(139,92,246,0.2)' }}>
                            {EVENT_LABELS[ev] || ev}
                          </span>
                        ))}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                        {wh._count.deliveries} entregas
                        {lastDelivery && ` · última ${lastDelivery.success ? '✓' : '✗'} ${new Date(lastDelivery.deliveredAt).toLocaleDateString('pt-BR')}`}
                      </div>
                      {testResult[wh.id] && (
                        <div style={{ fontSize: '12px', marginTop: '6px', color: testResult[wh.id].startsWith('OK') ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
                          Teste: {testResult[wh.id]}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexDirection: 'column', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleTest(wh.id)}
                          disabled={testingId === wh.id}
                          className="btn btn-ghost"
                          style={{ fontSize: '12px', padding: '5px 12px', height: '30px' }}
                        >
                          {testingId === wh.id ? 'Testando...' : 'Testar'}
                        </button>
                        <button
                          onClick={() => handleToggle(wh.id, wh.active)}
                          className="btn btn-ghost"
                          style={{ fontSize: '12px', padding: '5px 12px', height: '30px' }}
                        >
                          {wh.active ? 'Pausar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => handleDelete(wh.id)}
                          disabled={deletingId === wh.id}
                          style={{
                            width: '30px', height: '30px', borderRadius: '8px', border: '1px solid var(--border-secondary)',
                            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)',
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
