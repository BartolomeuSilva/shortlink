import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'

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

  const profileRows = [
    { label: 'Nome Completo', value: user.name || 'Não informado' },
    { label: 'Email Principal', value: user.email },
    { label: 'Plano Atual', value: user.plan },
    { label: 'Total de Links', value: `${linksCount} links criados` },
    { label: 'Membro desde', value: memberSince },
  ]

  return (
    <div className="page-content">
      <PageHeader title="Configurações" subtitle="Gerencie sua conta e preferências de perfil" />

      <div className="settings-container">
        
        {/* Profile Card */}
        <div className="settings-profile-card">
          <div className="settings-avatar-big">
            {user.image ? (
              <img src={user.image} alt={user.name || ''} />
            ) : (
              (user.name || user.email || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-primary mb-1">
              {user.name || 'Usuário'}
            </h2>
            <p className="text-sm text-tertiary mb-3">
              {user.email}
            </p>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 uppercase tracking-wider">
              {user.plan}
            </span>
          </div>
        </div>

        {/* Account Information */}
        <div className="mt-8">
          <h3 className="section-title mb-4">Detalhes da Conta</h3>
          <div className="settings-info-list">
            {profileRows.map((row) => (
              <div key={row.label} className="settings-info-row">
                <span className="settings-info-label">{row.label}</span>
                <span className="settings-info-value">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hint Box */}
        <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/10 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <p className="text-sm text-secondary leading-relaxed">
            <strong>Dica:</strong> Para alterar suas informações pessoais como nome, foto ou senha, utilize a <strong>Modal de Perfil</strong> acessível pelo seu nome no rodapé da barra lateral.
          </p>
        </div>

      </div>
    </div>
  )
}
