'use client'

import { useState, useRef } from 'react'
import { signOut } from 'next-auth/react'

interface ProfileModalProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  onClose: () => void
  onProfileUpdate?: (patch: { name?: string; image?: string }) => void
}


export function ProfileModal({ user, onClose, onProfileUpdate }: ProfileModalProps) {
  const [name, setName] = useState(user.name || '')
  const [avatarSrc, setAvatarSrc] = useState(user.image || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Password change
  const [showPassword, setShowPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = (user.name || user.email || '?')
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Immediate local preview
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarSrc(ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/user/avatar', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao enviar foto'); return }
      const url = data.imageUrl + '?t=' + Date.now()
      setAvatarSrc(url)
      onProfileUpdate?.({ image: url })
    } catch {
      setError('Erro ao enviar foto')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao salvar'); return }
      onProfileUpdate?.({ name: name.trim() })
      setSuccess('Perfil atualizado!')
      setTimeout(() => { setSuccess(''); onClose() }, 1200)
    } catch {
      setError('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setError('')
    setSuccess('')
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }
    if (newPassword.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres')
      return
    }
    setSavingPassword(true)
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao alterar senha'); return }
      setSuccess('Senha alterada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPassword(false)
    } catch {
      setError('Erro ao alterar senha')
    } finally {
      setSavingPassword(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '42px',
    fontFamily: 'inherit', fontSize: '14px', fontWeight: 300,
    color: 'var(--text-primary)', background: 'var(--bg-secondary)',
    border: '1px solid var(--border-secondary)',
    borderRadius: '8px', padding: '0 12px', outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 500,
    color: 'var(--text-secondary)', marginBottom: '6px',
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal profile-modal">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Meu Perfil</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {/* Avatar */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrap" onClick={() => fileInputRef.current?.click()}>
              <div className="profile-avatar">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className={`profile-avatar-overlay ${uploading ? 'uploading' : ''}`}>
                {uploading ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" className="profile-spinner">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                )}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <p className="profile-avatar-hint">{uploading ? 'Enviando...' : 'Clique para alterar'}</p>
          </div>

          {/* Alerts */}
          {error && <div className="settings-alert settings-alert-error" style={{ marginBottom: '16px' }}>{error}</div>}
          {success && <div className="settings-alert settings-alert-success" style={{ marginBottom: '16px' }}>{success}</div>}

          {/* Name */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Nome</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Seu nome" />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={user.email || ''} style={{ ...inputStyle, opacity: 0.55, cursor: 'not-allowed' }} disabled />
          </div>

          {/* Plan */}
          <div className="profile-plan-row">
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Plano atual</span>
            <span className="profile-plan-badge">FREE</span>
          </div>

          {/* Save profile */}
          <button
            onClick={handleSaveProfile}
            disabled={saving || uploading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '10px' }}
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>

          {/* Change password toggle */}
          <button
            onClick={() => { setShowPassword((v) => !v); setError(''); setSuccess('') }}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center', marginBottom: showPassword ? '0' : '10px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            {showPassword ? 'Cancelar troca de senha' : 'Alterar senha'}
          </button>

          {/* Password form */}
          {showPassword && (
            <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '16px', marginTop: '10px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Senha atual</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={inputStyle} placeholder="••••••••" autoComplete="current-password" />
              </div>
              <div>
                <label style={labelStyle}>Nova senha</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
              </div>
              <div>
                <label style={labelStyle}>Confirmar nova senha</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="Repita a nova senha" autoComplete="new-password" />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {savingPassword ? 'Alterando...' : 'Confirmar nova senha'}
              </button>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center', color: 'var(--color-error)', borderColor: 'transparent', marginTop: '4px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  )
}
