

export const metadata = {
  title: "Sarah Wharton Astrology | Under Construction",
  description: "Website is currently under construction. To book a reading, email sarah@sarahwharton.com",
};

import DevPassword from "./components/DevPassword";

export default function HomePage() {
  return (
    <>
      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#f5f6f0", color: "#2d1b3b", fontFamily: "serif" }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 700, marginBottom: 18, textAlign: "center" }}>
          Website is currently under construction
        </h1>
        <p style={{ fontSize: "1.2rem", marginBottom: 16, textAlign: "center", maxWidth: 340 }}>
          To book a reading, please send an email to
          <br />
          <a href="mailto:sarah@sarahwharton.com" style={{ color: "#7c3aed", fontWeight: 600, textDecoration: "underline" }}>
            sarah@sarahwharton.com
          </a>
        </p>
      </main>
      <DevPassword />
    </>
  );
}
