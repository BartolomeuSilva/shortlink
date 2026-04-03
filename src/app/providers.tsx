'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/theme/ThemeContext'
import { WorkspaceProvider } from '@/components/theme/WorkspaceContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <WorkspaceProvider>
          {children}
        </WorkspaceProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}

