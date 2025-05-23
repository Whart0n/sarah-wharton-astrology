import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const calendarId = process.env.GOOGLE_CALENDAR_ID!;
if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable not set');
}
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

const auth = new google.auth.JWT(
  credentials.client_email,
  undefined,
  credentials.private_key,
  ["https://www.googleapis.com/auth/calendar"]
);

const calendar = google.calendar({ version: "v3", auth });

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid or missing JSON body" }, { status: 400 });
  }

  // Support both single and batch slot creation
  const slots = Array.isArray(body)
    ? body
    : (body.summary && body.start && body.end)
      ? [body]
      : body.slots || [];

  if (!Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json({ error: "Missing or invalid slots array" }, { status: 400 });
  }

  // Validate all slots
  const errors: { index: number; error: string }[] = [];
  const results = await Promise.all(slots.map(async (slot, idx) => {
    const { summary, start, end } = slot;
    if (!summary || !start || !end) {
      errors.push({ index: idx, error: "Missing required fields" });
      return null;
    }
    try {
      const res = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary,
          start: { dateTime: start, timeZone: "America/Denver" },
          end: { dateTime: end, timeZone: "America/Denver" },
          colorId: "2", // Color for admin-set availability (Green)
        },
      });
      return { index: idx, event: res.data };
    } catch (error) {
      console.error("Google Calendar API error:", error);
      errors.push({ index: idx, error: "Failed to create event" });
      return null;
    }
  }));

  const successful = results.filter(r => r !== null);
  return NextResponse.json({ successful, errors });
}

