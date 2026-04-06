'use client'

import { useState } from 'react'

interface BioItem {
  id: string
  label: string
  url: string
  icon: string | null
  clicks: number
}

interface BioData {
  slug: string
  title: string | null
  bio: string | null
  profileImage: string | null
  theme: string
  accentColor: string
  items: BioItem[]
}

export default function BioPageClient({ bio }: { bio: BioData }) {
  const [clicked, setClicked] = useState<Record<string, boolean>>({})

  const isDark = bio.theme !== 'light'
  const isPurple = bio.theme === 'purple'

  const bg = isPurple
    ? 'linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)'
    : isDark ? '#0f0f0f' : '#f5f5f5'

  const cardBg = isPurple
    ? 'rgba(255,255,255,0.08)'
    : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'

  const cardBorder = isDark || isPurple ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
  const textColor = isDark || isPurple ? '#ffffff' : '#1a1a1a'
  const subColor = isDark || isPurple ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'

  const handleClick = async (item: BioItem) => {
    if (clicked[item.id]) return
    setClicked(prev => ({ ...prev, [item.id]: true }))
    fetch('/api/bio/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id }),
    }).catch(() => {})
    window.open(item.url, '_blank', 'noopener')
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 80px' }}>
      {/* Avatar */}
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%', marginBottom: '16px',
        background: bio.accentColor,
        border: `3px solid ${bio.accentColor}`,
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '28px', fontWeight: 600, color: 'white',
      }}>
        {bio.profileImage ? (
          <img src={bio.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          (bio.title || bio.slug)[0].toUpperCase()
        )}
      </div>

      {/* Name */}
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: textColor, marginBottom: bio.bio ? '6px' : '24px', textAlign: 'center', letterSpacing: '-0.5px' }}>
        {bio.title || `@${bio.slug}`}
      </h1>

      {/* Bio */}
      {bio.bio && (
        <p style={{ fontSize: '14px', color: subColor, textAlign: 'center', maxWidth: '320px', marginBottom: '28px', lineHeight: '1.6' }}>
          {bio.bio}
        </p>
      )}

      {/* Links */}
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {bio.items.map(item => (
          <button
            key={item.id}
            onClick={() => handleClick(item)}
            style={{
              width: '100%', padding: '16px 20px', borderRadius: '14px',
              background: clicked[item.id] ? bio.accentColor : cardBg,
              border: `1px solid ${clicked[item.id] ? bio.accentColor : cardBorder}`,
              color: clicked[item.id] ? 'white' : textColor,
              fontFamily: 'inherit', fontSize: '15px', fontWeight: 500,
              cursor: 'pointer', textAlign: 'center',
              transition: 'transform 120ms, background 120ms',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.01)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
          >
            {item.icon && <span style={{ marginRight: '8px' }}>{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '40px', fontSize: '12px', color: subColor, opacity: 0.6 }}>
        Criado com <a href="https://123bit.app" target="_blank" rel="noopener noreferrer" style={{ color: bio.accentColor, fontWeight: 500, textDecoration: 'none' }}>123bit</a>
      </div>
    </div>
  )
}
