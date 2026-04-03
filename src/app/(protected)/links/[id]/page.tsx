'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTopbar } from '@/components/layout/Topbar'
import RouteRulesEditor from '@/components/links/RouteRulesEditor'

interface AnalyticsData {
  summary: {
    totalClicks: number
    uniqueVisitors: number
    botClicks: number
    bounceRate: number
  }
  chartData: { date: string; clicks: number }[]
  hourlyData: { hour: number; clicks: number }[]
  clicksByCountry: { country: string; clicks: number }[]
  clicksByDevice: { device: string; clicks: number }[]
  clicksByBrowser: { browser: string; clicks: number }[]
  clicksByOS: { os: string; clicks: number }[]
  topReferers: { referer: string; clicks: number }[]
}

const COUNTRY_FLAGS: Record<string, string> = {
  BR: '🇧🇷', US: '🇺🇸', PT: '🇵🇹', AR: '🇦🇷', MX: '🇲🇽',
  GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', ES: '🇪🇸', CA: '🇨🇦',
  JP: '🇯🇵', CN: '🇨🇳', IN: '🇮🇳', RU: '🇷🇺', KR: '🇰🇷',
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

export default function LinkAnalyticsPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)
  const topbar = useTopbar()

  const exportToCSV = useCallback(() => {
    if (!data) return
    const headers = ['Data', 'Cliques']
    const rows = data.chartData.map(d => [d.date, d.clicks])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${params.id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [data, params.id])

  useEffect(() => {
    topbar.setTitle('Analytics Detalhado')
    topbar.setSubtitle('Monitoramento em tempo real do seu link')
    topbar.setActions(
      <div style={{ display: 'flex', gap: '8px' }}>
        <select
          value={period}
          onChange={(e) => setPeriod(parseInt(e.target.value))}
          className="camp-input"
          style={{ width: 'auto', height: '40px', padding: '0 12px', fontSize: '13px' }}
        >
          <option value={7}>7 dias</option>
          <option value={30}>30 dias</option>
          <option value={90}>90 dias</option>
        </select>
        <button onClick={exportToCSV} className="btn btn-ghost" style={{ fontSize: '13px', height: '40px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Exportar
        </button>
      </div>
    )
  }, [period, data, exportToCSV])

  const fetchAnalytics = useCallback(async () => {
    if (status !== 'authenticated') return
    setLoading(true)
    try {
      const res = await fetch(`/api/links/${params.id}/analytics?period=${period}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [status, period, params.id])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    else fetchAnalytics()
  }, [status, fetchAnalytics, router])

  if (status === 'loading' || loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Carregando dados estatísticos...</div>
  }

  if (!data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-tertiary)', marginBottom: '20px' }}>Não foi possível carregar os dados.</p>
        <Link href="/links" className="btn btn-secondary">← Voltar para Meus Links</Link>
      </div>
    )
  }

  const maxClicks = Math.max(...data.chartData.map(d => d.clicks), 1)
  const maxHourlyClicks = Math.max(...data.hourlyData.map(h => h.clicks), 1)
  const maxCountryClicks = Math.max(...data.clicksByCountry.map(c => c.clicks), 1)
  const maxDeviceClicks = Math.max(...data.clicksByDevice.map(d => d.clicks), 1)

  return (
    <div className="analytics-page">
      
      {/* Metrics Row */}
      <div className="analytics-metrics-grid">
        <div className="analytics-card">
          <div className="analytics-metric-label">Total de Cliques</div>
          <div className="analytics-metric-value">{data.summary.totalClicks.toLocaleString()}</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-metric-label">Visitantes Únicos</div>
          <div className="analytics-metric-value">{data.summary.uniqueVisitors.toLocaleString()}</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-metric-label">Cliques de Bots</div>
          <div className="analytics-metric-value" style={{ color: data.summary.botClicks > 0 ? '#ef4444' : 'inherit' }}>
            {data.summary.botClicks.toLocaleString()}
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-metric-label">Bounce Rate</div>
          <div className="analytics-metric-value" style={{ color: data.summary.bounceRate > 15 ? '#f59e0b' : '#10b981' }}>
            {data.summary.bounceRate}%
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="analytics-chart-container">
        <div className="analytics-chart-header">
          <h3 className="analytics-chart-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18" /><path d="M18 9l-5 5-2-2-4 4" /></svg>
            Desempenho Diário
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{period} DIAS</span>
        </div>
        
        <div className="analytics-bar-wrapper">
          {data.chartData.map((d, i) => (
            <div 
              key={i} 
              className="analytics-bar" 
              style={{ height: `${(d.clicks / maxClicks) * 100}%` }}
              title={`${d.date}: ${d.clicks} cliques`}
            />
          ))}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
          <span>{data.chartData[0]?.date}</span>
          <span>{data.chartData[data.chartData.length - 1]?.date}</span>
        </div>
      </div>

      {/* Hourly Chart */}
      <div className="analytics-chart-container">
        <div className="analytics-chart-header">
          <h3 className="analytics-chart-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            Distribuição por Horário
          </h3>
        </div>
        
        <div className="analytics-bar-wrapper" style={{ height: '140px', gap: '1px' }}>
          {data.hourlyData.map((d, i) => (
            <div 
              key={i} 
              className="analytics-bar" 
              style={{ 
                height: `${(d.clicks / maxHourlyClicks) * 100}%`,
                background: d.clicks > 0 ? 'var(--primary)' : 'var(--bg-tertiary)'
              }}
              title={`${formatHour(d.hour)}: ${d.clicks} cliques`}
            />
          ))}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <span>00:00</span>
          <span>12:00</span>
          <span>23:59</span>
        </div>
      </div>

      {/* Location & Device Grid */}
      <div className="analytics-sub-grid">
        <div className="dash-card">
          <h3 className="analytics-chart-title" style={{ marginBottom: '24px' }}>Cliques por País</h3>
          {data.clicksByCountry.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)', fontSize: '13px' }}>Nenhum dado de localização</p>
          ) : (
            data.clicksByCountry.map(({ country, clicks }) => (
              <div key={country} className="analytics-progress-item">
                <div className="analytics-progress-header">
                  <span className="analytics-progress-label">{COUNTRY_FLAGS[country] || '🌍'} {country}</span>
                  <span className="analytics-progress-value">{clicks}</span>
                </div>
                <div className="analytics-progress-bar-bg">
                  <div className="analytics-progress-bar-fill" style={{ width: `${(clicks / maxCountryClicks) * 100}%` }} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="dash-card">
          <h3 className="analytics-chart-title" style={{ marginBottom: '24px' }}>Dispositivos</h3>
          {data.clicksByDevice.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)', fontSize: '13px' }}>Nenhum dado de dispositivo</p>
          ) : (
            data.clicksByDevice.map(({ device, clicks }) => (
              <div key={device} className="analytics-progress-item">
                <div className="analytics-progress-header">
                  <span className="analytics-progress-label">
                     {device === 'Mobile' ? '📱' : device === 'Desktop' ? '💻' : '⚙️'} {device}
                  </span>
                  <span className="analytics-progress-value">{clicks}</span>
                </div>
                <div className="analytics-progress-bar-bg">
                  <div className="analytics-progress-bar-fill" style={{ width: `${(clicks / maxDeviceClicks) * 100}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Triple Info Grid */}
      <div className="analytics-triple-grid">
        <div className="dash-card">
           <h3 className="analytics-chart-title" style={{ marginBottom: '16px', fontSize: '14px' }}>Navegadores</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.clicksByBrowser.slice(0, 5).map(({ browser, clicks }) => (
                <div key={browser} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{browser}</span>
                  <span style={{ fontWeight: 700 }}>{clicks}</span>
                </div>
              ))}
           </div>
        </div>
        <div className="dash-card">
           <h3 className="analytics-chart-title" style={{ marginBottom: '16px', fontSize: '14px' }}>Sistemas</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.clicksByOS.slice(0, 5).map(({ os, clicks }) => (
                <div key={os} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{os}</span>
                  <span style={{ fontWeight: 700 }}>{clicks}</span>
                </div>
              ))}
           </div>
        </div>
        <div className="dash-card">
           <h3 className="analytics-chart-title" style={{ marginBottom: '16px', fontSize: '14px' }}>Top Referências</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.topReferers.length === 0 ? <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Acesso Direto</span> : 
               data.topReferers.slice(0, 5).map(({ referer, clicks }) => (
                <div key={referer} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{referer}</span>
                  <span style={{ fontWeight: 700 }}>{clicks}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Smart Routing & A/B Testing Section */}
      <div style={{ marginTop: '32px' }}>
        <h3 className="analytics-chart-title" style={{ marginBottom: '16px' }}>Regras de Roteamento Inteligente</h3>
        <div className="dash-card" style={{ padding: '0' }}>
           <RouteRulesEditor linkId={params.id} />
        </div>
      </div>

    </div>
  )
}
