'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CreateLinkModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export function CreateLinkModal({ onClose, onSuccess }: CreateLinkModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [originalUrl, setOriginalUrl] = useState('')
  const [alias, setAlias] = useState('')
  const [title, setTitle] = useState('')
  const [password, setPassword] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const body: Record<string, string> = { url: originalUrl }
      if (alias) body.customCode = alias
      if (title) body.title = title
      if (password) body.password = password
      if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString()

      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao criar link.')
        return
      }

      router.refresh()
      if (onSuccess) onSuccess()
      onClose()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', height: '38px',
    fontFamily: 'inherit', fontSize: '13px', fontWeight: 300,
    color: 'var(--text-primary)', background: 'var(--bg-secondary)',
    border: '0.5px solid rgba(0,0,0,0.12)',
    borderRadius: '6px', padding: '0 12px', outline: 'none',
  }

  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: 500,
    color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.1px',
  } as const

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: '16px',
        padding: '24px', width: '100%', maxWidth: '480px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>Novo link</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 300, marginTop: '2px' }}>Crie um link curto com analytics</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--color-error-bg)', border: '0.5px solid rgba(163,45,45,0.2)',
            borderRadius: '6px', padding: '10px 14px',
            fontSize: '13px', color: 'var(--color-error)', marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>URL Original <span style={{ color: 'var(--color-error)' }}>*</span></label>
            <input
              type="url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              required
              placeholder="https://exemplo.com/url-longa"
              style={inputStyle}
            />
          </div>

          <div className="modal-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Alias personalizado</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: '6px', overflow: 'hidden' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', padding: '0 8px', borderRight: '0.5px solid rgba(0,0,0,0.08)', height: '38px', display: 'flex', alignItems: 'center', background: '#F7F7F5', whiteSpace: 'nowrap' }}>
                  123bit.app/
                </span>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                  placeholder="meu-link"
                  style={{ ...inputStyle, border: 'none', borderRadius: 0, flex: 1 }}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome do link"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="modal-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Senha (opcional)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Proteger com senha"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Expira em</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, fontFamily: 'inherit', fontSize: '13px', fontWeight: 400,
                color: 'var(--text-secondary)', background: 'var(--bg-secondary)',
                border: '0.5px solid rgba(0,0,0,0.1)',
                padding: '10px', borderRadius: '6px', cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
                color: 'var(--bg-secondary)', background: loading ? 'var(--primary-light)' : 'var(--primary)',
                border: 'none', padding: '10px', borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Criando...' : 'Criar link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
