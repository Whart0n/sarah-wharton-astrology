import { google } from 'googleapis';

// Set up Google service account JWT auth
function getServiceAccountAuth() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var is not set');
  }
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.JWT(
    credentials.client_email,
    undefined,
    credentials.private_key,
    ['https://www.googleapis.com/auth/calendar']
  );
}

// Get the calendar client using service account
function getCalendarClient() {
  const auth = getServiceAccountAuth();
  return google.calendar({ version: 'v3', auth });
}

// Get the calendar ID
function getCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID || 'primary';
}

// List events in a date range
export async function listEvents(startTime: Date, endTime: Date) {
  try {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    const response = await calendar.events.list({
      calendarId,
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

// Get available time slots
export async function getAvailableTimeSlots(
  date: Date,
  durationMinutes: number
) {
  // Define business hours (9 AM to 5 PM)
  const businessHoursStart = 9;
  const businessHoursEnd = 17;
  
  // Create date objects for start and end of the day
  const startOfDay = new Date(date);
  startOfDay.setHours(businessHoursStart, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(businessHoursEnd, 0, 0, 0);
  
  // Get all events for the day
  const events = await listEvents(startOfDay, endOfDay);
  
  // Convert events to busy time ranges
  const busyRanges = events.map(event => ({
    start: new Date(event.start?.dateTime || event.start?.date || ''),
    end: new Date(event.end?.dateTime || event.end?.date || '')
  }));
  
  // Generate all possible time slots (30-minute intervals)
  const slots: Date[] = [];
  const slotInterval = 30; // minutes
  
  const currentSlot = new Date(startOfDay);
  while (currentSlot < endOfDay) {
    const slotEnd = new Date(currentSlot);
    slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);
    
    // Check if this slot conflicts with any busy range
    const isAvailable = !busyRanges.some(range => 
      (currentSlot >= range.start && currentSlot < range.end) ||
      (slotEnd > range.start && slotEnd <= range.end) ||
      (currentSlot <= range.start && slotEnd >= range.end)
    );
    
    if (isAvailable && slotEnd <= endOfDay) {
      slots.push(new Date(currentSlot));
    }
    
    // Move to next slot
    currentSlot.setMinutes(currentSlot.getMinutes() + slotInterval);
  }
  
  return slots;
}

// Create a calendar event
export async function createEvent(
  summary: string,
  description: string,
  startTime: Date,
  endTime: Date,
  attendeeEmail: string
) {
  try {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    const event = {
      summary,
      description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/New_York', // Adjust as needed
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/New_York', // Adjust as needed
      },

      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
      sendUpdates: 'all',
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

// Update a calendar event
export async function updateEvent(
  eventId: string,
  summary?: string,
  description?: string,
  startTime?: Date,
  endTime?: Date,
  attendeeEmail?: string
) {
  try {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();
    
    // First, get the existing event
    const existingEvent = await calendar.events.get({
      calendarId,
      eventId,
    });
    
    // Create the update payload
    const updatedEvent: any = {
      summary: summary || existingEvent.data.summary,
      description: description || existingEvent.data.description,
    };
    
    if (startTime) {
      updatedEvent.start = {
        dateTime: startTime.toISOString(),
        timeZone: 'America/New_York', // Adjust as needed
      };
    }
    
    if (endTime) {
      updatedEvent.end = {
        dateTime: endTime.toISOString(),
        timeZone: 'America/New_York', // Adjust as needed
      };
    }
    
    if (attendeeEmail) {
      updatedEvent.attendees = [
        { email: attendeeEmail },
      ];
    }
    
    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: updatedEvent,
      sendUpdates: 'all',
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

// Delete a calendar event
export async function deleteEvent(eventId: string) {
  try {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();
    
    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: 'all',
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}
