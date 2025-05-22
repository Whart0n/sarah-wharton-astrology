"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BookingList } from "@/components/admin/booking-list"
import { BookingForm } from "@/components/admin/booking-form"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function BookingsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-deepBlue mb-2">Bookings</h1>
          <p className="text-muted-foreground">Manage your astrology reading bookings</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="btn-elegant" onClick={() => setOpen(true)}>
              + Add Booking
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manual Booking</DialogTitle>
            </DialogHeader>
            <BookingForm onSuccess={() => { setOpen(false); setRefreshKey(k => k + 1); }} />
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingList key={refreshKey} />
        </CardContent>
      </Card>
    </div>
  )
}
