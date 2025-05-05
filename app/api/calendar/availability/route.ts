import { NextResponse } from "next/server"
import { getAvailableTimeSlots } from "@/lib/googleCalendar"
import { format } from "date-fns"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get("date")
    const durationParam = searchParams.get("duration") || "60" // Default to 60 minutes

    if (!dateParam) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      )
    }

    // Parse date and duration
    const date = new Date(dateParam)
    const durationMinutes = parseInt(durationParam)

    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      )
    }

    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      return NextResponse.json(
        { error: "Invalid duration" },
        { status: 400 }
      )
    }

    // Get available time slots from Google Calendar
    const availableSlots = await getAvailableTimeSlots(date, durationMinutes)

    // Format the time slots for display
    const formattedTimeSlots = availableSlots.map(slot => 
      format(slot, 'HH:mm')
    )

    return NextResponse.json({ availableTimeSlots: formattedTimeSlots })
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json(
      { error: "Failed to fetch available time slots" },
      { status: 500 }
    )
  }
}
