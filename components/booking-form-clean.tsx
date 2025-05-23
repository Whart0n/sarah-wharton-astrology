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
    price_cents: (initialService as any).price_cents || 0 // Type assertion for backward compatibility
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
  
// ... rest of the component code ...

// Add this at the end of the file
export default BookingForm;
