"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { format, addDays, addMinutes, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns"
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { formatPrice, formatDuration } from "@/lib/utils"
import { TIMEZONES } from "@/components/timezones"

// Load stripe outside of component render to avoid recreating stripe object on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Props type for the BookingForm component
interface BookingFormProps {
  service: Service;
  services: Service[];
}

// Define types
interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  price?: string;
  duration?: string;
}

// Type for time slots
interface TimeSlot {
  value: string;
  label: string;
  time: Date;
}

type FormStep = 'details' | 'payment' | 'confirmation';

// Form schema using Zod for validation
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  date: z.date({
    required_error: "Please select a date",
  }),
  time: z.string({
    required_error: "Please select a time slot",
  }),
  placeOfBirth: z.string().min(2, { message: "Please enter your place of birth" }),
  dateOfBirth: z.string({
    required_error: "Please enter your date of birth",
  }),
  timeOfBirth: z.string({
    required_error: "Please enter your time of birth",
  }),
  focusArea: z.string().optional(),
  promoCode: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CalendarEvent {
  start: Date;
  end: Date;
  summary?: string;
  colorId?: string;
  isAvailabilitySlot: boolean;
}

interface TimeRange {
  start: Date;
  end: Date;
}

// Main BookingForm component
export function BookingForm({ service: initialService, services }: BookingFormProps) {
  const router = useRouter();
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Initialize service state with type safety
  const [service, setService] = useState<Service>(() => ({
    id: initialService.id,
    name: initialService.name,
    description: initialService.description,
    duration_minutes: initialService.duration_minutes,
    price_cents: (initialService as any).price_cents || 0,
    price: initialService.price || formatPrice(initialService.price_cents || 0),
    duration: initialService.duration || formatDuration(initialService.duration_minutes || 0)
  }));
  
  // Booking flow state
  const [step, setStep] = useState<FormStep>('details');
  const [bookingData, setBookingData] = useState<Partial<FormValues> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [busyRanges, setBusyRanges] = useState<TimeRange[]>([]);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Set client-side state after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      placeOfBirth: "",
      dateOfBirth: "",
      timeOfBirth: "",
      focusArea: "",
      promoCode: "",
    },
  });

  // Memoize the formatted time slots
  const formattedTimeSlots = useMemo(() => {
    return availableTimeSlots.map(slot => ({
      value: slot.time.toISOString(),
      label: formatInTimeZone(slot.time, timezone, 'h:mm a'),
      time: slot.time
    }));
  }, [availableTimeSlots, timezone]);

  // Format time for display in the user's selected timezone
  const formatTimeDisplay = useCallback((date: Date): string => {
    return formatInTimeZone(date, timezone, 'h:mm a');
  }, [timezone]);

  // Generate time slots based on availability
  const generateTimeSlots = useCallback((
    date: Date,
    service: Service,
    timezone: string,
    busyRanges: TimeRange[]
  ): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const start = startOfDay(date);
    const end = endOfDay(date);
    const slotDuration = service.duration_minutes || 60;
    const bufferMinutes = 15;
    const slotInterval = 15;

    let current = new Date(start);
    
    while (current < end) {
      const slotStart = new Date(current);
      const slotEnd = addMinutes(slotStart, slotDuration);
      
      // Check if slot is within business hours (9 AM - 5 PM)
      const hour = slotStart.getHours();
      if (hour >= 9 && hour + (slotDuration / 60) <= 17) {
        // Check for conflicts with busy ranges
        const hasConflict = busyRanges.some(range => {
          const rangeStart = new Date(range.start);
          const rangeEnd = new Date(range.end);
          return (
            (slotStart >= rangeStart && slotStart < rangeEnd) ||
            (slotEnd > rangeStart && slotEnd <= rangeEnd) ||
            (slotStart <= rangeStart && slotEnd >= rangeEnd)
          );
        });

        if (!hasConflict) {
          slots.push({
            value: slotStart.toISOString(),
            label: formatInTimeZone(slotStart, timezone, 'h:mm a'),
            time: slotStart
          });
        }
      }
      
      // Move to next slot
      current = addMinutes(current, slotInterval);
    }
    
    return slots;
  }, []);

  // Fetch availability when date or service changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDate) return;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        // Fetch busy ranges from Google Calendar and Supabase
        const [googleCalendarData] = await Promise.all([
          fetch(`/api/calendar/availability?start=${format(selectedDate, 'yyyy-MM-dd')}&end=${format(addDays(selectedDate, 1), 'yyyy-MM-dd')}`).then(res => res.json()),
        ]);

        // Process Google Calendar events
        const googleEvents = (googleCalendarData.events || []).map((ev: any) => ({
          start: new Date(ev.start?.dateTime || ev.start?.date || ''),
          end: new Date(ev.end?.dateTime || ev.end?.date || ''),
          isAvailabilitySlot: (ev.summary === 'Available' || ev.colorId === '2'),
        }));

        // Combine with existing bookings
        const allBusyRanges = [
          ...googleEvents.filter((e: CalendarEvent) => !e.isAvailabilitySlot).map((e: CalendarEvent) => ({
            start: e.start,
            end: e.end,
          })),
        ];

        setBusyRanges(allBusyRanges);

        // Generate available time slots
        const slots = generateTimeSlots(selectedDate, service, timezone, allBusyRanges);
        setAvailableTimeSlots(slots);
      } catch (error) {
        console.error('Error fetching availability:', error);
        setErrorMessage('Failed to load available time slots. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [selectedDate, service, timezone, generateTimeSlots]);

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      
      // Combine date and time
      const startTime = new Date(values.date);
      const [hours, minutes] = values.time.split(':').map(Number);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = addMinutes(new Date(startTime), service.duration_minutes || 60);

      // Create booking data that matches FormValues structure
      const bookingData: Partial<FormValues> = {
        name: values.name,
        email: values.email,
        date: values.date,
        time: values.time,
        placeOfBirth: values.placeOfBirth,
        dateOfBirth: values.dateOfBirth,
        timeOfBirth: values.timeOfBirth,
        focusArea: values.focusArea,
        promoCode: values.promoCode
      };

      // Also store API-specific data for later use
      const apiBookingData = {
        service_id: service.id,
        client_name: values.name,
        client_email: values.email,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        birthplace: values.placeOfBirth,
        birthdate: values.dateOfBirth,
        birthtime: values.timeOfBirth,
        focus_area: values.focusArea,
        promo_code: values.promoCode,
      };

      // Save booking data for next step
      setBookingData(bookingData);
      
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: service.price_cents,
          metadata: {
            service_id: service.id,
            service_name: service.name,
            client_name: values.name,
            client_email: values.email,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId } = await response.json();
      setClientSecret(clientSecret);
      setPaymentIntentId(paymentIntentId);
      setStep('payment');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to process your booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Checkout form component
  const CheckoutForm = ({ bookingData, paymentIntentId, serviceName }: {
    bookingData: any;
    paymentIntentId: string;
    serviceName: string;
  }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!stripe || !elements) {
        return;
      }

      setIsProcessing(true);

      try {
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/booking/confirmation`,
            receipt_email: bookingData.client_email,
          },
          redirect: 'if_required',
        });

        if (error) {
          throw error;
        }

        if (paymentIntent.status === 'succeeded') {
          // Complete the booking
          const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...bookingData,
              payment_intent_id: paymentIntentId,
              status: 'confirmed',
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to save booking');
          }

          setStep('confirmation');
        }
      } catch (error) {
        console.error('Payment error:', error);
        toast.error('Payment failed. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="mb-6">
          <h3 className="font-medium mb-1">Booking Summary</h3>
          <p className="text-sm text-muted-foreground">
            {serviceName} - {formatDuration(service.duration_minutes)}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(bookingData.start_time), 'EEEE, MMMM d, yyyy h:mm a')} -{' '}
            {format(new Date(bookingData.end_time), 'h:mm a')}
          </p>
          <p className="mt-2 font-medium">
            Total: {formatPrice(service.price_cents)}
          </p>
        </div>

        <PaymentElement />
        
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep('details')}
            disabled={isProcessing}
          >
            Back
          </Button>
          <Button type="submit" disabled={!stripe || isProcessing}>
            {isProcessing ? 'Processing...' : 'Pay Now'}
          </Button>
        </div>
      </form>
    );
  };

  // Render payment form when on payment step
  if (step === 'payment' && clientSecret) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Complete Your Booking</CardTitle>
          <CardDescription>Enter your payment details to confirm your booking</CardDescription>
        </CardHeader>
        <CardContent>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
              },
            }}
          >
            <CheckoutForm 
              bookingData={bookingData} 
              paymentIntentId={paymentIntentId!} 
              serviceName={service.name} 
            />
          </Elements>
        </CardContent>
      </Card>
    );
  }

  // Render confirmation when booking is complete
  if (step === 'confirmation') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Booking Confirmed!</CardTitle>
          <CardDescription>Your booking has been confirmed.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            We've sent a confirmation email to {bookingData?.email} with all the details.
          </p>
          <Button onClick={() => router.push('/')}>Back to Home</Button>
        </CardContent>
      </Card>
    );
  }

  // Render the main booking form
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Book Your {service.name} Session</CardTitle>
        <CardDescription>
          {service.description} - {formatDuration(service.duration_minutes)} - {formatPrice(service.price_cents)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
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
                      <Input type="email" placeholder="your@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date and Time Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Date & Time</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date: Date | undefined) => setSelectedDate(date || null)}
                    disabled={(date) => {
                      // Disable past dates
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                    className="rounded-md border"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Time</Label>
                  {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : selectedDate && formattedTimeSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                      {formattedTimeSlots.map((slot) => (
                        <Button
                          key={slot.value}
                          type="button"
                          variant={form.watch('time') === slot.value ? 'default' : 'outline'}
                          className="justify-start"
                          onClick={() => form.setValue('time', slot.value)}
                        >
                          {slot.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-20 text-muted-foreground">
                      {selectedDate ? 'No available time slots' : 'Select a date first'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Birth Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Birth Information (for your reading)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="placeOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Place of Birth</FormLabel>
                      <FormControl>
                        <Input placeholder="City, Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timeOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time of Birth</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <FormField
                control={form.control}
                name="focusArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What would you like to focus on? (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any specific areas of your life you'd like to explore?"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="promoCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promo Code (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter promo code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Continue to Payment'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default BookingForm;
