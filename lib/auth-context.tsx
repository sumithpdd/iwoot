"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth"
import { auth } from "@/lib/firebase/config"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth not initialized. Please check your .env.local file.")
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      setLoading(false)

      if (user) {
        // Set auth token in cookie for server-side access
        try {
          const token = await user.getIdToken()
          document.cookie = `auth-token=${token}; path=/; max-age=3600; SameSite=Lax`
        } catch (error) {
          console.error("Error getting auth token:", error)
        }
      } else {
        document.cookie = "auth-token=; path=/; max-age=0"
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  const signOut = async () => {
    if (auth) {
      await firebaseSignOut(auth)
    }
    document.cookie = "auth-token=; path=/; max-age=0"
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

