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
    const summary = `${booking.service?.name || "Astrology Reading"} with ${booking.client_name}`;
    const description = `Client: ${booking.client_name}\nEmail: ${booking.client_email}\nService: ${booking.service?.name}`;
    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);
    const attendeeEmail = booking.client_email;

    // Create event in Google Calendar
    const event = await createEvent(summary, description, startTime, endTime, attendeeEmail);
    if (!event || !event.id) {
      return NextResponse.json({ error: "Failed to create Google Calendar event" }, { status: 500 })
    }

    // Update booking with calendar_event_id
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ calendar_event_id: event.id })
      .eq("id", id)
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, eventId: event.id })
  } catch (err) {
    console.error("Error adding booking to calendar:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
