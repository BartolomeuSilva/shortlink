'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Domain {
  id: string
  domain: string
  verified: boolean
  txtRecord: string | null
  createdAt: string
}

interface ApiKeyItem {
  id: string
  name: string
  lastUsedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
  createdAt: string
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('general')
  const [domains, setDomains] = useState<Domain[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newDomain, setNewDomain] = useState('')
  const [newKeyName, setNewKeyName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      const tab = searchParams.get('domain') ? 'domains' : (searchParams.get('api') ? 'api-keys' : 'general')
      setActiveTab(tab)
      loadData(tab)
    }
  }, [status, router, searchParams])

  const loadData = async (tab: string) => {
    setLoading(true)
    try {
      if (tab === 'domains') {
        const res = await fetch('/api/domains')
        if (res.ok) {
          const data = await res.json()
          setDomains(data.domains || [])
        }
      } else if (tab === 'api-keys') {
        const res = await fetch('/api/keys')
        if (res.ok) {
          const data = await res.json()
          setApiKeys(data.keys || [])
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao adicionar domínio')
        return
      }

      setSuccess(data.message || 'Domínio adicionado')
      setNewDomain('')
      loadData('domains')
    } catch (e) {
      setError('Erro ao adicionar domínio')
    }
  }

  const handleDeleteDomain = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este domínio?')) return

    try {
      const res = await fetch(`/api/domains/${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadData('domains')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao criar API Key')
        return
      }

      setSuccess(`API Key criada: ${data.key}`)
      setNewKeyName('')
      loadData('api-keys')
    } catch (e) {
      setError('Erro ao criar API Key')
    }
  }

  const handleRevokeApiKey = async (id: string) => {
    if (!confirm('Tem certeza que deseja revogar esta API Key?')) return

    try {
      const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadData('api-keys')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('Copiado para a área de transferência!')
    setTimeout(() => setSuccess(''), 2000)
  }

  if (status === 'loading' || loading) {
    return (
      <div style={{ padding: '24px' }}>
        <p style={{ color: 'var(--text-tertiary)' }}>Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>Configurações</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Gerencie suas configurações</p>
      </div>

      {error && (
        <div style={{ background: 'var(--color-error-bg)', padding: '12px', borderRadius: '8px', marginBottom: '16px', color: 'var(--color-error)', fontSize: '13px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'var(--color-success-bg)', padding: '12px', borderRadius: '8px', marginBottom: '16px', color: 'var(--color-success)', fontSize: '13px' }}>
          {success}
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ width: '220px', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '8px', border: '0.5px solid rgba(0,0,0,0.08)' }}>
          <a
            href="/settings"
            style={{
              display: 'block', padding: '10px 14px', borderRadius: '8px',
              fontSize: '13px', color: activeTab === 'general' ? 'var(--primary)' : 'var(--text-secondary)',
              background: activeTab === 'general' ? 'var(--bg-hover)' : 'transparent',
              textDecoration: 'none', fontWeight: 400,
            }}
          >
            Geral
          </a>
          <a
            href="/settings?domain=1"
            style={{
              display: 'block', padding: '10px 14px', borderRadius: '8px',
              fontSize: '13px', color: activeTab === 'domains' ? 'var(--primary)' : 'var(--text-secondary)',
              background: activeTab === 'domains' ? 'var(--bg-hover)' : 'transparent',
              textDecoration: 'none', fontWeight: 400,
            }}
          >
            Domínios
          </a>
          <a
            href="/settings?api=1"
            style={{
              display: 'block', padding: '10px 14px', borderRadius: '8px',
              fontSize: '13px', color: activeTab === 'api-keys' ? 'var(--primary)' : 'var(--text-secondary)',
              background: activeTab === 'api-keys' ? 'var(--bg-hover)' : 'transparent',
              textDecoration: 'none', fontWeight: 400,
            }}
          >
            API Keys
          </a>
        </div>

        <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', border: '0.5px solid rgba(0,0,0,0.08)' }}>
          {activeTab === 'general' && (
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px' }}>Configurações Gerais</h2>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Nome</label>
                <input
                  type="text"
                  defaultValue={session?.user?.name || ''}
                  style={{ width: '100%', maxWidth: '400px', padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border-secondary)', borderRadius: '8px' }}
                  disabled
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Email</label>
                <input
                  type="email"
                  defaultValue={session?.user?.email || ''}
                  style={{ width: '100%', maxWidth: '400px', padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border-secondary)', borderRadius: '8px' }}
                  disabled
                />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Para alterar informações da conta, use o painel do NextAuth.</p>
            </div>
          )}

          {activeTab === 'domains' && (
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px' }}>Domínios Personalizados</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                Configure domínios personalizados para seus links curtos.
              </p>

              <form onSubmit={handleAddDomain} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="exemplo.com"
                  style={{ flex: 1, padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border-secondary)', borderRadius: '8px' }}
                />
                <button
                  type="submit"
                  style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, color: 'var(--bg-secondary)', background: 'var(--primary)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Adicionar
                </button>
              </form>

              {domains.length === 0 ? (
                <div style={{ padding: '24px', border: '1px dashed var(--border-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Nenhum domínio configurado</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Adicione um domínio acima para começar</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {domains.map((domain) => (
                    <div key={domain.id} style={{ padding: '16px', border: '1px solid var(--border-secondary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{domain.domain}</div>
                        <div style={{ fontSize: '12px', color: domain.verified ? 'var(--color-success)' : 'var(--color-warning)', marginTop: '4px' }}>
                          {domain.verified ? '✓ Verificado' : 'Pendente de verificação'}
                        </div>
                        {!domain.verified && domain.txtRecord && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'monospace' }}>
                            TXT: {domain.txtRecord}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteDomain(domain.id)}
                        style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--color-error)', background: 'transparent', border: '1px solid var(--color-error)', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px' }}>API Keys</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                Gerencie suas chaves de API para acesso programático.
              </p>

              <form onSubmit={handleCreateApiKey} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Nome da API Key"
                  style={{ flex: 1, padding: '10px 12px', fontSize: '14px', border: '1px solid var(--border-secondary)', borderRadius: '8px' }}
                />
                <button
                  type="submit"
                  style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, color: 'var(--bg-secondary)', background: 'var(--primary)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Criar
                </button>
              </form>

              {apiKeys.length === 0 ? (
                <div style={{ padding: '24px', border: '1px dashed var(--border-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Nenhuma API Key configurada</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Crie uma API Key acima para começar</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {apiKeys.map((key) => (
                    <div key={key.id} style={{ padding: '16px', border: '1px solid var(--border-secondary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{key.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Criada em: {new Date(key.createdAt).toLocaleDateString('pt-BR')}
                          {key.lastUsedAt && ` | Última uso: ${new Date(key.lastUsedAt).toLocaleDateString('pt-BR')}`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeApiKey(key.id)}
                        style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--color-error)', background: 'transparent', border: '1px solid var(--color-error)', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Revogar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
