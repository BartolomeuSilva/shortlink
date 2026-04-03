'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTopbar } from '@/components/layout/Topbar'

interface AnalyticsData {
  chartData: { date: string; clicks: number }[]
  devices: { device: string; clicks: number }[]
  browsers: { browser: string; clicks: number }[]
  os: { os: string; clicks: number }[]
  countries: { country: string; clicks: number }[]
  referrers: { referrer: string; clicks: number }[]
  topItems: { id: string; label: string; icon: string | null; clicks: number }[]
  hourData: { hour: number; clicks: number }[]
  summary: {
    totalClicks: number
    totalItems: number
    topCountry: string
    topDevice: string
    topBrowser: string
  }
}

const COUNTRY_NAMES: Record<string, string> = {
  BR: 'Brasil', US: 'Estados Unidos', PT: 'Portugal', GB: 'Reino Unido',
  DE: 'Alemanha', FR: 'França', ES: 'Espanha', IT: 'Itália', JP: 'Japão',
  CA: 'Canadá', AU: 'Austrália', MX: 'México', AR: 'Argentina',
}

const COUNTRY_FLAGS: Record<string, string> = {
  BR: '🇧🇷', US: '🇺🇸', PT: '🇵🇹', AR: '🇦🇷', MX: '🇲🇽',
  GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', ES: '🇪🇸', CA: '🇨🇦',
  JP: '🇯🇵', CN: '🇨🇳', IN: '🇮🇳', RU: '🇷🇺', KR: '🇰🇷',
}

function getCountryName(code: string): string {
  return COUNTRY_NAMES[code] || code
}

function getDomainFromReferrer(ref: string): string {
  if (!ref || ref === 'Direct') return 'Direto'
  try { return new URL(ref).hostname.replace('www.', '') } catch { return ref }
}

export default function BioAnalyticsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)
  const topbar = useTopbar()

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/bio-pages/${id}/analytics?days=${period}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      // silent handle
    } finally {
      setLoading(false)
    }
  }, [id, period])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  useEffect(() => {
    topbar.setTitle('Analytics da Bio')
    topbar.setSubtitle(`Desempenho da sua página nos últimos ${period} dias`)
    topbar.setActions(
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select
          value={period}
          onChange={e => setPeriod(parseInt(e.target.value))}
          className="camp-input"
          style={{ width: 'auto', height: '40px', padding: '0 12px', fontSize: '13px' }}
        >
          <option value={7}>7 dias</option>
          <option value={30}>30 dias</option>
          <option value={90}>90 dias</option>
        </select>
        <Link href="/bio-pages" className="btn btn-ghost" style={{ fontSize: '13px', height: '40px' }}>
          Voltar
        </Link>
      </div>
    )
  }, [period, topbar])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Carregando dados da Bio...</div>
  
  if (!data) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <p style={{ color: '#ef4444', marginBottom: '20px' }}>Erro ao carregar dados do servidor.</p>
      <Link href="/bio-pages" className="btn btn-secondary">Voltar para Minhas Bios</Link>
    </div>
  )

  const maxChartClicks = Math.max(...data.chartData.map(d => d.clicks), 1)
  const maxHourClicks = Math.max(...data.hourData.map(d => d.clicks), 1)

  return (
    <div className="analytics-page">
      
      {/* Top 5 KPI Cards */}
      <div className="analytics-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="analytics-card">
          <div className="analytics-metric-label">Cliques Totais</div>
          <div className="analytics-metric-value">{data.summary.totalClicks.toLocaleString()}</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-metric-label">Links Ativos</div>
          <div className="analytics-metric-value" style={{ color: '#10b981' }}>{data.summary.totalItems}</div>
        </div>
        <div className="analytics-card" title={getCountryName(data.summary.topCountry)}>
          <div className="analytics-metric-label">Top País</div>
          <div className="analytics-metric-value" style={{ fontSize: '24px' }}>
            {COUNTRY_FLAGS[data.summary.topCountry] || '🌍'} {data.summary.topCountry}
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-metric-label">Top Device</div>
          <div className="analytics-metric-value" style={{ fontSize: '24px' }}>
             {data.summary.topDevice === 'Mobile' ? '📱' : '💻'} {data.summary.topDevice}
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-metric-label">Top Browser</div>
          <div className="analytics-metric-value" style={{ fontSize: '24px' }}>
            {data.summary.topBrowser === 'Chrome' ? '🌐' : '🧭'} {data.summary.topBrowser}
          </div>
        </div>
      </div>

      {/* Main Bar Chart */}
      <div className="analytics-chart-container">
        <div className="analytics-chart-header">
           <h3 className="analytics-chart-title">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20V10M18 20V4M6 20v-4" /></svg>
             Acessos Mensais
           </h3>
        </div>
        
        {data.chartData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', fontSize: '13px' }}>Sem dados no período</div>
        ) : (
          <div className="analytics-bar-wrapper">
            {data.chartData.map((d, i) => (
              <div 
                key={i} 
                className="analytics-bar" 
                style={{ height: `${(d.clicks / maxChartClicks) * 100}%` }}
                title={`${d.date}: ${d.clicks} cliques`}
              />
            ))}
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '10px', color: 'var(--text-tertiary)' }}>
           <span>{data.chartData[0]?.date}</span>
           <span>{data.chartData[data.chartData.length - 1]?.date}</span>
        </div>
      </div>

      {/* Hourly Heatmap - Premium Look */}
      <div className="analytics-chart-container">
         <div className="analytics-chart-header">
            <h3 className="analytics-chart-title">Acessos por Horário</h3>
         </div>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '6px' }}>
            {Array.from({ length: 24 }, (_, h) => {
              const hourData = data.hourData.find(d => d.hour === h)
              const clicks = hourData?.clicks || 0
              const intensity = clicks > 0 ? Math.max(clicks / maxHourClicks, 0.15) : 0
              return (
                <div key={h} style={{ textAlign: 'center' }}>
                  <div style={{
                    height: '48px', borderRadius: '8px', border: '1px solid var(--border-primary)',
                    background: intensity > 0 ? `color-mix(in srgb, var(--primary) ${intensity * 100}%, var(--bg-tertiary))` : 'var(--bg-tertiary)',
                  }} title={`${h}h: ${clicks} cliques`} />
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{h}h</div>
                </div>
              )
            })}
         </div>
      </div>

      {/* Two Column Progress Lists */}
      <div className="analytics-sub-grid">
         {/* Countries */}
         <div className="dash-card">
            <h3 className="analytics-chart-title" style={{ marginBottom: '24px' }}>Distribuição Geográfica</h3>
            {data.countries.map(d => (
              <div key={d.country} className="analytics-progress-item">
                <div className="analytics-progress-header">
                  <span className="analytics-progress-label">{COUNTRY_FLAGS[d.country] || '🌍'} {getCountryName(d.country)}</span>
                  <span className="analytics-progress-value">{d.clicks}</span>
                </div>
                <div className="analytics-progress-bar-bg">
                   <div className="analytics-progress-bar-fill" style={{ width: `${(d.clicks / (data.countries[0]?.clicks || 1)) * 100}%` }} />
                </div>
              </div>
            ))}
         </div>

         {/* Referrers */}
         <div className="dash-card">
            <h3 className="analytics-chart-title" style={{ marginBottom: '24px' }}>Origem do Tráfego</h3>
            {data.referrers.map(d => (
              <div key={d.referrer} className="analytics-progress-item">
                <div className="analytics-progress-header">
                  <span className="analytics-progress-label">🔗 {getDomainFromReferrer(d.referrer)}</span>
                  <span className="analytics-progress-value">{d.clicks}</span>
                </div>
                <div className="analytics-progress-bar-bg">
                   <div className="analytics-progress-bar-fill" style={{ width: `${(d.clicks / (data.referrers[0]?.clicks || 1)) * 100}%`, background: 'var(--primary-light)' }} />
                </div>
              </div>
            ))}
         </div>
      </div>

      {/* Top Items - Most Important for Bio */}
      <div className="dash-card" style={{ marginTop: '24px' }}>
         <h3 className="analytics-chart-title" style={{ marginBottom: '24px' }}>Links Mais Clicados na Bio</h3>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {data.topItems.map((item, idx) => {
              const maxItemClicks = data.topItems[0]?.clicks || 1
              return (
                <div key={item.id} className="analytics-progress-item">
                  <div className="analytics-progress-header">
                    <span className="analytics-progress-label" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                      <span style={{ fontSize: '18px', marginRight: '8px' }}>{item.icon || '🔗'}</span>
                      {item.label}
                    </span>
                    <span className="analytics-progress-value" style={{ fontSize: '16px' }}>{item.clicks} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-tertiary)' }}>cliques</span></span>
                  </div>
                  <div className="analytics-progress-bar-bg" style={{ height: '12px' }}>
                     <div className="analytics-progress-bar-fill" style={{ width: `${(item.clicks / maxItemClicks) * 100}%`, background: idx === 0 ? 'var(--primary)' : 'color-mix(in srgb, var(--primary) 40%, white)' }} />
                  </div>
                </div>
              )
            })}
         </div>
      </div>

      {/* Tech Stack Grid */}
      <div className="analytics-triple-grid" style={{ marginTop: '24px' }}>
         <div className="dash-card">
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Dispositivos</h3>
            {data.devices.map(d => (
              <div key={d.device} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>{d.device}</span>
                 <span style={{ fontWeight: 700 }}>{d.clicks}</span>
              </div>
            ))}
         </div>
         <div className="dash-card">
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Navegadores</h3>
            {data.browsers.map(d => (
              <div key={d.browser} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>{d.browser}</span>
                 <span style={{ fontWeight: 700 }}>{d.clicks}</span>
              </div>
            ))}
         </div>
         <div className="dash-card">
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Sistemas</h3>
            {data.os.map(d => (
              <div key={d.os} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>{d.os}</span>
                 <span style={{ fontWeight: 700 }}>{d.clicks}</span>
              </div>
            ))}
         </div>
      </div>

    </div>
  )
}
