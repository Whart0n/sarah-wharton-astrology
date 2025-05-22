import { NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/lib/supabase"
import { deleteEvent } from "@/lib/googleCalendar"
import { getClientBookingConfirmationEmail, getAstrologerBookingNotificationEmail, sendEmail } from "@/lib/sendgrid"
import { getServiceById } from "@/lib/supabase"
import { createZoomMeeting } from "@/lib/zoom"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const summary = searchParams.get("summary") === "true"
    const date = searchParams.get("date")

    // Check if we need to return a dashboard summary
    if (summary) {
      // Get booking counts
      const { data: totalData, error: totalError } = await supabase
        .from("bookings")
        .select("id", { count: "exact" })
      
      const { data: pendingData, error: pendingError } = await supabase
        .from("bookings")
        .select("id", { count: "exact" })
        .eq("status", "pending")
      
      const { data: confirmedData, error: confirmedError } = await supabase
        .from("bookings")
        .select("id", { count: "exact" })
        .eq("status", "confirmed")
      
      // Get recent bookings (last 5)
      const { data: recentData, error: recentError } = await supabase
        .from("bookings")
        .select(`
          id, 
          client_name, 
          start_time, 
          status,
          service:services (
            name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5)
      
      if (totalError || pendingError || confirmedError || recentError) {
        throw new Error("Failed to fetch booking summary")
      }
      
      // Transform recent bookings for the UI
      const recentBookings = recentData.map(booking => ({
        id: booking.id,
        client_name: booking.client_name,
        service_name: booking.service && 'name' in booking.service ? booking.service.name : 'Unknown Service',
        start_time: booking.start_time,
        status: booking.status,
      }))
      
      return NextResponse.json({
        summary: {
          total: totalData.length,
          pending: pendingData.length,
          confirmed: confirmedData.length,
        },
        recent: recentBookings,
      })
    }

    // Check if we need to return a specific booking
    if (id) {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *, 
          service:services (*)
        `)
        .eq("id", id)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      return NextResponse.json(data)
    }

    // Check if we need to return bookings for a specific date
    if (date) {
      const dayStart = new Date(date + "T00:00:00.000Z"); // Parse date as UTC start of day
      const dayEnd = new Date(date + "T23:59:59.999Z");   // Parse date as UTC end of day

      // Alternative and often more robust way for full day range:
      // const dayStart = new Date(date); // e.g., 2023-10-26T00:00:00 local
      // dayStart.setUTCHours(0, 0, 0, 0); // Set to 2023-10-26T00:00:00Z (UTC)
      // const dayEnd = new Date(dayStart);
      // dayEnd.setUTCDate(dayStart.getUTCDate() + 1); // Set to 2023-10-27T00:00:00Z (UTC)
      // Query would then be .gte('start_time', dayStart.toISOString()).lt('start_time', dayEnd.toISOString())

      console.log(`[API Bookings GET] Fetching bookings for date: ${date}, UTC range: ${dayStart.toISOString()} to ${dayEnd.toISOString()}`);

      const { data: bookingsForDate, error: dateError } = await supabase
        .from("bookings")
        .select(`
          *, 
          service:services (*)
        `)
        .gte('start_time', dayStart.toISOString())
        .lte('start_time', dayEnd.toISOString()) // Use lte if dayEnd is end of day, or lt if dayEnd is start of next day
        .order("start_time", { ascending: true });

      if (dateError) {
        console.error("[API Bookings GET] Error fetching bookings by date:", dateError);
        return NextResponse.json({ error: dateError.message }, { status: 500 });
      }
      
      console.log(`[API Bookings GET] Found ${bookingsForDate?.length || 0} bookings for ${date}`);
      return NextResponse.json(bookingsForDate || []);
    }

    // Otherwise return all bookings
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *, 
        service:services (*)
      `)
      .order("start_time", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { service_id, client_name, client_email, start_time, end_time, payment_intent_id, birthplace, birthdate, birthtime } = await request.json()

    // Validate required fields
    if (!service_id || !client_name || !client_email || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Fetch service details
    const service = await getServiceById(service_id)
    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      )
    }

    // Create Zoom meeting before inserting booking
    let zoomMeeting = null;
    let zoomError = null;
    try {
      // You may want to put your Zoom host email in .env.local as ZOOM_HOST_EMAIL
      const host_email = process.env.ZOOM_HOST_EMAIL || client_email; // fallback to client_email if not set
      zoomMeeting = await createZoomMeeting({
        topic: `Astrology Session with ${client_name}`,
        start_time: new Date(start_time).toISOString(),
        duration: service.duration_minutes || 60,
        timezone: 'America/Denver',
        agenda: `Astrology session for ${client_name}`,
        host_email,
      });
    } catch (err) {
      zoomError = err;
      console.error('Error creating Zoom meeting:', err);
    }

    // Insert booking into database, saving zoom_link if available
    const { data, error } = await supabase
      .from("bookings")
      .insert([
        {
          service_id,
          client_name,
          client_email,
          start_time,
          end_time,
          payment_intent_id,
          birthplace,
          birthdate,
          birthtime,
          status: "confirmed",
          created_at: new Date().toISOString(),
          zoom_link: zoomMeeting?.join_url || null,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send confirmation emails
    try {
      // Send client confirmation
      await sendEmail(getClientBookingConfirmationEmail({
        client_name,
        service_name: service.name,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
      }))
      
      // Send notification to astrologer
      await sendEmail(getAstrologerBookingNotificationEmail({
        client_name,
        client_email,
        service_name: service.name,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
      }))
    } catch (emailError) {
      console.error("Failed to send confirmation emails:", emailError)
      // Continue even if emails fail
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { status } = body

    // Get the current booking
    const { data: currentBooking, error: fetchError } = await supabase
      .from("bookings")
      .select("*, service:services(*)")
      .eq("id", id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 404 })
    }

    // Update booking status
    const { data, error } = await supabase
      .from("bookings")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If status changed to cancelled and there's a calendar event, delete it
    if (status === "cancelled" && currentBooking.calendar_event_id) {
      try {
        await deleteEvent(currentBooking.calendar_event_id)
      } catch (calendarError) {
        console.error("Failed to delete calendar event:", calendarError)
        // Continue even if calendar deletion fails
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating booking:", error)
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      )
    }

    // Get the booking to check for calendar event
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("calendar_event_id")
      .eq("id", id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 404 })
    }

    // Delete the booking
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If there's a calendar event, delete it
    if (booking.calendar_event_id) {
      try {
        await deleteEvent(booking.calendar_event_id)
      } catch (calendarError) {
        console.error("Failed to delete calendar event:", calendarError)
        // Continue even if calendar deletion fails
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting booking:", error)
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    )
  }
}
