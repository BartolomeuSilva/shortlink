import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      plan: true,
      createdAt: true,
      _count: { select: { links: true } },
    },
  })

  if (!user) redirect('/login')

  const memberSince = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(user.createdAt)

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Configurações</div>
          <div className="page-subtitle">Gerencie sua conta e preferências</div>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: '640px' }}>
        {/* Profile card */}
        <div className="card" style={{ marginBottom: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))',
              border: '2px solid var(--border-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: 500, color: '#8b5cf6', overflow: 'hidden',
            }}>
              {user.image
                ? <img src={user.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : (user.name || user.email || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                {user.name || 'Sem nome'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{user.email}</div>
              <div style={{ marginTop: '8px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '99px',
                  background: 'rgba(139,92,246,0.1)', color: '#8b5cf6',
                  border: '0.5px solid rgba(139,92,246,0.2)',
                }}>
                  {user.plan}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account info */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
            Informações da conta
          </div>
          <div className="card" style={{ padding: '0' }}>
            {[
              { label: 'Nome', value: user.name || '—' },
              { label: 'Email', value: user.email },
              { label: 'Plano', value: user.plan },
              { label: 'Links criados', value: String(user._count.links) },
              { label: 'Membro desde', value: memberSince },
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border-primary)' : 'none',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '12px', fontWeight: 300 }}>
          Para alterar nome, foto ou senha, clique no seu perfil na barra lateral.
        </p>
      </div>
    </>
  )
}
