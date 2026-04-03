'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getBaseUrl } from '@/lib/utils'

export default function LandingPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [shortUrl, setShortUrl] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [inputFocused, setInputFocused] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const spotlightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (spotlightRef.current) {
        spotlightRef.current.style.left = e.clientX + 'px'
        spotlightRef.current.style.top = e.clientY + 'px'
      }
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2800)
  }

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError('')
    setShortUrl('')

    try {
      const res = await fetch('/api/links/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalUrl: url }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao encurtar o link.')
        return
      }

      const short = `${getBaseUrl()}/${data.shortCode}`
      setShortUrl(short)
      showToast('✓ Link encurtado com sucesso!')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl)
    setCopied(true)
    showToast('✓ Link copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  const faqs = [
    {
      q: 'Os links criados no plano Free expiram?',
      a: 'Não. Links criados no plano Free não expiram automaticamente. Você pode manter até 50 links ativos simultaneamente. Links com expiração manual (definida por você) são suportados em todos os planos.',
    },
    {
      q: 'Posso usar meu próprio domínio?',
      a: 'Sim, nos planos Pro e Enterprise. Basta apontar um CNAME do seu domínio para nosso servidor e o sistema provisiona o SSL automaticamente via Let\'s Encrypt. A verificação leva menos de 5 minutos.',
    },
    {
      q: 'Como funciona a contagem de cliques?',
      a: 'Cada acesso único ao seu link curto conta como um clique. Rastreamos IP (anonimizado por LGPD), dispositivo, navegador, sistema operacional, país, cidade e referrer. Bot e crawler filtering está ativo por padrão.',
    },
    {
      q: 'O redirect é rápido mesmo com analytics?',
      a: 'Sim. O redirect acontece via cache Redis com latência menor que 50ms (p95). O analytics é processado de forma assíncrona via fila, sem impacto algum na velocidade do redirect.',
    },
    {
      q: 'O 123bit.app é compatível com LGPD?',
      a: 'Sim. Anonimizamos IPs antes de armazenar, oferecemos política de retenção configurável e mantemos logs de auditoria para ações críticas. Nossa política de privacidade detalha todos os dados coletados e como são tratados.',
    },
  ]

  return (
    <>
      {/* Background Effects */}
      <div className="bg-gradient" />
      <div className="bg-grid" />
      <div className="spotlight" ref={spotlightRef} />

      {/* Landing Content */}
      <div className="landing">
        {/* NAV */}
        <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
          <Link href="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/Logo-123bit.png" alt="123bit Logo" style={{ height: '32px', width: 'auto' }} />
          </Link>
          <div className="nav-links">
            <a className="nav-link" href="#features">Funcionalidades</a>
            <a className="nav-link" href="#pricing">Preços</a>
            <a className="nav-link" href="#faq">FAQ</a>
          </div>
          <div className="nav-actions">
            <Link href="/login" className="btn-ghost">Entrar</Link>
            <Link href="/login" className="btn-primary">Começar grátis</Link>
          </div>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            Novo: QR Codes com branding personalizado
          </div>
          <h1>Links curtos,<br /><em>analytics que transformam</em></h1>
          <p>Encurte URLs, rastreie cada clique em tempo real e tome decisões baseadas em dados com uma plataforma elegante e poderosa.</p>

          <form onSubmit={handleShorten}>
            <div className={`shortener-wrapper ${inputFocused ? 'focused' : ''}`}>
              <div className="shortener-box">
                <input
                  className="shortener-input"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="Cole sua URL longa aqui..."
                  autoComplete="off"
                />
                <button type="submit" className="btn-shorten" disabled={loading}>
                  {loading ? 'Encurtando...' : 'Encurtar agora'}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <p style={{ color: '#ef5350', fontSize: 13, marginTop: 12 }}>{error}</p>
          )}

          {shortUrl && (
            <div className="result-box">
              <span className="result-short">{shortUrl}</span>
              <button className="btn-copy" onClick={handleCopy}>
                {copied ? 'Copiado!' : 'Copiar link'}
              </button>
            </div>
          )}

          <p className="hero-note">
            Sem cadastro para uso básico • <Link href="/login">Crie uma conta</Link> para analytics completos
          </p>

          {/* SOCIAL PROOF */}
          <div className="social-proof">
            <div className="proof-item">
              <div className="proof-value">10M+</div>
              <div className="proof-label">Links criados</div>
            </div>
            <div className="proof-sep" />
            <div className="proof-item">
              <div className="proof-value">500k+</div>
              <div className="proof-label">Usuários ativos</div>
            </div>
            <div className="proof-sep" />
            <div className="proof-item">
              <div className="proof-value">&lt;50ms</div>
              <div className="proof-label">Redirect</div>
            </div>
            <div className="proof-sep" />
            <div className="proof-item">
              <div className="proof-value">99.9%</div>
              <div className="proof-label">Uptime</div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="section" id="features">
          <div className="section-header">
            <div className="section-label">Funcionalidades</div>
            <div className="section-title">Tudo que você precisa para<br />dominar seus links</div>
            <div className="section-sub">Do encurtamento instantâneo até analytics empresariais com IA.</div>
          </div>

          <div className="features-grid">
            <div className="feature-card reveal">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
              </div>
              <div className="feature-title">Alias personalizados</div>
              <div className="feature-desc">Defina exatamente como sua URL curta ficará. Ex: 123bit.app/meu-produto em vez de códigos aleatórios.</div>
            </div>

            <div className="feature-card reveal">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24"><path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 5-5" /></svg>
              </div>
              <div className="feature-title">Analytics em tempo real</div>
              <div className="feature-desc">Acompanhe cliques, dispositivos, geolocalização e origem do tráfego com dashboards interativos.</div>
            </div>

            <div className="feature-card reveal">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24"><rect x="3" y="3" width="5" height="5" rx="1" /><rect x="16" y="3" width="5" height="5" rx="1" /><rect x="3" y="16" width="5" height="5" rx="1" /><path d="M21 16h-5v5" /><path d="M16 16h.01" /></svg>
              </div>
              <div className="feature-title">QR Code automático</div>
              <div className="feature-desc">Cada link gera automaticamente um QR Code em SVG/PNG, pronto para campanhas impressas.</div>
            </div>

            <div className="feature-card reveal">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
              <div className="feature-title">Links com senha</div>
              <div className="feature-desc">Proteja o destino dos seus links com senha. Ideal para conteúdo exclusivo ou acesso controlado.</div>
            </div>

            <div className="feature-card reveal">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41" /></svg>
              </div>
              <div className="feature-title">Domínio customizado</div>
              <div className="feature-desc">Use seu próprio domínio como base para links curtos. SSL automático via Let's Encrypt incluso.</div>
            </div>

            <div className="feature-card reveal">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24"><path d="M8 9l3 3-3 3" /><path d="M13 15h3" /><rect x="2" y="4" width="20" height="16" rx="2" /></svg>
              </div>
              <div className="feature-title">API pública</div>
              <div className="feature-desc">Integre o 123bit.app diretamente na sua stack via REST API. Documentação completa e SDKs disponíveis.</div>
            </div>
          </div>
        </section>

        {/* ANALYTICS PREVIEW */}
        <div className="analytics-preview reveal">
          <div className="preview-text">
            <div className="section-label">Analytics</div>
            <div className="section-title">Dados que você<br />realmente usa</div>
            <div className="section-sub">Saiba de onde vêm seus cliques, em que dispositivo, qual país e muito mais — tudo em tempo real.</div>
            <div className="preview-features">
              <div className="preview-feat">Cliques por hora, dia, semana ou mês</div>
              <div className="preview-feat">Geolocalização por país e cidade</div>
              <div className="preview-feat">Breakdown de dispositivo, OS e navegador</div>
              <div className="preview-feat">Rastreamento de referrer (origem do clique)</div>
              <div className="preview-feat">Exportação em CSV ou JSON</div>
            </div>
          </div>
          <div className="preview-visual">
            <div className="mini-metric">
              <div>
                <div style={{ fontSize: 11, color: '#71717a', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>Cliques (7 dias)</div>
                <div className="mini-value">12.847</div>
              </div>
              <div className="mini-delta">+18%</div>
            </div>
            <div className="mini-bars">
              <div className="mini-bar" style={{ height: '35%' }} />
              <div className="mini-bar" style={{ height: '50%' }} />
              <div className="mini-bar" style={{ height: '42%' }} />
              <div className="mini-bar" style={{ height: '68%' }} />
              <div className="mini-bar" style={{ height: '55%' }} />
              <div className="mini-bar" style={{ height: '80%' }} />
              <div className="mini-bar peak" style={{ height: '100%' }} />
            </div>
            <div className="mini-geo">
              <div className="mini-geo-item">
                <span>🇧🇷</span>
                <span style={{ flex: '0 0 65px', fontWeight: 400 }}>Brasil</span>
                <div className="mini-geo-bar-wrap"><div className="mini-geo-bar" style={{ width: '72%' }} /></div>
                <span style={{ fontFamily: "'DM Mono', monospace", minWidth: 36, textAlign: 'right', fontWeight: 500 }}>72%</span>
              </div>
              <div className="mini-geo-item">
                <span>🇵🇹</span>
                <span style={{ flex: '0 0 65px', fontWeight: 400 }}>Portugal</span>
                <div className="mini-geo-bar-wrap"><div className="mini-geo-bar" style={{ width: '11%' }} /></div>
                <span style={{ fontFamily: "'DM Mono', monospace", minWidth: 36, textAlign: 'right', fontWeight: 500 }}>11%</span>
              </div>
              <div className="mini-geo-item">
                <span>🇺🇸</span>
                <span style={{ flex: '0 0 65px', fontWeight: 400 }}>EUA</span>
                <div className="mini-geo-bar-wrap"><div className="mini-geo-bar" style={{ width: '7%' }} /></div>
                <span style={{ fontFamily: "'DM Mono', monospace", minWidth: 36, textAlign: 'right', fontWeight: 500 }}>7%</span>
              </div>
            </div>
          </div>
        </div>

        {/* PRICING */}
        <section className="section" id="pricing" style={{ paddingBottom: 0 }}>
          <div className="section-header">
            <div className="section-label">Preços</div>
            <div className="section-title">Planos simples e transparentes</div>
            <div className="section-sub">Comece grátis. Faça upgrade quando precisar de mais poder.</div>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card reveal">
              <div className="plan-name">Free</div>
              <div className="plan-price">R$ 0</div>
              <div className="plan-period">para sempre</div>
              <div className="plan-divider" />
              <div className="plan-features">
                <div className="plan-feat"><span className="plan-feat-dot" />50 links ativos</div>
                <div className="plan-feat"><span className="plan-feat-dot" />1.000 cliques/mês</div>
                <div className="plan-feat"><span className="plan-feat-dot" />Analytics básico (30 dias)</div>
                <div className="plan-feat"><span className="plan-feat-dot" />QR Code básico</div>
                <div className="plan-feat muted"><span className="plan-feat-dot" />Domínio customizado</div>
                <div className="plan-feat muted"><span className="plan-feat-dot" />API access</div>
              </div>
              <Link href="/login" className="btn-plan">Começar grátis</Link>
            </div>

            <div className="pricing-card featured reveal">
              <div className="featured-badge">★ Mais popular</div>
              <div className="plan-name">Pro</div>
              <div className="plan-price">R$ 29</div>
              <div className="plan-period">/mês · cobrado mensalmente</div>
              <div className="plan-divider" />
              <div className="plan-features">
                <div className="plan-feat"><span className="plan-feat-dot" />5.000 links ativos</div>
                <div className="plan-feat"><span className="plan-feat-dot" />100.000 cliques/mês</div>
                <div className="plan-feat"><span className="plan-feat-dot" />Analytics completo (1 ano)</div>
                <div className="plan-feat"><span className="plan-feat-dot" />1 domínio customizado + SSL</div>
                <div className="plan-feat"><span className="plan-feat-dot" />QR Code customizável</div>
                <div className="plan-feat"><span className="plan-feat-dot" />API 1.000 req/hora</div>
                <div className="plan-feat"><span className="plan-feat-dot" />Exportar dados (CSV)</div>
              </div>
              <Link href="/login" className="btn-plan featured">Assinar Pro</Link>
            </div>

            <div className="pricing-card reveal">
              <div className="plan-name">Enterprise</div>
              <div className="plan-price">R$ 99</div>
              <div className="plan-period">/mês · cobrado mensalmente</div>
              <div className="plan-divider" />
              <div className="plan-features">
                <div className="plan-feat"><span className="plan-feat-dot" />Links ilimitados</div>
                <div className="plan-feat"><span className="plan-feat-dot" />Cliques ilimitados</div>
                <div className="plan-feat"><span className="plan-feat-dot" />Analytics ilimitado</div>
                <div className="plan-feat"><span className="plan-feat-dot" />10 domínios customizados</div>
                <div className="plan-feat"><span className="plan-feat-dot" />QR Code com logo</div>
                <div className="plan-feat"><span className="plan-feat-dot" />API 10.000 req/hora</div>
                <div className="plan-feat"><span className="plan-feat-dot" />CSV + JSON + Webhooks</div>
                <div className="plan-feat"><span className="plan-feat-dot" />Suporte prioritário + SLA</div>
              </div>
              <Link href="/login" className="btn-plan">Falar com vendas</Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section" id="faq" style={{ paddingTop: 100 }}>
          <div className="section-header">
            <div className="section-label">FAQ</div>
            <div className="section-title">Perguntas frequentes</div>
          </div>

          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {faq.q}
                  <svg className="faq-icon" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                </button>
                <div className="faq-a">{faq.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="cta-section reveal">
          <h2>Pronto para transformar seus links?</h2>
          <p>Crie sua conta grátis em segundos. Sem cartão de crédito. Cancele quando quiser.</p>
          <div className="cta-actions">
            <Link href="/login" className="btn-cta-primary">Criar conta grátis</Link>
            <a href="#pricing" className="btn-cta-ghost">Ver planos</a>
          </div>
        </div>

        {/* FOOTER */}
        <footer>
          <div className="footer-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/Logo-123bit.png" alt="123bit Logo" style={{ height: '24px', width: 'auto', opacity: 0.8 }} />
          </div>
          <div className="footer-links">
            <a className="footer-link" href="#">Termos de uso</a>
            <a className="footer-link" href="#">Privacidade</a>
            <a className="footer-link" href="#">Status</a>
            <a className="footer-link" href="#">Docs API</a>
            <a className="footer-link" href="#">Blog</a>
          </div>
          <div className="footer-copy">© 2026 123bit.app</div>
        </footer>

        {/* TOAST */}
        <div className={`toast ${toastVisible ? 'show' : ''}`}>{toast}</div>
      </div>
    </>
  )
}
