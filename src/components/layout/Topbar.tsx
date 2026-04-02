'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

interface TopbarContextValue {
  title: string
  setTitle: (title: string) => void
  subtitle?: string
  setSubtitle: (subtitle: string | undefined) => void
  actions: ReactNode
  setActions: (actions: ReactNode) => void
}

const TopbarContext = createContext<TopbarContextValue | null>(null)

export function useTopbar() {
  const ctx = useContext(TopbarContext)
  if (!ctx) throw new Error('useTopbar must be used within TopbarProvider')
  return ctx
}

export function TopbarProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState<string | undefined>()
  const [actions, setActions] = useState<ReactNode>(null)

  return (
    <TopbarContext.Provider value={{ title, setTitle, subtitle, setSubtitle, actions, setActions }}>
      {children}
    </TopbarContext.Provider>
  )
}

export function Topbar() {
  return (
    <header className="desktop-topbar">
      <div className="desktop-topbar-left">
        <TopbarContent />
      </div>
      <div className="desktop-topbar-right">
        <TopbarActions />
        <ThemeToggle />
      </div>
    </header>
  )
}

function TopbarContent() {
  const ctx = useContext(TopbarContext)
  if (!ctx || !ctx.title) return null
  return (
    <div>
      <div className="desktop-topbar-title">{ctx.title}</div>
      {ctx.subtitle && <div className="desktop-topbar-subtitle">{ctx.subtitle}</div>}
    </div>
  )
}

function TopbarActions() {
  const ctx = useContext(TopbarContext)
  if (!ctx || !ctx.actions) return null
  return <>{ctx.actions}</>
}
