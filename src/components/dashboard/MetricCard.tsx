interface MetricCardProps {
  label: string
  value: string
  delta?: string
  deltaType?: 'up' | 'down' | 'neutral'
  deltaLabel?: string
}

export function MetricCard({ label, value, delta, deltaType = 'neutral', deltaLabel }: MetricCardProps) {
  const deltaColor =
    deltaType === 'up' ? '#3B6D11' :
    deltaType === 'down' ? 'var(--color-error)' :
    'var(--text-tertiary)'

  const dotColor =
    deltaType === 'up' ? '#3B6D11' :
    deltaType === 'down' ? 'var(--color-error)' :
    'var(--text-tertiary)'

  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '0.5px solid rgba(0,0,0,0.07)',
      borderRadius: '16px', padding: '20px',
    }}>
      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 400, marginBottom: '8px', letterSpacing: '-0.1px' }}>
        {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 300, letterSpacing: '-1.5px', color: 'var(--text-primary)', lineHeight: 1, marginBottom: '6px' }}>
        {value}
      </div>
      {delta && (
        <div style={{ fontSize: '12px', fontWeight: 400, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: dotColor, display: 'inline-block' }} />
          <span style={{ color: deltaColor }}>{delta}</span>
          {deltaLabel && <span style={{ color: 'var(--text-tertiary)' }}>{deltaLabel}</span>}
        </div>
      )}
    </div>
  )
}
