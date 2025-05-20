import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { createEvent } from "@/lib/googleCalendar"

// POST /api/bookings/calendar
export async function POST(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    // Get booking details
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, service:services(*)")
      .eq("id", id)
      .single()
    if (error || !booking) {
      return NextResponse.json({ error: error?.message || "Booking not found" }, { status: 404 })
    }
    if (booking.calendar_event_id) {
      return NextResponse.json({ error: "Booking already has a calendar event" }, { status: 409 })
    }

    // Prepare Google Calendar event data
    const event = {
      summary: `${booking.service?.name || "Astrology Reading"} with ${booking.client_name}`,
      description: `Client: ${booking.client_name}\nEmail: ${booking.client_email}\nService: ${booking.service?.name}`,
      start: { dateTime: booking.start_time },
      end: { dateTime: booking.end_time },
      attendees: [
        { email: booking.client_email, displayName: booking.client_name }
      ],
    }

    // Create event in Google Calendar
    const eventId = await createEvent(event)
    if (!eventId) {
      return NextResponse.json({ error: "Failed to create Google Calendar event" }, { status: 500 })
    }

    // Update booking with calendar_event_id
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ calendar_event_id: eventId })
      .eq("id", id)
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, eventId })
  } catch (err) {
    console.error("Error adding booking to calendar:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
