"use client";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AdminCalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

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
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [modalStart, setModalStart] = useState<Date | null>(null);
  const [modalEnd, setModalEnd] = useState<Date | null>(null);
  const [modalError, setModalError] = useState("");

  // Add a new slot (event) via modal
  async function submitSlot() {
    setModalError("");
    if (!modalSummary || !modalDate || !modalStart || !modalEnd) {
      setModalError("All fields are required.");
      return;
    }
    // Combine date with start/end times
    const start = new Date(modalDate);
    start.setHours(modalStart.getHours(), modalStart.getMinutes(), 0, 0);
    const end = new Date(modalDate);
    end.setHours(modalEnd.getHours(), modalEnd.getMinutes(), 0, 0);
    if (end <= start) {
      setModalError("End time must be after start time.");
      return;
    }
    // Both start and end are always ISO strings with time (not just date)
    // Backend uses these as dateTime for Google Calendar events
    try {
      const res = await fetch("/api/calendar/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: modalSummary, start: start.toISOString(), end: end.toISOString() }),
      });
      if (!res.ok) throw new Error("Booking failed");
      setShowModal(false);
      setModalDate(null);
      setModalStart(null);
      setModalEnd(null);
      setRefresh(r => r + 1);
    } catch {
      setModalError("Failed to add slot");
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
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md relative">
            <h2 className="text-lg font-bold mb-2">Add Available Slot</h2>
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
              Date:
              <DatePicker
                selected={modalDate}
                onChange={date => setModalDate(date)}
                dateFormat="yyyy-MM-dd"
                className="border rounded px-2 py-1 w-full mt-1"
                placeholderText="Select date"
                calendarStartDay={0}
              />
            </label>
            <label className="block mb-2">
              Start Time:
              <DatePicker
                selected={modalStart}
                onChange={date => setModalStart(date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Start Time"
                dateFormat="HH:mm"
                className="border rounded px-2 py-1 w-full mt-1"
                placeholderText="Select start time"
              />
            </label>
            <label className="block mb-2">
              End Time:
              <DatePicker
                selected={modalEnd}
                onChange={date => setModalEnd(date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="End Time"
                dateFormat="HH:mm"
                className="border rounded px-2 py-1 w-full mt-1"
                placeholderText="Select end time"
              />
            </label>
            {modalError && <div className="text-red-600 mb-2">{modalError}</div>}
            <div className="flex gap-2 mt-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={submitSlot}
              >
                Save
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
            {console.log('Admin events:', events)}
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
