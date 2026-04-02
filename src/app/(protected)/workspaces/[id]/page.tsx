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
const ROLE_LABELS: Record<string, string> = { OWNER: 'Owner', ADMIN: 'Admin', EDITOR: 'Editor', VIEWER: 'Viewer' }
const ROLE_COLORS: Record<string, string> = { OWNER: '#8b5cf6', ADMIN: '#3b82f6', EDITOR: '#22c55e', VIEWER: 'var(--text-tertiary)' }

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

  useEffect(() => {
    if (ws) {
      topbar.setTitle(ws.name)
      topbar.setSubtitle(`/${ws.slug}`)
      topbar.setActions(
        <Link href="/workspaces" className="btn btn-ghost" style={{ fontSize: '13px' }}>
          ← Workspaces
        </Link>
      )
    }
  }, [ws])

  const load = async () => {
    const res = await fetch(`/api/workspaces/${id}`)
    const data = await res.json()
    setWs(data.workspace)
    setCurrentRole(data.currentRole)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

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
      if (!res.ok) { setInviteError(data.error || 'Erro'); return }
      setWs(prev => prev ? { ...prev, members: [...prev.members, data.member] } : prev)
      setInviteSuccess(`${inviteEmail} adicionado com sucesso!`)
      setInviteEmail('')
      setTimeout(() => setInviteSuccess(''), 4000)
    } finally {
      setInviting(false)
    }
  }

  const handleRemove = async (userId: string) => {
    setRemovingId(userId)
    await fetch(`/api/workspaces/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_member', userId }),
    })
    setWs(prev => prev ? { ...prev, members: prev.members.filter(m => m.user.id !== userId) } : prev)
    setRemovingId(null)
  }

  const canManage = ['OWNER', 'ADMIN'].includes(currentRole)

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-tertiary)' }}>Carregando...</div>
  if (!ws) return <div style={{ padding: '40px', color: '#ef4444' }}>Workspace não encontrado.</div>

  return (
    <>
      <div className="page-content" style={{ maxWidth: '680px' }}>
        {/* Invite form */}
        {canManage && (
          <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '14px' }}>Convidar membro</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="email@exemplo.com"
                style={{ flex: 1, height: '40px', fontFamily: 'inherit', fontSize: '13px', color: 'var(--text-primary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: '8px', padding: '0 12px', outline: 'none', boxSizing: 'border-box' }}
              />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                style={{ height: '40px', fontSize: '13px', color: 'var(--text-primary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: '8px', padding: '0 10px', outline: 'none' }}
              >
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <button className="btn btn-primary" onClick={handleInvite} disabled={inviting || !inviteEmail} style={{ whiteSpace: 'nowrap' }}>
                {inviting ? 'Convidando...' : 'Convidar'}
              </button>
            </div>
            {inviteError && <div style={{ fontSize: '13px', color: '#ef4444', marginTop: '8px' }}>{inviteError}</div>}
            {inviteSuccess && <div style={{ fontSize: '13px', color: '#22c55e', marginTop: '8px' }}>{inviteSuccess}</div>}
          </div>
        )}

        {/* Members list */}
        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
          Membros ({ws.members.length})
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ws.members.map(m => (
            <div key={m.id} className="card" style={{ padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  background: m.user.image ? 'transparent' : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                  border: '2px solid var(--border-primary)', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 600, color: 'white',
                }}>
                  {m.user.image
                    ? <img src={m.user.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (m.user.name || m.user.email)[0].toUpperCase()
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {m.user.name || m.user.email}
                  </div>
                  {m.user.name && <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '1px' }}>{m.user.email}</div>}
                </div>

                <span style={{
                  fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '99px',
                  background: `${ROLE_COLORS[m.role]}14`, color: ROLE_COLORS[m.role],
                  border: `0.5px solid ${ROLE_COLORS[m.role]}30`,
                }}>
                  {ROLE_LABELS[m.role]}
                </span>

                {canManage && m.role !== 'OWNER' && (
                  <button
                    onClick={() => handleRemove(m.user.id)}
                    disabled={removingId === m.user.id}
                    style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid var(--border-secondary)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', flexShrink: 0 }}
                    title="Remover membro"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '20px', fontWeight: 300 }}>
          <strong>Owner:</strong> controle total · <strong>Admin:</strong> gerencia membros · <strong>Editor:</strong> cria e edita links · <strong>Viewer:</strong> visualização apenas
        </p>
      </div>
    </>
  )
}
