import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  console.log('Received check-booking-status request for session_id:', sessionId);

  if (!sessionId) {
    console.error('Missing session_id in request');
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  // Find booking by checkout_session_id (session_id from Stripe Checkout)
  console.log('Querying Supabase for booking with session_id:', sessionId);
  const { data, error } = await supabase
    .from('bookings')
    .select('id, status, calendar_event_id')
    .eq('checkout_session_id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('Booking not found yet for session_id:', sessionId, '(this is normal during webhook processing)');
      return NextResponse.json({ status: 'pending' });
    }
    console.error('Error querying booking:', error);
    return NextResponse.json({ status: 'error', error: error.message });
  }

  if (!data) {
    console.log('No booking found for session_id:', sessionId);
    return NextResponse.json({ status: 'pending' });
  }

  console.log('Booking found:', {
    id: data.id,
    status: data.status,
    hasCalendarEvent: !!data.calendar_event_id
  });

  // Only return success if we have both a confirmed status AND a calendar event
  if (data.status === 'confirmed' && data.calendar_event_id) {
    return NextResponse.json({ status: 'confirmed' });
  }

  // If confirmed but no calendar event yet, still pending
  if (data.status === 'confirmed') {
    console.log('Booking confirmed but waiting for calendar event creation');
    return NextResponse.json({ status: 'pending' });
  }

  return NextResponse.json({ status: data.status });
}
