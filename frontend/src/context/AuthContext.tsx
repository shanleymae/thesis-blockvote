import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { ApiError, authApi, type User } from '../api/client'
import { clearPendingWallet, getPendingWallet } from '../utils/wallet'
import { notifyError, notifyInfo } from '../lib/toast'

const TOKEN_KEY = 'blockvote_token'
const USER_KEY = 'blockvote_user'

type AuthContextValue = {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  loginWithWallet: (walletAddress: string, signature: string) => Promise<User>
  register: (data: {
    name: string
    email: string
    password: string
    phone?: string
    walletAddress: string
    organizationId: string
    idNumber: string
  }) => Promise<{ message: string; emailVerificationSkipped?: boolean }>
  refreshUser: () => Promise<User | null>
  logout: () => void
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(!!token)

  const setUser = useCallback((u: User | null) => {
    setUserState(u)
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u))
    else localStorage.removeItem(USER_KEY)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUserState(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }, [])

  const persistSession = useCallback((t: string, u: User) => {
    setToken(t)
    setUser(u)
    localStorage.setItem(TOKEN_KEY, t)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  }, [setUser])

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const { token: t, user: u } = await authApi.login({ email, password })
    persistSession(t, u)
    let finalUser = u
    const pendingWallet = getPendingWallet()
    if (pendingWallet) {
      try {
        const updated = await authApi.updateWallet(pendingWallet)
        setUser(updated)
        localStorage.setItem(USER_KEY, JSON.stringify(updated))
        finalUser = updated
        if (updated.status === 'PENDING' && u.status === 'APPROVED') {
          notifyInfo('Wallet linked. Admin approval is required again before you can vote.')
        } else {
          notifyInfo('Wallet linked to your account.')
        }
      } catch (error) {
        notifyError(error instanceof Error ? error.message : 'Failed to link wallet after login')
      }
      clearPendingWallet()
    }
    return finalUser
  }, [persistSession, setUser])

  const loginWithWallet = useCallback(async (walletAddress: string, signature: string): Promise<User> => {
    const { token: t, user: u } = await authApi.loginWithWallet({ walletAddress, signature })
    persistSession(t, u)
    return u
  }, [persistSession])

  const register = useCallback(
    async (data: {
      name: string
      email: string
      password: string
      phone?: string
      walletAddress: string
      organizationId: string
      idNumber: string
    }) => {
      return authApi.register(data)
    },
    []
  )

  const refreshUser = useCallback(async (): Promise<User | null> => {
    if (!token) return null
    try {
      const u = await authApi.me()
      setUser(u)
      return u
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        logout()
        return null
      }
      return null
    }
  }, [token, setUser, logout])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    refreshUser().finally(() => setLoading(false))
  }, [token, refreshUser])

  useEffect(() => {
    if (!token) return

    const refreshOnFocus = () => {
      void refreshUser()
    }

    const interval = window.setInterval(() => {
      void refreshUser()
    }, 15000)

    window.addEventListener('focus', refreshOnFocus)
    document.addEventListener('visibilitychange', refreshOnFocus)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshOnFocus)
      document.removeEventListener('visibilitychange', refreshOnFocus)
    }
  }, [token, refreshUser])

  const value: AuthContextValue = {
    user,
    token,
    loading,
    login,
    loginWithWallet,
    register,
    refreshUser,
    logout,
    setUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
