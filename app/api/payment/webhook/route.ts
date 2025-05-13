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

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    if (!session.metadata) {
      console.error('No metadata found in session');
      return NextResponse.json(
        { error: 'No metadata found in session' },
        { status: 400 }
      );
    }

    const { bookingId } = session.metadata;

    if (!bookingId) {
      console.error('No booking ID found in session metadata');
      return NextResponse.json(
        { error: 'No booking ID found in session metadata' },
        { status: 400 }
      );
    }

    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError) {
      console.error('Error fetching booking:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch booking' },
        { status: 500 }
      );
    }

    if (!booking) {
      console.error('No booking found for ID:', bookingId);
      return NextResponse.json(
        { error: 'No booking found' },
        { status: 404 }
      );
    }

    const paymentIntentId = typeof session.payment_intent === 'string' ? 
      session.payment_intent : 
      session.payment_intent?.id;

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        stripe_session_id: session.id,
        stripe_payment_id: paymentIntentId,
        customer_email: session.customer_details?.email || ''
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling checkout completion:', error);
    return NextResponse.json(
      { error: 'Error handling checkout completion' },
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
    if (findError) {
      console.error('Error finding booking:', findError);
      return NextResponse.json(
        { error: 'Failed to find booking' },
        { status: 500 }
      );
    }

    if (failedBookings && failedBookings.length > 0) {
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

    if (!sig) {
      console.error('No Stripe signature found');
      return NextResponse.json(
        { error: 'No Stripe signature found' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
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

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          return handleCheckoutSessionCompleted(session);
        }
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          return handlePaymentIntentSucceeded(paymentIntent);
        }
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          return handlePaymentIntentFailed(paymentIntent);
        }
        default:
          console.log(`Unhandled event type: ${event.type}`);
          return NextResponse.json({ received: true });
      }
    } catch (error: any) {
      console.error(`Error handling ${event.type}:`, error);
      return NextResponse.json(
        { error: 'Error processing webhook' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}
  try {
    const body = await request.text();
    const sig = headers().get('stripe-signature');

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
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    console.log(`Processing event type: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log('Processing checkout.session.completed:', session.id);
          return handleCheckoutSessionCompleted(session);
        }

        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log('Processing payment_intent.succeeded:', paymentIntent.id);
          return handlePaymentIntentSucceeded(paymentIntent);
        }

        case 'payment_intent.payment_failed': {
          const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log('Processing payment_intent.payment_failed:', failedPaymentIntent.id);
          return handlePaymentIntentFailed(failedPaymentIntent);
        }

        default:
          console.log(`Unhandled event type ${event.type}`);
          return NextResponse.json({ received: true });
      }
    } catch (error: any) {
      console.error('Error processing webhook event:', error);
      return NextResponse.json(
        { error: 'Error processing webhook event' },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error('Error:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
  console.log('Webhook endpoint called');
  try {
    const rawBody = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    console.log('Stripe signature:', signature?.slice(0, 20) + '...');
    console.log('Has webhook secret:', !!process.env.STRIPE_WEBHOOK_SECRET);
    
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing signature or webhook secret');
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    try {
      console.log('Constructing webhook event...');
      console.log('Raw body length:', rawBody.length);
      console.log('First 100 chars of raw body:', rawBody.slice(0, 100));
      
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      console.log('Successfully verified webhook signature');
      console.log('Event type:', event.type);
      console.log('Event ID:', event.id);
    } catch (err: any) {
      console.error('Error verifying webhook signature:', err);
      console.error('Error details:', {
        message: err?.message,
        stack: err?.stack,
        name: err?.name
      });
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err?.message || 'Unknown error'}` },
        { status: 400 }
      );
    }

    // Handle the event
            );
            service_id: session.metadata.serviceId,
            customer_name: session.metadata.clientName,
            customer_email: session.metadata.clientEmail,
            start_time: new Date(session.metadata.startTime),
            end_time: new Date(session.metadata.endTime),
            birth_date: session.metadata.dateOfBirth,
            birth_time: session.metadata.timeOfBirth,
            birth_place: session.metadata.placeOfBirth,
            status: 'confirmed',
            amount_paid: session.amount_total,
            stripe_payment_id: session.payment_intent
          };
          
          console.log('Creating booking with data:', bookingData);
          
          const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select()
            .single();
            
          if (bookingError) {
            console.error('Error creating booking:', bookingError);
            return NextResponse.json(
              { error: 'Failed to create booking' },
              { status: 500 }
            );
          }
          
          console.log('Successfully created booking:', booking.id);
          
          // Create Google Calendar event
          try {
            const eventDescription = `
Client: ${session.metadata.clientName}
Email: ${session.metadata.clientEmail}
Service: ${service.name}
Birth Date: ${session.metadata.dateOfBirth}
Birth Time: ${session.metadata.timeOfBirth}
Birth Place: ${session.metadata.placeOfBirth}
            `.trim();
            
            const { createEvent } = await import('@/lib/googleCalendar');
            const calendarEvent = await createEvent(
              `${service.name} - ${session.metadata.clientName}`,
              eventDescription,
              new Date(session.metadata.startTime),
              new Date(session.metadata.endTime),
              session.metadata.clientEmail
            );
            
            console.log('Created calendar event:', calendarEvent.id);
            
            // Update booking with calendar event ID
            const { error: updateError } = await supabase
              .from('bookings')
              .update({ calendar_event_id: calendarEvent.id })
              .eq('id', booking.id);
              
            if (updateError) {
              console.error('Error updating booking with calendar event:', updateError);
              // Don't throw here - we still want to confirm the booking even if calendar update fails
            } else {
              console.log('Successfully updated booking with calendar event ID');
            }
          } catch (calendarError: any) {
            console.error('Error creating calendar event:', calendarError);
            // Don't throw here - we still want to confirm the booking even if calendar fails
          }

          return NextResponse.json({ received: true });
        } catch (err: any) {
          console.error('Error processing checkout session:', err);
          return NextResponse.json(
            { error: err?.message || 'Unknown error processing checkout session' },
            { status: 500 }
          );
        }
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Processing payment_intent.succeeded:', paymentIntent.id);
        
        try {
          // Find booking by payment_intent_id
          const { data: bookings, error: findError } = await supabase
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

          if (bookings && bookings.length > 0) {
            const { error: updateError } = await supabase
              .from('bookings')
              .update({ status: 'paid' })
              .eq('id', bookings[0].id);

            if (updateError) {
              console.error('Error updating booking after payment:', updateError);
              return NextResponse.json(
                { error: 'Failed to update booking status' },
                { status: 500 }
              );
            }
          }
        } catch (error: any) {
          console.error('Error updating booking after payment:', error);
          return NextResponse.json(
            { error: 'Failed to process payment success' },
            { status: 500 }
          );
        }
        return NextResponse.json({ received: true });
      }
      
      case 'payment_intent.payment_failed': {
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Processing payment_intent.payment_failed:', failedPaymentIntent.id);
        
        try {
          const { data: failedBookings, error: findError } = await supabase
            .from('bookings')
            .select('*')
            .eq('stripe_payment_id', failedPaymentIntent.id);

          if (findError) {
            console.error('Error finding booking:', findError);
            return NextResponse.json(
              { error: 'Failed to find booking' },
              { status: 500 }
            );
          }

          if (failedBookings && failedBookings.length > 0) {
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
          }
        } catch (error: any) {
          console.error('Error updating booking after payment failure:', error);
          return NextResponse.json(
            { error: 'Failed to process payment failure' },
            { status: 500 }
          );
          // Find booking by payment_intent_id
          const { data: bookings, error: findError } = await supabase
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

          if (bookings && bookings.length > 0) {
            const { error: updateError } = await supabase
              .from('bookings')
              .update({ status: 'paid' })
              .eq('id', bookings[0].id);

            if (updateError) {
              console.error('Error updating booking after payment:', updateError);
              return NextResponse.json(
                { error: 'Failed to update booking status' },
                { status: 500 }
              );
            }
          }
          return NextResponse.json({ received: true });
        } catch (error: any) {
          console.error('Error updating booking after payment:', error);
          return NextResponse.json(
            { error: 'Failed to process payment success' },
            { status: 500 }
          );
        }
      }
      
      case 'payment_intent.payment_failed': {
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Processing payment_intent.payment_failed:', failedPaymentIntent.id);
        
        try {
          const { data: failedBookings, error: findError } = await supabase
            .from('bookings')
            .select('*')
            .eq('stripe_payment_id', failedPaymentIntent.id);

          if (findError) {
            console.error('Error finding booking:', findError);
            return NextResponse.json(
              { error: 'Failed to find booking' },
              { status: 500 }
            );
          }

          if (failedBookings && failedBookings.length > 0) {
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
          }
          return NextResponse.json({ received: true });
        } catch (error: any) {
          console.error('Error updating booking after payment failure:', error);
          return NextResponse.json(
            { error: 'Failed to process payment failure' },
            { status: 500 }
          );
        }
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
        return NextResponse.json({ received: true });
    }
  } catch (err: any) {
    console.error('Error:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
