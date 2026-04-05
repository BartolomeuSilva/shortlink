'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { articles, categories } from '@/lib/help-data'
import { useTopbar } from '@/components/layout/Topbar'

const categoryIcons: Record<string, JSX.Element> = {
  rocket: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  link: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  ),
  qr: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="3" height="3" />
      <path d="M21 14h.01M21 17.01v.01M21 21h.01M17 21h.01" />
    </svg>
  ),
  campaign: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  ),
  globe: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  code: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
}

function ArticleCard({ article }: { article: typeof articles[0] }) {
  const [expanded, setExpanded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (expanded && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [expanded])

  const category = categories.find(c => c.id === article.category)
  const icon = category ? categoryIcons[category.icon] : null

  return (
    <div
      ref={ref}
      className={`help-article ${expanded ? 'expanded' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="help-article-header">
        <div className="help-article-icon">{icon}</div>
        <div className="help-article-title">{article.title}</div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`help-article-chevron ${expanded ? 'open' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {expanded && (
        <div className="help-article-content">
          {article.content.split('\n').map((line, i) => {
            if (!line.trim()) return <br key={i} />
            const boldRegex = /\*\*(.*?)\*\*/g
            const parts: (string | JSX.Element)[] = []
            let lastIndex = 0
            let match

            while ((match = boldRegex.exec(line)) !== null) {
              if (match.index > lastIndex) {
                parts.push(line.slice(lastIndex, match.index))
              }
              parts.push(<strong key={match.index}>{match[1]}</strong>)
              lastIndex = match.index + match[0].length
            }
            if (lastIndex < line.length) {
              parts.push(line.slice(lastIndex))
            }

            return (
              <p key={i} className="help-article-line">
                {parts.length > 0 ? parts : line}
              </p>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function HelpPage() {
  const { setTitle } = useTopbar()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTitle('Central de Ajuda')
    searchRef.current?.focus()
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

  const filteredArticles = useMemo(() => {
    let results = articles

    if (activeCategory) {
      results = results.filter(a => a.category === activeCategory)
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      results = results.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.keywords.some(k => k.toLowerCase().includes(q))
      )
    }

    return results
  }, [search, activeCategory])

  const groupedArticles = useMemo(() => {
    if (activeCategory || search.trim()) {
      return [{ category: null, articles: filteredArticles }]
    }

    return categories
      .map(cat => ({
        category: cat,
        articles: filteredArticles.filter(a => a.category === cat.id),
      }))
      .filter(g => g.articles.length > 0)
  }, [filteredArticles, activeCategory, search])

  return (
    <div className="page-content">
      <div className="help-container">
        {/* Search */}
        <div className="help-search-wrapper">
          <div className="help-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar na ajuda... (Ctrl+K)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="help-search-clear" onClick={() => setSearch('')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="help-categories">
          <button
            className={`help-category-pill ${!activeCategory ? 'active' : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`help-category-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            >
              {categoryIcons[cat.icon]}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="help-results-count">
          {filteredArticles.length} {filteredArticles.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}
        </div>

        {/* Articles */}
        {groupedArticles.length === 0 ? (
          <div className="help-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <h3>Nenhum artigo encontrado</h3>
            <p>Tente buscar com outros termos ou explore as categorias.</p>
            <button
              className="help-reset-btn"
              onClick={() => { setSearch(''); setActiveCategory(null) }}
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          groupedArticles.map((group, gi) => (
            <div key={gi} className="help-group">
              {group.category && !activeCategory && (
                <h2 className="help-group-title">
                  {categoryIcons[group.category.icon]}
                  {group.category.label}
                </h2>
              )}
              <div className="help-articles-list">
                {group.articles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
