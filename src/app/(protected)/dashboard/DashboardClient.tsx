'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { ClicksChart } from '@/components/analytics/ClicksChart'
import { CreateLinkModal } from '@/components/links/CreateLinkModal'
import { formatNumber, getBaseUrl } from '@/lib/utils'
import { useTopbar } from '@/components/layout/Topbar'

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
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle('Dashboard')
    topbar.setSubtitle(undefined)
    topbar.setActions(
      <>
        <div className="period-selector">
          {(['7d', '30d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`period-btn ${period === p ? 'active' : ''}`}
            >
              {p === '7d' ? '7 dias' : '30 dias'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo link
        </button>
      </>
    )
  }, [period])

  const displayData = period === '7d' ? chartData.slice(-7) : chartData
  const maxGeoClicks = geoData[0]?.clicks || 1

  return (
    <>
      {/* CONTENT */}
      <div className="page-content">
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
        <div className="analytics-grid">
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
        <div className="dash-chart-grid">
          {/* Clicks Chart */}
          <div className="analytics-chart-card">
            <div style={{ marginBottom: '18px' }}>
              <div className="analytics-chart-title">Cliques ao longo do tempo</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 300 }}>
                {period === '7d' ? 'Últimos 7 dias' : 'Últimos 30 dias'}
              </div>
            </div>
            <ClicksChart data={displayData} />
          </div>

          {/* Geo */}
          <div className="analytics-breakdown">
            <div className="analytics-breakdown-title">Por país</div>
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
                      <div className="analytics-breakdown-bar">
                        <div className="analytics-breakdown-bar-fill" style={{ width: `${(geo.clicks / maxGeoClicks) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* DEVICE + RECENT LINKS */}
        <div className="dash-device-grid">
          {/* Devices */}
          <div className="analytics-breakdown">
            <div className="analytics-breakdown-title">Por dispositivo</div>
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
                      <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #6366f1)', borderRadius: '99px' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Links */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div className="analytics-chart-title">Links recentes</div>
              <Link href="/links" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 400 }}>
                Ver todos →
              </Link>
            </div>
            {recentLinks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔗</div>
                <div className="empty-state-title">Nenhum link criado ainda</div>
                <div className="empty-state-desc">Crie seu primeiro link para começar a rastrear cliques.</div>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn btn-primary"
                  style={{ marginTop: '16px' }}
                >
                  Criar primeiro link
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {recentLinks.map((link, i) => (
                  <div key={link.id} className="recent-link">
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: 'var(--bg-hover)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '14px', flexShrink: 0,
                    }}>
                      🔗
                    </div>
                    <div className="recent-link-info">
                      <div className="recent-link-short">
                        {baseUrl}/{link.shortCode}
                      </div>
                      <div className="recent-link-orig">
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
