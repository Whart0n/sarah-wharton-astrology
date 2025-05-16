"use client";
import DevPassword from "../components/DevPassword";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [devAuth, setDevAuth] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("devAuth") === "true") {
      setDevAuth(true);
    }
  }, []);

  const router = useRouter();
  useEffect(() => {
    if (devAuth) {
      router.replace("/");
    }
  }, [devAuth, router]);

  if (devAuth) {
    // Show nothing while redirecting
    return null;
  }

  // Under construction message + password box
  return (
    <>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8f8f8' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: 16 }}>Sarah Wharton Astrology</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: 32 }}>This site is under construction.<br />For bookings, email <a href="mailto:sarah@sarahwhartonastrology.com">sarah@sarahwhartonastrology.com</a></p>
        <a href="/login" style={{ color: '#0070f3', textDecoration: 'underline' }}>Admin Login</a>
      </div>
      <DevPassword />
    </>
  );
}
