"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Auth error:", error)
          setIsAuthenticated(false)
          if (pathname !== "/admin/login") {
            router.push("/admin/login")
          }
        } else if (data?.session) {
          setIsAuthenticated(true)
          if (pathname === "/admin/login") {
            router.push("/admin")
          }
        } else {
          setIsAuthenticated(false)
          if (pathname !== "/admin/login") {
            router.push("/admin/login")
          }
        }
      } catch (err) {
        console.error("Auth check error:", err)
        setIsAuthenticated(false)
        if (pathname !== "/admin/login") {
          router.push("/admin/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setIsAuthenticated(false)
      router.push("/admin/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Skip layout for login page
  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-deepBlue"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Active link styles
  const isLinkActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <div className="min-h-screen grid grid-cols-12 bg-muted/30">
      {/* Sidebar */}
      <div className="col-span-12 md:col-span-3 lg:col-span-2 bg-deepBlue text-white">
        <div className="p-6">
          <h1 className="text-xl font-serif mb-6">Admin Dashboard</h1>
          
          <nav className="space-y-2">
            <Link
              href="/admin"
              className={`block py-2 px-3 rounded ${
                isLinkActive("/admin") && !isLinkActive("/admin/services") && !isLinkActive("/admin/bookings")
                  ? "bg-deepBlue-light"
                  : "hover:bg-deepBlue-light"
              }`}
            >
              Overview
            </Link>
            <Link
              href="/admin/services"
              className={`block py-2 px-3 rounded ${
                isLinkActive("/admin/services")
                  ? "bg-deepBlue-light"
                  : "hover:bg-deepBlue-light"
              }`}
            >
              Services
            </Link>
            <Link
              href="/admin/bookings"
              className={`block py-2 px-3 rounded ${
                isLinkActive("/admin/bookings")
                  ? "bg-deepBlue-light"
                  : "hover:bg-deepBlue-light"
              }`}
            >
              Bookings
            </Link>
            <Link
              href="/admin/calendar"
              className={`block py-2 px-3 rounded ${
                isLinkActive("/admin/calendar")
                  ? "bg-deepBlue-light"
                  : "hover:bg-deepBlue-light"
              }`}
            >
              Calendar
            </Link>
          </nav>
          
          <div className="mt-8 pt-6 border-t border-deepBlue-light">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-white border-white/20 hover:bg-deepBlue-light"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
          
          <div className="mt-8">
            <Link
              href="/"
              className="text-sm text-white/70 hover:text-white flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Website
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="col-span-12 md:col-span-9 lg:col-span-10 p-6">
        {children}
      </div>
    </div>
  )
}
