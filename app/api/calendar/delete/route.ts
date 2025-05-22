import { NextResponse } from "next/server";
import { deleteEvent } from "@/lib/googleCalendar";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId query parameter is required" },
        { status: 400 }
      );
    }

    await deleteEvent(eventId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting calendar event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete calendar event" },
      { status: 500 }
    );
  }
}
