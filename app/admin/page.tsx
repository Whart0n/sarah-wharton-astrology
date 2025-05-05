"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

interface BookingSummary {
  total: number
  pending: number
  confirmed: number
}

interface RecentBooking {
  id: string
  client_name: string
  service_name: string
  start_time: string
  status: string
}

export default function AdminDashboard() {
  const [bookingSummary, setBookingSummary] = useState<BookingSummary>({
    total: 0,
    pending: 0,
    confirmed: 0,
  })
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [serviceCount, setServiceCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Get booking summary
        const bookingsRes = await fetch("/api/bookings?summary=true")
        if (!bookingsRes.ok) throw new Error("Failed to fetch booking summary")
        const bookingsData = await bookingsRes.json()
        setBookingSummary(bookingsData.summary)
        setRecentBookings(bookingsData.recent || [])

        // Get service count
        const servicesRes = await fetch("/api/services?count=true")
        if (!servicesRes.ok) throw new Error("Failed to fetch service count")
        const servicesData = await servicesRes.json()
        setServiceCount(servicesData.count)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError(err instanceof Error ? err.message : "Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-deepBlue mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading dashboard data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        <p>Error: {error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-deepBlue">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your astrology practice</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Bookings</CardTitle>
            <CardDescription>All time</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{bookingSummary.total}</p>
            <Link href="/admin/bookings" className="text-sm text-deepBlue hover:underline">
              View All
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pending Bookings</CardTitle>
            <CardDescription>Awaiting confirmation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{bookingSummary.pending}</p>
            <Link
              href="/admin/bookings?filter=pending"
              className="text-sm text-deepBlue hover:underline"
            >
              View Pending
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Services</CardTitle>
            <CardDescription>Available for booking</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{serviceCount}</p>
            <Link
              href="/admin/services"
              className="text-sm text-deepBlue hover:underline"
            >
              Manage Services
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Latest booking activity</CardDescription>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">No recent bookings found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Client</th>
                    <th className="text-left py-3 px-4 font-medium">Service</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-right py-3 px-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b">
                      <td className="py-3 px-4">{booking.client_name}</td>
                      <td className="py-3 px-4">{booking.service_name}</td>
                      <td className="py-3 px-4">{formatDate(new Date(booking.start_time))}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/bookings?id=${booking.id}`}
                          className="text-sm text-deepBlue hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild variant="gold">
            <Link href="/admin/services/new">Add New Service</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/bookings">View All Bookings</Link>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await fetch("/api/calendar/sync", { method: "POST" })
                alert("Calendar synced successfully!")
              } catch (error) {
                console.error("Error syncing calendar:", error)
                alert("Failed to sync calendar. Please try again.")
              }
            }}
          >
            Sync Calendar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
