"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BookingList } from "@/components/admin/booking-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function BookingsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // Get any specific booking ID from URL if present
  const bookingId = searchParams.get('id')
  const filter = searchParams.get('filter')
  
  // If a specific booking ID is provided, we would show details
  // For now, we'll just redirect to the list view
  useEffect(() => {
    if (bookingId) {
      // In a more complete app, we would show a details view
      // For now, we'll just remove the ID from the URL
      router.push('/admin/bookings')
    }
  }, [bookingId, router])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-deepBlue mb-2">Bookings</h1>
        <p className="text-muted-foreground">Manage your astrology reading bookings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingList />
        </CardContent>
      </Card>
    </div>
  )
}
