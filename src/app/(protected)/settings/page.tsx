import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { data: user, error } = await supabaseAdmin
    .from('User')
    .select('name, email, image, plan, createdAt, links:Link(count)')
    .eq('id', session.user.id)
    .single()

  if (!user || error) redirect('/login')

  const memberSince = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(user.createdAt))
  const linksCount = user.links?.[0]?.count || 0
  const initials = (user.name || user.email || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const settingsLinks = [
    {
      href: '/settings/security',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      title: 'Segurança',
      desc: 'Senha, autenticação em dois fatores',
    },
    {
      href: '/settings/api-keys',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>
      ),
      title: 'Chaves de API',
      desc: 'Gerencie tokens para integração',
    },
    {
      href: '/settings/webhooks',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
      title: 'Webhooks',
      desc: 'Notificações em tempo real para eventos',
    },
    {
      href: '/settings/domains',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      ),
      title: 'Domínios',
      desc: 'Conecte domínios personalizados',
    },
    {
      href: '/settings/pixels',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      title: 'Pixels de Rastreamento',
      desc: 'Meta, Google, TikTok e LinkedIn',
    },
  ]

  return (
    <div className="page-content">
      <div className="settings-container">

        {/* Profile Card */}
        <div className="settings-profile-card">
          <div className="settings-avatar-big">
            {user.image ? (
              <img src={user.image} alt={user.name || ''} />
            ) : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.02em' }}>
              {user.name || 'Usuário'}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
              letterSpacing: '0.5px', textTransform: 'uppercase',
              background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
              color: 'var(--primary)',
              border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
            }}>
              {user.plan}
            </span>
          </div>
        </div>

        {/* Account Details */}
        <div className="settings-info-list">
          {[
            { label: 'Nome Completo', value: user.name || 'Não informado' },
            { label: 'Email Principal', value: user.email },
            { label: 'Plano Atual', value: user.plan },
            { label: 'Links criados', value: String(linksCount) },
            { label: 'Membro desde', value: memberSince },
          ].map(row => (
            <div key={row.label} className="settings-info-row">
              <span className="settings-info-label">{row.label}</span>
              <span className="settings-info-value">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Settings Navigation */}
        <div style={{ marginTop: '32px', marginBottom: '16px' }}>
          <div className="settings-label">Configurações</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {settingsLinks.map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div className="settings-nav-item">
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                  background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                  color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{item.desc}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Hint */}
        <div className="settings-hint" style={{ marginTop: '24px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div className="settings-hint-text">
            Para alterar nome, foto ou senha, clique no seu nome no rodapé da barra lateral para abrir o <strong>Modal de Perfil</strong>.
          </div>
        </div>

      </div>
    </div>
  )
}
