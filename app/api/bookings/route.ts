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
    
    console.log('[Booking] Creating Zoom meeting...');
    try {
      // Use environment variable host email if available, otherwise fall back to client email
      const host_email = process.env.ZOOM_HOST_EMAIL || client_email;
      
      if (!host_email) {
        throw new Error('No host email provided and ZOOM_HOST_EMAIL not set in environment');
      }
      
      console.log(`[Booking] Using host email: ${host_email}`);
      
      // Ensure start_time is a valid ISO string for Zoom API
      let formattedStartTime: string;
      if (typeof start_time === 'string') {
        formattedStartTime = start_time;
      } else if (start_time instanceof Date) {
        formattedStartTime = start_time.toISOString();
      } else {
        formattedStartTime = new Date(start_time).toISOString();
      }
      
      console.log(`[Booking] Formatted start time for Zoom: ${formattedStartTime}`);
      
      // Verify Zoom credentials are present
      if (!process.env.ZOOM_ACCOUNT_ID || !process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
        throw new Error('Missing required Zoom API credentials. Check environment variables.');
      }
      
      zoomMeeting = await createZoomMeeting({
        topic: `Astrology Session with ${client_name}`,
        start_time: formattedStartTime,
        duration: service.duration_minutes || 60,
        timezone: 'America/Denver',
        agenda: `Astrology session for ${client_name}`,
        host_email,
      });
      
      console.log('[Booking] Zoom meeting created successfully:', {
        meetingId: zoomMeeting.meeting_id,
        joinUrl: zoomMeeting.join_url,
      });
    } catch (error: unknown) {
      zoomError = error instanceof Error ? error : new Error(String(error));
      
      // Type guard for axios error
      const axiosError = error as {
        response?: {
          data?: unknown;
        };
      };
      
      console.error('[Booking] Error creating Zoom meeting:', {
        error: zoomError.message,
        stack: zoomError.stack,
        ...(axiosError?.response?.data ? { responseData: axiosError.response.data } : {})
      });
      
      // Continue with booking creation even if Zoom fails
      console.log('[Booking] Continuing with booking creation without Zoom link');
    }

    // Insert booking into database, saving zoom_link if available
    console.log('[Booking] Creating database record...');
    const bookingData = {
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
      zoom_meeting_id: zoomMeeting?.meeting_id || null,
      zoom_error: zoomError?.message || null,
    };
    
    console.log('[Booking] Booking data:', {
      ...bookingData,
      zoom_link: zoomMeeting?.join_url ? '***zoom-link***' : null,
      zoom_meeting_id: zoomMeeting?.meeting_id || null,
    });
    
    const { data, error } = await supabase
      .from("bookings")
      .insert([bookingData])
      .select()
      .single()

    if (error) {
      console.error('[Booking] Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to create booking',
        details: error.message 
      }, { status: 500 });
    }
    
    console.log('[Booking] Booking created successfully:', { id: data.id });

    // Send confirmation emails
    try {
      // Log the template IDs we're using
      const clientTemplateId = process.env.SENDGRID_CLIENT_BOOKING_TEMPLATE_ID;
      const adminTemplateId = process.env.SENDGRID_ADMIN_BOOKING_TEMPLATE_ID;
      console.log(`[Booking] Using email templates - Client: ${clientTemplateId || 'NOT SET'}, Admin: ${adminTemplateId || 'NOT SET'}`);

      if (!clientTemplateId) {
        console.warn('[Booking] SENDGRID_CLIENT_BOOKING_TEMPLATE_ID is not set in environment variables');
      }
      
      // Prepare client confirmation email with dynamic data
      const clientEmail = getClientBookingConfirmationEmail({
        client_name,
        client_email,
        service_name: service.name,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        zoom_link: zoomMeeting?.join_url,
      });
      
      // Send client confirmation email
      console.log(`[Booking] Sending client confirmation email to ${client_email}`);
      const clientEmailResult = await sendEmail(clientEmail);
      console.log(`[Booking] Client email send result: ${clientEmailResult ? 'Success' : 'Failed'}`);
      
      // Send notification to astrologer
      console.log('[Booking] Sending notification email to admin');
      const adminEmail = getAstrologerBookingNotificationEmail({
        client_name,
        client_email,
        service_name: service.name,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        zoom_link: zoomMeeting?.join_url,
      });
      
      const adminEmailResult = await sendEmail(adminEmail);
      console.log(`[Booking] Admin email send result: ${adminEmailResult ? 'Success' : 'Failed'}`);
      
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
