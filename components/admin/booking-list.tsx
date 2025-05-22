"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate, formatTime, formatPrice } from "@/lib/utils"

interface Booking {
  id: string
  service: {
    id: string
    name: string
    duration_minutes: number
    price_cents: number
  }
  client_name: string
  client_email: string
  start_time: string
  end_time: string
  calendar_event_id: string | null
  payment_intent_id: string | null
  status: string
  created_at: string
  birthplace?: string
  birthdate?: string
  birthtime?: string
  zoom_link?: string;
}

import { useState as useLocalState } from "react";

function AddToCalendarButton({ bookingId, onSuccess, onError }: { bookingId: string, onSuccess: (eventId: string) => void, onError: (err: string) => void }) {
  const [loading, setLoading] = useLocalState(false);
  const [success, setSuccess] = useLocalState(false);
  const [error, setError] = useLocalState<string | null>(null);

  const handleAdd = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/bookings/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add to calendar");
      setSuccess(true);
      onSuccess(data.eventId);
    } catch (err: any) {
      setError(err.message || "Failed to add to calendar");
      onError(err.message || "Failed to add to calendar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleAdd} disabled={loading}>
      {loading ? "Adding..." : success ? "Added!" : "Add to Google Calendar"}
    </Button>
  );
}

export function BookingList() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState("all")
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; bookingId: string | null }>({
    open: false,
    bookingId: null,
  })
  const [emailStatus, setEmailStatus] = useState<{ [bookingId: string]: { loading: boolean; message: string; error: boolean } }>({});

  // Fetch bookings
  useEffect(() => {
    async function loadBookings() {
      try {
        const response = await fetch("/api/bookings")
        if (!response.ok) {
          throw new Error("Failed to fetch bookings")
        }
        const data = await response.json()
        setBookings(data)
        setFilteredBookings(data)
      } catch (err) {
        console.error("Error fetching bookings:", err)
        setError(err instanceof Error ? err.message : "Failed to load bookings")
      } finally {
        setIsLoading(false)
      }
    }

    loadBookings()
  }, [])

  // Handle filtering
  useEffect(() => {
    if (filter === "all") {
      setFilteredBookings(bookings)
    } else {
      setFilteredBookings(bookings.filter(booking => booking.status === filter))
    }
  }, [filter, bookings])

  const handleSendConfirmationEmail = async (bookingId: string) => {
    setEmailStatus(prev => ({ ...prev, [bookingId]: { loading: true, message: '', error: false } }));
    try {
      const response = await fetch('/api/admin/send-confirmation-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send confirmation email');
      }
      setEmailStatus(prev => ({ ...prev, [bookingId]: { loading: false, message: data.message || 'Email sent!', error: false } }));
      
      // If the API route confirms the booking status was updated, reflect it locally
      if (data.statusUpdated) {
           setBookings(prevBookings =>
              prevBookings.map(b =>
                b.id === bookingId ? { ...b, status: "confirmed" } : b
              )
            )
      }
      // Clear the message after a few seconds
      setTimeout(() => setEmailStatus(prev => {
        const updatedStatus = { ...prev };
        delete updatedStatus[bookingId]; // Or set message to ''
        return updatedStatus;
      }), 5000);

    } catch (err: any) {
      console.error('Error sending confirmation email:', err);
      setEmailStatus(prev => ({ ...prev, [bookingId]: { loading: false, message: err.message || 'Error sending email', error: true } }));
      setTimeout(() => setEmailStatus(prev => {
        const updatedStatus = { ...prev };
        delete updatedStatus[bookingId];
        return updatedStatus;
      }), 5000);
    }
  };

  // Cancel booking
  const handleCancelBooking = async (id: string) => {
    try {
      const response = await fetch(`/api/bookings?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      })

      if (!response.ok) {
        throw new Error("Failed to cancel booking")
      }

      // Update the booking status locally
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === id ? { ...booking, status: "cancelled" } : booking
        )
      )

      // Close dialog
      setDeleteDialog({ open: false, bookingId: null })
      router.refresh()
    } catch (err) {
      console.error("Error cancelling booking:", err)
      setError(err instanceof Error ? err.message : "Failed to cancel booking")
    }
  }

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
    return <div className="py-8 text-center">Loading bookings...</div>
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        <p>Error: {error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.refresh()}
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif text-deepBlue">Bookings</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All bookings</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            No bookings found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardHeader className="bg-deepBlue-light p-4 flex flex-row justify-between items-center">
                <CardTitle className="text-md font-medium text-white">
                  {booking.client_name}
                </CardTitle>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(booking.status)}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Service: {booking.service.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Price: {formatPrice(booking.service.price_cents)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Duration: {booking.service.duration_minutes} minutes
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Email: {booking.client_email}
                  </p>
                  {booking.birthdate && (
                    <p className="text-sm text-muted-foreground">Birthdate: {booking.birthdate}</p>
                  )}
                  {booking.birthtime && (
                    <p className="text-sm text-muted-foreground">Birthtime: {booking.birthtime}</p>
                  )}
                  {booking.birthplace && (
                    <p className="text-sm text-muted-foreground">Birthplace: {booking.birthplace}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Date: {formatDate(new Date(booking.start_time))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Time: {formatTime(new Date(booking.start_time))} - {formatTime(new Date(booking.end_time))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Booked At: {format(new Date(booking.created_at), "MMM d, yyyy, h:mm a")}
                  </p>
                </div>
                <div className="col-span-1 md:col-span-2 flex space-x-2 mt-2">
                  {booking.status !== "cancelled" && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setDeleteDialog({ open: true, bookingId: booking.id })}
                    >
                      Cancel Booking
                    </Button>
                  )}
                  {/* Send Confirmation Email Button */}
                  {(booking.status === "pending" || booking.status === "confirmed") && (
                    <div className="flex flex-col items-start space-y-1">
                      <Button
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleSendConfirmationEmail(booking.id)}
                        disabled={emailStatus[booking.id]?.loading}
                      >
                        {emailStatus[booking.id]?.loading ? "Sending Email..." : "Send Confirmation Email"}
                      </Button>
                      {emailStatus[booking.id]?.message && (
                        <p className={`text-xs ${emailStatus[booking.id]?.error ? 'text-red-600' : 'text-green-600'}`}>
                          {emailStatus[booking.id]?.message}
                        </p>
                      )}
                    </div>
                  )}
                  {booking.calendar_event_id && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                    >
                      <Link href={`https://calendar.google.com/calendar/event?eid=${btoa(booking.calendar_event_id).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`} target="_blank">
                        View in Calendar
                      </Link>
                    </Button>
                  )}
                  {/* Add to Google Calendar Button */}
                  {!booking.calendar_event_id && booking.status !== "cancelled" && (
                    <AddToCalendarButton bookingId={booking.id} onSuccess={(eventId) => {
                      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, calendar_event_id: eventId } : b));
                    }} onError={setError} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, bookingId: null })}>
              No, Keep Booking
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteDialog.bookingId && handleCancelBooking(deleteDialog.bookingId)}
            >
              Yes, Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
