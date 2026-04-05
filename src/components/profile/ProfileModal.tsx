'use client'

import { useState, useRef } from 'react'

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
  // Only use the stored image if it's an absolute URL (Supabase), not a local path
  const isValidImage = (src: string | null | undefined) =>
    !!src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:'))
  const [avatarSrc, setAvatarSrc] = useState(isValidImage(user.image) ? user.image! : '')
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
            <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Avatar Section */}
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
                  <svg width="24" height="24" viewBox="0 0 24 24" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" className="profile-spinner">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                )}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <p className="profile-avatar-hint">{uploading ? 'Enviando...' : 'Alterar foto'}</p>
          </div>

          {/* Alerts */}
          {error && <div className="settings-alert settings-alert-error" style={{ marginBottom: '20px' }}>{error}</div>}
          {success && <div className="settings-alert settings-alert-success" style={{ marginBottom: '20px' }}>{success}</div>}

          {/* Form */}
          <div className="profile-input-group">
            <label className="profile-label">Nome Completo</label>
            <input 
              type="text" 
              className="profile-input"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ex: Bartolomeu Silva" 
            />
          </div>

          <div className="profile-input-group">
            <label className="profile-label">E-mail (não editável)</label>
            <input 
              type="email" 
              className="profile-input"
              value={user.email || ''} 
              disabled 
            />
          </div>

          <div className="profile-plan-row">
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Plano de Assinatura</span>
            <span className="profile-plan-badge">FREE</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={handleSaveProfile}
              disabled={saving || uploading}
              className="btn btn-primary"
              style={{ width: '100%', height: '48px', justifyContent: 'center' }}
            >
              {saving ? 'Gravando dados...' : 'Salvar Perfil'}
            </button>

            <button
              onClick={() => { setShowPassword((v) => !v); setError(''); setSuccess('') }}
              className="btn btn-ghost"
              style={{ width: '100%', height: '48px', justifyContent: 'center' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              {showPassword ? 'Cancelar troca de senha' : 'Alterar senha de acesso'}
            </button>
          </div>

          {/* Password Section */}
          {showPassword && (
            <div className="profile-password-section">
              <div className="profile-input-group" style={{ marginBottom: '12px' }}>
                <label className="profile-label">Senha atual</label>
                <input 
                  type="password" 
                  className="profile-input"
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  placeholder="••••••••" 
                  autoComplete="current-password" 
                />
              </div>
              <div className="profile-input-group" style={{ marginBottom: '12px' }}>
                <label className="profile-label">Nova senha</label>
                <input 
                  type="password" 
                  className="profile-input"
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Mínimo 8 caracteres" 
                  autoComplete="new-password" 
                />
              </div>
              <div className="profile-input-group" style={{ marginBottom: '20px' }}>
                <label className="profile-label">Confirmar nova senha</label>
                <input 
                  type="password" 
                  className="profile-input"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Repita a nova senha" 
                  autoComplete="new-password" 
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="btn btn-primary"
                style={{ width: '100%', height: '48px', justifyContent: 'center' }}
              >
                {savingPassword ? 'Processando...' : 'Definir Nova Senha'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
