"use client";
import { useEffect, useState } from "react";
import DatePicker from 'react-multi-date-picker';
import TimePicker from 'react-multi-date-picker/plugins/time_picker';
import "react-multi-date-picker/styles/colors/teal.css";

export default function AdminCalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  // Debug: log events whenever they change
  useEffect(() => {
    if (events.length > 0) {
      console.log('Admin events:', events);
    }
  }, [events]);

  // Fetch events from the backend
  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError("");
      try {
        const now = new Date();
        const monthFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const res = await fetch(`/api/calendar/availability?start=${now.toISOString()}&end=${monthFromNow.toISOString()}`);
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

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalSummary, setModalSummary] = useState("Available");
  const [selectedDates, setSelectedDates] = useState<any[]>([]); // Multi-date picker values
  const [timeBlocks, setTimeBlocks] = useState<{ start: string, end: string }[]>([ { start: '', end: '' } ]);
  const [modalError, setModalError] = useState("");

  // Add multiple slots (events) via modal
  async function submitSlot() {
    setModalError("");
    if (!modalSummary || selectedDates.length === 0 || timeBlocks.some(tb => !tb.start || !tb.end)) {
      setModalError("Please select dates and fill in all time blocks.");
      return;
    }
    // Prepare all slots
    const slots = [];
    for (const date of selectedDates) {
      for (const block of timeBlocks) {
        const start = new Date(date);
        const [startHour, startMinute] = block.start.split(":").map(Number);
        start.setHours(startHour, startMinute, 0, 0);
        const end = new Date(date);
        const [endHour, endMinute] = block.end.split(":").map(Number);
        end.setHours(endHour, endMinute, 0, 0);
        if (end <= start) {
          setModalError("End time must be after start time for all blocks.");
          return;
        }
        slots.push({ summary: modalSummary, start: start.toISOString(), end: end.toISOString() });
      }
    }
    try {
      const res = await fetch("/api/calendar/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });
      if (!res.ok) throw new Error("Booking failed");
      setShowModal(false);
      setSelectedDates([]);
      setTimeBlocks([{ start: '', end: '' }]);
      setRefresh(r => r + 1);
    } catch {
      setModalError("Failed to add slots");
    }
  }

  // Remove a slot (event)
  async function removeSlot(eventId: string) {
    // TODO: Implement delete endpoint and call it here
    alert("Delete functionality coming soon.");
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Manage Calendar Availability</h1>
      <button className="bg-blue-600 text-white px-4 py-2 rounded mb-4" onClick={() => setShowModal(true)}>
        Add Slot
      </button>
      {/* Modal for adding slot */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg relative">
            <h2 className="text-lg font-bold mb-2">Add Available Slots (Batch)</h2>
            <label className="block mb-2">
              Title:
              <input
                type="text"
                className="border rounded px-2 py-1 w-full mt-1"
                value={modalSummary}
                onChange={e => setModalSummary(e.target.value)}
              />
            </label>
            <label className="block mb-2">
              Dates:
              <DatePicker
                multiple
                value={selectedDates}
                onChange={setSelectedDates}
                format="YYYY-MM-DD"
                className="border rounded px-2 py-1 w-full mt-1 teal"
                placeholder="Select one or more dates"
              />
            </label>
            <div className="mb-2">
              <span className="block font-semibold mb-1">Time Blocks (applied to all dates):</span>
              {timeBlocks.map((block, idx) => (
                <div key={idx} className="flex gap-2 items-center mb-1">
                  <input
                    type="time"
                    className="border rounded px-2 py-1"
                    value={block.start}
                    onChange={e => {
                      const copy = [...timeBlocks];
                      copy[idx].start = e.target.value;
                      setTimeBlocks(copy);
                    }}
                  />
                  <span>-</span>
                  <input
                    type="time"
                    className="border rounded px-2 py-1"
                    value={block.end}
                    onChange={e => {
                      const copy = [...timeBlocks];
                      copy[idx].end = e.target.value;
                      setTimeBlocks(copy);
                    }}
                  />
                  {timeBlocks.length > 1 && (
                    <button
                      className="text-red-500 ml-2"
                      onClick={() => setTimeBlocks(timeBlocks.filter((_, i) => i !== idx))}
                    >Remove</button>
                  )}
                </div>
              ))}
              <button
                className="text-blue-600 underline text-sm mt-1"
                onClick={() => setTimeBlocks([...timeBlocks, { start: '', end: '' }])}
              >+ Add another block</button>
            </div>
            {/* Summary Table */}
            {selectedDates.length > 0 && timeBlocks.every(tb => tb.start && tb.end) && (
              <div className="mb-2">
                <span className="block font-semibold mb-1">Slots to be created:</span>
                <table className="w-full border text-xs">
                  <thead>
                    <tr>
                      <th className="border px-1 py-0.5">Date</th>
                      <th className="border px-1 py-0.5">Start</th>
                      <th className="border px-1 py-0.5">End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDates.map(date => (
                      timeBlocks.map((block, idx) => (
                        <tr key={date + idx}>
                          <td className="border px-1 py-0.5">{date.toString()}</td>
                          <td className="border px-1 py-0.5">{block.start}</td>
                          <td className="border px-1 py-0.5">{block.end}</td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {modalError && <div className="text-red-600 mb-2">{modalError}</div>}
            <div className="flex gap-2 mt-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={submitSlot}
              >
                Save All
              </button>
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Title</th>
              <th className="border px-2 py-1">Start</th>
              <th className="border px-2 py-1">End</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event: any) => {
              let startDisplay = '';
              let endDisplay = '';
              if (event.start) {
                try {
                  startDisplay = new Date(event.start).toLocaleString();
                } catch {}
              }
              if (event.end) {
                try {
                  endDisplay = new Date(event.end).toLocaleString();
                } catch {}
              }
              // If both are empty, show raw event
              if (!startDisplay && !endDisplay) {
                startDisplay = JSON.stringify(event);
              }
              return (
                <tr key={event.id}>
                  <td className="border px-2 py-1">{event.summary}</td>
                  <td className="border px-2 py-1">{startDisplay}</td>
                  <td className="border px-2 py-1">{endDisplay}</td>
                  <td className="border px-2 py-1">
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => removeSlot(event.id)}
                    >
                      Delete
                    </button>
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
