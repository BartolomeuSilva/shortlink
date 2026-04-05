'use client'

import { useUser } from '@/components/layout/UserContext'

export function ProfileCard({ fallbackName, fallbackEmail, fallbackImage, plan }: {
  fallbackName: string
  fallbackEmail: string
  fallbackImage: string | null
  plan: string
}) {
  const { name, email, image } = useUser()

  const displayName = name || fallbackName
  const displayEmail = email || fallbackEmail
  const displayImage = image || fallbackImage

  const initials = (displayName || displayEmail || '?')
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="settings-profile-card">
      <div className="settings-avatar-big">
        {displayImage ? (
          <img src={displayImage} alt={displayName || ''} />
        ) : initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.02em' }}>
          {displayName || 'Usuário'}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayEmail}
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
          letterSpacing: '0.5px', textTransform: 'uppercase',
          background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
          color: 'var(--primary)',
          border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
        }}>
          {plan}
        </span>
      </div>
    </div>
  )
}
