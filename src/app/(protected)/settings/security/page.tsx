'use client'

import { useEffect, useState } from 'react'
import { useTopbar } from '@/components/layout/Topbar'

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
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle('Segurança')
    topbar.setSubtitle('Proteja sua conta com autenticação de dois fatores')
    topbar.setActions(null)
  }, [topbar])

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
      <div className="settings-container">

        {/* Card 2FA Status */}
        <div className="settings-info-list" style={{ marginBottom: '24px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: enabled ? 'color-mix(in srgb, #22c55e 10%, transparent)' : 'color-mix(in srgb, #f59e0b 10%, transparent)',
                color: enabled ? '#22c55e' : '#f59e0b',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                  Autenticação de Dois Fatores (2FA)
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: enabled ? '#22c55e' : '#f59e0b' }}>
                  {enabled ? 'Proteção Ativada' : 'Proteção Desativada'}
                </div>
              </div>
            </div>
            {step === 'idle' && (
              enabled ? (
                <button className="btn btn-ghost" onClick={() => { setStep('disable'); setError('') }}
                  style={{ height: '36px', padding: '0 16px', fontSize: '13px', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                  Desativar
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => setStep('setup')}
                  style={{ height: '36px', padding: '0 20px', fontSize: '13px' }}>
                  Configurar
                </button>
              )
            )}
          </div>

          {/* SETUP — QR Code */}
          {step === 'setup' && !enabled && (
            <div style={{ borderTop: '1px solid var(--border-primary)', padding: '24px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
                Escaneie o QR Code com seu app autenticador (Google Authenticator, Authy, etc) ou insira a chave manualmente.
              </p>
              <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {qrSrc && (
                  <div style={{ padding: '12px', background: 'white', borderRadius: '12px', flexShrink: 0 }}>
                    <img src={qrSrc} alt="2FA QR Code" width={176} height={176} style={{ display: 'block' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div className="settings-label" style={{ marginBottom: '8px' }}>Chave Manual</div>
                  <div style={{
                    padding: '14px 16px', borderRadius: '12px',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)',
                    fontFamily: 'var(--font-dm-mono)', fontSize: '13px', color: 'var(--primary)',
                    letterSpacing: '2px', wordBreak: 'break-all', lineHeight: 1.6,
                  }}>
                    {secret}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button className="btn btn-ghost" onClick={() => setStep('idle')} style={{ flex: 1, height: '42px', fontSize: '13px' }}>
                      Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={() => setStep('verify')} style={{ flex: 2, height: '42px', fontSize: '13px' }}>
                      Próximo Passo →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VERIFY — Código */}
          {step === 'verify' && !enabled && (
            <div style={{ borderTop: '1px solid var(--border-primary)', padding: '24px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Verificar código</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Insira o código de 6 dígitos gerado pelo seu aplicativo autenticador.
              </p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000 000"
                maxLength={6}
                value={token}
                onChange={e => { setToken(e.target.value.replace(/\D/g, '')); setError('') }}
                style={{
                  display: 'block', width: '100%', maxWidth: '200px',
                  height: '56px', textAlign: 'center',
                  fontFamily: 'var(--font-dm-mono)', fontSize: '24px', letterSpacing: '6px',
                  border: `2px solid ${error ? '#ef4444' : 'var(--border-primary)'}`,
                  borderRadius: '12px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                  outline: 'none', marginBottom: '8px',
                }}
              />
              {error && <div style={{ fontSize: '13px', color: '#ef4444', marginBottom: '16px' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button className="btn btn-ghost" onClick={() => setStep('setup')} style={{ flex: 1, height: '42px', fontSize: '13px' }}>
                  Voltar
                </button>
                <button className="btn btn-primary" onClick={handleEnable} disabled={submitting || token.length !== 6} style={{ flex: 2, height: '42px', fontSize: '13px' }}>
                  {submitting ? 'Verificando...' : 'Ativar 2FA'}
                </button>
              </div>
            </div>
          )}

          {/* BACKUP CODES */}
          {step === 'backup' && (
            <div style={{ borderTop: '1px solid color-mix(in srgb, #22c55e 20%, transparent)', padding: '24px', background: 'color-mix(in srgb, #22c55e 4%, transparent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#22c55e' }}>2FA ativado com sucesso!</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
                Guarde estes códigos de backup em um local seguro. Se você perder o acesso ao seu autenticador, eles serão a única forma de recuperar sua conta.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', marginBottom: '20px' }}>
                {backupCodes.map(code => (
                  <div key={code} style={{
                    padding: '10px 14px', borderRadius: '10px', textAlign: 'center',
                    fontFamily: 'var(--font-dm-mono)', fontSize: '13px', fontWeight: 600,
                    color: 'var(--text-primary)', background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-secondary)', letterSpacing: '1px',
                  }}>
                    {code}
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost" onClick={copyBackupCodes} style={{ width: '100%', height: '42px', fontSize: '13px', border: '1px solid var(--border-secondary)' }}>
                {copied ? '✓ Códigos copiados!' : 'Copiar todos os códigos'}
              </button>
            </div>
          )}

          {/* DISABLE */}
          {step === 'disable' && enabled && (
            <div style={{ borderTop: '1px solid color-mix(in srgb, #ef4444 20%, transparent)', padding: '24px', background: 'color-mix(in srgb, #ef4444 4%, transparent)' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#ef4444', marginBottom: '6px' }}>Desativar 2FA</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Insira o código atual do seu aplicativo autenticador para confirmar.
              </p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000 000"
                maxLength={6}
                value={token}
                onChange={e => { setToken(e.target.value.replace(/\D/g, '')); setError('') }}
                style={{
                  display: 'block', width: '100%', maxWidth: '200px',
                  height: '56px', textAlign: 'center',
                  fontFamily: 'var(--font-dm-mono)', fontSize: '24px', letterSpacing: '6px',
                  border: `2px solid ${error ? '#ef4444' : 'rgba(239,68,68,0.3)'}`,
                  borderRadius: '12px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                  outline: 'none', marginBottom: '8px',
                }}
              />
              {error && <div style={{ fontSize: '13px', color: '#ef4444', marginBottom: '12px' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button className="btn btn-ghost" onClick={() => { setStep('idle'); setError(''); setToken('') }} style={{ flex: 1, height: '42px', fontSize: '13px' }}>
                  Cancelar
                </button>
                <button
                  className="btn"
                  onClick={handleDisable}
                  disabled={submitting || token.length !== 6}
                  style={{ flex: 2, height: '42px', fontSize: '13px', background: '#ef4444', color: 'white', border: 'none' }}
                >
                  {submitting ? 'Desativando...' : 'Confirmar Desativação'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hint */}
        <div className="settings-hint">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div className="settings-hint-text">
            O <strong>2FA</strong> é a forma mais eficaz de proteger sua conta contra acessos não autorizados. Recomendamos manter esta opção sempre ativa.
          </div>
        </div>

      </div>
    </div>
  )
}
