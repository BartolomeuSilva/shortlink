'use client'

import React, { createContext, useContext, useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface Workspace {
  id: string
  name: string
  slug: string
}

interface WorkspaceContextType {
  activeWorkspace: Workspace | null
  setActiveWorkspace: (workspace: Workspace | null) => void
  workspaces: Workspace[]
  loading: boolean
  refreshWorkspaces: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

function WorkspaceProviderInner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)

  const refreshWorkspaces = async () => {
    try {
      const res = await fetch('/api/workspaces')
      const data = await res.json()
      setWorkspaces(data.workspaces || [])
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshWorkspaces().then(() => {
      const saved = localStorage.getItem('activeWorkspace')
      if (saved) {
        try {
          setActiveWorkspaceState(JSON.parse(saved))
        } catch {
          localStorage.removeItem('activeWorkspace')
        }
      }
    })
  }, [])

  const setActiveWorkspace = (ws: Workspace | null) => {
    setActiveWorkspaceState(ws)
    const params = new URLSearchParams(searchParams.toString())
    
    if (ws) {
      localStorage.setItem('activeWorkspace', JSON.stringify(ws))
      params.set('workspaceId', ws.id)
    } else {
      localStorage.removeItem('activeWorkspace')
      params.delete('workspaceId')
    }
    
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <WorkspaceContext.Provider value={{ activeWorkspace, setActiveWorkspace, workspaces, loading, refreshWorkspaces }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <WorkspaceProviderInner>
        {children}
      </WorkspaceProviderInner>
    </Suspense>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
