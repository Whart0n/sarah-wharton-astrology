import { NextResponse } from "next/server"
import { createPaymentIntent } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, metadata = {}, promoCode, placeOfBirth, dateOfBirth, timeOfBirth } = body;

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
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
