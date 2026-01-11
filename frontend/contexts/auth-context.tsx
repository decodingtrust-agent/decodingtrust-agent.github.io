"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface User {
  id: number
  email: string
  username: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (accessToken: string, refreshToken: string, user: User) => void
  logout: () => void
  refreshAccessToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing auth on mount
    const storedUser = localStorage.getItem("user")
    const accessToken = localStorage.getItem("access_token")

    if (storedUser && accessToken) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        // Invalid stored data, clear it
        localStorage.removeItem("user")
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
      }
    }
    setIsLoading(false)
  }, [])

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem("access_token", accessToken)
    localStorage.setItem("refresh_token", refreshToken)
    localStorage.setItem("user", JSON.stringify(userData))
    setUser(userData)
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token")

    // Call logout API to revoke refresh token
    if (refreshToken) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
      } catch {
        // Ignore errors, we're logging out anyway
      }
    }

    // Clear local storage
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    setUser(null)
  }

  const refreshAccessToken = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem("refresh_token")

    if (!refreshToken) {
      return false
    }

    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (!res.ok) {
        throw new Error("Token refresh failed")
      }

      const data = await res.json()
      localStorage.setItem("access_token", data.access_token)
      return true
    } catch {
      // Refresh failed, logout
      logout()
      return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
