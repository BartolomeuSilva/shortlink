'use client'

import { useEffect, useState } from 'react'
import { useTopbar } from '@/components/layout/Topbar'

interface Pixels {
  metaPixelId:   string | null
  googleTagId:   string | null
  tiktokPixelId: string | null
  linkedinTagId: string | null
}

const PIXEL_DEFS = [
  {
    key: 'metaPixelId' as keyof Pixels,
    label: 'Meta Pixel (Facebook / Instagram)',
    placeholder: '123456789012345',
    hint: 'ID numérico de 15 dígitos encontrado no Gerenciador de Eventos.',
    color: '#1877F2',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    key: 'googleTagId' as keyof Pixels,
    label: 'Google Tag (GA4 / Ads)',
    placeholder: 'G-XXXXXXXXXX ou AW-XXXXXXXXX',
    hint: 'ID do Google Analytics 4 (G-...) ou Google Ads (AW-...).',
    color: '#4285F4',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    key: 'tiktokPixelId' as keyof Pixels,
    label: 'TikTok Pixel',
    placeholder: 'CXXXXXXXXXXXXXXX',
    hint: 'ID do pixel encontrado no TikTok Ads Manager → Ativos → Eventos.',
    color: '#010101',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/>
      </svg>
    ),
  },
  {
    key: 'linkedinTagId' as keyof Pixels,
    label: 'LinkedIn Insight Tag',
    placeholder: '1234567',
    hint: 'Partner ID numérico encontrado no LinkedIn Campaign Manager.',
    color: '#0A66C2',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
]

export default function PixelsPage() {
  const [pixels, setPixels] = useState<Pixels>({ metaPixelId: null, googleTagId: null, tiktokPixelId: null, linkedinTagId: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle('Pixels de Retargeting')
    topbar.setSubtitle('Configure pixels para impactar visitantes dos seus links com anúncios')
    topbar.setActions(null)
  }, [])

  useEffect(() => {
    fetch('/api/user/pixels')
      .then(r => r.json())
      .then(d => { if (d.pixels) setPixels(d.pixels) })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/user/pixels', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pixels),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao salvar'); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Carregando...</div>
  )

  return (
    <>
      <div className="page-content">
        <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 300, lineHeight: '1.6' }}>
            Quando um visitante clica em qualquer link seu, o pixel configurado dispara automaticamente.
            Isso permite que você exiba anúncios direcionados para esse público nas plataformas abaixo.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {PIXEL_DEFS.map(def => (
            <div key={def.key} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                  background: `${def.color}14`, border: `1px solid ${def.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: def.color,
                }}>
                  {def.icon}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{def.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '1px' }}>{def.hint}</div>
                </div>
                {pixels[def.key] && (
                  <div style={{
                    marginLeft: 'auto', fontSize: '11px', fontWeight: 500, padding: '3px 10px',
                    borderRadius: '99px', background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                    border: '0.5px solid rgba(34,197,94,0.2)',
                  }}>
                    Ativo
                  </div>
                )}
              </div>
              <input
                type="text"
                value={pixels[def.key] || ''}
                onChange={e => setPixels(prev => ({ ...prev, [def.key]: e.target.value }))}
                placeholder={def.placeholder}
                style={{
                  width: '100%', height: '40px', fontFamily: 'var(--font-dm-mono, monospace)',
                  fontSize: '13px', color: 'var(--text-primary)', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-secondary)', borderRadius: '8px',
                  padding: '0 12px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar configurações'}
        </button>

        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '16px', fontWeight: 300 }}>
          Os pixels disparam em todos os seus links, incluindo links com domínios personalizados.
          Deixe o campo vazio para desativar um pixel.
        </p>
      </div>
    </>
  )
}
