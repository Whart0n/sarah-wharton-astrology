import React from 'react';
import { useSearchParams } from 'next/navigation';

export default function ConfirmationPage() {
  // For app directory, useSearchParams is the recommended way
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  // SSR fallback
  let isFree = false;
  if (typeof window === 'undefined' && typeof globalThis !== 'undefined') {
    // On server, Next.js provides search params differently, but for now just fallback
    isFree = false;
  } else if (searchParams) {
    isFree = searchParams.get('free') === 'true';
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-tea px-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-hunter font-sora">Booking Confirmed!</h1>
        {isFree ? (
          <p className="text-lg text-caramel font-manrope mb-2">Your free booking has been confirmed. No payment was required.</p>
        ) : (
          <p className="text-lg text-hunter font-manrope mb-2">Thank you for your payment! Your booking is confirmed.</p>
        )}
        <p className="text-md text-gray-700 mt-4">You will receive a confirmation email shortly with all the details.</p>
        <a href="/" className="inline-block mt-8 px-6 py-2 rounded bg-hunter text-white font-manrope hover:bg-darkpurple transition">Return Home</a>
      </div>
    </div>
  );
}
