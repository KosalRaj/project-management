import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { SafeUser, UserRole } from '@/db/schema'
import { loginFn, registerFn, getCurrentUserFn, logoutFn } from '@/server/auth'

interface AuthContextType {
  user: SafeUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<SafeUser>
  register: (data: {
    name: string
    email: string
    password: string
    role?: UserRole
    department?: string
    title?: string
    avatar?: string
  }) => Promise<SafeUser>
  logout: () => Promise<void>
  hasRole: (role: UserRole | UserRole[]) => boolean
  refetchUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'initiative_os_auth_token'

function setCookie(name: string, value: string, days = 30) {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length))
  }
  return null
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const val = window.localStorage.getItem(TOKEN_KEY) || getCookie(TOKEN_KEY)
    if (val && val !== 'null' && val !== 'undefined' && val.trim() !== '') {
      return val
    }
  } catch (err) {
    console.error('Error reading stored token:', err)
  }
  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken)
  const [user, setUser] = useState<SafeUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return !!getStoredToken()
  })

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true

    async function initSession() {
      const storedToken = getStoredToken()

      if (!storedToken) {
        if (isMounted) {
          setToken(null)
          setUser(null)
          setIsLoading(false)
        }
        return
      }

      try {
        // 4s timeout safety guard so authentication check never hangs
        const timeoutPromise = new Promise<{ user: null }>((resolve) =>
          setTimeout(() => resolve({ user: null }), 4000),
        )
        const fetchPromise = getCurrentUserFn({ data: { token: storedToken } })
        const result = await Promise.race([fetchPromise, timeoutPromise])

        if (!isMounted) return

        if (result && result.user) {
          setToken(storedToken)
          setUser(result.user)
        } else {
          // Invalid or expired token
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.removeItem(TOKEN_KEY)
              deleteCookie(TOKEN_KEY)
            } catch (e) {}
          }
          setToken(null)
          setUser(null)
        }
      } catch (err) {
        console.error('Failed to initialize session:', err)
        if (isMounted) {
          setToken(null)
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initSession()

    return () => {
      isMounted = false
    }
  }, [])

  const refetchUser = useCallback(async () => {
    if (!token) return
    try {
      const result = await getCurrentUserFn({ data: { token } })
      setUser(result.user)
    } catch (err) {
      console.error('Failed to refetch user:', err)
    }
  }, [token])

  const login = useCallback(async (email: string, password: string): Promise<SafeUser> => {
    setIsLoading(true)
    try {
      const res = await loginFn({ data: { email, password } })
      if (!res.token || !res.user) {
        throw new Error('Login failed: invalid response')
      }

      setToken(res.token)
      setUser(res.user as SafeUser)

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(TOKEN_KEY, res.token)
        setCookie(TOKEN_KEY, res.token, 30)
      }

      return res.user as SafeUser
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(
    async (data: {
      name: string
      email: string
      password: string
      role?: UserRole
      department?: string
      title?: string
      avatar?: string
    }): Promise<SafeUser> => {
      setIsLoading(true)
      try {
        const res = await registerFn({ data })
        if (!res.token || !res.user) {
          throw new Error('Registration failed: invalid response')
        }

        setToken(res.token)
        setUser(res.user as SafeUser)

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(TOKEN_KEY, res.token)
          setCookie(TOKEN_KEY, res.token, 30)
        }

        return res.user as SafeUser
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      if (token) {
        await logoutFn({ data: { token } })
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setToken(null)
      setUser(null)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(TOKEN_KEY)
        deleteCookie(TOKEN_KEY)
      }
      setIsLoading(false)
    }
  }, [token])

  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      if (!user) return false
      if (Array.isArray(role)) {
        return role.includes(user.role as UserRole)
      }
      return user.role === role
    },
    [user],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        hasRole,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
