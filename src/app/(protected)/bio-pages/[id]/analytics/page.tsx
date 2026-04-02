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
        topbar.setTitle('Analytics da Bio')
        topbar.setSubtitle(`Últimos ${period} dias`)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [id, period])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  useEffect(() => {
    topbar.setActions(
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select
          value={period}
          onChange={e => setPeriod(parseInt(e.target.value))}
          style={{ padding: '8px 12px', fontSize: '13px', border: '1px solid var(--border-secondary)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
        >
          <option value={7}>7 dias</option>
          <option value={30}>30 dias</option>
          <option value={90}>90 dias</option>
        </select>
        <Link href={`/bio?slug=${data ? '' : ''}`} className="btn btn-ghost" style={{ fontSize: '13px' }}>
          ← Editar Bio
        </Link>
      </div>
    )
  }, [period, data])

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-tertiary)' }}>Carregando analytics...</div>
  if (!data) return <div style={{ padding: '40px', color: '#ef4444' }}>Erro ao carregar dados</div>

  const maxChartClicks = Math.max(...data.chartData.map(d => d.clicks), 1)
  const maxHourClicks = Math.max(...data.hourData.map(d => d.clicks), 1)

  return (
    <>
      <div className="page-content">
        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Cliques Totais', value: data.summary.totalClicks, color: 'var(--primary)' },
            { label: 'Links Ativos', value: data.summary.totalItems, color: '#22c55e' },
            { label: 'Top País', value: getCountryName(data.summary.topCountry), color: '#f59e0b' },
            { label: 'Top Dispositivo', value: data.summary.topDevice, color: '#8b5cf6' },
            { label: 'Top Browser', value: data.summary.topBrowser, color: '#3b82f6' },
          ].map(card => (
            <div key={card.label} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 600, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Clicks chart */}
        <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '16px' }}>Cliques ao Longo do Tempo</div>
          {data.chartData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)', fontSize: '13px' }}>Nenhum clique no período</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '120px' }}>
              {data.chartData.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  {d.clicks > 0 && <span style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>{d.clicks}</span>}
                  <div style={{
                    width: '100%', maxWidth: '24px',
                    height: `${Math.max((d.clicks / maxChartClicks) * 100, 4)}%`,
                    background: 'var(--primary)',
                    borderRadius: '3px 3px 0 0',
                    transition: 'height 300ms',
                  }} />
                  <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                    {d.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hour heatmap */}
        <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '16px' }}>Cliques por Horário</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px' }}>
            {Array.from({ length: 24 }, (_, h) => {
              const hourData = data.hourData.find(d => d.hour === h)
              const clicks = hourData?.clicks || 0
              const intensity = clicks > 0 ? Math.max(clicks / maxHourClicks, 0.15) : 0
              return (
                <div key={h} style={{ textAlign: 'center' }}>
                  <div style={{
                    height: '40px', borderRadius: '4px',
                    background: intensity > 0 ? `rgba(139,92,246,${intensity})` : 'var(--bg-primary)',
                    marginBottom: '4px',
                  }} title={`${h}h: ${clicks} cliques`} />
                  <div style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>{h}h</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Two column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Devices */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '16px' }}>Dispositivos</div>
            {data.devices.length === 0 ? (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Sem dados</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.devices.map(d => (
                  <div key={d.device}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{d.device}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{d.clicks}</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(d.clicks / (data.devices[0]?.clicks || 1)) * 100}%`, background: '#8b5cf6', borderRadius: '2px' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Browsers */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '16px' }}>Navegadores</div>
            {data.browsers.length === 0 ? (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Sem dados</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.browsers.map(d => (
                  <div key={d.browser}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{d.browser}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{d.clicks}</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(d.clicks / (data.browsers[0]?.clicks || 1)) * 100}%`, background: '#3b82f6', borderRadius: '2px' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OS */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '16px' }}>Sistemas Operacionais</div>
            {data.os.length === 0 ? (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Sem dados</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.os.map(d => (
                  <div key={d.os}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{d.os}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{d.clicks}</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(d.clicks / (data.os[0]?.clicks || 1)) * 100}%`, background: '#22c55e', borderRadius: '2px' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Countries */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '16px' }}>Países</div>
            {data.countries.length === 0 ? (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Sem dados</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.countries.map(d => (
                  <div key={d.country}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{getCountryName(d.country)}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{d.clicks}</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(d.clicks / (data.countries[0]?.clicks || 1)) * 100}%`, background: '#f59e0b', borderRadius: '2px' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Referrers */}
        <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '16px' }}>Fontes de Tráfego</div>
          {data.referrers.length === 0 ? (
            <div style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Sem dados</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.referrers.map(d => (
                <div key={d.referrer}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{getDomainFromReferrer(d.referrer)}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{d.clicks}</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(d.clicks / (data.referrers[0]?.clicks || 1)) * 100}%`, background: '#ec4899', borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top items */}
        <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '16px' }}>Links Mais Clicados</div>
          {data.topItems.length === 0 ? (
            <div style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Sem dados</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.topItems.map((item, idx) => {
                const totalItemClicks = data.topItems.reduce((s, i) => s + i.clicks, 0) || 1
                const pct = Math.round((item.clicks / totalItemClicks) * 100)
                return (
                  <div key={item.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                        {item.icon} {item.label}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{item.clicks} ({pct}%)</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(item.clicks / (data.topItems[0]?.clicks || 1)) * 100}%`,
                        background: idx === 0 ? 'var(--primary)' : 'var(--text-tertiary)',
                        borderRadius: '2px',
                        opacity: idx === 0 ? 1 : 0.5,
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
