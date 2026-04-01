'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true)
    await signIn(provider, { callbackUrl: '/dashboard' })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email: loginEmail, password: loginPassword, redirect: false })
    setLoading(false)
    if (res?.error) { setError('Email ou senha inválidos.'); return }
    router.push('/dashboard')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao criar conta.'); setLoading(false); return }
      const loginRes = await signIn('credentials', { email: regEmail, password: regPassword, redirect: false })
      if (loginRes?.error) { setError('Conta criada! Faça login.'); setTab('login'); setLoading(false); return }
      router.push('/dashboard')
    } catch { setError('Erro de conexão.'); setLoading(false) }
  }

  return (
    <div className="lp">
      {/* LEFT */}
      <div className="lp-left">
        <div className="lp-header">
          <Link href="/" className="lp-logo">
            <div className="lp-logo-icon" />
            123<span>bit</span>.app
          </Link>
          <ThemeToggle />
        </div>

        <div className="lp-tagline">
          <h2>Links mais <em>inteligentes</em><br />para o seu negócio</h2>
          <p>Analytics em tempo real, QR Codes automáticos e domínios personalizados.</p>

          <div className="lp-cards">
            {[
              { short: '123bit.app/lançamento', orig: 'empresa.com/produto/lancamento-2026', clicks: '2.4k', color: 'var(--primary)' },
              { short: '123bit.app/promo', orig: 'loja.com/black-friday/super-desconto', clicks: '891', color: 'var(--color-success)' },
              { short: '123bit.app/bio', orig: 'linktr.ee/marca', clicks: '347', color: 'var(--color-warning)' },
            ].map((card, i) => (
              <div key={i} className="lp-card">
                <span className="lp-card-dot" style={{ background: card.color }} />
                <div className="lp-card-info">
                  <div className="lp-card-short">{card.short}</div>
                  <div className="lp-card-orig">{card.orig}</div>
                </div>
                <span className="lp-card-clicks">{card.clicks} cliques</span>
              </div>
            ))}
          </div>
        </div>

        <p className="lp-footer">© 2026 123bit.app · Todos os direitos reservados</p>
      </div>

      {/* RIGHT */}
      <div className="lp-right">
        <div className="lp-form-wrap">
          {/* Mobile-only header with logo */}
          <div className="lp-mobile-header">
            <Link href="/" className="lp-logo">
              <div className="lp-logo-icon" />
              123<span>bit</span>.app
            </Link>
            <ThemeToggle />
          </div>

          <h1>{tab === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}</h1>
          <p>{tab === 'login' ? 'Entre na sua conta para continuar.' : 'Comece gratuitamente, sem cartão de crédito.'}</p>

          <div className="lp-tabs">
            {(['login', 'register'] as const).map((t) => (
              <button key={t} onClick={() => { setTab(t); setError('') }} className={`lp-tab ${tab === t ? 'active' : ''}`}>
                {t === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          <div className="lp-oauth">
            <button onClick={() => handleOAuth('google')} disabled={loading} className="lp-oauth-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button onClick={() => handleOAuth('github')} disabled={loading} className="lp-oauth-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>

          <div className="lp-divider">
            <div className="lp-divider-line" />
            <span className="lp-divider-text">ou</span>
            <div className="lp-divider-line" />
          </div>

          {error && <div className="lp-error">{error}</div>}

          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="lp-field">
                <label className="lp-label">Email</label>
                <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required placeholder="voce@email.com" className="lp-input" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <div className="lp-forgot-row">
                  <label className="lp-label">Senha</label>
                  <a href="#" className="lp-forgot">Esqueceu?</a>
                </div>
                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required placeholder="••••••••" className="lp-input" />
              </div>
              <button type="submit" disabled={loading} className="lp-submit">{loading ? 'Entrando...' : 'Entrar'}</button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="lp-field">
                <label className="lp-label">Nome</label>
                <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} required placeholder="Seu nome" className="lp-input" />
              </div>
              <div className="lp-field">
                <label className="lp-label">Email</label>
                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required placeholder="voce@email.com" className="lp-input" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label className="lp-label">Senha</label>
                <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength={8} placeholder="Mínimo 8 caracteres" className="lp-input" />
              </div>
              <button type="submit" disabled={loading} className="lp-submit">{loading ? 'Criando conta...' : 'Criar conta grátis'}</button>
              <p className="lp-terms">
                Ao criar uma conta você concorda com os <a href="#">Termos de Uso</a> e <a href="#">Política de Privacidade</a>.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
