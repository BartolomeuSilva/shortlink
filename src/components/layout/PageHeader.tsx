'use client'

import { useEffect } from 'react'
import { useTopbar } from './Topbar'

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  const topbar = useTopbar()

  useEffect(() => {
    topbar.setTitle(title)
    topbar.setSubtitle(subtitle)
    topbar.setActions(actions || null)
  }, [title, subtitle, actions])

  return null
}
