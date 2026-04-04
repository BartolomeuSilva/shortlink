'use client'

import { useState, useEffect } from 'react'

interface RedirectRule {
  id: string
  type: string
  condition: string
  destination: string
  weight: number
  order: number
  active: boolean
}

interface RouteRulesEditorProps {
  linkId: string
}

const RULE_TYPES = [
  { value: 'geo', label: 'Geo-Routing', icon: '🌍', desc: 'Redirecionar por país' },
  { value: 'device', label: 'Device Routing', icon: '📱', desc: 'Redirecionar por dispositivo' },
  { value: 'time', label: 'Time-Based', icon: '⏰', desc: 'Redirecionar por horário' },
  { value: 'ab', label: 'A/B Testing', icon: '🧪', desc: 'Dividir tráfego entre URLs' },
]

const COUNTRIES = [
  { code: 'BR', name: 'Brasil' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'FR', name: 'França' },
  { code: 'ES', name: 'Espanha' },
  { code: 'IT', name: 'Itália' },
  { code: 'JP', name: 'Japão' },
  { code: 'CA', name: 'Canadá' },
  { code: 'AU', name: 'Austrália' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
]

const DEVICES = [
  { value: 'MOBILE', label: 'Mobile', icon: '📱' },
  { value: 'TABLET', label: 'Tablet', icon: '📋' },
  { value: 'DESKTOP', label: 'Desktop', icon: '💻' },
]

export default function RouteRulesEditor({ linkId }: RouteRulesEditorProps) {
  const [rules, setRules] = useState<RedirectRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [ruleType, setRuleType] = useState('geo')
  const [destination, setDestination] = useState('')
  const [weight, setWeight] = useState(50)
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [startHour, setStartHour] = useState(9)
  const [endHour, setEndHour] = useState(18)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/links/${linkId}/rules`)
      .then(r => r.json())
      .then(d => setRules(d.rules || []))
      .finally(() => setLoading(false))
  }, [linkId])

  const handleSubmit = async () => {
    if (!destination) return
    setSaving(true)
    setError('')

    let condition: Record<string, unknown> = {}
    if (ruleType === 'geo') condition = { countries: selectedCountries }
    else if (ruleType === 'device') condition = { devices: selectedDevices }
    else if (ruleType === 'time') condition = { startHour: String(startHour), endHour: String(endHour) }

    try {
      const res = await fetch(`/api/links/${linkId}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: ruleType,
          condition,
          destination,
          weight: ruleType === 'ab' ? weight : 100,
          order: rules.length,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setRules(prev => [...prev, data.rule])
      setShowForm(false)
      setDestination('')
      setSelectedCountries([])
      setSelectedDevices([])
    } finally {
      setSaving(false)
    }
  }

  const toggleRule = async (rule: RedirectRule) => {
    try {
      await fetch(`/api/links/${linkId}/rules`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId: rule.id, active: !rule.active }),
      })
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r))
    } catch {}
  }

  const deleteRule = async (ruleId: string) => {
    try {
      await fetch(`/api/links/${linkId}/rules?ruleId=${ruleId}`, { method: 'DELETE' })
      setRules(prev => prev.filter(r => r.id !== ruleId))
    } catch {}
  }

  const getConditionLabel = (rule: RedirectRule): string => {
    try {
      const cond = JSON.parse(rule.condition)
      if (rule.type === 'geo' && cond.countries) {
        return (cond.countries as string[]).map(c => {
          const country = COUNTRIES.find(x => x.code === c)
          return country?.name || c
        }).join(', ')
      }
      if (rule.type === 'device' && cond.devices) {
        return (cond.devices as string[]).map(d => {
          const device = DEVICES.find(x => x.value === d)
          return device?.label || d
        }).join(', ')
      }
      if (rule.type === 'time') {
        return `${cond.startHour || 0}h - ${cond.endHour || 23}h`
      }
      if (rule.type === 'ab') {
        return `Peso: ${rule.weight}%`
      }
    } catch {}
    return rule.condition
  }


  if (loading) return <div style={{ padding: '20px', color: 'var(--text-tertiary)' }}>Carregando regras...</div>

  return (
    <div>
      <div className="dash-card-topbar">
        <div className="dash-card-topbar-left">
          <div className="dash-card-icon-wrapper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <div className="dash-card-title">Smart Routing & A/B Testing</div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>
              {rules.length} regra{rules.length !== 1 ? 's' : ''} ativa{rules.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="btn btn-primary"
          style={{ fontSize: '12px', height: '32px', padding: '0 12px' }}
        >
          {showForm ? 'Cancelar' : '+ Nova regra'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '20px', marginBottom: '16px', border: '1px solid var(--primary)' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Nova regra de redirecionamento
          </div>

          {/* Rule type selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {RULE_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setRuleType(t.value)}
                style={{
                  padding: '12px 8px', borderRadius: '8px', border: `2px solid ${ruleType === t.value ? 'var(--primary)' : 'var(--border-secondary)'}`,
                  background: ruleType === t.value ? 'rgba(139,92,246,0.08)' : 'transparent',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 150ms',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{t.icon}</div>
                <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-primary)' }}>{t.label}</div>
              </button>
            ))}
          </div>

          {/* Condition fields */}
          {ruleType === 'geo' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Países-alvo
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {COUNTRIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => setSelectedCountries(prev =>
                      prev.includes(c.code) ? prev.filter(x => x !== c.code) : [...prev, c.code]
                    )}
                    style={{
                      padding: '6px 10px', borderRadius: '6px', fontSize: '12px',
                      border: `1px solid ${selectedCountries.includes(c.code) ? 'var(--primary)' : 'var(--border-secondary)'}`,
                      background: selectedCountries.includes(c.code) ? 'var(--primary)' : 'transparent',
                      color: selectedCountries.includes(c.code) ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer', transition: 'all 150ms',
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {ruleType === 'device' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Dispositivos-alvo
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {DEVICES.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDevices(prev =>
                      prev.includes(d.value) ? prev.filter(x => x !== d.value) : [...prev, d.value]
                    )}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '8px', fontSize: '13px',
                      border: `2px solid ${selectedDevices.includes(d.value) ? 'var(--primary)' : 'var(--border-secondary)'}`,
                      background: selectedDevices.includes(d.value) ? 'rgba(139,92,246,0.08)' : 'transparent',
                      cursor: 'pointer', transition: 'all 150ms',
                    }}
                  >
                    {d.icon} {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {ruleType === 'time' && (
            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Das</label>
                <select
                  value={startHour}
                  onChange={e => setStartHour(parseInt(e.target.value))}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-secondary)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}h</option>)}
                </select>
              </div>
              <span style={{ color: 'var(--text-tertiary)', marginTop: '18px' }}>até</span>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Até</label>
                <select
                  value={endHour}
                  onChange={e => setEndHour(parseInt(e.target.value))}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-secondary)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}h</option>)}
                </select>
              </div>
            </div>
          )}

          {ruleType === 'ab' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Peso do tráfego: {weight}%
              </label>
              <input
                type="range"
                min="10"
                max="90"
                value={weight}
                onChange={e => setWeight(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                <span>10%</span>
                <span>50%</span>
                <span>90%</span>
              </div>
            </div>
          )}

          {/* Destination URL */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              URL de destino *
            </label>
            <input
              type="url"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="https://exemplo.com/destino"
              style={{
                width: '100%', height: '40px', fontFamily: 'inherit', fontSize: '13px',
                color: 'var(--text-primary)', background: 'var(--bg-secondary)',
                border: '1px solid var(--border-secondary)', borderRadius: '8px',
                padding: '0 12px', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && <div style={{ fontSize: '13px', color: '#ef4444', marginBottom: '12px' }}>{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={saving || !destination || (ruleType === 'geo' && selectedCountries.length === 0) || (ruleType === 'device' && selectedDevices.length === 0)}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {saving ? 'Salvando...' : 'Adicionar regra'}
          </button>
        </div>
      )}

      {/* Rules list */}
      {rules.length === 0 && !showForm ? (
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Nenhuma regra configurada
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Adicione regras para redirecionar visitantes baseado em país, dispositivo, horário ou fazer A/B testing.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {rules.map((rule, idx) => (
            <div
              key={rule.id}
              style={{
                padding: '12px 16px', borderRadius: '8px',
                background: rule.active ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                border: `1px solid ${rule.active ? 'var(--border-primary)' : 'var(--border-secondary)'}`,
                opacity: rule.active ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '20px' }}>
                {RULE_TYPES.find(t => t.value === rule.type)?.icon || '🔗'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {RULE_TYPES.find(t => t.value === rule.type)?.label || rule.type}
                  </span>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-active)', color: 'var(--text-tertiary)' }}>
                    #{idx + 1}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getConditionLabel(rule)} → {rule.destination}
                </div>
              </div>
              <button
                onClick={() => toggleRule(rule)}
                style={{
                  fontSize: '11px', padding: '4px 8px', borderRadius: '6px',
                  border: '1px solid var(--border-secondary)', background: 'transparent',
                  cursor: 'pointer', color: rule.active ? '#22c55e' : 'var(--text-tertiary)',
                }}
              >
                {rule.active ? 'Ativo' : 'Inativo'}
              </button>
              <button
                onClick={() => deleteRule(rule.id)}
                style={{
                  width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                  background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
