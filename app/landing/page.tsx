"use client";
import DevPassword from "../components/DevPassword";

import { useEffect, useState } from "react";

export default function LandingPage() {
  const [devAuth, setDevAuth] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("devAuth") === "true") {
      setDevAuth(true);
    }
  }, []);

  if (devAuth) {
    // Main site content placeholder (replace with your real homepage content as needed)
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f5f6f0', color: '#2d1b3b', fontFamily: 'serif' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: 18, textAlign: 'center' }}>
          Welcome to Sarah Wharton Astrology!
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: 16, textAlign: 'center', maxWidth: 340 }}>
          The full site is now visible because you entered the correct password.<br />
          (Replace this placeholder with your real homepage content.)
        </p>
      </div>
    );
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
