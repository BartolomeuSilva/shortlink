'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTopbar } from '@/components/layout/Topbar'
import { CreateLinkModal } from '@/components/links/CreateLinkModal'

interface CampaignLink {
  id: string
  shortCode: string
  title: string | null
  originalUrl: string
  shortUrl: string
  clickCount: number
  isActive: boolean
}

interface Campaign {
  id: string
  name: string
  description: string | null
  totalClicks: number
  links: CampaignLink[]
}

interface FreeLink {
  id: string
  shortCode: string
  title: string | null
  originalUrl: string
  clickCount: number
}

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [freeLinks, setFreeLinks] = useState<FreeLink[]>([])
  const [freeSearch, setFreeSearch] = useState('')
  const [loadingFree, setLoadingFree] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const topbar = useTopbar()

  const load = async () => {
    const res = await fetch(`/api/campaigns/${id}`)
    const data = await res.json()
    if (data.campaign) {
      setCampaign(data.campaign)
      topbar.setTitle(data.campaign.name)
      topbar.setSubtitle(data.campaign.description || 'Campanha de links')
      topbar.setActions(
        <Link href="/campaigns" className="btn btn-ghost" style={{ fontSize: '13px' }}>
          ← Campanhas
        </Link>
      )
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const loadFreeLinks = async () => {
    setLoadingFree(true)
    const res = await fetch('/api/links?limit=100')
    const data = await res.json()
    // Filter out links already in this campaign
    const campaignIds = new Set(campaign?.links.map(l => l.id) || [])
    const free = (data.links || []).filter((l: FreeLink & { campaignId?: string | null }) =>
      !l.campaignId && !campaignIds.has(l.id)
    )
    setFreeLinks(free)
    setLoadingFree(false)
  }

  const handleOpenAdd = async () => {
    setShowAddPanel(v => {
      if (!v) loadFreeLinks()
      return !v
    })
  }

  const handleAdd = async (linkId: string) => {
    setAddingId(linkId)
    const res = await fetch(`/api/campaigns/${id}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId }),
    })
    const data = await res.json()
    if (res.ok && data.link) {
      const base = window.location.origin
      setCampaign(prev => prev ? {
        ...prev,
        links: [...prev.links, { ...data.link, shortUrl: `${base}/${data.link.shortCode}` }],
        totalClicks: prev.totalClicks + (data.link.clickCount || 0),
      } : prev)
      setFreeLinks(prev => prev.filter(l => l.id !== linkId))
    }
    setAddingId(null)
  }

  const handleRemove = async (linkId: string) => {
    setRemovingId(linkId)
    await fetch(`/api/campaigns/${id}/links`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId }),
    })
    setCampaign(prev => {
      if (!prev) return prev
      const removed = prev.links.find(l => l.id === linkId)
      return {
        ...prev,
        links: prev.links.filter(l => l.id !== linkId),
        totalClicks: prev.totalClicks - (removed?.clickCount || 0),
      }
    })
    setRemovingId(null)
  }

  const filteredFree = freeLinks.filter(l => {
    if (!freeSearch) return true
    const q = freeSearch.toLowerCase()
    return (l.title || '').toLowerCase().includes(q) ||
      l.shortCode.toLowerCase().includes(q) ||
      l.originalUrl.toLowerCase().includes(q)
  })

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-tertiary)' }}>Carregando...</div>
  if (!campaign) return <div style={{ padding: '40px', color: '#ef4444' }}>Campanha não encontrada.</div>

  const avgClicks = campaign.links.length ? Math.round(campaign.totalClicks / campaign.links.length) : 0
  const topLink = [...campaign.links].sort((a, b) => b.clickCount - a.clickCount)[0]

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
        {topLink && campaign.links.length > 1 && (
          <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.04)' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Top link da campanha</div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{topLink.title || topLink.shortCode}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{topLink.shortUrl}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#8b5cf6', marginTop: '8px' }}>{topLink.clickCount.toLocaleString('pt-BR')} cliques</div>
          </div>
        )}

        {/* Links section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Links da campanha ({campaign.links.length})
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-ghost"
              onClick={() => setShowCreateModal(true)}
              style={{ fontSize: '12px', padding: '6px 14px', height: '32px' }}
            >
              + Novo link
            </button>
            <button
              className="btn btn-primary"
              onClick={handleOpenAdd}
              style={{ fontSize: '12px', padding: '6px 14px', height: '32px' }}
            >
              {showAddPanel ? 'Fechar' : '+ Adicionar existente'}
            </button>
          </div>
        </div>

        {/* Add existing links panel */}
        {showAddPanel && (
          <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Adicionar link existente
            </div>
            <input
              value={freeSearch}
              onChange={e => setFreeSearch(e.target.value)}
              placeholder="Buscar por título, código ou URL..."
              style={{
                width: '100%', height: '38px', fontFamily: 'inherit', fontSize: '13px',
                color: 'var(--text-primary)', background: 'var(--bg-secondary)',
                border: '1px solid var(--border-secondary)', borderRadius: '8px',
                padding: '0 12px', outline: 'none', boxSizing: 'border-box', marginBottom: '10px',
              }}
            />
            {loadingFree ? (
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', padding: '12px 0' }}>Carregando links...</div>
            ) : filteredFree.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', padding: '12px 0' }}>
                {freeSearch ? 'Nenhum link encontrado.' : 'Todos os seus links já estão em campanhas ou não há links disponíveis.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
                {filteredFree.map(link => (
                  <div key={link.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px', borderRadius: '8px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {link.title || link.shortCode}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                        {link.clickCount} cliques · {link.shortCode}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAdd(link.id)}
                      disabled={addingId === link.id}
                      className="btn btn-ghost"
                      style={{ fontSize: '12px', padding: '4px 12px', height: '28px', flexShrink: 0 }}
                    >
                      {addingId === link.id ? '...' : 'Adicionar'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Links list */}
        {campaign.links.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Nenhum link nesta campanha
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', maxWidth: '320px', margin: '0 auto 16px' }}>
              Crie um novo link já dentro desta campanha, ou adicione links que você já tem.
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setShowCreateModal(true)} style={{ fontSize: '13px' }}>
                Novo link
              </button>
              <button className="btn btn-primary" onClick={handleOpenAdd} style={{ fontSize: '13px' }}>
                Adicionar existente
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...campaign.links].sort((a, b) => b.clickCount - a.clickCount).map(link => {
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
                      <div style={{ marginTop: '8px', height: '3px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary)', borderRadius: '2px', transition: 'width 500ms' }} />
                      </div>
                    </div>

                    <div style={{ flexShrink: 0, textAlign: 'right', minWidth: '60px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {link.clickCount.toLocaleString('pt-BR')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{pct}%</div>
                    </div>

                    <Link
                      href={`/links/${link.id}`}
                      className="btn btn-ghost"
                      style={{ fontSize: '12px', padding: '5px 12px', height: '30px', flexShrink: 0 }}
                    >
                      Analytics
                    </Link>

                    <button
                      onClick={() => handleRemove(link.id)}
                      disabled={removingId === link.id}
                      title="Remover da campanha"
                      style={{
                        flexShrink: 0, width: '30px', height: '30px', borderRadius: '8px',
                        border: '1px solid var(--border-secondary)', background: 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-tertiary)',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444'
                        ;(e.currentTarget as HTMLButtonElement).style.color = '#ef4444'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-secondary)'
                        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'
                      }}
                    >
                      {removingId === link.id
                        ? <span style={{ fontSize: '10px' }}>...</span>
                        : <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      }
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateLinkModal
          onClose={() => setShowCreateModal(false)}
          defaultCampaignId={id}
          onSuccess={() => { setShowCreateModal(false); load() }}
        />
      )}
    </>
  )
}
