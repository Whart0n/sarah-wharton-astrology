import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const calendarId = process.env.GOOGLE_CALENDAR_ID!;
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);

const auth = new google.auth.JWT(
  credentials.client_email,
  undefined,
  credentials.private_key,
  ["https://www.googleapis.com/auth/calendar"]
);

const calendar = google.calendar({ version: "v3", auth });

export async function POST(req: NextRequest) {
  const { summary, start, end } = await req.json();

  if (!summary || !start || !end) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const res = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary,
        start: { dateTime: start, timeZone: "America/Denver" },
        end: { dateTime: end, timeZone: "America/Denver" },
      },
    });
    return NextResponse.json({ event: res.data });
  } catch (error) {
    console.error("Google Calendar API error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
