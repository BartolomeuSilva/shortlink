'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

interface LinkItem {
  id: string
  shortCode: string
  originalUrl: string
  title: string | null
  _count: { clicks: number }
}

interface ComparisonSummary {
  id: string
  title: string | null
  shortCode: string
  originalUrl: string
  totalClicks: number
  uniqueVisitors: number
  createdAt: string
  ctr: number
}

export default function ComparePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [links, setLinks] = useState<LinkItem[]>([])
  const [comparisonData, setComparisonData] = useState<{ summary: ComparisonSummary[] } | null>(null)
  const [loading, setLoading] = useState(true)

  const linkIds = (searchParams.get('ids') || '').split(',').filter(Boolean)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      loadData()
    }
  }, [status, linkIds.length])

  const loadData = async () => {
    setLoading(true)
    try {
      const linksRes = await fetch('/api/links')
      if (linksRes.ok) {
        const data = await linksRes.json()
        setLinks(data.links || [])
      }

      if (linkIds.length > 0) {
        const compareRes = await fetch(`/api/links/compare?ids=${linkIds.join(',')}`)
        if (compareRes.ok) {
          const compareData = await compareRes.json()
          setComparisonData(compareData)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLink = (linkId: string, checked: boolean) => {
    const current = linkIds
    const newIds = checked
      ? [...current, linkId]
      : current.filter(id => id !== linkId)
    
    const url = new URL(window.location.href)
    if (newIds.length > 0) {
      url.searchParams.set('ids', newIds.join(','))
    } else {
      url.searchParams.delete('ids')
    }
    window.history.pushState({}, '', url.toString())
    setComparisonData(null)
    if (newIds.length > 0) {
      fetch(`/api/links/compare?ids=${newIds.join(',')}`)
        .then(res => res.json())
        .then(data => setComparisonData(data))
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div style={{ padding: '24px' }}>
        <p style={{ color: 'var(--text-tertiary)' }}>Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>Comparar Links</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Compare o desempenho de múltiplos links</p>
      </div>

      <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Selecione os links para comparar</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {links.map((link) => (
            <label
              key={link.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', border: '1px solid var(--border-secondary)', borderRadius: '8px',
                cursor: 'pointer', fontSize: '13px',
              }}
            >
              <input
                type="checkbox"
                checked={linkIds.includes(link.id)}
                onChange={(e) => handleToggleLink(link.id, e.target.checked)}
              />
              {link.title || link.shortCode}
            </label>
          ))}
        </div>
      </div>

      {linkIds.length > 0 && comparisonData && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Total de cliques</div>
              <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {comparisonData.summary.reduce((sum: number, l) => sum + l.totalClicks, 0)}
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Links comparados</div>
              <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)' }}>{comparisonData.summary.length}</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Média de cliques</div>
              <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {Math.round(comparisonData.summary.reduce((sum: number, l) => sum + l.totalClicks, 0) / comparisonData.summary.length)}
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Melhor performing</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-success)' }}>
                {comparisonData.summary.sort((a, b) => b.totalClicks - a.totalClicks)[0]?.title || '-'}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Comparação detalhada</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--bg-active)' }}>Link</th>
                    <th style={{ textAlign: 'right', padding: '12px', fontSize: '12px', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--bg-active)' }}>Cliques</th>
                    <th style={{ textAlign: 'right', padding: '12px', fontSize: '12px', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--bg-active)' }}>Visitantes únicos</th>
                    <th style={{ textAlign: 'right', padding: '12px', fontSize: '12px', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--bg-active)' }}>Criado em</th>
                    <th style={{ textAlign: 'right', padding: '12px', fontSize: '12px', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--bg-active)' }}>CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.summary.sort((a, b) => b.totalClicks - a.totalClicks).map((link) => (
                    <tr key={link.id}>
                      <td style={{ padding: '12px', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid var(--bg-active)' }}>
                        {link.title || link.shortCode}
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{link.originalUrl.substring(0, 40)}...</div>
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid var(--bg-active)' }}>{link.totalClicks}</td>
                      <td style={{ textAlign: 'right', padding: '12px', fontSize: '13px', borderBottom: '1px solid var(--bg-active)' }}>{link.uniqueVisitors}</td>
                      <td style={{ textAlign: 'right', padding: '12px', fontSize: '13px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--bg-active)' }}>
                        {new Date(link.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px', fontSize: '13px', color: 'var(--primary)', fontWeight: 500, borderBottom: '1px solid var(--bg-active)' }}>
                        {link.ctr}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Gráfico de comparação</h3>
            <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '0 20px' }}>
              {comparisonData.summary.sort((a, b) => b.totalClicks - a.totalClicks).map((link, i) => {
                const maxClicks = Math.max(...comparisonData.summary.map(l => l.totalClicks), 1)
                const colors = ['var(--primary)', 'var(--primary-light)', '#A09BE0', '#C8C3E8', '#E0DDF2']
                return (
                  <div key={link.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px' }}>{link.totalClicks}</div>
                    <div
                      style={{
                        width: '100%',
                        height: `${(link.totalClicks / maxClicks) * 150}px`,
                        background: colors[i % colors.length],
                        borderRadius: '8px 8px 0 0',
                      }}
                    />
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {link.title || link.shortCode}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
