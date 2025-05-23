"use client"

import * as React from "react"
import { DayPicker as BaseDayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// Using default icons from react-day-picker v9

// Define the Calendar props
type CalendarProps = React.ComponentProps<typeof BaseDayPicker> & {
  className?: string;
  classNames?: Record<string, string>;
};

function Calendar({
  className,
  classNames = {},
  ...props
}: CalendarProps) {
  return (
    <div className="w-full">
      <BaseDayPicker
        className={cn("p-3 w-full", className)}
        classNames={{
          // Layout
          root: "w-full",
          months: "w-full m-0 space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center",
          month: "space-y-4 w-full max-w-[280px] sm:max-w-none",
          
          // Caption
          caption: "flex justify-center pt-1 relative items-center mb-4",
          caption_label: "text-sm font-medium",
          
          // Navigation
          nav: "flex items-center gap-1",
          nav_button: cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          
          // Table
          table: "w-full border-collapse space-y-1",
          head_row: "flex w-full justify-between",
          head_cell: "text-muted-foreground rounded-md w-8 h-8 font-normal text-xs sm:text-sm flex items-center justify-center",
          row: "flex w-full mt-2 justify-between",
          
          // Cells
          cell: "h-8 w-8 text-center text-xs sm:text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-8 w-8 p-0 font-normal text-xs sm:text-sm aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground"
          ),
          
          // Day states
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground font-medium",
          day_outside: "text-muted-foreground opacity-50",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          
          // Custom class names
          ...classNames,
        }}
        // For react-day-picker v9, we'll use the default icons and style them with CSS
        {...props}
      />
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
