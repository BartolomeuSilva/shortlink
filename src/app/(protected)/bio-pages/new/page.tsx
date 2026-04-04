'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTopbar } from '@/components/layout/Topbar'

const THEMES = [
  { id: 'dark',   label: 'Escuro',  preview: '#0f0f0f', text: '#ffffff' },
  { id: 'light',  label: 'Claro',   preview: '#f5f5f5', text: '#111111' },
  { id: 'purple', label: 'Roxo',    preview: '#1a0a2e', text: '#ffffff' },
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

  return (
    <div className="page-content" style={{ maxWidth: '560px', margin: '0 auto' }}>
      <div className="settings-action-card" style={{ flexDirection: 'column', gap: 0, padding: 0, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.01em' }}>
            Configurações da bio
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            Defina o endereço, aparência e cor da sua página
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Slug */}
          <div>
            <label className="settings-list-label">
              Endereço (URL) <span style={{ color: '#ef4444', fontWeight: 400 }}>*</span>
            </label>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: '1px solid var(--border-primary)', borderRadius: '12px',
              overflow: 'hidden', background: 'var(--bg-tertiary)',
            }}>
              <span style={{
                padding: '0 14px', height: '48px', display: 'flex', alignItems: 'center',
                fontSize: '13px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-dm-mono)',
                borderRight: '1px solid var(--border-primary)', whiteSpace: 'nowrap',
                background: 'var(--bg-secondary)',
              }}>
                123bit.app/b/
              </span>
              <input
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="meu-perfil"
                style={{
                  flex: 1, height: '48px', border: 'none', outline: 'none', background: 'transparent',
                  fontFamily: 'var(--font-dm-mono)', fontSize: '14px', color: 'var(--text-primary)',
                  padding: '0 14px',
                }}
              />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
              Apenas letras minúsculas, números e hífen
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="settings-list-label">Título</label>
            <input
              className="settings-input-modern"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Seu nome ou marca"
            />
          </div>

          {/* Tema */}
          <div>
            <label className="settings-list-label">Tema visual</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  style={{
                    flex: 1, height: '48px', borderRadius: '12px', cursor: 'pointer',
                    background: t.preview, fontSize: '13px', fontWeight: 600, color: t.text,
                    border: `2px solid ${theme === t.id ? accentColor : 'var(--border-secondary)'}`,
                    outline: theme === t.id ? `3px solid color-mix(in srgb, ${accentColor} 30%, transparent)` : 'none',
                    transition: 'all 150ms',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cor de destaque */}
          <div>
            <label className="settings-list-label">Cor de destaque</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
                <input
                  type="color"
                  value={accentColor}
                  onChange={e => setAccentColor(e.target.value)}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                />
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: accentColor, border: '2px solid var(--border-secondary)',
                  boxShadow: `0 0 0 3px color-mix(in srgb, ${accentColor} 25%, transparent)`,
                  pointerEvents: 'none',
                }} />
              </div>
              <input
                className="settings-input-modern"
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
                style={{ fontFamily: 'var(--font-dm-mono)', flex: 1 }}
              />
            </div>
          </div>

          {/* Preview strip */}
          <div style={{
            borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-secondary)',
          }}>
            <div style={{
              height: '6px',
              background: `linear-gradient(90deg, ${accentColor}, color-mix(in srgb, ${accentColor} 60%, #3b82f6))`,
            }} />
            <div style={{
              padding: '16px', background: THEMES.find(t => t.id === theme)?.preview,
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: '#fff',
              }}>
                {(title || slug || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: THEMES.find(t => t.id === theme)?.text, marginBottom: '2px' }}>
                  {title || 'Seu nome'}
                </div>
                <div style={{ fontSize: '11px', color: accentColor, fontFamily: 'var(--font-dm-mono)' }}>
                  123bit.app/b/{slug || 'meu-perfil'}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ fontSize: '13px', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border-primary)', display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={creating || !slug}
            style={{ flex: 1, height: '44px', fontSize: '14px' }}
          >
            {creating ? 'Criando...' : 'Criar bio'}
          </button>
          <Link href="/bio-pages" className="btn btn-ghost" style={{ height: '44px', padding: '0 20px', fontSize: '14px' }}>
            Cancelar
          </Link>
        </div>

      </div>
    </div>
  )
}
