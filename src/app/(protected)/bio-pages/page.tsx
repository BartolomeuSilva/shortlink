'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTopbar } from '@/components/layout/Topbar'

interface BioSummary {
  id: string
  slug: string
  title: string | null
  published: boolean
  clicksTotal: number
  itemCount: number
  theme: string
  accentColor: string
  createdAt: string
}

export default function BioPagesList() {
  const [bios, setBios] = useState<BioSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle('Minhas Bios')
    topbar.setSubtitle('Gerencie suas páginas link-in-bio')
    topbar.setActions(
      <Link href="/bio-pages/new" className="btn btn-primary">
        <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Nova bio
      </Link>
    )
  }, [])

  useEffect(() => {
    fetch('/api/bio-pages')
      .then(r => r.json())
      .then(d => setBios(d.bios || []))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza? Todos os links e métricas serão excluídos permanentemente.')) return
    setDeletingId(id)
    try {
      await fetch(`/api/bio-pages/${id}`, { method: 'DELETE' })
      setBios(prev => prev.filter(b => b.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const bgColors: Record<string, string> = {
    dark: '#0f0f0f',
    light: '#f5f5f5',
    purple: '#1a0a2e',
  }

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-tertiary)' }}>Carregando...</div>

  return (
    <>
      <div className="page-content">
        {bios.length === 0 ? (
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))',
              border: '1px solid var(--border-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
            }}>
              🔗
            </div>
            <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Nenhuma bio criada
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '20px' }}>
              Crie sua primeira página link-in-bio para compartilhar todos os seus links.
            </div>
            <Link href="/bio-pages/new" className="btn btn-primary">
              Criar primeira bio
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {bios.map(bio => (
              <div key={bio.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                {/* Preview strip */}
                <div style={{
                  height: '6px',
                  background: `linear-gradient(90deg, ${bio.accentColor}, ${bio.accentColor}88)`,
                }} />
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {bio.title || bio.slug}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        123bit.app/b/{bio.slug}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '99px',
                      background: bio.published ? 'rgba(34,197,94,0.1)' : 'var(--bg-active)',
                      color: bio.published ? '#22c55e' : 'var(--text-tertiary)',
                    }}>
                      {bio.published ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', padding: '12px 0', borderTop: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{bio.clicksTotal}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>cliques</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{bio.itemCount}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>links</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link
                      href={`/bio?slug=${bio.slug}`}
                      style={{ flex: 1, textAlign: 'center', fontSize: '12px', fontWeight: 500, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-secondary)', background: 'transparent', color: 'var(--text-secondary)', textDecoration: 'none', cursor: 'pointer' }}
                    >
                      Editar
                    </Link>
                    <Link
                      href={`/bio-pages/${bio.id}/analytics`}
                      style={{ flex: 1, textAlign: 'center', fontSize: '12px', fontWeight: 500, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-secondary)', background: 'transparent', color: 'var(--text-secondary)', textDecoration: 'none', cursor: 'pointer' }}
                    >
                      Analytics
                    </Link>
                    {bio.published && (
                      <a
                        href={`/b/${bio.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ flex: 1, textAlign: 'center', fontSize: '12px', fontWeight: 500, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-secondary)', background: 'transparent', color: 'var(--text-secondary)', textDecoration: 'none', cursor: 'pointer' }}
                      >
                        Ver →
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(bio.id)}
                      disabled={deletingId === bio.id}
                      style={{
                        width: '36px', height: '36px', borderRadius: '8px', border: 'none',
                        background: 'transparent', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)',
                        opacity: deletingId === bio.id ? 0.5 : 1,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
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
