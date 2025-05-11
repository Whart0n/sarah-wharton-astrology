import React, { useEffect, useState } from 'react';

export default function ConfirmationPage() {
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
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/check-booking-status?session_id=${sessionId}`);
        const data = await res.json();
        if (data.status === 'confirmed' || data.status === 'paid') {
          setStatus('success');
          clearInterval(interval);
        } else if (data.status === 'payment_failed') {
          setStatus('failure');
          clearInterval(interval);
        } else if (tries >= 5) {
          setStatus('failure');
          clearInterval(interval);
        } else {
          setTries(t => t + 1);
        }
      } catch {
        setStatus('failure');
        clearInterval(interval);
      }
    };
    interval = setInterval(checkStatus, 2000);
    checkStatus(); // Initial call
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tries]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-tea px-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-hunter font-sora">
          {status === 'success'
            ? 'Booking Confirmed!'
            : status === 'failure'
            ? 'Payment Failed'
            : 'Processing Payment...'}
        </h1>
        {status === 'processing' && (
          <p className="text-lg text-caramel font-manrope mb-2">
            We’re confirming your payment. Please wait...
          </p>
        )}
        {status === 'success' && (
          <p className="text-lg text-hunter font-manrope mb-2">
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
        <a href="/" className="inline-block mt-8 px-6 py-2 rounded bg-hunter text-white font-manrope hover:bg-darkpurple transition">
          Return Home
        </a>
      </div>
    </div>
  );
}
