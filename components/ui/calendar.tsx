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
    <div className="calendar-container w-full h-full flex flex-col">
      <style jsx global>{`
        .calendar-container .rdp {
          margin: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .calendar-container .rdp-months {
          flex: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        .calendar-container .rdp-month {
          flex: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        .calendar-container .rdp-caption {
          margin-bottom: 1rem;
        }
        .calendar-container .rdp-table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          flex: 1;
        }
        .calendar-container .rdp-head_cell {
          text-align: center;
          font-weight: 500;
          padding: 0.5rem 0;
          font-size: 0.875rem;
          color: #6b7280;
        }
        .calendar-container .rdp-cell {
          text-align: center;
          padding: 0.25rem;
          height: 2.5rem;
        }
        .calendar-container .rdp-button {
          width: 100%;
          height: 100%;
          max-width: 2.5rem;
          max-height: 2.5rem;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.375rem;
          transition: all 0.15s ease;
        }
        .calendar-container .rdp-button:hover:not([disabled]) {
          background-color: #f3f4f6;
        }
        .calendar-container .rdp-day_selected, 
        .calendar-container .rdp-day_selected:hover {
          background-color: #0f4c81;
          color: white;
        }
      `}</style>
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        classNames={{
          months: "space-y-4",
          month: "",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          // day_selected styling is now handled by global JSX style
          ...classNames,
        }}
        {...props}
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
