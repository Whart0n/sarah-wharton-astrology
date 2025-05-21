import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { handleWebhookEvent } from "@/lib/stripe"
import { supabase, updateBooking } from "@/lib/supabase"

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing signature or webhook secret');
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log('Successfully verified webhook signature');
    } catch (err: any) {
      console.error('Error verifying webhook signature:', err);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err?.message || 'Unknown error'}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        
        // Update booking status if it exists
        if (paymentIntent.metadata && paymentIntent.metadata.service_id) {
          try {
            // Find booking by payment_intent_id
            const { data: bookings } = await supabase
              .from('bookings')
              .select('id')
              .eq('payment_intent_id', paymentIntent.id)
              .limit(1)

            if (bookings && bookings.length > 0) {
              await updateBooking(bookings[0].id, {
                status: 'confirmed'
              })
            }
          } catch (error) {
            console.error('Error updating booking after payment:', error)
          }
        }
        break
        
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object
        
        // Update booking status if it exists
        if (failedPaymentIntent.metadata && failedPaymentIntent.metadata.service_id) {
          try {
            // Find booking by payment_intent_id
            const { data: bookings } = await supabase
              .from('bookings')
              .select('id')
              .eq('payment_intent_id', failedPaymentIntent.id)
              .limit(1)

            if (bookings && bookings.length > 0) {
              await updateBooking(bookings[0].id, {
                status: 'payment_failed'
              })
            }
          } catch (error) {
            console.error('Error updating booking after payment failure:', error)
          }
        }
        break
        
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Received checkout.session.completed webhook', session);
        try {
          // Get the PaymentIntent ID from the session
          const paymentIntentId = session.payment_intent;
          if (!paymentIntentId || typeof paymentIntentId !== "string") {
            console.error('No valid paymentIntentId on session:', paymentIntentId);
            break;
          }

          // Use metadata directly from the session object
          const metadata = session.metadata || {};

          // Log all received metadata for debugging
          console.log('Session metadata:', session.metadata);

          // Check for required metadata fields
          const requiredFields = [
            "serviceId",
            "clientName",
            "clientEmail",
            "startTime",
            "endTime",
            "placeOfBirth",
            "dateOfBirth",
            "timeOfBirth"
          ];
          const missing = requiredFields.filter(key => !session.metadata || !session.metadata[key]);
          if (missing.length > 0) {
            console.error('Missing required metadata fields:', missing);
            return NextResponse.json({ error: "Missing required metadata fields", missing }, { status: 400 });
          }

          // Check if a booking already exists for this session
          const { data: existingBooking, error: existingBookingError } = await supabase
            .from('bookings')
            .select('*, service:services(*)') // Fetch all fields including status and related service
            .eq('checkout_session_id', session.id)
            .maybeSingle();

          let newBooking = null;
          let bookingError = null;

          if (existingBooking) {
            // Booking found by checkout_session_id
            if (existingBooking.status !== 'confirmed') {
              console.log(`Existing booking ${existingBooking.id} found with status '${existingBooking.status}'. Attempting to update to 'confirmed'.`);
              const { data: updatedData, error: updateError } = await supabase
                .from('bookings')
                .update({
                  status: 'confirmed',
                  payment_intent_id: paymentIntentId,
                  // Ensure all other relevant metadata from Stripe session is updated
                  service_id: session.metadata.serviceId,
                  client_name: session.metadata.clientName,
                  client_email: session.metadata.clientEmail,
                  start_time: session.metadata.startTime,
                  end_time: session.metadata.endTime,
                  birthplace: session.metadata.placeOfBirth,
                  birthdate: session.metadata.dateOfBirth,
                  birthtime: session.metadata.timeOfBirth
                  // checkout_session_id is already set and used for lookup
                })
                .eq('id', existingBooking.id)
                .select('*, service:services(*)') // Reselect to get all fields including joined service
                .single();

              if (updateError) {
                console.error(`Error updating booking ${existingBooking.id} to confirmed. Previous status: ${existingBooking.status}. Error:`, updateError);
                bookingError = updateError;
                // If update fails, newBooking should still be the existingBooking to allow calendar event creation attempt, or at least logging
                newBooking = existingBooking; 
              } else {
                newBooking = updatedData;
                console.log(`Successfully updated booking ${existingBooking.id} to confirmed. New data:`, newBooking);
              }
            } else {
              // Booking was already confirmed
              console.log(`Booking ${existingBooking.id} was already confirmed. No status update needed. Ensuring newBooking is set.`);
              newBooking = existingBooking; // Use the already confirmed booking data
            }
          } else {
            // No existing booking found by checkout_session_id, create a new one
            console.log(`No existing booking found for checkout_session_id ${session.id}. Creating new booking as confirmed.`);
            const { data: insertedData, error: insertError } = await supabase
              .from('bookings')
              .insert([
                {
                  service_id: session.metadata.serviceId,
                  client_name: session.metadata.clientName,
                  client_email: session.metadata.clientEmail,
                  start_time: session.metadata.startTime,
                  end_time: session.metadata.endTime,
                  birthplace: session.metadata.placeOfBirth,
                  birthdate: session.metadata.dateOfBirth,
                  birthtime: session.metadata.timeOfBirth,
                  payment_intent_id: paymentIntentId, // from fetched PaymentIntent
                  status: 'confirmed',
                  checkout_session_id: session.id // from webhook event
                }
              ])
              .select('*, service:services(*)')
              .single();

            if (insertError) {
              console.error('Error inserting new confirmed booking:', insertError);
              bookingError = insertError;
            } else {
              newBooking = insertedData;
              console.log('Successfully created new confirmed booking:', newBooking);
            }
          }

          if (bookingError) {
            console.error('Error creating or updating booking:', bookingError);
            break;
          }

          if (newBooking) {
            // Create Google Calendar event for confirmed booking
            try {
              const { createEvent } = await import('@/lib/googleCalendar');
              console.log('Attempting to create calendar event for booking...');
              console.log('Booking data:', newBooking);
              const summary = `${newBooking.client_name} - ${newBooking.service?.name || 'Astrology Reading'}`;
              const description = `Email: ${newBooking.client_email}\nService: ${newBooking.service?.name}\nStart: ${newBooking.start_time}\nEnd: ${newBooking.end_time}` +
                `\nBirthdate: ${newBooking.birthdate || ''}` +
                `\nBirthtime: ${newBooking.birthtime || ''}` +
                `\nBirthplace: ${newBooking.birthplace || ''}`;
              
              console.log('Creating calendar event with:', {
                summary,
                description,
                startTime: new Date(newBooking.start_time),
                endTime: new Date(newBooking.end_time),
                attendeeEmail: newBooking.client_email
              });
              
              try {
                const event = await createEvent(
                  summary,
                  description,
                  new Date(newBooking.start_time),
                  new Date(newBooking.end_time),
                  newBooking.client_email
                );
                console.log('Calendar event created:', event);
                
                if (event && event.id) {
                  const { data: updatedBooking, error: updateError } = await supabase
                    .from('bookings')
                    .update({ calendar_event_id: event.id })
                    .eq('id', newBooking.id)
                    .select()
                    .single();

                  if (updateError) {
                    console.error('Error updating booking with calendar event ID:', updateError);
                  } else {
                    console.log('Updated booking with calendar event ID:', updatedBooking);
                  }
                }
              } catch (error) {
                console.error('Error creating calendar event:', error);
              }
            } catch (calendarError) {
              console.error('Error creating Google Calendar event:', calendarError);
            }
          } else {
            // Optionally, create a booking if not found (if that's your logic)
            // You can use metadata fields here to insert a new booking
            console.warn('No booking found for checkout_session_id', session.id);
          }
        } catch (error) {
          console.error('Error handling checkout.session.completed:', error);
        }
        break;
      }
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
