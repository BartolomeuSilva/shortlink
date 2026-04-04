'use client'

import Link from 'next/link'
import { formatNumber, getBaseUrl } from '@/lib/utils'

interface RecentLink {
  id: string
  shortCode: string
  originalUrl: string
  title: string | null
  clickCount: number
  isActive: boolean
  createdAt: string
}

interface RecentLinksProps {
  links: RecentLink[]
  onCreateLink: () => void
}

function getFaviconUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch {
    return ''
  }
}

export function RecentLinks({ links, onCreateLink }: RecentLinksProps) {
  const baseUrl = getBaseUrl()

  return (
    <div className="dash-section">
      <div className="dash-card dash-card-flush">
        <div className="dash-card-topbar">
          <div className="dash-card-topbar-left">
            <div className="dash-card-icon-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <h3 className="dash-card-title">Links recentes</h3>
          </div>
          <Link href="/links" className="dash-card-action">
            Ver todos
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        {links.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--bg-tertiary)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Nenhum link ainda</p>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Crie seu primeiro link encurtado e comece a rastrear cliques.</p>
            </div>
            <button onClick={onCreateLink} className="btn btn-primary" style={{ fontSize: '13px', height: '36px', marginTop: '4px' }}>
              + Criar primeiro link
            </button>
          </div>
        ) : (
          <div className="dash-links-list">
            {links.map((link, i) => {
              const favicon = getFaviconUrl(link.originalUrl)
              return (
                <Link
                  key={link.id}
                  href={`/links/${link.id}`}
                  className="dash-link-item"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="dash-link-favicon">
                    {favicon ? (
                      <img src={favicon} alt="" width={20} height={20} loading="lazy" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    )}
                  </div>
                  <div className="dash-link-content">
                    <span className="dash-link-short">{baseUrl}/{link.shortCode}</span>
                    <span className="dash-link-original">{link.title || link.originalUrl}</span>
                  </div>
                  <div className="dash-link-stats">
                    <span className="dash-link-count">{formatNumber(link.clickCount)}</span>
                    <span className="dash-link-count-label">cliques</span>
                  </div>
                  <svg className="dash-link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
