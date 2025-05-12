import { NextResponse } from "next/server"
import { createPaymentIntent } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, metadata = {}, promoCode, placeOfBirth, dateOfBirth, timeOfBirth } = body;

    if (typeof amount !== 'number') {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    // Handle free bookings
    if (amount === 0) {
      // Here you could record the booking as paid/free in your DB if needed
      const origin = request.headers.get('origin') || 'http://localhost:3000';
      const confirmationUrl = `${origin}/booking/confirmation?free=true`;
      return NextResponse.json({ url: confirmationUrl });
    }

    // Compose metadata for Stripe
    const stripeMetadata = {
      ...metadata,
      ...(placeOfBirth && { placeOfBirth }),
      ...(dateOfBirth && { dateOfBirth }),
      ...(timeOfBirth && { timeOfBirth }),
      ...(promoCode && { promoCode }),
    };

    // Determine redirect URLs (adjust as needed for your deployment)
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const successUrl = `${origin}/booking/confirmation`;
    const cancelUrl = `${origin}/booking/cancelled`;

    // Create Stripe Checkout Session
    try {
      const { createCheckoutSession } = await import('@/lib/stripe');
      const session = await createCheckoutSession({
        amount,
        metadata: stripeMetadata,
        promoCode,
        successUrl,
        cancelUrl,
        productName: metadata?.serviceName || 'Service',
        productDescription: metadata?.serviceDescription || 'Astrology Reading',
      });

      // Check for overlapping confirmed bookings
      try {
        const { getBookingsByTimeRange, createBooking } = await import('@/lib/supabase');
        const startTime = new Date(metadata?.startTime);
        const endTime = new Date(metadata?.endTime);
        const overlapping = await getBookingsByTimeRange(startTime, endTime);
        const hasConflict = overlapping && overlapping.some((b: any) => b.status === 'confirmed');
        if (hasConflict) {
          return NextResponse.json({ error: 'This time slot is already booked.' }, { status: 409 });
        }
        // Compose bookingData from request body and session
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
          status: 'pending',
        };
        await createBooking(bookingPayload);
      } catch (bookingError) {
        console.error('Failed to create pending booking:', bookingError);
        // Continue even if booking creation fails (user can still pay)
      }
      return NextResponse.json({ url: session.url });
    } catch (err: any) {
      if (err.message && err.message.includes('Invalid or expired promo code')) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
