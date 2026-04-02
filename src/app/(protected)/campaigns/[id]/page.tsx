'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTopbar } from '@/components/layout/Topbar'

interface CampaignLink {
  id: string
  shortCode: string
  title: string | null
  originalUrl: string
  shortUrl: string
  clickCount: number
  isActive: boolean
  utmSource: string | null
  utmMedium: string | null
}

interface Campaign {
  id: string
  name: string
  description: string | null
  totalClicks: number
  createdAt: string
  links: CampaignLink[]
}

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const topbar = useTopbar()

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then(r => r.json())
      .then(d => {
        setCampaign(d.campaign)
        if (d.campaign) {
          topbar.setTitle(d.campaign.name)
          topbar.setSubtitle(d.campaign.description || undefined)
          topbar.setActions(
            <Link href="/campaigns" className="btn btn-ghost" style={{ fontSize: '13px' }}>
              ← Campanhas
            </Link>
          )
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-tertiary)' }}>Carregando...</div>
  if (!campaign) return <div style={{ padding: '40px', color: '#ef4444' }}>Campanha não encontrada.</div>

  const topLink = campaign.links[0]
  const avgClicks = campaign.links.length ? Math.round(campaign.totalClicks / campaign.links.length) : 0

  return (
    <>
      <div className="page-content">
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Links', value: campaign.links.length },
            { label: 'Total de cliques', value: campaign.totalClicks.toLocaleString('pt-BR') },
            { label: 'Média por link', value: avgClicks.toLocaleString('pt-BR') },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-1px' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Top performer */}
        {topLink && (
          <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.04)' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Top link da campanha</div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{topLink.title || topLink.shortCode}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{topLink.shortUrl}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#8b5cf6', marginTop: '8px' }}>{topLink.clickCount.toLocaleString('pt-BR')} cliques</div>
          </div>
        )}

        {/* Links table */}
        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
          Links da campanha
        </div>
        {campaign.links.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>Nenhum link nesta campanha ainda.</div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Ao criar um link, selecione esta campanha para adicioná-lo aqui.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {campaign.links.map(link => {
              const pct = campaign.totalClicks > 0 ? Math.round((link.clickCount / campaign.totalClicks) * 100) : 0
              return (
                <div key={link.id} className="card" style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {link.title || link.shortCode}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {link.shortUrl}
                      </div>
                      {/* Mini progress bar */}
                      <div style={{ marginTop: '8px', height: '4px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary)', borderRadius: '2px', transition: 'width 600ms' }} />
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{link.clickCount.toLocaleString('pt-BR')}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>{pct}%</div>
                    </div>
                    <Link href={`/links/${link.id}`} className="btn btn-ghost" style={{ fontSize: '12px', padding: '5px 12px', height: '30px', flexShrink: 0 }}>
                      Analytics
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
