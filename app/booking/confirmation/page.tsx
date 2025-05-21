"use client";
import React, { useEffect, useState } from 'react';

export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const [status, setStatus] = useState<'processing' | 'success' | 'failure'>('processing');
  const [tries, setTries] = useState(0);
  const [isFree, setIsFree] = useState(false);

  useEffect(() => {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (!searchParams) return;
    const free = searchParams.get('free') === 'true';
    setIsFree(free);
    if (free) {
      setStatus('success');
      return;
    }
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('failure');
      return;
    }

    let interval: NodeJS.Timeout;
    let tries = 0;
    const maxTries = 30; // Try 30 times (60 seconds) * 12 = 60 seconds total

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/check-booking-status?session_id=${searchParams.get('session_id')}`);
        const data = await res.json();
        console.log('Fetched booking status:', data.status, 'Try:', tries + 1);

        if (data.status === 'confirmed') {
          setStatus('success');
          clearInterval(interval);
        } else if (data.status === 'error' || data.status === 'payment_failed') {
          setStatus('failure');
          clearInterval(interval);
        } else if (data.status === 'pending' && tries >= maxTries) {
          console.log('Timeout reached waiting for booking confirmation');
          setStatus('failure');
          clearInterval(interval);
        } else {
          tries++;
        }
      } catch (err) {
        console.error('Error fetching booking status:', err);
        setStatus('failure');
        clearInterval(interval);
      }
    };

    if (!searchParams.get('session_id')) {
      console.error('No session_id found in URL');
      setStatus('failure');
      return;
    }

    // Check status immediately
    checkStatus();

    // Then check every 5 seconds
    interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [searchParams]);

  useEffect(() => {
    console.log('Confirmation page status state changed:', status);
  }, [status]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-wheat-50 px-4">
      <div className="max-w-lg w-full bg-desert-sand-50 rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-rose-quartz-400 font-sora">
          {status === 'success'
            ? 'Booking Confirmed!'
            : status === 'failure'
            ? 'Payment Failed'
            : 'Processing Payment...'}
        </h1>
        {status === 'processing' && (
          <p className="text-lg text-cool-gray-400 font-manrope mb-2">
            We’re confirming your payment. Please wait...
          </p>
        )}
        {status === 'success' && (
          <p className="text-lg text-rose-quartz-400 font-manrope mb-2">
            {isFree
              ? 'Your free booking has been confirmed. No payment was required.'
              : 'Thank you for your payment! Your booking is confirmed.'}
          </p>
        )}
        {status === 'failure' && (
          <p className="text-lg text-red-600 font-manrope mb-2">
            We could not confirm your payment. Please contact support if you were charged.
          </p>
        )}
        <a href="/" className="inline-block mt-8 px-6 py-2 rounded bg-powder-blue-500 text-white font-manrope hover:bg-powder-blue-600 transition">
          Return Home
        </a>
      </div>
    </div>
  );
}
