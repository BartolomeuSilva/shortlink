'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTopbar } from '@/components/layout/Topbar'

interface Workspace {
  id: string
  name: string
  slug: string
  plan: string
  role: string
  memberCount: number
  createdAt: string
}

const ROLE_LABELS: Record<string, string> = { 
  OWNER: 'Proprietário', 
  ADMIN: 'Administrador', 
  EDITOR: 'Editor', 
  VIEWER: 'Visualizador' 
}

const ROLE_COLORS: Record<string, string> = { 
  OWNER: '#8b5cf6', 
  ADMIN: '#3b82f6', 
  EDITOR: '#22c55e', 
  VIEWER: 'var(--text-tertiary)' 
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle('Workspaces')
    topbar.setSubtitle('Gerencie espaços de colaboração para sua equipe')
    topbar.setActions(
      <button 
        className={`btn ${showForm ? 'btn-ghost' : 'btn-primary'}`} 
        onClick={() => setShowForm(v => !v)}
      >
        {showForm ? 'Cancelar' : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Novo Workspace
          </>
        )}
      </button>
    )
  }, [showForm])

  const load = async () => {
    try {
      const res = await fetch('/api/workspaces')
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      setWorkspaces(data.workspaces || [])
    } catch (e) {
      console.error('Erro ao carregar workspaces:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao criar workspace'); return }
      setWorkspaces(prev => [...prev, { ...data.workspace, role: 'OWNER', memberCount: 1 }])
      setShowForm(false); setName(''); setSlug('')
    } catch (e) {
      setError('Erro de conexão com o servidor')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Tem certeza que deseja excluir este workspace? Todos os links vinculados a ele serão perdidos.')) return
    
    setDeletingId(id)
    try {
      const res = await fetch(`/api/workspaces/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setWorkspaces(prev => prev.filter(w => w.id !== id))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="page-content">
      <div className="ws-container">
        {/* Form para novo workspace */}
        {showForm && (
          <div className="ws-form-card">
            <h3 className="ws-form-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="var(--primary)">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Criar Novo Espaço de Trabalho
            </h3>
            
            <div className="ws-form-grid">
              <div className="profile-input-group" style={{ marginBottom: 0 }}>
                <label className="profile-label">Nome do Workspace</label>
                <input
                  className="profile-input"
                  value={name}
                  onChange={e => {
                    setName(e.target.value)
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
                  }}
                  placeholder="Ex: Marketing Digital"
                />
              </div>
              <div className="profile-input-group" style={{ marginBottom: 0 }}>
                <label className="profile-label">Slug amigável (URL)</label>
                <input
                  className="profile-input"
                  style={{ fontFamily: 'var(--font-dm-mono)' }}
                  value={slug}
                  onChange={e => setSlug(e.target.value.replace(/[^a-z0-9-]/g, ''))}
                  placeholder="marketing-digital"
                />
              </div>
            </div>

            {error && <div className="settings-alert settings-alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-primary" 
                onClick={handleCreate} 
                disabled={creating || !name || !slug}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {creating ? 'Criando...' : 'Confirmar Criação'}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de Workspaces */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="profile-spinner" style={{ marginBottom: '12px' }}>
              <path d="M21 12a9 9 0 11-6.219-8.56"></path>
            </svg>
            <p>Carregando seus espaços...</p>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="ws-empty">
            <div className="ws-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <h3 className="ws-empty-title">Nenhum workspace encontrado</h3>
            <p className="ws-empty-desc">
              Comece criando um workspace para convidar sua equipe e organizar seus links e páginas de forma profissional.
            </p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + Criar primeiro workspace
            </button>
          </div>
        ) : (
          <div className="ws-list">
            {workspaces.map(ws => (
              <Link href={`/workspaces/${ws.id}`} key={ws.id} className="ws-card">
                <div className="ws-avatar">
                  {ws.name.substring(0, 2).toUpperCase()}
                </div>

                <div className="ws-info">
                  <div className="ws-name-row">
                    <span className="ws-name">{ws.name}</span>
                    <span 
                      className="ws-role-badge" 
                      style={{ 
                        background: `${ROLE_COLORS[ws.role]}15`, 
                        color: ROLE_COLORS[ws.role],
                        border: `1px solid ${ROLE_COLORS[ws.role]}30`
                      }}
                    >
                      {ROLE_LABELS[ws.role]}
                    </span>
                  </div>
                  <div className="ws-meta">
                    <div className="ws-meta-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"></path>
                      </svg>
                      <span className="font-mono">/{ws.slug}</span>
                    </div>
                    <div className="ws-meta-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 010 7.75"></path>
                      </svg>
                      <span>{ws.memberCount} {ws.memberCount === 1 ? 'membro' : 'membros'}</span>
                    </div>
                  </div>
                </div>

                <div className="ws-actions">
                  <div className="btn btn-ghost" style={{ fontSize: '13px' }}>Gerenciar</div>
                  {ws.role === 'OWNER' && (
                    <button
                      onClick={(e) => handleDelete(e, ws.id)}
                      disabled={deletingId === ws.id}
                      className="btn btn-ghost"
                      style={{ padding: '8px', color: 'var(--text-tertiary)', minWidth: '40px' }}
                    >
                      {deletingId === ws.id ? (
                        <svg className="profile-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"></path></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
