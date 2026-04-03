'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreateLinkModal } from '@/components/links/CreateLinkModal'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { PerformanceChart } from '@/components/dashboard/PerformanceChart'
import { GeoStats } from '@/components/dashboard/GeoStats'
import { DeviceStats } from '@/components/dashboard/DeviceStats'
import { RecentLinks } from '@/components/dashboard/RecentLinks'
import { formatNumber } from '@/lib/utils'
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

export function DashboardClient({
  metrics, chartData, recentLinks, geoData, deviceData, userName,
}: DashboardClientProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [period, setPeriod] = useState<'7d' | '30d'>('30d')
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle('')
    topbar.setSubtitle(undefined)
    topbar.setActions(null)
  }, [])

  const displayData = period === '7d' ? chartData.slice(-7) : chartData
  const firstName = userName.split(' ')[0]
  const deltaType = metrics.delta > 0 ? 'positive' : metrics.delta < 0 ? 'negative' : 'neutral'
  const deltaText = metrics.delta >= 0 ? `+${metrics.delta}%` : `${metrics.delta}%`

  return (
    <>
      <div className="dash-page">
        {/* Header */}
        <DashboardHeader
          firstName={firstName}
          period={period}
          onPeriodChange={setPeriod}
        />

        {/* Metrics Row - scrollable on mobile */}
        <div className="dash-metrics-scroll">
          <div className="dash-metrics-track">
            <MetricCard
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
              label="Cliques totais"
              value={formatNumber(metrics.totalClicks)}
              sub={deltaText}
              subType={deltaType}
              accentColor="#8b5cf6"
            />
            <MetricCard
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              }
              label="Links ativos"
              value={formatNumber(metrics.activeLinks)}
              sub={`de ${metrics.totalLinks}`}
              accentColor="#6366f1"
            />
            <MetricCard
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
              label="Últimos 7 dias"
              value={formatNumber(metrics.weeklyClicks)}
              sub="esta semana"
              accentColor="#3b82f6"
            />
          </div>
        </div>

        {/* Performance Chart */}
        <PerformanceChart
          data={displayData}
          periodLabel={period === '7d' ? '7 dias' : '30 dias'}
        />

        {/* Geo + Devices - Side by side on desktop, stacked on mobile */}
        <div className="dash-section">
          <div className="dash-grid-2">
            <GeoStats data={geoData} />
            <DeviceStats data={deviceData} />
          </div>
        </div>

        {/* Recent Links */}
        <RecentLinks
          links={recentLinks}
          onCreateLink={() => setShowModal(true)}
        />

        {/* Bottom spacer for mobile nav */}
        <div className="dash-spacer" />
      </div>

      {/* FAB - Mobile only */}
      <button className="dash-fab" onClick={() => setShowModal(true)} aria-label="Novo link">
        <svg width="22" height="22" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {showModal && <CreateLinkModal onClose={() => setShowModal(false)} onSuccess={() => router.refresh()} />}
    </>
  )
}
