import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createEvent } from '@/lib/googleCalendar';
import { createClient } from '@supabase/supabase-js';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
  typescript: true,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

type WebhookMetadata = {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceId: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  duration: string;
  timeZone?: string;
};

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    if (!session.metadata) {
      console.error('No metadata found in session');
      return NextResponse.json(
        { error: 'No metadata found in session' },
        { status: 400 }
      );
    }

    const metadata = session.metadata as WebhookMetadata;

    if (!metadata.bookingId || !metadata.customerEmail || !metadata.startTime || !metadata.endTime) {
      console.error('Missing required metadata fields');
      return NextResponse.json(
        { error: 'Missing required metadata fields' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        stripe_session_id: session.id,
        stripe_payment_id: session.payment_intent as string,
        customer_name: metadata.customerName,
        customer_email: metadata.customerEmail,
        customer_phone: metadata.customerPhone || null,
        service_id: metadata.serviceId,
        service_name: metadata.serviceName,
        start_time: metadata.startTime,
        end_time: metadata.endTime,
        duration: parseInt(metadata.duration),
        time_zone: metadata.timeZone || 'America/New_York'
      })
      .eq('id', metadata.bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    const eventSummary = `Astrology Reading with ${metadata.customerName}`;
    const eventDescription = `Service: ${metadata.serviceName}\nCustomer: ${metadata.customerName}\nEmail: ${metadata.customerEmail}\nPhone: ${metadata.customerPhone || 'Not provided'}`;

    await createEvent(
      eventSummary,
      eventDescription,
      new Date(metadata.startTime),
      new Date(metadata.endTime),
      metadata.customerEmail
    );

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling checkout.session.completed:', error);
    return NextResponse.json(
      { error: 'Error handling session completion' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { data: bookings, error: findError } = await supabase
      .from('bookings')
      .select('*')
      .eq('stripe_payment_id', paymentIntent.id);

    if (findError) {
      console.error('Error fetching booking:', findError);
      return NextResponse.json(
        { error: 'Failed to fetch booking' },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      console.error('No booking found for payment intent:', paymentIntent.id);
      return NextResponse.json(
        { error: 'No booking found' },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('stripe_payment_id', paymentIntent.id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling payment success:', error);
    return NextResponse.json(
      { error: 'Error handling payment success' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { data: failedBookings, error: findError } = await supabase
      .from('bookings')
      .select('*')
      .eq('stripe_payment_id', paymentIntent.id);

    if (findError) {
      console.error('Error finding booking:', findError);
      return NextResponse.json(
        { error: 'Failed to find booking' },
        { status: 500 }
      );
    }

    if (!failedBookings || failedBookings.length === 0) {
      console.error('No booking found for payment intent:', paymentIntent.id);
      return NextResponse.json(
        { error: 'No booking found' },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'payment_failed' })
      .eq('id', failedBookings[0].id);

    if (updateError) {
      console.error('Error updating booking after payment failure:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling payment_intent.payment_failed:', error);
    return NextResponse.json(
      { error: 'Error handling payment failure' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase environment variables are not set');
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }
    if (!sig) {
      return NextResponse.json(
        { error: 'No Stripe signature found' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error('Error verifying webhook signature:', err);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        return await handleCheckoutSessionCompleted(session);
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        return await handlePaymentIntentSucceeded(paymentIntent);
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        return await handlePaymentIntentFailed(paymentIntent);
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
        return NextResponse.json({ received: true });
    }
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}
