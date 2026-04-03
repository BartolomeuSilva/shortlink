'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspaceId')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null)
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle('Campanhas')
    topbar.setSubtitle('Agrupe links por campanha e analise o desempenho consolidado')
    topbar.setActions(
      <button className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setShowForm(v => !v)}>
        {showForm ? 'Cancelar' : '+ Nova campanha'}
      </button>
    )
  }, [showForm])

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/campaigns${workspaceId ? `?workspaceId=${workspaceId}` : ''}`)
    const data = await res.json()
    setCampaigns(data.campaigns || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [workspaceId])

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, workspaceId }),
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
    try {
      await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      setCampaigns(prev => prev.filter(c => c.id !== id))
    } finally {
      setDeletingId(null)
      setShowDeleteModal(false)
      setItemToDelete(null)
    }
  }

  return (
    <div className="camp-page">
      {/* NEW CAMPAIGN FORM */}
      {showForm && (
        <div className="camp-form-card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Criar Nova Campanha</h3>
          <div className="camp-input-group">
            <input
              className="camp-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome da campanha *"
              autoFocus
            />
            <textarea
              className="camp-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descrição curta (opcional)"
              rows={2}
            />
            {error && <div style={{ fontSize: '13px', color: '#ef4444' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleCreate}
                disabled={creating || !name.trim()}
              >
                {creating ? 'Criando...' : 'Confirmar Criação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAMPAIGN LIST */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Carregando campanhas...</div>
      ) : campaigns.length === 0 ? (
        <div className="dash-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>🚀 Nenhuma campanha ainda</div>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', maxWidth: '300px', margin: '0 auto 24px' }}>
            Crie campanhas para organizar seus links e ver analytics agrupados de forma automática.
          </p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Criar minha primeira campanha</button>
        </div>
      ) : (
        <div className="camp-grid">
          {campaigns.map(c => (
            <div key={c.id} className="camp-card">
              <div className="camp-card-header">
                <div className="camp-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div className="camp-card-info">
                  <Link href={`/campaigns/${c.id}`} className="camp-card-name">
                    {c.name}
                  </Link>
                  <div className="camp-card-desc">{c.description || 'Sem descrição definida'}</div>
                </div>
              </div>

              <div className="camp-card-stats">
                <div className="camp-stat-item">
                  <span className="camp-stat-value">{c.linkCount}</span>
                  <span className="camp-stat-label">Links</span>
                </div>
                <div className="camp-stat-item">
                  <span className="camp-stat-value" style={{ color: 'var(--primary)' }}>{c.totalClicks.toLocaleString('pt-BR')}</span>
                  <span className="camp-stat-label">Cliques Totais</span>
                </div>
              </div>

              <div className="camp-card-actions">
                <Link href={`/campaigns/${c.id}`} className="camp-action-btn camp-btn-view">
                  Ver Detalhes
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <button
                  className="camp-action-btn camp-btn-delete"
                  onClick={() => {
                    setItemToDelete({ id: c.id, name: c.name });
                    setShowDeleteModal(true);
                  }}
                  disabled={deletingId === c.id}
                  title="Excluir Campanha"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6M9 6V4h6v2" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="sidebar-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="dash-card" style={{ maxWidth: '420px', padding: '28px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'rgba(239,68,68,0.1)', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
              </svg>
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Excluir campanha?</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', lineHeight: '1.6', marginBottom: '28px' }}>
              Tem certeza que deseja excluir <strong>"{itemToDelete?.name}"</strong>? Isso removerá o agrupamento, mas seus links continuarão ativos.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, background: '#ef4444', border: 'none' }}
                onClick={() => itemToDelete && handleDelete(itemToDelete.id)}
                disabled={!!deletingId}
              >
                {deletingId ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
