'use client'

interface DashboardHeaderProps {
  firstName: string
  period: '7d' | '30d'
  onPeriodChange: (period: '7d' | '30d') => void
}

export function DashboardHeader({ firstName, period, onPeriodChange }: DashboardHeaderProps) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="dash-header">
      <div className="dash-header-left">
        <h1 className="dash-greeting">
          {greeting}, <span className="dash-greeting-name">{firstName}</span>
        </h1>
        <p className="dash-subtitle">
          Resumo dos últimos {period === '7d' ? '7' : '30'} dias
        </p>
      </div>
      <div className="dash-period-toggle">
        <button
          className={`dash-period-btn ${period === '7d' ? 'active' : ''}`}
          onClick={() => onPeriodChange('7d')}
        >
          7d
        </button>
        <button
          className={`dash-period-btn ${period === '30d' ? 'active' : ''}`}
          onClick={() => onPeriodChange('30d')}
        >
          30d
        </button>
      </div>
    </div>
  )
}
