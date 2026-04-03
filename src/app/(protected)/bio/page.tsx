'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTopbar } from '@/components/layout/Topbar'

interface BioItem {
  id: string
  label: string
  url: string
  icon: string | null
  active: boolean
  clicks: number
  order: number
}

interface BioPage {
  id: string
  slug: string
  title: string | null
  bio: string | null
  theme: string
  accentColor: string
  published: boolean
  clicksTotal: number
  items: BioItem[]
}

const THEMES = [
  { id: 'dark',   label: 'Dark',   preview: '#0f172a' },
  { id: 'light',  label: 'Light',  preview: '#f8fafc' },
  { id: 'purple', label: 'Purple', preview: '#2e1065' },
]

export default function BioEditorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = searchParams.get('slug')

  const [bio, setBio] = useState<BioPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [slugField, setSlugField] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bioText, setBioText] = useState('')
  const [theme, setTheme] = useState('dark')
  const [accentColor, setAccentColor] = useState('#8B5CF6')
  const [published, setPublished] = useState(true)

  const [newLabel, setNewLabel] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const EMOJI_OPTIONS = ['', '🔗', '🌐', '📱', '📸', '🎵', '🎬', '📝', '💼', '🛒', '🎮', '📧', '📍', '❤️', '⭐', '🚀', '💡', '🎯', '🔥', '📌']

  const loadBio = useCallback(async () => {
    const url = slug ? `/api/bio?slug=${slug}` : '/api/bio'
    try {
      const res = await fetch(url)
      const d = await res.json()
      if (d.bio) {
        setBio(d.bio)
        setSlugField(d.bio.slug || '')
        setDisplayName(d.bio.title || '')
        setBioText(d.bio.bio || '')
        setTheme(d.bio.theme || 'dark')
        setAccentColor(d.bio.accentColor || '#8B5CF6')
        setPublished(d.bio.published ?? true)
      } else if (slug) {
        setError('Bio não encontrada')
      }
    } catch {
      setError('Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { loadBio() }, [loadBio])

  const handleSavePage = async () => {
    if (!slugField.trim()) {
      setError('Slug é obrigatório')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(slug ? `/api/bio?slug=${slug}` : '/api/bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slugField.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          title: displayName.trim() || null,
          bio: bioText.trim() || null,
          theme,
          accentColor,
          published,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao salvar'); return }
      setBio(data.bio)
      setSlugField(data.bio.slug)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Erro de conexão ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleAddItem = async () => {
    if (!newLabel.trim() || !newUrl.trim()) return
    setAddingItem(true)
    setError('')
    try {
      const url = slug ? `/api/bio?slug=${slug}` : '/api/bio'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_item',
          item: {
            label: newLabel.trim(),
            url: newUrl.trim(),
            icon: newIcon.trim() || null,
            order: bio?.items.length || 0,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao adicionar link'); return }
      setBio(prev => prev ? { ...prev, items: [...prev.items, data.item] } : prev)
      setNewLabel(''); setNewUrl(''); setNewIcon('')
    } catch {
      setError('Erro de conexão ao adicionar link')
    } finally {
      setAddingItem(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    setDeletingId(itemId)
    try {
      const url = slug ? `/api/bio?slug=${slug}` : '/api/bio'
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_item', itemId }),
      })
      setBio(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== itemId) } : prev)
    } catch {} finally {
      setDeletingId(null)
    }
  }

  const handleToggleItem = async (itemId: string, current: boolean) => {
    try {
      const url = slug ? `/api/bio?slug=${slug}` : '/api/bio'
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_item', itemId, active: !current }),
      })
      setBio(prev => prev ? { ...prev, items: prev.items.map(i => i.id === itemId ? { ...i, active: !current } : i) } : prev)
    } catch {}
  }

  const bioUrl = bio ? `${typeof window !== 'undefined' ? window.location.origin : ''}/b/${bio.slug}` : null
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle(bio ? (bio.title || bio.slug) : 'Editor de Bio')
    topbar.setSubtitle('Personalize sua página de links')
    topbar.setActions(
      <div style={{ display: 'flex', gap: '8px' }}>
        <Link href="/bio-pages" className="btn btn-ghost" style={{ fontSize: '13px' }}>
          ← Meus Bios
        </Link>
        {bioUrl && bio && (
          <a href={bioUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: '13px' }}>
            Ver página →
          </a>
        )}
      </div>
    )
  }, [bioUrl, bio])

  const displayInitial = (displayName || bio?.slug || '?')[0]?.toUpperCase()
  const activeItems = bio?.items.filter(i => i.active) || []

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Carregando editor...</div>

  return (
    <div className="bio-page">
      <div className="bio-editor-container">
        
        {/* LEFT: EDITOR FORM */}
        <div className="bio-editor-main">
          
          {/* Settings Section */}
          <div className="dash-card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Configurações Globais</h3>
            
            <div className="camp-input-group">
              <div style={{ marginBottom: '16px' }}>
                <label className="dash-label" style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>URL da Bio (Slug)</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-primary)', overflow: 'hidden' }}>
                   <span style={{ paddingLeft: '12px', paddingRight: '12px', fontSize: '13px', color: 'var(--text-tertiary)', borderRight: '1px solid var(--border-primary)', paddingTop: '14px', paddingBottom: '14px' }}>123bit.app/b/</span>
                   <input 
                    className="camp-input" 
                    style={{ border: 'none', background: 'transparent', width: '100%' }}
                    value={slugField}
                    onChange={e => setSlugField(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                   />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="dash-label" style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Nome de Exibição / Título</label>
                <input className="camp-input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Seu Nome ou Marca" />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="dash-label" style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Bio / Descrição Curta</label>
                <textarea className="camp-textarea" value={bioText} onChange={e => setBioText(e.target.value)} rows={3} placeholder="Escreva algo sobre você..." />
                <div style={{ textAlign: 'right', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{bioText.length}/160</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="dash-label" style={{ display: 'block', marginBottom: '10px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tema Visual</label>
                <div className="bio-theme-grid">
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)} className={`bio-theme-btn ${theme === t.id ? 'active' : ''}`}>
                      <div className="bio-theme-dot" style={{ background: t.preview }} />
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                 <div>
                   <label className="dash-label" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Cor de Acento</label>
                   <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: '40px', height: '40px', padding: '2px', border: '1px solid var(--border-primary)', borderRadius: '10px', cursor: 'pointer', background: 'var(--bg-tertiary)' }} />
                      <input className="camp-input" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: '100px', fontSize: '13px' }} />
                   </div>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                    <label className="dash-label" style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Página Publicada</label>
                    <label className="links-switch">
                      <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} />
                      <span className="links-slider"></span>
                    </label>
                 </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', height: '52px' }} onClick={handleSavePage} disabled={saving}>
                {saving ? 'Guardando alterações...' : saved ? '✨ Salvo!' : 'Salvar Alterações'}
              </button>
            </div>
          </div>

          {/* Links Management Section */}
          {bio && (
            <div className="dash-card">
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Gerenciar Links</h3>
              
              {/* Add New Link */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '14px', marginBottom: '24px', border: '1px dashed var(--border-primary)' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px', color: 'var(--text-tertiary)' }}>Ícone</label>
                    <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                       {EMOJI_OPTIONS.map(em => (
                         <button key={em} onClick={() => setNewIcon(em)} style={{ width: '32px', height: '32px', background: newIcon === em ? accentColor : 'var(--bg-secondary)', color: newIcon === em ? '#fff' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', flexShrink: 0  }}>
                           {em || '∅'}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <input className="camp-input" style={{ flex: '1 1 200px' }} value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Texto do botão" />
                  <input className="camp-input" style={{ flex: '2 1 300px' }} value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="URL de destino" />
                  <button className="btn btn-ghost" style={{ flex: '1 1 100%' }} onClick={handleAddItem} disabled={addingItem || !newLabel || !newUrl}>
                    {addingItem ? 'Adicionando...' : '+ Adicionar Link'}
                  </button>
                </div>
              </div>

              {/* Current Links List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {bio.items.length === 0 && <div style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '20px', color: 'var(--text-tertiary)', fontSize: '13px' }}>Você ainda não adicionou nenhum link.</div>}
                {bio.items.map(it => (
                  <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-primary)', opacity: it.active ? 1 : 0.6 }}>
                    <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>{it.icon || '🔗'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.url}</div>
                    </div>
                    <div style={{ textAlign: 'right', paddingLeft: '8px', paddingRight: '8px' }}>
                       <div style={{ fontSize: '12px', fontWeight: 700 }}>{it.clicks}</div>
                       <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>cliques</div>
                    </div>
                    <label className="links-switch" style={{ width: '36px', height: '20px' }}>
                      <input type="checkbox" checked={it.active} onChange={() => handleToggleItem(it.id, it.active)} />
                      <span className="links-slider" style={{ borderRadius: '99px' }}></span>
                    </label>
                    <button onClick={() => handleDeleteItem(it.id)} style={{ padding: '8px', background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: PHONE PREVIEW */}
        <div className="bio-phone-wrapper">
          <div className={`bio-phone theme-${theme}`}>
            <div className="bio-phone-notch" />
            <div className="bio-phone-avatar" style={{ background: accentColor }}>{displayInitial}</div>
            <div className="bio-phone-title">{displayName || (slugField ? `@${slugField}` : 'Seu Nome')}</div>
            <div className="bio-phone-desc">{bioText || 'Escreva algo cativante aqui na sua bio...'}</div>
            
            <div className="bio-phone-links">
              {activeItems.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.3, fontSize: '12px' }}>Os links ativos aparecerão aqui</div>
              )}
              {activeItems.map(it => (
                <div key={it.id} className="bio-phone-link-btn" style={{ borderLeftWidth: '5px', borderLeftColor: accentColor }}>
                  {it.icon} {it.label}
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: 'auto', textAlign: 'center', paddingTop: '20px', paddingBottom: '20px', opacity: 0.5, fontSize: '10px', letterSpacing: '1px' }}>
              POWERED BY 123BIT
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
             <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Pré-visualização em tempo real</p>
          </div>
        </div>

      </div>
    </div>
  )
}
