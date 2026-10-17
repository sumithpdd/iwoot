"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    router.replace(user ? "/dashboard" : "/login")
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white px-4 dark:from-gray-950 dark:to-gray-900">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          IWOOT
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track prices for things you want and things you have.
        </p>
        {loading ? (
          <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">Checking sign-in…</p>
        ) : (
          <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
            {user ? "Opening your dashboard…" : "Taking you to sign in…"}
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
