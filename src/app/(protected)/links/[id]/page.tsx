'use client'

import { useEffect, useState, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

interface AnalyticsPageProps {
  params: Promise<{ id: string }>
}

const COUNTRY_FLAGS: Record<string, string> = {
  BR: '🇧🇷', US: '🇺🇸', PT: '🇵🇹', AR: '🇦🇷', MX: '🇲🇽',
  GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', ES: '🇪🇸', CA: '🇨🇦',
  JP: '🇯🇵', CN: '🇨🇳', IN: '🇮🇳', RU: '🇷🇺', KR: '🇰🇷',
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

export default function LinkAnalyticsPage({ params }: AnalyticsPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const resolvedParams = use(params)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchAnalytics()
    }
  }, [status, router, period, resolvedParams.id])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/links/${resolvedParams.id}/analytics?period=${period}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!data) return

    const headers = ['Data', 'Cliques']
    const rows = data.chartData.map(d => [d.date, d.clicks])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${resolvedParams.id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (status === 'loading' || loading) {
    return (
      <div style={{ padding: '24px' }}>
        <p style={{ color: 'var(--text-tertiary)' }}>Carregando analytics...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ padding: '24px' }}>
        <Link href="/links" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none' }}>
          ← Voltar para Meus Links
        </Link>
        <p style={{ marginTop: '16px', color: 'var(--text-tertiary)' }}>Erro ao carregar analytics</p>
      </div>
    )
  }

  const maxClicks = Math.max(...data.chartData.map(d => d.clicks), 1)
  const maxCountryClicks = Math.max(...data.clicksByCountry.map(c => c.clicks), 1)
  const maxDeviceClicks = Math.max(...data.clicksByDevice.map(d => d.clicks), 1)

  return (
    <div style={{ padding: '24px' }}>
      <Link
        href="/links"
        style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', marginBottom: '16px', display: 'inline-block' }}
      >
        ← Voltar para Meus Links
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-primary)' }}>Analytics</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Analytics detalhado do link</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={period}
            onChange={(e) => setPeriod(parseInt(e.target.value))}
            style={{ padding: '8px 12px', fontSize: '13px', border: '1px solid var(--border-secondary)', borderRadius: '8px', background: 'var(--bg-secondary)' }}
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
          <button
            onClick={exportToCSV}
            style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: 'var(--primary)', background: 'var(--bg-secondary)', border: '1px solid var(--primary)', borderRadius: '8px', cursor: 'pointer' }}
          >
            Exportar CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Total de cliques</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)' }}>{data.summary.totalClicks}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Visitantes únicos</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)' }}>{data.summary.uniqueVisitors}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Cliques de bots</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: data.summary.botClicks > 0 ? 'var(--color-warning)' : 'var(--text-primary)' }}>{data.summary.botClicks}</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Taxa de bots</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: data.summary.bounceRate > 10 ? 'var(--color-warning)' : 'var(--color-success)' }}>{data.summary.bounceRate}%</div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Cliques por dia</h3>
        <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
          {data.chartData.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '100%',
                  height: `${(d.clicks / maxClicks) * 180}px`,
                  background: 'var(--primary)',
                  borderRadius: '4px 4px 0 0',
                  minHeight: d.clicks > 0 ? '4px' : 0,
                }}
                title={`${d.date}: ${d.clicks} cliques`}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
          <span>{data.chartData[0]?.date}</span>
          <span>{data.chartData[data.chartData.length - 1]?.date}</span>
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Cliques por horário do dia</h3>
        <div style={{ height: '150px', display: 'flex', alignItems: 'flex-end', gap: '1px' }}>
          {data.hourlyData.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '100%',
                  height: `${(d.clicks / (Math.max(...data.hourlyData.map(h => h.clicks), 1))) * 130}px`,
                  background: d.clicks > 0 ? 'var(--primary-light)' : 'var(--bg-active)',
                  borderRadius: '2px 2px 0 0',
                  minHeight: d.clicks > 0 ? '2px' : 0,
                }}
                title={`${formatHour(d.hour)}: ${d.clicks} cliques`}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
          <span>00:00</span>
          <span>12:00</span>
          <span>23:59</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Por país</h3>
          {data.clicksByCountry.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Nenhum dado disponível</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.clicksByCountry.map(({ country, clicks }) => (
                <div key={country}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px' }}>{COUNTRY_FLAGS[country] || '🌍'} {country}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{clicks}</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(clicks / maxCountryClicks) * 100}%`, background: 'var(--primary)', borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Por dispositivo</h3>
          {data.clicksByDevice.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Nenhum dado disponível</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.clicksByDevice.map(({ device, clicks }) => (
                <div key={device}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px' }}>{device}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{clicks}</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(clicks / maxDeviceClicks) * 100}%`, background: 'var(--primary)', borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Navegadores</h3>
          {data.clicksByBrowser.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Nenhum dado</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.clicksByBrowser.slice(0, 5).map(({ browser, clicks }) => (
                <div key={browser} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{browser}</span>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{clicks}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Sistemas operacionais</h3>
          {data.clicksByOS.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Nenhum dado</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.clicksByOS.slice(0, 5).map(({ os, clicks }) => (
                <div key={os} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{os}</span>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{clicks}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Referências</h3>
          {data.topReferers.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Nenhum dado</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.topReferers.map(({ referer, clicks }) => (
                <div key={referer} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>{referer}</span>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{clicks}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
