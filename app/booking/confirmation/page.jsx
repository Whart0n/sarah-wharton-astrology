"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { retrievePaymentIntent } from "@/lib/stripe"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState("processing")
  const [bookingDetails, setBookingDetails] = useState(null)

  useEffect(() => {
    async function checkPaymentStatus() {
      try {
        const paymentIntentId = searchParams.get("payment_intent")
        const paymentIntentClientSecret = searchParams.get("payment_intent_client_secret")
        
        if (!paymentIntentId || !paymentIntentClientSecret) {
          setStatus("error")
          setIsLoading(false)
          return
        }

        // Check payment status with Stripe
        const response = await fetch(`/api/payment/check-status?payment_intent=${paymentIntentId}`)
        const data = await response.json()
        
        if (data.status === "succeeded") {
          setStatus("success")
          setBookingDetails(data.bookingDetails || null)
        } else if (data.status === "processing") {
          setStatus("processing")
        } else {
          setStatus("error")
        }
      } catch (error) {
        console.error("Error checking payment status:", error)
        setStatus("error")
      } finally {
        setIsLoading(false)
      }
    }

    checkPaymentStatus()
  }, [searchParams])

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-deepBlue mb-4"></div>
              <p className="text-center text-muted-foreground">Processing your booking...</p>
            </CardContent>
          </Card>
        ) : status === "success" ? (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl font-serif text-deepBlue">Booking Confirmed!</CardTitle>
              <CardDescription>Your astrology reading has been successfully booked.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">
                You will receive a confirmation email with all the details shortly. Please check your inbox (and spam folder, just in case).
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                If you have any questions about your upcoming reading, feel free to contact me.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button asChild variant="gold" className="w-full">
                <Link href="/">Return to Home</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/contact">Contact Me</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : status === "processing" ? (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle className="text-2xl font-serif text-deepBlue">Payment Processing</CardTitle>
              <CardDescription>Your payment is still being processed.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">
                Your payment is currently being processed. This may take a few moments.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                You will receive a confirmation email once the payment is complete. No need to resubmit your booking.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Return to Home</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <CardTitle className="text-2xl font-serif text-deepBlue">Payment Failed</CardTitle>
              <CardDescription>There was an issue with your payment</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">
                Unfortunately, there was a problem processing your payment. Your booking has not been confirmed.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Please try again or contact me if you continue to experience issues.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button asChild variant="gold" className="w-full">
                <Link href="/booking">Try Again</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/contact">Contact Me</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}