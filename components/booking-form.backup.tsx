"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { formatPrice, formatDuration } from "@/lib/utils"
import { TIMEZONES } from "@/components/timezones"

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
  placeOfBirth: z.string().min(2, { message: "Place of birth is required." }),
  dateOfBirth: z.string().min(1, { message: "Date of birth is required." }),
  timeOfBirth: z.string().min(1, { message: "Time of birth is required." }),
  promoCode: z.string().optional(),
  focusArea: z.string().max(1000, { message: "Please keep your focus area under 1000 characters." }).optional(),
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
  // Timezone state
  const browserTz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
  const [timezone, setTimezone] = useState(browserTz);

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
      placeOfBirth: "",
      dateOfBirth: "",
      timeOfBirth: "",
      promoCode: "",
      focusArea: "",
    },
  })

  // When user selects a date, fetch available time slots
  const selectedDate = form.watch("date")
  
  useEffect(() => {
  if (selectedDate) {
    setIsLoading(true);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Slot generation config (defined once)
    const serviceDuration = service.duration_minutes;
    const bufferMinutes = 30; 
    const slotInterval = 30; // minutes

    const formattedDate = format(selectedDate, 'yyyy-MM-dd'); // Ensure 'format' is imported from 'date-fns'

    const googleCalendarPromise = fetch(`/api/calendar/availability?start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}`)
      .then(res => {
        if (!res.ok) throw new Error(`Google Calendar API error: ${res.statusText} - ${res.status}`);
        return res.json();
      });

    // Assumes your /api/bookings GET endpoint can filter by a 'date' query parameter (e.g., 'YYYY-MM-DD')
    const supabaseBookingsPromise = fetch(`/api/bookings?date=${formattedDate}`)
      .then(res => {
        if (!res.ok) throw new Error(`Supabase bookings API error: ${res.statusText} - ${res.status}`);
        return res.json();
      });

    Promise.all([googleCalendarPromise, supabaseBookingsPromise])
      .then(([googleCalendarData, supabaseBookingsData]) => {
        console.log(`[Availability Check] Selected Date: ${selectedDate.toISOString()}`);
        console.log(`[Availability Check] Fetched Google Events for ${selectedDate.toLocaleDateString()}:`, googleCalendarData.events ? JSON.stringify(googleCalendarData.events, null, 2) : "No Google events data");
        console.log(`[Availability Check] Fetched Supabase Bookings for ${selectedDate.toLocaleDateString()}:`, supabaseBookingsData ? JSON.stringify(supabaseBookingsData, null, 2) : "No Supabase bookings data");

        let busyRanges: { start: Date; end: Date }[] = [];

        // Define types for events and availability slots
        interface CalendarEvent {
          start: Date;
          end: Date;
          isAvailabilitySlot: boolean;
        }
        
        // Process Google Calendar events
        const googleEvents = (googleCalendarData.events || []).map((ev: any) => {
          // Parse start and end dates correctly from the response
          const start = new Date(ev.start?.dateTime || ev.start?.date);
          const end = new Date(ev.end?.dateTime || ev.end?.date);
          
          // Make sure dates are properly parsed
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.error(`[Availability Check] Invalid date in Google event:`, ev);
            return null;
          }
          
          // Only add to busy ranges if this is NOT an availability slot
          // Available slots have summary 'Available' or colorId '2'
          const isAvailabilitySlot = (ev.summary === 'Available' || ev.colorId === '2');
          
          console.log(`[Availability Check] Processed Google event: ${ev.summary}, Start: ${start.toISOString()}, End: ${end.toISOString()}, IsAvailable: ${isAvailabilitySlot}`);
          
          return {
            start,
            end,
            isAvailabilitySlot
          } as CalendarEvent;
        }).filter((ev: any): ev is CalendarEvent => ev !== null);
        
        // Filter out availability slots from busy ranges
        const busyGoogleEvents = googleEvents.filter((ev: CalendarEvent) => !ev.isAvailabilitySlot);
        busyRanges.push(...busyGoogleEvents);
        
        // Extract availability slots to use for generating available time slots
        const availabilitySlots = googleEvents.filter((ev: CalendarEvent) => ev.isAvailabilitySlot);

        // Process Supabase bookings
        // Adjust this based on the actual structure of your bookingsData response
        let actualBookingsArray: any[] = [];
        if (Array.isArray(supabaseBookingsData)) {
            actualBookingsArray = supabaseBookingsData;
        } else if (supabaseBookingsData && Array.isArray(supabaseBookingsData.bookings)) { // e.g., { bookings: [] }
            actualBookingsArray = supabaseBookingsData.bookings;
        } else if (supabaseBookingsData && Array.isArray(supabaseBookingsData.data)) { // e.g., { data: [] }
            actualBookingsArray = supabaseBookingsData.data;
        } else if (supabaseBookingsData && typeof supabaseBookingsData === 'object' && Object.keys(supabaseBookingsData).length === 0) { // Empty object response
            actualBookingsArray = [];
        }


        const supabaseBookings = actualBookingsArray.map((booking: any) => ({
          start: new Date(booking.start_time),
          end: new Date(booking.end_time)
        }));
        busyRanges.push(...supabaseBookings);
        
        console.log(`[Availability Check] Combined Busy Ranges (${busyRanges.length} total):`, busyRanges.map(r => ({start: r.start.toISOString(), end: r.end.toISOString()})));

        // Generate available time slots based on admin-set availability
        let slots: string[] = [];
        
        // If there are admin-set availability slots, use those
        if (availabilitySlots.length > 0) {
          console.log(`[Availability Check] Found ${availabilitySlots.length} admin-set availability slots`);
          
          // For each availability slot, generate bookable time slots based on service duration
          availabilitySlots.forEach((availableBlock: CalendarEvent) => {
            let currentSlotTime = new Date(availableBlock.start);
            const blockEnd = new Date(availableBlock.end);
            
            // Generate slots within this availability block
            while (currentSlotTime.getTime() + serviceDuration * 60000 <= blockEnd.getTime()) {
              const slotStart = new Date(currentSlotTime);
              const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);
              // Add buffer for checking conflicts
              const slotWithBufferEnd = new Date(slotStart.getTime() + (serviceDuration + bufferMinutes) * 60000);
              
              // Check if this potential slot overlaps with any busy time
              let overlaps = false;
              
              // Log detailed information about the slot being checked
              const slotStartStr = slotStart.toISOString();
              const slotEndStr = slotWithBufferEnd.toISOString();
              console.log(`[Availability Check] Checking slot: ${slotStartStr} to ${slotEndStr}`);
              
              // Check each busy range for overlaps
              for (const busyEvent of busyRanges) {
                // Make sure busyEvent dates are valid
                if (!busyEvent.start || !busyEvent.end || 
                    isNaN(busyEvent.start.getTime()) || isNaN(busyEvent.end.getTime())) {
                  console.warn('[Availability Check] Invalid busy event:', busyEvent);
                  continue; // Skip invalid events
                }
                
                // Check if slots are on the same day - this is critical
                const sameDay = slotStart.toDateString() === busyEvent.start.toDateString();
                if (!sameDay) {
                  // Skip busy events from different days
                  continue;
                }
                
                // Check if this slot overlaps with a busy event
                // Only mark as overlapping if the slot's start time is between the busy event's start and end time
                // OR if the busy event starts during our slot
                if ((slotStart.getTime() >= busyEvent.start.getTime() && slotStart.getTime() < busyEvent.end.getTime()) ||
                    (busyEvent.start.getTime() >= slotStart.getTime() && busyEvent.start.getTime() < slotWithBufferEnd.getTime())) {
                  
                  console.log(`[Availability Check] Overlap detected with busy event: ${busyEvent.start.toISOString()} to ${busyEvent.end.toISOString()}`);
                  overlaps = true;
                  break;
                }
              }
              
              if (!overlaps) {
                const timeSlot = slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                console.log(`[Availability Check] Adding available time slot: ${timeSlot}`);
                slots.push(timeSlot);
              }
              
              // Move to next potential slot (30-minute intervals)
              currentSlotTime = new Date(currentSlotTime.getTime() + slotInterval * 60000);
            }
          });
        } else {
          // Fallback to business hours if no admin-set availability
          console.log(`[Availability Check] No admin-set availability slots found, using business hours`);
          
          // Define the working window for the day
          const businessStart = new Date(startOfDay);
          businessStart.setHours(9, 0, 0, 0); // 9 AM
          const businessEnd = new Date(startOfDay);
          businessEnd.setHours(17, 0, 0, 0); // 5 PM
          
          let currentSlotTime = new Date(businessStart);
          
          // Generate slots: service must end by businessEnd
          while (currentSlotTime.getTime() + serviceDuration * 60000 <= businessEnd.getTime()) {
            const slotStart = new Date(currentSlotTime);
            const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);
            // Interval to check for conflicts: [slotStart, slotStart + serviceDuration + bufferMinutes)
            const slotWithBufferEnd = new Date(slotStart.getTime() + (serviceDuration + bufferMinutes) * 60000);
            
            let overlaps = false;
            
            // Log detailed information about the slot being checked
            const slotStartStr = slotStart.toISOString();
            const slotEndStr = slotWithBufferEnd.toISOString();
            console.log(`[Availability Check] Checking business hours slot: ${slotStartStr} to ${slotEndStr}`);
            
            // Check each busy range for overlaps
            for (const busyEvent of busyRanges) {
              // Make sure busyEvent dates are valid
              if (!busyEvent.start || !busyEvent.end || 
                  isNaN(busyEvent.start.getTime()) || isNaN(busyEvent.end.getTime())) {
                console.warn('[Availability Check] Invalid busy event:', busyEvent);
                continue; // Skip invalid events
              }
              
              // Check if slots are on the same day - this is critical
              const sameDay = slotStart.toDateString() === busyEvent.start.toDateString();
              if (!sameDay) {
                // Skip busy events from different days
                continue;
              }
              
              // Check if this slot overlaps with a busy event
              // Only mark as overlapping if the slot's start time is between the busy event's start and end time
              // OR if the busy event starts during our slot
              if ((slotStart.getTime() >= busyEvent.start.getTime() && slotStart.getTime() < busyEvent.end.getTime()) ||
                  (busyEvent.start.getTime() >= slotStart.getTime() && busyEvent.start.getTime() < slotWithBufferEnd.getTime())) {
                
                console.log(`[Availability Check] Overlap detected with busy event: ${busyEvent.start.toISOString()} to ${busyEvent.end.toISOString()}`);
                overlaps = true;
                break;
              }
            }
            
            if (!overlaps) {
              const timeSlot = slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              console.log(`[Availability Check] Adding available business hours slot: ${timeSlot}`);
              slots.push(timeSlot);
            }
            
            currentSlotTime = new Date(currentSlotTime.getTime() + slotInterval * 60000);
          }
        }

        // Remove duplicates, sort, and filter past times for today
        slots = Array.from(new Set(slots)).sort();
        if (selectedDate && new Date(selectedDate).toDateString() === new Date().toDateString()) {
          const now = new Date();
          slots = slots.filter((timeStr: string) => {
            const [hour, minute] = timeStr.split(':');
            const slotDateForComparison = new Date(selectedDate); 
            slotDateForComparison.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
            return slotDateForComparison > now;
          });
        }
        setAvailableTimeSlots(slots);
        console.log(`[Availability Check] Generated ${slots.length} slots:`, slots);

      })
      .catch(error => {
        console.error("[Availability Check] Error fetching or processing availability data:", error);
        setAvailableTimeSlots([]); 
      })
      .finally(() => {
        setIsLoading(false);
      });
  } else {
    setAvailableTimeSlots([]);
    // If selectedDate becomes null (e.g., user clears the date picker)
    // and a fetch was in progress, isLoading might be true.
    // Ensure it's reset.
    if (isLoading) { 
        setIsLoading(false);
    }
  }
}, [selectedDate, service.duration_minutes]);

  // Format time slots for display in the user's selected timezone
  const formattedTimeSlots = useMemo(() => {
    if (!selectedDate) return [];
    return availableTimeSlots.map(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const dateInUtc = new Date(selectedDate);
      dateInUtc.setUTCHours(hours, minutes, 0, 0); // Assuming fetched times are UTC or server's local that needs conversion
      
      // This part needs careful review: If `availableTimeSlots` are already generated based on `startOfDay`
      // which is in local timezone, then they might not need UTC conversion here.
      // For now, assuming `time` is a 24hr string like "14:00" that needs to be set on the selectedDate
      // and then formatted to the target `timezone`.
      const slotDateTime = new Date(selectedDate);
      slotDateTime.setHours(hours, minutes, 0, 0);

      return {
        value: time, // Store the original 24hr time string for submission
        label: slotDateTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: timezone, hour12: true }) // Display formatted for selected timezone
      };
    });
  }, [availableTimeSlots, selectedDate, timezone]);

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    const [hours, minutes] = values.time.split(':').map(Number);
    const startTime = new Date(values.date);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + service.duration_minutes);

    const bookingDetails = {
      service_id: service.id,
      client_name: values.name,
      client_email: values.email,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      birthplace: values.placeOfBirth,
      birthdate: values.dateOfBirth, // Assuming this is already a string like 'YYYY-MM-DD'
      birthtime: values.timeOfBirth, // Assuming this is already a string like 'HH:MM'
      promo_code: values.promoCode,
      focus_area: values.focusArea,
      // status will be set by webhook or after successful payment
    };
    setBookingData(bookingDetails); // Save booking data for CheckoutForm

    // Create Payment Intent
    try {
      const response = await fetch('/api/payment/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: service.price_cents,
          currency: 'usd', // Or your desired currency
          metadata: { // Pass all necessary booking data for webhook
            serviceId: service.id,
            serviceName: service.name,
            clientName: values.name,
            clientEmail: values.email,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            durationMinutes: service.duration_minutes.toString(),
            placeOfBirth: values.placeOfBirth,
            dateOfBirth: values.dateOfBirth,
            timeOfBirth: values.timeOfBirth,
            timezone: timezone, // Pass selected timezone
            focusArea: values.focusArea || '',
            promoCode: values.promoCode || ''
          }
        }),
      });

      const checkoutData = await response.json();

      if (!response.ok || !checkoutData.url) {
        throw new Error(checkoutData.error || 'Failed to create payment session');
      }
      
      // Redirect to Stripe Checkout
      window.location.href = checkoutData.url;

    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      // Display error to user in the form
      form.setError("root.serverError", {
        type: "manual",
        message: error.message || "Could not proceed to payment. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (step === 'payment' && clientSecret) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Complete Your Payment</CardTitle>
          <CardDescription>Enter your card details below to confirm your booking for {service.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm 
              bookingData={bookingData} 
              paymentIntentId={paymentIntentId} 
              serviceName={service.name} 
            />
          </Elements>
        </CardContent>
      </Card>
    );
  }

  return step === 'details' ? (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Book Your {service.name} Session</CardTitle>
        <CardDescription>
          {service.description} - {formatDuration(service.duration_minutes)} - {formatPrice(service.price_cents)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
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
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Timezone Selection Section */}
            <div className="space-y-2">
              <Label htmlFor="timezone-select">
                Your Timezone (times shown below will adjust)
              </Label>
              <Select
                value={timezone}
                onValueChange={(value) => {
                  if (value) {
                    setTimezone(value);
                    form.resetField("date");
                    form.resetField("time");
                    setAvailableTimeSlots([]);
                  }
                }}
                name="timezone-select" // Name for the select element itself
              >
                <SelectTrigger id="timezone-select" className="w-full">
                  <SelectValue placeholder="Select your timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date and Time Selection Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Select Date</FormLabel>
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date: Date) => {
                        // Only disable dates before today
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        // Check if this date is before today
                        const isPastDate = date < today;
                        
                        // If it's today or in the future, check if there are any available slots
                        if (!isPastDate && availableTimeSlots.length > 0) {
                          // Check if we have any availability data for this date
                          const dateStr = date.toISOString().split('T')[0];
                          const hasAvailability = availableTimeSlots.some((slot: string) => {
                            try {
                              const slotDate = new Date(slot).toISOString().split('T')[0];
                              return slotDate === dateStr;
                            } catch (error) {
                              console.error('Error parsing slot date:', slot, error);
                              return false;
                            }
                          });
                          
                          // If no availability for this date, disable it
                          if (!hasAvailability) {
                            return true;
                          }
                        }
                        
                        return isPastDate;
                      }}
                      initialFocus
                      className="rounded-md border"
                      modifiersClassNames={{
                        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                        today: "bg-accent text-accent-foreground"
                      }}
                      classNames={{
                        months: "flex flex-col space-y-4",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: cn(
                          buttonVariants({ variant: "outline" }),
                          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                        ),
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
                        day_range_end: "day-range-end",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent text-accent-foreground",
                        day_outside: "text-muted-foreground opacity-50",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                      }}
                    />
                    <FormMessage className="mt-2" />
                  </FormItem>
                )}
              />
              {selectedDate && (
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Time ({timezone})</FormLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                        {isLoading && !availableTimeSlots.length ? (
                           Array.from({ length: 6 }).map((_, i) => (
                            <Button key={i} variant="outline" disabled className="h-9 w-full animate-pulse bg-gray-200"></Button>
                          ))
                        ) : formattedTimeSlots.length > 0 ? (
                          formattedTimeSlots.map(({ value: timeSlot, label }) => (
                            <Button
                              key={timeSlot}
                              type="button"
                              variant={field.value === timeSlot ? "powder" : "outline"}
                              onClick={() => field.onChange(timeSlot)}
                              className="text-sm"
                            >
                              {label}
                            </Button>
                          ))
                        ) : (
                          <p className="col-span-full text-sm text-gray-500">No available slots for this date.</p>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Birth Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 border-t pt-6">Birth Information (for your reading)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="placeOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Place of Birth</FormLabel>
                      <FormControl>
                        <Input placeholder="City, State, Country" {...field} />
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

            {/* Promo Code Section */}
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

            {/* Focus Area Section */}
            <FormField
              control={form.control}
              name="focusArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What would you like to focus on?</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      maxLength={1000}
                      placeholder="Let me know if you have a specific question or area of life you'd like to focus on during your reading (optional)."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Server Error Message */}
            {form.formState.errors.root?.serverError && (
              <p className="text-sm font-medium text-destructive">
                {(form.formState.errors.root.serverError as any).message}
              </p>
            )}

            {/* Submit Button */}
            <Button type="submit" variant="desert" className="w-full" disabled={isLoading || (selectedDate && formattedTimeSlots.length === 0 && !isLoading)}>
              {isLoading ? "Processing..." : "Proceed to Payment"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  ) : (
    null // Or a loading indicator if preferred when step is not 'details' and clientSecret is not yet available
  );
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
        // Create booking record after successful payment confirmation
        // The webhook will also attempt to create/update, this is a fallback or quick update
        try {
          const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...bookingData,
              payment_intent_id: paymentIntentId, // Ensure this is the actual PI ID from server
              status: 'confirmed' // Set status to confirmed
            }),
          });
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error("Error creating booking record client-side:", errorData.error || 'Unknown error');
            // Don't block UI for this, webhook is primary
          }
        } catch (bookingError) {
          console.error("Exception creating booking record client-side:", bookingError);
        }
      }
    } catch (err) {
      console.error("Payment error:", err)
      setErrorMessage("Failed to process payment. Please try again.")
    } finally {
      setIsLoading(false);
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
        variant="desert" 
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
