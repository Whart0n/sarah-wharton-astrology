import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { handleWebhookEvent } from "@/lib/stripe"
import { supabase, updateBooking } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    // Get the request body as raw text
    const rawBody = await request.text()
    
    // Get the stripe signature from headers
    const headersList = headers()
    const signature = headersList.get('stripe-signature')
    
    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 }
      )
    }

    // Verify and construct the event
    const event = await handleWebhookEvent(signature, Buffer.from(rawBody))

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
        
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    )
  }
}
