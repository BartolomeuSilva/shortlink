'use client'

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  subType?: 'positive' | 'negative' | 'neutral'
  accentColor?: string
}

export function MetricCard({ icon, label, value, sub, subType = 'neutral', accentColor }: MetricCardProps) {
  return (
    <div className="dash-metric" style={accentColor ? { '--metric-accent': accentColor } as React.CSSProperties : undefined}>
      <div className="dash-metric-top">
        <div className="dash-metric-icon">{icon}</div>
        {sub && (
          <span className={`dash-metric-badge ${subType}`}>
            {subType === 'positive' && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            )}
            {subType === 'negative' && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
            {sub}
          </span>
        )}
      </div>
      <div className="dash-metric-value">{value}</div>
      <div className="dash-metric-label">{label}</div>
    </div>
  )
}
