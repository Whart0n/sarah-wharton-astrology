import { NextResponse } from "next/server"
import { createPaymentIntent } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, metadata = {}, promoCode } = body;

    if (typeof amount !== 'number') {
      return NextResponse.json({ error: "Amount is required and must be a number." }, { status: 400 });
    }

    // Handle free bookings
    if (amount === 0) {
      try {
        const { createBooking } = await import('@/lib/supabase');
        const bookingPayload = {
          service_id: metadata?.serviceId,
          client_name: metadata?.clientName,
          client_email: metadata?.clientEmail,
          start_time: metadata?.startTime,
          end_time: metadata?.endTime,
          birthplace: metadata?.placeOfBirth,
          birthdate: metadata?.dateOfBirth,
          birthtime: metadata?.timeOfBirth,
          status: 'confirmed', // Directly confirmed as it's free
          focus_area: metadata?.focusArea
        };
        await createBooking(bookingPayload);
        
        // Return a URL for free confirmation
        const origin = request.headers.get('origin') || 'http://localhost:3000';
        const confirmationUrl = `${origin}/booking/confirmation?free=true`;
        return NextResponse.json({ url: confirmationUrl });
      } catch (bookingError: any) {
        console.error('Failed to create free booking:', bookingError);
        return NextResponse.json({ error: `Failed to create free booking: ${bookingError.message}` }, { status: 500 });
      }
    }

    // For paid bookings:
    // 1. Check for booking conflicts BEFORE creating checkout session
    try {
      const { getBookingsByTimeRange } = await import('@/lib/supabase');
      const startTime = new Date(metadata?.startTime);
      const endTime = new Date(metadata?.endTime);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return NextResponse.json({ error: 'Invalid start or end time provided in metadata.' }, { status: 400 });
      }

      const overlappingBookings = await getBookingsByTimeRange(startTime, endTime);
      const hasConflict = overlappingBookings && overlappingBookings.some((b: any) => b.status === 'confirmed');
      
      if (hasConflict) {
        return NextResponse.json({ error: 'This time slot is already booked. Please select another time.' }, { status: 409 }); // 409 Conflict
      }
    } catch (conflictError: any) {
      console.error('Error checking for booking conflicts:', conflictError);
      return NextResponse.json({ error: `Error checking availability: ${conflictError.message}` }, { status: 500 });
    }

    // 2. Create Stripe Checkout Session
    try {
      // Determine redirect URLs
      const origin = request.headers.get('origin') || 'http://localhost:3000';
      const successUrl = `${origin}/booking/confirmation`;
      const cancelUrl = `${origin}/booking/cancelled`;
      
      const { createCheckoutSession } = await import('@/lib/stripe');
      const session = await createCheckoutSession({
        amount,
        metadata,
        promoCode,
        successUrl,
        cancelUrl,
        productName: metadata?.serviceName || 'Astrology Service',
        productDescription: metadata?.serviceDescription || 'Astrology Reading'
      });

      // 3. Create a 'pending' booking in Supabase
      try {
        const { createBooking } = await import('@/lib/supabase');
        const bookingPayload = {
          service_id: metadata?.serviceId,
          client_name: metadata?.clientName,
          client_email: metadata?.clientEmail,
          start_time: metadata?.startTime,
          end_time: metadata?.endTime,
          birthplace: metadata?.placeOfBirth,
          birthdate: metadata?.dateOfBirth,
          birthtime: metadata?.timeOfBirth,
          payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
          checkout_session_id: typeof session.id === "string" ? session.id : null,
          status: 'pending', // Booking is pending until payment is confirmed
          focus_area: metadata?.focusArea
        };
        await createBooking(bookingPayload);
      } catch (dbError: any) {
        console.error('Failed to create pending booking in Supabase:', dbError);
        // Continue even if booking creation fails (user can still pay)
      }
      
      // 4. Return checkout session URL to redirect the user
      return NextResponse.json({ url: session.url });
      
    } catch (err: any) {
      if (err.message && err.message.includes('Invalid or expired promo code')) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }
  } catch (error: any) {
    console.error("Error creating payment session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payment request" },
      { status: 500 }
    );
  }
}
