'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface UserState {
  name: string | null
  email: string | null
  image: string | null
}

interface UserContextValue extends UserState {
  updateUser: (patch: Partial<UserState>) => void
}

const UserContext = createContext<UserContextValue>({
  name: null, email: null, image: null,
  updateUser: () => {},
})

export function UserProvider({
  initial,
  children,
}: {
  initial: UserState
  children: React.ReactNode
}) {
  const [user, setUser] = useState<UserState>(initial)
  const updateUser = useCallback((patch: Partial<UserState>) => {
    setUser(prev => ({ ...prev, ...patch }))
  }, [])

  return (
    <UserContext.Provider value={{ ...user, updateUser }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
