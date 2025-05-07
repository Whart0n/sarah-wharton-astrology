"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice, formatDuration } from "@/lib/utils"

// Load stripe outside of component render to avoid recreating stripe object on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  date: z.date({
    required_error: "Please select a date for your reading.",
  }),
  time: z.string({
    required_error: "Please select a time slot.",
  }),
})

interface BookingFormProps {
  service: {
    id: string
    name: string
    description: string
    duration_minutes: number
    price_cents: number
  }
}

export function BookingForm({ service }: BookingFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<'details' | 'payment'>('details')
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState("")
  const [paymentIntentId, setPaymentIntentId] = useState("")
  const [bookingData, setBookingData] = useState<any>(null)

  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  })

  // When user selects a date, fetch available time slots
  const selectedDate = form.watch("date")
  
  useEffect(() => {
    if (selectedDate) {
      setIsLoading(true);
      // Calculate start and end of the selected day
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      fetch(`/api/calendar/availability?start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}`)
        .then(res => res.json())
        .then(data => {
          // The new API returns `events` with start/end
          let slots = (data.events || []).map((ev: any) => {
            const start = new Date(ev.start);
            return start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          });
          // Remove duplicates and sort
          slots = Array.from(new Set(slots)).sort((a, b) => {
            // Convert to 24h for sorting
            const toMinutes = (t: string) => {
              const [h, m] = t.split(':');
              const hour = parseInt(h, 10);
              const min = parseInt(m, 10);
              return hour * 60 + min;
            };
            return toMinutes(a) - toMinutes(b);
          });
          // Optionally filter out past times for today
          if (selectedDate && new Date(selectedDate).toDateString() === new Date().toDateString()) {
            const now = new Date();
            slots = slots.filter(timeStr => {
              const [hour, minute] = timeStr.split(':');
              const slotDate = new Date(selectedDate);
              slotDate.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
              return slotDate > now;
            });
          }
          setAvailableTimeSlots(slots);
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Error fetching time slots:", error);
          setIsLoading(false);
        });
    }
  }, [selectedDate]);

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      // Format date/time correctly
      const [hours, minutes] = values.time.split(':').map(Number)
      const startTime = new Date(values.date)
      startTime.setHours(hours, minutes, 0, 0)
      
      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + service.duration_minutes)

      // Create payment intent
      const response = await fetch('/api/payment/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: service.price_cents,
          metadata: {
            service_id: service.id,
            service_name: service.name,
            client_name: values.name,
            client_email: values.email,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
          }
        }),
      })
      
      const data = await response.json()
      
      if (data.clientSecret) {
        // Save the booking data for later use
        setBookingData({
          service_id: service.id,
          client_name: values.name,
          client_email: values.email,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        })
        
        setClientSecret(data.clientSecret)
        setPaymentIntentId(data.paymentIntentId)
        
        // Move to payment step
        setStep('payment')
      } else {
        throw new Error("Failed to create payment intent")
      }
    } catch (error) {
      console.error("Error processing booking:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Render the form based on current step
  if (step === 'details') {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Service details card */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-deepBlue">{service.name}</CardTitle>
              <CardDescription>
                <div className="flex justify-between">
                  <span>{formatDuration(service.duration_minutes)}</span>
                  <span className="font-medium text-deepBlue">{formatPrice(service.price_cents)}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{service.description}</p>
            </CardContent>
          </Card>
          
          {/* Client information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Your Information</h3>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Date selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Select Date & Time</h3>
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => {
                      // Disable dates in the past and weekends
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      return date < today || date.getDay() === 0 || date.getDay() === 6
                    }}
                    className="rounded-md border"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedDate && (
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Slot</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {isLoading ? (
                        <div className="col-span-3 py-4 text-center">Loading available time slots...</div>
                      ) : availableTimeSlots.length === 0 ? (
                        <div className="col-span-3 py-4 text-center">No available time slots for this date</div>
                      ) : (
                        availableTimeSlots.map((timeSlot) => (
                          <Button
                            key={timeSlot}
                            type="button"
                            variant={field.value === timeSlot ? "deepBlue" : "outline"}
                            onClick={() => field.onChange(timeSlot)}
                            className="text-sm"
                          >
                            {timeSlot}
                          </Button>
                        ))
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : "Proceed to Payment"}
          </Button>
        </form>
      </Form>
    )
  }

  // Payment step
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-deepBlue">Complete Your Booking</CardTitle>
          <CardDescription>
            <div className="flex justify-between">
              <span>{service.name}</span>
              <span className="font-medium text-deepBlue">{formatPrice(service.price_cents)}</span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm bookingData={bookingData} paymentIntentId={paymentIntentId} serviceName={service.name} />
            </Elements>
          ) : (
            <div className="py-4 text-center">Loading payment form...</div>
          )}
        </CardContent>
      </Card>
      
      <Button variant="outline" onClick={() => setStep('details')} className="w-full">
        Back to Details
      </Button>
    </div>
  )
}

// Separate component for checkout form inside Stripe Elements
function CheckoutForm({ 
  bookingData, 
  paymentIntentId,
  serviceName
}: { 
  bookingData: any; 
  paymentIntentId: string;
  serviceName: string;
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!stripe || !elements) {
      return
    }
    
    setIsLoading(true)
    setErrorMessage(null)
    
    try {
      // Complete payment
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/confirmation`,
        },
      })
      
      if (error) {
        setErrorMessage(error.message ?? "An unexpected error occurred")
      } else {
        // Create booking record
        await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...bookingData,
            payment_intent_id: paymentIntentId,
          }),
        })
      }
    } catch (err) {
      console.error("Payment error:", err)
      setErrorMessage("Failed to process payment. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-6">
        <h3 className="font-medium mb-1">Booking Summary</h3>
        <p className="text-sm text-gray-600">Service: {serviceName}</p>
        {bookingData && (
          <>
            <p className="text-sm text-gray-600">
              Date: {format(new Date(bookingData.start_time), "MMMM d, yyyy")}
            </p>
            <p className="text-sm text-gray-600">
              Time: {format(new Date(bookingData.start_time), "h:mm a")} - {format(new Date(bookingData.end_time), "h:mm a")}
            </p>
          </>
        )}
      </div>
      
      <PaymentElement />
      
      {errorMessage && (
        <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
      )}
      
      <Button 
        type="submit" 
        variant="gold" 
        className="w-full" 
        disabled={!stripe || isLoading}
      >
        {isLoading ? "Processing..." : "Pay & Complete Booking"}
      </Button>
      
      <p className="text-xs text-gray-500 text-center mt-4">
        Your card will be charged immediately. Cancellations with less than 24 hours notice are non-refundable.
      </p>
    </form>
  )
}
