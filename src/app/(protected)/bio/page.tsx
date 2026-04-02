'use client'

import { useEffect, useState, useCallback } from 'react'
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
  username: string
  title: string | null
  bio: string | null
  theme: string
  accentColor: string
  published: boolean
  items: BioItem[]
}

const THEMES = [
  { id: 'dark',   label: 'Escuro',   preview: '#0f0f0f' },
  { id: 'light',  label: 'Claro',    preview: '#f5f5f5' },
  { id: 'purple', label: 'Roxo',     preview: '#1a0a2e' },
]

export default function BioEditorPage() {
  const [bio, setBio] = useState<BioPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Form state — initialized with defaults, not overwritten by bio load
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bioText, setBioText] = useState('')
  const [theme, setTheme] = useState('dark')
  const [accentColor, setAccentColor] = useState('#8B5CF6')
  const [published, setPublished] = useState(true)

  // New item form
  const [newLabel, setNewLabel] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const EMOJI_OPTIONS = ['', '🔗', '🌐', '📱', '📸', '🎵', '🎬', '📝', '💼', '🛒', '🎮', '📧', '📍', '❤️', '⭐', '🚀', '💡', '🎯', '🔥', '📌']

  useEffect(() => {
    fetch('/api/bio')
      .then(r => r.json())
      .then(d => {
        if (d.bio) {
          setBio(d.bio)
          setUsername(d.bio.username || '')
          setDisplayName(d.bio.title || '')
          setBioText(d.bio.bio || '')
          setTheme(d.bio.theme || 'dark')
          setAccentColor(d.bio.accentColor || '#8B5CF6')
          setPublished(d.bio.published ?? true)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSavePage = async () => {
    if (!username.trim()) {
      setError('Username é obrigatório')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
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
      setUsername(data.bio.username)
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
      const res = await fetch('/api/bio', {
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
      setNewLabel('')
      setNewUrl('')
      setNewIcon('')
    } catch {
      setError('Erro de conexão ao adicionar link')
    } finally {
      setAddingItem(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    setDeletingId(itemId)
    try {
      await fetch('/api/bio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_item', itemId }),
      })
      setBio(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== itemId) } : prev)
    } catch {
      // silently fail
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleItem = async (itemId: string, current: boolean) => {
    try {
      await fetch('/api/bio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_item', itemId, active: !current }),
      })
      setBio(prev => prev ? { ...prev, items: prev.items.map(i => i.id === itemId ? { ...i, active: !current } : i) } : prev)
    } catch {
      // silently fail
    }
  }

  const bioUrl = username ? `${typeof window !== 'undefined' ? window.location.origin : ''}/u/${username}` : null
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle('Link-in-Bio')
    topbar.setSubtitle('Crie sua página pública com todos os seus links')
    topbar.setActions(
      bioUrl && bio ? (
        <a href={bioUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize: '13px' }}>
          Ver página →
        </a>
      ) : null
    )
  }, [bioUrl, bio])

  const inp: React.CSSProperties = {
    width: '100%', height: '40px', fontFamily: 'inherit', fontSize: '13px',
    color: 'var(--text-primary)', background: 'var(--bg-secondary)',
    border: '1px solid var(--border-secondary)', borderRadius: '8px',
    padding: '0 12px', outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }

  const displayInitial = (displayName || username || '?')[0]?.toUpperCase()
  const activeItems = bio?.items.filter(i => i.active) || []

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-tertiary)' }}>Carregando...</div>

  return (
    <>
      <div className="page-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '900px' }}>
        {/* Left: Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Page settings */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '16px' }}>Configurações da página</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={lbl}>Username <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-secondary)', borderRadius: '8px', overflow: 'hidden' }}>
                  <span style={{ padding: '0 10px', height: '40px', display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', fontSize: '13px', color: 'var(--text-tertiary)', borderRight: '1px solid var(--border-secondary)', whiteSpace: 'nowrap' }}>
                    123bit.app/u/
                  </span>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase())}
                    placeholder="seunome"
                    style={{ ...inp, border: 'none', borderRadius: 0, flex: 1 }}
                  />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Este será o endereço da sua página: <strong style={{ color: 'var(--text-secondary)' }}>123bit.app/u/{username || '...'}</strong>
                </div>
              </div>
              <div>
                <label style={lbl}>Nome de exibição</label>
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder={username ? `@${username}` : 'Seu nome ou marca'}
                  style={inp}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Nome que aparece no topo da sua bio. Se vazio, usa o username.
                </div>
              </div>
              <div>
                <label style={lbl}>Bio (máx. 200 caracteres)</label>
                <textarea
                  value={bioText} onChange={e => setBioText(e.target.value.slice(0, 200))} rows={3}
                  placeholder="Uma breve descrição sobre você..."
                  style={{ ...inp, height: 'auto', padding: '8px 12px', resize: 'none', lineHeight: '1.5' }}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'right', marginTop: '2px' }}>{bioText.length}/200</div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Cor de destaque</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: '40px', height: '40px', padding: '2px', border: '1px solid var(--border-secondary)', borderRadius: '8px', cursor: 'pointer' }} />
                    <input value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ ...inp, flex: 1 }} />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Publicado</label>
                  <button onClick={() => setPublished(v => !v)} style={{
                    width: '48px', height: '28px', borderRadius: '14px', border: 'none',
                    background: published ? accentColor : 'var(--border-secondary)',
                    cursor: 'pointer', position: 'relative', transition: 'background 200ms',
                  }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%', background: 'white',
                      position: 'absolute', top: '3px', transition: 'left 200ms',
                      left: published ? '23px' : '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>
              </div>
              {error && <div style={{ fontSize: '13px', color: '#ef4444' }}>{error}</div>}
              {saved && !error && <div style={{ fontSize: '13px', color: '#22c55e' }}>Salvo com sucesso!</div>}
              <button className="btn btn-primary" onClick={handleSavePage} disabled={saving || !username}>
                {saved ? 'Salvo!' : saving ? 'Salvando...' : bio ? 'Atualizar página' : 'Criar página'}
              </button>
            </div>
          </div>

          {/* Add item */}
          {bio && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '14px' }}>Adicionar link</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={lbl}>Ícone</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {EMOJI_OPTIONS.map(emoji => (
                      <button
                        key={emoji || 'none'}
                        onClick={() => setNewIcon(emoji)}
                        style={{
                          width: '36px', height: '36px', borderRadius: '8px', border: 'none',
                          background: newIcon === emoji ? 'var(--bg-active)' : 'var(--bg-primary)',
                          cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          outline: newIcon === emoji ? `2px solid ${accentColor}` : 'none',
                          transition: 'all 150ms',
                        }}
                        title={emoji || 'Sem ícone'}
                      >
                        {emoji || '✕'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Texto do botão *</label>
                  <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Ex: Meu portfólio" style={inp} />
                </div>
                <div>
                  <label style={lbl}>URL *</label>
                  <input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." style={inp} />
                </div>
                <button className="btn btn-ghost" onClick={handleAddItem} disabled={addingItem || !newLabel || !newUrl} style={{ width: '100%' }}>
                  {addingItem ? 'Adicionando...' : '+ Adicionar'}
                </button>
              </div>
            </div>
          )}

          {/* CTA to create bio first */}
          {!bio && (
            <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔗</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>Crie sua página bio</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Preencha o username acima e clique em "Criar página" para começar.</div>
            </div>
          )}
        </div>

        {/* Right: Preview + items list */}
        <div>
          {/* Phone preview */}
          <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: '12px' }}>Preview</div>
            <div style={{
              borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-secondary)',
              background: theme === 'light' ? '#f5f5f5' : theme === 'purple' ? 'linear-gradient(135deg,#1a0a2e,#0f3460)' : '#0f0f0f',
              padding: '24px 16px', minHeight: '220px', textAlign: 'center',
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: accentColor, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: 'white' }}>
                {displayInitial}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: theme === 'light' ? '#1a1a1a' : 'white', marginBottom: '4px' }}>
                {displayName || (username ? `@${username}` : 'Seu nome')}
              </div>
              {bioText && <div style={{ fontSize: '11px', color: theme === 'light' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>{bioText.slice(0, 60)}{bioText.length > 60 ? '...' : ''}</div>}
              {activeItems.length === 0 && (bio?.items.length || 0) === 0 && (
                <div style={{ fontSize: '11px', color: theme === 'light' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)', marginTop: '16px' }}>
                  Nenhum link adicionado ainda
                </div>
              )}
              {activeItems.slice(0, 3).map(item => (
                <div key={item.id} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', marginBottom: '6px', fontSize: '12px', color: theme === 'light' ? '#1a1a1a' : 'white', fontWeight: 500 }}>
                  {item.icon} {item.label}
                </div>
              ))}
              {activeItems.length > 3 && <div style={{ fontSize: '11px', color: theme === 'light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' }}>+{activeItems.length - 3} mais</div>}
            </div>
          </div>

          {/* Items list */}
          {bio && bio.items.length > 0 && (
            <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: '10px' }}>Links ({bio.items.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {bio.items.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
                    opacity: item.active ? 1 : 0.5,
                  }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon || '🔗'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{item.clicks} cliques</div>
                    </div>
                    <button
                      onClick={() => handleToggleItem(item.id, item.active)}
                      style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border-secondary)', background: 'transparent', cursor: 'pointer', color: item.active ? '#22c55e' : 'var(--text-tertiary)' }}
                    >
                      {item.active ? 'Ativo' : 'Oculto'}
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={deletingId === item.id}
                      style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics */}
          {bio && bio.items.length > 0 && (() => {
            const totalClicks = bio.items.reduce((sum, i) => sum + i.clicks, 0)
            const maxClicks = Math.max(...bio.items.map(i => i.clicks), 1)
            const sorted = [...bio.items].sort((a, b) => b.clicks - a.clicks)
            return (
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Métricas</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{totalClicks}</strong> cliques totais
                  </div>
                </div>
                {totalClicks === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                    Nenhum clique registrado ainda. Compartilhe sua bio para começar!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sorted.map((item, idx) => {
                      const pct = Math.round((item.clicks / totalClicks) * 100)
                      const barWidth = Math.round((item.clicks / maxClicks) * 100)
                      return (
                        <div key={item.id}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', width: '16px', textAlign: 'center' }}>
                                {idx === 0 && totalClicks > 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                              </span>
                              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                {item.icon} {item.label}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{pct}%</span>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', minWidth: '60px', textAlign: 'right' }}>
                                {item.clicks} cliques
                              </span>
                            </div>
                          </div>
                          <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${barWidth}%`,
                              background: idx === 0 ? accentColor : 'var(--text-tertiary)',
                              borderRadius: '3px',
                              transition: 'width 600ms ease-out',
                              opacity: idx === 0 ? 1 : 0.6,
                            }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>
    </>
  )
}
