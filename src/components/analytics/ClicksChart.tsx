'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ClickDataPoint {
  date: string
  clicks: number
}

interface ClicksChartProps {
  data: ClickDataPoint[]
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  let formattedDate = label || ''
  try {
    formattedDate = format(parseISO(label || ''), 'd MMM', { locale: ptBR })
  } catch {
    // use raw label
  }

  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '0.5px solid rgba(0,0,0,0.08)',
      borderRadius: '10px', padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{formattedDate}</div>
      <div style={{ fontSize: '16px', fontWeight: 300, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
        {(payload[0]?.value || 0).toLocaleString('pt-BR')} cliques
      </div>
    </div>
  )
}

export function ClicksChart({ data }: ClicksChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(val: string) => {
            try {
              return format(parseISO(val), 'd MMM', { locale: ptBR })
            } catch {
              return val
            }
          }}
          tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontFamily: 'inherit' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontFamily: 'inherit' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(val: number) =>
            val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val)
          }
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="clicks"
          stroke="var(--primary)"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 4, fill: 'var(--primary)', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
