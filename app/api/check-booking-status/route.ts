import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  console.log('Received check-booking-status request for session_id:', sessionId);
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }
  // Find booking by checkout_session_id (session_id from Stripe Checkout)
  const { data, error } = await supabase
    .from('bookings')
    .select('status')
    .eq('checkout_session_id', sessionId)
    .single();

  if (error || !data) {
    console.log('Booking not found for session_id:', sessionId, 'error:', error);
    return NextResponse.json({ status: 'not_found' });
  }
  console.log('Booking found for session_id:', sessionId, 'status:', data.status);
  return NextResponse.json({ status: data.status });
}
