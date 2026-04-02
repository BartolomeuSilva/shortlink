'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTopbar } from '@/components/layout/Topbar'

interface Campaign {
  id: string
  name: string
  description: string | null
  linkCount: number
  totalClicks: number
  createdAt: string
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle('Campanhas')
    topbar.setSubtitle('Agrupe links por campanha e analise o desempenho consolidado')
    topbar.setActions(
      <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
        {showForm ? 'Cancelar' : '+ Nova campanha'}
      </button>
    )
  }, [showForm])

  const load = async () => {
    const res = await fetch('/api/campaigns')
    const data = await res.json()
    setCampaigns(data.campaigns || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro'); return }
      setCampaigns(prev => [{ ...data.campaign, linkCount: 0, totalClicks: 0 }, ...prev])
      setShowForm(false)
      setName(''); setDescription('')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
    setCampaigns(prev => prev.filter(c => c.id !== id))
    setDeletingId(null)
  }

  return (
    <>
      <div className="page-content" style={{ maxWidth: '720px' }}>
        {showForm && (
          <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '14px' }}>Nova campanha</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                value={name} onChange={e => setName(e.target.value)} placeholder="Nome da campanha *"
                style={{ height: '40px', fontFamily: 'inherit', fontSize: '13px', color: 'var(--text-primary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: '8px', padding: '0 12px', outline: 'none', boxSizing: 'border-box' }}
              />
              <textarea
                value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição (opcional)" rows={2}
                style={{ fontFamily: 'inherit', fontSize: '13px', color: 'var(--text-primary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: '8px', padding: '8px 12px', outline: 'none', resize: 'none', lineHeight: '1.5', boxSizing: 'border-box' }}
              />
              {error && <div style={{ fontSize: '13px', color: '#ef4444' }}>{error}</div>}
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !name.trim()}>
                {creating ? 'Criando...' : 'Criar campanha'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)' }}>Carregando...</div>
        ) : campaigns.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>Nenhuma campanha ainda</div>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Crie campanhas para organizar seus links e ver analytics agrupados.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {campaigns.map(c => (
              <div key={c.id} className="card" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))',
                    border: '1px solid var(--border-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/campaigns/${c.id}`} style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none' }}>
                      {c.name}
                    </Link>
                    {c.description && <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{c.description}</div>}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.linkCount}</span> links
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        <span style={{ fontWeight: 500, color: '#8b5cf6' }}>{c.totalClicks.toLocaleString('pt-BR')}</span> cliques
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <Link href={`/campaigns/${c.id}`} className="btn btn-ghost" style={{ fontSize: '12px', padding: '6px 14px', height: '32px' }}>
                      Ver detalhes
                    </Link>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-secondary)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
