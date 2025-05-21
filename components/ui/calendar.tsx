"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 w-full", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
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
        head_row: "grid grid-cols-7",
        head_cell: "text-cool-gray-400 rounded-md w-14 h-14 font-normal text-base flex items-center justify-center",
        row: "grid grid-cols-7 w-full mt-2",
        cell: "h-14 w-14 text-center text-base p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-powder-blue-200/50 [&:has([aria-selected])]:bg-powder-blue-200 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-14 w-14 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-powder-blue-500 text-white hover:bg-powder-blue-600 hover:text-white focus:bg-powder-blue-600 focus:text-white",
        day_today: "bg-rose-quartz-200 text-rose-quartz-700",
        day_outside:
          "day-outside text-cool-gray-300 opacity-50 aria-selected:bg-powder-blue-100/50 aria-selected:text-cool-gray-400 aria-selected:opacity-30",
        day_disabled: "text-cool-gray-300 opacity-50",
        day_range_middle:
          "aria-selected:bg-powder-blue-200 aria-selected:text-powder-blue-700",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        // Removed custom navigation icons to use default ones
        // This avoids TypeScript errors with react-day-picker component types
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
