'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
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
    <div className="page-content" style={{ alignItems: 'stretch' }}>
      <div className="bio-editor-container">
        
        {/* LEFT: EDITOR FORM */}
        <div className="bio-editor-main">

          {/* ── Configurações Globais ── */}
          <div className="settings-info-list" style={{ marginBottom: 0 }}>

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Configurações Globais</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>URL, aparência e publicação</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Publicado</span>
                <label className="links-switch">
                  <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} />
                  <span className="links-slider" />
                </label>
              </div>
            </div>

            {/* Slug */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-primary)' }}>
              <label className="settings-list-label">Endereço público</label>
              <div style={{
                display: 'flex', alignItems: 'center', height: '42px',
                border: '1px solid var(--border-primary)', borderRadius: '10px',
                overflow: 'hidden', background: 'var(--bg-tertiary)',
              }}>
                <span style={{
                  padding: '0 12px', height: '100%', display: 'flex', alignItems: 'center',
                  fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-dm-mono)',
                  borderRight: '1px solid var(--border-primary)', whiteSpace: 'nowrap',
                  background: 'var(--bg-secondary)', flexShrink: 0,
                }}>
                  123bit.app/b/
                </span>
                <input
                  value={slugField}
                  onChange={e => setSlugField(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  style={{
                    flex: 1, height: '100%', border: 'none', outline: 'none', background: 'transparent',
                    fontFamily: 'var(--font-dm-mono)', fontSize: '13px', color: 'var(--text-primary)', padding: '0 12px',
                  }}
                />
              </div>
            </div>

            {/* Display Name */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-primary)' }}>
              <label className="settings-list-label">Nome / Título</label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Seu nome ou marca"
                style={{
                  width: '100%', height: '42px', padding: '0 14px', borderRadius: '10px',
                  border: '1px solid var(--border-primary)', background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Bio */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                <label className="settings-list-label" style={{ marginBottom: 0 }}>Descrição</label>
                <span style={{ fontSize: '11px', color: bioText.length > 160 ? '#ef4444' : 'var(--text-tertiary)' }}>
                  {bioText.length}/160
                </span>
              </div>
              <textarea
                value={bioText}
                onChange={e => setBioText(e.target.value)}
                rows={3}
                placeholder="Escreva algo sobre você..."
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px', resize: 'none',
                  border: '1px solid var(--border-primary)', background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.6,
                  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Theme + Color — two columns */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-primary)', display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'start' }}>
              <div>
                <label className="settings-list-label">Tema</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      style={{
                        flex: 1, height: '38px', borderRadius: '10px', cursor: 'pointer',
                        background: t.preview, fontSize: '12px', fontWeight: 600,
                        color: t.id === 'light' ? '#111' : '#fff',
                        border: `2px solid ${theme === t.id ? accentColor : 'transparent'}`,
                        outline: theme === t.id ? `3px solid color-mix(in srgb, ${accentColor} 25%, transparent)` : 'none',
                        transition: 'all 150ms',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="settings-list-label">Cor</label>
                <div style={{ position: 'relative', width: '38px', height: '38px' }}>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                  />
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: accentColor, border: '2px solid var(--border-secondary)',
                    boxShadow: `0 0 0 3px color-mix(in srgb, ${accentColor} 22%, transparent)`,
                    pointerEvents: 'none',
                  }} />
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ margin: '0 24px 14px', fontSize: '13px', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            {/* Footer / Save */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-primary)' }}>
              <button
                className="btn btn-primary"
                onClick={handleSavePage}
                disabled={saving}
                style={{ width: '100%', height: '44px', fontSize: '14px' }}
              >
                {saving ? 'Salvando...' : saved ? '✓ Alterações salvas!' : 'Salvar Alterações'}
              </button>
            </div>
          </div>

          {/* ── Gerenciar Links ── */}
          {bio && (
            <div className="settings-info-list" style={{ marginBottom: 0, marginTop: '16px' }}>

              {/* Header */}
              <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Gerenciar Links</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    {bio.items.length === 0 ? 'Nenhum link ainda' : `${bio.items.length} link${bio.items.length !== 1 ? 's' : ''}`}
                  </div>
                </div>
              </div>

              {/* Add form */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="settings-list-label" style={{ marginBottom: 0 }}>Adicionar novo link</label>

                {/* Emoji strip */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
                  {EMOJI_OPTIONS.map(em => (
                    <button
                      key={em}
                      onClick={() => setNewIcon(em)}
                      title={em || 'Sem ícone'}
                      style={{
                        width: '36px', height: '36px', flexShrink: 0,
                        background: newIcon === em ? accentColor : 'var(--bg-tertiary)',
                        border: `1px solid ${newIcon === em ? accentColor : 'var(--border-primary)'}`,
                        borderRadius: '8px', cursor: 'pointer', fontSize: '17px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {em || <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={newIcon === em ? '#fff' : 'var(--text-tertiary)'} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    placeholder="Texto do botão"
                    style={{
                      flex: 1, height: '40px', padding: '0 12px', borderRadius: '10px',
                      border: '1px solid var(--border-primary)', background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    placeholder="https://..."
                    onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                    style={{
                      flex: 1, height: '40px', padding: '0 12px', borderRadius: '10px',
                      border: '1px solid var(--border-primary)', background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                      fontFamily: 'var(--font-dm-mono)',
                    }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleAddItem}
                    disabled={addingItem || !newLabel.trim() || !newUrl.trim()}
                    style={{ height: '40px', padding: '0 18px', fontSize: '13px', flexShrink: 0 }}
                  >
                    {addingItem ? '...' : '+ Adicionar'}
                  </button>
                </div>
              </div>

              {/* Link list */}
              {bio.items.length === 0 ? (
                <div style={{ padding: '32px 24px', borderTop: '1px solid var(--border-primary)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                  Adicione seu primeiro link acima
                </div>
              ) : (
                <div style={{ padding: '8px 16px 12px', borderTop: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {bio.items.map(it => (
                    <div key={it.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '10px',
                      background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
                      opacity: it.active ? 1 : 0.5, transition: 'opacity 150ms',
                    }}>
                      <div style={{
                        width: '30px', height: '30px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '17px', background: 'var(--bg-secondary)', borderRadius: '7px',
                      }}>
                        {it.icon || '🔗'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-dm-mono)' }}>{it.url}</div>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                        {it.clicks} <span style={{ fontSize: '9px', textTransform: 'uppercase' }}>cliques</span>
                      </span>
                      <label className="links-switch">
                        <input type="checkbox" checked={it.active} onChange={() => handleToggleItem(it.id, it.active)} />
                        <span className="links-slider" />
                      </label>
                      <button
                        onClick={() => handleDeleteItem(it.id)}
                        disabled={deletingId === it.id}
                        style={{ padding: '5px', background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', flexShrink: 0 }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
