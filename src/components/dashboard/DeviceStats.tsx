'use client'

const DEVICE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  MOBILE: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
    label: 'Mobile',
    color: '#8b5cf6',
  },
  TABLET: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
    label: 'Tablet',
    color: '#6366f1',
  },
  DESKTOP: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    label: 'Desktop',
    color: '#3b82f6',
  },
  UNKNOWN: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    label: 'Outro',
    color: '#9ca3af',
  },
}

interface DeviceStatsProps {
  data: { deviceType: string; clicks: number }[]
}

export function DeviceStats({ data }: DeviceStatsProps) {
  const total = data.reduce((s, x) => s + x.clicks, 0)

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div className="dash-card-icon-wrapper">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        <h3 className="dash-card-title">Dispositivos</h3>
      </div>

      {data.length === 0 ? (
        <div className="dash-empty">
          <span className="dash-empty-icon">📊</span>
          <span>Sem dados de dispositivos</span>
        </div>
      ) : (
        <div className="dash-device-grid">
          {data.map((d, i) => {
            const config = DEVICE_CONFIG[d.deviceType] || DEVICE_CONFIG.UNKNOWN
            const pct = total > 0 ? Math.round((d.clicks / total) * 100) : 0
            return (
              <div key={i} className="dash-device" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="dash-device-ring" style={{ '--pct': `${pct}`, '--ring-color': config.color } as React.CSSProperties}>
                  <span className="dash-device-pct">{pct}%</span>
                </div>
                <div className="dash-device-info">
                  <span className="dash-device-label">{config.label}</span>
                  <span className="dash-device-clicks">{d.clicks.toLocaleString('pt-BR')} cliques</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
