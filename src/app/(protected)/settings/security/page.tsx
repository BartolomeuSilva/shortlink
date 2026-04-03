'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'

type Step = 'idle' | 'setup' | 'verify' | 'backup' | 'disable'

export default function SecurityPage() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('idle')
  const [secret, setSecret] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [qrSrc, setQrSrc] = useState('')

  useEffect(() => {
    fetch('/api/user/2fa')
      .then(r => r.json())
      .then(d => {
        setEnabled(d.enabled)
        if (!d.enabled && d.otpAuthUrl) {
          setSecret(d.secret)
          setQrSrc(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(d.otpAuthUrl)}`)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleEnable = async () => {
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/user/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setBackupCodes(data.backupCodes)
      setEnabled(true)
      setStep('backup')
      setToken('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDisable = async () => {
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/user/2fa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setEnabled(false)
      setStep('idle')
      setToken('')
    } finally {
      setSubmitting(false)
    }
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (loading) return (
    <div className="page-content">
      <div className="profile-spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border-secondary)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
    </div>
  )

  return (
    <div className="page-content">
      <PageHeader
        title="Segurança"
        subtitle="Mantenha sua conta protegida com autenticação de dois fatores"
      />

      <div className="settings-container">
        
        {/* 2FA Summary Card */}
        <div className="security-card">
          <div className="security-header">
            <div className="flex items-center gap-4">
              <div className={`security-icon-box ${enabled ? 'security-badge-success' : 'security-badge-warning'}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-primary">
                  Autenticação de Dois Fatores (2FA)
                </h3>
                <div className={`security-status-text ${enabled ? 'text-green-500' : 'text-orange-500'}`}>
                  {enabled ? 'Proteção Ativada' : 'Proteção Desativada'}
                </div>
              </div>
            </div>
            {enabled ? (
              <button className="btn btn-ghost text-red-500 font-medium" onClick={() => { setStep('disable'); setError('') }}>
                Desativar
              </button>
            ) : (
              <button className="btn btn-primary h-10 px-6" onClick={() => setStep('setup')}>
                Configurar
              </button>
            )}
          </div>

          {/* SETUP STEP */}
          {step === 'setup' && !enabled && (
            <div className="security-setup-box">
              <p className="text-sm text-secondary mb-6 leading-relaxed">
                Proteja sua conta adicionando uma camada extra de segurança. Escaneie o QR Code abaixo com seu app autenticador (Google Authenticator, Authy, etc).
              </p>
              
              <div className="flex gap-8 items-center flex-wrap">
                <div className="security-qr-container">
                  {qrSrc && <img src={qrSrc} alt="2FA QR Code" />}
                </div>
                
                <div className="flex-1 min-w-[240px]">
                  <div className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-2">
                    Chave Manual
                  </div>
                  <div className="px-5 py-4 bg-primary/5 rounded-2xl border border-primary/10 font-mono text-sm tracking-widest text-primary break-all">
                    {secret}
                  </div>
                  <button className="btn btn-primary mt-6 w-full h-11" onClick={() => setStep('verify')}>
                    Próximo Passo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VERIFY STEP */}
          {step === 'verify' && !enabled && (
            <div className="security-setup-box">
              <h4 className="text-sm font-bold text-primary mb-2">
                Verificação de Código
              </h4>
              <p className="text-sm text-secondary mb-4">
                Insira o código de 6 dígitos que aparece no seu aplicativo:
              </p>

              <input
                type="text"
                className="security-otp-input mx-auto"
                placeholder="000 000"
                maxLength={6}
                value={token}
                onChange={e => { setToken(e.target.value.replace(/\D/g, '')); setError('') }}
              />

              {error && (
                <div className="text-center text-sm text-red-500 font-semibold mb-6">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button className="btn btn-ghost flex-1 h-11" onClick={() => setStep('setup')}>Voltar</button>
                <button 
                  className="btn btn-primary flex-[2] h-11" 
                  disabled={submitting || token.length !== 6}
                  onClick={handleEnable}
                >
                  {submitting ? 'Verificando...' : 'Ativar Agora'}
                </button>
              </div>
            </div>
          )}

          {/* BACKUP CODES STEP */}
          {step === 'backup' && (
            <div className="security-setup-box bg-green-500/5 border-t border-green-500/10">
              <div className="flex items-center gap-3 text-green-500 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span className="font-bold text-lg">2FA Ativado com sucesso!</span>
              </div>
              
              <p className="text-sm text-secondary mb-6 leading-relaxed">
                Guarde estes códigos de backup em um local seguro. Se você perder seu celular, eles serão a única forma de recuperar o acesso à sua conta.
              </p>

              <div className="security-backup-grid">
                {backupCodes.map(code => (
                  <div key={code} className="security-backup-item">{code}</div>
                ))}
              </div>

              <button className="btn btn-primary w-full h-11 mt-2" onClick={copyBackupCodes}>
                {copied ? '✓ Códigos Copiados!' : 'Copiar Todos os Códigos'}
              </button>
            </div>
          )}

          {/* DISABLE STEP */}
          {step === 'disable' && enabled && (
            <div className="security-setup-box bg-red-500/5 border-t border-red-500/10">
              <h4 className="text-sm font-bold text-red-500 mb-2">
                Desativar Segurança 2FA
              </h4>
              <p className="text-sm text-secondary mb-4">
                Por segurança, insira o código atual do seu aplicativo autenticador:
              </p>

              <input
                type="text"
                className="security-otp-input mx-auto border-red-500/20"
                placeholder="000 000"
                maxLength={6}
                value={token}
                onChange={e => { setToken(e.target.value.replace(/\D/g, '')); setError('') }}
              />

              {error && (
                <div className="text-center text-sm text-red-500 font-semibold mb-6">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button className="btn btn-ghost flex-1 h-11" onClick={() => setStep('idle')}>Cancelar</button>
                <button 
                  className="btn btn-primary flex-[2] h-11 bg-red-500 border-red-500 hover:bg-red-600" 
                  disabled={submitting || token.length !== 6}
                  onClick={handleDisable}
                >
                  {submitting ? 'Desativando...' : 'Confirmar Desativação'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Info Footer */}
        <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/10 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <p className="text-sm text-secondary leading-relaxed">
            O <strong>2FA (Autenticação de Dois Fatores)</strong> é a forma mais eficaz de proteger a sua conta contra acessos não autorizados. Recomendamos manter esta opção sempre ativa.
          </p>
        </div>

      </div>
    </div>
  )
}
