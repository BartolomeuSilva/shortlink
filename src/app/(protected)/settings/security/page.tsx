'use client'

import { useEffect, useState } from 'react'
import { useTopbar } from '@/components/layout/Topbar'

type Step = 'idle' | 'setup' | 'verify' | 'backup' | 'disable'

export default function SecurityPage() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('idle')
  const [otpAuthUrl, setOtpAuthUrl] = useState('')
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
    topbar.setSubtitle('Autenticação de dois fatores e sessões ativas')
    topbar.setActions(null)
  }, [])

  useEffect(() => {
    fetch('/api/user/2fa')
      .then(r => r.json())
      .then(d => {
        setEnabled(d.enabled)
        if (!d.enabled && d.otpAuthUrl) {
          setOtpAuthUrl(d.otpAuthUrl)
          setSecret(d.secret)
          // Generate QR via Google Charts API (no external lib needed)
          setQrSrc(`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(d.otpAuthUrl)}`)
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

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-tertiary)' }}>Carregando...</div>

  return (
    <>
      <div className="page-content" style={{ maxWidth: '600px' }}>
        {/* 2FA Card */}
        <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Autenticação de dois fatores (2FA)
        </div>
        <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '24px' }}>
          {/* Status row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                background: enabled ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.08)',
                border: `1px solid ${enabled ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: enabled ? '#22c55e' : '#f59e0b',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Autenticador TOTP
                </div>
                <div style={{ fontSize: '12px', color: enabled ? '#22c55e' : '#f59e0b', marginTop: '2px', fontWeight: 500 }}>
                  {enabled ? 'Habilitado' : 'Desabilitado'}
                </div>
              </div>
            </div>
            {enabled
              ? <button className="btn btn-ghost" onClick={() => { setStep('disable'); setError('') }} style={{ fontSize: '13px' }}>Desabilitar</button>
              : <button className="btn btn-primary" onClick={() => setStep('setup')} style={{ fontSize: '13px' }}>Configurar</button>
            }
          </div>

          {/* SETUP: show QR */}
          {step === 'setup' && !enabled && (
            <div style={{ borderTop: '1px solid var(--border-primary)', padding: '20px', background: 'var(--bg-secondary)' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>
                Escaneie o QR code com o Google Authenticator, Authy ou qualquer app TOTP.
              </p>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {qrSrc && (
                  <div style={{ padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid var(--border-secondary)' }}>
                    <img src={qrSrc} alt="QR Code 2FA" width={160} height={160} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Ou insira o código manualmente:</div>
                  <div style={{
                    fontFamily: 'var(--font-dm-mono, monospace)', fontSize: '13px', letterSpacing: '3px',
                    padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-primary)',
                    border: '1px solid var(--border-secondary)', color: 'var(--text-primary)',
                    userSelect: 'all', wordBreak: 'break-all',
                  }}>
                    {secret}
                  </div>
                  <button onClick={() => setStep('verify')} className="btn btn-primary" style={{ marginTop: '16px', width: '100%' }}>
                    Já escaneei → Verificar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VERIFY: enter token */}
          {step === 'verify' && !enabled && (
            <div style={{ borderTop: '1px solid var(--border-primary)', padding: '20px', background: 'var(--bg-secondary)' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Digite o código de 6 dígitos gerado pelo app autenticador:
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={token}
                onChange={e => { setToken(e.target.value.replace(/\D/g, '')); setError('') }}
                placeholder="000000"
                style={{
                  width: '100%', height: '48px', textAlign: 'center',
                  fontFamily: 'var(--font-dm-mono, monospace)', fontSize: '24px', letterSpacing: '8px',
                  color: 'var(--text-primary)', background: 'var(--bg-primary)',
                  border: '1px solid var(--border-secondary)', borderRadius: '10px',
                  padding: '0', outline: 'none', boxSizing: 'border-box',
                }}
              />
              {error && <div style={{ fontSize: '13px', color: '#ef4444', marginTop: '8px' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button className="btn btn-ghost" onClick={() => setStep('setup')} style={{ flex: 1 }}>Voltar</button>
                <button className="btn btn-primary" onClick={handleEnable} disabled={submitting || token.length !== 6} style={{ flex: 2 }}>
                  {submitting ? 'Verificando...' : 'Ativar 2FA'}
                </button>
              </div>
            </div>
          )}

          {/* BACKUP CODES */}
          {step === 'backup' && (
            <div style={{ borderTop: '1px solid rgba(34,197,94,0.2)', padding: '20px', background: 'rgba(34,197,94,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth="2" fill="none"><polyline points="20 6 9 17 4 12" /></svg>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#22c55e' }}>2FA ativado com sucesso!</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
                Salve estes códigos de recuperação em local seguro. Cada um pode ser usado uma vez se você perder acesso ao app autenticador.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
                {backupCodes.map(code => (
                  <div key={code} style={{ fontFamily: 'var(--font-dm-mono, monospace)', fontSize: '13px', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-secondary)', letterSpacing: '2px' }}>
                    {code}
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost" onClick={copyBackupCodes} style={{ width: '100%' }}>
                {copied ? '✓ Copiado!' : 'Copiar todos os códigos'}
              </button>
            </div>
          )}

          {/* DISABLE */}
          {step === 'disable' && enabled && (
            <div style={{ borderTop: '1px solid var(--border-primary)', padding: '20px', background: 'rgba(239,68,68,0.04)' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Digite o código atual do app autenticador para desabilitar o 2FA:
              </p>
              <input
                type="text" inputMode="numeric" maxLength={6} value={token}
                onChange={e => { setToken(e.target.value.replace(/\D/g, '')); setError('') }}
                placeholder="000000"
                style={{
                  width: '100%', height: '48px', textAlign: 'center',
                  fontFamily: 'var(--font-dm-mono, monospace)', fontSize: '24px', letterSpacing: '8px',
                  color: 'var(--text-primary)', background: 'var(--bg-primary)',
                  border: '1px solid var(--border-secondary)', borderRadius: '10px',
                  padding: '0', outline: 'none', boxSizing: 'border-box',
                }}
              />
              {error && <div style={{ fontSize: '13px', color: '#ef4444', marginTop: '8px' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button className="btn btn-ghost" onClick={() => { setStep('idle'); setError(''); setToken('') }} style={{ flex: 1 }}>Cancelar</button>
                <button onClick={handleDisable} disabled={submitting || token.length !== 6}
                  style={{ flex: 2, height: '40px', borderRadius: '8px', border: 'none', background: token.length === 6 ? '#ef4444' : 'var(--border-secondary)', color: 'white', fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: token.length === 6 ? 'pointer' : 'not-allowed' }}>
                  {submitting ? 'Desabilitando...' : 'Confirmar desativação'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 300 }}>
          O 2FA adiciona uma camada extra de segurança exigindo um código temporário além da sua senha ao fazer login.
          Recomendamos usar o Google Authenticator, Authy ou 1Password.
        </p>
      </div>
    </>
  )
}
