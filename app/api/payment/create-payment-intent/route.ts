import { NextResponse } from "next/server"
import { createPaymentIntent } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const { amount, metadata } = await request.json()

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      )
    }

    // Create a payment intent
    const paymentIntent = await createPaymentIntent(amount, metadata || {})

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    )
  }
}
