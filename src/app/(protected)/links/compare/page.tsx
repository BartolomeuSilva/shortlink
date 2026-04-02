'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTopbar } from '@/components/layout/Topbar'

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
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle('Comparar Links')
    topbar.setSubtitle('Compare o desempenho de múltiplos links')
    topbar.setActions(null)
  }, [])

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
      <div className="page-content">
        <p style={{ color: 'var(--text-tertiary)' }}>Carregando...</p>
      </div>
    )
  }

  return (
    <>
      <div className="page-content">
        {/* Link Selector */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px', color: 'var(--text-primary)' }}>
            Selecione os links para comparar
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {links.map((link) => {
              const selected = linkIds.includes(link.id)
              return (
                <label
                  key={link.id}
                  className={`btn ${selected ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => handleToggleLink(link.id, e.target.checked)}
                    style={{ marginRight: '6px', accentColor: '#8b5cf6' }}
                  />
                  {link.title || link.shortCode}
                </label>
              )
            })}
          </div>
        </div>

        {linkIds.length > 0 && comparisonData && (
          <>
            {/* Summary Cards */}
            <div className="analytics-grid">
              <div className="metric-card">
                <div className="metric-label">Total de cliques</div>
                <div className="metric-value">
                  {comparisonData.summary.reduce((sum: number, l) => sum + l.totalClicks, 0)}
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Links comparados</div>
                <div className="metric-value">{comparisonData.summary.length}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Média de cliques</div>
                <div className="metric-value">
                  {Math.round(comparisonData.summary.reduce((sum: number, l) => sum + l.totalClicks, 0) / comparisonData.summary.length)}
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Melhor performing</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-success)', marginTop: '8px' }}>
                  {comparisonData.summary.sort((a, b) => b.totalClicks - a.totalClicks)[0]?.title || '-'}
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="table-wrap" style={{ marginBottom: '24px' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Link</th>
                    <th style={{ textAlign: 'right' }}>Cliques</th>
                    <th style={{ textAlign: 'right' }}>Visitantes únicos</th>
                    <th style={{ textAlign: 'right' }}>Criado em</th>
                    <th style={{ textAlign: 'right' }}>CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.summary.sort((a, b) => b.totalClicks - a.totalClicks).map((link) => (
                    <tr key={link.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{link.title || link.shortCode}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          {link.originalUrl.substring(0, 40)}...
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>{link.totalClicks}</td>
                      <td style={{ textAlign: 'right' }}>{link.uniqueVisitors}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {new Date(link.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 500 }}>
                        {link.ctr}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bar Chart */}
            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '24px', color: 'var(--text-primary)' }}>
                Gráfico de comparação
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '0 8px', height: '200px' }}>
                {comparisonData.summary.sort((a, b) => b.totalClicks - a.totalClicks).map((link, i) => {
                  const maxClicks = Math.max(...comparisonData.summary.map(l => l.totalClicks), 1)
                  const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe']
                  return (
                    <div key={link.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
                        {link.totalClicks}
                      </div>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '80px',
                          height: `${(link.totalClicks / maxClicks) * 140}px`,
                          background: colors[i % colors.length],
                          borderRadius: '8px 8px 0 0',
                          transition: 'height 300ms ease',
                        }}
                      />
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '8px', textAlign: 'center', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {link.title || link.shortCode}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {linkIds.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">Selecione links para comparar</div>
            <div className="empty-state-desc">
              Escolha dois ou mais links acima para ver uma comparação detalhada de desempenho.
            </div>
          </div>
        )}
      </div>
    </>
  )
}
