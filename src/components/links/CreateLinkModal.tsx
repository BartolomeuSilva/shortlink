'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CreateLinkModalProps {
  onClose: () => void
  onSuccess?: () => void
}

type Tab = 'basic' | 'utm' | 'og' | 'schedule' | 'rules'

export function CreateLinkModal({ onClose, onSuccess }: CreateLinkModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('basic')

  // Basic
  const [originalUrl, setOriginalUrl] = useState('')
  const [alias, setAlias] = useState('')
  const [title, setTitle] = useState('')
  const [password, setPassword] = useState('')

  // Schedule
  const [expiresAt, setExpiresAt] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [maxClicks, setMaxClicks] = useState('')

  // UTM
  const [utmSource, setUtmSource] = useState('')
  const [utmMedium, setUtmMedium] = useState('')
  const [utmCampaign, setUtmCampaign] = useState('')
  const [utmTerm, setUtmTerm] = useState('')
  const [utmContent, setUtmContent] = useState('')

  // OG Preview
  const [ogTitle, setOgTitle] = useState('')
  const [ogDescription, setOgDescription] = useState('')
  const [ogImage, setOgImage] = useState('')

  const builtUrl = (() => {
    if (!originalUrl) return ''
    try {
      const u = new URL(originalUrl)
      if (utmSource) u.searchParams.set('utm_source', utmSource)
      if (utmMedium) u.searchParams.set('utm_medium', utmMedium)
      if (utmCampaign) u.searchParams.set('utm_campaign', utmCampaign)
      if (utmTerm) u.searchParams.set('utm_term', utmTerm)
      if (utmContent) u.searchParams.set('utm_content', utmContent)
      return u.toString()
    } catch { return originalUrl }
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const body: Record<string, unknown> = { url: builtUrl || originalUrl }
      if (alias) body.customCode = alias
      if (title) body.title = title
      if (password) body.password = password
      if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString()
      if (startsAt) body.startsAt = new Date(startsAt).toISOString()
      if (maxClicks) body.maxClicks = parseInt(maxClicks)
      if (utmSource) body.utmSource = utmSource
      if (utmMedium) body.utmMedium = utmMedium
      if (utmCampaign) body.utmCampaign = utmCampaign
      if (utmTerm) body.utmTerm = utmTerm
      if (utmContent) body.utmContent = utmContent
      if (ogTitle) body.ogTitle = ogTitle
      if (ogDescription) body.ogDescription = ogDescription
      if (ogImage) body.ogImage = ogImage

      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao criar link.'); return }
      router.refresh()
      if (onSuccess) onSuccess()
      onClose()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', height: '38px', fontFamily: 'inherit', fontSize: '13px', fontWeight: 300,
    color: 'var(--text-primary)', background: 'var(--bg-secondary)',
    border: '1px solid var(--border-secondary)', borderRadius: '6px', padding: '0 12px',
    outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 500,
    color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.1px',
  }
  const textareaStyle: React.CSSProperties = {
    width: '100%', fontFamily: 'inherit', fontSize: '13px', fontWeight: 300,
    color: 'var(--text-primary)', background: 'var(--bg-secondary)',
    border: '1px solid var(--border-secondary)', borderRadius: '6px', padding: '8px 12px',
    outline: 'none', boxSizing: 'border-box', resize: 'none', lineHeight: '1.5',
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'basic', label: 'Básico' },
    { id: 'schedule', label: 'Agendamento' },
    { id: 'utm', label: 'UTM' },
    { id: 'og', label: 'Preview' },
  ]

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'var(--modal-overlay)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: '16px',
        width: '100%', maxWidth: '520px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>Novo link</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 300, marginTop: '2px' }}>Crie um link curto com analytics</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px', padding: '12px 24px 0', borderBottom: '1px solid var(--border-primary)' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '6px 14px', borderRadius: '6px 6px 0 0', border: 'none',
                background: tab === t.id ? 'var(--bg-primary)' : 'transparent',
                color: tab === t.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontFamily: 'inherit', fontSize: '12px', fontWeight: tab === t.id ? 500 : 400,
                cursor: 'pointer', borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {error && (
            <div style={{
              background: 'var(--color-error-bg)', border: '0.5px solid rgba(163,45,45,0.2)',
              borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: 'var(--color-error)', marginBottom: '16px',
            }}>{error}</div>
          )}

          {/* BASIC TAB */}
          {tab === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={lbl}>URL Original <span style={{ color: 'var(--color-error)' }}>*</span></label>
                <input type="url" value={originalUrl} onChange={e => setOriginalUrl(e.target.value)} required placeholder="https://exemplo.com/url-longa" style={inp} />
              </div>
              <div className="modal-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={lbl}>Alias personalizado</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-secondary)', borderRadius: '6px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', padding: '0 8px', borderRight: '1px solid var(--border-secondary)', height: '38px', display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', whiteSpace: 'nowrap' }}>
                      123bit.app/
                    </span>
                    <input type="text" value={alias} onChange={e => setAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))} placeholder="meu-link" style={{ ...inp, border: 'none', borderRadius: 0, flex: 1 }} />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Título</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome do link" style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Senha (opcional)</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Proteger com senha" style={inp} />
              </div>
            </div>
          )}

          {/* SCHEDULE TAB */}
          {tab === 'schedule' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="modal-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={lbl}>Inicia em</label>
                  <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Expira em</label>
                  <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Limite de cliques</label>
                <input type="number" min="1" value={maxClicks} onChange={e => setMaxClicks(e.target.value)} placeholder="Ex: 1000 (ilimitado se vazio)" style={inp} />
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>O link será desativado automaticamente ao atingir este limite.</p>
              </div>
            </div>
          )}

          {/* UTM TAB */}
          {tab === 'utm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="modal-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={lbl}>utm_source</label>
                  <input value={utmSource} onChange={e => setUtmSource(e.target.value)} placeholder="google, newsletter..." style={inp} />
                </div>
                <div>
                  <label style={lbl}>utm_medium</label>
                  <input value={utmMedium} onChange={e => setUtmMedium(e.target.value)} placeholder="cpc, email, social..." style={inp} />
                </div>
                <div>
                  <label style={lbl}>utm_campaign</label>
                  <input value={utmCampaign} onChange={e => setUtmCampaign(e.target.value)} placeholder="black-friday-2026..." style={inp} />
                </div>
                <div>
                  <label style={lbl}>utm_term</label>
                  <input value={utmTerm} onChange={e => setUtmTerm(e.target.value)} placeholder="encurtador+url..." style={inp} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>utm_content</label>
                  <input value={utmContent} onChange={e => setUtmContent(e.target.value)} placeholder="banner_topo, btn_cta..." style={inp} />
                </div>
              </div>
              {builtUrl && builtUrl !== originalUrl && (
                <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-primary)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: '6px' }}>URL gerada</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', wordBreak: 'break-all', fontFamily: 'var(--font-dm-mono, monospace)' }}>{builtUrl}</div>
                </div>
              )}
            </div>
          )}

          {/* OG PREVIEW TAB */}
          {tab === 'og' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 300 }}>
                Personalize como o link aparece ao ser compartilhado no WhatsApp, Twitter e Slack.
              </p>
              <div>
                <label style={lbl}>Título do preview</label>
                <input value={ogTitle} onChange={e => setOgTitle(e.target.value)} placeholder="Título exibido ao compartilhar" style={inp} />
              </div>
              <div>
                <label style={lbl}>Descrição</label>
                <textarea value={ogDescription} onChange={e => setOgDescription(e.target.value)} placeholder="Descrição do link..." rows={3} style={textareaStyle} />
              </div>
              <div>
                <label style={lbl}>Imagem de preview (URL)</label>
                <input value={ogImage} onChange={e => setOgImage(e.target.value)} placeholder="https://exemplo.com/imagem.jpg" style={inp} />
              </div>
              {(ogTitle || ogDescription || ogImage) && (
                <div style={{ border: '1px solid var(--border-secondary)', borderRadius: '10px', overflow: 'hidden' }}>
                  {ogImage && <div style={{ height: '140px', background: `url(${ogImage}) center/cover`, backgroundColor: 'var(--bg-primary)' }} />}
                  <div style={{ padding: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>123bit.app</div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>{ogTitle || 'Título do link'}</div>
                    {ogDescription && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{ogDescription}</div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, fontFamily: 'inherit', fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '0.5px solid rgba(0,0,0,0.1)', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ flex: 1, fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, color: 'var(--bg-secondary)', background: loading ? 'var(--primary-light)' : 'var(--primary)', border: 'none', padding: '10px', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Criando...' : 'Criar link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
