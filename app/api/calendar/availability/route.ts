import { NextResponse } from "next/server"
import { listEvents } from "@/lib/googleCalendar"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startParam = searchParams.get("start")
    const endParam = searchParams.get("end")

    if (!startParam || !endParam) {
      return NextResponse.json(
        { error: "start and end query parameters are required" },
        { status: 400 }
      )
    }

    const start = new Date(startParam)
    const end = new Date(endParam)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid start or end date format" },
        { status: 400 }
      )
    }

    // Fetch all events in the given range
    const events = await listEvents(start, end)
    
    // Format the events for display, including all necessary fields
    const formattedEvents = events.map(ev => ({
      id: ev.id,
      summary: ev.summary || 'Available', // Default to 'Available' if no summary
      start: {
        dateTime: ev.start?.dateTime,
        date: ev.start?.date
      },
      end: {
        dateTime: ev.end?.dateTime,
        date: ev.end?.date
      },
      // Include any other fields needed for display
      colorId: ev.colorId,
      status: ev.status,
      // Include the raw event data for debugging if needed
      raw: ev
    }))

    return NextResponse.json({ events: formattedEvents })
  } catch (error) {
    console.error("Error fetching calendar events:", error)
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    )
  }
}
