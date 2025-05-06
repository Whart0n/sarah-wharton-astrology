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
    const formattedEvents = events.map(ev => ({
      id: ev.id,
      summary: ev.summary,
      start: ev.start?.dateTime || ev.start?.date,
      end: ev.end?.dateTime || ev.end?.date,
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
