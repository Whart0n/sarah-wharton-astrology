export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8f8f8' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 16 }}>Sarah Wharton Astrology</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: 32 }}>This site is under construction.<br />For bookings, email <a href="mailto:sarah@sarahwhartonastrology.com">sarah@sarahwhartonastrology.com</a></p>
      <a href="/login" style={{ color: '#0070f3', textDecoration: 'underline' }}>Admin Login</a>
    </div>
  );
}
