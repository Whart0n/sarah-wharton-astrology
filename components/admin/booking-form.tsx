"use client";

import { useState } from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface BookingFormProps {
  onSuccess?: () => void;
}

export function BookingForm({ onSuccess }: BookingFormProps) {
  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    service_id: "",
    start_time: "",
    end_time: "",
    birthplace: "",
    birthdate: "",
    birthtime: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create booking");
      }
      setSuccess(true);
      if (onSuccess) onSuccess();
      setForm({
        client_name: "",
        client_email: "",
        service_id: "",
        start_time: "",
        end_time: "",
        birthplace: "",
        birthdate: "",
        birthtime: "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium">Name</label>
        <input
          type="text"
          name="client_name"
          value={form.client_name}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block font-medium">Email</label>
        <input
          type="email"
          name="client_email"
          value={form.client_email}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block font-medium">Service ID</label>
        <input
          type="text"
          name="service_id"
          value={form.service_id}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block font-medium">Start Time</label>
        <input
          type="datetime-local"
          name="start_time"
          value={form.start_time}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block font-medium">End Time</label>
        <input
          type="datetime-local"
          name="end_time"
          value={form.end_time}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block font-medium">Birthplace (optional)</label>
        <input
          type="text"
          name="birthplace"
          value={form.birthplace}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block font-medium">Birthdate (optional)</label>
        <input
          type="date"
          name="birthdate"
          value={form.birthdate}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block font-medium">Birthtime (optional)</label>
        <input
          type="time"
          name="birthtime"
          value={form.birthtime}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">Booking created successfully!</div>}
      <DialogFooter>
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Add Booking"}</Button>
      </DialogFooter>
    </form>
  );
}
