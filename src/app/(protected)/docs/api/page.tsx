'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { apiEndpoints, apiCategories } from '@/lib/api-docs-data'
import { useTopbar } from '@/components/layout/Topbar'

const methodColors: Record<string, { bg: string; text: string; border: string }> = {
  GET: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  POST: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
  PUT: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  PATCH: { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' },
  DELETE: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
}

const categoryIcons: Record<string, JSX.Element> = {
  rocket: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  lock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  link: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  ),
  chart: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
    </svg>
  ),
  qr: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="3" height="3" /><path d="M21 14h.01M21 17.01v.01M21 21h.01M17 21h.01" />
    </svg>
  ),
  campaign: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  globe: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  user: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  key: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  ),
  webhook: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  ),
  health: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  rules: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 0018 8a3 3 0 000-6 3 3 0 00-2.96 3.45L8.09 9.5A3 3 0 006 9a3 3 0 000 6c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65a3 3 0 103-2.92z" />
    </svg>
  ),
  workspace: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="api-code-block">
      <div className="api-code-header">
        <span className="api-code-lang">{language || 'json'}</span>
        <button className="api-code-copy" onClick={handleCopy}>
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              Copiado!
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
              Copiar
            </>
          )}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function EndpointDetail({ endpoint }: { endpoint: typeof apiEndpoints[0] }) {
  const [tab, setTab] = useState<'response' | 'curl'>('response')
  const colors = methodColors[endpoint.method]

  const renderDescription = (desc: string) => {
    const lines = desc.split('\n')
    const elements: JSX.Element[] = []
    let inCodeBlock = false
    let codeLines: string[] = []
    let codeLang = ''

    lines.forEach((line, i) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(<CodeBlock key={`code-${i}`} code={codeLines.join('\n')} language={codeLang} />)
          codeLines = []
          inCodeBlock = false
        } else {
          codeLang = line.slice(3).trim()
          inCodeBlock = true
        }
        return
      }

      if (inCodeBlock) {
        codeLines.push(line)
        return
      }

      if (!line.trim()) {
        elements.push(<br key={i} />)
        return
      }

      const parts: (string | JSX.Element)[] = []
      let lastIndex = 0
      const boldRegex = /\*\*(.*?)\*\*/g
      const inlineRegex = /`(.*?)`/g
      const combinedRegex = /\*\*(.*?)\*\*|`(.*?)`/g
      let match

      while ((match = combinedRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.slice(lastIndex, match.index))
        }
        if (match[1]) {
          parts.push(<strong key={match.index}>{match[1]}</strong>)
        } else if (match[2]) {
          parts.push(<code key={match.index} className="api-inline-code">{match[2]}</code>)
        }
        lastIndex = match.index + match[0].length
      }
      if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex))
      }

      if (line.startsWith('• ')) {
        elements.push(
          <div key={i} className="api-list-item">
            <span className="api-list-bullet">•</span>
            <span>{parts.length > 0 ? parts : line.slice(2)}</span>
          </div>
        )
      } else {
        elements.push(<p key={i}>{parts.length > 0 ? parts : line}</p>)
      }
    })

    return elements
  }

  const renderFieldTable = (
    fields: { name: string; type: string; description: string; required: boolean; example?: string; default?: string }[],
    title: string
  ) => {
    if (!fields.length) return null
    return (
      <div className="api-fields-section">
        <h4 className="api-fields-title">{title}</h4>
        <table className="api-fields-table">
          <thead>
            <tr>
              <th>Campo</th>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Obrigatório</th>
              {fields.some(f => f.example || f.default) && <th>Exemplo / Padrão</th>}
            </tr>
          </thead>
          <tbody>
            {fields.map(field => (
              <tr key={field.name}>
                <td><code className="api-field-name">{field.name}</code></td>
                <td><span className="api-field-type">{field.type}</span></td>
                <td>{field.description}</td>
                <td>
                  {field.required ? (
                    <span className="api-required-badge">Sim</span>
                  ) : (
                    <span className="api-optional-badge">Não</span>
                  )}
                </td>
                {(fields.some(f => f.example || f.default)) && (
                  <td>
                    {field.example && <code className="api-example-code">{field.example}</code>}
                    {field.default && !field.example && <span className="api-default-text">Padrão: {field.default}</span>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="api-endpoint-detail">
      <div className="api-endpoint-header">
        <div className="api-method-badge" style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}>
          {endpoint.method}
        </div>
        <code className="api-path">{endpoint.path}</code>
        {endpoint.auth && (
          <span className="api-auth-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
            Requer autenticação
          </span>
        )}
      </div>

      <h3 className="api-endpoint-title">{endpoint.title}</h3>

      <div className="api-endpoint-description">
        {renderDescription(endpoint.description)}
      </div>

      {endpoint.pathParams && (
        renderFieldTable(endpoint.pathParams, 'Parâmetros de Rota')
      )}

      {endpoint.queryParams && (
        renderFieldTable(endpoint.queryParams, 'Parâmetros de Query')
      )}

      {endpoint.bodyFields && (
        renderFieldTable(endpoint.bodyFields, 'Corpo da Requisição')
      )}

      {(endpoint.responseExample || endpoint.curlExample) && (
        <div className="api-examples">
          <div className="api-tabs">
            <button
              className={`api-tab ${tab === 'response' ? 'active' : ''}`}
              onClick={() => setTab('response')}
            >
              Resposta
            </button>
            {endpoint.curlExample && (
              <button
                className={`api-tab ${tab === 'curl' ? 'active' : ''}`}
                onClick={() => setTab('curl')}
              >
                cURL
              </button>
            )}
          </div>

          {tab === 'response' && endpoint.responseExample && (
            <CodeBlock code={endpoint.responseExample} language="json" />
          )}

          {tab === 'curl' && endpoint.curlExample && (
            <CodeBlock code={endpoint.curlExample} language="bash" />
          )}
        </div>
      )}
    </div>
  )
}

export default function ApiDocsPage() {
  const { setTitle } = useTopbar()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedEndpoint, setSelectedEndpoint] = useState<typeof apiEndpoints[0] | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTitle('Documentação da API')
  }, [setTitle])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const filteredEndpoints = useMemo(() => {
    let results = apiEndpoints.filter(e => e.path !== '')

    if (activeCategory) {
      results = results.filter(e => e.category === activeCategory)
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      results = results.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.path.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.method.toLowerCase().includes(q)
      )
    }

    return results
  }, [search, activeCategory])

  const groupedEndpoints = useMemo(() => {
    if (activeCategory || search.trim()) {
      return [{ category: null, endpoints: filteredEndpoints }]
    }

    return apiCategories
      .map(cat => ({
        category: cat,
        endpoints: filteredEndpoints.filter(e => e.category === cat.id),
      }))
      .filter(g => g.endpoints.length > 0)
  }, [filteredEndpoints, activeCategory, search])

  return (
    <div className="page-content">
      <div className="api-docs-container">
        {/* Search */}
        <div className="api-docs-search-wrapper">
          <div className="api-docs-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar endpoint... (Ctrl+K)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="api-docs-search-clear" onClick={() => { setSearch(''); setSelectedEndpoint(null) }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="api-docs-categories">
          <button
            className={`api-docs-category-pill ${!activeCategory ? 'active' : ''}`}
            onClick={() => { setActiveCategory(null); setSelectedEndpoint(null) }}
          >
            Todos
          </button>
          {apiCategories.map(cat => (
            <button
              key={cat.id}
              className={`api-docs-category-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => { setActiveCategory(activeCategory === cat.id ? null : cat.id); setSelectedEndpoint(null) }}
            >
              {categoryIcons[cat.icon]}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="api-docs-content">
          {/* Sidebar */}
          <div className="api-docs-sidebar">
            <div className="api-docs-sidebar-title">Endpoints</div>
            {groupedEndpoints.map((group, gi) => (
              <div key={gi} className="api-docs-group">
                {group.category && (
                  <div className="api-docs-group-label">
                    {categoryIcons[group.category.icon]}
                    {group.category.label}
                  </div>
                )}
                {group.endpoints.map(ep => {
                  const colors = methodColors[ep.method]
                  return (
                    <button
                      key={ep.id}
                      className={`api-docs-sidebar-item ${selectedEndpoint?.id === ep.id ? 'active' : ''}`}
                      onClick={() => setSelectedEndpoint(ep)}
                    >
                      <span className="api-docs-method-dot" style={{ background: colors.text }} />
                      {ep.title}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="api-docs-main">
            {selectedEndpoint ? (
              <EndpointDetail endpoint={selectedEndpoint} />
            ) : (
              <div className="api-docs-welcome">
                <div className="api-docs-welcome-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <h2>Documentação da API do 123bit</h2>
                <p>
                  Selecione um endpoint na barra lateral para ver a documentação detalhada,
                  incluindo parâmetros, exemplos de requisição e resposta.
                </p>
                <div className="api-docs-quick-stats">
                  <div className="api-docs-stat">
                    <span className="api-docs-stat-number">{apiEndpoints.filter(e => e.path !== '').length}</span>
                    <span className="api-docs-stat-label">Endpoints</span>
                  </div>
                  <div className="api-docs-stat">
                    <span className="api-docs-stat-number">{apiCategories.length}</span>
                    <span className="api-docs-stat-label">Categorias</span>
                  </div>
                  <div className="api-docs-stat">
                    <span className="api-docs-stat-number">{apiEndpoints.filter(e => e.auth).length}</span>
                    <span className="api-docs-stat-label">Requerem Auth</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
