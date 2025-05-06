"use client";
import { useEffect, useState } from "react";

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
        const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const res = await fetch(`/api/calendar/availability?start=${now.toISOString()}&end=${weekFromNow.toISOString()}`);
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

  // Add a new slot (event)
  async function addSlot() {
    const summary = prompt("Enter a title for the slot (e.g., Available)");
    const start = prompt("Enter start time (YYYY-MM-DDTHH:MM:SS)");
    const end = prompt("Enter end time (YYYY-MM-DDTHH:MM:SS)");
    if (!summary || !start || !end) return;
    try {
      const res = await fetch("/api/calendar/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, start, end }),
      });
      if (!res.ok) throw new Error("Booking failed");
      setRefresh(r => r + 1);
    } catch {
      alert("Failed to add slot");
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
      <button className="bg-blue-600 text-white px-4 py-2 rounded mb-4" onClick={addSlot}>
        Add Slot
      </button>
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
            {events.map((event: any) => (
              <tr key={event.id}>
                <td className="border px-2 py-1">{event.summary}</td>
                <td className="border px-2 py-1">{event.start?.dateTime || event.start?.date}</td>
                <td className="border px-2 py-1">{event.end?.dateTime || event.end?.date}</td>
                <td className="border px-2 py-1">
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => removeSlot(event.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
