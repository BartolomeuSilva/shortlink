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

const ROLE_LABELS: Record<string, string> = { OWNER: 'Owner', ADMIN: 'Admin', EDITOR: 'Editor', VIEWER: 'Viewer' }
const ROLE_COLORS: Record<string, string> = { OWNER: '#8b5cf6', ADMIN: '#3b82f6', EDITOR: '#22c55e', VIEWER: 'var(--text-tertiary)' }

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
    topbar.setSubtitle('Colabore em equipe com acesso compartilhado a links e analytics')
    topbar.setActions(
      <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
        {showForm ? 'Cancelar' : '+ Novo workspace'}
      </button>
    )
  }, [showForm])

  const load = async () => {
    const res = await fetch('/api/workspaces')
    const data = await res.json()
    setWorkspaces(data.workspaces || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro'); return }
      setWorkspaces(prev => [...prev, { ...data.workspace, role: 'OWNER', memberCount: 1 }])
      setShowForm(false); setName(''); setSlug('')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await fetch(`/api/workspaces/${id}`, { method: 'DELETE' })
    setWorkspaces(prev => prev.filter(w => w.id !== id))
    setDeletingId(null)
  }

  return (
    <>
      <div className="page-content" style={{ maxWidth: '720px' }}>
        {showForm && (
          <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '14px' }}>Novo workspace</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Nome *</label>
                <input
                  value={name}
                  onChange={e => {
                    setName(e.target.value)
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
                  }}
                  placeholder="Minha empresa"
                  style={{ width: '100%', height: '40px', fontFamily: 'inherit', fontSize: '13px', color: 'var(--text-primary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: '8px', padding: '0 12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Slug (URL única) *</label>
                <input
                  value={slug}
                  onChange={e => setSlug(e.target.value.replace(/[^a-z0-9-]/g, ''))}
                  placeholder="minha-empresa"
                  style={{ width: '100%', height: '40px', fontFamily: 'var(--font-dm-mono, monospace)', fontSize: '13px', color: 'var(--text-primary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: '8px', padding: '0 12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              {error && <div style={{ fontSize: '13px', color: '#ef4444' }}>{error}</div>}
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !name || !slug}>
                {creating ? 'Criando...' : 'Criar workspace'}
              </button>
            </div>
          </div>
        )}

        {workspaces.length === 0 && !loading ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))',
              border: '1px solid var(--border-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>Nenhum workspace ainda</div>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', maxWidth: '300px', margin: '0 auto' }}>
              Crie um workspace para colaborar com sua equipe e gerenciar links juntos.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {workspaces.map(ws => (
              <div key={ws.id} className="card" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 700, color: 'white',
                  }}>
                    {ws.name[0].toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{ws.name}</span>
                      <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '99px', background: `${ROLE_COLORS[ws.role]}18`, color: ROLE_COLORS[ws.role], border: `0.5px solid ${ROLE_COLORS[ws.role]}40` }}>
                        {ROLE_LABELS[ws.role]}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-dm-mono, monospace)' }}>/{ws.slug}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{ws.memberCount} membros</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <Link href={`/workspaces/${ws.id}`} className="btn btn-ghost" style={{ fontSize: '12px', padding: '6px 14px', height: '32px' }}>
                      Gerenciar
                    </Link>
                    {ws.role === 'OWNER' && (
                      <button
                        onClick={() => handleDelete(ws.id)}
                        disabled={deletingId === ws.id}
                        style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-secondary)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6M9 6V4h6v2" />
                        </svg>
                      </button>
                    )}
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
