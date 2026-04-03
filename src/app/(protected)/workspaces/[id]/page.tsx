'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTopbar } from '@/components/layout/Topbar'

interface Member {
  id: string
  role: string
  joinedAt: string
  user: { id: string; name: string | null; email: string; image: string | null }
}

interface Workspace {
  id: string
  name: string
  slug: string
  plan: string
  members: Member[]
}

const ROLES = ['ADMIN', 'EDITOR', 'VIEWER']
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

export default function WorkspaceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [ws, setWs] = useState<Workspace | null>(null)
  const [currentRole, setCurrentRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('EDITOR')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const topbar = useTopbar()

  const load = async () => {
    try {
      const res = await fetch(`/api/workspaces/${id}`)
      const data = await res.json()
      setWs(data.workspace)
      setCurrentRole(data.currentRole)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  useEffect(() => {
    if (ws) {
      topbar.setTitle(ws.name)
      topbar.setSubtitle(`shortlink.com.br/${ws.slug}`)
      topbar.setActions(
        <Link href="/workspaces" className="btn btn-ghost" style={{ gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Voltar
        </Link>
      )
    }
  }, [ws])

  const handleInvite = async () => {
    if (!inviteEmail) return
    setInviting(true)
    setInviteError('')
    setInviteSuccess('')
    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) { 
        setInviteError(data.error || 'Erro ao convidar membro'); 
        return 
      }
      setWs(prev => prev ? { ...prev, members: [...prev.members, data.member] } : prev)
      setInviteSuccess(`${inviteEmail} foi convidado!`)
      setInviteEmail('')
      setTimeout(() => setInviteSuccess(''), 5000)
    } finally {
      setInviting(false)
    }
  }

  const handleRemove = async (userId: string) => {
    if (!confirm('Tem certeza que deseja remover este membro?')) return
    setRemovingId(userId)
    try {
      await fetch(`/api/workspaces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove_member', userId }),
      })
      setWs(prev => prev ? { ...prev, members: prev.members.filter(m => m.user.id !== userId) } : prev)
    } finally {
      setRemovingId(null)
    }
  }

  const canManage = ['OWNER', 'ADMIN'].includes(currentRole)

  if (loading) return (
    <div className="page-content">
      <div className="profile-spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border-secondary)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
    </div>
  )
  
  if (!ws) return (
    <div className="page-content">
      <div className="card" style={{ padding: '40px', textAlign: 'center', borderColor: '#ef4444' }}>
        <h3 style={{ color: '#ef4444' }}>Workspace não encontrado</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>O workspace solicitado não existe ou você não tem permissão para acessá-lo.</p>
        <Link href="/workspaces" className="btn btn-primary" style={{ marginTop: '20px' }}>Voltar para Workspaces</Link>
      </div>
    </div>
  )

  return (
    <div className="page-content">
      <div className="ws-container" style={{ maxWidth: '720px' }}>
        
        {/* Invite Section */}
        {canManage && (
          <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
              Convidar Membros
            </h3>
            <div className="invite-form">
              <div className="invite-input-wrap">
                <input
                  type="email"
                  className="input-field"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <select
                className="invite-select"
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              <button 
                className="btn btn-primary" 
                onClick={handleInvite} 
                disabled={inviting || !inviteEmail}
                style={{ height: '48px', padding: '0 24px' }}
              >
                {inviting ? 'Enviando...' : 'Convidar'}
              </button>
            </div>
            
            {inviteError && (
              <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {inviteError}
              </div>
            )}
            {inviteSuccess && (
              <div style={{ color: '#22c55e', fontSize: '13px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                {inviteSuccess}
              </div>
            )}
          </div>
        )}

        {/* Member List */}
        <div className="member-list-header">
          Equipe do Workspace ({ws.members.length})
        </div>

        <div className="member-list">
          {ws.members.map(m => (
            <div key={m.id} className="member-item">
              <div className="member-avatar">
                {m.user.image ? (
                  <img src={m.user.image} alt={m.user.name || ''} />
                ) : (
                  (m.user.name || m.user.email)[0].toUpperCase()
                )}
              </div>

              <div className="member-info">
                <div className="member-name">{m.user.name || 'Convidado'}</div>
                <div className="member-email">{m.user.email}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="ws-role-badge" style={{ 
                  background: `${ROLE_COLORS[m.role]}15`, 
                  color: ROLE_COLORS[m.role],
                  borderColor: `${ROLE_COLORS[m.role]}30`
                }}>
                  {ROLE_LABELS[m.role]}
                </span>

                {canManage && m.role !== 'OWNER' && (
                  <button
                    className="health-btn-refresh"
                    onClick={() => handleRemove(m.user.id)}
                    disabled={removingId === m.user.id}
                    title="Remover membro"
                    style={{ color: '#ef4444', borderColor: '#ef444420' }}
                  >
                    {removingId === m.user.id ? (
                      <div className="profile-spinner" style={{ width: '14px', height: '14px', border: '2px solid #ef444430', borderTopColor: '#ef4444' }} />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Roles Guide */}
        <div className="roles-legend">
          <span className="roles-legend-title">Guia de Permissões</span>
          <div className="roles-legend-item">
            <strong>Proprietário:</strong> Controle total e faturamento do workspace.
          </div>
          <div className="roles-legend-item">
            <strong>Administrador:</strong> Pode gerenciar membros e editar todos os links.
          </div>
          <div className="roles-legend-item">
            <strong>Editor:</strong> Pode criar, editar e excluir seus próprios links.
          </div>
          <div className="roles-legend-item">
            <strong>Visualizador:</strong> Pode apenas ver a lista e o analytics dos links.
          </div>
        </div>

      </div>
    </div>
  )
}
