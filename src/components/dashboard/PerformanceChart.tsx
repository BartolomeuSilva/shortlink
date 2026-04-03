'use client'

import { ClicksChart } from '@/components/analytics/ClicksChart'

interface PerformanceChartProps {
  data: { date: string; clicks: number }[]
  periodLabel: string
}

export function PerformanceChart({ data, periodLabel }: PerformanceChartProps) {
  const totalClicks = data.reduce((sum, d) => sum + d.clicks, 0)
  const avgClicks = data.length > 0 ? Math.round(totalClicks / data.length) : 0

  return (
    <div className="dash-section">
      <div className="dash-section-header">
        <div className="dash-section-header-left">
          <h2 className="dash-section-title">Desempenho</h2>
          <span className="dash-section-badge">{periodLabel}</span>
        </div>
        <div className="dash-section-header-right">
          <div className="dash-stat-mini">
            <span className="dash-stat-mini-value">{avgClicks.toLocaleString('pt-BR')}</span>
            <span className="dash-stat-mini-label">média/dia</span>
          </div>
        </div>
      </div>
      <div className="dash-card dash-card-chart">
        <ClicksChart data={data} />
      </div>
    </div>
  )
}
