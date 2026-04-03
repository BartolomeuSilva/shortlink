'use client'

import { formatNumber } from '@/lib/utils'

const COUNTRY_FLAGS: Record<string, string> = {
  BR: '🇧🇷', US: '🇺🇸', PT: '🇵🇹', AR: '🇦🇷', MX: '🇲🇽',
  GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', ES: '🇪🇸', CA: '🇨🇦',
  JP: '🇯🇵', KR: '🇰🇷', IT: '🇮🇹', AU: '🇦🇺', IN: '🇮🇳',
  CL: '🇨🇱', CO: '🇨🇴', PE: '🇵🇪', UY: '🇺🇾', PY: '🇵🇾',
}

interface GeoStatsProps {
  data: { country: string; countryCode: string | null; clicks: number }[]
}

export function GeoStats({ data }: GeoStatsProps) {
  const maxClicks = data[0]?.clicks || 1

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div className="dash-card-icon-wrapper">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
        <h3 className="dash-card-title">Por país</h3>
      </div>

      {data.length === 0 ? (
        <div className="dash-empty">
          <span className="dash-empty-icon">🌍</span>
          <span>Sem dados geográficos</span>
        </div>
      ) : (
        <div className="dash-bars">
          {data.map((geo, i) => (
            <div key={i} className="dash-bar" style={{ animationDelay: `${i * 60}ms` }}>
              <span className="dash-bar-emoji">
                {geo.countryCode ? (COUNTRY_FLAGS[geo.countryCode] || '🌍') : '🌍'}
              </span>
              <div className="dash-bar-content">
                <div className="dash-bar-info">
                  <span className="dash-bar-name">{geo.country}</span>
                  <span className="dash-bar-value">{formatNumber(geo.clicks)}</span>
                </div>
                <div className="dash-bar-track">
                  <div
                    className="dash-bar-fill"
                    style={{ width: `${(geo.clicks / maxClicks) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
