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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string, slug: string } | null>(null)
  
  const router = useRouter()
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle('Minhas Bios')
    topbar.setSubtitle('Gerencie todas as suas páginas link-in-bio')
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
    setDeletingId(id)
    try {
      await fetch(`/api/bio-pages/${id}`, { method: 'DELETE' })
      setBios(prev => prev.filter(b => b.id !== id))
    } finally {
      setDeletingId(null)
      setShowDeleteModal(false)
      setItemToDelete(null)
    }
  }

  return (
    <div className="bio-page">
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Carregando suas bios...</div>
      ) : bios.length === 0 ? (
        <div className="dash-card" style={{ padding: '64px 24px', textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 20px',
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, transparent), rgba(59,130,246,0.1))',
            border: '1px solid var(--border-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
          }}>
            🔗
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Nenhuma bio criada</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '24px', lineHeight: '1.6' }}>
            Consolidar todos os seus links em uma única página elegante nunca foi tão fácil. Crie sua primeira bio agora!
          </p>
          <Link href="/bio-pages/new" className="btn btn-primary">
            Começar minha primeira bio
          </Link>
        </div>
      ) : (
        <div className="bio-grid">
          {bios.map(bio => (
            <div key={bio.id} className="bio-list-card">
              {/* Header strip with theme color */}
              <div 
                className="bio-list-card-strip" 
                style={{ 
                  background: bio.theme === 'purple' ? 'linear-gradient(90deg, #2e1065, #6d28d9)' : 
                              bio.theme === 'light' ? '#f8fafc' : '#0f172a'
                }}
              >
                <div 
                  className="bio-list-card-avatar"
                  style={{ color: bio.accentColor }}
                >
                  {(bio.title || bio.slug)[0].toUpperCase()}
                </div>
                
                {/* Status Badge */}
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <span className={`links-status-badge ${bio.published ? 'status-active' : 'status-off'}`}>
                    <span className="status-dot"></span>
                    {bio.published ? 'Ativo' : 'Rascunho'}
                  </span>
                </div>
              </div>

              <div className="bio-list-card-content">
                <Link href={`/bio?slug=${bio.slug}`} className="bio-list-card-title" style={{ textDecoration: 'none', display: 'block' }}>
                  {bio.title || bio.slug}
                </Link>
                <div className="bio-list-card-link">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                  123bit.app/b/{bio.slug}
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '20px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-primary)' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{bio.clicksTotal}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cliques</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{bio.itemCount}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Links</div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', mt: '16px', paddingTop: '16px' }}>
                  <Link href={`/bio?slug=${bio.slug}`} className="btn btn-ghost" style={{ flex: 1, fontSize: '12px', height: '36px' }}>
                    Editar
                  </Link>
                  <Link href={`/bio-pages/${bio.id}/analytics`} className="btn btn-ghost" style={{ flex: 1, fontSize: '12px', height: '36px' }}>
                    Analytics
                  </Link>
                  <button
                    onClick={() => {
                      setItemToDelete({ id: bio.id, slug: bio.slug });
                      setShowDeleteModal(true);
                    }}
                    disabled={deletingId === bio.id}
                    className="btn btn-ghost"
                    style={{ width: '36px', height: '36px', padding: 0, color: 'var(--text-tertiary)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6V4h6v2" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="sidebar-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="dash-card" style={{ maxWidth: '400px', padding: '28px', textAlign: 'center' }}>
             <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'rgba(239,68,68,0.1)', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
              </svg>
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Excluir página Bio?</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', lineHeight: '1.6', marginBottom: '28px' }}>
              Tem certeza que deseja apagar a bio <strong>"{itemToDelete?.slug}"</strong>? Esta ação é irreversível e todos os dados serão perdidos.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }}
              >
                Manter Bio
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, background: '#ef4444', border: 'none' }}
                onClick={() => itemToDelete && handleDelete(itemToDelete.id)}
                disabled={!!deletingId}
              >
                {deletingId ? 'Apagando...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
