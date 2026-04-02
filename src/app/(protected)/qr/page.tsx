'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTopbar } from '@/components/layout/Topbar'

interface LinkItem {
  id: string
  shortCode: string
  originalUrl: string
  title: string | null
}

export default function QRCodePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [links, setLinks] = useState<LinkItem[]>([])
  const [loading, setLoading] = useState(true)
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle('QR Codes')
    topbar.setSubtitle('Baixe QR Codes dos seus links')
    topbar.setActions(null)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchLinks()
    }
  }, [status, router])

  const fetchLinks = async () => {
    try {
      const res = await fetch('/api/links')
      if (res.ok) {
        const data = await res.json()
        setLinks(data.links || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const downloadQR = async (id: string, shortCode: string) => {
    const res = await fetch(`/api/links/${id}/qr?format=png`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-${shortCode}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (status === 'loading' || loading) {
    return (
      <div style={{ padding: '24px' }}>
        <p style={{ color: 'var(--text-tertiary)' }}>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="page-content">

      {links.length === 0 ? (
        <div style={{ background: 'var(--bg-secondary)', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>Nenhum link encontrado.</p>
          <a href="/links" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', marginTop: '12px', display: 'inline-block' }}>
            Criar primeiro link →
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {links.map((link) => (
            <div key={link.id} style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {link.title || link.shortCode}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {link.originalUrl}
              </p>
              <img
                src={`/api/links/${link.id}/qr?format=png`}
                alt={`QR Code for ${link.shortCode}`}
                style={{ width: '120px', height: '120px', marginBottom: '12px' }}
              />
              <button
                onClick={() => downloadQR(link.id, link.shortCode)}
                style={{
                  width: '100%', padding: '10px', fontSize: '13px', fontWeight: 500,
                  color: 'var(--primary)', background: 'var(--bg-secondary)', border: '0.5px solid var(--primary)',
                  borderRadius: '8px', cursor: 'pointer',
                }}
              >
                Baixar QR Code
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
