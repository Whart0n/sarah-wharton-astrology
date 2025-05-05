import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format price from cents to dollars with $ symbol
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

// Format duration in minutes to a readable format
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMinutes} minutes`;
}

// Format date to readable string
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Format time to readable string
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

// Get date range for the week
export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

// Generate time slots from start and end time
export function generateTimeSlots(
  startTime: Date,
  endTime: Date,
  durationMinutes: number
): Date[] {
  const slots: Date[] = [];
  const current = new Date(startTime);
  
  while (current < endTime) {
    slots.push(new Date(current));
    current.setMinutes(current.getMinutes() + durationMinutes);
  }
  
  return slots;
}

// Check if a time slot is available
export function isTimeSlotAvailable(
  slot: Date,
  durationMinutes: number,
  bookedSlots: { start: Date; end: Date }[]
): boolean {
  const slotEnd = new Date(slot);
  slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);
  
  return !bookedSlots.some(
    (booked) => (
      (slot >= booked.start && slot < booked.end) ||
      (slotEnd > booked.start && slotEnd <= booked.end) ||
      (slot <= booked.start && slotEnd >= booked.end)
    )
  );
}
