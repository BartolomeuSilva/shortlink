'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTopbar } from '@/components/layout/Topbar'

const THEMES = [
  { id: 'dark',   label: 'Escuro',   preview: '#0f0f0f' },
  { id: 'light',  label: 'Claro',    preview: '#f5f5f5' },
  { id: 'purple', label: 'Roxo',     preview: '#1a0a2e' },
]

export default function NewBioPage() {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [theme, setTheme] = useState('dark')
  const [accentColor, setAccentColor] = useState('#8B5CF6')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle('Nova Bio')
    topbar.setSubtitle('Crie uma nova página link-in-bio')
    topbar.setActions(
      <Link href="/bio-pages" className="btn btn-ghost" style={{ fontSize: '13px' }}>
        ← Voltar
      </Link>
    )
  }, [])

  const handleCreate = async () => {
    if (!slug.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/bio-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          title: title.trim() || null,
          theme,
          accentColor,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao criar'); return }
      router.push(`/bio?slug=${data.bio.slug}`)
    } catch {
      setError('Erro de conexão')
    } finally {
      setCreating(false)
    }
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
      <div className="page-content" style={{ maxWidth: '480px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '20px' }}>
            Configurações da bio
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={lbl}>Slug (URL) <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-secondary)', borderRadius: '8px', overflow: 'hidden' }}>
                <span style={{ padding: '0 10px', height: '40px', display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', fontSize: '13px', color: 'var(--text-tertiary)', borderRight: '1px solid var(--border-secondary)', whiteSpace: 'nowrap' }}>
                  123bit.app/b/
                </span>
                <input
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="pessoal"
                  style={{ ...inp, border: 'none', borderRadius: 0, flex: 1 }}
                />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Apenas letras minúsculas, números e hífen
              </div>
            </div>

            <div>
              <label style={lbl}>Título</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Seu nome ou marca" style={inp} />
            </div>

            <div>
              <label style={lbl}>Tema</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => setTheme(t.id)} style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: `2px solid ${theme === t.id ? accentColor : 'var(--border-secondary)'}`,
                    background: t.preview, cursor: 'pointer', fontSize: '11px', fontWeight: 500,
                    color: t.id === 'light' ? '#1a1a1a' : '#ffffff',
                    transition: 'border-color 150ms',
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl}>Cor de destaque</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: '40px', height: '40px', padding: '2px', border: '1px solid var(--border-secondary)', borderRadius: '8px', cursor: 'pointer' }} />
                <input value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ ...inp, flex: 1 }} />
              </div>
            </div>

            {error && <div style={{ fontSize: '13px', color: '#ef4444' }}>{error}</div>}

            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={creating || !slug}
            >
              {creating ? 'Criando...' : 'Criar bio'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
