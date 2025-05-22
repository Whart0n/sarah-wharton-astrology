import { NextResponse } from "next/server"
import { createPaymentIntent } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, metadata = {}, currency = 'usd' } = body; // Added currency, default to usd

    if (typeof amount !== 'number') {
      return NextResponse.json({ error: "Amount is required and must be a number." }, { status: 400 });
    }

    // Handle free bookings (no payment intent needed, directly confirm or create booking)
    if (amount === 0) {
      // For free bookings, you might directly create a 'confirmed' booking in Supabase
      // and then redirect or inform the user. This example skips Stripe for free items.
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
          amount_paid: 0,
          currency: currency,
          focus_area: metadata?.focusArea,
          promo_code: metadata?.promoCode
        };
        await createBooking(bookingPayload);
        // Respond in a way that booking-form.tsx can understand it's a free confirmation
        // Or, booking-form.tsx could handle amount === 0 differently before calling this API.
        return NextResponse.json({ freeBookingConfirmed: true, message: "Booking confirmed (free service)." });
      } catch (bookingError: any) {
        console.error('Failed to create free booking:', bookingError);
        return NextResponse.json({ error: `Failed to create free booking: ${bookingError.message}` }, { status: 500 });
      }
    }

    // For paid bookings:
    // 1. Check for booking conflicts BEFORE creating payment intent
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

    // 2. Create Payment Intent with Stripe
    let paymentIntent;
    try {
      // createPaymentIntent is already imported at the top
      paymentIntent = await createPaymentIntent(amount, metadata); // Pass metadata
    } catch (stripeError: any) {
      console.error('Stripe Payment Intent creation error:', stripeError);
      return NextResponse.json({ error: `Failed to initiate payment: ${stripeError.message}` }, { status: 500 });
    }

    // 3. Create a 'pending' booking in Supabase (optional, if you want to record before payment)
    // This step could also be done in the webhook after successful payment.
    // For now, we'll assume the webhook handles the 'confirmed' booking creation.
    // If you create a 'pending' booking here, ensure your webhook updates it to 'confirmed'.
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
          payment_intent_id: paymentIntent.id,
          status: 'pending', // Booking is pending until payment is confirmed
          amount_paid: amount, // Store the intended amount
          currency: currency,
          focus_area: metadata?.focusArea,
          promo_code: metadata?.promoCode
        };
        await createBooking(bookingPayload);
    } catch (dbError: any) {
        console.error('Failed to create pending booking in Supabase:', dbError);
        // Decide if this error should prevent payment. For now, we'll log and continue,
        // as the primary goal is to get the payment intent to the client.
        // However, this could lead to a payment without a corresponding pending record.
    }

    // 4. Return client_secret and id to the frontend
    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      id: paymentIntent.id
    });

  } catch (error: any) {
    console.error("Overall error in /api/payment/create-payment-intent:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred on the server." },
      { status: 500 }
    );
  }
}
