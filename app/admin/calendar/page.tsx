"use client";
import { useEffect, useState } from "react";
import { format as formatDateFn } from "date-fns"; // Renamed to avoid conflict with Calendar's format prop
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminCalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSummary, setModalSummary] = useState("Available");
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>(undefined);
  const [timeBlocks, setTimeBlocks] = useState<{ start: string; end: string }[]>([{ start: "", end: "" }]);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    if (events.length > 0) {
      console.log('Admin events:', events);
    }
  }, [events]);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError("");
      try {
        const now = new Date();
        const monthFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const res = await fetch(
          `/api/calendar/availability?start=${now.toISOString()}&end=${monthFromNow.toISOString()}`
        );
        const data = await res.json();
        setEvents(data.events || []);
      } catch (err) {
        setError("Failed to fetch events");
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [refresh]);

  async function submitSlot() {
    setModalError("");
    if (!modalSummary || !selectedDates || selectedDates.length === 0 || timeBlocks.some((tb) => !tb.start || !tb.end)) {
      setModalError("Please select dates and fill in all time blocks.");
      return;
    }

    const slotsToCreate = [];
    for (const date of selectedDates) {
      for (const block of timeBlocks) {
        const slotDate = new Date(date); // Use a new Date object for each slot to avoid mutation issues
        const [startHour, startMinute] = block.start.split(":").map(Number);
        slotDate.setHours(startHour, startMinute, 0, 0);
        const startTime = new Date(slotDate);

        const [endHour, endMinute] = block.end.split(":").map(Number);
        slotDate.setHours(endHour, endMinute, 0, 0);
        const endTime = new Date(slotDate);

        if (endTime <= startTime) {
          setModalError("End time must be after start time for all blocks.");
          return;
        }
        slotsToCreate.push({ summary: modalSummary, start: startTime.toISOString(), end: endTime.toISOString() });
      }
    }

    try {
      const res = await fetch("/api/calendar/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: slotsToCreate }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Booking failed");
      }
      setIsModalOpen(false);
      setSelectedDates(undefined);
      setTimeBlocks([{ start: "", end: "" }]);
      setModalSummary("Available");
      setRefresh((r) => r + 1);
    } catch (err: any) {
      setModalError(err.message || "Failed to add slots");
    }
  }

  async function removeSlot(eventId: string) {
    alert("Delete functionality coming soon.");
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Manage Calendar Availability</h1>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button>Add Slot</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add Available Slots (Batch)</DialogTitle>
            <DialogDescription>
              Select one or more dates, then define time blocks that will apply to all selected dates.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={modalSummary}
                onChange={(e) => setModalSummary(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Dates
              </Label>
              <div className="col-span-3">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={setSelectedDates}
                  className="rounded-md border"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Time Blocks
              </Label>
              <div className="col-span-3 space-y-2">
                {timeBlocks.map((block, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={block.start}
                      onChange={(e) => {
                        const newBlocks = [...timeBlocks];
                        newBlocks[idx].start = e.target.value;
                        setTimeBlocks(newBlocks);
                      }}
                      className="w-full"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={block.end}
                      onChange={(e) => {
                        const newBlocks = [...timeBlocks];
                        newBlocks[idx].end = e.target.value;
                        setTimeBlocks(newBlocks);
                      }}
                      className="w-full"
                    />
                    {timeBlocks.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTimeBlocks(timeBlocks.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTimeBlocks([...timeBlocks, { start: "", end: "" }])}
                >
                  + Add another time block
                </Button>
              </div>
            </div>
            {selectedDates && selectedDates.length > 0 && timeBlocks.every(tb => tb.start && tb.end) && (
              <div className="mt-2 p-2 border rounded-md bg-slate-50 max-h-40 overflow-y-auto">
                <h4 className="text-sm font-medium mb-1">Slots to be created:</h4>
                <ul className="text-xs space-y-0.5">
                  {selectedDates.map(date => (
                    timeBlocks.map((block, idx) => (
                      <li key={`${formatDateFn(date, "yyyy-MM-dd")}-${idx}`}>
                        {formatDateFn(date, "EEE, MMM d, yyyy")} @ {block.start} - {block.end}
                      </li>
                    ))
                  ))}
                </ul>
              </div>
            )}
            {modalError && <p className="text-sm text-red-600">{modalError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={submitSlot}>Save All Slots</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <table className="w-full border-collapse border border-slate-400">
          <thead className="bg-slate-100">
            <tr>
              <th className="border border-slate-300 px-2 py-1 text-left">Title</th>
              <th className="border border-slate-300 px-2 py-1 text-left">Start</th>
              <th className="border border-slate-300 px-2 py-1 text-left">End</th>
              <th className="border border-slate-300 px-2 py-1 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event: any) => {
              let startDisplay = '';
              let endDisplay = '';
              try {
                startDisplay = event.start?.dateTime ? formatDateFn(new Date(event.start.dateTime), "Pp") : (event.start?.date ? formatDateFn(new Date(event.start.date), "P") : 'N/A');
                endDisplay = event.end?.dateTime ? formatDateFn(new Date(event.end.dateTime), "Pp") : (event.end?.date ? formatDateFn(new Date(event.end.date), "P") : 'N/A');
              } catch (e) {
                console.error("Error formatting date:", e);
                startDisplay = JSON.stringify(event.start);
                endDisplay = JSON.stringify(event.end);
              }
              return (
                <tr key={event.id} className="hover:bg-slate-50">
                  <td className="border border-slate-300 px-2 py-1">{event.summary}</td>
                  <td className="border border-slate-300 px-2 py-1">{startDisplay}</td>
                  <td className="border border-slate-300 px-2 py-1">{endDisplay}</td>
                  <td className="border border-slate-300 px-2 py-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeSlot(event.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
