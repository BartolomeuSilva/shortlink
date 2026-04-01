'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { ClicksChart } from '@/components/analytics/ClicksChart'
import { CreateLinkModal } from '@/components/links/CreateLinkModal'
import { formatNumber, getBaseUrl } from '@/lib/utils'

interface DashboardClientProps {
  metrics: {
    totalClicks: number
    delta: number
    activeLinks: number
    totalLinks: number
    weeklyClicks: number
  }
  chartData: { date: string; clicks: number }[]
  recentLinks: {
    id: string
    shortCode: string
    originalUrl: string
    title: string | null
    clickCount: number
    isActive: boolean
    createdAt: string
  }[]
  geoData: { country: string; countryCode: string | null; clicks: number }[]
  deviceData: { deviceType: string; clicks: number }[]
  userName: string
}

const COUNTRY_FLAGS: Record<string, string> = {
  BR: '🇧🇷', US: '🇺🇸', PT: '🇵🇹', AR: '🇦🇷', MX: '🇲🇽',
  GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', ES: '🇪🇸', CA: '🇨🇦',
}

export function DashboardClient({
  metrics, chartData, recentLinks, geoData, deviceData, userName,
}: DashboardClientProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [period, setPeriod] = useState<'7d' | '30d'>('30d')
  const baseUrl = getBaseUrl()

  const displayData = period === '7d' ? chartData.slice(-7) : chartData

  const maxGeoClicks = geoData[0]?.clicks || 1

  return (
    <>
      {/* TOPBAR */}
      <div style={{
        background: 'var(--bg-secondary)', borderBottom: '0.5px solid rgba(0,0,0,0.07)',
        padding: '0 28px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 5,
      }}>
        <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          Dashboard
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {(['7d', '30d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                fontFamily: 'inherit', fontSize: '12px', fontWeight: 400,
                color: period === p ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: period === p ? 'var(--bg-secondary)' : '#EEEDE9',
                border: period === p ? '0.5px solid rgba(0,0,0,0.15)' : '0.5px solid rgba(0,0,0,0.08)',
                padding: '7px 12px', borderRadius: '6px', cursor: 'pointer',
              }}
            >
              {p === '7d' ? '7 dias' : '30 dias'}
            </button>
          ))}
          <button
            onClick={() => setShowModal(true)}
            style={{
              fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
              color: 'var(--bg-secondary)', background: 'var(--primary)',
              border: 'none', padding: '8px 16px', borderRadius: '6px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" stroke="var(--bg-secondary)" strokeWidth="2" fill="none">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo link
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: '28px', flex: 1 }}>
        {/* Welcome */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 300, color: 'var(--text-primary)', letterSpacing: '-0.8px' }}>
            Olá, {userName.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 300, marginTop: '4px' }}>
            Aqui está o resumo dos últimos {period === '7d' ? '7' : '30'} dias.
          </p>
        </div>

        {/* METRICS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '24px' }}>
          <MetricCard
            label="Total de cliques"
            value={formatNumber(metrics.totalClicks)}
            delta={`${metrics.delta >= 0 ? '+' : ''}${metrics.delta}%`}
            deltaType={metrics.delta >= 0 ? 'up' : 'down'}
            deltaLabel="vs. período anterior"
          />
          <MetricCard
            label="Links ativos"
            value={formatNumber(metrics.activeLinks)}
            delta={`${metrics.totalLinks} total`}
            deltaType="neutral"
          />
          <MetricCard
            label="Cliques esta semana"
            value={formatNumber(metrics.weeklyClicks)}
            delta="últimos 7 dias"
            deltaType="neutral"
          />
          <MetricCard
            label="Links criados"
            value={formatNumber(metrics.totalLinks)}
            delta="no total"
            deltaType="neutral"
          />
        </div>

        {/* CHART + GEO */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '24px' }}>
          {/* Clicks Chart */}
          <div style={{ background: 'var(--bg-secondary)', border: '0.5px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>Cliques ao longo do tempo</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 300 }}>
                  {period === '7d' ? 'Últimos 7 dias' : 'Últimos 30 dias'}
                </div>
              </div>
            </div>
            <ClicksChart data={displayData} />
          </div>

          {/* Geo */}
          <div style={{ background: 'var(--bg-secondary)', border: '0.5px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '18px' }}>Por país</div>
            {geoData.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 300, textAlign: 'center', padding: '20px 0' }}>
                Sem dados ainda
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {geoData.map((geo, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px', width: '24px', textAlign: 'center', flexShrink: 0 }}>
                      {geo.countryCode ? (COUNTRY_FLAGS[geo.countryCode] || '🌍') : '🌍'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 400 }}>{geo.country}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-dm-mono, DM Mono, monospace)' }}>
                          {formatNumber(geo.clicks)}
                        </span>
                      </div>
                      <div style={{ height: '3px', background: '#EEEDE9', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${(geo.clicks / maxGeoClicks) * 100}%`, height: '100%', background: 'var(--primary-light)', borderRadius: '99px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* DEVICE + RECENT LINKS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
          {/* Devices */}
          <div style={{ background: 'var(--bg-secondary)', border: '0.5px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '18px' }}>Por dispositivo</div>
            {deviceData.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 300, textAlign: 'center', padding: '20px 0' }}>
                Sem dados ainda
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {deviceData.map((d, i) => {
                  const total = deviceData.reduce((s, x) => s + x.clicks, 0)
                  const pct = total > 0 ? Math.round((d.clicks / total) * 100) : 0
                  const icons: Record<string, string> = { MOBILE: '📱', TABLET: '📲', DESKTOP: '🖥️', UNKNOWN: '❓' }
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {icons[d.deviceType] || '❓'}
                          {d.deviceType === 'MOBILE' ? 'Mobile' : d.deviceType === 'TABLET' ? 'Tablet' : d.deviceType === 'DESKTOP' ? 'Desktop' : 'Desconhecido'}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{pct}%</span>
                      </div>
                      <div style={{ height: '4px', background: '#EEEDE9', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: '99px' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Links */}
          <div style={{ background: 'var(--bg-secondary)', border: '0.5px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Links recentes</div>
              <Link href="/links" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 400 }}>
                Ver todos →
              </Link>
            </div>
            {recentLinks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 300, marginBottom: '12px' }}>
                  Nenhum link criado ainda
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    fontFamily: 'inherit', fontSize: '12px', fontWeight: 500,
                    color: 'var(--bg-secondary)', background: 'var(--primary)', border: 'none',
                    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                  }}
                >
                  Criar primeiro link
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {recentLinks.map((link, i) => (
                  <div key={link.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 0',
                    borderBottom: i < recentLinks.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none',
                  }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: '#EEEDE9', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '14px', flexShrink: 0,
                    }}>
                      🔗
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-dm-mono, DM Mono, monospace)', fontSize: '12px', color: 'var(--primary)', fontWeight: 500, marginBottom: '2px' }}>
                        {baseUrl}/{link.shortCode}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {link.title || link.originalUrl}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-dm-mono, DM Mono, monospace)', fontSize: '13px', color: 'var(--text-primary)' }}>
                        {formatNumber(link.clickCount)}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>cliques</span>
                    </div>
                    <Link href={`/links/${link.id}`} style={{ fontSize: '12px', color: 'var(--text-tertiary)', textDecoration: 'none' }}>
                      →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && <CreateLinkModal onClose={() => setShowModal(false)} onSuccess={() => router.refresh()} />}
    </>
  )
}
