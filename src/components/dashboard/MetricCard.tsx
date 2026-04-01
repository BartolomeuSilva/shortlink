interface MetricCardProps {
  label: string
  value: string
  delta?: string
  deltaType?: 'up' | 'down' | 'neutral'
  deltaLabel?: string
}

export function MetricCard({ label, value, delta, deltaType = 'neutral', deltaLabel }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {delta && (
        <div className={`metric-delta ${deltaType}`}>
          <span className="metric-delta-dot" />
          <span>{delta}</span>
          {deltaLabel && <span style={{ fontWeight: 300 }}>{deltaLabel}</span>}
        </div>
      )}
    </div>
  )
}
